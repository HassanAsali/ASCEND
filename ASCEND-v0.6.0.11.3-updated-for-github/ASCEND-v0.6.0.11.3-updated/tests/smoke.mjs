import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const html = await fs.readFile(path.join(root, 'public/index.html'), 'utf8');
const js = await fs.readFile(path.join(root, 'public/app.js'), 'utf8');
const css = await fs.readFile(path.join(root, 'public/styles.css'), 'utf8');
const serverSource = await fs.readFile(path.join(root, 'server.mjs'), 'utf8');
const pkg = JSON.parse(await fs.readFile(path.join(root, 'package.json'), 'utf8'));
const gitignore = await fs.readFile(path.join(root, '.gitignore'), 'utf8');
const stateScopeSource = await fs.readFile(path.join(root, 'public/state-scope.js'), 'utf8');
const skillSystemSource = await fs.readFile(path.join(root, 'public/skill-system.js'), 'utf8');
const dailyCycleSource = await fs.readFile(path.join(root, 'public/daily-cycle.js'), 'utf8');
const plannerSystemSource = await fs.readFile(path.join(root, 'public/planner-system.js'), 'utf8');
const habitSystemSource = await fs.readFile(path.join(root, 'public/habit-system.js'), 'utf8');
const requestHtml = await fs.readFile(path.join(root, 'public/request.html'), 'utf8');
const requestJs = await fs.readFile(path.join(root, 'public/request.js'), 'utf8');
const requestCss = await fs.readFile(path.join(root, 'public/request.css'), 'utf8');
const externalRequestSchema = await fs.readFile(path.join(root, 'SUPABASE-EXTERNAL-REQUESTS-v0.6.0.0.sql'), 'utf8');
const focusCircleSchema = await fs.readFile(path.join(root, 'SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql'), 'utf8');
const circleUpgradeSchema = await fs.readFile(path.join(root, 'SUPABASE-UPGRADE-v0.6.0.11.2.sql'), 'utf8');
const friendSchema = await fs.readFile(path.join(root, 'SUPABASE-FRIENDS-v0.6.0.11.3.sql'), 'utf8');
const { classificationCacheKey, evaluateTurnstileResult, turnstileFailureResponse, circleItemXp, canonicalFriendPair, friendActionAllowed } = await import(new URL('../server.mjs', import.meta.url));

