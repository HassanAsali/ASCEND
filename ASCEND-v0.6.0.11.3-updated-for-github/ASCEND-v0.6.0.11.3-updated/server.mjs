import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, 'public');
const PACKAGE = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json'), 'utf8'));
const SYSTEM_VERSION = String(PACKAGE.version || '0.0.0');

await loadDotEnv(path.join(__dirname, '.env.local'));
await loadDotEnv(path.join(__dirname, '.env'));

const PORT = Number(process.env.PORT || 3000);
const RAW_GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const GEMINI_API_KEY = sanitizeApiKey(RAW_GEMINI_API_KEY);
const GEMINI_KEY_SANITIZED = Boolean(RAW_GEMINI_API_KEY) && GEMINI_API_KEY !== RAW_GEMINI_API_KEY;
const GEMINI_FAST_MODEL = process.env.GEMINI_FAST_MODEL || 'gemini-3.5-flash-lite';
const GEMINI_DEEP_MODEL = process.env.GEMINI_DEEP_MODEL || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const GEMINI_MODEL = GEMINI_FAST_MODEL;
const SUPABASE_URL = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
const SUPABASE_PUBLISHABLE_KEY = sanitizeApiKey(process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || '');
const CLOUD_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY);
const TURNSTILE_SITE_KEY = sanitizeApiKey(process.env.TURNSTILE_SITE_KEY || process.env.VITE_TURNSTILE_SITE_KEY || '');
const TURNSTILE_CONFIGURED = Boolean(TURNSTILE_SITE_KEY);
const TURNSTILE_SECRET_KEY = sanitizeApiKey(process.env.TURNSTILE_SECRET_KEY || '');
const SUPABASE_ADMIN_SECRET = sanitizeApiKey(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '');
const ACCOUNT_DELETE_CONFIGURED = Boolean(CLOUD_CONFIGURED && SUPABASE_ADMIN_SECRET);
const FEEDBACK_CONFIGURED = Boolean(CLOUD_CONFIGURED && SUPABASE_ADMIN_SECRET);
const EXTERNAL_REQUESTS_CONFIGURED = Boolean(CLOUD_CONFIGURED && SUPABASE_ADMIN_SECRET && TURNSTILE_CONFIGURED && TURNSTILE_SECRET_KEY);
const SOCIAL_CONFIGURED = Boolean(CLOUD_CONFIGURED && SUPABASE_ADMIN_SECRET);
const classificationCache = new Map();

const MAX_JSON_BYTES = 256_000;
const API_RATE_WINDOW_MS = 60_000;
const API_RATE_MAX = Number(process.env.API_RATE_LIMIT_PER_MINUTE || 45);
const apiRateBuckets = new Map();
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-DNS-Prefetch-Control': 'off',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(), payment=(), usb=(), browsing-topics=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Origin-Agent-Cluster': '?1',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': "default-src 'self'; base-uri 'none'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://challenges.cloudflare.com; manifest-src 'self'; worker-src 'self' blob:; upgrade-insecure-requests"
};
function setSecurityHeaders(res) { for (const [k,v] of Object.entries(SECURITY_HEADERS)) res.setHeader(k,v); }
function clientKey(req) { return String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim().slice(0,128); }
function allowApiRequest(req) {
  const now=Date.now(), key=clientKey(req), old=apiRateBuckets.get(key);
  const bucket=!old || now-old.start>=API_RATE_WINDOW_MS ? {start:now,count:0} : old;
  bucket.count++; apiRateBuckets.set(key,bucket);
  if (apiRateBuckets.size>5000) for (const [k,v] of apiRateBuckets) if (now-v.start>API_RATE_WINDOW_MS*2) apiRateBuckets.delete(k);
  return { ok: bucket.count<=API_RATE_MAX, retryAfter: Math.max(1,Math.ceil((bucket.start+API_RATE_WINDOW_MS-now)/1000)), remaining: Math.max(0,API_RATE_MAX-bucket.count) };
}
function sameOriginRequest(req) {
  const origin=String(req.headers.origin||'');
  if (!origin) return true; // non-browser clients still face rate limits; browser cross-origin requests are rejected.
  const proto=String(req.headers['x-forwarded-proto']||'http').split(',')[0].trim();
  const host=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim();
  try { const o=new URL(origin); return o.host===host && (o.protocol===`${proto}:` || host.startsWith('localhost')); } catch { return false; }
}
function safeFetchMetadata(req,method=String(req.method||'GET').toUpperCase()) {
  const site=String(req.headers['sec-fetch-site']||'');
  // Top-level address-bar navigations can legitimately report cross-site after
  // a redirect or browser restoration. Read-only requests cannot mutate state,
  // so Fetch Metadata is enforced only on unsafe methods.
  if(method==='GET'||method==='HEAD'||method==='OPTIONS')return true;
  return !site || site==='same-origin' || site==='none';
}
function adminHeaders(extra={}) {
  const headers={apikey:SUPABASE_ADMIN_SECRET,Accept:'application/json',...extra};
  if (!SUPABASE_ADMIN_SECRET.startsWith('sb_secret_')) headers.Authorization=`Bearer ${SUPABASE_ADMIN_SECRET}`;
  return headers;
}
async function verifiedRequestUser(req) {
  const auth=String(req.headers.authorization||'');
  const token=auth.startsWith('Bearer ')?auth.slice(7).trim():'';
  if(!token)return null;
  const response=await fetch(`${SUPABASE_URL}/auth/v1/user`,{headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`,Accept:'application/json'}});
  if(!response.ok)return null;
  const user=await response.json().catch(()=>null);
  return user?.id?user:null;
}
function validShareToken(value){return /^[A-Za-z0-9_-]{43,86}$/.test(String(value||''));}
function shareTokenHash(value){return createHash('sha256').update(String(value||''),'utf8').digest('hex');}
function validUuid(value){return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value||''));}
function cleanCircleText(value,max=80){return String(value||'').trim().replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').slice(0,max);}
export function canonicalFriendPair(first,second){return [String(first||''),String(second||'')].sort();}
export function friendActionAllowed({status='',requestedBy='',currentUser='',action=''}){
  const incoming=String(requestedBy)!==String(currentUser);
  if(action==='accept'||action==='decline')return status==='pending'&&incoming;
  if(action==='cancel')return status==='pending'&&!incoming;
  if(action==='remove')return status==='accepted';
  if(action==='block')return status!=='blocked'&&['pending','accepted','declined','removed'].includes(status);
  return false;
}
function circleStorageFailure(detail={}){
  const code=String(detail?.code||''),message=String(detail?.message||'');
  if(code==='42P01'||code==='PGRST205'||/focus_circle|schema cache|does not exist/i.test(message)){
    return {status:503,body:{error:'Focus Circle tables are missing. The ASCEND owner must run SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql once in Supabase.',code:'CIRCLE_SCHEMA_MISSING'}};
  }
  return {status:502,body:{error:'Focus Circle storage could not be reached.',code:'CIRCLE_STORAGE_ERROR'}};
}
function friendStorageFailure(detail={}){
  const code=String(detail?.code||''),message=String(detail?.message||'');
  if(code==='42P01'||code==='PGRST205'||/friend_profiles|friendships|friend_plans|schema cache|does not exist/i.test(message)){
    return {status:503,body:{error:'Friends storage is not ready. The ASCEND owner must run SUPABASE-FRIENDS-v0.6.0.11.3.sql once in Supabase.',code:'FRIENDS_SCHEMA_MISSING'}};
  }
  return {status:502,body:{error:'Friends storage could not be reached.',code:'FRIENDS_STORAGE_ERROR'}};
}
async function friendRelationship(userId,relationshipId){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/friendships?id=eq.${encodeURIComponent(relationshipId)}&or=(user_low.eq.${encodeURIComponent(userId)},user_high.eq.${encodeURIComponent(userId)})&select=id,user_low,user_high,requested_by,status,blocked_by&limit=1`,{headers:adminHeaders()});
  if(!response.ok)return null;
  return (await response.json().catch(()=>[]))?.[0]||null;
}
async function circleMembership(userId,circleId){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?user_id=eq.${encodeURIComponent(userId)}&circle_id=eq.${encodeURIComponent(circleId)}&select=role&limit=1`,{headers:adminHeaders()});
  if(!response.ok)return null;
  return (await response.json().catch(()=>[]))?.[0]||null;
}
async function circleRecord(circleId){
  const response=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?id=eq.${encodeURIComponent(circleId)}&select=id,owner_user_id,status,finished_at&limit=1`,{headers:adminHeaders()});
  if(!response.ok)return null;
  return (await response.json().catch(()=>[]))?.[0]||null;
}
// Circle Contribution XP is server-computed from a shared item's duration —
// never trusted from the client — and is a completely separate value from
// account Total XP. It never touches state.totalXp, level, or rank.
const CIRCLE_ITEM_XP_PER_MINUTE=0.5;
const CIRCLE_ITEM_XP_MAX=60;
const CIRCLE_DAILY_XP_CAP=150;
export function circleItemXp(durationMinutes){
  const minutes=Math.max(5,Math.min(480,Number(durationMinutes)||0));
  return Math.max(1,Math.min(CIRCLE_ITEM_XP_MAX,Math.round(minutes*CIRCLE_ITEM_XP_PER_MINUTE)));
}
function validEncryptionPublicKey(key){
  return Boolean(key&&typeof key==='object'&&!Array.isArray(key)&&key.kty==='RSA'&&key.alg==='RSA-OAEP-256'&&key.ext===true&&typeof key.n==='string'&&key.n.length>=300&&typeof key.e==='string'&&key.e.length<=12);
}
function validRequestEnvelope(envelope){
  return Boolean(envelope&&typeof envelope==='object'&&!Array.isArray(envelope)&&envelope.version===1&&envelope.algorithm==='RSA-OAEP-256+A256GCM'&&/^[A-Za-z0-9_-]{16}$/.test(String(envelope.iv||''))&&/^[A-Za-z0-9_-]{40,24000}$/.test(String(envelope.ciphertext||''))&&/^[A-Za-z0-9_-]{300,1000}$/.test(String(envelope.wrappedKey||'')));
}
const TURNSTILE_ACTION='external_request';
const TURNSTILE_ERROR_CODES=new Set(['missing-input-secret','invalid-input-secret','missing-input-response','invalid-input-response','bad-request','timeout-or-duplicate','internal-error']);
function turnstileErrorCodes(result){
  const source=Array.isArray(result?.['error-codes'])?result['error-codes']:[];
  return [...new Set(source.map(code=>String(code||'').trim()).filter(code=>TURNSTILE_ERROR_CODES.has(code)))].slice(0,4);
}
export function evaluateTurnstileResult({responseOk=false,result={},expectedHost='',expectedAction=TURNSTILE_ACTION,expectedCdata=''}){
  const codes=turnstileErrorCodes(result);
  if(!responseOk)return{ok:false,reason:'siteverify-unavailable',codes};
  if(!result?.success){
    if(codes.includes('timeout-or-duplicate'))return{ok:false,reason:'token-expired-or-used',codes};
    if(codes.includes('invalid-input-secret')||codes.includes('missing-input-secret'))return{ok:false,reason:'server-key-rejected',codes};
    if(codes.includes('internal-error'))return{ok:false,reason:'siteverify-unavailable',codes};
    return{ok:false,reason:'token-rejected',codes};
  }
  const verifiedAction=String(result.action||'').trim();
  const verifiedCdata=String(result.cdata||'').trim();
  const verifiedHost=String(result.hostname||'').trim().toLowerCase();
  const wantedHost=String(expectedHost||'').trim().toLowerCase();
  if(verifiedAction!==expectedAction)return{ok:false,reason:'action-mismatch',codes};
  if(expectedCdata&&verifiedCdata!==expectedCdata)return{ok:false,reason:'binding-mismatch',codes};
  if(wantedHost&&verifiedHost!==wantedHost)return{ok:false,reason:'hostname-mismatch',codes};
  return{ok:true,reason:'verified',codes:[]};
}
async function verifyTurnstile(token,req,expectedCdata=''){
  if(!TURNSTILE_SECRET_KEY)return{ok:false,reason:'server-key-missing',codes:[]};
  if(!token)return{ok:false,reason:'token-missing',codes:[]};
  const body=new URLSearchParams({secret:TURNSTILE_SECRET_KEY,response:String(token).slice(0,2048),remoteip:clientKey(req)});
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    const response=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body,signal:controller.signal});
    const result=await response.json().catch(()=>({}));
    const expectedHost=String(req.headers['x-forwarded-host']||req.headers.host||'').split(',')[0].trim().split(':')[0].toLowerCase();
    return evaluateTurnstileResult({responseOk:response.ok,result,expectedHost,expectedCdata});
  }catch(error){
    console.warn('Turnstile Siteverify unavailable:',error?.name==='AbortError'?'timeout':'network');
    return{ok:false,reason:'siteverify-unavailable',codes:[]};
  }finally{clearTimeout(timer);}
}
export function turnstileFailureResponse(verification){
  const reason=String(verification?.reason||'token-rejected');
  if(reason==='token-expired-or-used')return{status:403,error:'Security check expired or was already used. Press Send to run a fresh check.',code:'TS_TOKEN_EXPIRED'};
  if(reason==='siteverify-unavailable')return{status:503,error:'Security verification is temporarily unavailable. Press Send to retry.',code:'TS_UNAVAILABLE'};
  if(reason==='server-key-missing'||reason==='server-key-rejected')return{status:503,error:'Security verification is misconfigured. The ASCEND owner must check the Turnstile Secret key.',code:'TS_SERVER_CONFIG'};
  if(reason==='hostname-mismatch')return{status:403,error:'Security verification rejected this website address. The ASCEND owner must check the Turnstile hostname.',code:'TS_HOSTNAME'};
  if(reason==='action-mismatch'||reason==='binding-mismatch')return{status:403,error:'Security verification did not match this request link. Reload the page and try again.',code:'TS_CONTEXT'};
  return{status:403,error:'Security verification was rejected. Reload the page and try again.',code:'TS_REJECTED'};
}

const CATEGORIES=["University", "Career", "Engineering", "Medicine & Healthcare", "Programming & Technology", "Business & Entrepreneurship", "Finance", "Fitness", "Sports", "Health & Wellness", "Nutrition", "Personal", "Discipline & Habits", "Productivity", "Mental Skills", "Reading & Knowledge", "English", "Creativity", "Art & Design", "Writing", "Research", "Social Life", "Family", "Relationships", "Communication", "Leadership", "Community & Volunteering", "Home", "Organization", "Travel & Experiences", "Hobbies", "Values & Spirituality", "Personal Projects", "Professional Projects"];
function allowedCategories(context={}){const selected=Array.isArray(context?.selectedCategories)?context.selectedCategories.map(x=>String(x||'').trim()).filter(Boolean).slice(0,40):[];return selected.length?[...new Set(selected)]:CATEGORIES;}

const ALL_STATS = [...CATEGORIES, 'Discipline'];

const mime = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json; charset=utf-8', '.svg': 'image/svg+xml; charset=utf-8',
  '.png': 'image/png', '.ico': 'image/x-icon'
};

