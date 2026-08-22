const $=id=>document.getElementById(id);
const encoder=new TextEncoder();
const VERIFY_TIMEOUT_MS=30000;
const SEND_TIMEOUT_MS=25000;
let shareToken='',publicKey=null,turnstileWidget=null,turnstileCdata='',turnstileReady=false,submitBusy=false,pendingVerification=null,retryEnvelope=null;

function tokenFromLocation(){const part=location.pathname.match(/^\/request\/([A-Za-z0-9_-]{43,86})\/?$/);return part?.[1]||new URLSearchParams(location.search).get('token')||'';}
function b64url(bytes){let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function status(message,kind=''){const node=$('requestStatus');node.textContent=message;node.className=`request-status ${kind}`.trim();}
function waitForTurnstile(){return new Promise((resolve,reject)=>{const started=Date.now();const timer=setInterval(()=>{if(globalThis.turnstile?.render){clearInterval(timer);resolve();}else if(Date.now()-started>12000){clearInterval(timer);reject(new Error('Security check could not load. Refresh the page.'));}},100);});}
async function tokenBinding(token){const digest=await crypto.subtle.digest('SHA-256',encoder.encode(token));return [...new Uint8Array(digest)].map(byte=>byte.toString(16).padStart(2,'0')).join('').slice(0,32);}
function setSendReady(ready){turnstileReady=Boolean(ready);const button=$('sendRequestButton');button.disabled=!turnstileReady||submitBusy;button.textContent=submitBusy?'Securing request…':'Verify, Encrypt & Send';}
function settleVerification(error,token=''){
  if(!pendingVerification)return;
  const pending=pendingVerification;pendingVerification=null;clearTimeout(pending.timer);
  if(error)pending.reject(error);else pending.resolve(token);
}
function resetTurnstile(){
  settleVerification(new Error('Security verification restarted. Please send again.'));
  try{if(turnstileWidget!==null)turnstile.reset(turnstileWidget);}catch{}
}
function requestFreshVerification(){
  if(!turnstileReady||turnstileWidget===null)return Promise.reject(new Error('Security check is not ready. Refresh the page and try again.'));
  if(pendingVerification)return Promise.reject(new Error('Security verification is already running.'));
  return new Promise((resolve,reject)=>{
    const timer=setTimeout(()=>{pendingVerification=null;try{turnstile.reset(turnstileWidget);}catch{}reject(new Error('Security verification took too long. Check your connection and try again.'));},VERIFY_TIMEOUT_MS);
    pendingVerification={resolve,reject,timer};
    try{turnstile.execute(turnstileWidget);}catch{pendingVerification=null;clearTimeout(timer);reject(new Error('Security check could not start. Refresh and try again.'));}
  });
}

async function encryptPayload(payload){
  const rsa=await crypto.subtle.importKey('jwk',publicKey,{name:'RSA-OAEP',hash:'SHA-256'},false,['wrapKey']);
  const aes=await crypto.subtle.generateKey({name:'AES-GCM',length:256},true,['encrypt']);
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const plaintext=encoder.encode(JSON.stringify(payload));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:encoder.encode('ASCEND-EXTERNAL-REQUEST-V1'),tagLength:128},aes,plaintext);
  const wrappedKey=await crypto.subtle.wrapKey('raw',aes,rsa,{name:'RSA-OAEP'});
  return{version:1,algorithm:'RSA-OAEP-256+A256GCM',iv:b64url(iv),ciphertext:b64url(new Uint8Array(ciphertext)),wrappedKey:b64url(new Uint8Array(wrappedKey))};
}

async function init(){
  shareToken=tokenFromLocation();
  if(!crypto?.subtle||!globalThis.isSecureContext)return status('This encrypted form needs the secure HTTPS link.','error');
  if(!/^[A-Za-z0-9_-]{43,86}$/.test(shareToken))return status('This private request link is invalid or expired.','error');
  try{
    const response=await fetch(`/api/public-request/config?token=${encodeURIComponent(shareToken)}`,{cache:'no-store'});
    const data=await response.json();if(!response.ok)throw new Error(data.error||'This private request link is unavailable.');
    publicKey=data.publicKey;
    turnstileCdata=await tokenBinding(shareToken);
    await waitForTurnstile();
    turnstileWidget=turnstile.render('#requestTurnstile',{
      sitekey:data.turnstileSiteKey,theme:'dark',size:'flexible',action:'external_request',cData:turnstileCdata,
      execution:'execute',appearance:'interaction-only',retry:'auto','refresh-expired':'auto','refresh-timeout':'auto',
      callback:token=>settleVerification(null,token),
      'expired-callback':()=>settleVerification(new Error('Security verification expired. Send again to run a fresh check.')),
      'timeout-callback':()=>settleVerification(new Error('Security verification timed out. Send again to retry.')),
      'error-callback':()=>{settleVerification(new Error('Security check failed. Check your connection and try again.'));return true;}
    });
    $('externalRequestForm').hidden=false;setSendReady(true);status('Ready. A fresh security check will run when you send.');
  }catch(error){setSendReady(false);status(error.message||'This private request link is unavailable.','error');}
}

$('externalRequestForm').addEventListener('submit',async event=>{
  event.preventDefault();if(submitBusy)return;
  const senderName=$('senderName').value.trim(),subject=$('requestSubject').value.trim(),details=$('requestDetails').value.trim();
  if(senderName.length<2||subject.length<3||details.length<5)return status('Add your name, a clear subject, and enough detail.','error');
  submitBusy=true;setSendReady(true);status('Running a fresh security check…');
  try{
    const turnstileToken=await requestFreshVerification();
    status('Security confirmed. Encrypting your request…');
    const envelope=retryEnvelope||await encryptPayload({version:1,type:$('requestType').value,senderName,senderContact:$('senderContact').value.trim(),subject,requestedFor:$('requestedFor').value||null,durationMinutes:Math.max(5,Math.min(1440,Number($('requestDuration').value)||30)),details,submittedLocale:navigator.language||'unknown'});
    retryEnvelope=envelope;
    status('Sending the encrypted request…');
    const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),SEND_TIMEOUT_MS);
    let response;
    try{response=await fetch('/api/public-request/submit',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({token:shareToken,envelope,turnstileToken,website:$('requestWebsite').value})});}
    finally{clearTimeout(timeout);}
    const data=await response.json().catch(()=>({}));
    if(!response.ok&&response.status!==409){const error=new Error(data.error||'Request could not be sent.');error.code=String(data.code||'');throw error;}
    retryEnvelope=null;$('externalRequestForm').reset();$('externalRequestForm').hidden=true;status('Request sent securely. The recipient can now review it in ASCEND.','success');
  }catch(error){
    const message=error?.name==='AbortError'?'Confirmation timed out. Press Send again to safely retry the same encrypted request.':(error.message||'Request could not be sent.');
    status(message,'error');resetTurnstile();
  }finally{submitBusy=false;if(!$('externalRequestForm').hidden)setSendReady(true);}
});

init();