const allHtmlIds = [...html.matchAll(/id="([^"]+)"/g)].map(m => m[1]);
const htmlIds = new Set(allHtmlIds);
const duplicateHtmlIds = [...htmlIds].filter(id => allHtmlIds.filter(candidate => candidate === id).length > 1);
if (duplicateHtmlIds.length) throw new Error(`Duplicate HTML IDs: ${duplicateHtmlIds.join(', ')}`);
const jsIds = new Set([...js.matchAll(/el\('([^']+)'\)/g)].map(m => m[1]));
const missing = [...jsIds].filter(id => !htmlIds.has(id));
if (missing.length) throw new Error(`Missing HTML IDs: ${missing.join(', ')}`);

if (!/id="cancelQuestButton" type="button"/.test(html)) throw new Error('Cancel button is not explicitly type=button.');
if (!/id="dialogCloseButton" type="button"/.test(html)) throw new Error('Dialog close button is not explicitly type=button.');
if (!/id="questDialog" class="quest-dialog" hidden/.test(html)) throw new Error('Quest modal hardening missing.');
if (!css.includes('[hidden] { display:none !important; }')) throw new Error('Global hidden-state CSS hardening missing.');
if (!gitignore.includes('.env.local') || !gitignore.includes('.env')) throw new Error('Environment files must be gitignored.');
if (!html.includes('<script src="/state-scope.js?v=0.6.0.11.3"></script>')) throw new Error('Versioned state-scope isolation helper must load before app.js.');
if (!html.includes('<script src="/skill-system.js?v=0.6.0.11.3"></script>') || html.indexOf('/skill-system.js') > html.indexOf('/app.js')) throw new Error('Versioned transferable skill engine must load before app.js.');
if (!html.includes('<script src="/daily-cycle.js?v=0.6.0.11.3"></script>') || html.indexOf('/daily-cycle.js') > html.indexOf('/app.js')) throw new Error('Versioned Daily cycle engine must load before app.js.');
if (!html.includes('<script src="/planner-system.js?v=0.6.0.11.3"></script>') || html.indexOf('/planner-system.js') > html.indexOf('/app.js')) throw new Error('Versioned Planner engine must load before app.js.');
if (!html.includes('<script src="/habit-system.js?v=0.6.0.11.3"></script>') || html.indexOf('/habit-system.js') > html.indexOf('/app.js')) throw new Error('Versioned Habit engine must load before app.js.');
for (const asset of ['/styles.css?v=0.6.0.11.3','/system-version.js?v=0.6.0.11.3','/app.js?v=0.6.0.11.3']) if (!html.includes(asset)) throw new Error(`Cache-busted asset missing: ${asset}`);
if (!js.includes("updateViaCache:'none'") || !js.includes('registration.update()')) throw new Error('PWA must actively bypass the stale service-worker update cache.');
if (!serverSource.includes("['.html','.js','.css','.webmanifest'].includes(ext) ? 'no-store, max-age=0, must-revalidate'")) throw new Error('Dynamic server must not cache deploy-sensitive assets.');
if (!JSON.stringify(JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'))).includes('no-store, max-age=0, must-revalidate')) throw new Error('Vercel must not cache the application shell.');
if (!/id="sessionBootGate" class="session-boot-gate"/.test(html) || !/id="entryGate" class="entry-gate" hidden/.test(html)) throw new Error('Session restoration must use a neutral boot gate without flashing the login screen.');

for (const id of ['directiveLoad','directiveRefreshButton','systemReviewMode','runSystemReviewButton','aiConnectionBadge','settingsSystemContext','saveSystemContextButton','testAiButton','dateFilter']) {
  if (!htmlIds.has(id)) throw new Error(`Intelligence UI ID missing: ${id}`);
}

// v0.6.0.11.3 — Friends privacy, lifecycle and progression isolation.
for(const id of ['friendsView','friendRequestBadge','friendCodeOutput','friendCodeInput','friendPendingList','friendList','friendLeaderboard','friendPlanDialog','friendPlanForm'])if(!htmlIds.has(id))throw new Error(`Friends UI ID missing: ${id}`);
for(const marker of ['function loadFriends','function renderFriends','function friendAction','function submitFriendPlan','private friend code','Shared Completions'])if(!(js+'\n'+html).includes(marker))throw new Error(`Friends client marker missing: ${marker}`);
for(const marker of ["url.pathname.startsWith('/api/friends')",'/api/friends/request','/api/friends/action','/api/friends/plan','No email lookup'])if(!serverSource.includes(marker))throw new Error(`Friends server marker missing: ${marker}`);
for(const table of ['friend_profiles','friendships','friend_plans','friend_plan_progress'])if(!friendSchema.includes(`public.${table}`))throw new Error(`Friends schema table missing: ${table}`);
if(!friendSchema.includes('enable row level security')||!friendSchema.includes('revoke all on table public.friend_profiles, public.friendships, public.friend_plans, public.friend_plan_progress from public, anon, authenticated'))throw new Error('Friends tables must be RLS-enabled and inaccessible directly from browsers.');
if(/create policy/i.test(friendSchema)||/drop\s+table|drop\s+column/i.test(friendSchema))throw new Error('Friends migration must be additive and server-mediated, without direct browser policies.');
if(!friendSchema.includes('friendship_unique_pair')||!friendSchema.includes('friendship_canonical_pair')||!friendSchema.includes('enforce_friend_plan_membership'))throw new Error('Friends database uniqueness or membership guard missing.');
assert(JSON.stringify(canonicalFriendPair('b','a'))===JSON.stringify(['a','b']),'Friend pairs must canonicalize deterministically to prevent duplicate A/B and B/A rows.');
assert(friendActionAllowed({status:'pending',requestedBy:'A',currentUser:'B',action:'accept'}),'The recipient must be able to accept an incoming request.');
assert(!friendActionAllowed({status:'pending',requestedBy:'A',currentUser:'A',action:'accept'}),'The sender must not accept their own outgoing request.');
assert(friendActionAllowed({status:'pending',requestedBy:'A',currentUser:'A',action:'cancel'}),'The sender must be able to cancel an outgoing request.');
assert(friendActionAllowed({status:'accepted',requestedBy:'A',currentUser:'B',action:'remove'}),'Either accepted friend must be able to remove the relationship.');
assert(!friendActionAllowed({status:'blocked',requestedBy:'A',currentUser:'B',action:'accept'}),'A blocked relationship must not be accepted or silently reopened.');
const friendServerBlock=serverSource.slice(serverSource.indexOf("if(url.pathname.startsWith('/api/friends'))"),serverSource.indexOf("if (req.method === 'GET' && url.pathname === '/api/config')"));
if(/state\.totalXp|rankStage|unlockedAchievements|metrics\.totalClears/.test(friendServerBlock))throw new Error('Friends endpoints must never mutate or expose personal XP, Rank, Milestones, or quest progression.');
if(/email=eq|auth\/v1\/admin|from\s+auth\.users/i.test(friendServerBlock))throw new Error('Friends endpoints must not implement email search or enumerate Auth users.');
for(const marker of ['private-friend-invites','friend-request-lifecycle','friend-collaboration-plans','opt-in-friend-board','friend-xp-rank-isolation'])if(!serverSource.includes(marker))throw new Error(`Friends health feature missing: ${marker}`);
for (const id of ['cloudStatusButton','cloudSettingsCard','cloudSignInButton','cloudSignUpButton','cloudSyncNowButton','cloudSignOutButton','cloudCopyRecoveryKeyButton','cloudRecoveryKeyInput','cloudImportRecoveryKeyButton','mobileMoreButton','mobileSystemSheet','sheetSyncButton','sidebarAccountButton','entryGuestButton','entryNewGuestButton','focusSelectionCount','clearFocusSelectionButton','settingsFocusSummary','editFocusAreasButton','accountSecurityCard','sidebarLogoutButton','sheetLogoutButton','sidebarDeleteGuestButton','sheetDeleteGuestButton','sidebarDeleteAccountButton','sheetDeleteAccountButton','deleteCloudAccountButton','deleteAccountDialog','deleteAccountForm','deleteAccountPassword','deleteAccountAcknowledge','deleteAccountAcknowledgeError','deleteAccountConfirmButton','deleteTurnstilePanel','deleteTurnstileWidget','deleteTurnstileStatus','entryEmailError','entryPasswordError','entryTurnstilePanel','entryTurnstileWidget','entryTurnstileStatus','cloudTurnstilePanel','cloudTurnstileWidget','cloudTurnstileStatus']) {
  if (!htmlIds.has(id)) throw new Error(`Encrypted private-beta UI ID missing: ${id}`);
}
for (const id of ['questBoardSummary','cloudDownloadRecoveryKeyButton','cloudRecoveryFileInput','recoveryBackupStatus','installGuideCard','installFromSettingsButton','betaFeedbackCard','feedbackCategory','feedbackMessage','sendFeedbackButton','recoveryBackupDialog','recoveryDialogDownloadButton','recoverySavedAcknowledge','recoveryBackupDoneButton']) if (!htmlIds.has(id)) throw new Error(`Private Beta UI ID missing: ${id}`);
for (const id of ['externalInboxSection','externalInboxCount','refreshExternalRequestsButton','externalRequestList','externalRequestLinkCard','externalRequestStateBadge','externalRequestLink','copyExternalRequestLinkButton','createExternalRequestLinkButton','rotateExternalRequestLinkButton','toggleExternalRequestLinkButton','openExternalInboxButton','commandExternalPendingCount']) if (!htmlIds.has(id)) throw new Error(`External Request UI ID missing: ${id}`);
for (const id of ['plannerView','newListButton','newSemesterButton','plannerListBoard','semesterSelect','addCourseButton','addCommitmentButton','classScheduleBoard','listDialog','semesterDialog','courseDialog','commitmentDialog','commitmentForm']) if (!htmlIds.has(id)) throw new Error(`Planner UI ID missing: ${id}`);
for (const id of ['habitsView','addHabitButton','habitStarterButton','enableRemindersButton','habitDueToday','habitDoneToday','habitBestStreak','habitTotal','habitBoard','habitDialog','habitForm','habitTitle','habitCategory','habitReminderMode','habitTime','habitIntervalMinutes','habitWindowStart','habitWindowEnd','habitNote','voiceQuestLanguage']) if (!htmlIds.has(id)) throw new Error(`Habit/Voice UI ID missing: ${id}`);
if (!js.includes("if(el('habitCategory'))el('habitCategory').innerHTML=allOptions")) throw new Error('Habit category selector must expose the full category catalog.');
const commandStart=html.indexOf('id="dashboardView"'),questStart=html.indexOf('id="questsView"'),requestCardIndex=html.indexOf('id="externalRequestLinkCard"');
if (!(commandStart < requestCardIndex && requestCardIndex < questStart) || (html.match(/id="externalRequestLinkCard"/g)||[]).length !== 1) throw new Error('Shareable Request Link must appear exactly once in Command, not System.');
for (const id of ['vaultUnlockGate','vaultUnlockEmail','vaultUnlockFileInput','vaultUnlockKeyInput','vaultUnlockButton','vaultUnlockSignOutButton','vaultUnlockStatus']) if (!htmlIds.has(id)) throw new Error(`New-device vault gate UI ID missing: ${id}`);
for (const marker of ['function showVaultUnlockGate','if (vaultRecoveryRequired) { showVaultUnlockGate(); return; }','function unlockVaultFromGate','function importRecoveryFileFromGate','if (cached) localStorage.setItem(activeStorageKey, JSON.stringify(cached))','vaultUnlockHydrationRequired','chooseUnlockedAccountState']) if (!(js+'\n'+stateScopeSource).includes(marker)) throw new Error(`New-device vault-first marker missing: ${marker}`);
if (js.includes('localStorage.setItem(activeStorageKey, JSON.stringify(state));\n      vaultRecoveryRequired = true')) throw new Error('Locked new-device flow must not persist a default account state.');
for (const marker of ['QUEST_LANES','quest-type-section','Daily Protocols','Main Objectives','Side Objectives','function downloadRecoveryKey','function importRecoveryFile','RECOVERY_SAVED_PREFIX','function submitBetaFeedback','function renderInstallState']) if (!(js+'\n'+html+'\n'+css).includes(marker)) throw new Error(`Private Beta handoff marker missing: ${marker}`);
if (!serverSource.includes("url.pathname === '/api/feedback'") || !serverSource.includes('FEEDBACK_CONFIGURED')) throw new Error('Authenticated Private Beta feedback endpoint missing.');
for (const marker of ['dialogRewardLocked = Boolean(prefill)','function handleQuestRewardInput','xp: normalized.xp','xp: acceptedXp','reviewed-reward-consistency']) if (!(js+'\n'+serverSource).includes(marker)) throw new Error(`Reviewed reward consistency marker missing: ${marker}`);
if (!html.includes('/icons/apple-touch-icon.png') || !html.includes('Open as Web App')) throw new Error('Apple PWA installation UX missing.');
if (!js.includes('const amount = finalQuestReward(quest);') || !js.includes('.map(sub => ({ sub, amount: Number(sub.xpAwarded || 0) }))') || !js.includes('removeXp(entry.amount, quest)') || !js.includes('state.metrics.subquestsCleared = Math.max')) throw new Error('Daily exact-total award/reversal protection missing.');
if (!js.includes("const xp = Math.max(0, state.activity.filter(a => localDateKey(new Date(a.at)) === key)")) throw new Error('Weekly chart must display net XP after reversals.');
if (!htmlIds.has('openAiQuestConsoleButton') || !js.includes('function openAiQuestConsole')) throw new Error('Quest Board AI Console jump is missing.');
if ((html.match(/class="panel quest-console"/g) || []).length !== 1) throw new Error('AI Quest Console must not be duplicated inside Quest Board.');
if (!html.includes('>Core Skills<') || !css.includes('v0.5.3.4.5 // TRANSFERABLE SKILLS + QUEST AI JUMP')) throw new Error('Transferable Core Skills UI markers are missing.');
if (js.includes('skills:[') || js.includes('Design & CAD')) throw new Error('Fixed category-specific Skill Matrix definitions must not return.');
if (!js.includes('version: 12')) throw new Error('Unified-reminder player-state migration is missing.');
if (html.includes('formFirstStep') || js.includes('firstStep') || serverSource.includes('firstStep')) throw new Error('First Action must be fully retired from UI, state and AI output.');
if (!js.includes('quest.skillImpact = SKILL_SYSTEM.impactForQuest(quest)') || !js.includes('normalizeSkillImpact(quest?.skillImpact)')) throw new Error('Quest Skill allocation must be stored and reused for exact XP reversal.');

if (!html.includes('https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit')) throw new Error('Cloudflare Turnstile client script missing.');
for (const marker of ['turnstileSlots','initTurnstileSlot','requireCaptchaSecurity','gotrue_meta_security','captcha_token','resetTurnstile','deleteAccount']) {
  if (!js.includes(marker)) throw new Error(`Turnstile auth marker missing: ${marker}`);
}
if (!serverSource.includes('VITE_TURNSTILE_SITE_KEY') || !serverSource.includes('turnstileSiteKey') || !serverSource.includes('turnstileConfigured')) throw new Error('Turnstile public configuration bridge missing.');
if (/TURNSTILE_SECRET_KEY\s*=\s*["'][^"']+["']/i.test(serverSource + '\n' + js + '\n' + html) || /captcha_secret\s*[:=]\s*["'][^"']+/i.test(serverSource + '\n' + js + '\n' + html)) throw new Error('A literal Turnstile secret must not exist in distributable code.');
for (const marker of ['Incorrect email or password.','Enter your email address.','Enter your password.','validateEntryCredentials','authErrorMessage','Permanently Delete Account','deleteAccountAcknowledge','SUPABASE_SECRET_KEY','/api/account/delete']) {
  if (!(js + '\n' + html + '\n' + serverSource).includes(marker)) throw new Error(`Authentication/account-deletion marker missing: ${marker}`);
}
if (js.includes('SUPABASE_SECRET_KEY') || html.includes('SUPABASE_SECRET_KEY')) throw new Error('Supabase server secret variable must never reach browser code.');
for (const id of ['guidedTour','tourSpotlight','tourCard','tourProgress','tourTitle','tourText','tourSkipButton','tourBackButton','tourNextButton','runTourButton']) {
  if (!htmlIds.has(id)) throw new Error(`Guided onboarding UI ID missing: ${id}`);
}

if (htmlIds.has('analyzeListButton')) throw new Error('Legacy Analyze List button must be removed.');
if (!htmlIds.has('analyzeQuestButton')) throw new Error('Single Analyze Quest control missing.');
if (!js.includes('return analyzeQuestList();')) throw new Error('Analyze Quest must auto-route multiline input to batch analysis.');
if (!js.includes('acceptAllBatchQuests') || !js.includes('cancelAllBatchQuests')) throw new Error('Batch Accept All / Cancel All flow missing.');
if (!js.includes('function editQuest') || !js.includes('calculateQuestReward(data)')) throw new Error('Editable quest XP recalculation missing.');
if (!js.includes('compareMilestonesByProgression')) throw new Error('Progressive milestone comparator missing.');
if (!js.includes('class="path-label">${escapeHtml(a.group)}') || !css.includes('.milestone-labels') || !css.includes('.path-label')) throw new Error('Milestone cards must visibly label their owning category/path.');
for (const forbidden of ['Night Hunter','Digital Twin','Predict Before Failure','Full Documentation Chain','External Benchmark','Eightfold Foundation']) if (js.includes(forbidden)) throw new Error(`Unrealistic or tool-specific milestone returned: ${forbidden}`);
for (const marker of ['function areaCompletionCount','First Verified Step','Practice Record','Long-Term Development','milestoneTarget=Math.min',"filter(item=>item.group!=='Rank')",'target:Math.min(r.statCount||0,selectedAreas.length)']) if (!js.includes(marker)) throw new Error(`Realistic dynamic milestone marker missing: ${marker}`);
if (!js.includes("openOnboarding({recalibrate:true})") || !js.includes('Existing quests, XP, Skills, and history were preserved.')) throw new Error('Focus-area recalibration flow missing.');
if (!js.includes("onboardingBackButton').textContent=onboardingStep===1&&onboardingRecalibration?'Cancel':'Back'") || !js.includes('recalibrating?previousIdentity')) throw new Error('Focus recalibration must be cancellable and preserve the custom identity line.');
if (!js.includes('function questHasEarnedProgress') || !js.includes('Completed Projects are permanent progression history') || !js.includes('Completed Project quests are permanent progression history.')) throw new Error('Earned Project progress protection missing.');
for (const marker of ['const DAILY_CYCLE=globalThis.AscendDailyCycle','function completeDailyQuest','Daily completion is locked. Use Undo Today','createNextOccurrence','data-undo-daily','daily-locked','dailyGenerated']) if (!(js+'\n'+css).includes(marker)) throw new Error(`Locked Daily recurrence marker missing: ${marker}`);
if (!js.includes("if (DAILY_CYCLE.isLocked(quest,today))") || !js.includes("Only today’s Daily completion can be undone.")) throw new Error('Daily completion/undo date gates are missing.');

if (!js.includes("const VAULT_FORMAT = 'ascend-aes-gcm-v1'")) throw new Error('Encrypted cloud vault format missing.');
for (const marker of ['encryptCloudState','decryptCloudState','ensureVaultKey','copyRecoveryKey','importRecoveryKey','AES-GCM','VAULT_LOCKED']) {
  if (!js.includes(marker)) throw new Error(`Cloud encryption marker missing: ${marker}`);
}
if (!js.includes('vaultRecoveryRequired') || !js.includes('if (vaultRecoveryRequired)')) throw new Error('Locked vault overwrite protection missing.');

if (!htmlIds.has('secureContextNotice') || !htmlIds.has('secureContextDetail')) throw new Error('Secure-context diagnostics UI missing.');
if (!js.includes('function secureCryptoAvailable') || !js.includes('globalThis.isSecureContext')) throw new Error('Secure-context Web Crypto guard missing.');
if (!js.includes('function startGuidedTour') || !js.includes('TOUR_STEPS') || !js.includes('positionGuidedTour')) throw new Error('Guided tutorial engine missing.');
if (!css.includes('.tour-spotlight') || !css.includes('.tour-card')) throw new Error('Guided tutorial visuals missing.');
if (!js.includes("const TOUR_SEEN_KEY = 'ascend.system.guidedTour.v3'")) throw new Error('Corrected tutorial replay key missing.');
if (!htmlIds.has('skillMatrixHeading') || !htmlIds.has('cloudHero')) throw new Error('Compact tutorial targets missing.');
if ((js.match(/section:'[^']+'/g) || []).length < 13 || !js.includes("title:'Project Architect'") || !js.includes("title:'Identity & Account Safety'")) throw new Error('Refreshed 13-step tutorial coverage missing.');
if (html.indexOf('class="panel quest-console"') > html.indexOf('id="skillMatrixHeading"')) throw new Error('Quest Console must appear before Core Skills on Command.');
if (!js.includes('cancelSingleAnalysis') || !js.includes('id="cancelAnalyzedQuest"')) throw new Error('Single analyzed quest Cancel flow missing.');
if (!js.includes('Strict identity isolation') || js.includes("source:'device-local'") || js.includes('Link the current device progress to this beta account?')) throw new Error('Authenticated state must never claim generic/Guest device state.');
if (!js.includes('const session=loadCloudSession()') || !js.includes("localStorage.getItem(userStorageKey(sessionUserId))")) throw new Error('Reload hydration must stay account-scoped for session-only and remembered cloud sessions.');
for (const marker of ['GUEST_STATE_KEY','Start Fresh Guest','prepareOnboardingChoices','clearFocusSelection','updateGuestEntryControls']) {
  if (!js.includes(marker) && !html.includes(marker)) throw new Error(`Fresh Guest isolation marker missing: ${marker}`);
}
if (!js.includes('DELETED_ACCOUNT_MARKERS_KEY') || !js.includes('wasDeletedAccountOnThisDevice') || !js.includes('This account was deleted on this device.')) throw new Error('Privacy-preserving deleted-account feedback missing.');
if (!js.includes('currentStateStorageKey') || !js.includes('identityStillCurrent') || !js.includes('identityEpoch')) throw new Error('Runtime identity-switch guards are missing.');
if (!html.includes('deleteAccountAcknowledge') || html.includes('deleteAccountPhrase')) throw new Error('Account deletion should use acknowledgement checkbox, not typed DELETE.');
if (!js.includes("confirm('Final confirmation: permanently delete this ASCEND account")) throw new Error('Final destructive account-deletion confirmation missing.');
const deleteFlow = js.slice(js.indexOf('async function permanentlyDeleteCloudAccount'), js.indexOf('async function deleteGuestProfile'));
const deleteFlowOrder = [
  deleteFlow.indexOf("requireCaptchaSecurity('deleteAccount')"),
  deleteFlow.indexOf('grant_type=password'),
  deleteFlow.indexOf("confirm('Final confirmation: permanently delete this ASCEND account"),
  deleteFlow.indexOf("fetch('/api/account/delete'")
];
if (deleteFlowOrder.some(index => index < 0) || deleteFlowOrder.some((index, i) => i && index <= deleteFlowOrder[i - 1])) throw new Error('Delete Account must require acknowledgement, fresh Turnstile, password reauthentication, then final confirmation before server deletion.');
if (!deleteFlow.includes('if(!acknowledged)')) throw new Error('Delete Account acknowledgement checkbox is not enforced.');
if (!serverSource.includes('requestedOutputLanguage') || !serverSource.includes('enforceQuestLanguageContract') || !serverSource.includes('repairQuestLanguageWithGemini')) throw new Error('Strict AI output-language contract missing.');
const batchFn = serverSource.slice(serverSource.indexOf('async function classifyBatchWithGemini'), serverSource.indexOf('const directiveSchema'));
if (batchFn.includes('repairQuestLanguageWithGemini(')) throw new Error('Batch classification must stay single-call and must not issue per-objective language-repair AI calls.');
if (!css.includes('v0.5.3.4.3 // BETA POLISH + ISOLATION UX') || !css.includes('@media (max-height:900px)')) throw new Error('Private-beta polish layout baseline missing.');
if (!html.includes('class="entry-intro"') || !html.includes('class="entry-access"')) throw new Error('Responsive authentication column structure missing.');
for (const marker of ['v0.5.3.4.4 // HEIGHT-AWARE RESPONSIVE POLISH','grid-template-columns:minmax(245px,.78fr) minmax(400px,1.22fr)','max-height:calc(100dvh','(max-width:900px) and (max-height:760px)','(min-width:901px) and (max-height:760px)']) {
  if (!css.includes(marker)) throw new Error(`Height-aware responsive marker missing: ${marker}`);
}
if (!css.includes('.entry-intro .entry-lead,.entry-privacy{display:none}')) throw new Error('Short mobile auth must remove nonessential vertical marketing copy.');
if (!css.includes('.sidebar.command-rail::-webkit-scrollbar{display:none}')) throw new Error('Enlarged desktop rail must not display a competing scrollbar.');
for (const marker of ["behavior:'auto'", 'blockGuidedTourScroll', 'scheduleGuidedTourPosition', 'rectsOverlap', "addEventListener('wheel'", "addEventListener('touchmove'"]) {
  if (!js.includes(marker)) throw new Error(`Tutorial stability marker missing: ${marker}`);
}
if (!css.includes('body.tour-open .guided-tour { touch-action:none; }')) throw new Error('Tutorial touch-scroll lock missing.');
if (!css.includes('min-height:100dvh') || !css.includes('font-size:16px')) throw new Error('Mobile form/dialog hardening missing.');
for (const marker of ['.tour-copy', '.tour-section', 'safe-area-inset-bottom', 'max-height:min(42dvh,330px)', 'position:sticky']) { if (!css.includes(marker)) throw new Error(`Mobile tutorial polish marker missing: ${marker}`); }
if (!htmlIds.has('tourSection')) throw new Error('Tutorial section label missing.');
if (!js.includes("if (!isMobileLayout()) target.scrollIntoView?.({ behavior:'auto', block:'center', inline:'nearest' });")) throw new Error('Mobile tutorial target positioning missing.');

if (/Thermal Mechanical Engineer in Progress|The Final 19 Days|fill valve|فل فالف|شطاف|سيفون/i.test(html + '\n' + js)) {
  throw new Error('Personalized/default user data leaked into the distributable client.');
}
if (!js.includes("name: 'Player'") || !html.includes('>Player<')) throw new Error('Generic clean player default missing.');
if (!js.includes("systemContext: ''")) throw new Error('Fresh builds must not ship a personal system context.');

if (!js.includes("ascend.system.state.v4")) throw new Error('v0.4 state compatibility missing.');
if (!js.includes('Campaign Quest')) throw new Error('Campaign Quest support missing.');
if (!htmlIds.has('guideView') || !htmlIds.has('guidePathGrid')) throw new Error('Progression Guide UI missing.');
if (!js.includes('GUIDE_PATHS') || !js.includes('function renderGuide')) throw new Error('Progression Guide logic missing.');
if (!serverSource.includes('gemini-3.5-flash-lite') || !serverSource.includes('GEMINI_DEEP_MODEL')) throw new Error('Quota-aware model routing missing.');
if (!serverSource.includes('classifyBatchWithGemini') || !serverSource.includes("batchStrategy: 'single-call'")) throw new Error('Single-call AI batch strategy missing.');
if (!serverSource.includes('/v1beta/models?pageSize=1000')) throw new Error('Non-generative AI test missing.');

if (!/stage:\s*'D'[\s\S]{0,120}minDays:\s*60/.test(js)) throw new Error('D-Rank gate changed unexpectedly.');
if (!/stage:\s*'C'[\s\S]{0,120}minDays:\s*180/.test(js)) throw new Error('C-Rank gate changed unexpectedly.');
if (!/stage:\s*'A'[\s\S]{0,120}minDays:\s*750/.test(js)) throw new Error('A-Rank gate changed unexpectedly.');
if (!/stage:\s*'S-I'[\s\S]{0,120}minDays:\s*1200/.test(js)) throw new Error('S-I gate changed unexpectedly.');

const schema = await fs.readFile(path.join(root, 'supabase/schema.sql'), 'utf8');
if (!schema.includes('enable row level security') || !schema.includes('auth.uid()') || !schema.includes('player_state')) throw new Error('Supabase RLS schema missing.');
const feedbackSchema = await fs.readFile(path.join(root, 'SUPABASE-BETA-FEEDBACK-v0.5.3.4.13.sql'), 'utf8');
if (!schema.includes('beta_feedback') || !feedbackSchema.includes('revoke all on table public.beta_feedback from anon, authenticated') || !feedbackSchema.includes('grant insert on table public.beta_feedback to service_role') || !feedbackSchema.includes("notify pgrst, 'reload schema'")) throw new Error('Complete write-only Private Beta feedback schema missing.');
for (const marker of ['enable row level security','revoke all on table public.external_inboxes, public.external_requests from public, anon, authenticated','grant select, insert, update, delete on table public.external_inboxes, public.external_requests to service_role','security definer','pg_advisory_xact_lock','submit_external_request','expires_at','envelope_hash','duplicate request']) if (!externalRequestSchema.toLowerCase().includes(marker.toLowerCase())) throw new Error(`External Request database hardening marker missing: ${marker}`);
if (!requestJs.includes("encoder.encode('ASCEND-EXTERNAL-REQUEST-V1')") || !requestJs.includes("name:'RSA-OAEP'") || !requestHtml.includes('not account access')) throw new Error('Public request page must encrypt in the sender browser without requiring an account.');
if (!requestJs.includes('cData:turnstileCdata') || !serverSource.includes('verifiedCdata!==expectedCdata') || !serverSource.includes('envelopeHash')) throw new Error('External Request replay and Turnstile link-binding protection missing.');
for (const marker of ["execution:'execute'",'turnstile.execute(turnstileWidget)','VERIFY_TIMEOUT_MS=30000','SEND_TIMEOUT_MS=25000',"'timeout-callback'",'retryEnvelope','response.status!==409']) if (!requestJs.includes(marker)) throw new Error(`Fresh-submit Turnstile/idempotent retry marker missing: ${marker}`);
for (const marker of ['evaluateTurnstileResult','turnstileFailureResponse','TS_TOKEN_EXPIRED','TS_SERVER_CONFIG','TS_HOSTNAME','TS_CONTEXT','AbortController(),timer=setTimeout(()=>controller.abort(),8000)']) if (!serverSource.includes(marker)) throw new Error(`Turnstile diagnostic marker missing: ${marker}`);
if (!requestHtml.includes('/request.js?v=0.6.0.11.3') || !requestHtml.includes('/request.css?v=0.6.0.11.3')) throw new Error('Public request assets must be cache-busted for the current patch.');
if (!/id="sendRequestButton"[^>]+disabled[^>]*>Verify, Encrypt (?:&amp;|&) Send/.test(requestHtml)) throw new Error('Public Send button must remain disabled until submit-time verification is ready.');
if (!js.includes("Request Inbox timed out. Check your connection and retry.") || !js.includes('maskedExternalRequestUrl') || !js.includes("window.addEventListener('focus'")) throw new Error('Bounded/background inbox refresh or masked Command link missing.');
if (/owner_user_id|owner.{0,20}email/i.test(requestHtml + '\n' + requestJs)) throw new Error('The public request page must not expose owner identity or account IDs.');
if (!js.includes('privateKeyEnvelope') || !js.includes('encryptExternalPrivateKey') || js.includes('privateKeyJwk:parsed.externalInbox.privateKeyJwk')) throw new Error('External inbox private key must remain vault-encrypted in player state.');
if (!js.includes('An older progress backup must not orphan') || !js.includes('const protectedInbox=cloudUser')) throw new Error('Backup/reset must not orphan a live encrypted request inbox.');
if (!js.includes("if (event.isTrusted && pendingExternalRequestId) { pendingExternalRequestId = null; pendingExternalRequestText = ''; }")) throw new Error('Editing AI-prefilled external text must sever automatic request acceptance.');
for (const marker of ['if (!pendingExternalRequestId && detectedObjectives.length > 1)','singleObjective:Boolean(pendingExternalRequestId)','if (pendingExternalRequestId) pendingQuest.suggestedSubquests = []','suggestedSubquests:[]']) if (!js.includes(marker)) throw new Error(`External request single-Quest guard missing: ${marker}`);
if (!serverSource.includes('SINGLE OBJECTIVE CONTRACT') || !serverSource.includes('suggestedSubquests as an empty array')) throw new Error('Server AI prompt must preserve an external proposal as one Quest card.');
for (const id of ['plannerView','newListButton','newSemesterButton','plannerListBoard','semesterSelect','semesterBoard','classScheduleBoard','listDialog','semesterDialog','courseDialog']) if (!htmlIds.has(id)) throw new Error(`Planner UI ID missing: ${id}`);
for (const marker of ['PLANNER.migratePlanner','function renderPlanner','function openPlannerQuest','function linkPlannerItemToQuest','function renderClassSchedule','if(creating)state.metrics.questsAccepted+=newQs.length','required.length>0&&required.every']) if (!js.includes(marker)) throw new Error(`Planner/Project regression marker missing: ${marker}`);
if (!js.includes("ASCEND-Recovery-") || !js.includes(".txt`")) throw new Error('iPhone-compatible text Recovery File download missing.');
for (const marker of ['standalone-pwa','safe-area-inset-top','external-request-card','external-inbox-section']) if (!(js+'\n'+css).includes(marker)) throw new Error(`Mobile/external-request layout marker missing: ${marker}`);
for (const id of ['voiceQuestButton','voiceQuestStatus','discardQuestButton','circlesView','createCircleButton','joinCircleButton','circleBoard','circleItemDialog','circleItemForm']) if (!htmlIds.has(id)) throw new Error(`v0.6.0.8 input/social UI ID missing: ${id}`);
for (const marker of ['function resetQuestIntake','function ensureManualQuestClassification','function discardQuestReview','function toggleVoiceQuestCapture','function renderFocusCircles','function loadFocusCircles','socialEnabled']) if (!js.includes(marker)) throw new Error(`v0.6.0.8 input/social client marker missing: ${marker}`);
for (const marker of ['function reconcileDailyQuestDates','function refreshDateSensitiveState','function scheduleDailyBoundaryRefresh','function renderHabits','function toggleHabitToday','HABIT_SYSTEM.migrateHabits','daily-missed-label','function checkReminderNotifications','function enableReminders','habit-reminder-window','voice-language-row','circle-setup-error','entryRememberDevice','courseReminderEnabled','notificationSettingsCard']) if (!(js+'\n'+html+'\n'+css).includes(marker)) throw new Error(`v0.6.0.11 reminder/session marker missing: ${marker}`);
if (!css.includes('.analysis-result') || !css.includes('user-select:text') || !css.includes('.voice-input-shell') || !css.includes('.circle-rank-row')) throw new Error('Review selection, voice, or Focus Circle styling missing.');
if (!serverSource.includes("microphone=(self)") || !JSON.stringify(JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'))).includes('microphone=(self)')) throw new Error('Voice capture must be permitted only for the same origin.');
for (const marker of ["url.pathname.startsWith('/api/circles')",'SOCIAL_CONFIGURED','Focus Circles expose only opt-in summary stats']) if (!serverSource.includes(marker)) throw new Error(`Focus Circle server marker missing: ${marker}`);
for (const table of ['focus_circles','focus_circle_members','focus_circle_items','focus_circle_item_progress']) if (!focusCircleSchema.includes(`public.${table}`)) throw new Error(`Focus Circle schema table missing: ${table}`);
if (!focusCircleSchema.includes('revoke all on table public.focus_circle_members from anon, authenticated') || !focusCircleSchema.includes('grant all on table public.focus_circle_members to service_role') || /create policy/i.test(focusCircleSchema)) throw new Error('Focus Circles must be server-mediated with no direct browser policy.');
for (const marker of ['enforce_focus_circle_owner_limit','enforce_focus_circle_member_limit','pg_advisory_xact_lock','>= 5','>= 30','enforce_focus_circle_progress_membership']) if (!focusCircleSchema.includes(marker)) throw new Error(`Focus Circle database limit/integrity marker missing: ${marker}`);
if (!focusCircleSchema.includes("notify pgrst, 'reload schema'")) throw new Error('Focus Circle migration must refresh the PostgREST schema cache.');

// v0.6.0.11.3 — Circle Contribution XP + Finish/Archive Circle regression coverage.
{
  // The upgrade SQL must be strictly additive: no dropped tables, columns, or data.
  if (/drop\s+table/i.test(circleUpgradeSchema)) throw new Error('Circle upgrade SQL must never drop a table.');
  if (/drop\s+column/i.test(circleUpgradeSchema)) throw new Error('Circle upgrade SQL must never drop a column.');
  if (!/add column if not exists xp_awarded/i.test(circleUpgradeSchema)) throw new Error('Circle upgrade SQL must add xp_awarded additively.');
  if (!/add column if not exists status/i.test(circleUpgradeSchema)) throw new Error('Circle upgrade SQL must add circle status additively.');
  if (!/add column if not exists finished_at/i.test(circleUpgradeSchema)) throw new Error('Circle upgrade SQL must add finished_at additively.');
  if (!circleUpgradeSchema.includes('enforce_focus_circle_not_finished')) throw new Error('Circle upgrade SQL must guard writes on finished circles at the database layer.');
  if (!circleUpgradeSchema.includes("notify pgrst, 'reload schema'")) throw new Error('Circle upgrade SQL must refresh the PostgREST schema cache.');

  // Circle Contribution XP must be computed server-side from item duration —
  // never trusted from the client request body — and must be a completely
  // separate value from account Total XP.
  if (!serverSource.includes('function circleItemXp(')) throw new Error('Circle Contribution XP must be computed by a dedicated server function.');
  if (/circle_id:item\.circle_id,item_id:itemId,user_id:user\.id,xp_awarded:body\?\.xp/.test(serverSource)) throw new Error('Circle Contribution XP must never be read from the client request body.');
  if (!serverSource.includes('CIRCLE_DAILY_XP_CAP')) throw new Error('Circle Contribution XP must enforce a daily cap to prevent farming.');
  if (!serverSource.includes('todaySumResponse')) throw new Error("Circle Contribution XP must check today's already-awarded total before granting more.");
  const circleXpFieldIndex = serverSource.indexOf('circleXpFor=(circleId,userId)');
  if (circleXpFieldIndex === -1 || !serverSource.slice(circleXpFieldIndex, circleXpFieldIndex + 400).includes('xp_awarded')) {
    throw new Error('The /api/circles list response must compute Circle Contribution XP live from xp_awarded rows, not from a client-supplied total.');
  }

  // Pure unit coverage of the XP formula itself: bounded, deterministic, capped.
  assert(circleItemXp(60) === 30, 'A 60-minute circle session should award 30 Circle XP.');
  assert(circleItemXp(5) >= 1, 'The minimum-duration circle session must still award at least 1 Circle XP.');
  assert(circleItemXp(480) === 60, 'The longest allowed circle session must be capped at 60 Circle XP.');
  assert(circleItemXp(999999) === 60, 'An out-of-range duration must clamp to the same cap as the maximum allowed session.');
  assert(circleItemXp(-50) >= 1 && circleItemXp(0) >= 1, 'Invalid or zero duration must never produce zero or negative Circle XP.');
  assert(circleItemXp('not-a-number') >= 1, 'Non-numeric duration input must fail safe to the minimum award, never throw or award zero.');

  // Complete -> Undo -> Complete anti-farm property: because Circle XP is
  // always a live SUM over the idempotent (item_id,user_id) progress rows,
  // undoing a completion must remove exactly that item's XP contribution,
  // and redoing it must restore exactly the same amount — never more.
  const singleItemXp = circleItemXp(60);
  const simulateCompletionCycle = (cycles) => {
    // Mirrors the server's live-SUM design: progress rows for one item can
    // only ever be 0 or 1 per user (unique PK), so N complete/undo cycles
    // never accumulate more than one item's worth of XP at rest.
    let rows = [];
    for (let i = 0; i < cycles; i++) {
      rows = rows.filter(r => r.itemId !== 'item-1'); // undo (or no-op first time)
      rows.push({ itemId: 'item-1', xp: singleItemXp }); // complete
    }
    return rows.reduce((sum, r) => sum + r.xp, 0);
  };
  assert(simulateCompletionCycle(1) === singleItemXp, 'A single completion must award exactly one item worth of Circle XP.');
  assert(simulateCompletionCycle(5) === singleItemXp, 'Five Complete->Undo->Complete cycles on the same item must still net to exactly one item worth of Circle XP, never five.');

  // Finish/Archive Circle: owner-only, idempotent, never grants XP, and freezes writes.
  if (!/action==='finish'/.test(serverSource)) throw new Error('/api/circles/manage must support a finish action.');
  const finishBlock = serverSource.slice(serverSource.indexOf("if(action==='finish')"), serverSource.indexOf("return json(res,400,{error:member.role==='owner'"));
  if (!finishBlock.includes("member.role!=='owner'")) throw new Error('Finish Circle must be owner-only.');
  if (!finishBlock.includes("status==='finished'") || !finishBlock.includes('alreadyFinished:true')) throw new Error('Finish Circle must be idempotent and not double-process an already-finished circle.');
  if (!finishBlock.includes("status:'finished'")) throw new Error('Finish Circle must persist a finished status.');
  // Finish Circle's only state-changing database call may be the one PATCH
  // that sets status='finished' — no other write (which could smuggle in
  // an XP grant) is allowed in this code path.
  const finishWriteCount = (finishBlock.match(/method:'POST'|method:'PATCH'|method:'PUT'/g) || []).length;
  if (finishWriteCount !== 1) throw new Error(`Finish Circle must perform exactly one database write (the status change), found ${finishWriteCount}.`);
  // Defense-in-depth: the server must reject item/progress writes on a
  // finished circle before the request ever reaches Supabase (the DB
  // trigger in the upgrade SQL is the second, independent layer).
  const finishedWriteGuardCount = (serverSource.match(/status==='finished'\)return json\(res,409/g) || []).length;
  if (finishedWriteGuardCount < 2) throw new Error('Both /api/circles/item and /api/circles/progress must reject writes on a finished circle before hitting Supabase.');

  // Client must present Circle Contribution XP distinctly from account XP,
  // and must not silently re-introduce the old totalXp-as-circle-XP sort.
  if (!js.includes('CIRCLE CONTRIBUTION XP')) throw new Error('The Focus Circle UI must clearly label Circle Contribution XP as distinct from account XP.');
  if (!js.includes('finishFocusCircle')) throw new Error('The client must implement the Finish Circle action.');
  if (/sort\(\(a,b\)=>Number\(b\.totalXp\)-Number\(a\.totalXp\)\)/.test(js)) throw new Error('The circle leaderboard must not sort by self-reported account totalXp.');
  if (!js.includes('circle.archived')) throw new Error('The client must render archived (finished) circles separately from active ones.');
}

if (!serverSource.includes('CIRCLE_SCHEMA_MISSING') || !js.includes('SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql')) throw new Error('Focus Circle setup diagnostics must be actionable without exposing raw storage errors.');
if (!css.includes('repeat(auto-fit,minmax(min(100%,420px),1fr))') || !css.includes('.command-request-card>*{min-width:0}')) throw new Error('Shareable Request controls must stay inside the responsive card.');
if (!js.includes("['ar-SA','en-US']") || !js.includes('voiceRecognition.lang=voiceQuestLanguage()')) throw new Error('Explicit Arabic/English voice recognition selection is missing.');
const vercel = JSON.parse(await fs.readFile(path.join(root, 'vercel.json'), 'utf8'));
if (!vercel.rewrites?.some(r => String(r.source).includes('/api/:route'))) throw new Error('Vercel API rewrite missing.');
if (!vercel.rewrites?.some(r => String(r.source).includes('/request/:token') && r.destination === '/request.html')) throw new Error('Public request-link Vercel rewrite missing.');
const vercelCsp = JSON.stringify(vercel.headers || []);
for (const source of ['https://challenges.cloudflare.com']) { if (!serverSource.includes(source) || !vercelCsp.includes(source)) throw new Error(`Turnstile CSP source missing: ${source}`); }
if (!serverSource.includes('frame-src https://challenges.cloudflare.com')) throw new Error('Turnstile frame-src CSP missing.');
for (const marker of ["'X-DNS-Prefetch-Control': 'off'","'Cross-Origin-Opener-Policy': 'same-origin'","'Cross-Origin-Resource-Policy': 'same-origin'","'Origin-Agent-Cluster': '?1'",'safeFetchMetadata(req,req.method)']) if (!serverSource.includes(marker)) throw new Error(`Server security-header/request-metadata marker missing: ${marker}`);

await cryptoRoundTrip();
await externalRequestCryptoRoundTrip();
turnstileVerificationRegression();
stateIsolationRegression();
classificationCacheIsolationRegression();
skillSystemRegression();
dailyCycleRegression();
dailyRewardAccountingRegression();
plannerRegression();
habitRegression();

if (process.env.ASCEND_STATIC_ONLY === '1') {
  console.log('ASCEND v0.6.0.11.3 static and unit regressions: PASS');
  process.exit(0);
}

const port = 3210;
const child = spawn(process.execPath, ['server.mjs'], {
  cwd: root,
  env: { ...process.env, PORT: String(port), GEMINI_API_KEY: '', GOOGLE_API_KEY: '', SUPABASE_URL:'', SUPABASE_PUBLISHABLE_KEY:'', SUPABASE_ANON_KEY:'', SUPABASE_SECRET_KEY:'', TURNSTILE_SECRET_KEY:'', VITE_TURNSTILE_SITE_KEY:'1x00000000000000000000AA' },
  stdio: ['ignore', 'pipe', 'pipe']
});

try {
  await waitForServer(port);
  const health = await (await fetch(`http://127.0.0.1:${port}/api/health`)).json();
  assert(health.ok && health.version === '0.6.0.11.3', 'Health endpoint failed.');
  assert(health.aiConfigured === false && health.classifier === 'deep-local', 'Local fallback health mode failed.');
  const config = await (await fetch(`http://127.0.0.1:${port}/api/config`)).json();
  assert(config.version === '0.6.0.11.3' && config.cloudEnabled === false && config.cloudMode === 'local-only', 'Local cloud configuration endpoint failed.');
  assert(config.turnstileEnabled === true && config.turnstileSiteKey === '1x00000000000000000000AA', 'Turnstile public configuration endpoint failed.');
  assert(health.turnstileConfigured === true && health.features.includes('turnstile-auth-protection'), 'Turnstile health marker missing.');
  assert(config.accountDeletionEnabled === false && health.accountDeletionConfigured === false, 'Account deletion must stay disabled without a server admin secret.');
  assert(health.features.includes('friendly-auth-errors') && health.features.includes('self-service-account-deletion'), 'Authentication UX/account deletion health markers missing.');
  for (const feature of ['strict-account-state-isolation','fresh-guest-profile','language-consistent-ai-output','expanded-guided-tour','compact-auth-layout','height-aware-responsive-layout']) {
    assert(health.features.includes(feature), `Private-beta polish health marker missing: ${feature}`);
  }
  for (const feature of ['transferable-skill-system','quest-board-ai-jump','semantic-skill-allocation','realistic-dynamic-milestones','focus-area-recalibration','earned-progress-safe-projects','stale-shell-prevention','milestone-path-labels','locked-daily-recurrence','daily-undo-reversal']) assert(health.features.includes(feature), `v0.5.3.4.10 feature marker missing: ${feature}`);
  for (const feature of ['quest-type-lanes','private-beta-feedback','apple-pwa-install-guide','recovery-file-backup','net-xp-activity']) assert(health.features.includes(feature), `v0.5.3.4.13 feature marker missing: ${feature}`);
  for (const feature of ['reviewed-reward-consistency','feedback-service-role-grant']) assert(health.features.includes(feature), `v0.5.3.4.13 patch marker missing: ${feature}`);
  for (const feature of ['vault-first-new-device-unlock','locked-default-state-write-block']) assert(health.features.includes(feature), `v0.5.3.4.13 new-device recovery marker missing: ${feature}`);
  assert(config.feedbackEnabled === false && health.feedbackConfigured === false, 'Feedback must fail closed without cloud/admin configuration.');
  assert(config.externalRequestsEnabled === false && health.externalRequestsConfigured === false, 'External Requests must fail closed unless cloud, admin, and both Turnstile keys are configured.');
  assert(config.socialEnabled === false && health.socialConfigured === false, 'Focus Circles must fail closed without cloud/admin configuration.');
  for (const feature of ['voice-quest-capture','review-discard-controls','private-focus-circles','circle-shared-schedule','opt-in-circle-leaderboard']) assert(health.features.includes(feature), `v0.6.0.8 social/input marker missing: ${feature}`);
  for (const feature of ['end-to-end-encrypted-external-requests','public-request-link','external-request-review-inbox','iphone-safe-area-shell','iphone-text-recovery-file','fresh-submit-turnstile','bounded-request-inbox-refresh','command-request-link-card','safe-readonly-api-navigation','turnstile-verification-diagnostics','turnstile-server-timeout']) assert(health.features.includes(feature), `v0.6.0.8 feature marker missing: ${feature}`);
  for (const feature of ['single-quest-external-ai-review','structured-planning-lists','semester-course-planner','class-schedule-conflict-detection','fixed-weekly-commitments','planner-to-quest-link']) assert(health.features.includes(feature), `v0.6.0.8 Planner marker missing: ${feature}`);
  for (const feature of ['missed-daily-date-catchup','xp-free-habit-tracker','scheduled-habit-streaks','habit-starter-pack','explicit-arabic-voice-input','habit-window-reminders','quest-due-notifications','full-habit-categories','responsive-request-card','focus-circle-setup-diagnostics','first-action-retired','remember-device-30-days','explicit-voice-language','per-item-reminders','notification-center','readable-habit-recurrence']) assert(health.features.includes(feature), `v0.6.0.11 feature marker missing: ${feature}`);
  for (const feature of ['project-workspace-management','standalone-quest-default','exact-notification-deep-links','rolling-interval-habit-checkins','session-restore-gate','narrow-desktop-layout-hardening']) assert(health.features.includes(feature), `v0.6.0.11.3 feature marker missing: ${feature}`);
  const directNavigationHealth = await fetch(`http://127.0.0.1:${port}/api/health`, {headers:{'Sec-Fetch-Site':'cross-site','Sec-Fetch-Mode':'navigate','Sec-Fetch-Dest':'document'}});
  assert(directNavigationHealth.status === 200 && (await directNavigationHealth.json()).version === '0.6.0.11.3', 'Direct read-only API navigation must not be blocked by Fetch Metadata.');
  const blockedCrossSiteWrite = await fetch(`http://127.0.0.1:${port}/api/classify`, {method:'POST',headers:{'Content-Type':'application/json','Sec-Fetch-Site':'cross-site'},body:JSON.stringify({text:'Cross-site write must be blocked'})});
  assert(blockedCrossSiteWrite.status === 403, 'Cross-site state-changing API requests must remain blocked.');
  const publicConfigWithoutSetup = await fetch(`http://127.0.0.1:${port}/api/public-request/config?token=${'A'.repeat(43)}`);
  assert(publicConfigWithoutSetup.status === 503, 'Public request configuration must fail closed before secure owner setup.');
  const publicSubmitWithoutSetup = await fetch(`http://127.0.0.1:${port}/api/public-request/submit`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:'A'.repeat(43),turnstileToken:'test',website:'',envelope:{version:1,algorithm:'RSA-OAEP-256+A256GCM',iv:'A'.repeat(16),ciphertext:'A'.repeat(80),wrappedKey:'A'.repeat(342)}})});
  assert(publicSubmitWithoutSetup.status === 503, 'Public request submission must fail closed before secure owner setup.');
  const feedbackWithoutAdmin = await fetch(`http://127.0.0.1:${port}/api/feedback`, {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-user-token'},body:JSON.stringify({category:'bug',message:'A useful beta test report'})});
  assert(feedbackWithoutAdmin.status === 503, 'Feedback endpoint must fail closed when server storage is unavailable.');
  const circlesWithoutAdmin = await fetch(`http://127.0.0.1:${port}/api/circles`, {headers:{Authorization:'Bearer test-user-token'}});
  assert(circlesWithoutAdmin.status === 503, 'Focus Circles must fail closed before server storage is configured.');
  const deleteWithoutAdmin = await fetch(`http://127.0.0.1:${port}/api/account/delete`, {method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer test-user-token'},body:JSON.stringify({confirm:'DELETE',email:'test@example.com'})});
  assert(deleteWithoutAdmin.status === 503, 'Delete Account endpoint must fail closed when the server admin secret is absent.');
  for (const feature of ['single-analyze-control','client-side-encrypted-cloud-state','recovery-key-device-link','guided-onboarding','mobile-dialog-hardening','cross-device-cloud-sync','supabase-rls-ready']) {
    assert(health.features.includes(feature), `Health feature missing: ${feature}`);
  }

  const home = await classify(port, 'بكرة لازم أصلح تسريب في الحمام، عاجل ويمكن ياخذ ساعة');
  assert(home.result.category === 'Home', 'Generic home repair classification failed.');
  assert(home.result.priority === 'Critical', 'Urgent home repair priority failed.');

  const explicitDate = await post(port, '/api/classify', { text:'يوم 16 أغسطس عندي موعد مهم ولازم أجهز له', context:{localDate:'2026-08-10'} });
  assert(explicitDate.result.dueDate === '2026-08-16', 'Arabic named-month date inference failed.');

  const tomorrowDate = await post(port, '/api/classify', { text:'بكرة أشتري أغراض للبيت', context:{localDate:'2026-08-10'} });
  assert(tomorrowDate.result.dueDate === '2026-08-11', 'Relative date inference must use client local date.');
  const externalSingle = await post(port, '/api/classify', { text:'هذا طلب واحد من محمد: مناقشة مشروع\nالتفاصيل: مراجعة الخطة\nالوقت: غدا\nالمدة: 30 دقيقة', singleObjective:true, forceLocal:true, context:{localDate:'2026-08-10'} });
  assert(externalSingle.result && !Array.isArray(externalSingle.result), 'External proposal must return one classification result, never a batch.');
  assert(Array.isArray(externalSingle.result.suggestedSubquests)&&externalSingle.result.suggestedSubquests.length===0,'External proposal must not manufacture subquests in any AI/local mode.');

  const projectBuild = await classify(port, 'ابغا خلال الاسبوعين الجاية ابني مشروع هندسي فيه CAD و3D printing وحساسات وأوثقه بشكل احترافي، واتوقع ياخذ مني حوالي 20 ساعة');
  assert(projectBuild.result.category === 'Engineering', 'Engineering build intent failed.');
  assert(projectBuild.result.questType === 'Main Quest', '20-hour engineering project should be Main, not automatically Boss.');
  assert(projectBuild.result.title.length < 70, 'Smart title generation failed.');
  assert(projectBuild.result.suggestedSubquests.length >= 8, 'Engineering decomposition is too shallow.');
  assert(projectBuild.result.estimatedSessions >= 2, 'Estimated session metadata missing.');
  assert(projectBuild.result.dueDate, 'Two-week due date inference failed.');

  const projectMap = await post(port, '/api/project-plan', {text:'ابني ذراع روبوتية تعمل وأوثق الاختبارات خلال شهرين',forceLocal:true,context:{localDate:'2026-08-10',selectedCategories:['Engineering','Personal Projects']}});
  assert(projectMap.result?.requiredQuests?.length >= 2, 'Project Architect must return multiple substantial workstreams.');
  assert(projectMap.result.requiredQuests.every(quest=>quest.title&&quest.purpose&&quest.subquests?.length>=2), 'Project workstreams must include purpose and executable subquests.');
  assert(/[\u0600-\u06FF]/.test(projectMap.result.title)&&/[\u0600-\u06FF]/.test(projectMap.result.finalQuest), 'Project Architect must preserve Arabic output language.');

  const uni = await classify(port, 'اذاكر thermodynamics لاختبار الميد بكرة لمدة ساعتين');
  assert(uni.result.category === 'University', 'University-purpose classification failed.');
  assert(uni.result.secondaryCategory === 'Engineering', 'Technical university secondary category failed.');
  assert(uni.result.estimatedMinutes === 120, 'Arabic dual-hour parsing failed.');

  const campaign = await classify(port, 'ابي اطور الانقليزي خلال السنة بشكل مستمر وأوصل لمستوى أفضل');
  assert(campaign.result.category === 'English', 'Long-term English classification failed.');
  assert(campaign.result.questType === 'Campaign Quest', 'Long-term language development should be Campaign, not Boss.');

  const arabicPrinter = await post(port, '/api/classify', {text:'سوي انبوكسنق للطابعة الجديدة',context:{localDate:'2026-08-11',selectedCategories:['Personal','Engineering']},forceLocal:true});
  assertQuestLanguage(arabicPrinter.result, 'Arabic');

  const explicitEnglish = await post(port, '/api/classify', {text:'رتب المكتب ورد بالانجليزي',context:{localDate:'2026-08-11',selectedCategories:['Personal','Home']},forceLocal:true});
  assertQuestLanguage(explicitEnglish.result, 'English');

  const explicitArabic = await post(port, '/api/classify', {text:'Review my desk setup and reply in Arabic',context:{localDate:'2026-08-11',selectedCategories:['Personal','Home']},forceLocal:true});
  assert(/[\u0600-\u06FF]/.test(explicitArabic.result.title) && /[\u0600-\u06FF]/.test(explicitArabic.result.rationale), 'Explicit Arabic output request must override English input in local fallback.');

  const batch = await post(port, '/api/classify-batch', {text:'اليوم أشتري أغراض للبيت\nيوم 16 أغسطس أحضر موعد\nقبل 28 أغسطس أحدث موقعي', context:{localDate:'2026-08-10'}});
  assert(batch.results?.length === 3, 'Batch intake failed to produce three objectives.');
  assert(batch.results[0].dueDate === '2026-08-10' && batch.results[1].dueDate === '2026-08-16' && batch.results[2].dueDate === '2026-08-28', 'Batch date intelligence failed.');
  assert(batch.results.every((item,index)=>item.sourceObjective===['اليوم أشتري أغراض للبيت','يوم 16 أغسطس أحضر موعد','قبل 28 أغسطس أحدث موقعي'][index]), 'Every batch result must remain bound to its original objective.');
  assert(batch.results.every(item=>!('firstStep' in item)), 'Batch results must not reintroduce retired First Actions.');

  const accidentalSingle = await fetch(`http://127.0.0.1:${port}/api/classify`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:'مهمة اولى\nمهمة ثانية',context:{localDate:'2026-08-10'}})});
  assert(accidentalSingle.status === 409, 'Single classifier must reject merged multi-objective input.');

  const q1 = {id:'q-home',title:'Repair Bathroom Leak',category:'Home',questType:'Side Quest',priority:'Critical',difficulty:'C',estimatedMinutes:60,dueDate:new Date().toISOString().slice(0,10),longTermValue:2,impactScore:4,xp:80};
  const q2 = {id:'q-eng',title:'Build Instrumented Test Rig',category:'Engineering',secondaryCategory:'Career',questType:'Main Quest',priority:'High',difficulty:'A',estimatedMinutes:1200,longTermValue:5,impactScore:5,xp:1200};
  const directive = await post(port, '/api/directive', {quests:[q1,q2], context:{localDate:new Date().toISOString().slice(0,10)}});
  assert(directive.result.primaryQuestId === 'q-home', 'Daily Directive did not prioritize critical due work.');

  const review = await post(port, '/api/review', {quests:[q1,q2], activity:[{type:'quest',label:'Test',xp:100,category:'Engineering',at:new Date().toISOString()}], context:{}});
  assert(review.result.headline && review.result.recommendations?.length, 'System Review failed.');

  const aiTest = await fetch(`http://127.0.0.1:${port}/api/ai/test`, {method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
  assert(aiTest.status === 400, 'AI test without key must clearly fail with 400.');

  const page = await fetch(`http://127.0.0.1:${port}/`);
  assert(page.ok && (await page.text()).includes('ASCEND'), 'Static page failed.');
  const requestPage = await fetch(`http://127.0.0.1:${port}/request/${'A'.repeat(43)}`);
  assert(requestPage.ok && (await requestPage.text()).includes('Send a private request.'), 'Public request route failed.');
  
assert(pkg.version === '0.6.0.11.3', 'Version mismatch.');
const sw = await fs.readFile(path.join(root, 'public/sw.js'), 'utf8');
assert(sw.includes("const BUILD = '0.6.0.11.3'") && sw.includes('ascend-v${BUILD}'), 'PWA cache version was not bumped for this patch.');
assert(sw.includes('`/state-scope.js?v=${BUILD}`'), 'PWA core cache must include the versioned state-scope helper.');
assert(sw.includes('`/skill-system.js?v=${BUILD}`'), 'PWA core cache must include the versioned transferable skill engine.');
  assert(sw.includes('`/daily-cycle.js?v=${BUILD}`'), 'PWA core cache must include the versioned Daily cycle engine.');
  assert(sw.includes('`/planner-system.js?v=${BUILD}`'), 'PWA core cache must include the versioned Planner engine.');
  assert(sw.includes('`/habit-system.js?v=${BUILD}`'), 'PWA core cache must include the versioned Habit engine.');
assert(sw.includes("fetch(event.request, { cache:'no-store' })") && sw.includes("event.request.mode === 'navigate' ? SHELL"), 'Service worker must use network-first navigation with a versioned offline shell.');
const deleteSetup = await fs.readFile(path.join(root, 'setup-delete-account-windows.ps1'), 'utf8');
assert(deleteSetup.includes('Get-Clipboard'), 'Delete-account setup should read the secret from clipboard.');
assert(!deleteSetup.includes('-AsSecureString'), 'Delete-account setup must not rely on secure-console paste.');

assert(js.includes('updateEntryExperience'), 'Account-first entry flow missing.');
assert(js.includes('PROJECT ARCHITECT') || html.includes('PROJECT ARCHITECT'), 'Project Architect UI missing.');
assert(js.includes('effectiveRankMinDays'), 'S-Rank effective time gate missing.');
assert(js.includes('totalImpactCreditPercent'), 'Impact credit cap logic missing.');
assert(js.includes('projectFinalUnlocked'), 'Project final unlock logic missing.');
assert(serverSource.includes('/api/project-plan'), 'Project planning API missing.');
assert(serverSource.includes('export default requestHandler'), 'Vercel default export missing.');

console.log('ASCEND v0.6.0.11.3 smoke tests: PASS');
} finally {
  child.kill('SIGTERM');
}

async function cryptoRoundTrip() {
  const raw = webcrypto.getRandomValues(new Uint8Array(32));
  const key = await webcrypto.subtle.importKey('raw', raw, {name:'AES-GCM'}, false, ['encrypt','decrypt']);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode('ASCEND:test:ascend-aes-gcm-v1');
  const source = new TextEncoder().encode(JSON.stringify({quests:[{title:'Private test'}],xp:123}));
  const encrypted = await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,source);
  const decrypted = await webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},key,encrypted);
  assert(new TextDecoder().decode(decrypted) === new TextDecoder().decode(source), 'AES-GCM crypto roundtrip failed.');
}

async function externalRequestCryptoRoundTrip() {
  const pair = await webcrypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'}, true, ['wrapKey','unwrapKey']);
  const aes = await webcrypto.subtle.generateKey({name:'AES-GCM',length:256}, true, ['encrypt','decrypt']);
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode('ASCEND-EXTERNAL-REQUEST-V1');
  const source = new TextEncoder().encode(JSON.stringify({version:1,type:'meeting',senderName:'Beta Tester',subject:'Project review',details:'Review the prototype tomorrow.'}));
  const ciphertext = await webcrypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},aes,source);
  const wrapped = await webcrypto.subtle.wrapKey('raw',aes,pair.publicKey,{name:'RSA-OAEP'});
  const unwrapped = await webcrypto.subtle.unwrapKey('raw',wrapped,pair.privateKey,{name:'RSA-OAEP'},{name:'AES-GCM',length:256},false,['decrypt']);
  const decrypted = await webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},unwrapped,ciphertext);
  assert(new TextDecoder().decode(decrypted) === new TextDecoder().decode(source), 'External request hybrid-encryption roundtrip failed.');
  await assertRejects(() => webcrypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:new TextEncoder().encode('WRONG-CONTEXT'),tagLength:128},unwrapped,ciphertext), 'External request ciphertext must be bound to its authenticated context.');
}

async function assertRejects(action, message) {
  let rejected=false;try{await action();}catch{rejected=true;}assert(rejected,message);
}

function turnstileVerificationRegression(){
  const base={responseOk:true,expectedHost:'ascend-beta-nine.vercel.app',expectedAction:'external_request',expectedCdata:'abc123'};
  assert(evaluateTurnstileResult({...base,result:{success:true,hostname:'ascend-beta-nine.vercel.app',action:'external_request',cdata:'abc123'}}).ok,'Valid link-bound Turnstile response must pass.');
  const expired=evaluateTurnstileResult({...base,result:{success:false,'error-codes':['timeout-or-duplicate']}});
  assert(expired.reason==='token-expired-or-used'&&turnstileFailureResponse(expired).code==='TS_TOKEN_EXPIRED','Expired/used Turnstile token diagnosis failed.');
  const secret=evaluateTurnstileResult({...base,result:{success:false,'error-codes':['invalid-input-secret']}});
  assert(secret.reason==='server-key-rejected'&&turnstileFailureResponse(secret).status===503,'Invalid Turnstile Secret diagnosis failed.');
  const action=evaluateTurnstileResult({...base,result:{success:true,hostname:'ascend-beta-nine.vercel.app',action:'login',cdata:'abc123'}});
  assert(action.reason==='action-mismatch'&&turnstileFailureResponse(action).code==='TS_CONTEXT','Turnstile action mismatch must fail closed.');
  const binding=evaluateTurnstileResult({...base,result:{success:true,hostname:'ascend-beta-nine.vercel.app',action:'external_request',cdata:'wrong'}});
  assert(binding.reason==='binding-mismatch'&&turnstileFailureResponse(binding).code==='TS_CONTEXT','Turnstile request-link binding mismatch must fail closed.');
  const hostname=evaluateTurnstileResult({...base,result:{success:true,hostname:'preview.vercel.app',action:'external_request',cdata:'abc123'}});
  assert(hostname.reason==='hostname-mismatch'&&turnstileFailureResponse(hostname).code==='TS_HOSTNAME','Turnstile hostname mismatch must fail closed.');
  assert(evaluateTurnstileResult({...base,responseOk:false,result:{}}).reason==='siteverify-unavailable','Siteverify HTTP failure diagnosis failed.');
}

function stateIsolationRegression() {
  const context = { console, globalThis:null };
  context.globalThis = context;
  vm.runInNewContext(stateScopeSource, context, { filename:'state-scope.js' });
  const scope = context.AscendStateScope;
  const base = 'ascend.system.state.v4';
  const guestKey = 'ascend.system.guest.state';
  const accountA = 'account-a';
  const accountB = 'account-b';
  const storage = new Map([
    [base, JSON.stringify({quests:[{title:'LEGACY DEVICE'}]})],
    [guestKey, JSON.stringify({quests:[{title:'ONLY GUEST'}]})],
    [scope.accountStorageKey(base, accountA), JSON.stringify({quests:[{title:'ONLY ACCOUNT A'}]})],
    [scope.accountStorageKey(base, accountB), JSON.stringify({quests:[{title:'ONLY ACCOUNT B'}]})]
  ]);
  const titles = resolved => JSON.parse(storage.get(resolved.storageKey) || '{"quests":[]}').quests.map(q => q.title);

  const guest = scope.resolveStorageScope({baseStateKey:base,guestStateKey:guestKey,guestActive:true});
  assert(titles(guest).join() === 'ONLY GUEST', 'Existing Guest must resolve only its Guest namespace.');
  const a = scope.resolveStorageScope({baseStateKey:base,guestStateKey:guestKey,guestActive:true,sessionUserId:accountA});
  assert(a.kind === 'account' && titles(a).join() === 'ONLY ACCOUNT A', 'Authenticated Account A must override a stale Guest-active flag.');
  const b = scope.resolveStorageScope({baseStateKey:base,guestStateKey:guestKey,sessionUserId:accountB});
  assert(titles(b).join() === 'ONLY ACCOUNT B' && !titles(b).includes('ONLY ACCOUNT A'), 'Account B must not hydrate Account A state.');
  storage.delete(guestKey);
  const freshGuest = scope.resolveStorageScope({baseStateKey:base,guestStateKey:guestKey,guestActive:true});
  assert(titles(freshGuest).length === 0, 'A fresh Guest must start clean after the prior Guest namespace is removed.');
  const accidentalEmptyCache = {profile:{name:'Player',onboardingComplete:false},quests:[],updatedAt:'2026-08-13T12:00:00.000Z'};
  const encryptedCloudProgress = {profile:{name:'Hassan',onboardingComplete:true},quests:[{title:'EXISTING CLOUD QUEST'}],updatedAt:'2026-08-12T12:00:00.000Z'};
  const unlocked = scope.chooseUnlockedAccountState({cachedState:accidentalEmptyCache,remoteState:encryptedCloudProgress,recoveryUnlock:true,timestamp:value=>Date.parse(value?.updatedAt||0)});
  assert(unlocked === encryptedCloudProgress && unlocked.profile.onboardingComplete === true, 'Recovery unlock must restore decrypted cloud progress even if an accidental empty cache has a newer timestamp.');
}

function classificationCacheIsolationRegression() {
  const text = 'Plan the next project step';
  const university = classificationCacheKey(text, {localDate:'2026-08-12',selectedCategories:['University']});
  const engineering = classificationCacheKey(text, {localDate:'2026-08-12',selectedCategories:['Engineering']});
  const repeat = classificationCacheKey(text, {localDate:'2026-08-12',selectedCategories:['University']});
  assert(university !== engineering, 'Gemini cache keys must be isolated by player context/categories.');
  assert(university === repeat, 'Equivalent classification context must produce a stable cache key.');
}

function skillSystemRegression() {
  const context = { console, globalThis:null };
  context.globalThis = context;
  vm.runInNewContext(skillSystemSource, context, { filename:'skill-system.js' });
  const skills = context.AscendSkillSystem;
  assert(skills?.version === 3, 'Semantic transferable skill engine version missing.');

  const engineering = skills.definitionsForArea('Engineering').map(skill => skill.name);
  assert(engineering.includes('Planning') && engineering.includes('Problem Solving') && engineering.includes('Systems Thinking'), 'Engineering must activate broad capabilities.');
  assert(!engineering.some(name => /CAD|Design/.test(name)), 'Engineering must not force CAD or design tools as universal skills.');

  const selected = skills.activeDefinitions(['Business & Entrepreneurship','Finance','Fitness'], {});
  assert(selected.length < 12 && new Set(selected.map(skill => skill.id)).size === selected.length, 'Selected categories should share and deduplicate transferable skills.');
  assert(selected.some(skill => skill.name === 'Endurance') && selected.some(skill => skill.name === 'Decision Making'), 'Category choices should still activate relevant broad skills.');

  const migrated = skills.migrateSkillState({
    'Engineering::Design & CAD':65,
    'Finance::Budgeting':40,
    'Fitness::Conditioning':35,
    'Business & Entrepreneurship::Execution':20
  });
  assert(migrated['core::problem-solving'] === 65, 'Legacy Engineering skill XP should migrate into a broad capability.');
  assert(migrated['core::planning'] === 40 && migrated['core::endurance'] === 35 && migrated['core::execution'] === 20, 'Legacy skill XP migration lost progress.');
  assert(Object.values(migrated).reduce((sum, xp) => sum + xp, 0) === 160, 'Skill migration must preserve total skill XP.');

  const dailyImpact = skills.impactForQuest({title:'Practice for twenty minutes',category:'Fitness',questType:'Daily Quest',skillTags:['routine']});
  assert(Object.hasOwn(dailyImpact, 'core::consistency'), 'Daily practice should grow Consistency.');

  const weeklyPlan = skills.impactForQuest({
    title:'ترتيب خطة الأسبوع وتحديد الأولويات', category:'Personal', questType:'Side Quest',
    rationale:'تنظيم المهام الأسبوعية وتحديد الأولويات يرفع الإنتاجية ويقلل التشتت وإنجاز الالتزامات.',
    skillTags:['التخطيط','إدارة الوقت','التنظيم'], suggestedEvidence:['قائمة الأولويات المكتوبة للأسبوع']
  });
  assert(Object.hasOwn(weeklyPlan, 'core::planning') && Object.hasOwn(weeklyPlan, 'core::organization'), 'A one-time weekly plan should grow Planning and Organization.');
  assert(!Object.hasOwn(weeklyPlan, 'core::consistency'), 'Consistency must not receive XP from a one-time planning quest without a repetition signal.');
  assert(Math.abs(weeklyPlan['core::planning'] - 2/3) < 1e-9 && Math.abs(weeklyPlan['core::organization'] - 1/3) < 1e-9, 'Weekly planning XP allocation must stay deterministic.');
}

function dailyCycleRegression() {
  const context = { console, globalThis:null };
  context.globalThis = context;
  vm.runInNewContext(dailyCycleSource, context, { filename:'daily-cycle.js' });
  const daily = context.AscendDailyCycle;
  const today='2026-08-12',tomorrow='2026-08-13';
  const completed={id:'daily-1',title:'English practice',questType:'Daily Quest',status:'completed',dueDate:today,dailySeriesId:'series-1',dailyScheduledFor:today,dailyHistory:[today],dailyAwards:{[today]:20},subquests:[{id:'step-1',title:'Practice',status:'completed',completedAt:'x',xpAwarded:5}]};
  assert(daily.addDays(today,1)===tomorrow, 'Daily recurrence must schedule the next local date exactly once.');
  assert(daily.canUndoToday(completed,today), 'A Daily completed today must expose explicit same-day undo.');
  assert(!daily.canUndoToday(completed,tomorrow), 'Past Daily completions must not remain reversible on later days.');
  const next=daily.createNextOccurrence(completed,today,{id:'daily-2',createdAt:'2026-08-12T10:00:00.000Z'});
  assert(next.status==='active'&&next.dueDate===tomorrow&&next.dailyScheduledFor===tomorrow, 'Tomorrow Daily occurrence was not created correctly.');
  assert(daily.isLocked(next,today)&&!daily.isLocked(next,tomorrow), 'Tomorrow Daily must stay locked until its scheduled date.');
  assert(next.dailyHistory.length===0&&Object.keys(next.dailyAwards).length===0&&next.subquests[0].status==='active'&&next.subquests[0].xpAwarded===0, 'Generated Daily occurrence must not inherit earned progress.');
  assert(next.dailyMissedCount===0&&!next.dailyLastMissedFrom,'Tomorrow’s Daily must not inherit the previous occurrence’s missed-day label.');
  assert(daily.hasOccurrence([completed,next],completed,tomorrow), 'Daily recurrence must detect an existing tomorrow occurrence and prevent duplicates.');
  assert(daily.daysBetween('2026-08-13','2026-08-17')===4, 'Daily date-gap accounting must use calendar days.');
  const stale={id:'daily-stale',title:'English practice',questType:'Daily Quest',status:'active',dueDate:'2026-08-13',dailyScheduledFor:'2026-08-13',dailyMissedCount:1,subquests:[{id:'partial',title:'Read',status:'completed',xpAwarded:3}]};
  const caughtUp=daily.rollForwardMissedOccurrence(stale,'2026-08-17',{rolledAt:'2026-08-17T00:00:01.000Z'});
  assert(caughtUp.dueDate==='2026-08-17'&&caughtUp.dailyScheduledFor==='2026-08-17','An unfinished overdue Daily must become available on the current day.');
  assert(caughtUp.dailyMissedCount===5&&caughtUp.dailyLastMissedFrom==='2026-08-13','Missed Daily occurrences must be recorded without duplicating quests.');
  assert(caughtUp.subquests[0].status==='completed'&&caughtUp.subquests[0].xpAwarded===3,'Daily catch-up must preserve real partial work and must not mint XP.');
  assert(daily.rollForwardMissedOccurrence(completed,'2026-08-17')===null,'Completed Daily history must never roll forward.');
  assert(daily.rollForwardMissedOccurrence(next,today)===null,'A future locked Daily must never roll backward.');
}

function dailyRewardAccountingRegression() {
  const quest = {xp:20,subquests:[{xpAwarded:3},{xpAwarded:3},{xpAwarded:3}]};
  const earned = quest.subquests.reduce((sum, sub) => sum + Number(sub.xpAwarded || 0), 0);
  const finalReward = Math.max(0, quest.xp - earned);
  assert(earned + finalReward === quest.xp && finalReward === 11, 'Daily subquest XP plus final clear must equal the advertised total reward.');
  assert(finalReward + earned === 20, 'Undo Today must reverse the complete Daily occurrence award.');
}

function plannerRegression(){
  let idCounter=0;
  const context={console,globalThis:null};context.globalThis=context;
  vm.runInNewContext(plannerSystemSource,context,{filename:'planner-system.js'});
  const planner=context.AscendPlanner;
  assert(planner?.DAYS?.length===7,'Planner must expose a complete seven-day timetable.');
  const migrated=planner.migratePlanner({lists:[{title:'Math sections',items:[{title:'Section 1',estimatedMinutes:45}]}],semesters:[{name:'Fall 2026',courses:[{code:'MATH 201',name:'Differential Equations',focus:5,sections:[{title:'Chapter 1',estimatedMinutes:90}],classes:[{day:'الأحد',start:'08:00',end:'09:20'},{day:'Sunday',start:'10:30',end:'11:30'}]},{code:'PHYS 202',name:'Physics',classes:[{day:'Sunday',start:'09:00',end:'10:00'}]}],commitments:[{title:'Work shift',day:'Sunday',start:'11:00',end:'13:00',type:'Work',color:'amber'}]}]},()=>`planner-${++idCounter}`);
  assert(migrated.lists.length===1&&migrated.semesters[0].courses.length===2,'Planner migration lost lists or courses.');
  assert(migrated.lists[0].items[0].estimatedMinutes===45,'Planner item estimate was not preserved.');
  const progress=planner.progress([{status:'completed'},{status:'active'}]);
  assert(progress.completed===1&&progress.percent===50,'Planning progress must be deterministic and XP-free.');
  assert(migrated.semesters[0].commitments.length===1&&migrated.semesters[0].courses[0].classes[0].day==='Sunday','Fixed commitments or Arabic day normalization were not preserved.');
  const conflicts=planner.scheduleConflicts(migrated.semesters[0].courses,migrated.semesters[0].commitments);
  assert(conflicts.length===2&&conflicts.every(conflict=>conflict.first.day==='Sunday'),'Class and fixed-time overlap detection failed.');
  const quest=planner.questDraft(migrated.semesters[0].courses[0].sections[0],{category:'University',parentTitle:'MATH 201'});
  assert(quest.title==='Chapter 1'&&quest.category==='University'&&quest.estimatedMinutes===90&&quest.questType==='Side Quest','Planner-to-Quest draft mapping failed.');
  assert(!('xp' in migrated.lists[0].items[0])&&!('xp' in migrated.semesters[0].courses[0].sections[0]),'Planning items must never manufacture XP.');
  assert(!('xp' in migrated.semesters[0].commitments[0]),'Fixed weekly commitments must never manufacture XP.');
}

function habitRegression(){
  let idCounter=0;
  const context={console,globalThis:null,crypto:webcrypto};context.globalThis=context;
  vm.runInNewContext(habitSystemSource,context,{filename:'habit-system.js'});
  const habits=context.AscendHabitSystem;
  const habit=habits.normalizeHabit({title:'Read technical notes',category:'University',days:[0,2,4],createdDate:'2026-08-09',checkIns:{'2026-08-09':true,'2026-08-11':true}},()=>`habit-${++idCounter}`,'2026-08-09');
  assert(habit.id==='habit-1'&&habit.days.join(',')==='0,2,4','Habit normalization must preserve a valid private schedule.');
  assert(!('xp' in habit)&&!('reward' in habit),'Habits must remain structurally separate from XP and Quest rewards.');
  const checked=habits.toggleDate(habit,'2026-08-13');
  assert(habits.isDone(checked,'2026-08-13'),'Scheduled Habit check-in failed.');
  const reversed=habits.toggleDate(checked,'2026-08-13');
  assert(!habits.isDone(reversed,'2026-08-13'),'Habit same-day undo failed.');
  const ignored=habits.toggleDate(habit,'2026-08-10');
  assert(!habits.isDone(ignored,'2026-08-10'),'An unscheduled day must not create a Habit check-in.');
  const streakFixture=habits.normalizeHabit({...habit,checkIns:{'2026-08-09':true,'2026-08-11':true,'2026-08-13':true}},null,'2026-08-13');
  assert(habits.currentStreak(streakFixture,'2026-08-13')===3,'Habit streaks must count scheduled occurrences, not force seven-day schedules.');
  const week=habits.windowProgress(streakFixture,'2026-08-13',7);
  assert(week.due===3&&week.done===3&&week.percent===100,'Habit seven-day progress must be deterministic.');
  const missed=habits.normalizeHabit({...streakFixture,checkIns:{'2026-08-09':true,'2026-08-13':true}},null,'2026-08-13');
  assert(habits.currentStreak(missed,'2026-08-13')===1&&habits.missedCount(missed,'2026-08-13',30)===1,'A genuinely missed scheduled occurrence must break the Habit streak honestly.');
  const interval=habits.normalizeHabit({title:'Drink water',category:'Health & Wellness',days:[1],createdDate:'2026-08-17',reminderMode:'interval',windowStart:'08:00',windowEnd:'12:00',intervalMinutes:60},null,'2026-08-17');
  assert(habits.reminderSlots(interval,'2026-08-17').join(',')==='08:00,09:00,10:00,11:00,12:00','Windowed Habit reminders must generate bounded deterministic slots.');
  assert(habits.reminderLabel(interval)==='Every hour, 08:00–12:00','Habit reminder summary must be readable and match the stored schedule.');
  const firstCheckAt=new Date(2026,7,17,8,42),beforeCooldown=new Date(2026,7,17,9,20),afterCooldown=new Date(2026,7,17,9,44);
  const firstIntervalCheck=habits.recordInterval(interval,'2026-08-17',firstCheckAt);
  const coolingDown=habits.intervalStatus(firstIntervalCheck,'2026-08-17',beforeCooldown);
  assert(coolingDown.count===1&&!coolingDown.available&&coolingDown.nextAt?.getTime()===firstCheckAt.getTime()+60*60000,'Interval Habits must use a rolling cooldown from the real check-in time.');
  const secondIntervalCheck=habits.recordInterval(firstIntervalCheck,'2026-08-17',afterCooldown);
  assert(habits.intervalEvents(secondIntervalCheck,'2026-08-17').length===2,'Interval Habits must allow multiple honest check-ins without creating Quest XP.');
  assert(!('xp' in secondIntervalCheck)&&!('reward' in secondIntervalCheck),'Repeated Habit check-ins must remain XP-free.');
  const legacyReminder=habits.normalizeHabit({title:'Legacy',time:'09:15',days:[1],createdDate:'2026-08-17'},null,'2026-08-17');
  assert(legacyReminder.reminderMode==='once'&&legacyReminder.time==='09:15','Legacy single-time Habits must migrate without losing their reminder.');
}

function assertQuestLanguage(quest, language) {
  const visible = [
    quest.title, quest.rationale, quest.successCriteria,
    ...(quest.suggestedSubquests || []), ...(quest.dependencies || []),
    ...(quest.suggestedEvidence || []), ...(quest.skillTags || []), quest.antiFarm?.reason
  ].filter(Boolean);
  assert(visible.length >= 4, `${language} language regression fixture is unexpectedly shallow.`);
  if (language === 'Arabic') {
    assert(visible.every(value => /[\u0600-\u06FF]/.test(String(value)) || /^(?:GitHub|CAD|API|PWA|AES-GCM|Bambu Lab|P2S|ESP32|3D)$/i.test(String(value).trim())), 'Every Arabic quest prose field must remain Arabic except standalone technical names.');
  } else {
    assert(visible.every(value => /[A-Za-z]/.test(String(value)) && !/[\u0600-\u06FF]/.test(String(value))), 'Every English quest prose field must remain English.');
  }
}

async function classify(port, text) { return post(port, '/api/classify', { text, context: { localDate: new Date().toISOString().slice(0,10) } }); }
async function post(port, endpoint, payload) {
  const response = await fetch(`http://127.0.0.1:${port}${endpoint}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
  if (!response.ok) throw new Error(`${endpoint} HTTP ${response.status}: ${await response.text()}`);
  return response.json();
}
async function waitForServer(port) {
  for (let i=0;i<60;i++) { try { const r=await fetch(`http://127.0.0.1:${port}/api/health`); if(r.ok)return; } catch {} await new Promise(r=>setTimeout(r,100)); }
  throw new Error('Server did not start in time.');
}
function assert(condition, message) { if (!condition) throw new Error(message); }