export async function requestHandler(req, res) {
  try {
    setSecurityHeaders(res);
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith('/api/')) {
      res.setHeader('Cache-Control','no-store, max-age=0');
      if (!sameOriginRequest(req) || !safeFetchMetadata(req,req.method)) return json(res,403,{error:'Cross-origin API request blocked.'});
      const rate=allowApiRequest(req);
      res.setHeader('X-RateLimit-Limit',String(API_RATE_MAX)); res.setHeader('X-RateLimit-Remaining',String(rate.remaining));
      if (!rate.ok) { res.setHeader('Retry-After',String(rate.retryAfter)); return json(res,429,{error:'Too many requests. Try again shortly.'}); }
      if (req.method==='POST' && !String(req.headers['content-type']||'').toLowerCase().startsWith('application/json')) return json(res,415,{error:'Content-Type must be application/json.'});
    }

    if (req.method === 'POST' && url.pathname === '/api/classify') {
      const body = await readJson(req);
      const text = String(body?.text || '').trim();
      const context = sanitizeContext(body?.context || {});
      const forceLocal = Boolean(body?.forceLocal);
      const singleObjective = Boolean(body?.singleObjective);
      if (!text) return json(res, 400, { error: 'Quest text is required.' });
      const objectiveParts = splitBatchObjectives(text);
      if (!singleObjective && objectiveParts.length > 1) return json(res, 409, { error: 'Multiple objectives detected. Use batch analysis.', multiObjective: true, count: objectiveParts.length });

      if (!GEMINI_API_KEY || forceLocal) {
        const result = enrichLocalQuest(localClassify(text, context));
        if (singleObjective) result.suggestedSubquests = [];
        return json(res, 200, {
          mode: 'local+',
          result,
          note: 'Deep local classifier used. Connect Gemini for semantic classification.'
        });
      }

      try {
        const result = await classifyWithGemini(text, context, { singleObjective });
        if (singleObjective) result.suggestedSubquests = [];
        return json(res, 200, { mode: 'ai', result });
      } catch (error) {
        console.error('Gemini classification failed:', error);
        const result = enrichLocalQuest(localClassify(text, context));
        if (singleObjective) result.suggestedSubquests = [];
        return json(res, 200, {
          mode: 'local-fallback',
          result,
          note: 'Gemini was unavailable, so the local intelligence engine took over.'
        });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/classify-batch') {
      const body = await readJson(req);
      const context = sanitizeContext(body?.context || {});
      const forceLocal = Boolean(body?.forceLocal);
      const raw = String(body?.text || '').trim();
      const lines = splitBatchObjectives(raw).slice(0, 40);
      if (!lines.length) return json(res, 400, { error: 'Add one objective per line.' });
      if (!GEMINI_API_KEY || forceLocal) {
        const results=attachBatchSources(lines.map(text => enrichLocalQuest(localClassify(text, context))),lines);
        return json(res, 200, { mode:'local+', results, parallelism:0 });
      }
      try {
        const results = await classifyBatchWithGemini(lines, context);
        return json(res, 200, { mode: 'ai', results, apiCalls: 1, batchStrategy: 'single-call' });
      } catch (error) {
        console.error('Gemini batch failed:', error);
        return json(res, 200, {
          mode: 'local-fallback',
          results: attachBatchSources(lines.map(text => enrichLocalQuest(localClassify(text, context))),lines),
          apiCalls: 0,
          fallbackCount: lines.length,
          note: 'Gemini quota or availability prevented batch analysis; local intelligence handled the list.'
        });
      }
    }


    if (req.method === 'POST' && url.pathname === '/api/project-plan') {
      const body = await readJson(req);
      const text = String(body?.text || '').trim();
      const context = sanitizeContext(body?.context || {});
      const forceLocal = Boolean(body?.forceLocal);
      if (!text) return json(res, 400, { error: 'Project outcome is required.' });
      if (!GEMINI_API_KEY || forceLocal) return json(res, 200, { mode:'local+', result:localProjectPlan(text, context) });
      try { return json(res, 200, { mode:'ai', result:await projectPlanWithGemini(text, context) }); }
      catch (error) { console.error('Gemini project architecture failed:', error); return json(res,200,{mode:'local-fallback',result:localProjectPlan(text,context),note:'AI unavailable; a conservative local project map was created.'}); }
    }


    if (req.method === 'POST' && url.pathname === '/api/impact-audit') {
      const body = await readJson(req);
      const project = body?.project && typeof body.project === 'object' ? body.project : null;
      const quests = Array.isArray(body?.quests) ? body.quests.slice(0,30) : [];
      const evidence = String(body?.evidence || '').slice(0,4000).trim();
      if (!project || String(project.status||'') !== 'completed') return json(res,400,{error:'Only completed projects can be audited.'});
      if (!GEMINI_API_KEY) return json(res,200,{mode:'local+',result:{eligible:false,creditPercent:0,score:0,evidenceQuality:'Unverified',reason:'Semantic AI is unavailable. Exceptional impact credit is intentionally not awarded by the local fallback.'}});
      try { return json(res,200,{mode:'ai',result:await impactAuditWithGemini(project,quests,evidence)}); }
      catch(error){console.error('Impact audit failed:',error);return json(res,200,{mode:'local-fallback',result:{eligible:false,creditPercent:0,score:0,evidenceQuality:'Unverified',reason:'AI audit unavailable. No credit awarded.'}});}
    }

    if (req.method === 'POST' && url.pathname === '/api/directive') {
      const body = await readJson(req);
      const context = sanitizeContext(body?.context || {});
      const quests = sanitizeQuests(body?.quests || []);
      if (!quests.length) return json(res, 200, { mode: GEMINI_API_KEY ? 'ai' : 'local+', result: emptyDirective() });
      if (!GEMINI_API_KEY) return json(res, 200, { mode: 'local+', result: localDirective(quests, context) });
      try {
        return json(res, 200, { mode: 'ai', result: await directiveWithGemini(quests, context) });
      } catch (error) {
        console.error('Gemini directive failed:', error);
        return json(res, 200, { mode: 'local-fallback', result: localDirective(quests, context), note: 'Gemini failed; local prioritization used.' });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/review') {
      const body = await readJson(req);
      const context = sanitizeContext(body?.context || {});
      const quests = sanitizeQuests(body?.quests || []);
      const activity = sanitizeActivity(body?.activity || []);
      if (!GEMINI_API_KEY) return json(res, 200, { mode: 'local+', result: localReview(quests, activity, context) });
      try {
        return json(res, 200, { mode: 'ai', result: await reviewWithGemini(quests, activity, context) });
      } catch (error) {
        console.error('Gemini system review failed:', error);
        return json(res, 200, { mode: 'local-fallback', result: localReview(quests, activity, context), note: 'Gemini failed; local review used.' });
      }
    }

    if (req.method === 'POST' && url.pathname === '/api/ai/test') {
      if (!GEMINI_API_KEY) return json(res, 400, { ok: false, error: 'No Gemini API key is configured on the server.' });
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
          method: 'GET',
          headers: { 'x-goog-api-key': GEMINI_API_KEY }
        });
        if (!response.ok) return json(res, 502, { ok: false, error: `Gemini Models HTTP ${response.status}: ${await response.text()}` });
        const payload = await response.json();
        const available = new Set((payload.models || []).map(m => String(m.name || '').replace(/^models\//,'')));
        return json(res, 200, {
          ok: true,
          status: 'CONNECTED',
          testType: 'models-list',
          consumesGenerateQuota: false,
          fastModel: GEMINI_FAST_MODEL,
          fastModelAvailable: available.has(GEMINI_FAST_MODEL),
          deepModel: GEMINI_DEEP_MODEL,
          deepModelAvailable: available.has(GEMINI_DEEP_MODEL)
        });
      } catch (error) {
        return json(res, 502, { ok: false, error: String(error?.message || error) });
      }
    }

    if (req.method === 'GET' && url.pathname === '/system-version.js') {
      const body = `window.ASCEND_SYSTEM_VERSION = ${JSON.stringify(SYSTEM_VERSION)};`;
      res.writeHead(200, { 'Content-Type': 'text/javascript; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' });
      return res.end(body);
    }

    if (req.method === 'POST' && url.pathname === '/api/account/delete') {
      if (!ACCOUNT_DELETE_CONFIGURED) return json(res, 503, { error:'Account deletion is not configured on this server.' });
      const body = await readJson(req);
      if (String(body?.confirm || '') !== 'DELETE') return json(res, 400, { error:'Permanent deletion confirmation is missing.' });
      const authHeader = String(req.headers.authorization || '');
      const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!accessToken) return json(res, 401, { error:'A fresh authenticated session is required.' });

      // Verify the caller with the ordinary publishable key before any privileged action.
      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method:'GET',
        headers:{ apikey:SUPABASE_PUBLISHABLE_KEY, Authorization:`Bearer ${accessToken}`, Accept:'application/json' }
      });
      const verifiedUser = await userResponse.json().catch(()=>({}));
      if (!userResponse.ok || !verifiedUser?.id) return json(res, 401, { error:'Your session could not be verified. Sign in again and retry.' });
      const expectedEmail = String(body?.email || '').trim().toLowerCase();
      const verifiedEmail = String(verifiedUser.email || '').trim().toLowerCase();
      if (!expectedEmail || expectedEmail !== verifiedEmail) return json(res, 403, { error:'Account identity confirmation failed.' });

      const adminHeaders = { apikey:SUPABASE_ADMIN_SECRET, Accept:'application/json' };
      // Legacy service_role JWTs require Authorization. New sb_secret_* keys authenticate through apikey.
      if (!SUPABASE_ADMIN_SECRET.startsWith('sb_secret_')) adminHeaders.Authorization = `Bearer ${SUPABASE_ADMIN_SECRET}`;
      const deleteResponse = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${encodeURIComponent(verifiedUser.id)}`, {
        method:'DELETE', headers:adminHeaders
      });
      const deletePayload = await deleteResponse.json().catch(()=>({}));
      if (!deleteResponse.ok) {
        console.error('Account deletion failed:', deleteResponse.status, deletePayload?.message || deletePayload?.msg || deletePayload?.error || 'unknown');
        return json(res, deleteResponse.status >= 500 ? 502 : 400, { error:'Account deletion failed. Check the Supabase Auth logs or server admin-key configuration.' });
      }
      return json(res, 200, { ok:true, deleted:true });
    }

    if (req.method === 'POST' && url.pathname === '/api/feedback') {
      if (!FEEDBACK_CONFIGURED) return json(res, 503, { error:'Private Beta feedback is not configured on this server.' });
      const body = await readJson(req);
      const authHeader = String(req.headers.authorization || '');
      const accessToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';
      if (!accessToken) return json(res, 401, { error:'Sign in before sending Private Beta feedback.' });
      const message = String(body?.message || '').trim();
      const category = ['bug','ux','idea','other'].includes(String(body?.category || '')) ? String(body.category) : 'other';
      if (message.length < 8) return json(res, 400, { error:'Feedback needs a little more detail.' });
      if (message.length > 2000) return json(res, 400, { error:'Feedback is limited to 2,000 characters.' });

      const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        method:'GET', headers:{ apikey:SUPABASE_PUBLISHABLE_KEY, Authorization:`Bearer ${accessToken}`, Accept:'application/json' }
      });
      const verifiedUser = await userResponse.json().catch(()=>({}));
      if (!userResponse.ok || !verifiedUser?.id) return json(res, 401, { error:'Your session could not be verified. Sign in again and retry.' });

      const rawDiagnostics = body?.diagnostics && typeof body.diagnostics === 'object' && !Array.isArray(body.diagnostics) ? body.diagnostics : null;
      const diagnostics = rawDiagnostics ? {
        viewport:String(rawDiagnostics.viewport || '').slice(0,30), browser:String(rawDiagnostics.browser || '').slice(0,60),
        platform:String(rawDiagnostics.platform || '').slice(0,80), standalone:Boolean(rawDiagnostics.standalone), online:Boolean(rawDiagnostics.online)
      } : null;
      const record = {
        user_id:verifiedUser.id, tester_email:String(verifiedUser.email || '').slice(0,320), category, message,
        app_version:String(body?.appVersion || SYSTEM_VERSION).slice(0,40), page:String(body?.page || '').slice(0,40), diagnostics
      };
      const adminHeaders = { apikey:SUPABASE_ADMIN_SECRET, 'Content-Type':'application/json', Accept:'application/json', Prefer:'return=minimal' };
      if (!SUPABASE_ADMIN_SECRET.startsWith('sb_secret_')) adminHeaders.Authorization = `Bearer ${SUPABASE_ADMIN_SECRET}`;
      const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/beta_feedback`, { method:'POST', headers:adminHeaders, body:JSON.stringify(record) });
      if (!insertResponse.ok) {
        const detail = await insertResponse.text();
        console.error('Beta feedback insert failed:', insertResponse.status, detail.slice(0,240));
        return json(res, 502, { error:'Feedback storage is not ready. Ask the ASCEND owner to apply the beta_feedback SQL setup.' });
      }
      return json(res, 200, { ok:true, received:true });
    }

    // External Request Inbox. Public senders never receive a user id and never
    // write player-state. Request contents are encrypted in their browser for
    // the owner's vault before this server stores the envelope.
    if (req.method === 'POST' && url.pathname === '/api/external-inbox/setup') {
      if (!EXTERNAL_REQUESTS_CONFIGURED) return json(res,503,{error:'External Requests need the one-time secure server and database setup.'});
      const user=await verifiedRequestUser(req);
      if(!user)return json(res,401,{error:'Sign in before configuring a private request link.'});
      const body=await readJson(req),token=String(body?.token||''),publicKey=body?.publicKey;
      if(!validShareToken(token)||!validEncryptionPublicKey(publicKey))return json(res,400,{error:'Invalid request-link encryption configuration.'});
      const record={owner_user_id:user.id,token_hash:shareTokenHash(token),public_key:publicKey,enabled:body?.enabled!==false,updated_at:new Date().toISOString()};
      const response=await fetch(`${SUPABASE_URL}/rest/v1/external_inboxes?on_conflict=owner_user_id`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=representation'}),body:JSON.stringify(record)});
      if(!response.ok){console.error('External inbox setup failed:',response.status,(await response.text()).slice(0,200));return json(res,502,{error:'External Request storage is not ready. Apply the v0.6.0.0 Supabase SQL setup.'});}
      return json(res,200,{ok:true,enabled:record.enabled});
    }

    if (req.method === 'GET' && url.pathname === '/api/external-inbox') {
      if (!EXTERNAL_REQUESTS_CONFIGURED) return json(res,503,{error:'External Requests are not configured.'});
      const user=await verifiedRequestUser(req);
      if(!user)return json(res,401,{error:'Sign in to read External Requests.'});
      const inboxResponse=await fetch(`${SUPABASE_URL}/rest/v1/external_inboxes?owner_user_id=eq.${encodeURIComponent(user.id)}&select=id,enabled&limit=1`,{headers:adminHeaders()});
      const inboxes=await inboxResponse.json().catch(()=>[]),inbox=inboxes?.[0];
      if(!inboxResponse.ok)return json(res,502,{error:'External Request storage is unavailable.'});
      if(!inbox)return json(res,200,{ok:true,enabled:false,requests:[]});
      const rowsResponse=await fetch(`${SUPABASE_URL}/rest/v1/external_requests?inbox_id=eq.${encodeURIComponent(inbox.id)}&status=eq.pending&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,envelope,created_at&order=created_at.desc&limit=100`,{headers:adminHeaders()});
      const rows=await rowsResponse.json().catch(()=>[]);
      if(!rowsResponse.ok)return json(res,502,{error:'Could not load External Requests.'});
      return json(res,200,{ok:true,enabled:Boolean(inbox.enabled),requests:Array.isArray(rows)?rows:[]});
    }

    if (req.method === 'POST' && url.pathname === '/api/external-inbox/status') {
      if (!EXTERNAL_REQUESTS_CONFIGURED) return json(res,503,{error:'External Requests are not configured.'});
      const user=await verifiedRequestUser(req);
      if(!user)return json(res,401,{error:'Sign in to update External Requests.'});
      const body=await readJson(req),requestId=String(body?.requestId||''),status=String(body?.status||'');
      if(!/^[0-9a-f-]{36}$/i.test(requestId)||!['accepted','dismissed'].includes(status))return json(res,400,{error:'Invalid External Request update.'});
      const inboxResponse=await fetch(`${SUPABASE_URL}/rest/v1/external_inboxes?owner_user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=1`,{headers:adminHeaders()});
      const inbox=(await inboxResponse.json().catch(()=>[]))?.[0];
      if(!inbox)return json(res,404,{error:'Request inbox not found.'});
      const updateResponse=await fetch(`${SUPABASE_URL}/rest/v1/external_requests?id=eq.${encodeURIComponent(requestId)}&inbox_id=eq.${encodeURIComponent(inbox.id)}&status=eq.pending`,{method:'PATCH',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({status,reviewed_at:new Date().toISOString()})});
      const updated=await updateResponse.json().catch(()=>[]);
      if(!updateResponse.ok)return json(res,502,{error:'Could not update this External Request.'});
      if(!updated?.length)return json(res,404,{error:'Request is no longer pending.'});
      return json(res,200,{ok:true,status});
    }

    if (req.method === 'GET' && url.pathname === '/api/public-request/config') {
      if (!EXTERNAL_REQUESTS_CONFIGURED) return json(res,503,{error:'This private request link is not available.'});
      const token=String(url.searchParams.get('token')||'');
      if(!validShareToken(token))return json(res,404,{error:'This private request link is invalid or expired.'});
      const response=await fetch(`${SUPABASE_URL}/rest/v1/external_inboxes?token_hash=eq.${shareTokenHash(token)}&enabled=eq.true&select=public_key&limit=1`,{headers:adminHeaders()});
      const inbox=(await response.json().catch(()=>[]))?.[0];
      if(!response.ok||!inbox)return json(res,404,{error:'This private request link is invalid or expired.'});
      return json(res,200,{ok:true,publicKey:inbox.public_key,turnstileSiteKey:TURNSTILE_SITE_KEY});
    }

    if (req.method === 'POST' && url.pathname === '/api/public-request/submit') {
      if (!EXTERNAL_REQUESTS_CONFIGURED) return json(res,503,{error:'This private request link is not available.'});
      const body=await readJson(req),token=String(body?.token||'');
      if(String(body?.website||''))return json(res,200,{ok:true,received:true}); // honeypot
      if(!validShareToken(token)||!validRequestEnvelope(body?.envelope))return json(res,400,{error:'Invalid encrypted request.'});
      const tokenBinding=shareTokenHash(token).slice(0,32);
      const verification=await verifyTurnstile(body?.turnstileToken,req,tokenBinding);
      if(!verification.ok){
        const failure=turnstileFailureResponse(verification);
        console.warn('External request Turnstile rejected:',failure.code,verification.codes.join(',')||verification.reason);
        return json(res,failure.status,{error:failure.error,code:failure.code});
      }
      const inboxResponse=await fetch(`${SUPABASE_URL}/rest/v1/external_inboxes?token_hash=eq.${shareTokenHash(token)}&enabled=eq.true&select=id&limit=1`,{headers:adminHeaders()});
      const inbox=(await inboxResponse.json().catch(()=>[]))?.[0];
      if(!inboxResponse.ok||!inbox)return json(res,404,{error:'This private request link is invalid or expired.'});
      const ipHash=createHash('sha256').update(`${SUPABASE_ADMIN_SECRET}:${clientKey(req)}:${inbox.id}`).digest('hex');
      const envelopeHash=createHash('sha256').update(JSON.stringify(body.envelope),'utf8').digest('hex');
      const rpc=await fetch(`${SUPABASE_URL}/rest/v1/rpc/submit_external_request`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json'}),body:JSON.stringify({p_inbox_id:inbox.id,p_ip_hash:ipHash,p_envelope_hash:envelopeHash,p_envelope:body.envelope})});
      if(!rpc.ok){const detail=await rpc.text();console.warn('External request rejected:',rpc.status,detail.slice(0,160));if(/rate limit/i.test(detail))return json(res,429,{error:'Too many requests were sent. Try again later.'});if(/duplicate request/i.test(detail))return json(res,409,{error:'This encrypted request was already received.'});return json(res,502,{error:'The encrypted request could not be stored.'});}
      return json(res,200,{ok:true,received:true});
    }

    // Focus Circles expose only opt-in summary stats and shared schedule items.
    // Quest text, email, recovery material and encrypted player-state never enter these tables.
    if (url.pathname.startsWith('/api/circles')) {
      if(!SOCIAL_CONFIGURED)return json(res,503,{error:'Focus Circles are not configured on this server.'});
      const user=await verifiedRequestUser(req);
      if(!user)return json(res,401,{error:'Sign in to use Focus Circles.'});

      if(req.method==='GET'&&url.pathname==='/api/circles'){
        const membershipResponse=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?user_id=eq.${encodeURIComponent(user.id)}&select=circle_id,role&order=joined_at.asc&limit=12`,{headers:adminHeaders()});
        const mine=await membershipResponse.json().catch(()=>[]);
        if(!membershipResponse.ok){const failure=circleStorageFailure(mine);return json(res,failure.status,failure.body);}
        const ids=mine.map(row=>row.circle_id).filter(validUuid);
        if(!ids.length)return json(res,200,{ok:true,circles:[]});
        const inFilter=encodeURIComponent(`(${ids.join(',')})`);
        const [circleResponse,memberResponse,itemResponse,progressResponse]=await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/focus_circles?id=in.${inFilter}&enabled=eq.true&select=id,name,owner_user_id,created_at,status,finished_at`,{headers:adminHeaders()}),
          fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?circle_id=in.${inFilter}&select=circle_id,user_id,role,display_name,rank_stage,level,total_xp,seven_day_xp,active_days,stats_updated_at&order=seven_day_xp.desc&limit=240`,{headers:adminHeaders()}),
          fetch(`${SUPABASE_URL}/rest/v1/focus_circle_items?circle_id=in.${inFilter}&expires_at=gt.${encodeURIComponent(new Date().toISOString())}&select=id,circle_id,creator_user_id,title,kind,starts_at,duration_minutes,created_at&order=starts_at.asc&limit=240`,{headers:adminHeaders()}),
          fetch(`${SUPABASE_URL}/rest/v1/focus_circle_item_progress?circle_id=in.${inFilter}&select=circle_id,item_id,user_id,completed_at,xp_awarded&limit=1000`,{headers:adminHeaders()})
        ]);
        if(!circleResponse.ok||!memberResponse.ok||!itemResponse.ok||!progressResponse.ok)return json(res,502,{error:'Could not load Focus Circles.'});
        const circles=await circleResponse.json(),members=await memberResponse.json(),items=await itemResponse.json(),progress=await progressResponse.json();
        const myRoles=new Map(mine.map(row=>[row.circle_id,row.role]));
        // Circle Contribution XP is always a live sum of this member's own
        // completed-item rows in THIS circle — never a client-supplied number,
        // and never state.totalXp. Undoing a completion removes its row, so
        // Complete -> Undo -> Complete nets to exactly one item's worth of XP.
        const circleXpFor=(circleId,userId)=>progress.filter(row=>row.circle_id===circleId&&row.user_id===userId).reduce((sum,row)=>sum+Number(row.xp_awarded||0),0);
        return json(res,200,{ok:true,circles:circles.map(circle=>({
          id:circle.id,name:circle.name,role:myRoles.get(circle.id)||'member',createdAt:circle.created_at,
          status:circle.status||'active',archived:circle.status==='finished',finishedAt:circle.finished_at||null,
          members:members.filter(member=>member.circle_id===circle.id).map(member=>({displayName:member.display_name,rankStage:member.rank_stage,level:member.level,totalXp:member.total_xp,sevenDayXp:member.seven_day_xp,activeDays:member.active_days,circleXp:circleXpFor(circle.id,member.user_id),isMe:member.user_id===user.id,role:member.role})),
          items:items.filter(item=>item.circle_id===circle.id).map(item=>({id:item.id,title:item.title,kind:item.kind,startsAt:item.starts_at,durationMinutes:item.duration_minutes,isMine:item.creator_user_id===user.id,completedByMe:progress.some(row=>row.item_id===item.id&&row.user_id===user.id),completionCount:progress.filter(row=>row.item_id===item.id).length}))
        }))});
      }

      const body=await readJson(req);
      if(req.method==='POST'&&url.pathname==='/api/circles/create'){
        const name=cleanCircleText(body?.name,60),displayName=cleanCircleText(body?.displayName,50),inviteToken=String(body?.inviteToken||'');
        if(name.length<3||displayName.length<1||!validShareToken(inviteToken))return json(res,400,{error:'Circle name, display name, or invite code is invalid.'});
        const owned=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?owner_user_id=eq.${encodeURIComponent(user.id)}&select=id&limit=6`,{headers:adminHeaders()});
        if((await owned.json().catch(()=>[])).length>=5)return json(res,400,{error:'Private Beta limit: up to five circles per owner.'});
        const create=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({owner_user_id:user.id,name,invite_hash:shareTokenHash(inviteToken)})});
        const createdPayload=await create.json().catch(()=>[]),circle=Array.isArray(createdPayload)?createdPayload[0]:null;
        if(!create.ok||!circle?.id){const failure=circleStorageFailure(createdPayload);return json(res,failure.status,failure.body);}
        const member=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({circle_id:circle.id,user_id:user.id,role:'owner',display_name:displayName})});
        if(!member.ok){await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?id=eq.${circle.id}`,{method:'DELETE',headers:adminHeaders()});return json(res,502,{error:'Circle membership could not be created.'});}
        return json(res,200,{ok:true,circleId:circle.id});
      }

      if(req.method==='POST'&&url.pathname==='/api/circles/join'){
        const inviteToken=String(body?.inviteToken||''),displayName=cleanCircleText(body?.displayName,50);
        if(!validShareToken(inviteToken)||!displayName)return json(res,400,{error:'Invite code or display name is invalid.'});
        const found=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?invite_hash=eq.${shareTokenHash(inviteToken)}&enabled=eq.true&select=id&limit=1`,{headers:adminHeaders()});
        const circle=(await found.json().catch(()=>[]))?.[0];if(!circle)return json(res,404,{error:'This invite code is invalid or disabled.'});
        const countResponse=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?circle_id=eq.${circle.id}&select=user_id`,{headers:adminHeaders({'Prefer':'count=exact'})});
        const count=(await countResponse.json().catch(()=>[])).length;if(count>=30)return json(res,400,{error:'This circle reached the Private Beta member limit.'});
        const join=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?on_conflict=circle_id,user_id`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({circle_id:circle.id,user_id:user.id,role:'member',display_name:displayName})});
        if(!join.ok)return json(res,502,{error:'Could not join this circle.'});
        return json(res,200,{ok:true,circleId:circle.id});
      }

      if(req.method==='POST'&&url.pathname==='/api/circles/profile'){
        const circleId=String(body?.circleId||'');if(!validUuid(circleId)||!await circleMembership(user.id,circleId))return json(res,403,{error:'Circle membership not found.'});
        const record={display_name:cleanCircleText(body?.displayName,50)||'Player',rank_stage:cleanCircleText(body?.rankStage,8)||'E',level:Math.max(1,Math.min(999,Number(body?.level)||1)),total_xp:Math.max(0,Math.min(100000000,Number(body?.totalXp)||0)),seven_day_xp:Math.max(0,Math.min(10000000,Number(body?.sevenDayXp)||0)),active_days:Math.max(0,Math.min(100000,Number(body?.activeDays)||0)),stats_updated_at:new Date().toISOString()};
        const update=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?circle_id=eq.${circleId}&user_id=eq.${user.id}`,{method:'PATCH',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify(record)});
        return update.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not refresh circle stats.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/circles/item'){
        const circleId=String(body?.circleId||''),member=validUuid(circleId)&&await circleMembership(user.id,circleId);
        const circle=member&&await circleRecord(circleId);
        if(member&&circle?.status==='finished')return json(res,409,{error:'This circle is finished and archived. No new shared plans can be added.'});
        const title=cleanCircleText(body?.title,120),kind=['lecture','session','assignment'].includes(String(body?.kind||''))?String(body.kind):'session';
        const duration=Math.max(5,Math.min(480,Number(body?.durationMinutes)||60)),startsAt=new Date(body?.startsAt||Date.now());
        const now=Date.now(),startTime=startsAt.getTime();
        if(!member||title.length<2||!Number.isFinite(startTime)||startTime<now-86400000||startTime>now+730*86400000)return json(res,400,{error:'Shared plan details or date are invalid.'});
        const insert=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_items`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({circle_id:circleId,creator_user_id:user.id,title,kind,starts_at:startsAt.toISOString(),duration_minutes:duration,expires_at:new Date(startsAt.getTime()+120*86400000).toISOString()})});
        return insert.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not share this circle plan.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/circles/progress'){
        const itemId=String(body?.itemId||'');if(!validUuid(itemId))return json(res,400,{error:'Invalid shared plan.'});
        const itemResponse=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_items?id=eq.${itemId}&select=circle_id,duration_minutes&limit=1`,{headers:adminHeaders()});
        const item=(await itemResponse.json().catch(()=>[]))?.[0];if(!item||!await circleMembership(user.id,item.circle_id))return json(res,403,{error:'Shared plan is not in one of your circles.'});
        const circle=await circleRecord(item.circle_id);
        if(circle?.status==='finished')return json(res,409,{error:'This circle is finished and archived. Progress can no longer change.'});
        if(body?.completed===false){const remove=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_item_progress?item_id=eq.${itemId}&user_id=eq.${user.id}`,{method:'DELETE',headers:adminHeaders()});return remove.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not update progress.'});}
        // Circle Contribution XP is computed here, server-side, from the
        // item's real duration — the client never supplies an XP value.
        // A rolling-24h cap prevents farming via many quick completions.
        const dayAgo=new Date(Date.now()-86400000).toISOString();
        const todaySumResponse=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_item_progress?circle_id=eq.${item.circle_id}&user_id=eq.${user.id}&completed_at=gte.${encodeURIComponent(dayAgo)}&select=xp_awarded`,{headers:adminHeaders()});
        const todayRows=await todaySumResponse.json().catch(()=>[]);
        const todaySum=todayRows.reduce((sum,row)=>sum+Number(row.xp_awarded||0),0);
        const candidateXp=circleItemXp(item.duration_minutes);
        const awardedXp=Math.max(0,Math.min(candidateXp,CIRCLE_DAILY_XP_CAP-todaySum));
        const insert=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_item_progress?on_conflict=item_id,user_id`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({circle_id:item.circle_id,item_id:itemId,user_id:user.id,xp_awarded:awardedXp})});
        return insert.ok?json(res,200,{ok:true,circleXpAwarded:awardedXp}):json(res,502,{error:'Could not update progress.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/circles/manage'){
        const circleId=String(body?.circleId||''),action=String(body?.action||''),member=validUuid(circleId)&&await circleMembership(user.id,circleId);
        if(!member)return json(res,403,{error:'Circle membership not found.'});
        if(action==='delete'&&member.role==='owner'){const remove=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?id=eq.${circleId}&owner_user_id=eq.${user.id}`,{method:'DELETE',headers:adminHeaders()});return remove.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not delete circle.'});}
        if(action==='leave'&&member.role!=='owner'){const leave=await fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?circle_id=eq.${circleId}&user_id=eq.${user.id}`,{method:'DELETE',headers:adminHeaders()});return leave.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not leave circle.'});}
        if(action==='finish'){
          if(member.role!=='owner')return json(res,403,{error:'Only the circle owner can finish this circle.'});
          const circle=await circleRecord(circleId);
          if(circle?.status==='finished')return json(res,200,{ok:true,alreadyFinished:true});
          // Finishing never grants XP or a bonus of any kind — it only
          // freezes the circle and returns a read-only summary of what
          // already happened, from the same source-of-truth rows the
          // leaderboard uses.
          const [memberResponse,progressResponse]=await Promise.all([
            fetch(`${SUPABASE_URL}/rest/v1/focus_circle_members?circle_id=eq.${circleId}&select=user_id,display_name`,{headers:adminHeaders()}),
            fetch(`${SUPABASE_URL}/rest/v1/focus_circle_item_progress?circle_id=eq.${circleId}&select=user_id,xp_awarded`,{headers:adminHeaders()})
          ]);
          const memberRows=await memberResponse.json().catch(()=>[]);
          const progressRows=await progressResponse.json().catch(()=>[]);
          const finish=await fetch(`${SUPABASE_URL}/rest/v1/focus_circles?id=eq.${circleId}&owner_user_id=eq.${user.id}&status=eq.active`,{method:'PATCH',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({status:'finished',finished_at:new Date().toISOString()})});
          if(!finish.ok)return json(res,502,{error:'Could not finish this circle.'});
          const perMember=memberRows.map(m=>({displayName:m.display_name,circleXp:progressRows.filter(p=>p.user_id===m.user_id).reduce((sum,p)=>sum+Number(p.xp_awarded||0),0)}));
          return json(res,200,{ok:true,summary:{participants:memberRows.length,sessionsCompleted:progressRows.length,totalCircleXp:progressRows.reduce((sum,p)=>sum+Number(p.xp_awarded||0),0),members:perMember}});
        }
        return json(res,400,{error:member.role==='owner'?'Owners must delete their circle instead of leaving it.':'Invalid circle action.'});
      }
      return json(res,405,{error:'Method not allowed.'});
    }

    // Friends are private-token-only and server-mediated. No email lookup,
    // quest text, encrypted state or recovery data enters these tables or responses.
    // Rank stage and total XP are shared only when collaboration sharing is enabled.
    if(url.pathname.startsWith('/api/friends')){
      if(!SOCIAL_CONFIGURED)return json(res,503,{error:'Friends are not configured on this server.'});
      const user=await verifiedRequestUser(req);
      if(!user)return json(res,401,{error:'Sign in to use Friends.'});

      if(req.method==='GET'&&url.pathname==='/api/friends'){
        const relationResponse=await fetch(`${SUPABASE_URL}/rest/v1/friendships?or=(user_low.eq.${encodeURIComponent(user.id)},user_high.eq.${encodeURIComponent(user.id)})&select=id,user_low,user_high,requested_by,status,blocked_by,updated_at&order=updated_at.desc&limit=200`,{headers:adminHeaders()});
        const relations=await relationResponse.json().catch(()=>[]);
        if(!relationResponse.ok){const failure=friendStorageFailure(relations);return json(res,failure.status,failure.body);}
        const visibleRelations=relations.filter(row=>row.status==='pending'||row.status==='accepted');
        const otherIds=[...new Set(visibleRelations.map(row=>row.user_low===user.id?row.user_high:row.user_low).filter(validUuid))];
        const profileIds=[user.id,...otherIds],profileFilter=encodeURIComponent(`(${profileIds.join(',')})`);
        const profileResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_profiles?user_id=in.${profileFilter}&select=user_id,display_name,invite_enabled,share_collaboration,rank_stage,total_xp`,{headers:adminHeaders()});
        const profiles=await profileResponse.json().catch(()=>[]);
        if(!profileResponse.ok){const failure=friendStorageFailure(profiles);return json(res,failure.status,failure.body);}
        const acceptedIds=visibleRelations.filter(row=>row.status==='accepted').map(row=>row.id);
        let plans=[],progress=[];
        if(acceptedIds.length){
          const relationFilter=encodeURIComponent(`(${acceptedIds.join(',')})`);
          const planResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_plans?friendship_id=in.${relationFilter}&status=eq.active&select=id,friendship_id,creator_user_id,title,kind,starts_at,duration_minutes,created_at&order=created_at.desc&limit=300`,{headers:adminHeaders()});
          plans=await planResponse.json().catch(()=>[]);
          if(!planResponse.ok)return json(res,502,{error:'Could not load friend collaboration plans.'});
          if(plans.length){
            const planFilter=encodeURIComponent(`(${plans.map(plan=>plan.id).join(',')})`);
            const progressResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_plan_progress?plan_id=in.${planFilter}&select=plan_id,user_id,completed_at&limit=600`,{headers:adminHeaders()});
            progress=await progressResponse.json().catch(()=>[]);
            if(!progressResponse.ok)return json(res,502,{error:'Could not load friend collaboration progress.'});
          }
        }
        const profileMap=new Map(profiles.map(profile=>[profile.user_id,profile]));
        const completionCount=userId=>progress.filter(row=>row.user_id===userId).length;
        const responseRelations=visibleRelations.map(row=>{
          const otherId=row.user_low===user.id?row.user_high:row.user_low,profile=profileMap.get(otherId)||{};
          return {id:row.id,status:row.status,direction:row.requested_by===user.id?'outgoing':'incoming',blockedByMe:row.status==='blocked'&&row.blocked_by===user.id,
            friend:{displayName:profile.display_name||'ASCEND Player',shareCollaboration:profile.share_collaboration!==false,collaborationScore:profile.share_collaboration===false?null:completionCount(otherId),rankStage:profile.share_collaboration===false?null:String(profile.rank_stage||'E'),totalXp:profile.share_collaboration===false?null:Math.max(0,Number(profile.total_xp)||0)},myCollaborationScore:completionCount(user.id),
            plans:plans.filter(plan=>plan.friendship_id===row.id).map(plan=>({id:plan.id,title:plan.title,kind:plan.kind,startsAt:plan.starts_at,durationMinutes:plan.duration_minutes,isMine:plan.creator_user_id===user.id,completedByMe:progress.some(item=>item.plan_id===plan.id&&item.user_id===user.id),completedByFriend:progress.some(item=>item.plan_id===plan.id&&item.user_id===otherId)}))};
        });
        const me=profileMap.get(user.id)||{};
        const leaderboard=[{relationshipId:'me',displayName:me.display_name||'You',isMe:true,rankStage:me.rank_stage||'E',totalXp:Number(me.total_xp||0)},...responseRelations.filter(row=>row.status==='accepted'&&row.friend.shareCollaboration).map(row=>({relationshipId:row.id,displayName:row.friend.displayName,isMe:false,rankStage:row.friend.rankStage||'E',totalXp:Number(row.friend.totalXp||0)}))].sort((a,b)=>b.totalXp-a.totalXp);
        return json(res,200,{ok:true,profile:{displayName:me.display_name||'',inviteEnabled:Boolean(me.invite_enabled),shareCollaboration:me.share_collaboration!==false},relationships:responseRelations,leaderboard});
      }

      const body=await readJson(req);
      if(req.method==='POST'&&url.pathname==='/api/friends/profile'){
        const displayName=cleanCircleText(body?.displayName,50),inviteToken=String(body?.inviteToken||'');
        if(!displayName||!validShareToken(inviteToken))return json(res,400,{error:'Display name or private friend code is invalid.'});
        const record={user_id:user.id,display_name:displayName,invite_hash:shareTokenHash(inviteToken),invite_enabled:body?.inviteEnabled!==false,share_collaboration:body?.shareCollaboration!==false,rank_stage:/^[EDCBAS](?:-[IVX]+)?$/.test(String(body?.rankStage||'E'))?String(body.rankStage):'E',total_xp:Math.max(0,Math.min(1000000000,Math.floor(Number(body?.totalXp)||0))),updated_at:new Date().toISOString()};
        const response=await fetch(`${SUPABASE_URL}/rest/v1/friend_profiles?on_conflict=user_id`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(record)});
        if(!response.ok){const detail=await response.json().catch(()=>({}));const failure=friendStorageFailure(detail);return json(res,failure.status,failure.body);}
        return json(res,200,{ok:true});
      }

      if(req.method==='POST'&&url.pathname==='/api/friends/request'){
        const inviteToken=String(body?.inviteToken||'');
        if(!validShareToken(inviteToken))return json(res,400,{error:'Paste the full private friend code.'});
        const targetResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_profiles?invite_hash=eq.${shareTokenHash(inviteToken)}&invite_enabled=eq.true&select=user_id&limit=1`,{headers:adminHeaders()});
        const target=(await targetResponse.json().catch(()=>[]))?.[0];
        if(!target||target.user_id===user.id)return json(res,404,{error:'This private friend code is invalid or unavailable.'});
        const [userLow,userHigh]=canonicalFriendPair(user.id,target.user_id);
        const existingResponse=await fetch(`${SUPABASE_URL}/rest/v1/friendships?user_low=eq.${userLow}&user_high=eq.${userHigh}&select=id,status&limit=1`,{headers:adminHeaders()});
        const existing=(await existingResponse.json().catch(()=>[]))?.[0];
        if(existing?.status==='blocked')return json(res,404,{error:'This private friend code is invalid or unavailable.'});
        if(existing?.status==='accepted')return json(res,200,{ok:true,alreadyFriends:true});
        if(existing?.status==='pending')return json(res,200,{ok:true,alreadyPending:true});
        const activeFilter='status=in.(pending,accepted)';
        const [senderCountResponse,targetCountResponse]=await Promise.all([
          fetch(`${SUPABASE_URL}/rest/v1/friendships?${activeFilter}&or=(user_low.eq.${encodeURIComponent(user.id)},user_high.eq.${encodeURIComponent(user.id)})&select=id&limit=101`,{headers:adminHeaders()}),
          fetch(`${SUPABASE_URL}/rest/v1/friendships?${activeFilter}&or=(user_low.eq.${encodeURIComponent(target.user_id)},user_high.eq.${encodeURIComponent(target.user_id)})&select=id&limit=101`,{headers:adminHeaders()})
        ]);
        const senderCount=(await senderCountResponse.json().catch(()=>[])).length,targetCount=(await targetCountResponse.json().catch(()=>[])).length;
        if(senderCount>=100||targetCount>=100)return json(res,400,{error:'This private friend connection is unavailable.'});
        const record={user_low:userLow,user_high:userHigh,requested_by:user.id,status:'pending',blocked_by:null,updated_at:new Date().toISOString(),acted_at:null};
        const response=await fetch(`${SUPABASE_URL}/rest/v1/friendships?on_conflict=user_low,user_high`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=merge-duplicates,return=minimal'}),body:JSON.stringify(record)});
        return response.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not send this private friend request.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/friends/action'){
        const relationshipId=String(body?.relationshipId||''),action=String(body?.action||'');
        if(!validUuid(relationshipId)||!['accept','decline','cancel','remove','block'].includes(action))return json(res,400,{error:'Invalid friend action.'});
        const relationship=await friendRelationship(user.id,relationshipId);
        if(!relationship)return json(res,404,{error:'Friend relationship not found.'});
        if(!friendActionAllowed({status:relationship.status,requestedBy:relationship.requested_by,currentUser:user.id,action}))return json(res,409,{error:'This friend action is not allowed in the current state.'});
        const status={accept:'accepted',decline:'declined',cancel:'removed',remove:'removed',block:'blocked'}[action];
        const update=await fetch(`${SUPABASE_URL}/rest/v1/friendships?id=eq.${relationshipId}&status=eq.${relationship.status}`,{method:'PATCH',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({status,blocked_by:action==='block'?user.id:null,updated_at:new Date().toISOString(),acted_at:new Date().toISOString()})});
        return update.ok?json(res,200,{ok:true,status}):json(res,502,{error:'Could not update this friend request.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/friends/plan'){
        const relationshipId=String(body?.relationshipId||''),relationship=validUuid(relationshipId)&&await friendRelationship(user.id,relationshipId);
        const title=cleanCircleText(body?.title,120),kind=['task','study','meeting'].includes(String(body?.kind||''))?String(body.kind):'task',duration=Math.max(5,Math.min(480,Number(body?.durationMinutes)||30));
        const startsAt=body?.startsAt?new Date(body.startsAt):null;
        if(!relationship||relationship.status!=='accepted'||title.length<2||(startsAt&&!Number.isFinite(startsAt.getTime())))return json(res,400,{error:'Friend plan details are invalid or this friendship is not active.'});
        const countResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_plans?friendship_id=eq.${relationshipId}&status=eq.active&select=id&limit=201`,{headers:adminHeaders()});
        if((await countResponse.json().catch(()=>[])).length>=200)return json(res,400,{error:'Complete or cancel an existing shared plan before adding more.'});
        const response=await fetch(`${SUPABASE_URL}/rest/v1/friend_plans`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=minimal'}),body:JSON.stringify({friendship_id:relationshipId,creator_user_id:user.id,title,kind,starts_at:startsAt?startsAt.toISOString():null,duration_minutes:duration})});
        return response.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not add this friend plan.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/friends/progress'){
        const planId=String(body?.planId||'');if(!validUuid(planId))return json(res,400,{error:'Invalid friend plan.'});
        const planResponse=await fetch(`${SUPABASE_URL}/rest/v1/friend_plans?id=eq.${planId}&status=eq.active&select=id,friendship_id&limit=1`,{headers:adminHeaders()});
        const plan=(await planResponse.json().catch(()=>[]))?.[0],relationship=plan&&await friendRelationship(user.id,plan.friendship_id);
        if(!relationship||relationship.status!=='accepted')return json(res,403,{error:'This plan is not shared with an accepted friend.'});
        if(body?.completed===false){const remove=await fetch(`${SUPABASE_URL}/rest/v1/friend_plan_progress?plan_id=eq.${planId}&user_id=eq.${user.id}`,{method:'DELETE',headers:adminHeaders()});return remove.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not update friend progress.'});}
        const insert=await fetch(`${SUPABASE_URL}/rest/v1/friend_plan_progress?on_conflict=plan_id,user_id`,{method:'POST',headers:adminHeaders({'Content-Type':'application/json',Prefer:'resolution=ignore-duplicates,return=minimal'}),body:JSON.stringify({plan_id:planId,user_id:user.id})});
        return insert.ok?json(res,200,{ok:true}):json(res,502,{error:'Could not update friend progress.'});
      }

      if(req.method==='POST'&&url.pathname==='/api/friends/plan/cancel'){
        const planId=String(body?.planId||'');if(!validUuid(planId))return json(res,400,{error:'Invalid friend plan.'});
        const response=await fetch(`${SUPABASE_URL}/rest/v1/friend_plans?id=eq.${planId}&creator_user_id=eq.${user.id}&status=eq.active`,{method:'PATCH',headers:adminHeaders({'Content-Type':'application/json',Prefer:'return=representation'}),body:JSON.stringify({status:'cancelled',updated_at:new Date().toISOString()})});
        const changed=await response.json().catch(()=>[]);
        if(!response.ok)return json(res,502,{error:'Could not cancel this friend plan.'});
        return changed.length?json(res,200,{ok:true}):json(res,403,{error:'Only the plan creator can cancel it.'});
      }
      return json(res,405,{error:'Method not allowed.'});
    }

    if (req.method === 'GET' && url.pathname === '/api/config') {
      return json(res, 200, {
        version: SYSTEM_VERSION,
        cloudEnabled: CLOUD_CONFIGURED,
        supabaseUrl: CLOUD_CONFIGURED ? SUPABASE_URL : '',
        supabasePublishableKey: CLOUD_CONFIGURED ? SUPABASE_PUBLISHABLE_KEY : '',
        supabaseAnonKey: CLOUD_CONFIGURED ? SUPABASE_PUBLISHABLE_KEY : '',
        cloudMode: CLOUD_CONFIGURED ? 'supabase-rls' : 'local-only',
        turnstileEnabled: TURNSTILE_CONFIGURED,
        turnstileSiteKey: TURNSTILE_CONFIGURED ? TURNSTILE_SITE_KEY : '',
        accountDeletionEnabled: ACCOUNT_DELETE_CONFIGURED,
        feedbackEnabled: FEEDBACK_CONFIGURED,
        externalRequestsEnabled: EXTERNAL_REQUESTS_CONFIGURED,
        socialEnabled: SOCIAL_CONFIGURED,
        privacyStage: CLOUD_CONFIGURED ? 'RLS user isolation + browser-side AES-GCM encrypted state payloads' : 'local browser only'
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      return json(res, 200, {
        ok: true,
        version: SYSTEM_VERSION,
        aiConfigured: Boolean(GEMINI_API_KEY),
        model: GEMINI_FAST_MODEL,
        fastModel: GEMINI_FAST_MODEL,
        deepModel: GEMINI_DEEP_MODEL,
        classifier: GEMINI_API_KEY ? 'gemini-semantic' : 'deep-local',
        cloudConfigured: CLOUD_CONFIGURED,
        cloudProvider: CLOUD_CONFIGURED ? 'supabase' : null,
        turnstileConfigured: TURNSTILE_CONFIGURED,
        accountDeletionConfigured: ACCOUNT_DELETE_CONFIGURED,
        feedbackConfigured: FEEDBACK_CONFIGURED,
        externalRequestsConfigured: EXTERNAL_REQUESTS_CONFIGURED,
        socialConfigured: SOCIAL_CONFIGURED,
        features: ['account-first-entry', 'project-hierarchy', 'ai-project-architect', 'password-recovery', 'exceptional-impact-credit', 'multi-user-isolation', 'quest-classification', 'batch-intake', 'auto-batch-detection', 'single-analyze-control', 'date-intelligence', 'date-filtering', 'campaign-quests', 'single-call-batch', 'quota-aware-model-routing', 'non-generative-ai-test', 'progression-guide', 'batch-accept-all', 'batch-cancel-all', 'batch-review-persistence', 'quest-edit-xp-recalculation', 'progressive-milestone-order', 'private-beta-auth', 'cross-device-cloud-sync', 'client-side-encrypted-cloud-state', 'recovery-key-device-link', 'supabase-player-state-live', 'supabase-rls-ready', 'guided-onboarding', 'mobile-command-dock', 'mobile-dialog-hardening', 'pwa-install', 'daily-directive', 'system-review', 'local-fallback', 'api-key-sanitization', 'turnstile-auth-protection', 'friendly-auth-errors', 'self-service-account-deletion', 'strict-account-state-isolation', 'fresh-guest-profile', 'language-consistent-ai-output', 'expanded-guided-tour', 'compact-auth-layout', 'height-aware-responsive-layout', 'transferable-skill-system', 'quest-board-ai-jump', 'semantic-skill-allocation', 'realistic-dynamic-milestones', 'focus-area-recalibration', 'earned-progress-safe-projects', 'stale-shell-prevention', 'milestone-path-labels', 'locked-daily-recurrence', 'daily-undo-reversal', 'quest-type-lanes', 'private-beta-feedback', 'apple-pwa-install-guide', 'recovery-file-backup', 'net-xp-activity', 'reviewed-reward-consistency', 'feedback-service-role-grant', 'vault-first-new-device-unlock', 'locked-default-state-write-block', 'end-to-end-encrypted-external-requests', 'public-request-link', 'external-request-review-inbox', 'iphone-safe-area-shell', 'iphone-text-recovery-file', 'fresh-submit-turnstile', 'bounded-request-inbox-refresh', 'command-request-link-card', 'safe-readonly-api-navigation', 'turnstile-verification-diagnostics', 'turnstile-server-timeout', 'single-quest-external-ai-review', 'structured-planning-lists', 'semester-course-planner', 'class-schedule-conflict-detection', 'fixed-weekly-commitments', 'planner-to-quest-link', 'voice-quest-capture', 'review-discard-controls', 'private-focus-circles', 'circle-shared-schedule', 'opt-in-circle-leaderboard', 'missed-daily-date-catchup', 'xp-free-habit-tracker', 'scheduled-habit-streaks', 'habit-starter-pack', 'explicit-arabic-voice-input', 'habit-window-reminders', 'quest-due-notifications', 'full-habit-categories', 'responsive-request-card', 'focus-circle-setup-diagnostics', 'first-action-retired', 'remember-device-30-days', 'explicit-voice-language', 'per-item-reminders', 'notification-center', 'readable-habit-recurrence', 'project-workspace-management', 'standalone-quest-default', 'exact-notification-deep-links', 'rolling-interval-habit-checkins', 'session-restore-gate', 'narrow-desktop-layout-hardening', 'private-friend-invites', 'friend-request-lifecycle', 'friend-collaboration-plans', 'opt-in-friend-board', 'friend-xp-rank-isolation'],
        aiKeySanitized: GEMINI_KEY_SANITIZED
      });
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { error: 'Method not allowed.' });

    let requestPath = decodeURIComponent(url.pathname);
    if (requestPath.startsWith('/request/')) requestPath = '/request.html';
    if (requestPath === '/') requestPath = '/index.html';
    const candidate = path.normalize(path.join(publicDir, requestPath));
    if (!candidate.startsWith(publicDir)) return json(res, 403, { error: 'Forbidden.' });

    let filePath = candidate;
    try {
      const stat = await fs.stat(filePath);
      if (stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    } catch {
      filePath = path.join(publicDir, 'index.html');
    }

    const data = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': mime[ext] || 'application/octet-stream',
      'Cache-Control': ['.html','.js','.css','.webmanifest'].includes(ext) ? 'no-store, max-age=0, must-revalidate' : 'public, max-age=300'
    });
    if (req.method === 'HEAD') return res.end();
    res.end(data);
  } catch (error) {
    console.error(error);
    json(res, Number(error?.statusCode)||500, { error: Number(error?.statusCode)===413 ? 'Request too large.' : 'Internal server error.' });
  }
}

export default requestHandler;

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  const server = http.createServer(requestHandler);
  server.listen(PORT, '0.0.0.0', () => {
    console.log('\n============================================================');
    console.log(`       ASCEND // SYSTEM v${SYSTEM_VERSION} // ENCRYPTED BETA`);
    console.log('============================================================');
    console.log(`Local address: http://localhost:${PORT}`);
    console.log(`Quest intelligence: ${GEMINI_API_KEY ? `GEMINI AI (${GEMINI_FAST_MODEL}; deep ${GEMINI_DEEP_MODEL})` : 'DEEP LOCAL MODE'}`);
    console.log(`Cloud layer: ${CLOUD_CONFIGURED ? 'SUPABASE READY' : 'LOCAL ONLY (add Supabase env when ready)'}`);
    console.log(`Account deletion: ${ACCOUNT_DELETE_CONFIGURED ? 'SERVER ADMIN READY' : 'NOT CONFIGURED (optional SUPABASE_SECRET_KEY)'}`);
    console.log('Press Ctrl+C to stop.\n');
  });
}



async function mapWithConcurrency(items, limit, worker) {
  const output = new Array(items.length);
  let cursor = 0;
  const count = Math.max(1, Math.min(Number(limit)||1, items.length || 1));
  const runners = Array.from({ length: count }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      output[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return output;
}

function sanitizeApiKey(raw) {
  let value = String(raw || '').normalize('NFKC');
  // Browser/clipboard text can contain format/control marks that are invisible but illegal in HTTP headers.
  value = value.replace(/[\p{Cf}\p{Cc}]/gu, '');
  value = value.trim();
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
  value = value.replace(/\s+/gu, '');
  // Google API/auth keys are transported as an HTTP header value, so keep only printable ASCII.
  if (!/^[\x21-\x7E]+$/.test(value)) return '';
  return value;
}

async function loadDotEnv(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      const eq = line.indexOf('=');
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch { /* .env optional */ }
}

async function readJson(req) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_JSON_BYTES) { const e=new Error('Request too large'); e.statusCode=413; throw e; }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function json(res, status, data) {
  setSecurityHeaders(res);
  res.statusCode=status;
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Cache-Control','no-store, max-age=0');
  res.end(JSON.stringify(data));
}

function sanitizeContext(context) {
  const out = {
    profile: context?.profile || {},
    systemContext: String(context?.systemContext || '').slice(0, 4000),
    overallLevel: Number(context?.overallLevel || 1),
    rankStage: String(context?.rankStage || 'E').slice(0, 10),
    activeQuestCount: Number(context?.activeQuestCount || 0),
    stats: context?.stats || {},
    currentSeason: context?.currentSeason || {},
    recentCategories:Array.isArray(context?.recentCategories)?context.recentCategories.slice(0,20):[],
    selectedCategories:Array.isArray(context?.selectedCategories)?context.selectedCategories.map(x=>String(x||'').trim()).filter(Boolean).slice(0,40):[],
    localDate: String(context?.localDate || dateKey(new Date())).slice(0, 10)
  };
  return out;
}

export function classificationCacheKey(text, context = {}) {
  const safeContext = sanitizeContext(context);
  const material = JSON.stringify({
    text:String(text || '').normalize('NFKC').trim().toLowerCase(),
    context:safeContext
  });
  return createHash('sha256').update(material).digest('hex');
}

function sanitizeQuests(quests) {
  return Array.isArray(quests) ? quests.slice(0, 120).map(q => ({
    id: String(q?.id || '').slice(0, 100),
    title: String(q?.title || '').slice(0, 180),
    category:String(q?.category||'Personal').slice(0,80),
    secondaryCategory:String(q?.secondaryCategory||'').slice(0,80),
    questType: ['Main Quest','Side Quest','Daily Quest','Campaign Quest','Boss Quest'].includes(q?.questType) ? q.questType : 'Side Quest',
    priority: ['Low','Medium','High','Critical'].includes(q?.priority) ? q.priority : 'Medium',
    difficulty: ['E','D','C','B','A','S'].includes(q?.difficulty) ? q.difficulty : 'D',
    estimatedMinutes: clamp(Number(q?.estimatedMinutes || 60), 5, 100000),
    dueDate: /^20\d\d-\d\d-\d\d$/.test(String(q?.dueDate || '')) ? q.dueDate : null,
    longTermValue: clamp(Number(q?.longTermValue || 2),1,5),
    impactScore: clamp(Number(q?.impactScore || 2),1,5),
    xp: clamp(Number(q?.xp || 0),0,20000),
    subquestProgress: clamp(Number(q?.subquestProgress || 0),0,100),
  })).filter(q => q.id && q.title) : [];
}

function sanitizeActivity(activity) {
  return Array.isArray(activity) ? activity.slice(0, 100).map(a => ({
    type: String(a?.type || '').slice(0, 60), label: String(a?.label || '').slice(0, 180),
    xp: Number(a?.xp || 0), category: String(a?.category || 'System').slice(0, 40), at: String(a?.at || '').slice(0, 40)
  })) : [];
}


function splitBatchObjectives(raw) {
  const cleaned = String(raw || '').replace(/\r/g, '').trim();
  if (!cleaned) return [];

  // New lines are a hard task boundary. Preserve commas inside a task.
  let parts = cleaned.split(/\n+/)
    .map(line => line.replace(/^\s*(?:[-•*◇◆▪▫✓✔☐]|\d+[.)-])\s*/, '').trim())
    .filter(Boolean);

  // Some mobile/clipboard sources collapse line breaks. In that case only split on
  // strong separators when there are clearly multiple independent clauses.
  if (parts.length === 1) {
    const semicolonParts = cleaned.split(/\s*(?:؛|;|\|\|)\s*/).map(x => x.trim()).filter(Boolean);
    if (semicolonParts.length >= 2) parts = semicolonParts;
  }

  return parts;
}

function parseReferenceDate(value) {
  const m = String(value || '').match(/^(20\d{2})-(\d{2})-(\d{2})$/);
  if (!m) return new Date();
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12, 0, 0);
}

function inferDueDateFromText(text, referenceDate) {
  const normalized = String(text || '').normalize('NFKC');
  const base = parseReferenceDate(referenceDate);
  const addDays = n => { const d = new Date(base); d.setDate(d.getDate() + Number(n)); return dateKey(d); };

  // Exact ISO / slash dates, e.g. 2026-08-16 or 2026/8/16.
  let m = normalized.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);
  if (m) return `${m[1]}-${String(m[2]).padStart(2,'0')}-${String(m[3]).padStart(2,'0')}`;

  // Day + named month, Arabic or English. If the year is omitted, use the current year
  // unless that date has already passed by > 30 days, in which case use next year.
  const months = {
    'يناير':1,'جانفي':1,'january':1,'jan':1,
    'فبراير':2,'فيفري':2,'february':2,'feb':2,
    'مارس':3,'march':3,'mar':3,
    'أبريل':4,'ابريل':4,'نيسان':4,'april':4,'apr':4,
    'مايو':5,'may':5,
    'يونيو':6,'حزيران':6,'june':6,'jun':6,
    'يوليو':7,'تموز':7,'july':7,'jul':7,
    'أغسطس':8,'اغسطس':8,'آب':8,'اب':8,'august':8,'aug':8,
    'سبتمبر':9,'ايلول':9,'أيلول':9,'september':9,'sep':9,'sept':9,
    'أكتوبر':10,'اكتوبر':10,'تشرين الاول':10,'تشرين الأول':10,'october':10,'oct':10,
    'نوفمبر':11,'تشرين الثاني':11,'november':11,'nov':11,
    'ديسمبر':12,'كانون الاول':12,'كانون الأول':12,'december':12,'dec':12
  };
  const monthNames = Object.keys(months).sort((a,b)=>b.length-a.length).map(x=>x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
  const namedDate = new RegExp(`(?:يوم\\s*)?(\\d{1,2})\\s*(${monthNames})(?:\\s*(20\\d{2}))?`, 'iu').exec(normalized);
  if (namedDate) {
    const day = Number(namedDate[1]); const month = months[namedDate[2].toLowerCase()] || months[namedDate[2]];
    let year = namedDate[3] ? Number(namedDate[3]) : base.getFullYear();
    let d = new Date(year, month - 1, day, 12, 0, 0);
    if (!namedDate[3] && (base - d) / 86400000 > 30) { year += 1; d = new Date(year, month - 1, day, 12, 0, 0); }
    if (d.getMonth() === month - 1 && d.getDate() === day) return dateKey(d);
  }

  if (/(?:^|\s)(?:اليوم|today|tonight|الليلة)(?:\s|$)/iu.test(normalized)) return dateKey(base);
  if (/(?:بكره|بكرة|غدا|غداً|tomorrow)/iu.test(normalized)) return addDays(1);
  if (/(?:بعد|in)\s*(\d+)\s*(?:يوم|ايام|أيام|days?)/iu.test(normalized)) {
    const n = normalized.match(/(?:بعد|in)\s*(\d+)\s*(?:يوم|ايام|أيام|days?)/iu); return addDays(Number(n[1]));
  }
  if (/(?:خلال|within)\s*(\d+)\s*(?:يوم|ايام|أيام|days?)/iu.test(normalized)) {
    const n = normalized.match(/(?:خلال|within)\s*(\d+)\s*(?:يوم|ايام|أيام|days?)/iu); return addDays(Number(n[1]));
  }
  if (/(?:خلال\s*(?:ال)?(?:اسبوعين|أسبوعين)|next two weeks|within two weeks)/iu.test(normalized)) return addDays(14);
  const inWeeks = normalized.match(/(?:خلال|within|in)\s*(\d+)\s*(?:اسبوع|أسبوع|اسابيع|أسابيع|weeks?)/iu);
  if (inWeeks) return addDays(Number(inWeeks[1]) * 7);

  return null;
}

function requestedOutputLanguage(text) {
  const raw=String(text||'').normalize('NFKC');
  const explicitEnglish=/(?:باللغة|بلغة)\s*(?:الإنجليزية|الانجليزية|الإنقليزية|الانقليزية|إنجليزي|انجليزي|إنقليزي|انقليزي|انقلش)|(?:اكتب|اكتبها|جاوب|رد|النتيجة|المخرجات|العنوان).{0,24}(?:بالإنجليزي|بالانجليزي|بالإنقليزي|بالانقليزي|انقلش)|(?:respond|reply|answer|output|write|title).{0,24}\b(?:in\s+)?english\b/iu.test(raw);
  const explicitArabic=/(?:باللغة|بلغة)\s*(?:العربية|العربي)|(?:اكتب|اكتبها|جاوب|رد|النتيجة|المخرجات|العنوان).{0,24}(?:بالعربي|بالعربية)|(?:respond|reply|answer|output|write|title).{0,24}\b(?:in\s+)?arabic\b/iu.test(raw);
  if(explicitEnglish&&!explicitArabic)return 'English';
  if(explicitArabic&&!explicitEnglish)return 'Arabic';
  const arabic=(raw.match(/[\u0600-\u06FF]/g)||[]).length;
  const latin=(raw.match(/[A-Za-z]/g)||[]).length;
  return arabic > Math.max(3, latin*.55) ? 'Arabic' : 'English';
}

const ARABIC_CATEGORY_LABELS = {
  "University":"الدراسة والجامعة","Career":"المسار المهني","Engineering":"الهندسة",
  "Medicine & Healthcare":"الطب والرعاية الصحية","Programming & Technology":"البرمجة والتقنية",
  "Business & Entrepreneurship":"الأعمال وريادة الأعمال","Finance":"المالية","Fitness":"اللياقة",
  "Sports":"الرياضة","Health & Wellness":"الصحة والعافية","Nutrition":"التغذية","Personal":"التطوير الشخصي",
  "Discipline & Habits":"الانضباط والعادات","Productivity":"الإنتاجية","Mental Skills":"المهارات الذهنية",
  "Reading & Knowledge":"القراءة والمعرفة","English":"اللغة الإنجليزية","Creativity":"الإبداع",
  "Art & Design":"الفن والتصميم","Writing":"الكتابة","Research":"البحث","Social Life":"الحياة الاجتماعية",
  "Family":"العائلة","Relationships":"العلاقات","Communication":"التواصل","Leadership":"القيادة",
  "Community & Volunteering":"المجتمع والتطوع","Home":"المنزل","Organization":"التنظيم",
  "Travel & Experiences":"السفر والتجارب","Hobbies":"الهوايات","Values & Spirituality":"القيم والجانب الروحي",
  "Personal Projects":"المشاريع الشخصية","Professional Projects":"المشاريع المهنية","Discipline":"الانضباط"
};
function categoryLabel(category,language='English'){return language==='Arabic'?(ARABIC_CATEGORY_LABELS[category]||category):category;}
function localizedSkillTags(q,language='English'){
  if(language!=='Arabic')return [q.category,...(q.secondaryCategory?[q.secondaryCategory]:[])];
  return [categoryLabel(q.category,'Arabic'),...(q.secondaryCategory?[categoryLabel(q.secondaryCategory,'Arabic')]:[])];
}
function localizeAntiFarmReason(reason,language='English'){
  if(language!=='Arabic'||!reason)return reason||'';
  if(/Tiny routine action/i.test(reason))return 'إجراء روتيني صغير جدًا؛ تم تقييد المكافأة لحماية نزاهة التقدم.';
  if(/Very short, low-impact/i.test(reason))return 'مهمة قصيرة جدًا وذات أثر محدود؛ تم تقليل XP عمدًا.';
  if(/reward capped|progression integrity/i.test(reason))return 'تم تقييد المكافأة لأن المهمة صغيرة جدًا مقارنة بإنجازات التقدم الرئيسية.';
  return 'تم تقليل المكافأة لأن قيمة هذه المهمة محدودة مقارنة بإنجازات التقدم الرئيسية.';
}
function isTechnicalOnlyPhrase(value){
  const raw=String(value||'').trim();
  if(!raw)return false;
  const technical=/(?:AES-GCM|Bambu Lab|Cloudflare|Turnstile|JavaScript|Node\.js|SolidWorks|GitHub|Supabase|Gemini|Onshape|Arduino|Python|HTML|CSS|SQL|PWA|API|CAD|CAM|CAE|CFD|FEA|IELTS|ESP32|P2S|STL|3MF|3D)/giu;
  return raw.replace(technical,'').replace(/[\s+&/|(),.\-–—:;#0-9]/g,'')==='';
}
function fieldUsesTargetLanguage(value,language,{allowTechnical=false}={}){
  const raw=String(value||'').trim();
  if(!raw)return true;
  const arabic=(raw.match(/[\u0600-\u06FF]/g)||[]).length;
  const latin=(raw.match(/[A-Za-z]/g)||[]).length;
  if(language==='Arabic'){
    if(allowTechnical&&arabic===0&&latin>0&&isTechnicalOnlyPhrase(raw))return true;
    return arabic>=Math.max(2,Math.ceil(latin*.12));
  }
  return latin>=Math.max(2,Math.ceil(arabic*.20));
}
function languageMatchesQuest(q, language) {
  const titleOk=fieldUsesTargetLanguage(q?.title,language);
  const prose=[q?.rationale,q?.successCriteria,...(q?.suggestedSubquests||[]),...(q?.dependencies||[]),...(q?.suggestedEvidence||[]),q?.antiFarm?.reason].filter(Boolean);
  const proseOk=prose.every(value=>fieldUsesTargetLanguage(value,language,{allowTechnical:true}));
  const tagsOk=(q?.skillTags||[]).every(value=>fieldUsesTargetLanguage(value,language,{allowTechnical:true}));
  return titleOk&&proseOk&&tagsOk;
}
async function repairQuestLanguageWithGemini(result, text, context, targetLanguage) {
  if (languageMatchesQuest(result,targetLanguage)) return result;
  const systemInstruction=`You are ASCEND's strict language consistency repair step.
TARGET LANGUAGE: ${targetLanguage}.
Rewrite ONLY user-visible prose into ${targetLanguage}: title, rationale, successCriteria, suggestedSubquests, dependencies, suggestedEvidence, skillTags, and antiFarm.reason.
The title itself MUST be in ${targetLanguage}; do not leave an English title for an Arabic objective. Natural product names, acronyms and technical terms such as CAD, IELTS, GitHub, Bambu Lab, ESP32 or API may remain unchanged inside otherwise ${targetLanguage} prose.
Keep category, secondaryCategory, questType, priority, difficulty, estimatedMinutes, estimatedSessions, dueDate, longTermValue, impactScore, mentalLoad, flexibility, confidence and antiFarm.flag semantically unchanged.
Do not add new facts, dates, equipment or achievements.
PLAYER CONTEXT: ${JSON.stringify(context)}
ORIGINAL OBJECTIVE: ${text}
Return only schema-compliant JSON.`;
  const repaired=await geminiJson({input:JSON.stringify(result),systemInstruction,schema:questSchema,maxOutputTokens:2200,thinkingLevel:'low',models:[GEMINI_DEEP_MODEL,GEMINI_FAST_MODEL]});
  const merged={
    ...result,
    title:repaired.title||result.title,
    rationale:repaired.rationale||result.rationale,
    successCriteria:repaired.successCriteria||result.successCriteria,
    suggestedSubquests:Array.isArray(repaired.suggestedSubquests)?repaired.suggestedSubquests:result.suggestedSubquests,
    dependencies:Array.isArray(repaired.dependencies)?repaired.dependencies:result.dependencies,
    suggestedEvidence:Array.isArray(repaired.suggestedEvidence)?repaired.suggestedEvidence:result.suggestedEvidence,
    skillTags:Array.isArray(repaired.skillTags)?repaired.skillTags:result.skillTags,
    antiFarm:{...(result.antiFarm||{}),reason:repaired?.antiFarm?.reason||result?.antiFarm?.reason||''}
  };
  return enforceQuestLanguageContract(merged,text,targetLanguage);
}
function enforceQuestLanguageContract(result,text,targetLanguage){
  const q={...result};
  const ar=targetLanguage==='Arabic';
  if(!fieldUsesTargetLanguage(q.title,targetLanguage))q.title=createSmartTitle(text,q.category,q.questType,targetLanguage);
  const localSubs=suggestSubquests(text,q,targetLanguage);
  if(!fieldUsesTargetLanguage(q.rationale,targetLanguage,{allowTechnical:true}))q.rationale=buildRationale(q,q.antiFarm||{flag:false},targetLanguage);
  if(!fieldUsesTargetLanguage(q.successCriteria,targetLanguage,{allowTechnical:true}))q.successCriteria=ar?'تُنجز النتيجة المطلوبة ويتم التحقق منها بدليل واضح.':'The requested outcome is completed and verified with clear evidence.';
  if((q.suggestedSubquests||[]).some(v=>!fieldUsesTargetLanguage(v,targetLanguage,{allowTechnical:true})))q.suggestedSubquests=localSubs;
  if((q.dependencies||[]).some(v=>!fieldUsesTargetLanguage(v,targetLanguage,{allowTechnical:true})))q.dependencies=[];
  if((q.suggestedEvidence||[]).some(v=>!fieldUsesTargetLanguage(v,targetLanguage,{allowTechnical:true})))q.suggestedEvidence=q.category==='Engineering'?(ar?['صورة أو فيديو للنتيجة النهائية','توثيق تقني أو رابط GitHub عند الحاجة']:['Final result photo/video','GitHub or technical notes']):[];
  if((q.skillTags||[]).some(v=>!fieldUsesTargetLanguage(v,targetLanguage,{allowTechnical:true})))q.skillTags=localizedSkillTags(q,targetLanguage);
  if(!fieldUsesTargetLanguage(q?.antiFarm?.reason,targetLanguage,{allowTechnical:true}))q.antiFarm={...(q.antiFarm||{}),reason:localizeAntiFarmReason(q?.antiFarm?.reason,targetLanguage)};
  return q;
}

const questSchema = {
  type: 'object',
  properties: {
    title: { type: 'string', description: 'Concise 3-8 word quest title in the requested/dominant user language. Never translate an Arabic objective into English unless explicitly requested. No due date or duration in the title.' },
    category:{type:'string'},
    secondaryCategory:{type:'string'},
    questType: { type: 'string', enum: ['Main Quest','Side Quest','Daily Quest','Campaign Quest','Boss Quest'] },
    priority: { type: 'string', enum: ['Low','Medium','High','Critical'] },
    difficulty: { type: 'string', enum: ['E','D','C','B','A','S'] },
    estimatedMinutes: { type: 'integer', minimum: 5, maximum: 100000 },
    estimatedSessions: { type: 'integer', minimum: 1, maximum: 365 },
    dueDate: { type: 'string', description: 'ISO YYYY-MM-DD, or empty string if no explicit or safely inferable date.' },
    longTermValue: { type: 'integer', minimum: 1, maximum: 5 },
    impactScore: { type: 'integer', minimum: 1, maximum: 5 },
    mentalLoad: { type: 'string', enum: ['Low','Medium','High','Extreme'] },
    flexibility: { type: 'string', enum: ['Flexible','Semi-fixed','Fixed'] },
    rationale: { type: 'string' },
    successCriteria: { type: 'string' },
    suggestedSubquests: { type: 'array', items: { type: 'string' }, maxItems: 14 },
    dependencies: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    suggestedEvidence: { type: 'array', items: { type: 'string' }, maxItems: 6 },
    skillTags: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    antiFarm: {
      type: 'object', properties: { flag: { type: 'boolean' }, reason: { type: 'string' } }, required: ['flag','reason']
    },
    confidence: { type: 'number', minimum: 0, maximum: 1 }
  },
  required: ['title','category','secondaryCategory','questType','priority','difficulty','estimatedMinutes','estimatedSessions','dueDate','longTermValue','impactScore','mentalLoad','flexibility','rationale','successCriteria','suggestedSubquests','dependencies','suggestedEvidence','skillTags','antiFarm','confidence']
};

async function classifyWithGemini(text, context, options={}) {
  const today = context.localDate || dateKey(new Date());
  const responseLanguage=requestedOutputLanguage(text);
  const systemInstruction = `You are the semantic progression intelligence inside a private life-management system.
Your job is to understand the objective, not match keywords. Today is ${today}.

CATEGORY DEFINITIONS:
Use ONLY PLAYER CONTEXT.selectedCategories when provided. Never invent an unrelated category.
Category = life/work domain (WHY). Quest type = task scope. Skill tags = capabilities. Operating style = preference. Keep them separate.
Medicine & Healthcare covers medical knowledge, clinical reasoning, patient safety, ethics, confidentiality, evidence-based healthcare and clinical communication. Engineering covers technical design/build/test. University covers coursework/exams. Programming & Technology covers software/code/debugging. Fitness, Sports, Health & Wellness and Nutrition are distinct by purpose.
Custom selected categories are valid and should be used exactly as written when they are the best fit.

QUEST TYPES:
- Daily Quest: genuinely recurring behavior.
- Side Quest: bounded practical task, usually one session.
- Main Quest: substantial finite goal requiring multiple sessions or meaningful effort.
- Campaign Quest: long-running development path or multi-week program with recurring stages, such as a semester-long skill plan, long IELTS preparation, sustained portfolio program, or multi-month engineering development effort. It should have a finish condition, but it is broader than a normal Main Quest.
- Boss Quest: rare, finite and high-stakes. Use only for major high-stakes campaigns with several meaningful stages: finals period, a major exam campaign, graduation/capstone project, flagship engineering system, or similarly consequential multi-week objective. A 10-25 hour normal project is usually Main, NOT Boss. A long development program is usually Campaign, not Boss. Use Boss for a finite major obstacle such as finals, the IELTS exam itself, a capstone defense, or a flagship system delivery.

REASONING RULES:
- Primary category represents WHY the objective matters most, not incidental tools or where it will be posted.
- DATE INTELLIGENCE IS STRICT: if the user explicitly gives an absolute date (for example 16 August, Aug 16, 2026-08-16) or a reliable relative date (today, tomorrow, within 3 days, within two weeks), dueDate MUST be resolved to ISO YYYY-MM-DD using Today = ${today}. If there is no explicit or safely inferable date, dueDate must be an empty string. A date affects urgency and board ordering, never the semantic category.
- RESPONSE LANGUAGE CONTRACT: ${responseLanguage}. Every user-visible prose field MUST use ${responseLanguage}: title, rationale, successCriteria, suggestedSubquests, dependencies, suggestedEvidence, skillTags and antiFarm.reason. Structured system labels/enums such as category, questType, priority, difficulty, mentalLoad and flexibility stay in their defined English enum values. If the user explicitly requests Arabic or English inside the objective, that explicit request overrides the dominant input language. Technical product names/acronyms may remain unchanged.
- Title must be short and clean, 3-8 words. Do not copy the full sentence. Do not include time estimates or deadlines in the title.
- estimatedMinutes is TOTAL focused work, not elapsed calendar time. estimatedSessions is the realistic number of work sessions needed. Do not convert a year-long goal into literal 24-hour days.
- Difficulty measures actual challenge for this player, not importance.
- Priority measures urgency/importance now. Impact and long-term value measure leverage.
- Prevent XP farming: trivial micro-actions should be flagged.
- For Main/Boss engineering projects, subquests should follow a serious engineering cycle where relevant: requirements -> theory/calculations -> architecture/BOM -> CAD -> instrumentation -> prototype -> controlled test -> measurements -> analysis -> V2 -> validation -> documentation.
- Never invent equipment, deadlines, certificates, or achievements the user did not mention.
${options.singleObjective ? '- SINGLE OBJECTIVE CONTRACT: This text is one external proposal with metadata lines. Return exactly ONE Quest. Treat sender, details, time, and duration as context; never turn them into separate Quests. Return suggestedSubquests as an empty array so the proposal remains one reviewable card.' : ''}

PLAYER CONTEXT:
${JSON.stringify(context)}
Return only schema-compliant JSON.`;

  const cacheKey = classificationCacheKey(text, context);
  if (classificationCache.has(cacheKey)) return structuredClone(classificationCache.get(cacheKey));

  const parsed = await geminiJson({
    input: `Classify this objective deeply:\n${text}`,
    systemInstruction,
    schema: questSchema,
    maxOutputTokens: 2200,
    thinkingLevel: 'low',
    models: [GEMINI_FAST_MODEL, GEMINI_DEEP_MODEL]
  });

  let result=finalizeGeminiQuest(parsed,text,today,context);
  result=await repairQuestLanguageWithGemini(result,text,context,responseLanguage);
  result=enforceQuestLanguageContract(result,text,responseLanguage);
  rememberClassification(cacheKey, result);
  return result;
}


function finalizeGeminiQuest(parsed,text,today,context={}){
  const allowed=allowedCategories(context);const category=allowed.includes(String(parsed.category||''))?String(parsed.category):allowed[0];const secondaryCategory=allowed.includes(String(parsed.secondaryCategory||''))&&String(parsed.secondaryCategory)!==category?String(parsed.secondaryCategory):null;
  const explicitDueDate = inferDueDateFromText(text, today);
  const aiDueDate = /^20\d\d-\d\d-\d\d$/.test(String(parsed.dueDate || '')) ? parsed.dueDate : null;
  const dueDate = explicitDueDate || aiDueDate;
  const draft = {
    ...parsed,
    category,
    secondaryCategory,
    dueDate,
    estimatedMinutes: clamp(parsed.estimatedMinutes,5,100000),
    estimatedSessions: clamp(parsed.estimatedSessions,1,365),
    longTermValue: clamp(parsed.longTermValue,1,5),
    impactScore: clamp(parsed.impactScore,1,5),
    confidence: clamp(parsed.confidence,.2,1)
  };
  const reward = calculateReward(draft);
  draft.xp = draft.antiFarm?.flag ? Math.min(reward.xp, reward.antiFarmCap) : reward.xp;
  draft.statImpact = buildStatImpact(category, secondaryCategory);
  return draft;
}

function rememberClassification(key, result) {
  classificationCache.set(key, structuredClone(result));
  if (classificationCache.size > 250) classificationCache.delete(classificationCache.keys().next().value);
}

function attachBatchSources(items,objectives){
  return items.map((item,index)=>({...item,sourceObjective:String(objectives[index]||'').trim()}));
}

async function classifyBatchWithGemini(lines, context) {
  const today = context.localDate || dateKey(new Date());
  const uncached = [];
  const results = new Array(lines.length);
  lines.forEach((text, index) => {
    const key = classificationCacheKey(text, context);
    if (classificationCache.has(key)) results[index] = structuredClone(classificationCache.get(key));
    else uncached.push({ index, text, key });
  });
  if (!uncached.length) return attachBatchSources(results,lines);

  const batchSchema = {
    type: 'object',
    properties: {
      results: { type: 'array', minItems: uncached.length, maxItems: uncached.length, items: questSchema }
    },
    required: ['results']
  };
  const systemInstruction = `You are ASCEND's semantic quest classifier. Today is ${today}.
Analyze EVERY objective independently. Never merge objectives. Return exactly one result per objective, in exactly the same order.
Use PLAYER CONTEXT.selectedCategories when provided. Category is the domain; questType is scope; skillTags are capabilities. Do not mix these concepts.
Primary category is WHY the objective matters. Dates must resolve to ISO YYYY-MM-DD when explicit or safely inferable. Titles and ALL user-visible prose must follow each objective's responseLanguage. Never translate Arabic objectives into English unless that objective explicitly asks for English. Structured enum labels remain English.
Side Quest = bounded practical task. Main Quest = substantial finite goal. Campaign Quest = multi-week/month development path. Boss Quest = rare, finite, high-stakes obstacle.
Do not inflate difficulty or XP relevance. Flag trivial micro-actions for anti-farming. Preserve technical English terms when natural.
PLAYER CONTEXT: ${JSON.stringify(context)}
Return only schema-compliant JSON.`;
  const payload = uncached.map((item, i) => ({ number: i + 1, responseLanguage:requestedOutputLanguage(item.text), objective: item.text }));
  const parsed = await geminiJson({
    input: `Objectives to classify independently:\n${JSON.stringify(payload)}`,
    systemInstruction,
    schema: batchSchema,
    maxOutputTokens: Math.min(32000, 1200 + uncached.length * 1100),
    thinkingLevel: 'low',
    models: [GEMINI_FAST_MODEL, GEMINI_DEEP_MODEL]
  });
  if (!Array.isArray(parsed.results) || parsed.results.length !== uncached.length) throw new Error('Gemini batch result count did not match input count.');
  for (let i=0;i<uncached.length;i++) {
    const item=uncached[i];
    let result=finalizeGeminiQuest(parsed.results[i],item.text,today,context);
    const targetLanguage=requestedOutputLanguage(item.text);
    // Keep batch intake truly single-call: enforce language deterministically here
    // instead of issuing one corrective AI call per objective.
    result=enforceQuestLanguageContract(result,item.text,targetLanguage);
    results[item.index] = result;
    rememberClassification(item.key, result);
  }
  return attachBatchSources(results,lines);
}

const directiveSchema = {
  type: 'object',
  properties: {
    primaryQuestId: { type: 'string' },
    secondaryQuestIds: { type: 'array', items: { type: 'string' }, maxItems: 2 },
    optionalQuestId: { type: 'string' },
    deferQuestIds: { type: 'array', items: { type: 'string' }, maxItems: 8 },
    headline: { type: 'string' },
    reasoning: { type: 'string' },
    loadAssessment: { type: 'string', enum: ['Light','Balanced','Heavy','Overloaded'] },
    focusedMinutes: { type: 'integer', minimum: 0, maximum: 1440 },
    warning: { type: 'string' }
  },
  required: ['primaryQuestId','secondaryQuestIds','optionalQuestId','deferQuestIds','headline','reasoning','loadAssessment','focusedMinutes','warning']
};

async function directiveWithGemini(quests, context) {
  const ids = new Set(quests.map(q => q.id));
  const systemInstruction = `You are ASCEND's daily prioritization intelligence. Do not create a schedule with clock times.
Choose ONE primary objective, up to TWO secondary objectives, and optionally ONE low-friction objective. Protect the player from overload.
Prioritize hard deadlines, overdue work, high-impact Main/Boss objectives, and obligations. Do not choose several huge objectives for the same day just because they have high XP.
Respect the player's stated context and university workload. A flexible task without a deadline can be deferred when urgent obligations exist.
The user prefers a concise list rather than an hour-by-hour timetable.
Only return quest IDs that exist in the supplied data. Empty strings/arrays are allowed when appropriate.
PLAYER CONTEXT: ${JSON.stringify(context)}
Return only schema-compliant JSON.`;
  const parsed = await geminiJson({
    input: `Active quests:\n${JSON.stringify(quests)}`,
    systemInstruction,
    schema: directiveSchema,
    maxOutputTokens: 1000,
    thinkingLevel: 'medium',
    models: [GEMINI_DEEP_MODEL, GEMINI_FAST_MODEL]
  });
  parsed.primaryQuestId = ids.has(parsed.primaryQuestId) ? parsed.primaryQuestId : (quests[0]?.id || '');
  parsed.secondaryQuestIds = (parsed.secondaryQuestIds || []).filter(id => ids.has(id) && id !== parsed.primaryQuestId).slice(0,2);
  parsed.optionalQuestId = ids.has(parsed.optionalQuestId) && parsed.optionalQuestId !== parsed.primaryQuestId && !parsed.secondaryQuestIds.includes(parsed.optionalQuestId) ? parsed.optionalQuestId : '';
  parsed.deferQuestIds = (parsed.deferQuestIds || []).filter(id => ids.has(id)).slice(0,8);
  return parsed;
}

const reviewSchema = {
  type: 'object',
  properties: {
    headline: { type: 'string' },
    state: { type: 'string', enum: ['Stable','Building Momentum','Unbalanced','Overloaded','Recovery'] },
    strongestArea: { type: 'string' },
    neglectedArea: { type: 'string' },
    observation: { type: 'string' },
    warning: { type: 'string' },
    recommendations: { type: 'array', items: { type: 'string' }, maxItems: 4 },
    nextSystemMove: { type: 'string' }
  },
  required: ['headline','state','strongestArea','neglectedArea','observation','warning','recommendations','nextSystemMove']
};

async function reviewWithGemini(quests, activity, context) {
  const systemInstruction = `You are ASCEND's system reviewer. Analyze workload and development patterns without motivational fluff.
Use only the supplied data. Distinguish a temporary imbalance from a genuine neglected area. Do not diagnose mental-health conditions.
The user's university performance must remain protected when academic workload rises. Recommend at most four concrete changes. Do not invent clock-time schedules.
PLAYER CONTEXT: ${JSON.stringify(context)}
Return only schema-compliant JSON.`;
  return await geminiJson({
    input: `Active quests:\n${JSON.stringify(quests)}\n\nRecent activity:\n${JSON.stringify(activity)}`,
    systemInstruction,
    schema: reviewSchema,
    maxOutputTokens: 900,
    thinkingLevel: 'medium',
    models: [GEMINI_DEEP_MODEL, GEMINI_FAST_MODEL]
  });
}

async function geminiJson({ input, systemInstruction, schema, maxOutputTokens = 1400, thinkingLevel = 'medium', models = [GEMINI_FAST_MODEL, GEMINI_DEEP_MODEL] }) {
  const uniqueModels = [...new Set((models || []).filter(Boolean))];
  let lastError = null;
  for (const model of uniqueModels) {
    try {
      return await geminiJsonOnce({ model, input, systemInstruction, schema, maxOutputTokens, thinkingLevel });
    } catch (error) {
      lastError = error;
      const status = Number(error?.status || 0);
      console.error(`Gemini model ${model} failed${status ? ` (${status})` : ''}:`, error?.message || error);
      if (![429, 500, 502, 503, 504].includes(status)) throw error;
    }
  }
  throw lastError || new Error('No Gemini model was available.');
}

async function geminiJsonOnce({ model, input, systemInstruction, schema, maxOutputTokens, thinkingLevel }) {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
    method: 'POST',
    headers: { 'x-goog-api-key': GEMINI_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      input,
      system_instruction: systemInstruction,
      response_format: { type: 'text', mime_type: 'application/json', schema },
      store: false,
      generation_config: { thinking_level: thinkingLevel, max_output_tokens: maxOutputTokens }
    })
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(`Gemini HTTP ${response.status}: ${body}`);
    error.status = response.status;
    throw error;
  }
  const payload = await response.json();
  const output = extractInteractionText(payload);
  if (!output) throw new Error('Gemini returned no text output.');
  return JSON.parse(output);
}

function extractInteractionText(payload) {
  if (typeof payload?.output_text === 'string' && payload.output_text) return payload.output_text;
  for (const step of payload?.steps || []) {
    if (step.type !== 'model_output') continue;
    for (const item of step.content || []) if (item.type === 'text' && item.text) return item.text;
  }
  return '';
}

function enrichLocalQuest(q) {
  const sessions = q.questType === 'Side Quest' ? 1 : Math.max(1, Math.ceil(q.estimatedMinutes / 120));
  const language=q.outputLanguage==='Arabic'?'Arabic':'English';
  const arabic=language==='Arabic';
  return {
    ...q,
    estimatedSessions: sessions,
    mentalLoad: q.difficulty === 'S' || q.difficulty === 'A' ? 'High' : q.difficulty === 'B' ? 'Medium' : 'Low',
    flexibility: q.dueDate ? (q.priority === 'Critical' ? 'Fixed' : 'Semi-fixed') : 'Flexible',
    successCriteria: arabic ? (q.questType === 'Side Quest' ? 'تُنجز النتيجة العملية المطلوبة ويتم التحقق منها.' : 'يُستكمل الهدف ويُختبر وتُوثق النتيجة بدليل واضح.') : (q.questType === 'Side Quest' ? 'The practical result is completed and verified.' : 'The objective is completed, tested, and documented with clear evidence.'),
    dependencies: [],
    suggestedEvidence: q.category === 'Engineering' ? (arabic ? ['صورة أو فيديو للنتيجة النهائية','توثيق تقني أو رابط GitHub عند الحاجة'] : ['Final result photo/video', 'GitHub or technical notes']) : [],
    skillTags: q.skillTags?.length ? q.skillTags : localizedSkillTags(q,language),
    antiFarm:{...(q.antiFarm||{flag:false,reason:''}),reason:localizeAntiFarmReason(q?.antiFarm?.reason,language)}
  };
}

function emptyDirective() {
  return {
    primaryQuestId: '', secondaryQuestIds: [], optionalQuestId: '', deferQuestIds: [],
    headline: 'The board is clear.', reasoning: 'Add one meaningful objective instead of manufacturing busywork.',
    loadAssessment: 'Light', focusedMinutes: 0, warning: ''
  };
}

function localDirective(quests, context = {}) {
  if (!quests.length) return emptyDirective();
  const localDate = /^20\d\d-\d\d-\d\d$/.test(String(context?.localDate || '')) ? context.localDate : '';
  const sorted = [...quests].sort((a,b) => localQuestScore(b, localDate) - localQuestScore(a, localDate));
  const primary = sorted[0];
  const secondary = [];
  let runningMinutes = primary.estimatedMinutes;
  for (const q of sorted.slice(1)) {
    if (secondary.length >= 2) break;
    const huge = q.estimatedMinutes >= 240;
    if (runningMinutes >= 360 && huge) continue;
    secondary.push(q); runningMinutes += Math.min(q.estimatedMinutes, 180);
  }
  const used = new Set([primary.id, ...secondary.map(q => q.id)]);
  const optional = sorted.find(q => !used.has(q.id) && q.estimatedMinutes <= 60) || null;
  if (optional) used.add(optional.id);
  const defer = sorted.filter(q => !used.has(q.id)).slice(0,8).map(q => q.id);
  const total = primary.estimatedMinutes + secondary.reduce((s,q) => s+q.estimatedMinutes,0) + (optional?.estimatedMinutes || 0);
  const loadAssessment = total > 600 ? 'Overloaded' : total > 420 ? 'Heavy' : total > 150 ? 'Balanced' : 'Light';
  return {
    primaryQuestId: primary.id,
    secondaryQuestIds: secondary.map(q => q.id),
    optionalQuestId: optional?.id || '',
    deferQuestIds: defer,
    headline: `${primary.priority === 'Critical' ? 'Critical objective' : primary.questType === 'Boss Quest' ? 'Boss objective' : primary.questType === 'Campaign Quest' ? 'Campaign objective' : 'Primary objective'}: ${primary.title}`,
    reasoning: 'Local prioritization weighs deadlines, priority, quest type, impact, long-term value, and workload size.',
    loadAssessment,
    focusedMinutes: Math.min(1440,total),
    warning: loadAssessment === 'Overloaded' ? 'The selected workload is too large for one day. Defer at least one secondary objective.' : ''
  };
}

function localReview(quests, activity, context = {}) {
  const recent = activity.filter(a => Number(a.xp) > 0).slice(0,40);
  const categoryXp = Object.fromEntries(CATEGORIES.map(c => [c,0]));
  for (const a of recent) if (categoryXp[a.category] !== undefined) categoryXp[a.category] += Number(a.xp || 0);
  const sorted = Object.entries(categoryXp).sort((a,b)=>b[1]-a[1]);
  const strongest = sorted[0]?.[1] > 0 ? sorted[0][0] : 'No clear area yet';
  const neglected = sorted.filter(([,xp])=>xp===0).map(([c])=>c)[0] || sorted.at(-1)?.[0] || 'None';
  const activeMinutes = quests.reduce((s,q)=>s+Number(q.estimatedMinutes||0),0);
  const high = quests.filter(q=>['High','Critical'].includes(q.priority)).length;
  const state = high >= 5 || activeMinutes > 2400 ? 'Overloaded' : recent.length >= 5 ? 'Building Momentum' : recent.length ? 'Stable' : 'Recovery';
  return {
    headline: state === 'Overloaded' ? 'Reduce active load before adding more.' : state === 'Building Momentum' ? 'Momentum is forming.' : 'Keep the system simple and measurable.',
    state,
    strongestArea: strongest,
    neglectedArea: neglected,
    observation: `${quests.length} active quests are carrying about ${formatMinutes(activeMinutes)} of estimated work.`,
    warning: state === 'Overloaded' ? 'Too many simultaneous commitments can hide the work that actually matters.' : '',
    recommendations: state === 'Overloaded' ? ['Keep one primary objective visible','Defer low-urgency projects','Finish before adding another large quest'] : ['Keep one meaningful Main Quest active','Use Side Quests for bounded practical work','Record outcomes instead of only task counts'],
    nextSystemMove: quests.length ? 'Clear the highest-value active objective before expanding the board.' : 'Add the most important real objective you already owe yourself.'
  };
}

function localQuestScore(q, localDate = '') {
  const priority={Low:1,Medium:2,High:4,Critical:7}[q.priority]||2;
  const diff={E:1,D:2,C:3,B:5,A:7,S:10}[q.difficulty]||2;
  const type={'Daily Quest':1,'Side Quest':2,'Main Quest':5,'Campaign Quest':6.5,'Boss Quest':8}[q.questType]||2;
  let due=0;
  if(q.dueDate){ const days=localDate ? daysBetweenDates(localDate,q.dueDate) : daysFromToday(q.dueDate); due=days<0?12:days===0?10:days===1?7:days<=3?4:1; }
  return priority*3 + diff + type + due + Number(q.longTermValue||2)*1.5 + Number(q.impactScore||2)*1.5 + Math.min(8,Number(q.xp||0)/300);
}

function localClassify(text, context = {}) {
  const normalized = normalizeDigits(text).trim();
  const outputLanguage=requestedOutputLanguage(text);
  const scores = Object.fromEntries(CATEGORIES.map(c => [c, 0]));

  const hasEngineeringCore = /(robot|روبوت|cad|solidworks|onshape|prototype|بروتوتايب|تصميم|design|arduino|esp32|sensor|sensors|حساس|حساسات|electronics?|الكترون|3d print|3d printing|طباعة ثلاث|mechanical|ميكاني|thermal|thermodynamics|thermo|ديناميكا حرارية|حرار|energy|طاقة|pump|مضخ|turbine|توربين|motor|محرك|heat exchanger|مبادل|manufactur|تصنيع|simulation|محاكاة|fea|cfd|matlab|control|vibration|اهتزاز|predictive maintenance|power plant|باور بلانت|renewable|clean energy|طاقة نظيفة)/i.test(normalized);
  const hasBuildIntent = /(build|ابني|أبني|اصنع|أصنع|أسوي مشروع|اسوي مشروع|مشروع هندسي|project|prototype|develop|اطور|أطور|صمم|اصمم|أصمم|اختبر|test|measure|قياس)/i.test(normalized);
  const hasCareerPublishing = /(linkedin|لنكد|twitter|تويتر|github|قيتهب|portfolio|بورتفوليو|cv|resume|سيرة|website|موقعي|personal site|certificate|شهادة|internship|تدريب|career|وظيف|interview|مقابلة|application|تقديم|publish|انشر|أنشر|توثيق|document|readme|repo|repository)/i.test(normalized);
  const hasUniversityPurpose = /(جامعة|university|مذاكر|study|lecture|محاضرة|واجب|assignment|midterm|ميد|final|فاينل|quiz|كويز|exam|اختبار|semester|ترم|chapter|فصل|problem set|سلايدات|slides|course|مقرر|درجة|gpa|academic|اكاديمي)/i.test(normalized);
  const hasEnglishGoal = /(ielts|ايلتس|english|انجليزي|انقليزي|speaking|writing|listening|reading|vocabulary|اطور.*(?:انجليزي|انقليزي)|أطور.*(?:انجليزي|انقليزي))/i.test(normalized);

  const signals = {
    Engineering: [
      [/(robot|روبوت|cad|solidworks|onshape|prototype|بروتوتايب|تصميم|design|arduino|esp32|sensor|sensors|حساس|حساسات|electronics?|الكترون|3d print|3d printing|طباعة ثلاث|mechanical|ميكاني|thermal|thermodynamics|thermo|ديناميكا حرارية|حرار|energy|طاقة|pump|مضخ|turbine|توربين|motor|محرك|heat exchanger|مبادل|manufactur|تصنيع|simulation|محاكاة|fea|cfd|matlab|control|vibration|اهتزاز|predictive maintenance|power plant|باور بلانت|renewable|clean energy|طاقة نظيفة)/i, 7],
      [/(build|ابني|أبني|اصنع|أصنع|اختبر|test|measure|قياس|calculate|احسب|analysis|تحليل|project|مشروع|prototype)/i, 3]
    ],
    University: [
      [/(جامعة|university|مذاكر|study|lecture|محاضرة|واجب|assignment|midterm|ميد|final|فاينل|quiz|كويز|exam|اختبار|semester|ترم|chapter|فصل|problem set|سلايدات|slides)/i, 7],
      [/(course|مقرر|درجة|gpa|academic|اكاديمي)/i, 3]
    ],
    'Medicine & Healthcare': [[/(medicine|medical|clinical|patient|doctor|طبيب|طب|سريري|مريض|تشخيص|diagnosis|pharmacology|فارما|anatomy|physiology|pathology|ethics|أخلاق|patient safety|سلامة المريض)/i,10]],
    'Programming & Technology': [[/(programming|code|coding|software|debug|javascript|python|api|database|برمجة|كود|سوفتوير|داتا بيس)/i,9]],
    Research: [[/(research|paper|literature review|methodology|study design|بحث|ورقة علمية|منهجية)/i,8]],
    Fitness: [[/(gym|نادي|تمرين|workout|cardio|كارديو|run|جري|lifting|حديد|exercise|fitness|رياضة|steps|خطوات|وزن|weight training)/i, 8]],
    English: [[/(english|انجليزي|انقليزي|ielts|ايلتس|speaking|writing|listening|reading|vocabulary|مفردات|grammar|قواعد|mock test)/i, 8]],
    Career: [
      [/(linkedin|لنكد|twitter|تويتر|github|قيتهب|portfolio|بورتفوليو|cv|resume|سيرة|website|موقعي|personal site|certificate|شهادة|internship|تدريب|career|وظيف|interview|مقابلة|application|تقديم)/i, 5],
      [/(publish|انشر|أنشر|توثيق|document|README|repo|repository)/i, 2]
    ],
    Home: [[/(بيت|home|حمام|bathroom|toilet|plumbing|سباكة|تسريب|leak|سوبرماركت|supermarket|غرفة|room|مطبخ|kitchen|repair|اصلح|أصلح|تنظيف البيت|شراء للبيت)/i, 8]],
    Personal: [[/(personal|شخصي|شراء|اشتري|تنظيم|رتب|ترتيب|clean pc|تنظيف الكمبيوتر|phone case|كفر|family|اهل|أهل|friend|اصحاب|أصحاب|movie|فيلم|game|لعب)/i, 3]]
  };

  for (const [category, rules] of Object.entries(signals)) {
    for (const [regex, weight] of rules) if (regex.test(normalized)) scores[category] += weight;
  }

  // Intent is more important than incidental tools or publishing words.
  if (hasEnglishGoal && /(ielts|ايلتس)/i.test(normalized) && !/(english course|مقرر انجليزي|مقرر انقليزي|اختبار انجليزي جامعي|university english exam)/i.test(normalized)) {
    scores.English += 12;
    if (hasUniversityPurpose) scores.University += 2; // university may be a constraint/context, not the purpose.
  } else if (hasUniversityPurpose) {
    scores.University += 9;
    if (hasEngineeringCore) scores.Engineering += 2; // technical subject becomes secondary knowledge domain.
  } else if (hasEngineeringCore && hasBuildIntent) {
    scores.Engineering += 12; // building an engineering system stays Engineering even if it will be documented publicly.
    if (hasCareerPublishing) scores.Career += 4;
  } else if (hasCareerPublishing) {
    scores.Career += 7;
  }

  if (scores.Home >= 8 && /(repair|اصلح|أصلح|تسريب|leak|plumbing|سباكة|toilet|bathroom|حمام)/i.test(normalized)) scores.Home += 8;

  const allowed=allowedCategories(context);const ordered=Object.entries(scores).filter(([name])=>allowed.includes(name)).sort((a,b)=>b[1]-a[1]);const category=ordered[0]?.[1]>0?ordered[0][0]:allowed[0];let secondaryCategory=ordered[1]?.[1]>=Math.max(4,(ordered[0]?.[1]||0)*.30)&&ordered[1]?.[0]!==category?ordered[1][0]:null;
  if(category==='Engineering'&&hasCareerPublishing&&allowed.includes('Career'))secondaryCategory='Career';
  if(category==='University'&&hasEngineeringCore&&allowed.includes('Engineering'))secondaryCategory='Engineering';

  const estimatedMinutes = inferMinutes(normalized, category);
  const dueDate=inferDueDateFromText(normalized,context.localDate||dateKey(new Date()))||inferDueDate(normalized);
  const priority = inferPriority(normalized, dueDate);
  const longTermValue = inferLongTermValue(normalized, category);
  const impactScore = inferImpact(normalized, category);
  const questType = inferQuestType(normalized, estimatedMinutes, category, longTermValue, impactScore);
  const difficulty = inferDifficulty(normalized, estimatedMinutes, questType);
  const antiFarm = detectAntiFarm(normalized, estimatedMinutes, longTermValue, impactScore);

  const draft = { title: createSmartTitle(normalized, category, questType, outputLanguage), category, secondaryCategory, questType, priority, difficulty, estimatedMinutes, dueDate, longTermValue, impactScore, outputLanguage };
  const reward = calculateReward(draft);
  const xp = antiFarm.flag ? Math.min(reward.xp, reward.antiFarmCap) : reward.xp;
  const statImpact = buildStatImpact(category, secondaryCategory);
  const suggestedSubquests = suggestSubquests(normalized, draft, outputLanguage);
  const confidence = inferConfidence(ordered);

  return {
    ...draft, xp, statImpact,
    rationale: buildRationale(draft, antiFarm, outputLanguage),
    suggestedSubquests,
    antiFarm,
    confidence
  };
}

function inferMinutes(text, category) {
  if (/ساعتين/i.test(text)) return 120;
  if (/(ساعة ونص|ساعه ونص|hour and a half|1\.5 hours?)/i.test(text)) return 90;
  const hour = text.match(/(\d+(?:\.\d+)?)\s*(?:ساعة|ساعات|ساعه|hour|hours|hr|hrs)/i);
  const min = text.match(/(\d+)\s*(?:دقيقة|دقائق|دقايق|minute|minutes|min)/i);
  const day = text.match(/(\d+)\s*(?:يوم|ايام|أيام|days?)/i);
  if (hour) return Math.max(5, Math.round(Number(hour[1]) * 60));
  if (min) return Math.max(5, Number(min[1]));
  if (day && /(مشروع|project|دراسة|study|prepare|تحضير)/i.test(text)) return Math.max(120, Number(day[1]) * 150);
  if (/(خلال السنة|على مدار السنة|over the year|throughout the year)/i.test(text) && /(ielts|ايلتس|english|انجليزي|انقليزي)/i.test(text)) return 5400;
  if (/(semester|ترم كامل|فصل دراسي)/i.test(text)) return 6000;
  if (/(major project|مشروع كبير|showcase|digital twin|predictive maintenance|روبوت تفتيش|inspection robot)/i.test(text)) return 1200;
  if (/(project|مشروع|prototype|روبوت|robot|portfolio|ielts)/i.test(text)) return 300;
  if (category === 'University') return 90;
  if (category === 'Fitness') return 75;
  if (category === 'Home') return 60;
  return 45;
}

function inferDueDate(text) {
  return inferDueDateFromText(text, dateKey(new Date()));
}

function inferPriority(text, dueDate) {
  if (/(عاجل|urgent|critical|طارئ|تسريب|leak|deadline today|لازم اليوم|ضروري اليوم)/i.test(text)) return 'Critical';
  if (/(مهم جدا|مهم جدًا|very important|deadline|تسليم|submit|بكره|بكرة|tomorrow|اختبار|exam|حفل|موعد)/i.test(text)) return 'High';
  if (dueDate && daysFromToday(dueDate) <= 3) return 'High';
  if (/(مو مهم|not important|optional|اختياري)/i.test(text)) return 'Low';
  return 'Medium';
}

function inferLongTermValue(text, category) {
  if (/(degree|تخرج|graduat|ielts|ايلتس|career|وظيف|portfolio|بورتفوليو|major project|مشروع كبير|showcase|digital twin|طاقة نظيفة|clean energy|internship)/i.test(text)) return 5;
  if (['Engineering','University','English','Career'].includes(category) && /(project|مشروع|course|دورة|اختبار|exam|build|ابني|تعلم|learn)/i.test(text)) return 4;
  if (['Engineering','University','Fitness','English','Career'].includes(category)) return 3;
  if (category === 'Home' && /(تسريب|leak|repair|اصلح|أصلح)/i.test(text)) return 3;
  return 2;
}

function inferImpact(text, category) {
  if (/(تخرج|graduat|finals|فاينلز|major project|مشروع كبير|internship|وظيفة|job offer|ielts exam|اختبار ايلتس|health|سلامة|تسريب كبير)/i.test(text)) return 5;
  if (/(مهم جدا|مهم جدًا|high impact|portfolio|بورتفوليو|exam|اختبار|project|مشروع)/i.test(text)) return 4;
  if (['Engineering','University','Fitness','English','Career'].includes(category)) return 3;
  return 2;
}

function inferQuestType(text, minutes, category, value = 2, impact = 2) {
  if (/(كل يوم|يومي|يوميا|يوميًا|daily|every day|each day)/i.test(text)) return 'Daily Quest';
  if (category === 'University' && /(midterm|final|exam|اختبار|فاينل|ميد)/i.test(text) && minutes >= 300) return 'Boss Quest';
  if (/(finals|فاينلز|boss|capstone defense|graduation defense|مناقشة مشروع التخرج|مشروع مصيري|showcase flagship delivery)/i.test(text)) return 'Boss Quest';
  if (/(semester|ترم كامل|over the year|خلال السنة|على مدار السنة|months|أشهر|ielts preparation|استعداد.*ايلتس|portfolio program|development program|campaign)/i.test(text)) return 'Campaign Quest';
  // Time alone should not inflate a normal project into a Boss. Bosses are multi-stage, high-consequence campaigns.
  if (minutes >= 6000 && value >= 4 && impact >= 4) return 'Campaign Quest';
  if (minutes >= 3000 && value >= 5 && impact >= 5 && /(exam|delivery|defense|final|اختبار|تسليم|مناقشة)/i.test(text)) return 'Boss Quest';
  if (minutes >= 180 || /(project|مشروع|course|دورة|prepare|تحضير|portfolio|بورتفوليو|build|ابني|أبني)/i.test(text)) return 'Main Quest';
  return 'Side Quest';
}

function inferDifficulty(text, minutes, type) {
  if (/(extremely hard|صعب جدا|صعب جدًا|advanced|متقدم جدا|متقدم جدًا|research-grade|احترافي جدا)/i.test(text) || minutes >= 3000) return 'S';
  if (type === 'Boss Quest' || type === 'Campaign Quest' || minutes >= 1200 || /(advanced|متقدم|complex|معقد)/i.test(text)) return 'A';
  if (minutes >= 360 || /(prototype|مشروع|project|exam|اختبار)/i.test(text)) return 'B';
  if (minutes >= 120 || /(design|تصميم|repair|اصلح|أصلح|study|مذاكر)/i.test(text)) return 'C';
  if (minutes >= 30) return 'D';
  return 'E';
}

function detectAntiFarm(text, minutes, value, impact) {
  if (/(open laptop|فتح اللابتوب|drink water|اشرب موية|brush teeth|فرش اسنان|charge phone|شحن الجوال|put shoes|لبس الشراب|check phone|افتح الجوال)/i.test(text)) return { flag:true, reason:'Tiny routine action detected; reward capped to protect progression integrity.' };
  if (minutes <= 10 && value <= 1 && impact <= 1) return { flag:true, reason:'Very short, low-impact task; XP intentionally reduced.' };
  return { flag:false, reason:'' };
}

function calculateReward(q) {
  const minutes = clamp(Number(q.estimatedMinutes || 60),5,100000);
  const priorityFactor = {Low:.72,Medium:1,High:1.28,Critical:1.48}[q.priority] || 1;
  const difficultyFactor = {E:.58,D:.82,C:1.05,B:1.38,A:1.82,S:2.4}[q.difficulty] || .82;
  const typeFactor = {'Daily Quest':.62,'Side Quest':.9,'Main Quest':1.62,'Campaign Quest':2.25,'Boss Quest':4.1}[q.questType] || .9;
  const longTermFactor = .82 + clamp(Number(q.longTermValue || 2),1,5)*.17;
  const impactFactor = .82 + clamp(Number(q.impactScore || 2),1,5)*.16;
  const effort = 18 + 22*Math.min(7.5,Math.sqrt(minutes/25));
  const cap = {'Daily Quest':180,'Side Quest':550,'Main Quest':3500,'Campaign Quest':8000,'Boss Quest':18000}[q.questType] || 550;
  const antiFarm = detectAntiFarm(q.title || '',minutes,q.longTermValue || 2,q.impactScore || 2);
  const antiFarmCap = q.questType === 'Daily Quest' ? 25 : 18;
  let raw=effort*priorityFactor*difficultyFactor*typeFactor*longTermFactor*impactFactor;
  if(antiFarm.flag) raw=Math.min(raw*.35,antiFarmCap);
  return { xp:clamp(Math.round(raw/5)*5,3,cap), cap, antiFarmCap, antiFarm };
}

function buildStatImpact(primary, secondary) {
  const impact = Object.fromEntries([...CATEGORIES,'Discipline'].map(k => [k,0]));
  if (secondary && secondary !== primary) { impact[primary]=.68; impact[secondary]=.24; impact.Discipline=.08; }
  else { impact[primary]=.92; impact.Discipline=.08; }
  return impact;
}

function suggestSubquests(text, q, language='English') {
  const ar=language==='Arabic';
  if (q.questType === 'Side Quest') {
    if (/(plumbing|سباكة|toilet|bathroom|حمام|تسريب|leak)/i.test(text)) return ar ? ['حدد مصدر المشكلة بدقة','جهز الأدوات أو قطعة الاستبدال المناسبة','نفذ الإصلاح بأمان','أعد التشغيل واختبر العمل الطبيعي','تحقق مرة أخيرة من عدم وجود تسريب أو تكرار للمشكلة'] : ['Identify the exact source of the problem','Prepare the correct tools or replacement part','Make the repair safely','Restore the system and test normal operation','Check again for leaks or repeat failure'];
    if (q.category === 'Home') return ar ? ['جهز ما تحتاجه','نفذ المهمة العملية','اختبر النتيجة ورتب المكان'] : ['Prepare what you need','Complete the practical task','Test the result and clean up'];
    return [];
  }
  if (q.category === 'University') return ar ? ['حدد نطاق المادة أو الاختبار بدقة','ذاكر المحتوى الأساسي بطريقة نشطة','حل مسائل أو أسئلة ممثلة','حدد الأخطاء والمفاهيم الضعيفة','كرر النقاط الضعيفة بدون الاعتماد على الملاحظات','نفذ جلسة استرجاع أو تدريب محددة','أنهِ المراجعة النهائية'] : ['Define the exact exam/course scope','Study the core material actively','Solve representative problems','Mark mistakes and weak concepts','Repeat weak areas without notes','Run a timed practice / recall session','Complete the final review'];
  if (q.category === 'Engineering') {
    const steps = ar ? ['حدد المشكلة الهندسية ومعايير النجاح القابلة للقياس'] : ['Define the engineering problem and measurable success criteria'];
    if (/(energy|طاقة|thermal|حرار|heat|power plant|باور بلانت|pump|مضخ|turbine|توربين)/i.test(text)) steps.push(...(ar?['راجع النظرية الحرارية أو الطاقية وحدد المتغيرات القابلة للقياس','نفذ الحسابات الهندسية الأولية وحدد خط الأساس النظري']:['Research the relevant energy/thermal theory and choose measurable variables','Do the first engineering calculations and establish a theoretical baseline']));
    else steps.push(ar?'راجع القيود والمراجع وحدد النهج الهندسي':'Research constraints, references, and the engineering approach');
    steps.push(ar?'حدد معمارية النظام والمكونات وقائمة المواد':'Define the system architecture, components, and bill of materials');
    if (/(cad|solidworks|onshape|تصميم|design)/i.test(text)) steps.push(ar?'أنشئ تصميم CAD بالأبعاد والواجهات وقابلية التصنيع':'Create the CAD design with dimensions, interfaces, and manufacturability in mind');
    if (/(sensor|sensors|حساس|حساسات|arduino|esp32|electronics|الكترون)/i.test(text)) steps.push(ar?'اختر الحساسات والإلكترونيات وحدد خطة القياس وجمع البيانات':'Select sensors/electronics and define the measurement/data-acquisition plan');
    if (/(3d print|3d printing|طباعة ثلاث|print|اطبع|أطبع)/i.test(text)) steps.push(ar?'صنّع Prototype V1 وسجل إعدادات الطباعة أو التصنيع':'Fabricate Prototype V1 and record print/manufacturing settings');
    else steps.push(ar?'ابنِ Prototype V1':'Build Prototype V1');
    steps.push(...(ar?['ادمج النظام ونفذ أول اختبار مضبوط','سجل القياسات والأعطال والسلوك غير المتوقع','حلل النتائج مقارنة بالهدف النظري','عدّل نقاط الضعف وابنِ أو اختبر V2','تحقق من النتيجة النهائية بأدلة قابلة للتكرار']:['Integrate the system and run the first controlled test','Record measurements, failures, and unexpected behavior','Analyze results against the theoretical target','Redesign the weak points and build/test V2','Validate the final result with repeatable evidence']));
    if (/(github|قيتهب|readme|repo|repository)/i.test(text)) steps.push(ar?'وثق المشروع التقني كاملًا على GitHub':'Document the complete technical project on GitHub');
    if (/(twitter|تويتر|x\b)/i.test(text)) steps.push(ar?'انشر تحديثًا مختصرًا عن البناء أو التقدم على X':'Publish a concise build/progress update on X');
    if (/(linkedin|لنكد)/i.test(text)) steps.push(ar?'انشر القصة الهندسية المهنية النهائية على LinkedIn':'Publish the final professional engineering story on LinkedIn');
    if (/(website|موقعي|portfolio site)/i.test(text)) steps.push(ar?'أضف المشروع للموقع الشخصي إذا وصل لمستوى عرض قوي':'Add the project to the personal website if it meets showcase quality');
    return steps.slice(0,16);
  }
  if (q.category === 'English') return ar ? ['حدد هدفًا قابلًا للقياس للغة','نفذ تدريب إدخال مركز','نفذ تدريب إخراج مركز','راجع الأخطاء وحدد نقاط الضعف','كرر أضعف مهارة','نفذ تقييمًا تجريبيًا','سجل النتيجة والهدف التالي'] : ['Set a measurable English target','Complete focused input practice','Complete focused output practice','Review errors and build a weak-point list','Repeat the weakest skill','Run a mock assessment','Record the score and next target'];
  if (q.category === 'Career') return ar ? ['حدد النتيجة المهنية المطلوبة','اجمع الأدلة والمصادر','اكتب أقوى نسخة أولية','راجع الوضوح والدقة والأدلة','انشر أو سلّم','احفظ الرابط أو النتيجة النهائية'] : ['Define the professional outcome','Collect evidence and source material','Draft the strongest version','Review clarity, accuracy, and proof','Publish / submit','Archive the final link and result'];
  if (q.category === 'Fitness') return ar ? ['حدد هدف الجلسة','نفذ العمل الرئيسي','سجل الأداء','راجع التقدم'] : ['Define the session goal','Complete the main work','Record performance','Review progression'];
  return ar ? ['حدد معنى الإنجاز بوضوح','نفذ أول جزء مركز','راجع التقدم','أنهِ الهدف','سجل النتيجة'] : ['Define what “done” means','Complete the first focused block','Review progress','Finish the objective','Record the result'];
}

function buildRationale(q, antiFarm, language='English') {
  if(language==='Arabic'){
    const primary=categoryLabel(q.category,'Arabic');
    const secondary=q.secondaryCategory?` مع ارتباط ثانوي بـ${categoryLabel(q.secondaryCategory,'Arabic')}`:'';
    const minutes=Number(q.estimatedMinutes||0);
    const duration=minutes<60?`${minutes} دقيقة`:minutes%60===0?`${Math.round(minutes/60)} ساعة`:`${Math.floor(minutes/60)} ساعة و${minutes%60} دقيقة`;
    const anti=antiFarm.flag?' تم تقليل XP لأن الإجراء صغير جدًا ليُحسب كتقدم كبير.':'';
    return `ترتبط المهمة أساسًا بـ${primary}${secondary}. تم تقدير نطاق العمل بحوالي ${duration} مع مراعاة الاستعجال والأثر طويل المدى.${anti}`;
  }
  const secondary = q.secondaryCategory ? ` with secondary ${q.secondaryCategory} value` : '';
  const anti = antiFarm.flag ? ' XP was reduced because the action is too small to represent major progression.' : '';
  return `Primary purpose is ${q.category}${secondary}. It is treated as a ${q.questType} because of its scope (${formatMinutes(q.estimatedMinutes)}), urgency, and long-term impact.${anti}`;
}

function createSmartTitle(text, category, questType, language='English') {
  const t = text.trim(); const ar=language==='Arabic';
  if (/(predictive maintenance)/i.test(t)) return ar?'بناء منصة اختبار للصيانة التنبؤية':'Build Predictive Maintenance Test Rig';
  if (/(plumbing|سباكة|toilet|bathroom|حمام|تسريب|leak)/i.test(t)) return ar?'إصلاح مشكلة السباكة المنزلية':'Repair Home Plumbing Issue';
  if (category === 'University' && /(thermodynamics|ديناميكا حرارية|ثيرمو)/i.test(t)) return /(midterm|ميد|اختبار|exam)/i.test(t) ? (ar?'الاستعداد لاختبار الديناميكا الحرارية':'Prepare for Thermodynamics Exam') : (ar?'مذاكرة الديناميكا الحرارية':'Study Thermodynamics');
  if (/(ielts|ايلتس)/i.test(t)) return /(mock|تجريبي)/i.test(t) ? (ar?'تنفيذ اختبار IELTS تجريبي':'Complete IELTS Mock Test') : (ar?'التقدم في الاستعداد لـ IELTS':'Advance IELTS Preparation');
  if (category === 'Engineering' && /(energy|طاقة|thermal|حرار|power plant|باور بلانت)/i.test(t)) {
    if (/(sensor|sensors|حساس|حساسات)/i.test(t) && /(cad|3d print|3d printing|طباعة)/i.test(t)) return ar?'بناء نموذج هندسي ذكي للطاقة':'Build Smart Energy Engineering Prototype';
    return ar?'بناء مشروع هندسي للطاقة':'Build Energy Engineering Project';
  }
  if (category === 'Engineering' && /(robot|روبوت)/i.test(t)) return ar?'بناء واختبار مشروع روبوتي':'Build and Validate Robotics Project';
  if (category === 'Career' && /(linkedin|لنكد)/i.test(t)) return ar?'نشر تحديث مهني على LinkedIn':'Publish Professional LinkedIn Update';
  if (category === 'Home' && /(تسريب|leak)/i.test(t)) return ar?'إصلاح تسريب المياه المنزلي':'Repair Household Water Leak';
  let cleaned=t.replace(/^(بكره|بكرة|غدا|غداً|اليوم|today|tomorrow)\s*/i,'').replace(/^(لازم|احتاج|أحتاج|ابي|أبي|ابغا|أبغا|i need to|i have to|i want to)\s*/i,'').trim();
  cleaned=cleaned.split(/(?:،|,|\.|؛|;|\s+وبعدين\s+|\s+وبعدها\s+)/)[0].trim();
  cleaned=cleaned.replace(/[.!؟]+$/,'').trim();
  if(cleaned.length>68) cleaned=cleaned.slice(0,65)+'…';
  const cleanedArabic=(cleaned.match(/[\u0600-\u06FF]/g)||[]).length;
  const cleanedLatin=(cleaned.match(/[A-Za-z]/g)||[]).length;
  if(ar&&cleaned&&cleanedArabic===0&&cleanedLatin>0)return `مهمة في ${categoryLabel(category,'Arabic')}`;
  if(!ar&&cleaned&&cleanedArabic>cleanedLatin)return `${category} Objective`;
  return cleaned || (ar?(questType==='Boss Quest'?'هدف رئيسي كبير':questType==='Campaign Quest'?'مسار طويل المدى':'مهمة جديدة'):(questType === 'Boss Quest' ? 'Major Objective' : questType === 'Campaign Quest' ? 'Long-Term Campaign' : 'New Quest'));
}

function inferConfidence(ordered) {
  const first=ordered[0]?.[1]||0, second=ordered[1]?.[1]||0;
  if(first===0)return .55;
  return clamp(.68 + Math.min(.27,(first-second)*.035 + first*.012),.55,.96);
}

function normalizeDigits(text) {
  const arabic='٠١٢٣٤٥٦٧٨٩', eastern='۰۱۲۳۴۵۶۷۸۹';
  return String(text).replace(/[٠-٩]/g,d=>arabic.indexOf(d)).replace(/[۰-۹]/g,d=>eastern.indexOf(d));
}
function dateKey(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function daysFromToday(date){const [y,m,d]=date.split('-').map(Number);const target=new Date(y,m-1,d);const today=new Date();today.setHours(0,0,0,0);return Math.round((target-today)/86400000);}
function daysBetweenDates(fromDate,toDate){const [fy,fm,fd]=fromDate.split('-').map(Number),[ty,tm,td]=toDate.split('-').map(Number);return Math.round((Date.UTC(ty,tm-1,td)-Date.UTC(fy,fm-1,fd))/86400000);}
function formatMinutes(minutes){minutes=Math.round(minutes);if(minutes<60)return `${minutes}m`;const h=Math.floor(minutes/60),m=minutes%60;if(h<24)return m?`${h}h ${m}m`:`${h}h`;const d=Math.floor(h/24),rh=h%24;return rh?`${d}d ${rh}h`:`${d}d`;}
function clamp(n,min,max){return Math.min(max,Math.max(min,Number(n)||0));}


const projectPlanSchema = {
  type:'object', properties:{
    title:{type:'string'}, category:{type:'string',enum:CATEGORIES}, difficulty:{type:'string',enum:['C','B','A','S']},
    outcome:{type:'string'}, dueDate:{type:'string'}, impact:{type:'integer',minimum:1,maximum:5},
    requiredQuests:{type:'array',minItems:2,maxItems:12,items:{type:'object',properties:{title:{type:'string'},purpose:{type:'string'},subquests:{type:'array',minItems:2,maxItems:10,items:{type:'string'}}},required:['title','purpose','subquests']}},
    optionalQuests:{type:'array',maxItems:5,items:{type:'object',properties:{title:{type:'string'},purpose:{type:'string'},subquests:{type:'array',maxItems:8,items:{type:'string'}}},required:['title','purpose','subquests']}},
    finalQuest:{type:'string'}, rationale:{type:'string'}
  }, required:['title','category','difficulty','outcome','dueDate','impact','requiredQuests','optionalQuests','finalQuest','rationale']
};
async function projectPlanWithGemini(text, context){
  const today=context.localDate||dateKey(new Date());
  const responseLanguage=requestedOutputLanguage(text);
  const systemInstruction=`You are ASCEND's Project Architect. Today is ${today}. Convert ONE ambitious outcome into a serious project hierarchy.
OUTPUT LANGUAGE CONTRACT: All user-visible prose (title, outcome, required/optional quest titles, purposes, subquests, finalQuest and rationale) MUST be in ${responseLanguage}. Do not translate an Arabic objective to English unless the user explicitly asks for English. Technical product names/acronyms may remain unchanged.
A Project is an outcome that needs multiple major workstreams. Required Quests are substantial independent workstreams; they are NOT tiny checklist items. For every required quest, propose 3-8 concrete subquests that make that workstream executable and testable.
Use 3-8 required quests normally, up to 12 only for genuinely large programs. Put nice-to-have work in optionalQuests. finalQuest must be a real integration/validation/delivery step that should remain locked until required quests are complete.
Do not inflate difficulty. S means unusually difficult, long, multidisciplinary, or high-consequence. Preserve the user's dominant language. Resolve explicit dates to ISO YYYY-MM-DD; otherwise dueDate=''. Never invent credentials, awards, users, hardware, deadlines, or achievements.
Category is WHY the project matters most using: ${CATEGORIES.join(', ')}. Context: ${JSON.stringify(context)}. Return schema-compliant JSON only.`;
  const parsed=await geminiJson({input:`Architect this project:\n${text}`,systemInstruction,schema:projectPlanSchema,maxOutputTokens:3500,thinkingLevel:'medium',models:[GEMINI_DEEP_MODEL,GEMINI_FAST_MODEL]});
  const explicit=inferDueDateFromText(text,today); if(explicit) parsed.dueDate=explicit; if(!/^20\d\d-\d\d-\d\d$/.test(String(parsed.dueDate||'')))parsed.dueDate=''; return parsed;
}
function localProjectPlan(text,context={}){
  const classified=localClassify(text,context);const category=classified.category;const language=requestedOutputLanguage(text);const ar=language==='Arabic';const dueDate=inferDueDateFromText(text,context.localDate||dateKey(new Date()))||'';
  const requiredQuests=ar?[
    {title:'تحديد المتطلبات ومعايير النجاح',purpose:'تثبيت الهدف قبل التنفيذ.',subquests:['حدد النتيجة النهائية','اكتب القيود الأساسية','حدد معايير نجاح قابلة للقياس']},
    {title:'تصميم معمارية الحل',purpose:'اختيار النهج العام للنظام.',subquests:['قسّم النظام إلى وحدات رئيسية','حدد الواجهات والاعتماديات','راجع المعمارية مقابل المتطلبات']},
    {title:'بناء النسخة المتكاملة الأولى',purpose:'إنتاج نسخة كاملة قابلة للاختبار.',subquests:['جهز المكونات أو الأصول المطلوبة','ابنِ النسخة المتكاملة الأولى','سجل مشاكل التنفيذ']},
    {title:'الاختبار والقياس والتكرار',purpose:'التحقق من النتيجة وتصحيح نقاط الضعف.',subquests:['أنشئ اختبارًا قابلًا للتكرار','سجل النتائج القابلة للقياس','أصلح أعلى نقطة ضعف أثرًا','أعد اختبار النسخة المحسنة']},
    {title:'توثيق النتيجة النهائية',purpose:'حفظ الأدلة والقرارات المهمة.',subquests:['احفظ الأدلة النهائية','وثق القرارات والنتائج الرئيسية','جهز التوثيق النهائي']}
  ]:[
    {title:'Define requirements and success criteria',purpose:'Lock the target before execution.',subquests:['Define the final outcome','List hard constraints','Define measurable success criteria']},
    {title:'Design the solution architecture',purpose:'Choose the major system approach.',subquests:['Break the system into major modules','Choose interfaces and dependencies','Review the architecture against requirements']},
    {title:'Build the first complete implementation',purpose:'Create a working integrated version.',subquests:['Prepare the required components/assets','Build the first integrated version','Record implementation issues']},
    {title:'Test, measure and iterate',purpose:'Validate the result and correct weaknesses.',subquests:['Create a repeatable test','Record measurable results','Fix the highest-impact weakness','Retest the improved version']},
    {title:'Document the final outcome',purpose:'Preserve evidence and decisions.',subquests:['Capture final evidence','Write key decisions and results','Package the final documentation']}
  ];
  return {title:createSmartTitle(text,category,'Main Quest',language),category,difficulty:'B',outcome:text.slice(0,220),dueDate,impact:3,requiredQuests,optionalQuests:[],finalQuest:ar?'الدمج النهائي والتحقق والتسليم':'Final integration, validation and delivery',rationale:ar?'تم استخدام معمارية مشروع محلية محافظة لأن الذكاء الدلالي غير متاح.':'Conservative local project architecture used because semantic AI was unavailable.'};
}


const impactAuditSchema={type:'object',properties:{eligible:{type:'boolean'},creditPercent:{type:'number',minimum:0,maximum:.01},score:{type:'integer',minimum:0,maximum:100},evidenceQuality:{type:'string',enum:['Insufficient','Weak','Moderate','Strong','Exceptional']},reason:{type:'string'}},required:['eligible','creditPercent','score','evidenceQuality','reason']};
async function impactAuditWithGemini(project,quests,evidence){
  const systemInstruction=`You are ASCEND's Exceptional Impact Auditor. Be severe, skeptical and non-motivational. S-Rank time credit is rare and never a reward for merely finishing a normal difficult project.
Audit only objective evidence present in the supplied data. Self-assertions such as "amazing", "helped my country", "professional", "used by many" without concrete evidence must be treated as unsupported. Ordinary coursework, hobby builds, standard portfolio projects, normal internships, certificates, task volume, long hours, or high self-rated difficulty normally receive ZERO.
Credit requires unusually strong external or measurable impact such as independently validated technical results, real deployment with meaningful beneficiaries, strong research/publication/review, major competition/award, significant production adoption, measurable organizational/public value, or equivalent proof. Strong technical difficulty alone is insufficient.
Use eligible=true only with Strong or Exceptional evidence quality AND score >=85. creditPercent must be exactly 0, 0.0025, 0.005, 0.0075, or 0.01. A single project can never exceed 1%; the client enforces a 5% lifetime cap. When uncertain, award zero. Return schema JSON only.`;
  return geminiJson({input:`PROJECT:\n${JSON.stringify(project)}\n\nCOMPLETED QUEST HISTORY:\n${JSON.stringify(quests)}\n\nUSER-SUPPLIED EVIDENCE:\n${evidence||'(none provided)'}`,systemInstruction,schema:impactAuditSchema,maxOutputTokens:900,thinkingLevel:'high',models:[GEMINI_DEEP_MODEL,GEMINI_FAST_MODEL]});
}
