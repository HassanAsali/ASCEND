const STORAGE_KEY = 'ascend.system.state.v4';
const GUEST_ACTIVE_KEY = 'ascend.system.guest.active';
const GUEST_STATE_KEY = 'ascend.system.guest.state';
const LEGACY_V3_STORAGE_KEY = 'ascend.system.state.v3';
const LEGACY_V2_STORAGE_KEY = 'ascend.system.state.v2';
const LEGACY_V1_STORAGE_KEY = 'ascend.system.state.v1';
const SYSTEM_VERSION = String(window.ASCEND_SYSTEM_VERSION || 'unknown');
const CLOUD_SESSION_KEY = 'ascend.cloud.session.v1';
const CLOUD_SESSION_MAX_AGE_MS = 30 * 86400000;
const CLOUD_BOUND_USER_KEY = 'ascend.cloud.lastBoundUser';
const TOUR_SEEN_KEY = 'ascend.system.guidedTour.v3';
const VOICE_LANGUAGE_KEY = 'ascend.voice.language.v1';
const DELETED_ACCOUNT_MARKERS_KEY = 'ascend.auth.deletedAccountMarkers.v1';
const VAULT_KEY_PREFIX = 'ascend.cloud.vaultKey.v1.';
const RECOVERY_SAVED_PREFIX = 'ascend.cloud.recoverySaved.v1.';
const VAULT_FORMAT = 'ascend-aes-gcm-v1';

const FOCUS_AREAS=["University", "Career", "Engineering", "Medicine & Healthcare", "Programming & Technology", "Business & Entrepreneurship", "Finance", "Fitness", "Sports", "Health & Wellness", "Nutrition", "Personal", "Discipline & Habits", "Productivity", "Mental Skills", "Reading & Knowledge", "English", "Creativity", "Art & Design", "Writing", "Research", "Social Life", "Family", "Relationships", "Communication", "Leadership", "Community & Volunteering", "Home", "Organization", "Travel & Experiences", "Hobbies", "Values & Spirituality", "Personal Projects", "Professional Projects"];
const CATEGORIES=FOCUS_AREAS;
const QUEST_TYPES=['Main Quest','Side Quest','Daily Quest','Campaign Quest','Boss Quest'];
const QUEST_LANES = [
  { type:'Daily Quest', icon:'↻', title:'Daily Protocols', description:'Repeatable practice. Today’s occurrence is separate, and the next one stays locked until its date.' },
  { type:'Main Quest', icon:'◆', title:'Main Objectives', description:'Meaningful outcomes that usually need multiple focused steps or sessions.' },
  { type:'Side Quest', icon:'◇', title:'Side Objectives', description:'Smaller standalone work that supports life, study, or a larger outcome.' },
  { type:'Campaign Quest', icon:'∞', title:'Campaigns', description:'Long-term development that builds across repeated substantial work.' },
  { type:'Boss Quest', icon:'⬢', title:'Boss Objectives', description:'Rare, high-stakes work with demanding scope—not a label for ordinary difficulty.' }
];
const SKILL_SYSTEM=globalThis.AscendSkillSystem;
if(!SKILL_SYSTEM)throw new Error('ASCEND Skill System failed to load.');
const DAILY_CYCLE=globalThis.AscendDailyCycle;
if(!DAILY_CYCLE)throw new Error('ASCEND Daily Cycle failed to load.');
const PLANNER=globalThis.AscendPlanner;
if(!PLANNER)throw new Error('ASCEND Planner System failed to load.');
const HABIT_SYSTEM=globalThis.AscendHabitSystem;
if(!HABIT_SYSTEM)throw new Error('ASCEND Habit System failed to load.');
const AREA_PROFILES={
  "University":{icon:"\u232c",color:"#9d83ff"},"Career":{icon:"\u2197",color:"#77a8ff"},"Engineering":{icon:"\u2699",color:"#58e8ff"},
  "Medicine & Healthcare":{icon:"\u2695",color:"#65e6c4"},"Programming & Technology":{icon:"\u2318",color:"#62b8ff"},"Business & Entrepreneurship":{icon:"\u25c7",color:"#f4c56b"},
  "Finance":{icon:"$",color:"#70d8a4"},"Fitness":{icon:"\u25b2",color:"#70f0b1"},"Sports":{icon:"\u25cf",color:"#86d7ff"},"Health & Wellness":{icon:"\u271a",color:"#72e0c0"},
  "Nutrition":{icon:"\u25d2",color:"#9be17c"},"Personal":{icon:"\u25cc",color:"#f59cff"},"Discipline & Habits":{icon:"\u25c6",color:"#d4e9f2"},"Productivity":{icon:"\u25a6",color:"#66d9ef"},
  "Mental Skills":{icon:"\u25c8",color:"#b19cff"},"Reading & Knowledge":{icon:"\u25a4",color:"#d3c18c"},"English":{icon:"A",color:"#ffc96b"},"Creativity":{icon:"\u2726",color:"#f6a8d7"},
  "Art & Design":{icon:"\u270e",color:"#ff9bb5"},"Writing":{icon:"\u00b6",color:"#eab7ff"},"Research":{icon:"\u2315",color:"#79c7e8"},"Social Life":{icon:"\u25ce",color:"#ffb47a"},
  "Family":{icon:"\u2302",color:"#ffad8a"},"Relationships":{icon:"\u2661",color:"#ff96aa"},"Communication":{icon:"\u25eb",color:"#8fdcff"},"Leadership":{icon:"\u265c",color:"#f0c474"},
  "Community & Volunteering":{icon:"\u2725",color:"#88ddac"},"Home":{icon:"\u2302",color:"#82d8c9"},"Organization":{icon:"\u25a3",color:"#9fd0df"},"Travel & Experiences":{icon:"\u2708",color:"#73cfff"},
  "Hobbies":{icon:"\u2723",color:"#c3a5ff"},"Values & Spirituality":{icon:"\u2727",color:"#d6c789"},"Personal Projects":{icon:"\u2b21",color:"#7ae1e8"},"Professional Projects":{icon:"\u25b0",color:"#73a7ff"}
};
const LEGACY_CATEGORY_ALIASES={'Education & Study':'University','Fitness & Strength':'Fitness'};
function canonicalArea(name){const raw=String(name||'').trim();return LEGACY_CATEGORY_ALIASES[raw]||raw||'Personal';}
function profileForArea(area){const key=canonicalArea(area);return AREA_PROFILES[key]||{icon:'◆',color:'#8bcde0'};}
function selectedFocusAreas(sourceState=state){const raw=Array.isArray(sourceState?.profile?.focusAreas)?sourceState.profile.focusAreas:[];const cleaned=[...new Set(raw.map(canonicalArea).filter(Boolean))];return cleaned.length?cleaned:['Personal'];}
function availableCategories(sourceState=state){const selected=selectedFocusAreas(sourceState),historical=[...(sourceState?.quests||[]).flatMap(q=>[q.category,q.secondaryCategory]),...(sourceState?.projects||[]).map(p=>p.category)].map(canonicalArea).filter(Boolean);return [...new Set([...selected,...historical])];}
function coreSkillKey(id){return SKILL_SYSTEM.coreKey(id);}
function skillDefinitionsForArea(area){return SKILL_SYSTEM.definitionsForArea(canonicalArea(area));}
function activeSkillDefinitions(sourceState=state){return SKILL_SYSTEM.activeDefinitions(selectedFocusAreas(sourceState),sourceState?.skills||{});}
const RARITY_SCORE = { Common: 1, Uncommon: 2, Rare: 3, Epic: 4, Legendary: 5, Mythic: 6 };

const RANKS = [
  { stage: 'E', label: 'E-Rank', subtitle: 'Initiation', minDays: 0, requirements: {} },
  { stage: 'D', label: 'D-Rank', subtitle: 'Foundation', minDays: 60, requirements: { xp: 30000, clears: 50, activeDays: 60, main: 5, campaigns: 1, bosses: 0, milestones: 10, statCount: 2, statLevel: 10 } },
  { stage: 'C', label: 'C-Rank', subtitle: 'Momentum', minDays: 180, requirements: { xp: 140000, clears: 180, activeDays: 180, main: 18, campaigns: 3, bosses: 3, milestones: 28, statCount: 2, statLevel: 22 } },
  { stage: 'B', label: 'B-Rank', subtitle: 'Proven', minDays: 420, requirements: { xp: 500000, clears: 500, activeDays: 420, main: 45, campaigns: 8, bosses: 12, milestones: 55, statCount: 3, statLevel: 40 } },
  { stage: 'A', label: 'A-Rank', subtitle: 'Elite', minDays: 750, requirements: { xp: 1300000, clears: 1000, activeDays: 750, main: 80, campaigns: 15, bosses: 30, milestones: 85, statCount: 4, statLevel: 60 } },
  { stage: 'S-I', label: 'S-Rank I', subtitle: 'Ascendant', minDays: 1200, requirements: { xp: 3000000, clears: 1800, activeDays: 1200, main: 125, campaigns: 25, bosses: 55, milestones: 115, statCount: 5, statLevel: 82 } },
  { stage: 'S-II', label: 'S-Rank II', subtitle: 'Vanguard', minDays: 1550, requirements: { xp: 5200000, clears: 2900, activeDays: 1550, main: 175, campaigns: 40, bosses: 90, milestones: 135, statCount: 6, statLevel: 105 } },
  { stage: 'S-III', label: 'S-Rank III', subtitle: 'Apex', minDays: 1950, requirements: { xp: 8500000, clears: 4300, activeDays: 1950, main: 235, campaigns: 60, bosses: 130, milestones: 150, statCount: 6, statLevel: 130 } },
  { stage: 'S-IV', label: 'S-Rank IV', subtitle: 'Transcendent', minDays: 2400, requirements: { xp: 13000000, clears: 6500, activeDays: 2400, main: 315, campaigns: 85, bosses: 190, milestones: 165, statCount: 7, statLevel: 160 } },
  { stage: 'S-V', label: 'S-Rank V', subtitle: 'Mythic', minDays: 3000, requirements: { xp: 20000000, clears: 10000, activeDays: 3000, main: 450, campaigns: 120, bosses: 280, milestones: 180, statCount: 8, statLevel: 200 } }
];

const TITLE_DEFS = [
  'Awakening', 'Quest Hunter', 'Momentum', 'Builder', 'Problem Solver', 'Engineer', 'Prototype Hunter',
  'Systems Engineer', 'Experimentalist', 'Energy Engineer', 'Scholar', 'Finals Hunter', 'Consistent',
  'Relentless', 'The Return', 'Deep Worker', 'Maker', 'Career Builder', 'English Vanguard',
  'Campaigner', 'Long-Game Operator', 'Ascendant', 'Vanguard', 'Apex', 'Transcendent', 'Mythic'
];


const GUIDE_PATHS = [
  {
    id:'foundation', icon:'◇', title:'System Foundation', subtitle:'Build the base before chasing harder content.',
    nodes:[
      {title:'Enter the System', desc:'Accept three real objectives.', req:'3 quests accepted', progress:s=>[s.metrics.questsAccepted,3]},
      {title:'First Momentum', desc:'Prove that accepted quests become finished work.', req:'5 quest clears', progress:s=>[s.metrics.totalClears,5]},
      {title:'Show Up', desc:'Build a real activity history instead of a one-day burst.', req:'7 active days', progress:s=>[s.activeDates.length,7]},
      {title:'Main Objective', desc:'Finish something that takes multiple focused sessions.', req:'1 Main Quest cleared', progress:s=>[s.metrics.mainClears,1]},
      {title:'Foundation Complete', desc:'Establish broad early growth across the focus areas you actually selected.', req:'Up to 3 focus areas at Level 5', progress:s=>[selectedFocusAreas(s).filter(k=>statLevel(s.stats[k]||0)>=5).length,Math.min(3,selectedFocusAreas(s).length)]}
    ]
  },
  {
    id:'discipline', icon:'◆', title:'Discipline Route', subtitle:'The slow route. It cannot be rushed in a weekend.',
    nodes:[
      {title:'Seven Signals', desc:'Be active on seven separate days.', req:'7 active days', progress:s=>[s.activeDates.length,7]},
      {title:'Month of Action', desc:'Build thirty active days across real life.', req:'30 active days', progress:s=>[s.activeDates.length,30]},
      {title:'Foundation Rank', desc:'Earn and claim D-Rank through its full requirements.', req:'Reach D-Rank', progress:s=>[rankIndex(s.rankStage)>=rankIndex('D')?1:0,1]},
      {title:'Hundred Days', desc:'Accumulate one hundred active days.', req:'100 active days', progress:s=>[s.activeDates.length,100]},
      {title:'Momentum Rank', desc:'Earn C-Rank through sustained progression.', req:'Reach C-Rank', progress:s=>[rankIndex(s.rankStage)>=rankIndex('C')?1:0,1]},
      {title:'One-Year Signal', desc:'Accumulate 365 active days. Not necessarily consecutive.', req:'365 active days', progress:s=>[s.activeDates.length,365]}
    ]
  }
];

function milestone(id, group, rarity, icon, title, desc, test, options = {}) {
  return { id, group, rarity, icon, title, desc, test, ...options };
}

function buildMilestones() {
  const list = [
    milestone('first-quest','Progression','Common','◇','Quest Accepted','Accept your first real quest.',s=>s.metrics.questsAccepted>=1,{progress:s=>[s.metrics.questsAccepted,1],unlockTitle:'Awakening'}),
    milestone('first-clear','Progression','Common','✓','First Clear','Clear your first quest.',s=>s.metrics.totalClears>=1,{progress:s=>[s.metrics.totalClears,1]}),
    milestone('first-main','Progression','Uncommon','◆','Main Objective','Clear your first Main Quest.',s=>s.metrics.mainClears>=1,{progress:s=>[s.metrics.mainClears,1]}),
    milestone('first-campaign','Progression','Rare','∞','First Campaign Complete','Complete your first Campaign Quest.',s=>(s.metrics.campaignClears||0)>=1,{progress:s=>[s.metrics.campaignClears||0,1],unlockTitle:'Campaigner'}),
    milestone('first-boss','Progression','Rare','⬢','Boss Defeated','Clear your first Boss Quest.',s=>s.metrics.bossClears>=1,{progress:s=>[s.metrics.bossClears,1]}),
    milestone('deep-work','Discipline','Uncommon','◫','Deep Work Clear','Clear a quest with at least three estimated focused hours.',s=>s.activity.some(a=>a.type==='quest-completed'&&Number(a.meta?.estimatedMinutes||0)>=180),{unlockTitle:'Deep Worker'}),
    milestone('return','Discipline','Rare','↺','The Return','Complete real work after the System records a long break.',s=>s.metrics.returnCount>=1,{progress:s=>[s.metrics.returnCount,1],unlockTitle:'The Return'}),
    milestone('all-stats-5','Progression','Epic','✧','Balanced Foundation','Reach Level 5 in every selected focus area.',s=>selectedFocusAreas(s).every(k=>statLevel(s.stats[k]||0)>=5),{progress:s=>[selectedFocusAreas(s).filter(k=>statLevel(s.stats[k]||0)>=5).length,selectedFocusAreas(s).length]}),
    milestone('all-stats-10','Progression','Legendary','✹','Balanced Development','Reach Level 10 in every selected focus area.',s=>selectedFocusAreas(s).every(k=>statLevel(s.stats[k]||0)>=10),{progress:s=>[selectedFocusAreas(s).filter(k=>statLevel(s.stats[k]||0)>=10).length,selectedFocusAreas(s).length]})
  ];

  const xpDefs = [
    [500,'Awakening','Common'], [2500,'Momentum','Uncommon'], [10000,'Five Digits','Rare'], [25000,'Rising Force','Rare'],
    [50000,'Established','Epic'], [100000,'Six Figures','Epic'], [250000,'Quarter Million','Legendary'],
    [500000,'Ascendant Reserve','Legendary'], [1000000,'Million XP','Mythic'], [2500000,'Beyond Measure','Mythic']
  ];
  xpDefs.forEach(([target, title, rarity], i) => list.push(milestone(`xp-${target}`, 'Progression', rarity, '✦', title, `Earn ${target.toLocaleString()} total XP.`, s => s.totalXp >= target, {
    progress: s => [s.totalXp, target], unlockTitle: i === 1 ? 'Momentum' : undefined
  })));

  const clearDefs = [
    [10,'Quest Hunter','Uncommon'], [25,'Trail Maker','Uncommon'], [50,'Operator','Rare'], [100,'Centurion','Rare'],
    [250,'Veteran','Epic'], [500,'Relentless Executor','Epic'], [1000,'Thousand Clears','Legendary'], [2500,'Living System','Mythic'], [5000,'Endless Campaign','Mythic']
  ];
  clearDefs.forEach(([target, title, rarity], i) => list.push(milestone(`clears-${target}`, 'Progression', rarity, '◇', title, `Clear ${target.toLocaleString()} quests.`, s => s.metrics.totalClears >= target, {
    progress: s => [s.metrics.totalClears, target], unlockTitle: i === 0 ? 'Quest Hunter' : undefined
  })));

  const dayDefs = [
    [7,'Seven Active Days','Uncommon'], [30,'Month of Action','Rare'], [60,'Two-Month Signal','Rare'], [100,'Hundred Active Days','Epic'],
    [180,'Half-Year Presence','Epic'], [365,'Year of Action','Legendary'], [540,'Long Campaign','Legendary'], [720,'Two-Year Gate','Mythic'], [1000,'Thousand Active Days','Mythic'], [1500,'Long Horizon','Mythic'], [2000,'Mythic Lifeline','Mythic']
  ];
  dayDefs.forEach(([target, title, rarity]) => list.push(milestone(`active-${target}`, 'Discipline', rarity, '◈', title, `Record progress on ${target} different days.`, s => s.activeDates.length >= target, { progress: s => [s.activeDates.length, target] })));

  const streakDefs = [[7,'Consistency','Uncommon'],[14,'Two Weeks','Rare'],[30,'Unbroken Month','Epic'],[60,'Iron Rhythm','Epic'],[100,'Relentless','Legendary']];
  streakDefs.forEach(([target,title,rarity], i) => list.push(milestone(`streak-${target}`, 'Discipline', rarity, '7', title, `Reach a ${target}-day activity streak.`, s => s.metrics.bestStreak >= target, {
    progress: s => [s.metrics.bestStreak, target], unlockTitle: i === 0 ? 'Consistent' : i === 4 ? 'Relentless' : undefined
  })));

  [[5,'Main Questline','Uncommon'],[10,'Major Objectives','Rare'],[25,'Campaigner','Epic'],[50,'Strategic Operator','Legendary'],[100,'Hundred Main Quests','Mythic']].forEach(([target,title,rarity]) => {
    list.push(milestone(`main-${target}`, 'Progression', rarity, '◆', title, `Clear ${target} Main Quests.`, s => s.metrics.mainClears >= target, { progress: s => [s.metrics.mainClears, target] }));
  });
  [[2,'Long Game','Rare'],[5,'Campaign Operator','Epic'],[10,'Strategic Campaigner','Legendary'],[25,'Long-Game Architect','Mythic'],[50,'Era Builder','Mythic']].forEach(([target,title,rarity], i) => {
    list.push(milestone(`campaign-${target}`, 'Progression', rarity, '∞', title, `Complete ${target} Campaign Quests.`, s => (s.metrics.campaignClears || 0) >= target, { progress: s => [s.metrics.campaignClears || 0, target], unlockTitle: i === 1 ? 'Long-Game Operator' : undefined }));
  });
  [[3,'Boss Hunter','Rare'],[10,'Boss Breaker','Epic'],[25,'Raid Veteran','Legendary'],[50,'Apex Hunter','Mythic'],[100,'Impossible Campaign','Mythic']].forEach(([target,title,rarity]) => {
    list.push(milestone(`boss-${target}`, 'Progression', rarity, '⬢', title, `Defeat ${target} Boss Quests.`, s => s.metrics.bossClears >= target, { progress: s => [s.metrics.bossClears, target] }));
  });

  const countSeries=(prefix,group,icon,metric,defs,label)=>defs.forEach(([target,title,rarity,unlockTitle])=>list.push(milestone(`${prefix}-${target}`,group,rarity,icon,title,`${label} ${target.toLocaleString()}.`,s=>metric(s)>=target,{progress:s=>[metric(s),target],unlockTitle})));
  countSeries('daily','Discipline','↻',s=>s.metrics.dailyClears||0,[[10,'Daily Practice','Uncommon'],[30,'Daily Rhythm','Rare'],[100,'Hundred Daily Clears','Epic'],[365,'Long Daily Practice','Legendary'],[1000,'Lifetime Daily Practice','Mythic']],'Complete Daily Quests');
  countSeries('subquests','Progression','◇',s=>s.metrics.subquestsCleared||0,[[25,'Step by Step','Uncommon'],[100,'Structured Execution','Rare'],[250,'Work Breakdown','Epic'],[500,'Execution Architecture','Legendary'],[1000,'Thousand Steps','Mythic']],'Clear subquests');
  countSeries('projects','Progression','⬡',s=>s.metrics.projectClears||0,[[1,'Project Delivered','Rare','Maker'],[3,'Delivery Record','Epic'],[10,'Project Operator','Legendary'],[25,'Long-Term Builder','Mythic'],[50,'Lifetime Builder','Mythic']],'Complete Projects');

  const rankMilestones = [
    ['D','Uncommon','D','D-Rank Awakened'], ['C','Rare','C','C-Rank Proven'], ['B','Epic','B','B-Rank Vanguard'],
    ['A','Legendary','A','A-Rank Elite'], ['S-I','Mythic','S','S-Rank Ascendant'], ['S-II','Mythic','SⅡ','S-II Vanguard'],
    ['S-III','Mythic','SⅢ','S-III Apex'], ['S-IV','Mythic','SⅣ','S-IV Transcendent'], ['S-V','Mythic','SⅤ','S-V Mythic']
  ];
  rankMilestones.forEach(([stage, rarity, icon, title]) => list.push(milestone(`rank-${stage}`, 'Rank', rarity, icon, title, `Earn and claim ${stage} advancement.`, s => rankIndex(s.rankStage) >= rankIndex(stage), {
    unlockTitle: stage === 'S-I' ? 'Ascendant' : stage === 'S-II' ? 'Vanguard' : stage === 'S-III' ? 'Apex' : stage === 'S-IV' ? 'Transcendent' : stage === 'S-V' ? 'Mythic' : undefined
  })));

  return list;
}

const MILESTONES = buildMilestones();
const MILESTONE_INDEX = new Map(MILESTONES.map((item, index) => [item.id, index]));

function defaultState() {
  return {
    version: 12,
    systemVersion: SYSTEM_VERSION,
    profile: {
      name: 'Player',
      identity: 'Configure your identity in System',
      equippedTitle: 'Awakening',
      onboardingComplete: false, focusAreas: [], operatingMode: 'Balance', aiPrivacyMode:'ai'
    },
    season: {
      name: 'Season 01 // First Protocol',
      start: localDateKey(new Date()),
      end: localDateKey(new Date(Date.now() + 29 * 86400000)),
      purpose: 'Build a consistent system around the work that matters to you.'
    },
    systemContext: '',
    ai: { directive: null, review: null, lastMode: 'local+' },
    totalXp: 0,
    stats:{Discipline:0},
    skills:{},
    quests: [],
    projects: [],
    planner: PLANNER.migratePlanner({}),
    habits: HABIT_SYSTEM.migrateHabits([],null,localDateKey(new Date())),
    reminders: { enabled:false, sent:{} },
    impactCredits: [],
    externalInbox: { token:'', publicKeyJwk:null, privateKeyEnvelope:null, enabled:false, createdAt:null },
    social: { inviteTokens:{}, activeCircleId:'', friendInviteToken:'', friendInviteEnabled:true, shareFriendProgress:true },
    activity: [],
    activeDates: [],
    streak: 0,
    lastActiveDate: null,
    unlockedAchievements: [],
    titlesUnlocked: ['Awakening'],
    rankStage: 'E',
    rankTrialsClaimed: [],
    metrics: {
      questsAccepted: 0,
      totalClears: 0,
      mainClears: 0,
      bossClears: 0,
      campaignClears: 0,
      dailyClears: 0,
      subquestsCleared: 0,
      projectClears: 0,
      bestStreak: 0,
      returnCount: 0
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    migratedAt: null
  };
}

const initialCloudSession = loadCloudSession();
let rememberCloudSession = Boolean(initialCloudSession?.__remembered);
if(initialCloudSession)delete initialCloudSession.__remembered;
const initialStorageScope = AscendStateScope.resolveStorageScope({
  baseStateKey:STORAGE_KEY,
  guestStateKey:GUEST_STATE_KEY,
  guestActive:localStorage.getItem(GUEST_ACTIVE_KEY) === '1',
  sessionUserId:initialCloudSession?.user?.id
});
// A tab-scoped authenticated identity always wins over a stale Guest-active flag.
// Guest progress remains saved, but it is not rendered or written while that account is active.
let guestMode = initialStorageScope.kind === 'guest';
let activeStorageKey = initialStorageScope.storageKey;
let state = loadState();
let cloudConfig = { enabled:false, url:'', anonKey:'', turnstileEnabled:false, turnstileSiteKey:'', accountDeletionEnabled:false, feedbackEnabled:false, externalRequestsEnabled:false, socialEnabled:false };
const turnstileSlots = {
  entry:{ panel:'entryTurnstilePanel', widget:'entryTurnstileWidget', status:'entryTurnstileStatus', widgetId:null, token:'' },
  settings:{ panel:'cloudTurnstilePanel', widget:'cloudTurnstileWidget', status:'cloudTurnstileStatus', widgetId:null, token:'' },
  deleteAccount:{ panel:'deleteTurnstilePanel', widget:'deleteTurnstileWidget', status:'deleteTurnstileStatus', widgetId:null, token:'' }
};
let cloudSession = initialCloudSession;
let cloudUser = cloudSession?.user || null;
let cloudStatus = 'local';
let cloudLastSyncAt = null;
let cloudSaveTimer = null;
let cloudApplyingRemote = false;
let cloudSyncRunToken = null;
let identityEpoch = 0;
let cloudIdentityTransitioning = false;
let vaultKeyCache = null;
let vaultRecoveryRequired = false;
let vaultUnlockHydrationRequired = false;
let pendingQuest = null;
let pendingExternalRequestText = '';
if (guestMode) document.body.classList.add('guest-session');
let pendingBatchQuests = [];
let pendingBatchMode = 'local+';
let pendingBatchDialogIndex = null;
let batchAcceptInFlight = false;
let editingQuestId = null;
let dialogSource = 'manual';
let dialogIntelligenceMeta = null;
let dialogRewardLocked = false;
let autoClassifyTimer = null;
let autoClassifyToken = 0;
let autoClassifyPromise = null;
let voiceRecognition = null;
let voiceListening = false;
let questSaveInFlight = false;
let externalRequests = [];
let externalRequestsLoading = false;
let pendingExternalRequestId = null;
let activePlannerTab = 'lists';
let editingListId = null;
let editingSemesterId = null;
let editingCourseId = null;
let editingCommitmentId = null;
let pendingPlannerItemRef = null;
let editingHabitId = null;
let dailyBoundaryTimer = null;
let focusCircles = [];
let focusCirclesLoading = false;
let focusCirclesError = '';
let activeCircleItemId = null;
let friendsData = {profile:{},relationships:[],leaderboard:[]};
let friendsLoading = false;
let friendsError = '';
let activeFriendRelationshipId = null;
let installPrompt = null;
let flashBusy = false;
const flashQueue = [];

const el = id => document.getElementById(id);
const views = {
  dashboard: el('dashboardView'), quests: el('questsView'), projects: el('projectsView'), planner:el('plannerView'), habits:el('habitsView'), circles:el('circlesView'), friends:el('friendsView'), progress: el('progressView'), guide: el('guideView'), achievements: el('achievementsView'), settings: el('settingsView')
};
const viewMeta = {
  dashboard: ['PLAYER STATUS', 'Command Center'], quests: ['QUEST BOARD', 'Quest Management'], projects: ['PROJECT ARCHITECT', 'Project Map'], planner:['PLANNING WORKSPACE','Lists & Semester'], habits:['PERSONAL RHYTHMS','Habits'], circles:['PRIVATE SOCIAL','Focus Circles'], friends:['PRIVATE CONNECTIONS','Friends'], progress: ['PROGRESSION', 'Progress Intelligence'],
  guide: ['SYSTEM PATHWAY', 'Progression Guide'], achievements: ['MILESTONES', 'Achievement Archive'], settings: ['SYSTEM', 'System Configuration']
};

const TOUR_STEPS = [
  { view:'dashboard', selector:'#playerCard', section:'COMMAND CENTER', title:'Player Core', text:'Your live identity: level, rank, title, total XP and current progression state.' },
  { view:'dashboard', selector:'#directiveCard', section:'SYSTEM INTELLIGENCE', title:"Today's Directive", text:'Directive reviews your active load and surfaces the next move. Recalculate it after meaningful quest changes rather than treating it as a fixed schedule.' },
  { view:'dashboard', selector:'.quest-console', section:'QUEST INPUT', title:'Quest Console', text:'This is the fastest way to add work. Write one objective naturally or paste several lines; ASCEND analyzes scope, category, effort, XP and dates before you accept anything.' },
  { view:'dashboard', selector:'#skillMatrixHeading', section:'SKILLS', title:'Core Skills', text:'Skills are broad, transferable capabilities rather than fixed tools forced into every category. Relevant skills grow only from the work behind cleared quests.' },
  { view:'dashboard', selector:'.focus-panel', section:'TODAY', title:'Active Objectives', text:'The System surfaces a small set of unfinished objectives here so Command stays focused instead of becoming a giant task list.' },
  { view:'quests', selector:'.nav-item[data-view="quests"]', mobileSelector:'.mobile-nav [data-view="quests"]', section:'QUESTS', title:'Quest Board', text:'Every accepted quest lives here. Filter, open, edit, complete or review quests without mixing them with projects or skills.' },
  { view:'projects', selector:'.nav-item[data-view="projects"]', mobileSelector:'.sheet-grid [data-view="projects"]', mobileSheet:true, section:'PROJECTS', title:'Project Architect', text:'Use Projects when one outcome needs several major quests. Required workstreams unlock the final objective; optional work stays optional.' },
  { view:'planner', selector:'.nav-item[data-view="planner"]', mobileSelector:'.sheet-grid [data-view="planner"]', mobileSheet:true, section:'PLANNER', title:'Lists & Semester', text:'Lists organize sections and preparation without XP. Convert only real work into a Quest. Semester keeps courses, classes, work, appointments, and protected study time together.' },
  { view:'habits', selector:'.nav-item[data-view="habits"]', mobileSelector:'.sheet-grid [data-view="habits"]', mobileSheet:true, section:'HABITS', title:'Private Habit Board', text:'Habits track repeatable behavior separately from Quests. Check-ins never grant XP, affect Rank, or manufacture progression days.' },
  { view:'circles', selector:'.nav-item[data-view="circles"]', mobileSelector:'.sheet-grid [data-view="circles"]', mobileSheet:true, section:'CIRCLES', title:'Private Focus Circles', text:'Create a private circle for friends or classmates. Share sessions and lectures, then compare opt-in progression summaries without sharing quest text or encrypted player-state.' },
  { view:'friends', selector:'.nav-item[data-view="friends"]', mobileSelector:'.sheet-grid [data-view="friends"]', mobileSheet:true, section:'FRIENDS', title:'Private Friends', text:'Use private invite codes instead of public people search. Friends can coordinate shared plans and mark their own completion; this social board never changes account XP or Rank.' },
  { view:'guide', selector:'.nav-item[data-view="guide"]', mobileSelector:'.mobile-nav [data-view="guide"]', section:'PATHWAY', title:'Progression Guide', text:'The Guide is your long path. It maps development from approachable steps toward harder branches based on your selected areas.' },
  { view:'progress', selector:'.nav-item[data-view="progress"]', mobileSelector:'.sheet-grid [data-view="progress"]', mobileSheet:true, section:'PROGRESS', title:'Progress Intelligence', text:'Progress tracks XP history, rank gates, streaks, active days and evidence behind your growth.' },
  { view:'achievements', selector:'.nav-item[data-view="achievements"]', mobileSelector:'.sheet-grid [data-view="achievements"]', mobileSheet:true, section:'MILESTONES', title:'Milestones', text:'Milestones are generated from your selected areas and progression rules. Unrelated profession-specific milestones stay out of your system.' },
  { view:'settings', selector:'.nav-item[data-view="settings"]', mobileSelector:'.sheet-grid [data-view="settings"]', mobileSheet:true, section:'SYSTEM', title:'System Core', text:'Profile, focus-area recalibration, season, AI context, backup controls, privacy options and tutorial replay live here.' },
  { view:'settings', selector:'#cloudHero', mobileSelector:'#sheetSyncButton', mobileSheet:true, section:'CLOUD', title:'Encrypted Cloud Link', text:'Signed-in accounts synchronize encrypted player-state across devices. A recovery key unlocks the encrypted vault on a new device.' },
  { view:'settings', selector:'#accountSecurityCard', mobileSelector:'.sheet-grid [data-view="settings"]', mobileSheet:true, section:'ACCOUNT', title:'Identity & Account Safety', text:'Password recovery, data export and permanent account deletion are account-scoped. Guest data stays device-only and can be deleted separately.' }
];

init().catch(error => {
  console.error('ASCEND init failed:', error);
  if(el('sessionBootGate'))el('sessionBootGate').hidden=true;
  if(el('entryGate'))el('entryGate').hidden=false;
  toast('System initialization hit an error. Local data is still available.');
});

async function init() {
  document.documentElement.classList.toggle('standalone-pwa', window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true);
  hydrateSystemVersion();
  populateSelects();
  bindEvents();
  refreshStreak();
  unlockAchievements(false);
  renderAll();
  scheduleDailyBoundaryRefresh();
  registerPwa();
  startReminderScheduler();
  await Promise.allSettled([checkAiStatus(), initCloud()]);
  if(cloudUser&&cloudConfig.socialEnabled)void loadFriends();
  renderAll();
  const seenBuild = localStorage.getItem('ascend.system.seenBuild');
  if (seenBuild !== SYSTEM_VERSION) {
    setTimeout(() => queueSystemFlash('CLOUD LINK ONLINE', 'Private beta sync is ready.', 'Encrypted cross-device state • per-user RLS isolation • recovery-key device linking', '◇', `ASCEND v${SYSTEM_VERSION}`), 420);
    localStorage.setItem('ascend.system.seenBuild', SYSTEM_VERSION);
  }
  await updateEntryExperience();
  if(el('sessionBootGate'))el('sessionBootGate').hidden=true;
  applyLaunchTarget();
}

function hydrateSystemVersion() {
  document.querySelectorAll('[data-system-version]').forEach(node => { node.textContent = SYSTEM_VERSION; });
  document.querySelectorAll('[data-system-version-prefix]').forEach(node => { node.textContent = `v${SYSTEM_VERSION}`; });
}

function populateSelects(){const cats=availableCategories(),options=cats.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');const allOptions=CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('');el('formCategory').innerHTML=options;if(el('projectCategory'))el('projectCategory').innerHTML=options;if(el('listCategory'))el('listCategory').innerHTML=options;if(el('habitCategory'))el('habitCategory').innerHTML=allOptions;el('formSecondaryCategory').innerHTML=`<option value="">None</option>${options}`;el('categoryFilter').innerHTML=`<option value="All">All categories</option>${options}`;el('formType').innerHTML=QUEST_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('');el('typeFilter').innerHTML=`<option value="All">All quest types</option>${QUEST_TYPES.map(t=>`<option value="${t}">${t}</option>`).join('')}`;const groups=['Progression','Rank','Discipline',...selectedFocusAreas()];el('achievementGroupFilter').innerHTML=`<option value="All">All paths</option>${groups.map(g=>`<option value="${escapeHtml(g)}">${escapeHtml(g)}</option>`).join('')}`;}

function bindEvents() {
  document.querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', () => switchView(btn.dataset.view)));
  el('quickQuestButton').addEventListener('click', () => openQuestDialog());
  el('newQuestInBoard').addEventListener('click', () => openQuestDialog());
  el('openAiQuestConsoleButton').addEventListener('click', openAiQuestConsole);
  el('mobileAddButton').addEventListener('click', () => openQuestDialog());
  el('directiveAction').addEventListener('click', () => switchView('quests'));
  el('analyzeQuestButton').addEventListener('click', analyzeQuest);
  el('voiceQuestButton').addEventListener('click', toggleVoiceQuestCapture);
  const savedVoiceLanguage=localStorage.getItem(VOICE_LANGUAGE_KEY)||'ar-SA';
  if(el('voiceQuestLanguage')){
    el('voiceQuestLanguage').value=['ar-SA','en-US'].includes(savedVoiceLanguage)?savedVoiceLanguage:'ar-SA';
    el('voiceQuestLanguage').addEventListener('change',event=>localStorage.setItem(VOICE_LANGUAGE_KEY,event.target.value));
  }
  el('questInput').addEventListener('input', event => {
    // Programmatic prefill does not fire an input event. A real user edit does,
    // so an unrelated rewritten objective can never accept the original request.
    if (event.isTrusted && pendingExternalRequestId) { pendingExternalRequestId = null; pendingExternalRequestText = ''; }
  });
  el('questInput').addEventListener('keydown', e => { if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') analyzeQuest(); });
  el('questForm').addEventListener('submit', e => { e.preventDefault(); saveQuestFromForm(); });
  el('formReminderEnabled')?.addEventListener('change',()=>{el('formReminderAtField').hidden=!el('formReminderEnabled').checked;});
  // Modal controls use capture + delegation so Cancel/Close keep working even after future UI re-renders.
  document.addEventListener('click', e => {
    const closeControl = e.target.closest?.('#cancelQuestButton, #dialogCloseButton');
    if (closeControl) { e.preventDefault(); e.stopPropagation(); closeQuestDialog(); return; }
    if (e.target === el('questDialog')) closeQuestDialog();
  }, true);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && !el('questDialog').hidden) closeQuestDialog(); });

  ['formCategory','formSecondaryCategory','formType','formPriority','formDifficulty','formMinutes','formLongTerm','formImpact'].forEach(id => {
    el(id).addEventListener('change', handleQuestRewardInput);
    el(id).addEventListener('input', handleQuestRewardInput);
  });
  el('formTitle').addEventListener('input', handleQuestRewardInput);
  el('formTitle').addEventListener('input', () => {
    clearTimeout(autoClassifyTimer);
    autoClassifyTimer = setTimeout(() => void autoClassifyQuestTitle(), 700);
  });
  el('discardQuestButton').addEventListener('click', discardQuestReview);

  el('categoryFilter').addEventListener('change', renderQuestBoard);
  el('questScopeFilter')?.addEventListener('change', renderQuestBoard);
  el('typeFilter').addEventListener('change', renderQuestBoard);
  el('statusFilter').addEventListener('change', renderQuestBoard);
  el('dateFilter').addEventListener('change', renderQuestBoard);
  el('achievementGroupFilter').addEventListener('change', renderAchievements);
  el('achievementStatusFilter').addEventListener('change', renderAchievements);
  el('saveProfileButton').addEventListener('click', saveProfile);
  el('editFocusAreasButton').addEventListener('click',()=>openOnboarding({recalibrate:true}));
  el('saveSeasonButton').addEventListener('click', saveSeason);
  el('saveSystemContextButton').addEventListener('click', saveSystemContext);
  el('testAiButton').addEventListener('click', testAiConnection);
  el('directiveRefreshButton').addEventListener('click', generateDirective);
  el('runSystemReviewButton').addEventListener('click', runSystemReview);
  el('exportButton').addEventListener('click', exportBackup);
  el('importInput').addEventListener('change', importBackup);
  el('resetButton').addEventListener('click', resetData);
  el('installButton').addEventListener('click', installApp);
  el('installFromSettingsButton').addEventListener('click', installApp);
  el('cloudStatusButton').addEventListener('click', openCloudSettings);
  el('sidebarAccountButton').addEventListener('click', openCloudSettings);
  el('cloudSignInButton').addEventListener('click', ()=>cloudSignIn('settings'));
  el('cloudSignUpButton').addEventListener('click', ()=>cloudSignUp('settings'));
  el('cloudSignInButton').addEventListener('pointerenter', ()=>initTurnstileSlot('settings'), {once:true});
  el('cloudSignUpButton').addEventListener('pointerenter', ()=>initTurnstileSlot('settings'), {once:true});
  el('cloudSignOutButton').addEventListener('click', cloudSignOut);
  if (el('sidebarLogoutButton')) el('sidebarLogoutButton').addEventListener('click', quickLogout);
  if (el('sheetLogoutButton')) el('sheetLogoutButton').addEventListener('click', quickLogout);
  if(el('sidebarDeleteGuestButton'))el('sidebarDeleteGuestButton').addEventListener('click',deleteGuestProfile);
  if(el('sheetDeleteGuestButton'))el('sheetDeleteGuestButton').addEventListener('click',deleteGuestProfile);
  if(el('sidebarDeleteAccountButton'))el('sidebarDeleteAccountButton').addEventListener('click',openDeleteAccountDialog);
  if(el('sheetDeleteAccountButton'))el('sheetDeleteAccountButton').addEventListener('click',openDeleteAccountDialog);
  if(el('deleteCloudAccountButton'))el('deleteCloudAccountButton').addEventListener('click',openDeleteAccountDialog);
  el('cloudSyncNowButton').addEventListener('click', () => syncCloudNow({ manual:true }));
  el('cloudCopyRecoveryKeyButton').addEventListener('click', copyRecoveryKey);
  el('cloudDownloadRecoveryKeyButton').addEventListener('click', downloadRecoveryKey);
  el('cloudImportRecoveryKeyButton').addEventListener('click', importRecoveryKey);
  el('cloudRecoveryFileInput').addEventListener('change', importRecoveryFile);
  el('vaultUnlockButton').addEventListener('click', unlockVaultFromGate);
  el('vaultUnlockFileInput').addEventListener('change', importRecoveryFileFromGate);
  el('vaultUnlockKeyInput').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); void unlockVaultFromGate(); } });
  el('vaultUnlockSignOutButton').addEventListener('click', cloudSignOut);
  el('recoveryDialogDownloadButton').addEventListener('click', downloadRecoveryKey);
  el('recoveryDialogCopyButton').addEventListener('click', copyRecoveryKey);
  el('recoverySavedAcknowledge').addEventListener('change', e => { el('recoveryBackupDoneButton').disabled = !e.target.checked; });
  el('recoveryBackupDoneButton').addEventListener('click', acknowledgeRecoveryBackup);
  el('sendFeedbackButton').addEventListener('click', submitBetaFeedback);
  el('createExternalRequestLinkButton').addEventListener('click', () => configureExternalRequestLink(false));
  el('rotateExternalRequestLinkButton').addEventListener('click', () => configureExternalRequestLink(true));
  el('toggleExternalRequestLinkButton').addEventListener('click', toggleExternalRequestLink);
  el('copyExternalRequestLinkButton').addEventListener('click', copyExternalRequestLink);
  el('openExternalInboxButton').addEventListener('click', () => switchView('quests'));
  el('refreshExternalRequestsButton').addEventListener('click', () => loadExternalRequests(true));
  el('runTourButton').addEventListener('click', startGuidedTour);
  el('tourNextButton').addEventListener('click', () => moveGuidedTour(1));
  el('tourBackButton').addEventListener('click', () => moveGuidedTour(-1));
  el('tourSkipButton').addEventListener('click', finishGuidedTour);
  el('guidedTour').addEventListener('wheel', blockGuidedTourScroll, { passive:false });
  el('guidedTour').addEventListener('touchmove', blockGuidedTourScroll, { passive:false });
  bindIdentityExperience();
  bindProjectEvents();
  bindPlannerEvents();
  bindHabitEvents();
  bindCircleEvents();
  bindFriendEvents();
  document.addEventListener('keydown', blockGuidedTourScroll, { passive:false });
  window.addEventListener('scroll', scheduleGuidedTourPosition, { passive:true });
  window.addEventListener('resize', scheduleGuidedTourPosition, { passive:true });
  el('mobileMoreButton').addEventListener('click', openMobileSystemSheet);
  el('mobileSheetBackdrop').addEventListener('click', closeMobileSystemSheet);
  el('sheetSyncButton').addEventListener('click', () => { closeMobileSystemSheet(); cloudUser ? syncCloudNow({manual:true}) : openCloudSettings(); });
  el('mobileSystemSheet').querySelectorAll('[data-view]').forEach(btn => btn.addEventListener('click', closeMobileSystemSheet));
  window.addEventListener('online', () => { if (cloudUser) { syncCloudNow(); if(cloudConfig.externalRequestsEnabled&&state.externalInbox?.privateKeyEnvelope)loadExternalRequests(); if(cloudConfig.socialEnabled&&views.circles.classList.contains('active'))loadFocusCircles(); if(cloudConfig.socialEnabled)loadFriends(); } else renderCloudStatus(); });
  window.addEventListener('offline', renderCloudStatus);
  window.addEventListener('focus', () => { refreshDateSensitiveState(); if (cloudUser && navigator.onLine) { if(cloudConfig.externalRequestsEnabled&&state.externalInbox?.privateKeyEnvelope)loadExternalRequests(); if(cloudConfig.socialEnabled&&views.circles.classList.contains('active'))loadFocusCircles(); if(cloudConfig.socialEnabled)loadFriends(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { refreshDateSensitiveState(); if (cloudUser && navigator.onLine) { syncCloudNow(); if(cloudConfig.externalRequestsEnabled&&state.externalInbox?.privateKeyEnvelope)loadExternalRequests(); if(cloudConfig.socialEnabled&&views.circles.classList.contains('active'))loadFocusCircles(); if(cloudConfig.socialEnabled)loadFriends(); } } });
}


function switchView(name) {
  if (!views[name]) return;
  closeMobileSystemSheet();
  Object.entries(views).forEach(([key, node]) => node.classList.toggle('active', key === name));
  document.querySelectorAll('[data-view]').forEach(btn => btn.classList.toggle('active', btn.dataset.view === name));
  el('viewEyebrow').textContent = viewMeta[name][0];
  el('viewTitle').textContent = viewMeta[name][1];
  if (name === 'progress') renderProgress();
  if (name === 'guide') renderGuide();
  if (name === 'settings') renderSettings();
  if (name === 'quests') void loadExternalRequests();
  if (name === 'planner') renderPlanner();
  if (name === 'habits') renderHabits();
  if (name === 'circles') { renderFocusCircles(); void loadFocusCircles(); }
  if (name === 'friends') { renderFriends(); void loadFriends(); }
  if (name === 'achievements') renderAchievements();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function openAiQuestConsole(){
  switchView('dashboard');
  requestAnimationFrame(()=>{
    const consolePanel=document.querySelector('.quest-primary-section');
    consolePanel?.scrollIntoView({behavior:'smooth',block:'start'});
    setTimeout(()=>el('questInput')?.focus({preventScroll:true}),420);
  });
}

function voiceQuestLanguage(){
  return el('voiceQuestLanguage')?.value==='en-US'?'en-US':'ar-SA';
}

function setVoiceQuestUi(listening,message=''){
  voiceListening=Boolean(listening);
  const button=el('voiceQuestButton'),status=el('voiceQuestStatus');
  button?.classList.toggle('listening',voiceListening);
  button?.setAttribute('aria-pressed',String(voiceListening));
  if(button)button.querySelector('strong').textContent=voiceListening?'Stop':'Voice';
  if(status){status.hidden=!message;status.textContent=message;}
}

function stopVoiceQuestCapture(){
  if(voiceRecognition&&voiceListening){try{voiceRecognition.stop();}catch{}}
  setVoiceQuestUi(false,'');
}

function toggleVoiceQuestCapture(){
  if(voiceListening)return stopVoiceQuestCapture();
  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SpeechRecognition)return toast('Voice capture is not supported by this browser. Type the quest or use Safari/Chrome voice dictation.');
  if(!window.isSecureContext)return toast('Voice capture requires the secure HTTPS version of ASCEND.');
  const original=el('questInput').value.trim();
  let finalTranscript='';
  voiceRecognition=new SpeechRecognition();
  voiceRecognition.lang=voiceQuestLanguage();
  // A single utterance is more reliable across Safari/Chrome language engines.
  // Press Voice again to append another sentence.
  voiceRecognition.continuous=false;
  voiceRecognition.interimResults=true;
  voiceRecognition.onstart=()=>setVoiceQuestUi(true,'Listening… Your browser speech service may process audio; ASCEND does not store audio.');
  voiceRecognition.onresult=event=>{
    let interim='';
    for(let i=event.resultIndex;i<event.results.length;i++){
      const text=String(event.results[i][0]?.transcript||'').trim();
      if(event.results[i].isFinal)finalTranscript+=`${finalTranscript?' ':''}${text}`;
      else interim+=`${interim?' ':''}${text}`;
    }
    el('questInput').value=[original,finalTranscript||interim].filter(Boolean).join(original?' ':'');
    el('questInput').dispatchEvent(new Event('input',{bubbles:true}));
  };
  voiceRecognition.onerror=event=>{
    const message=event.error==='not-allowed'?'Microphone permission was denied. Enable it in browser settings.':event.error==='no-speech'?'No speech was detected. Try again.':'Voice capture stopped. You can keep typing.';
    setVoiceQuestUi(false,message);toast(message);
  };
  voiceRecognition.onend=()=>setVoiceQuestUi(false,finalTranscript?'Voice captured. Review the text before analysis.':'');
  try{voiceRecognition.start();}catch{setVoiceQuestUi(false,'');toast('Voice capture could not start. Try again.');}
}

async function checkAiStatus() {
  try {
    const response = await fetch('/api/health', { cache: 'no-store' });
    const data = await response.json();
    const status = document.querySelector('.status-dot');
    if (data.aiConfigured) {
      el('aiStatus').textContent = `Semantic AI online • ${data.model}`;
      status.classList.add('ai-on');
      el('classifierMode').textContent = 'GEMINI';
      el('classifierMode').classList.add('ai');
      el('settingsAiStatus').textContent = `Connected • ${data.model}`;
      el('aiConnectionBadge').textContent = 'CONNECTED';
      el('aiConnectionBadge').classList.add('ai');
      el('aiConnectionDetail').textContent = 'API key detected on the local Node server. The key is never sent to the browser.';
    } else {
      el('aiStatus').textContent = 'Deep local intelligence active';
      status.classList.remove('ai-on');
      el('classifierMode').textContent = 'LOCAL+';
      el('classifierMode').classList.remove('ai');
      el('settingsAiStatus').textContent = 'Deep local classifier';
      el('aiConnectionBadge').textContent = 'LOCAL';
      el('aiConnectionBadge').classList.remove('ai');
      el('aiConnectionDetail').textContent = 'No API key detected. Quest analysis, directives, and reviews still work using the local fallback engine.';
    }
    state.ai ||= {};
    state.ai.lastMode = data.aiConfigured ? 'ai' : 'local+';
    saveState({ preserveUpdatedAt:true, skipCloud:true });
  } catch {
    el('aiStatus').textContent = 'Offline local intelligence';
    el('settingsAiStatus').textContent = 'Server status unavailable';
    el('aiConnectionBadge').textContent = 'OFFLINE';
    el('aiConnectionDetail').textContent = 'The local browser can still show saved data, but the Node server is not responding.';
  }
}


function base64UrlEncode(bytes) {
  let binary = '';
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 0x8000) binary += String.fromCharCode(...view.subarray(i, i + 0x8000));
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(text) {
  const normalized = String(text || '').replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4 || 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, ch => ch.charCodeAt(0));
}

function vaultKeyStorageKey(userId) { return `${VAULT_KEY_PREFIX}${userId}`; }
function recoverySavedStorageKey(userId) { return `${RECOVERY_SAVED_PREFIX}${userId}`; }
function hasStoredVaultKey(userId = cloudUser?.id) { return Boolean(userId && localStorage.getItem(vaultKeyStorageKey(userId))); }
function recoveryBackupAcknowledged(userId = cloudUser?.id) { return Boolean(userId && localStorage.getItem(recoverySavedStorageKey(userId)) === '1'); }

async function importVaultCryptoKey(rawBytes) {
  if (!globalThis.isSecureContext || !globalThis.crypto?.subtle) throw new Error('Encrypted sync requires a secure HTTPS browser context on this device. Open the HTTPS deployment, then try again.');
  return globalThis.crypto.subtle.importKey('raw', rawBytes, { name:'AES-GCM' }, false, ['encrypt','decrypt']);
}

async function loadVaultKey(userId = cloudUser?.id) {
  if (!userId) return null;
  if (vaultKeyCache?.userId === userId) return vaultKeyCache;
  const rawText = localStorage.getItem(vaultKeyStorageKey(userId));
  if (!rawText) return null;
  try {
    const raw = base64UrlDecode(rawText);
    if (raw.length !== 32) throw new Error('Invalid vault key length.');
    const key = await importVaultCryptoKey(raw);
    vaultKeyCache = { userId, rawText, key };
    return vaultKeyCache;
  } catch (error) {
    console.warn('Stored vault key could not be loaded:', error);
    return null;
  }
}

async function ensureVaultKey(userId = cloudUser?.id) {
  const existing = await loadVaultKey(userId);
  if (existing) return existing;
  if (!userId) throw new Error('A signed-in account is required to create a cloud vault.');
  const raw = globalThis.crypto.getRandomValues(new Uint8Array(32));
  const rawText = base64UrlEncode(raw);
  localStorage.setItem(vaultKeyStorageKey(userId), rawText);
  const key = await importVaultCryptoKey(raw);
  vaultKeyCache = { userId, rawText, key };
  return vaultKeyCache;
}

function formatRecoveryKey(rawText) { return rawText ? `ASCEND1.${rawText}` : ''; }
function parseRecoveryKey(value) {
  const cleaned = String(value || '').trim().replace(/\s+/g, '');
  const rawText = cleaned.startsWith('ASCEND1.') ? cleaned.slice(8) : cleaned;
  const raw = base64UrlDecode(rawText);
  if (raw.length !== 32) throw new Error('Recovery key is invalid.');
  return { rawText, raw };
}

async function copyRecoveryKey() {
  if (!cloudUser?.id) return toast('Sign in before exporting a recovery key.');
  const vault = await loadVaultKey(cloudUser.id);
  if (!vault) return toast('This device does not have the vault key yet. Unlock the vault first.');
  const recovery = formatRecoveryKey(vault.rawText);
  try {
    await navigator.clipboard.writeText(recovery);
    toast('Recovery key copied. Store it somewhere private.');
  } catch {
    window.prompt('Copy this recovery key and keep it private:', recovery);
  }
}

async function recoveryKeyText() {
  if (!cloudUser?.id) throw new Error('Sign in before exporting a recovery key.');
  const vault = await loadVaultKey(cloudUser.id);
  if (!vault) throw new Error('This device does not have the vault key yet. Unlock the vault first.');
  return formatRecoveryKey(vault.rawText);
}

async function downloadRecoveryKey() {
  try {
    const recovery = await recoveryKeyText();
    const safeEmail = String(cloudUser?.email || 'account').replace(/[^a-z0-9@._-]+/gi,'-').slice(0,70);
    const content = `ASCEND Recovery File\nAccount: ${cloudUser?.email || 'ASCEND account'}\nVersion: ${SYSTEM_VERSION}\n\nRecovery Key:\n${recovery}\n\nKeep this file private. It is needed once when unlocking encrypted progress on a new browser or device.\n`;
    const url = URL.createObjectURL(new Blob([content], {type:'text/plain;charset=utf-8'}));
    const link = document.createElement('a');
    link.href = url; link.download = `ASCEND-Recovery-${safeEmail}.txt`;
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Recovery File downloaded. Keep it private.');
  } catch (error) { toast(error.message || 'Could not download the Recovery File.'); }
}

function recoveryKeyFromFileText(value) {
  const match = String(value || '').match(/ASCEND1\.[A-Za-z0-9_-]+/);
  return match?.[0] || String(value || '').trim();
}

async function importRecoveryFile(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 32_000) return toast('That Recovery File is unexpectedly large.');
  try {
    el('cloudRecoveryKeyInput').value = recoveryKeyFromFileText(await file.text());
    await importRecoveryKey();
  } catch (error) { toast(error.message || 'Could not read the Recovery File.'); }
}

async function importRecoveryFileFromGate(event) {
  const file = event.target.files?.[0];
  event.target.value = '';
  if (!file) return;
  if (file.size > 32_000) return setVaultUnlockStatus('That Recovery File is unexpectedly large.', true);
  try {
    el('vaultUnlockKeyInput').value = recoveryKeyFromFileText(await file.text());
    await unlockVaultFromGate();
  } catch (error) { setVaultUnlockStatus(error.message || 'Could not read the Recovery File.', true); }
}

function showRecoveryBackupDialog() {
  if (!cloudUser?.id || !state.profile?.onboardingComplete || vaultRecoveryRequired || !hasStoredVaultKey(cloudUser.id) || recoveryBackupAcknowledged(cloudUser.id)) return;
  el('recoverySavedAcknowledge').checked = false;
  el('recoveryBackupDoneButton').disabled = true;
  el('recoveryBackupDialog').hidden = false;
}

function acknowledgeRecoveryBackup() {
  if (!cloudUser?.id || !el('recoverySavedAcknowledge').checked) return;
  localStorage.setItem(recoverySavedStorageKey(cloudUser.id), '1');
  el('recoveryBackupDialog').hidden = true;
  renderCloudStatus();
  toast('Recovery backup confirmed for this account.');
}

async function unlockVaultWithRecoveryValue(value) {
  if (!cloudUser?.id) throw new Error('Sign in before unlocking a cloud vault.');
  if (!String(value || '').trim()) throw new Error('Paste the recovery key or choose your Recovery File first.');
  const userId = cloudUser.id;
  try {
    const parsed = parseRecoveryKey(value);
    await importVaultCryptoKey(parsed.raw);
    localStorage.setItem(vaultKeyStorageKey(userId), parsed.rawText);
    vaultKeyCache = { userId, rawText:parsed.rawText, key:await importVaultCryptoKey(parsed.raw) };
    vaultRecoveryRequired = false;
    vaultUnlockHydrationRequired = true;
    await activateCloudIdentity();
    if (vaultRecoveryRequired) throw new Error('This Recovery File or key does not match the encrypted vault for this account.');
    localStorage.setItem(recoverySavedStorageKey(userId), '1');
    return true;
  } catch (error) {
    localStorage.removeItem(vaultKeyStorageKey(userId));
    vaultKeyCache = null;
    vaultUnlockHydrationRequired = false;
    vaultRecoveryRequired = true;
    cloudStatus = 'locked';
    renderCloudStatus();
    throw error;
  }
}

async function importRecoveryKey() {
  const value = el('cloudRecoveryKeyInput').value.trim();
  try {
    await unlockVaultWithRecoveryValue(value);
    el('cloudRecoveryKeyInput').value = '';
    await updateEntryExperience();
    toast('Vault unlocked on this device. Encrypted progress synchronized.');
  } catch (error) { toast(error.message || 'Could not unlock the vault.'); }
}

function setVaultUnlockStatus(message, error = false) {
  const status = el('vaultUnlockStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('error', error);
}

function showVaultUnlockGate() {
  if (!cloudUser || !vaultRecoveryRequired) return false;
  el('entryGate').hidden = true;
  el('onboardingGate').hidden = true;
  el('passwordRecoveryGate').hidden = true;
  el('vaultUnlockGate').hidden = false;
  el('vaultUnlockEmail').textContent = cloudUser.email || 'ASCEND account';
  setVaultUnlockStatus('Your cloud progress is protected. Import the Recovery File from your trusted device to continue.');
  return true;
}

async function unlockVaultFromGate() {
  const button = el('vaultUnlockButton');
  const value = el('vaultUnlockKeyInput').value.trim();
  button.disabled = true;
  button.textContent = 'Decrypting…';
  setVaultUnlockStatus('Verifying the key and decrypting your private player-state…');
  try {
    await unlockVaultWithRecoveryValue(value);
    el('vaultUnlockKeyInput').value = '';
    el('vaultUnlockGate').hidden = true;
    await updateEntryExperience();
    toast('Existing ASCEND progress restored on this device.');
  } catch (error) {
    setVaultUnlockStatus(error.message || 'Could not unlock this encrypted vault.', true);
  } finally {
    button.disabled = false;
    button.textContent = 'Unlock My Progress';
  }
}

function isEncryptedCloudState(candidate) {
  return Boolean(candidate && candidate.encrypted === true && candidate.format === VAULT_FORMAT && candidate.iv && candidate.ciphertext);
}

async function encryptCloudState(candidate, userId = cloudUser?.id) {
  if (!userId) throw new Error('No cloud user is linked.');
  const vault = await ensureVaultKey(userId);
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(12));
  const aad = new TextEncoder().encode(`ASCEND:${userId}:${VAULT_FORMAT}`);
  const plaintext = new TextEncoder().encode(JSON.stringify(candidate));
  const encrypted = await globalThis.crypto.subtle.encrypt({ name:'AES-GCM', iv, additionalData:aad, tagLength:128 }, vault.key, plaintext);
  return {
    encrypted: true,
    format: VAULT_FORMAT,
    iv: base64UrlEncode(iv),
    ciphertext: base64UrlEncode(new Uint8Array(encrypted)),
    stateUpdatedAt: candidate.updatedAt || new Date().toISOString()
  };
}

async function decryptCloudState(envelope, userId = cloudUser?.id) {
  if (!userId) throw new Error('No cloud user is linked.');
  const vault = await loadVaultKey(userId);
  if (!vault) {
    const error = new Error('Recovery key required on this device.');
    error.code = 'VAULT_LOCKED';
    throw error;
  }
  try {
    const iv = base64UrlDecode(envelope.iv);
    const ciphertext = base64UrlDecode(envelope.ciphertext);
    const aad = new TextEncoder().encode(`ASCEND:${userId}:${VAULT_FORMAT}`);
    const decrypted = await globalThis.crypto.subtle.decrypt({ name:'AES-GCM', iv, additionalData:aad, tagLength:128 }, vault.key, ciphertext);
    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch (error) {
    const wrapped = new Error('The recovery key does not match this encrypted vault.');
    wrapped.code = 'VAULT_LOCKED';
    throw wrapped;
  }
}

async function decodeRemoteState(remoteRow, userId = cloudUser?.id) {
  if (!remoteRow) return { state:null, encrypted:false };
  let payload = remoteRow.state ?? remoteRow.encrypted_state ?? null;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = null; }
  }
  if (!payload) return { state:null, encrypted:false };
  if (isEncryptedCloudState(payload)) return { state:migrateState(await decryptCloudState(payload, userId)), encrypted:true };
  return { state:migrateState(payload), encrypted:false };
}

function loadCloudSession() {
  try {
    const tabRaw=sessionStorage.getItem(CLOUD_SESSION_KEY);
    if(tabRaw)return JSON.parse(tabRaw);
    const raw=localStorage.getItem(CLOUD_SESSION_KEY);
    if(!raw)return null;
    const envelope=JSON.parse(raw);
    if(!envelope?.session||Number(envelope.expiresAt)<=Date.now()){localStorage.removeItem(CLOUD_SESSION_KEY);return null;}
    return{...envelope.session,__remembered:true};
  } catch { return null; }
}

function invalidateCloudWork() {
  identityEpoch += 1;
  clearTimeout(cloudSaveTimer);
  cloudSaveTimer = null;
  cloudSyncRunToken = null;
  // Social data is account-scoped server data. Clear it immediately during
  // every identity transition so Account A can never flash inside Account B.
  focusCircles = [];
  focusCirclesLoading = false;
}

function identityStillCurrent(userId, epoch) {
  return Boolean(userId && cloudUser?.id === userId && identityEpoch === epoch);
}

function persistCloudSession(session,{remember=rememberCloudSession}={}) {
  const previousUserId = String(cloudUser?.id || cloudSession?.user?.id || '');
  const nextUserId = String(session?.user?.id || '');
  if (previousUserId !== nextUserId) invalidateCloudWork();
  cloudSession = session || null;
  cloudUser = session?.user || null;
  rememberCloudSession=Boolean(session&&remember);
  sessionStorage.removeItem(CLOUD_SESSION_KEY);
  localStorage.removeItem(CLOUD_SESSION_KEY);
  if(session&&rememberCloudSession)localStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify({expiresAt:Date.now()+CLOUD_SESSION_MAX_AGE_MS,session}));
  else if(session)sessionStorage.setItem(CLOUD_SESSION_KEY,JSON.stringify(session));
}

async function initCloud() {
  try {
    const response = await fetch('/api/config', { cache:'no-store' });
    if (!response.ok) throw new Error('Cloud configuration endpoint unavailable.');
    const data = await response.json();
    cloudConfig = {
      enabled: Boolean(data.cloudEnabled && data.supabaseUrl && data.supabaseAnonKey),
      url: String(data.supabaseUrl || '').replace(/\/$/, ''),
      anonKey: String(data.supabasePublishableKey || data.supabaseAnonKey || ''),
      turnstileEnabled: Boolean(data.turnstileEnabled && data.turnstileSiteKey),
      turnstileSiteKey: String(data.turnstileSiteKey || ''),
      accountDeletionEnabled: Boolean(data.accountDeletionEnabled),
      feedbackEnabled: Boolean(data.feedbackEnabled)
      ,externalRequestsEnabled: Boolean(data.externalRequestsEnabled)
      ,socialEnabled: Boolean(data.socialEnabled)
    };
    if (!cloudConfig.enabled) {
      cloudStatus = 'local';
      renderCloudStatus();
      return;
    }

    cloudStatus = 'ready';
    renderCloudStatus();
    if (cloudSession?.access_token) {
      let user = await cloudGetCurrentUser();
      if (!user && cloudSession?.refresh_token && await refreshCloudSession()) user = await cloudGetCurrentUser();
      if (user) {
        cloudUser = user;
        cloudSession.user = user;
        persistCloudSession(cloudSession);
        await activateCloudIdentity();
        await loadExternalRequests();
      } else {
        persistCloudSession(null);
        cloudStatus = 'ready';
        renderCloudStatus();
      }
    }

    if (!window.__ascendCloudHeartbeat) {
      window.__ascendCloudHeartbeat = setInterval(() => {
        if (cloudUser && !vaultRecoveryRequired && navigator.onLine && !document.hidden) syncCloudNow();
      }, 45000);
    }
  } catch (error) {
    console.warn('ASCEND cloud init failed:', error);
    cloudStatus = 'error';
    renderCloudStatus();
  }
}

function cloudBaseHeaders(authenticated = false) {
  const headers = { apikey: cloudConfig.anonKey, 'Content-Type':'application/json' };
  if (authenticated && cloudSession?.access_token) headers.Authorization = `Bearer ${cloudSession.access_token}`;
  return headers;
}

async function refreshCloudSession() {
  if (!cloudConfig.enabled || !cloudSession?.refresh_token) return false;
  try {
    const response = await fetch(`${cloudConfig.url}/auth/v1/token?grant_type=refresh_token`, {
      method:'POST', headers:cloudBaseHeaders(false), body:JSON.stringify({ refresh_token:cloudSession.refresh_token })
    });
    if (!response.ok) return false;
    const payload = await response.json();
    persistCloudSession({ ...payload, user:payload.user || cloudUser || cloudSession.user });
    return Boolean(cloudSession?.access_token);
  } catch { return false; }
}

async function cloudAuthedFetch(path, options = {}, retry = true) {
  const headers = { ...cloudBaseHeaders(true), ...(options.headers || {}) };
  const response = await fetch(`${cloudConfig.url}${path}`, { ...options, headers });
  if (response.status === 401 && retry && await refreshCloudSession()) return cloudAuthedFetch(path, options, false);
  return response;
}

async function cloudGetCurrentUser() {
  if (!cloudConfig.enabled || !cloudSession?.access_token) return null;
  try {
    const response = await cloudAuthedFetch('/auth/v1/user', { method:'GET' });
    if (!response.ok) return null;
    return await response.json();
  } catch { return null; }
}


let pendingSignupEmail = '';

function showEmailConfirmationState(email) {
  pendingSignupEmail = String(email || '').trim();
  if (el('entryTabs')) el('entryTabs').hidden = true;
  if (el('entryForm')) el('entryForm').hidden = true;
  if (el('entryGuestButton')) el('entryGuestButton').hidden = true;
  if (el('entryNewGuestButton')) el('entryNewGuestButton').hidden = true;
  if (el('entryConfirmationEmail')) el('entryConfirmationEmail').textContent = pendingSignupEmail;
  if (el('entryConfirmation')) el('entryConfirmation').hidden = false;
  setEntryStatus('Account created. Verification is required before the first sign in.');
}

function hideEmailConfirmationState() {
  if (el('entryConfirmation')) el('entryConfirmation').hidden = true;
  if (el('entryTabs')) el('entryTabs').hidden = false;
  if (el('entryForm')) el('entryForm').hidden = false;
  if (el('entryGuestButton')) el('entryGuestButton').hidden = false;
  updateGuestEntryControls();
}

function turnstileApiReady(){return Boolean(globalThis.turnstile && typeof globalThis.turnstile.render==='function');}
async function waitForTurnstileApi(timeoutMs=5000){
  const start=Date.now();while(!turnstileApiReady()&&Date.now()-start<timeoutMs)await new Promise(r=>setTimeout(r,50));return turnstileApiReady();
}
function setTurnstileStatus(name,text,error=false){const slot=turnstileSlots[name],status=el(slot?.status),panel=el(slot?.panel);if(status)status.textContent=text;if(panel){panel.classList.toggle('is-error',error);panel.classList.toggle('is-ready',Boolean(slot?.token)&&!error);}}
async function initTurnstileSlot(name){
  const slot=turnstileSlots[name];if(!slot||!cloudConfig.turnstileEnabled)return false;const panel=el(slot.panel),container=el(slot.widget);if(!panel||!container)return false;panel.hidden=false;
  if(slot.widgetId!==null)return true;
  if(!await waitForTurnstileApi()){setTurnstileStatus(name,'Security service did not load. Check your connection.',true);return false;}
  try{slot.widgetId=globalThis.turnstile.render(container,{sitekey:cloudConfig.turnstileSiteKey,theme:'dark',size:'flexible',callback:(token)=>{slot.token=String(token||'');setTurnstileStatus(name,slot.token?'Security check passed.':'Security check required.');},'expired-callback':()=>{slot.token='';setTurnstileStatus(name,'Security check expired. Please verify again.');},'timeout-callback':()=>{slot.token='';setTurnstileStatus(name,'Security check timed out. Please try again.');},'error-callback':()=>{slot.token='';setTurnstileStatus(name,'Security verification failed. Retry the check.',true);return true;}});setTurnstileStatus(name,'Complete the security check to continue.');return true;}catch(error){setTurnstileStatus(name,'Could not start security verification.',true);return false;}
}
async function initTurnstileWidgets(){if(!cloudConfig.turnstileEnabled)return;await initTurnstileSlot('entry');}
async function requireCaptchaSecurity(name='entry'){
  if(!cloudConfig.turnstileEnabled)return {};
  const slot=turnstileSlots[name]||turnstileSlots.entry;await initTurnstileSlot(name);if(!slot.token){setTurnstileStatus(name,'Complete the security check first.',true);throw new Error('Complete the security check first.');}
  return {gotrue_meta_security:{captcha_token:slot.token}};
}
function resetTurnstile(name='entry'){
  if(!cloudConfig.turnstileEnabled)return;const slot=turnstileSlots[name];if(!slot)return;slot.token='';if(slot.widgetId!==null&&turnstileApiReady()){try{globalThis.turnstile.reset(slot.widgetId);}catch{slot.widgetId=null;el(slot.widget).replaceChildren();void initTurnstileSlot(name);}}setTurnstileStatus(name,'Complete a fresh security check to continue.');
}
function authErrorMessage(payload,fallback='Authentication failed.',mode='auth') {
  const raw=String(payload?.msg||payload?.message||payload?.error_description||payload?.error||fallback||'Authentication failed.');
  const code=String(payload?.code||payload?.error_code||'');
  const combined=`${code} ${raw}`.toLowerCase();
  if(/captcha|security verification/.test(combined)) return 'Security verification was rejected or expired. Complete the check again.';
  if(/invalid login credentials|invalid credentials|invalid_grant|user not found/.test(combined)) return 'Incorrect email or password.';
  if(/email not confirmed|email_not_confirmed/.test(combined)) return 'Email not verified yet. Check your inbox and confirm your email first.';
  if(/too many|rate limit|over_request_rate_limit/.test(combined)) return 'Too many attempts. Wait a moment, then try again.';
  if(/user already registered|already registered|user_already_exists/.test(combined)) return 'This email already has an account. Sign in or use Forgot password.';
  if(/password.*(short|characters|weak)|weak_password/.test(combined)) return mode==='signup' ? 'Use a stronger password with at least 8 characters.' : 'The password does not meet the security requirements.';
  if(/invalid email|email.*invalid|validation_failed/.test(combined)) return 'Enter a valid email address.';
  if(/network|fetch failed|failed to fetch/.test(combined)) return 'Network error. Check your connection and try again.';
  return raw || fallback;
}
function captchaErrorMessage(payload,fallback){return authErrorMessage(payload,fallback,'auth');}
function validEmailAddress(value){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||'').trim());}
function setFieldError(inputId,errorId,message=''){const input=el(inputId),error=el(errorId);if(input)input.classList.toggle('input-error',Boolean(message));if(error){error.textContent=message;error.hidden=!message;}}
function clearEntryFieldErrors(){setFieldError('entryEmail','entryEmailError','');setFieldError('entryPassword','entryPasswordError','');}
function validateEntryCredentials(mode=entryMode){
  clearEntryFieldErrors();
  const email=el('entryEmail').value.trim();
  const password=el('entryPassword').value;
  let ok=true;
  if(!email){setFieldError('entryEmail','entryEmailError','Enter your email address.');ok=false;}
  else if(!validEmailAddress(email)){setFieldError('entryEmail','entryEmailError','Enter a valid email address.');ok=false;}
  if(!password){setFieldError('entryPassword','entryPasswordError','Enter your password.');ok=false;}
  else if(mode==='create'&&password.length<8){setFieldError('entryPassword','entryPasswordError','Use at least 8 characters for a new account.');ok=false;}
  if(!ok)setEntryStatus('Check the highlighted fields and try again.',true);
  return {ok,email,password};
}
function setEntryActionBusy(busy,label=''){const button=el('entryPrimaryButton');if(!button)return;button.disabled=busy;button.textContent=busy?(label||'Working…'):(entryMode==='signin'?'Enter ASCEND':'Create My System');}


async function resendSignupConfirmation(captchaSource='entry') {
  const email=pendingSignupEmail||el('entryEmail')?.value?.trim();if(!email)return setEntryStatus('Enter your email first.',true);if(!cloudConfig.enabled)return setEntryStatus('Cloud is not configured.',true);
  const button=el('entryResendButton');if(button){button.disabled=true;button.textContent='Sending…';}
  try{const security=await requireCaptchaSecurity(captchaSource);const response=await fetch(`${cloudConfig.url}/auth/v1/resend`,{method:'POST',headers:cloudBaseHeaders(false),body:JSON.stringify({type:'signup',email,...security})});const payload=await response.json().catch(()=>({}));if(!response.ok)throw new Error(captchaErrorMessage(payload,'Could not resend verification email.'));setEntryStatus('Verification email sent again. Open the newest email.');toast('Verification email resent.');}
  catch(error){setEntryStatus(error.message||'Could not resend verification email.',true);}finally{resetTurnstile(captchaSource);if(button){button.disabled=false;button.textContent='Resend verification email';}}
}

async function cloudSignUp(captchaSource='settings') {
  if (!cloudConfig.enabled) { const error='Cloud beta is not configured yet. Add Supabase settings first.'; toast(error); return {ok:false,error}; }
  const email = el('cloudEmail').value.trim();
  const password = el('cloudPassword').value;
  if (!email) { const error='Enter your email address.'; toast(error); return {ok:false,error}; }
  if (!validEmailAddress(email)) { const error='Enter a valid email address.'; toast(error); return {ok:false,error}; }
  if (!password) { const error='Enter a password.'; toast(error); return {ok:false,error}; }
  if (password.length < 8) { const error='Use at least 8 characters for a new account.'; toast(error); return {ok:false,error}; }
  setCloudActionBusy(true, 'CREATING ACCOUNT');
  try {
    const security = await requireCaptchaSecurity(captchaSource);
    const response = await fetch(`${cloudConfig.url}/auth/v1/signup`, {
      method:'POST', headers:cloudBaseHeaders(false), body:JSON.stringify({ email, password, data:{ source:'ascend-private-beta', version:SYSTEM_VERSION }, ...security })
    });
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(authErrorMessage(payload, 'Could not create account.', 'signup'));
    await clearDeletedAccountMarker(email);
    if (payload.access_token) {
      persistCloudSession(payload);
      cloudUser = payload.user;
      await activateCloudIdentity();
      await updateEntryExperience();
      toast('Beta account created. Save the recovery key after the first sync.');
      return {ok:true,linked:true};
    }
    showEmailConfirmationState(email);
    toast('Account created. Check your email to verify it.');
    return {ok:true,pendingVerification:true};
  } catch (error) {
    const message=error.message||'Could not create beta account.';
    cloudStatus = 'error';
    renderCloudStatus();
    toast(message);
    return {ok:false,error:message};
  } finally { resetTurnstile(captchaSource); setCloudActionBusy(false); }
}

async function cloudSignIn(captchaSource='settings') {
  if (!cloudConfig.enabled) { const error='Cloud beta is not configured yet. Add Supabase settings first.'; toast(error); return {ok:false,error}; }
  const email = el('cloudEmail').value.trim();
  const password = el('cloudPassword').value;
  if (!email) { const error='Enter your email address.'; toast(error); return {ok:false,error}; }
  if (!validEmailAddress(email)) { const error='Enter a valid email address.'; toast(error); return {ok:false,error}; }
  if (!password) { const error='Enter your password.'; toast(error); return {ok:false,error}; }
  setCloudActionBusy(true, 'LINKING PLAYER');
  try {
    const security = await requireCaptchaSecurity(captchaSource);
    const response = await fetch(`${cloudConfig.url}/auth/v1/token?grant_type=password`, {
      method:'POST', headers:cloudBaseHeaders(false), body:JSON.stringify({ email, password, ...security })
    });
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) {
      const message=authErrorMessage(payload, 'Sign in failed.', 'signin');
      if(message==='Incorrect email or password.'&&await wasDeletedAccountOnThisDevice(email)) throw new Error('This account was deleted on this device. Create a new account to use this email again.');
      throw new Error(message);
    }
    await clearDeletedAccountMarker(email);
    persistCloudSession(payload,{remember:captchaSource==='entry'&&Boolean(el('entryRememberDevice')?.checked)});
    cloudUser = payload.user;
    await activateCloudIdentity();
    await updateEntryExperience();
    if (!vaultRecoveryRequired) toast('Player identity linked. Encrypted sync is ready.');
    return {ok:true};
  } catch (error) {
    const message=error.message||'Sign in failed.';
    cloudStatus = 'error';
    renderCloudStatus();
    toast(message);
    return {ok:false,error:message};
  } finally { resetTurnstile(captchaSource); setCloudActionBusy(false); }
}

function setCloudActionBusy(busy, label = '') {
  ['cloudSignInButton','cloudSignUpButton','cloudSyncNowButton','cloudSignOutButton','cloudCopyRecoveryKeyButton','cloudImportRecoveryKeyButton'].forEach(id => { if (el(id)) el(id).disabled = busy; });
  if (busy && el('cloudConnectionBadge')) el('cloudConnectionBadge').textContent = label || 'WORKING';
  else renderCloudStatus();
}

async function cloudSignOut() {
  // Invalidate pending reads/writes before the network logout so an older request
  // can never apply Account A state after the UI has moved to another identity.
  invalidateCloudWork();
  cloudIdentityTransitioning = true;
  if (cloudUser) {
    try { await cloudAuthedFetch('/auth/v1/logout', { method:'POST' }); } catch {}
  }
  clearTimeout(cloudSaveTimer);
  persistCloudSession(null);
  vaultKeyCache = null;
  vaultRecoveryRequired = false;
  vaultUnlockHydrationRequired = false;
  cloudStatus = cloudConfig.enabled ? 'ready' : 'local';
  guestMode = false;
  localStorage.removeItem(GUEST_ACTIVE_KEY);
  document.body.classList.remove('guest-session');
  activeStorageKey = STORAGE_KEY;
  // Privacy hardening: never reveal another account's cached state after sign-out on a shared device.
  state = defaultState();
  refreshStreak();
  unlockAchievements(false);
  renderAll();
  try { await updateEntryExperience(); }
  finally { cloudIdentityTransitioning = false; }
  toast('Signed out. Account data is hidden on this device until the next identity is authenticated.');
}

function userStorageKey(userId) { return AscendStateScope.accountStorageKey(STORAGE_KEY, userId); }

function currentStateStorageKey() {
  return AscendStateScope.resolveStorageScope({
    baseStateKey:STORAGE_KEY,
    guestStateKey:GUEST_STATE_KEY,
    guestActive:guestMode,
    sessionUserId:guestMode ? '' : (cloudUser?.id || cloudSession?.user?.id || '')
  }).storageKey;
}

async function emailFingerprint(email) {
  const normalized=String(email||'').trim().toLowerCase();
  if(!normalized||!globalThis.crypto?.subtle)return '';
  const bytes=await globalThis.crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalized));
  return [...new Uint8Array(bytes)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function deletedAccountMarkers(){try{const parsed=JSON.parse(localStorage.getItem(DELETED_ACCOUNT_MARKERS_KEY)||'[]');const cutoff=Date.now()-30*86400000;return Array.isArray(parsed)?parsed.filter(x=>x&&typeof x.hash==='string'&&(!x.deletedAt||dateStamp(x.deletedAt)>=cutoff)).slice(-20):[];}catch{return[];}}
async function markDeletedAccount(email){const hash=await emailFingerprint(email);if(!hash)return;const next=deletedAccountMarkers().filter(x=>x.hash!==hash);next.push({hash,deletedAt:new Date().toISOString()});localStorage.setItem(DELETED_ACCOUNT_MARKERS_KEY,JSON.stringify(next.slice(-20)));}
async function clearDeletedAccountMarker(email){const hash=await emailFingerprint(email);if(!hash)return;const next=deletedAccountMarkers().filter(x=>x.hash!==hash);if(next.length)localStorage.setItem(DELETED_ACCOUNT_MARKERS_KEY,JSON.stringify(next));else localStorage.removeItem(DELETED_ACCOUNT_MARKERS_KEY);}
async function wasDeletedAccountOnThisDevice(email){const hash=await emailFingerprint(email);return Boolean(hash&&deletedAccountMarkers().some(x=>x.hash===hash));}

function stateHasMeaningfulProgress(candidate) {
  return Number(candidate?.totalXp || 0) > 0 || (candidate?.quests || []).length > 0 || (candidate?.projects || []).length > 0 || Number(candidate?.metrics?.questsAccepted || 0) > 0 || String(candidate?.profile?.name||'Player') !== 'Player';
}

async function activateCloudIdentity() {
  cloudIdentityTransitioning = true;
  try { return await activateCloudIdentityCore(); }
  finally { cloudIdentityTransitioning = false; }
}

async function activateCloudIdentityCore() {
  if (guestMode) {
    guestMode = false;
    localStorage.removeItem(GUEST_ACTIVE_KEY);
    document.body.classList.remove('guest-session');
  }
  if (!cloudUser?.id) return;
  const userId = cloudUser.id;
  const epoch = identityEpoch;
  cloudStatus = 'syncing';
  vaultRecoveryRequired = false;
  renderCloudStatus();
  const key = userStorageKey(userId);
  let cached = null;
  try { const raw = localStorage.getItem(key); if (raw) cached = migrateState(JSON.parse(raw)); } catch {}
  const remoteRow = await fetchRemoteState(userId, epoch);
  if (!identityStillCurrent(userId, epoch)) return;
  let remote = null;
  let remoteWasEncrypted = false;
  if (remoteRow?.encrypted_state || remoteRow?.state) {
    try {
      const decoded = await decodeRemoteState(remoteRow, userId);
      if (!identityStillCurrent(userId, epoch)) return;
      remote = decoded.state;
      remoteWasEncrypted = decoded.encrypted;
    } catch (error) {
      if (error.code !== 'VAULT_LOCKED') throw error;
      activeStorageKey = key;
      state = cached || defaultState();
      localStorage.setItem(CLOUD_BOUND_USER_KEY, userId);
      // A brand-new device must not persist a default account state while the
      // encrypted cloud payload is still locked. The default is display-only.
      if (cached) localStorage.setItem(activeStorageKey, JSON.stringify(cached));
      vaultRecoveryRequired = true;
      cloudStatus = 'locked';
      refreshStreak();
      unlockAchievements(false);
      renderAll();
      toast('Encrypted cloud progress found. Paste the recovery key to unlock this device.');
      return;
    }
  }

  let chosen = null;

  // Strict identity isolation: authenticated accounts may read ONLY their own account cache
  // or their own RLS-protected cloud row. Generic device state and Guest state are never
  // candidates for an authenticated account, even when the same browser is shared.
  const candidates = [
    cached ? { source:'account-cache', value:cached, stamp:dateStamp(cached.updatedAt) } : null,
    remote ? { source:'cloud', value:remote, stamp:dateStamp(remoteRow?.updated_at || remote.updatedAt) } : null
  ].filter(Boolean);
  const meaningfulCandidates = candidates.filter(item => stateHasMeaningfulProgress(item.value));
  const pool = meaningfulCandidates.length ? meaningfulCandidates : candidates;
  if (vaultUnlockHydrationRequired && remote) {
    // After a new-device unlock, the just-decrypted cloud state is authoritative.
    // Never let an accidental empty/onboarding cache from an older build win by timestamp.
    chosen = AscendStateScope.chooseUnlockedAccountState({ cachedState:cached, remoteState:remote, recoveryUnlock:true, timestamp:value=>dateStamp(value?.updatedAt) });
  } else if (pool.length) {
    pool.sort((a,b) => b.stamp - a.stamp);
    chosen = pool[0].value;
  } else chosen = defaultState();

  await ensureVaultKey(userId);
  if (!identityStillCurrent(userId, epoch)) return;
  activeStorageKey = key;
  state = chosen;
  vaultUnlockHydrationRequired = false;
  state.updatedAt ||= new Date().toISOString();
  localStorage.setItem(CLOUD_BOUND_USER_KEY, userId);
  localStorage.setItem(activeStorageKey, JSON.stringify(state));
  refreshStreak();
  unlockAchievements(false);
  renderAll();

  const localNewer = !remoteRow || dateStamp(state.updatedAt) > dateStamp(remoteRow?.updated_at);
  if (!remoteRow || localNewer || !remoteWasEncrypted) await pushCloudState({ expectedUserId:userId, expectedEpoch:epoch });
  else {
    cloudLastSyncAt = new Date();
    cloudStatus = 'synced';
    renderCloudStatus();
  }
  setTimeout(showRecoveryBackupDialog, 350);
}

async function fetchRemoteState(expectedUserId = cloudUser?.id, expectedEpoch = identityEpoch) {
  if (!identityStillCurrent(expectedUserId, expectedEpoch) || !cloudConfig.enabled) return null;
  const query = `/rest/v1/player_state?select=encrypted_state,updated_at,state_version&user_id=eq.${encodeURIComponent(expectedUserId)}&limit=1`;
  const response = await cloudAuthedFetch(query, { method:'GET', headers:{ Accept:'application/json' } });
  if (!identityStillCurrent(expectedUserId, expectedEpoch)) return null;
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Cloud pull failed (${response.status})${text ? `: ${text.slice(0,160)}` : ''}`);
  }
  const rows = await response.json();
  return rows?.[0] || null;
}

function scheduleCloudPush() {
  if (!cloudUser || !cloudConfig.enabled || vaultRecoveryRequired || cloudIdentityTransitioning) return;
  clearTimeout(cloudSaveTimer);
  const expectedUserId = cloudUser.id;
  const expectedEpoch = identityEpoch;
  cloudStatus = navigator.onLine ? 'syncing' : 'offline';
  renderCloudStatus();
  cloudSaveTimer = setTimeout(() => pushCloudState({ expectedUserId, expectedEpoch }).catch(error => {
    if (!identityStillCurrent(expectedUserId, expectedEpoch)) return;
    console.warn('Cloud autosave failed:', error);
    cloudStatus = navigator.onLine ? 'error' : 'offline';
    renderCloudStatus();
  }), 850);
}

async function pushCloudState({ expectedUserId = cloudUser?.id, expectedEpoch = identityEpoch } = {}) {
  if (!identityStillCurrent(expectedUserId, expectedEpoch) || !cloudConfig.enabled || !navigator.onLine) {
    cloudStatus = navigator.onLine ? 'ready' : 'offline';
    renderCloudStatus();
    return false;
  }
  if (vaultRecoveryRequired) {
    cloudStatus = 'locked';
    renderCloudStatus();
    return false;
  }
  const stateSnapshot = structuredClone(state);
  const encryptedState = await encryptCloudState(stateSnapshot, expectedUserId);
  if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
  const payload = {
    user_id: expectedUserId,
    encrypted_state: JSON.stringify(encryptedState),
    state_version: 1,
    updated_at: stateSnapshot.updatedAt || new Date().toISOString()
  };
  cloudStatus = 'syncing';
  renderCloudStatus();
  const response = await cloudAuthedFetch('/rest/v1/player_state?on_conflict=user_id', {
    method:'POST',
    headers:{ Prefer:'resolution=merge-duplicates,return=minimal' },
    body:JSON.stringify(payload)
  });
  if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
  if (!response.ok) {
    const text = await response.text();
    cloudStatus = 'error';
    renderCloudStatus();
    throw new Error(`Cloud save failed (${response.status})${text ? `: ${text.slice(0,160)}` : ''}`);
  }
  cloudLastSyncAt = new Date();
  cloudStatus = 'synced';
  renderCloudStatus();
  return true;
}

async function syncCloudNow({ manual = false } = {}) {
  if (!cloudConfig.enabled) { if (manual) openCloudSettings(); return false; }
  if (!cloudUser) { if (manual) openCloudSettings(); return false; }
  if (cloudIdentityTransitioning) return false;
  if (vaultRecoveryRequired) { cloudStatus='locked'; renderCloudStatus(); if(manual) toast('Unlock this device with the recovery key before syncing.'); return false; }
  if (!navigator.onLine) { cloudStatus='offline'; renderCloudStatus(); if(manual) toast('Offline. Changes stay safely on this device until connection returns.'); return false; }
  if (cloudSyncRunToken) return false;
  const expectedUserId = cloudUser.id;
  const expectedEpoch = identityEpoch;
  const runToken = {};
  cloudSyncRunToken = runToken;
  cloudStatus = 'syncing';
  renderCloudStatus();
  try {
    const remoteRow = await fetchRemoteState(expectedUserId, expectedEpoch);
    if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
    if (!remoteRow) await pushCloudState({ expectedUserId, expectedEpoch });
    else {
      const decoded = await decodeRemoteState(remoteRow, expectedUserId);
      if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
      const remote = decoded.state;
      const localMeaningful = stateHasMeaningfulProgress(state);
      const remoteMeaningful = stateHasMeaningfulProgress(remote);

      if (remote && remoteMeaningful && !localMeaningful) {
        cloudApplyingRemote = true;
        state = remote;
        activeStorageKey = userStorageKey(expectedUserId);
        saveState({ skipCloud:true, preserveUpdatedAt:true });
        cloudApplyingRemote = false;
        refreshStreak();
        unlockAchievements(false);
        renderAll();
        cloudLastSyncAt = new Date();
        cloudStatus = 'synced';
        renderCloudStatus();
      } else if (localMeaningful && !remoteMeaningful) {
        // Protect real device progress from a newer-but-empty cloud row.
        await pushCloudState({ expectedUserId, expectedEpoch });
      } else if (remote && dateStamp(remoteRow.updated_at) > dateStamp(state.updatedAt)) {
        cloudApplyingRemote = true;
        state = remote;
        activeStorageKey = userStorageKey(expectedUserId);
        saveState({ skipCloud:true, preserveUpdatedAt:true });
        cloudApplyingRemote = false;
        refreshStreak();
        unlockAchievements(false);
        renderAll();
        if (!decoded.encrypted) await pushCloudState({ expectedUserId, expectedEpoch });
        else {
          cloudLastSyncAt = new Date();
          cloudStatus = 'synced';
          renderCloudStatus();
        }
      } else if (!remote || dateStamp(state.updatedAt) > dateStamp(remoteRow.updated_at) || !decoded.encrypted) {
        await pushCloudState({ expectedUserId, expectedEpoch });
      } else {
        cloudLastSyncAt = new Date();
        cloudStatus = 'synced';
        renderCloudStatus();
      }
    }
    if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
    if (manual) toast('Encrypted cloud state synchronized.');
    return true;
  } catch (error) {
    if (!identityStillCurrent(expectedUserId, expectedEpoch)) return false;
    console.warn('Cloud sync failed:', error);
    cloudApplyingRemote = false;
    if (error.code === 'VAULT_LOCKED') {
      vaultRecoveryRequired = true;
      cloudStatus = 'locked';
      renderCloudStatus();
      if (manual) toast('Recovery key required to decrypt cloud progress on this device.');
    } else {
      cloudStatus = 'error';
      renderCloudStatus();
      if (manual) toast(error.message || 'Cloud sync failed.');
    }
    return false;
  } finally { if (cloudSyncRunToken === runToken) cloudSyncRunToken = null; }
}

function dateStamp(value) {
  const n = new Date(value || 0).getTime();
  return Number.isFinite(n) ? n : 0;
}

function secureCryptoAvailable() {
  return Boolean(globalThis.isSecureContext && globalThis.crypto?.subtle);
}

function renderSecureContextStatus() {
  const notice = el('secureContextNotice');
  if (!notice) return;
  const secure = secureCryptoAvailable();
  notice.hidden = secure || !cloudUser;
  if (!secure) {
    const detail = el('secureContextDetail');
    if (detail) {
      const protocol = location.protocol || 'unknown:';
      const host = location.host || 'this address';
      detail.textContent = protocol === 'http:'
        ? `You opened ${host} over HTTP. Sign-in can work, but AES-GCM recovery-key encryption is intentionally blocked by the browser. Open the HTTPS deployment instead.`
        : 'This browser is not exposing Web Crypto in a secure context. Open the HTTPS deployment in Safari or Chrome and try again.';
    }
  }
}

function renderCloudStatus() {
  if (!el('cloudStatusTop')) return;
  renderSecureContextStatus();
  let status = cloudStatus;
  if (!navigator.onLine && cloudUser) status = 'offline';
  let label = 'LOCAL VAULT';
  let badge = 'LOCAL';
  let headline = 'This device is using the Local Vault';
  let desc = cloudConfig.enabled ? 'Cloud beta is configured. Sign in to link this device and synchronize progress.' : 'Your progress stays in this browser until the beta cloud is configured.';
  if (guestMode) { label='GUEST PROFILE'; badge='GUEST'; headline='Guest profile saved on this device'; desc='Guest progress stays only in this browser on this device. It is never uploaded to the cloud or synced to another device.'; }
  if (cloudConfig.enabled && !cloudUser) { label='BETA CLOUD READY'; badge='READY'; headline='Cloud gate ready'; }
  if (cloudUser) { label='ENCRYPTED CLOUD'; badge='LINKED'; headline='Player identity linked across devices'; desc='Changes are cached locally first, encrypted in this browser, then synchronized when online.'; }
  if (status === 'syncing') { label='ENCRYPTING + SYNCING'; badge='SYNC'; }
  if (status === 'synced') { label='ENCRYPTED SYNC'; badge='SYNCED'; }
  if (status === 'offline') { label='OFFLINE VAULT'; badge='OFFLINE'; }
  if (status === 'error') { label='SYNC ATTENTION'; badge='ERROR'; }
  if (status === 'locked' || vaultRecoveryRequired) {
    label='VAULT LOCKED'; badge='LOCKED'; headline='Recovery key required on this device';
    desc='The cloud payload is encrypted. Paste the recovery key from a trusted device before cloud progress can be read or changed here.';
  }

  el('cloudStatusTop').textContent = label;
  el('cloudStatusSidebar').textContent = label;
  el('cloudConnectionBadge').textContent = badge;
  el('sheetCloudState').textContent = badge;
  el('cloudHeadline').textContent = headline;
  el('cloudDescription').textContent = desc;
  el('sheetSyncText').textContent = guestMode ? 'Guest • no cloud' : cloudUser ? ((status === 'locked' || vaultRecoveryRequired) ? 'Vault locked' : status === 'offline' ? 'Offline cache' : status === 'error' ? 'Needs attention' : 'Encrypted account') : cloudConfig.enabled ? 'Sign in to link' : 'Local vault';
  el('sidebarCloudGlyph').textContent = cloudUser ? ((status === 'locked' || vaultRecoveryRequired) ? '⊘' : '◉') : '◎';
  el('architectureStorage').textContent = guestMode ? 'Device-only Guest Profile' : cloudUser ? ((status === 'locked' || vaultRecoveryRequired) ? 'Local Vault + Locked Cloud' : 'Local Vault + Encrypted Cloud Sync') : cloudConfig.enabled ? 'Local Vault + Cloud-ready' : 'Local Vault';

  const statusClass = status === 'synced' ? 'synced' : status === 'syncing' ? 'syncing' : ['error','offline','locked'].includes(status) ? 'error' : 'local';
  el('cloudStatusButton').className = `cloud-pill ${statusClass}`;
  el('sidebarSyncStatus').className = `sync-status ${statusClass}`;
  el('cloudSignedOut').hidden = Boolean(cloudUser);
  el('cloudSignedIn').hidden = !cloudUser;
  if (el('sidebarLogoutButton')) {
    el('sidebarLogoutButton').hidden = !(cloudUser || guestMode);
    el('sidebarLogoutButton').textContent = 'Log Out';
  }
  if (el('sheetLogoutButton')) {
    el('sheetLogoutButton').hidden = !(cloudUser || guestMode);
    const strong = el('sheetLogoutButton').querySelector('strong');
    const small = el('sheetLogoutButton').querySelector('small');
    if (strong) strong.textContent = 'Log Out';
    if (small) small.textContent = guestMode ? 'Guest progress stays on this device' : 'Return to welcome';
  }
  if(el('sidebarDeleteGuestButton'))el('sidebarDeleteGuestButton').hidden=!guestMode;
  if(el('sheetDeleteGuestButton'))el('sheetDeleteGuestButton').hidden=!guestMode;
  if(el('sidebarDeleteAccountButton'))el('sidebarDeleteAccountButton').hidden=!cloudUser;
  if(el('sheetDeleteAccountButton'))el('sheetDeleteAccountButton').hidden=!cloudUser;
  if(el('deleteCloudAccountButton'))el('deleteCloudAccountButton').hidden=!cloudUser;
  if(el('accountDeletionAvailability'))el('accountDeletionAvailability').textContent=cloudConfig.accountDeletionEnabled?'Delete Account is protected by password reauthentication, Turnstile, and a server-only Supabase admin key.':'Delete Account is visible when signed in, but the server admin key still needs to be configured before permanent deletion can run.';
  el('cloudSignInButton').disabled = !cloudConfig.enabled;
  el('cloudSignUpButton').disabled = !cloudConfig.enabled;
  if(el('cloudTurnstilePanel'))el('cloudTurnstilePanel').hidden=!cloudConfig.turnstileEnabled||Boolean(cloudUser);
  if(el('entryTurnstilePanel'))el('entryTurnstilePanel').hidden=!cloudConfig.turnstileEnabled;
  if (cloudUser) {
    const email = cloudUser.email || 'Beta player';
    const hasKey = hasStoredVaultKey(cloudUser.id);
    el('cloudUserEmail').textContent = email;
    el('cloudUserInitial').textContent = email.charAt(0).toUpperCase();
    el('cloudLastSync').textContent = cloudLastSyncAt ? `Last sync ${cloudLastSyncAt.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}` : (vaultRecoveryRequired ? 'Encrypted vault waiting for recovery key' : 'Linked • waiting for first encrypted sync');
    el('cloudVaultStatus').textContent = vaultRecoveryRequired ? 'Recovery key required on this device' : hasKey ? 'Encrypted vault unlocked on this device' : 'Vault key will be created on first sync';
    const cryptoReady = secureCryptoAvailable();
    el('cloudCopyRecoveryKeyButton').disabled = !hasKey || vaultRecoveryRequired || !cryptoReady;
    el('cloudDownloadRecoveryKeyButton').disabled = !hasKey || vaultRecoveryRequired || !cryptoReady;
    el('cloudImportRecoveryKeyButton').disabled = !cryptoReady;
    el('cloudRecoveryKeyInput').disabled = !cryptoReady;
    el('cloudSyncNowButton').disabled = vaultRecoveryRequired || !cryptoReady;
    if (!cryptoReady) el('cloudVaultStatus').textContent = 'HTTPS required to unlock the encrypted vault on this device';
    const backedUp = recoveryBackupAcknowledged(cloudUser.id);
    el('recoveryBackupStatus').textContent = backedUp ? 'Recovery File confirmed saved • this device stays unlocked for normal sign-ins.' : 'Action recommended: download and privately save the Recovery File once.';
    el('recoveryBackupStatus').classList.toggle('is-safe', backedUp);
  }
  if (el('feedbackStateBadge')) el('feedbackStateBadge').textContent = cloudConfig.feedbackEnabled ? (cloudUser ? 'READY' : 'SIGN IN') : 'SETUP NEEDED';
  if (el('sendFeedbackButton')) el('sendFeedbackButton').disabled = !cloudConfig.feedbackEnabled || !cloudUser;
}

function openCloudSettings() {
  closeMobileSystemSheet();
  switchView('settings');
  setTimeout(() => el('cloudSettingsCard').scrollIntoView({ behavior:'smooth', block:'center' }), 80);
  if (guestMode) toast('Guest mode is device-only. Log out to sign in or create a synced account.');
}

function openMobileSystemSheet() {
  el('mobileSystemSheet').hidden = false;
  document.body.classList.add('sheet-open');
  renderCloudStatus();
}

function closeMobileSystemSheet() {
  if (!el('mobileSystemSheet')) return;
  el('mobileSystemSheet').hidden = true;
  document.body.classList.remove('sheet-open');
}

let guidedTourIndex = 0;
let guidedTourRaf = 0;

function isMobileLayout() { return window.matchMedia('(max-width: 900px)').matches; }

function guidedTourVisible() { return el('guidedTour') && !el('guidedTour').hidden; }

function blockGuidedTourScroll(event) {
  if (!guidedTourVisible()) return;
  if (event.type === 'keydown') {
    const blocked = ['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '];
    if (!blocked.includes(event.key)) return;
    if (event.target?.closest?.('button,input,textarea,select')) return;
  }
  event.preventDefault();
}

function scheduleGuidedTourPosition() {
  if (!guidedTourVisible()) return;
  cancelAnimationFrame(guidedTourRaf);
  guidedTourRaf = requestAnimationFrame(() => positionGuidedTour());
}

function startGuidedTour() {
  guidedTourIndex = 0;
  el('guidedTour').hidden = false;
  document.body.classList.add('tour-open');
  renderGuidedTourStep();
}

function moveGuidedTour(delta) {
  const next = guidedTourIndex + delta;
  if (next >= TOUR_STEPS.length) return finishGuidedTour();
  guidedTourIndex = Math.max(0, next);
  renderGuidedTourStep();
}

function finishGuidedTour() {
  localStorage.setItem(TOUR_SEEN_KEY, '1');
  el('guidedTour').hidden = true;
  document.body.classList.remove('tour-open');
  closeMobileSystemSheet();
  cancelAnimationFrame(guidedTourRaf);
  queueSystemFlash('TUTORIAL COMPLETE', 'System controls mapped.', 'You can replay the tour from System at any time.', '✓', 'READY');
  setTimeout(showRecoveryBackupDialog, 350);
}

function renderGuidedTourStep() {
  const step = TOUR_STEPS[guidedTourIndex];
  const mobile = isMobileLayout();
  if (mobile && step.mobileSheet) {
    openMobileSystemSheet();
  } else {
    closeMobileSystemSheet();
    if (step.view) switchView(step.view);
  }
  el('tourProgress').textContent = `${guidedTourIndex + 1} / ${TOUR_STEPS.length}`;
  el('tourSection').textContent = step.section || 'SYSTEM';
  el('tourTitle').textContent = step.title;
  el('tourText').textContent = step.text;
  el('tourBackButton').disabled = guidedTourIndex === 0;
  el('tourNextButton').textContent = guidedTourIndex === TOUR_STEPS.length - 1 ? 'Finish' : 'Next';

  // Wait for the selected view/system sheet to finish laying out before measuring.
  requestAnimationFrame(() => requestAnimationFrame(() => prepareGuidedTourTarget(step)));
}

function getGuidedTourTarget(step = TOUR_STEPS[guidedTourIndex]) {
  const selector = isMobileLayout() && step.mobileSelector ? step.mobileSelector : step.selector;
  return document.querySelector(selector) || el('viewTitle') || document.body;
}

function prepareGuidedTourTarget(step) {
  if (!guidedTourVisible()) return;
  const target = getGuidedTourTarget(step);
  if (!target) return;

  if (!isMobileLayout() || step.mobileSheet) {
    if (!isMobileLayout()) target.scrollIntoView?.({ behavior:'auto', block:'center', inline:'nearest' });
    positionGuidedTour();
    return;
  }

  // On phones the coach panel occupies the lower zone. Move the target into the
  // protected upper viewport instead of scrolling it behind the coach panel.
  const card = el('tourCard');
  card.dataset.mobilePlacement = 'bottom';
  card.style.visibility = 'hidden';
  positionMobileTourCard('bottom');
  const cardTop = card.getBoundingClientRect().top || Math.round(window.innerHeight * .58);
  const safeTop = 74;
  const safeBottom = Math.max(safeTop + 100, cardTop - 20);
  const r = target.getBoundingClientRect();
  const desiredTop = safeTop + Math.max(0, (safeBottom - safeTop - Math.min(r.height, 220)) / 2);
  window.scrollBy({ top:r.top - desiredTop, behavior:'auto' });
  card.style.visibility = '';
  requestAnimationFrame(positionGuidedTour);
}

function clampTourRect(rect, margin = 7) {
  const viewportPad = 10;
  const left = Math.max(viewportPad, rect.left - margin);
  const top = Math.max(viewportPad, rect.top - margin);
  const right = Math.min(window.innerWidth - viewportPad, rect.right + margin);
  const bottom = Math.min(window.innerHeight - viewportPad, rect.bottom + margin);
  return { left, top, right:Math.max(left+30,right), bottom:Math.max(top+30,bottom), width:Math.max(30,right-left), height:Math.max(30,bottom-top) };
}

function rectsOverlap(a, b, gap = 12) {
  return !(a.right + gap <= b.left || a.left >= b.right + gap || a.bottom + gap <= b.top || a.top >= b.bottom + gap);
}

function positionMobileTourCard(placement) {
  const card = el('tourCard');
  card.dataset.mobilePlacement = placement;
  card.style.left = '10px';
  card.style.right = '10px';
  card.style.width = 'auto';
  if (placement === 'top') {
    card.style.top = 'calc(10px + env(safe-area-inset-top))';
    card.style.bottom = 'auto';
  } else {
    card.style.top = 'auto';
    card.style.bottom = 'calc(76px + env(safe-area-inset-bottom))';
  }
}

function positionGuidedTour() {
  if (!guidedTourVisible()) return;
  const step = TOUR_STEPS[guidedTourIndex];
  const target = getGuidedTourTarget(step);
  if (!target) return;
  const rawRect = target.getBoundingClientRect();
  const focus = clampTourRect(rawRect, isMobileLayout() ? 5 : 7);
  const spotlight = el('tourSpotlight');
  spotlight.style.left = `${focus.left}px`;
  spotlight.style.top = `${focus.top}px`;
  spotlight.style.width = `${focus.width}px`;
  spotlight.style.height = `${focus.height}px`;

  const card = el('tourCard');
  if (isMobileLayout()) {
    // System-sheet controls live at the bottom, so coach from the top. Normal
    // page targets stay in a protected upper zone with the coach at the bottom.
    positionMobileTourCard(step.mobileSheet ? 'top' : 'bottom');
    return;
  }

  card.style.right = 'auto'; card.style.bottom = 'auto';
  const viewportPad = 20, gap = 22;
  const cardWidth = Math.min(390, window.innerWidth - viewportPad * 2);
  card.style.width = `${cardWidth}px`;
  const cardHeight = Math.min(card.offsetHeight || 250, window.innerHeight - viewportPad * 2);
  const centeredX = Math.max(viewportPad, Math.min(window.innerWidth-cardWidth-viewportPad, focus.left+focus.width/2-cardWidth/2));
  const centeredY = Math.max(viewportPad, Math.min(window.innerHeight-cardHeight-viewportPad, focus.top+focus.height/2-cardHeight/2));
  const candidates = [
    {left:focus.right+gap,top:centeredY},{left:focus.left-cardWidth-gap,top:centeredY},
    {left:centeredX,top:focus.bottom+gap},{left:centeredX,top:focus.top-cardHeight-gap}
  ];
  const normalize=p=>({left:Math.max(viewportPad,Math.min(window.innerWidth-cardWidth-viewportPad,p.left)),top:Math.max(viewportPad,Math.min(window.innerHeight-cardHeight-viewportPad,p.top))});
  let chosen=null;
  for(const candidate of candidates){const p=normalize(candidate);const box={left:p.left,top:p.top,right:p.left+cardWidth,bottom:p.top+cardHeight};if(!rectsOverlap(box,focus)){chosen=p;break;}}
  if(!chosen){const fallbackTop=focus.top>window.innerHeight/2?viewportPad:window.innerHeight-cardHeight-viewportPad;chosen=normalize({left:(window.innerWidth-cardWidth)/2,top:fallbackTop});}
  card.style.left=`${chosen.left}px`; card.style.top=`${chosen.top}px`;
}

function splitClientObjectives(raw) {
  const cleaned = String(raw || '').replace(/\r/g, '').trim();
  if (!cleaned) return [];
  let parts = cleaned.split(/\n+/).map(line => line.replace(/^\s*(?:[-•*◇◆▪▫✓✔☐]|\d+[.)-])\s*/, '').trim()).filter(Boolean);
  if (parts.length === 1) {
    const strong = cleaned.split(/\s*(?:؛|;|\|\|)\s*/).map(x => x.trim()).filter(Boolean);
    if (strong.length >= 2) parts = strong;
  }
  return parts;
}

function repairClientBatch(items,objectives){
  return items.map((raw,index)=>{
    const item=normalizeAnalyzedQuest({...raw,sourceObjective:raw?.sourceObjective||objectives[index]||''});
    const source=String(item.sourceObjective||objectives[index]||'').trim();
    item.sourceObjective=source;
    return item;
  });
}

async function analyzeQuest() {
  const text = el('questInput').value.trim();
  if (!text) return toast('Describe the quest first.');
  if (pendingExternalRequestId && pendingExternalRequestText && text !== pendingExternalRequestText) { pendingExternalRequestId = null; pendingExternalRequestText = ''; }
  const detectedObjectives = splitClientObjectives(text);
  // External Requests are one proposal. Newlines carry sender/context metadata,
  // never independent objectives. AI may propose subquests inside one Quest.
  if (!pendingExternalRequestId && detectedObjectives.length > 1) {
    toast(`${detectedObjectives.length} objectives detected — switching to batch analysis.`);
    return analyzeQuestList();
  }
  const button = el('analyzeQuestButton');
  button.disabled = true;
  button.textContent = 'Analyzing…';
  el('analysisResult').hidden = true;
  try {
    const response = await fetch('/api/classify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context: buildAiContext(), forceLocal: state.profile?.aiPrivacyMode === 'local', singleObjective:Boolean(pendingExternalRequestId) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Classification failed.');
    pendingQuest = normalizeAnalyzedQuest(data.result);
    // A proposal from another person must stay one readable card. The sender's
    // metadata is context, not extra work, and we do not manufacture subquests.
    if (pendingExternalRequestId) pendingQuest.suggestedSubquests = [];
    renderAnalysis(pendingQuest, data.mode);
  } catch (error) {
    toast(error.message || 'Could not analyze quest.');
  } finally {
    button.disabled = false;
    button.textContent = 'Analyze Quest';
  }
}

async function analyzeQuestList() {
  const text = el('questInput').value.trim();
  if (!text) return toast('Paste one objective per line first.');
  const button = el('analyzeQuestButton');
  button.disabled = true;
  button.textContent = 'Analyzing objectives…';
  const objectives = splitClientObjectives(text);
  renderBatchLoading(objectives.length || 1);
  const startedAt = performance.now();
  try {
    const response = await fetch('/api/classify-batch', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ text, context: buildAiContext(), forceLocal: state.profile?.aiPrivacyMode === 'local' }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Batch classification failed.');
    renderBatchAnalysis(repairClientBatch(data.results || [],objectives), data.mode);
    const seconds = ((performance.now() - startedAt) / 1000).toFixed(1);
    toast(`${(data.results || []).length} objectives analyzed in ${seconds}s.`);
  } catch (error) { toast(error.message || 'Could not analyze list.'); }
  finally { button.disabled = false; button.textContent = 'Analyze Quest'; }
}

function renderBatchLoading(count) {
  const box = el('analysisResult');
  box.hidden = false;
  const safeCount = Math.min(Math.max(Number(count)||1,1),8);
  box.innerHTML = `<div class="batch-head batch-loading-head"><strong>Analyzing ${count} objective${count===1?'':'s'}</strong><span>Gemini • parallel intake</span></div><div class="batch-loading-grid">${Array.from({length:safeCount},()=>`<div class="batch-skeleton"><i></i><b></b><span></span></div>`).join('')}</div>`;
}

function renderBatchAnalysis(items, mode='local+') {
  pendingBatchQuests = Array.isArray(items) ? items.slice() : [];
  pendingBatchMode = mode || 'local+';
  renderPendingBatch();
}

function renderPendingBatch() {
  const box = el('analysisResult');
  box.hidden = false;
  const items = pendingBatchQuests;
  if (!items.length) {
    box.hidden = true;
    box.innerHTML = '';
    return;
  }
  box.innerHTML = `<div class=\"batch-head\"><div><strong>${items.length} objective${items.length===1?'':'s'} ready</strong><span>${escapeHtml(String(pendingBatchMode).toUpperCase())} • review individually, accept all, or discard the batch</span></div><div class=\"batch-head-actions\"><button type=\"button\" id=\"cancelAllBatchButton\" class=\"ghost-btn batch-cancel-all\">Cancel All</button><button type=\"button\" id=\"acceptAllBatchButton\" class=\"primary-btn batch-accept-all\">Accept All ${items.length}</button></div></div>` + items.map((q,i) => `<article class=\"batch-analysis-card\"><div><span class=\"eyebrow\">${escapeHtml(q.category)} • ${escapeHtml(q.questType)}</span><h4>${escapeHtml(q.title)}</h4><div class=\"analysis-chips\"><span>${escapeHtml(q.difficulty)}</span><span>${formatEffort(q.estimatedMinutes)}</span><span>${q.estimatedSessions || 1} sessions</span>${q.dueDate ? `<span>Due ${friendlyDate(q.dueDate)}</span>` : '<span>No deadline</span>'}<span>+${Number(q.xp||0).toLocaleString()} XP</span></div></div><button type=\"button\" class=\"ghost-btn batch-review\" data-batch-index=\"${i}\">Review</button></article>`).join('');
  box.querySelectorAll('.batch-review').forEach(btn => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.batchIndex);
    pendingBatchDialogIndex = index;
    openQuestDialog(items[index], null, 'batch');
  }));
  document.getElementById('cancelAllBatchButton')?.addEventListener('click', cancelAllBatchQuests);
  document.getElementById('acceptAllBatchButton')?.addEventListener('click', acceptAllBatchQuests);
}

function questRecordFromAnalysis(q, source='batch') {
  const normalized = normalizeAnalyzedQuest(q);
  const reward = calculateQuestReward(normalized);
  const subquests = (normalized.suggestedSubquests || []).map((item, index) => ({
    id: crypto.randomUUID(),
    title: typeof item === 'string' ? item : item?.title || `Step ${index + 1}`,
    status: 'active', completedAt: null, xpAwarded: 0, order: index
  }));
  return {
    id: crypto.randomUUID(), title: normalized.title, category: normalized.category, secondaryCategory: normalized.secondaryCategory,
    questType: normalized.questType, priority: normalized.priority, difficulty: normalized.difficulty, estimatedMinutes: normalized.estimatedMinutes,
    longTermValue: normalized.longTermValue, impactScore: normalized.impactScore, xp: normalized.xp, dueDate: normalized.dueDate,
    estimatedSessions: normalized.estimatedSessions, mentalLoad: normalized.mentalLoad, flexibility: normalized.flexibility,
    successCriteria: normalized.successCriteria || '', dependencies: normalized.dependencies || [], suggestedEvidence: normalized.suggestedEvidence || [],
    skillTags: normalized.skillTags || [], intelligenceRationale: normalized.rationale || '', intelligenceConfidence: normalized.confidence || null,
    statImpact: normalized.statImpact || buildStatImpact(normalized.category, normalized.secondaryCategory),
    antiFarm: normalized.antiFarm || { flag: reward.antiFarm, reason: reward.antiFarmReason }, subquests, status: 'active', createdAt: new Date().toISOString(), completedAt: null,
    completionXpAwarded: 0, dailyHistory: [], dailyAwards: {}, source
  };
}

function cancelAllBatchQuests() {
  if (!pendingBatchQuests.length) return;
  const count = pendingBatchQuests.length;
  resetQuestIntake({clearBatch:true});
  toast(`${count} analyzed objective${count===1?'':'s'} discarded.`);
}

function acceptAllBatchQuests() {
  if (batchAcceptInFlight || !pendingBatchQuests.length) return;
  batchAcceptInFlight = true;
  const button = document.getElementById('acceptAllBatchButton');
  if (button) { button.disabled = true; button.textContent = 'Accepting…'; }
  let accepted = 0;
  let duplicates = 0;
  try {
    const acceptedAt = Date.now();
    for (const [index, analyzed] of pendingBatchQuests.entries()) {
      const quest = questRecordFromAnalysis(analyzed, 'batch');
      quest.createdAt = new Date(acceptedAt + index).toISOString();
      if (findRecentDuplicateQuest(quest)) { duplicates += 1; continue; }
      state.quests.unshift(quest);
      state.metrics.questsAccepted += 1;
      addActivity('quest-created', `Quest accepted: ${quest.title}`, 0, quest.category);
      accepted += 1;
    }
    state.ai ||= {}; state.ai.directive = null; state.ai.review = null;
    pendingBatchQuests = [];
    pendingBatchDialogIndex = null;
    saveState();
    unlockAchievements(true);
    renderAll();
    el('questInput').value = '';
    el('analysisResult').hidden = true;
    el('analysisResult').innerHTML = '';
    pendingQuest = null;
    const suffix = duplicates ? ` • ${duplicates} duplicate${duplicates===1?'':'s'} skipped` : '';
    toast(`${accepted} quest${accepted===1?'':'s'} accepted${suffix}.`);
  } catch (error) {
    console.error('Batch accept failed:', error);
    toast('Could not accept the full batch. Your analyzed list is still available.');
    renderPendingBatch();
  } finally {
    batchAcceptInFlight = false;
    const current = document.getElementById('acceptAllBatchButton');
    if (current) { current.disabled = false; current.textContent = `Accept All ${pendingBatchQuests.length}`; }
  }
}

function buildAiContext() {
  const recentCompleted = state.activity.filter(a => a.xp > 0).slice(0, 20);
  return {
    profile: state.profile,
    systemContext: state.systemContext || '',
    overallLevel: overallLevel(state.totalXp),
    totalXp: state.totalXp,
    rankStage: state.rankStage,
    activeQuestCount: activeForToday().length,
    stats:Object.fromEntries(selectedFocusAreas().map(k=>[k,statLevel(state.stats[k]||0)])),
    selectedCategories:selectedFocusAreas(),
    skillLevels:Object.fromEntries(Object.entries(state.skills||{}).map(([k,v])=>[k,statLevel(v)])),
    currentSeason: state.season,
    recentCategories: recentCompleted.map(a => a.category),
    recentCompleted: recentCompleted.slice(0, 8).map(a => ({ label:a.label, category:a.category, xp:a.xp, at:a.at })),
    localDate: localDateKey(new Date())
  };
}

function questForAi(q) {
  return {
    id:q.id, title:q.title, category:q.category, secondaryCategory:q.secondaryCategory || '', questType:q.questType,
    priority:q.priority, difficulty:q.difficulty, estimatedMinutes:q.estimatedMinutes, dueDate:q.dueDate || null,
    longTermValue:q.longTermValue, impactScore:q.impactScore, xp:q.xp, subquestProgress:subquestProgress(q)
  };
}

function intelligenceSignature() {
  return JSON.stringify(activeForToday().map(questForAi).sort((a,b)=>a.id.localeCompare(b.id)));
}

function normalizeAnalyzedQuest(q = {}) {
  const allowed=selectedFocusAreas(),requestedPrimary=canonicalArea(q.category);const primary=allowed.includes(requestedPrimary)?requestedPrimary:allowed[0];const requestedSecondary=canonicalArea(q.secondaryCategory);const secondary=allowed.includes(requestedSecondary)&&requestedSecondary!==primary?requestedSecondary:'';
  const normalized = {
    title: q.title || 'Untitled Quest', category: primary, secondaryCategory: secondary,
    sourceObjective:String(q.sourceObjective||'').trim().slice(0,1000),
    questType: QUEST_TYPES.includes(q.questType) ? q.questType : 'Side Quest', priority: ['Low','Medium','High','Critical'].includes(q.priority) ? q.priority : 'Medium',
    difficulty: ['E','D','C','B','A','S'].includes(q.difficulty) ? q.difficulty : 'D', estimatedMinutes: clamp(Number(q.estimatedMinutes || 60), 5, 100000),
    estimatedSessions: clamp(Number(q.estimatedSessions || Math.ceil(Number(q.estimatedMinutes || 60)/120)), 1, 120),
    dueDate: /^20\d\d-\d\d-\d\d$/.test(String(q.dueDate || '')) ? q.dueDate : null,
    longTermValue: clamp(Number(q.longTermValue || 2),1,5), impactScore: clamp(Number(q.impactScore || 2),1,5),
    mentalLoad: ['Low','Medium','High','Extreme'].includes(q.mentalLoad) ? q.mentalLoad : 'Medium',
    flexibility: ['Flexible','Semi-fixed','Fixed'].includes(q.flexibility) ? q.flexibility : (q.dueDate ? 'Semi-fixed' : 'Flexible'),
    rationale: q.rationale || '', successCriteria:q.successCriteria || '',
    suggestedSubquests: Array.isArray(q.suggestedSubquests) ? q.suggestedSubquests.slice(0, 20) : [],
    dependencies:Array.isArray(q.dependencies) ? q.dependencies.slice(0,8) : [],
    suggestedEvidence:Array.isArray(q.suggestedEvidence) ? q.suggestedEvidence.slice(0,8) : [],
    skillTags:Array.isArray(q.skillTags) ? q.skillTags.slice(0,10) : [],
    antiFarm: q.antiFarm || { flag: false, reason: '' }, confidence: clamp(Number(q.confidence || 0.75), 0, 1)
  };
  const reward = calculateQuestReward(normalized);
  normalized.xp = clamp(Number(q.xp || reward.xp), 3, reward.cap);
  normalized.xp = normalized.antiFarm?.flag ? Math.min(normalized.xp, reward.antiFarmCap) : normalized.xp;
  normalized.statImpact = normalizeStatImpact(q.statImpact, primary, secondary);
  return normalized;
}

function renderAnalysis(q, mode) {
  const container = el('analysisResult');
  container.hidden = false;
  const due = q.dueDate ? `Due ${friendlyDate(q.dueDate)}` : 'No deadline';
  const secondary = q.secondaryCategory ? `<span class="chip">Secondary: ${escapeHtml(q.secondaryCategory)}</span>` : '';
  const anti = q.antiFarm?.flag ? `<div class="anti-farm"><strong>LOW-VALUE CHECK</strong><span>${escapeHtml(q.antiFarm.reason || 'Reward reduced to protect progression integrity.')}</span></div>` : '';
  const subtasks = q.suggestedSubquests?.length ? `<div class="analysis-subquests"><strong>Suggested breakdown</strong>${q.suggestedSubquests.map(x => `<span>◇ ${escapeHtml(typeof x === 'string' ? x : x?.title || '')}</span>`).join('')}</div>` : '';
  const dependencies = q.dependencies?.length ? `<div class="analysis-subquests compact"><strong>Dependencies</strong>${q.dependencies.map(x => `<span>↳ ${escapeHtml(x)}</span>`).join('')}</div>` : '';
  const evidence = q.suggestedEvidence?.length ? `<div class="analysis-subquests compact"><strong>Evidence to keep</strong>${q.suggestedEvidence.map(x => `<span>＋ ${escapeHtml(x)}</span>`).join('')}</div>` : '';
  const statText = Object.entries(q.statImpact || {}).filter(([,v]) => v > 0).map(([k,v]) => `${k} ${Math.round(v*100)}%`).join(' • ');
  const tags = q.skillTags?.length ? `<div class="skill-tag-row">${q.skillTags.map(t=>`<span>${escapeHtml(t)}</span>`).join('')}</div>` : '';
  container.innerHTML = `
    <div class="analysis-top">
      <div><span class="eyebrow">${escapeHtml(mode.toUpperCase())} CLASSIFICATION • ${Math.round(q.confidence*100)}% CONFIDENCE</span><h4>${escapeHtml(q.title)}</h4></div>
      <div class="diff-badge rank-${escapeHtml(q.difficulty)}">${escapeHtml(q.difficulty)}</div>
    </div>
    <div class="analysis-chips">
      <span class="chip hot">${escapeHtml(q.category)}</span>${secondary}<span class="chip">${escapeHtml(q.questType)}</span><span class="chip">${escapeHtml(q.priority)}</span>
      <span class="chip">${formatEffort(q.estimatedMinutes)}</span><span class="chip">${q.estimatedSessions} session${q.estimatedSessions === 1 ? '' : 's'}</span><span class="chip">${escapeHtml(q.mentalLoad)} load</span><span class="chip">${escapeHtml(q.flexibility)}</span><span class="chip">${due}</span><span class="chip reward">+${q.xp.toLocaleString()} XP</span>
    </div>
    ${tags}
    <p>${escapeHtml(q.rationale || '')}</p>
    <p><strong>Stat allocation:</strong> ${escapeHtml(statText || q.category)}</p>
    ${q.successCriteria ? `<p><strong>Done means:</strong> ${escapeHtml(q.successCriteria)}</p>` : ''}
    ${anti}${subtasks}${dependencies}${evidence}
    <div class="analysis-accept"><button id="cancelAnalyzedQuest" class="ghost-btn" type="button">Cancel</button><button id="acceptAnalyzedQuest" class="primary-btn" type="button">Review & Accept</button></div>`;
  document.getElementById('cancelAnalyzedQuest').addEventListener('click', cancelSingleAnalysis);
  document.getElementById('acceptAnalyzedQuest').addEventListener('click', () => openQuestDialog(q));
}
function resetQuestIntake({clearText=true,clearBatch=false}={}){
  stopVoiceQuestCapture();
  if(clearText)el('questInput').value='';
  pendingQuest=null;pendingExternalRequestId=null;pendingExternalRequestText='';
  if(clearBatch){pendingBatchQuests=[];pendingBatchDialogIndex=null;}
  const box=el('analysisResult');box.hidden=true;box.innerHTML='';
}
function cancelSingleAnalysis(){resetQuestIntake();toast('Analyzed quest discarded.');}

function openQuestDialog(prefill = null, editId = null, sourceOverride = null) {
  editingQuestId = editId;
  dialogSource = sourceOverride || (editId ? 'edit' : (prefill ? 'classifier' : 'manual'));
  if (dialogSource !== 'batch') pendingBatchDialogIndex = null;
  questSaveInFlight = false;
  dialogIntelligenceMeta = prefill ? {
    estimatedSessions: prefill.estimatedSessions, mentalLoad: prefill.mentalLoad, flexibility: prefill.flexibility,
    successCriteria: prefill.successCriteria, dependencies: prefill.dependencies, suggestedEvidence: prefill.suggestedEvidence, skillTags: prefill.skillTags,
    rationale: prefill.rationale, confidence: prefill.confidence, antiFarm: prefill.antiFarm
  } : null;
  // An analyzed/existing quest keeps the exact reward the user reviewed. Any
  // reward-affecting form edit unlocks it and triggers a fresh local calculation.
  dialogRewardLocked = Boolean(prefill);
  el('saveQuestButton').disabled = false;
  const q = prefill || {
    title: '', category: 'Personal', secondaryCategory: '', questType: 'Side Quest', priority: 'Medium', difficulty: 'D',
    estimatedMinutes: 60, dueDate: null, longTermValue: 2, impactScore: 2, xp: 30, suggestedSubquests: []
  };
  el('dialogTitle').textContent = editId ? 'Edit Quest' : 'Accept Quest';
  el('saveQuestButton').textContent = editId ? 'Save Changes' : 'Accept Quest';
  const discard=el('discardQuestButton');
  discard.hidden=dialogSource==='manual';
  discard.textContent=dialogSource==='edit'?'Delete Quest':dialogSource==='batch'?'Discard This':'Discard Analysis';
  el('formTitle').value = q.title || '';
  setSelectValue('formCategory', availableCategories().includes(canonicalArea(q.category))?canonicalArea(q.category):(availableCategories()[0]||'Personal'), 'Personal');
  setSelectValue('formSecondaryCategory', availableCategories().includes(canonicalArea(q.secondaryCategory))&&canonicalArea(q.secondaryCategory)!==canonicalArea(q.category)?canonicalArea(q.secondaryCategory):'', '');
  setSelectValue('formType', QUEST_TYPES.includes(q.questType) ? q.questType : 'Side Quest', 'Side Quest');
  setSelectValue('formPriority', q.priority || 'Medium', 'Medium');
  setSelectValue('formDifficulty', q.difficulty || 'D', 'D');
  el('formMinutes').value = q.estimatedMinutes || 60;
  el('formLongTerm').value = q.longTermValue || 2;
  el('formImpact').value = q.impactScore || 2;
  el('formDueDate').value = q.dueDate || '';
  el('formReminderEnabled').checked=Boolean(q.reminderAt);
  el('formReminderAt').value=q.reminderAt?String(q.reminderAt).slice(0,16):'';
  el('formReminderAtField').hidden=!el('formReminderEnabled').checked;
  el('formSubquests').value = (q.suggestedSubquests || q.subquests || []).map(x => typeof x === 'string' ? x : x.title).join('\n');
  // Difficulty, Type, Priority, time and value/impact are always system-determined
  // (from AI/local analysis) so nobody can hand-pick an inflated difficulty to farm XP.
  ['formType','formPriority','formDifficulty','formMinutes','formLongTerm','formImpact'].forEach(id => { el(id).disabled = true; });
  updateFormReward(dialogRewardLocked ? q.xp : null);
  el('questDialog').hidden = false;
  document.body.classList.add('modal-open');
  setTimeout(() => el('formTitle').focus(), 50);
}

function closeQuestDialog() {
  const modal = el('questDialog');
  if (modal) modal.hidden = true;
  document.body.classList.remove('modal-open');
  editingQuestId = null;
  dialogIntelligenceMeta = null;
  dialogRewardLocked = false;
  clearTimeout(autoClassifyTimer);
  autoClassifyToken++;
  pendingBatchDialogIndex = null;
  pendingExternalRequestId = null;
  pendingExternalRequestText = '';
  pendingPlannerItemRef = null;
  questSaveInFlight = false;
  const save = el('saveQuestButton');
  if (save) save.disabled = false;
}

function discardQuestReview(){
  const source=dialogSource;
  const batchIndex=pendingBatchDialogIndex;
  const editId=editingQuestId;
  if(source==='edit'){
    const quest=state.quests.find(item=>item.id===editId);
    if(!quest)return closeQuestDialog();
    if(questHasEarnedProgress(quest))return toast('Undo earned progress before deleting this quest.');
    closeQuestDialog();
    deleteQuest(editId);
    return;
  }
  closeQuestDialog();
  if(source==='batch'&&Number.isInteger(batchIndex)){
    pendingBatchQuests.splice(batchIndex,1);
    if(pendingBatchQuests.length)renderPendingBatch();
    else resetQuestIntake({clearBatch:true});
    toast('This analyzed objective was discarded.');
    return;
  }
  resetQuestIntake();
  toast('Quest analysis discarded.');
}

function setSelectValue(id, value, fallback) {
  const node = el(id);
  if (!node) return;
  node.value = value ?? fallback;
  if (node.value !== String(value ?? fallback)) node.value = fallback;
}

function formQuestData() {
  const secondary = el('formSecondaryCategory').value;
  const category = el('formCategory').value;
  return {
    title: el('formTitle').value.trim(), category,
    secondaryCategory: secondary && secondary !== category ? secondary : '',
    questType: el('formType').value, priority: el('formPriority').value, difficulty: el('formDifficulty').value,
    estimatedMinutes: clamp(Number(el('formMinutes').value || 60), 5, 100000),
    longTermValue: clamp(Number(el('formLongTerm').value || 2), 1, 5), impactScore: clamp(Number(el('formImpact').value || 2), 1, 5),
    dueDate: el('formDueDate').value || null, reminderAt:el('formReminderEnabled').checked&&el('formReminderAt').value?new Date(el('formReminderAt').value).toISOString():null,
    subquestTitles: el('formSubquests').value.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 30)
  };
}

function updateFormReward(forcedXp = null) {
  const q = formQuestData();
  const reward = calculateQuestReward(q);
  const xp = forcedXp && Number.isFinite(Number(forcedXp)) ? clamp(Number(forcedXp), 3, reward.cap) : reward.xp;
  el('formXp').value = xp;
  el('rewardExplanation').innerHTML = `<span>SYSTEM REWARD</span><strong>+${xp.toLocaleString()} XP</strong><small>${escapeHtml(reward.explanation)}${reward.antiFarm ? ' • Anti-farm protection applied.' : ''}</small>`;
}

function handleQuestRewardInput() {
  dialogRewardLocked = false;
  updateFormReward();
}

async function autoClassifyQuestTitle({force=false}={}) {
  // Only the blank "quick add" path needs this — every other entry point
  // (AI analysis, batch, edit, external request, planner) already carries
  // a system-determined difficulty/reward from openQuestDialog's prefill.
  if (dialogSource !== 'manual') return false;
  const text = el('formTitle').value.trim();
  if (text.length < 6) return false;
  if (!force && dialogRewardLocked) return true;
  const token = ++autoClassifyToken;
  el('rewardExplanation').innerHTML = `<span>SYSTEM REWARD</span><strong>Evaluating…</strong><small>Determining Difficulty, Type, Priority and time from your quest title.</small>`;
  try {
    const response = await fetch('/api/classify', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, context: buildAiContext(), forceLocal: state.profile?.aiPrivacyMode === 'local', singleObjective: true })
    });
    const data = await response.json().catch(() => null);
    if (token !== autoClassifyToken || el('questDialog').hidden) return false; // superseded or dialog closed
    if (!response.ok || !data?.result) { updateFormReward(); return false; }
    const q = normalizeAnalyzedQuest(data.result);
    setSelectValue('formType', QUEST_TYPES.includes(q.questType) ? q.questType : 'Side Quest', 'Side Quest');
    setSelectValue('formPriority', q.priority || 'Medium', 'Medium');
    setSelectValue('formDifficulty', q.difficulty || 'D', 'D');
    el('formMinutes').value = q.estimatedMinutes || 60;
    el('formLongTerm').value = q.longTermValue || 2;
    el('formImpact').value = q.impactScore || 2;
    dialogRewardLocked = true;
    updateFormReward(q.xp);
    return true;
  } catch {
    if (token === autoClassifyToken) updateFormReward();
    return false;
  }
}

async function ensureManualQuestClassification(){
  if(dialogSource!=='manual'||dialogRewardLocked)return true;
  clearTimeout(autoClassifyTimer);
  const button=el('saveQuestButton');
  if(button){button.disabled=true;button.textContent='Evaluating…';}
  autoClassifyPromise=autoClassifyQuestTitle({force:true});
  const ok=await autoClassifyPromise;
  autoClassifyPromise=null;
  if(!ok||!dialogRewardLocked){
    if(button){button.disabled=false;button.textContent='Accept Quest';}
    toast('ASCEND could not safely evaluate this quest yet. Check the connection and try again.');
    return false;
  }
  return true;
}

async function saveQuestFromForm() {
  if (questSaveInFlight) return;
  if(!await ensureManualQuestClassification())return;
  const sourceAtSave = dialogSource;
  const batchIndexAtSave = sourceAtSave === 'batch' ? pendingBatchDialogIndex : null;
  const externalRequestIdAtSave = pendingExternalRequestId;
  const plannerItemRefAtSave = pendingPlannerItemRef ? { ...pendingPlannerItemRef } : null;
  const data = formQuestData();
  if (!data.title) return toast('Quest title is required.');

  questSaveInFlight = true;
  const saveButton = el('saveQuestButton');
  if (saveButton) saveButton.disabled = true;

  try {
    const reward = calculateQuestReward(data);
    const reviewedXp = Number(el('formXp').value);
    const acceptedXp = dialogRewardLocked && Number.isFinite(reviewedXp)
      ? clamp(reviewedXp, 3, reward.cap)
      : reward.xp;
    const acceptedAntiFarm = dialogRewardLocked && dialogIntelligenceMeta?.antiFarm
      ? dialogIntelligenceMeta.antiFarm
      : { flag: reward.antiFarm, reason: reward.antiFarmReason };
    const existing = editingQuestId ? state.quests.find(q => q.id === editingQuestId) : null;
    const oldSubquests = existing?.subquests || [];
    const subquests = data.subquestTitles.map((title, index) => {
      const prior = oldSubquests.find(s => s.title.trim().toLowerCase() === title.toLowerCase());
      return prior || { id: crypto.randomUUID(), title, status: 'active', completedAt: null, xpAwarded: 0, order: index };
    });
    const quest = {
      ...(existing || {}),
      id: existing?.id || crypto.randomUUID(), title: data.title, category: data.category, secondaryCategory: data.secondaryCategory,
      questType: data.questType, priority: data.priority, difficulty: data.difficulty, estimatedMinutes: data.estimatedMinutes,
      longTermValue: data.longTermValue, impactScore: data.impactScore, xp: acceptedXp, dueDate: data.dueDate, reminderAt:data.reminderAt,
      estimatedSessions: dialogIntelligenceMeta?.estimatedSessions || existing?.estimatedSessions || Math.max(1, Math.ceil(data.estimatedMinutes / 120)),
      mentalLoad: dialogIntelligenceMeta?.mentalLoad || existing?.mentalLoad || (['A','S'].includes(data.difficulty) ? 'High' : data.difficulty === 'B' ? 'Medium' : 'Low'),
      flexibility: dialogIntelligenceMeta?.flexibility || existing?.flexibility || (data.dueDate ? 'Semi-fixed' : 'Flexible'),
      successCriteria: dialogIntelligenceMeta?.successCriteria || existing?.successCriteria || '',
      dependencies: dialogIntelligenceMeta?.dependencies || existing?.dependencies || [],
      suggestedEvidence: dialogIntelligenceMeta?.suggestedEvidence || existing?.suggestedEvidence || [],
      skillTags: dialogIntelligenceMeta?.skillTags || existing?.skillTags || [],
      intelligenceRationale: dialogIntelligenceMeta?.rationale || existing?.intelligenceRationale || '',
      intelligenceConfidence: dialogIntelligenceMeta?.confidence || existing?.intelligenceConfidence || null,
      statImpact: buildStatImpact(data.category, data.secondaryCategory), antiFarm: acceptedAntiFarm,
      subquests, status: existing?.status || 'active', createdAt: existing?.createdAt || new Date().toISOString(), completedAt: existing?.completedAt || null,
      completionXpAwarded: existing?.completionXpAwarded || 0, dailyHistory: existing?.dailyHistory || [], dailyAwards: existing?.dailyAwards || {},
      source: existing?.source || dialogSource, externalSourceId:existing?.externalSourceId||externalRequestIdAtSave||''
    };
    if (existing?.plannerSource || plannerItemRefAtSave) quest.plannerSource = existing?.plannerSource || plannerItemRefAtSave;
    // Freeze the semantic allocation with the quest. Reopening progress must
    // reverse the same skills even after a later classifier/engine update.
    quest.skillImpact = SKILL_SYSTEM.impactForQuest(quest);

    if (existing) {
      const removedAwarded = oldSubquests.filter(old => old.xpAwarded > 0 && !subquests.some(s => s.id === old.id));
      if (removedAwarded.length) {
        questSaveInFlight = false;
        if (saveButton) saveButton.disabled = false;
        return toast('Completed subquests cannot be removed. Reopen them first.');
      }
      Object.assign(existing, quest);
      addActivity('quest-edited', `Quest updated: ${quest.title}`, 0, quest.category);
      toast('Quest updated.');
    } else {
      const duplicate = findRecentDuplicateQuest(quest);
      if (duplicate) {
        closeQuestDialog();
        if (externalRequestIdAtSave && duplicate.externalSourceId === externalRequestIdAtSave) {
          void updateExternalRequestStatus(externalRequestIdAtSave,'accepted').then(()=>toast('This request was already accepted; the pending copy was closed.')).catch(error=>toast(error.message||'The Quest already exists, but the request inbox still needs refresh.'));
          return;
        }
        if (sourceAtSave === 'batch' && Number.isInteger(batchIndexAtSave)) {
          pendingBatchQuests.splice(batchIndexAtSave, 1);
          renderPendingBatch();
        }
        toast('Duplicate blocked — this quest was already accepted.');
        return;
      }
      state.quests.unshift(quest);
      linkPlannerItemToQuest(plannerItemRefAtSave, quest.id);
      state.metrics.questsAccepted += 1;
      addActivity('quest-created', `Quest accepted: ${quest.title}`, 0, quest.category);
      toast('Quest accepted.');
    }

    // Any board change invalidates cached intelligence.
    state.ai ||= {}; state.ai.directive = null; state.ai.review = null;
    // Close first. A later rendering problem must never trap the modal or allow repeated submissions.
    closeQuestDialog();
    saveState();
    unlockAchievements(true);
    renderAll();
    if(externalRequestIdAtSave)void updateExternalRequestStatus(externalRequestIdAtSave,'accepted').then(()=>toast('External request accepted into your Quest Board.')).catch(error=>toast(error.message||'Quest saved, but the request inbox still needs refresh.'));
    if (sourceAtSave === 'batch' && Number.isInteger(batchIndexAtSave)) {
      pendingBatchQuests.splice(batchIndexAtSave, 1);
      if (pendingBatchQuests.length) {
        renderPendingBatch();
        toast(`${pendingBatchQuests.length} analyzed quest${pendingBatchQuests.length===1?'':'s'} still waiting.`);
      } else {
        el('questInput').value = '';
        el('analysisResult').hidden = true;
        el('analysisResult').innerHTML = '';
      }
    } else {
      el('questInput').value = '';
      el('analysisResult').hidden = true;
    }
    pendingQuest = null;
  } catch (error) {
    console.error('Quest save failed:', error);
    toast('Quest was not fully processed. Check the console and try again.');
  } finally {
    questSaveInFlight = false;
    if (saveButton) saveButton.disabled = false;
  }
}

function findRecentDuplicateQuest(candidate) {
  const signature = questSignature(candidate);
  const now = Date.now();
  return state.quests.find(q => {
    if (q.status !== 'active' || questSignature(q) !== signature) return false;
    const created = new Date(q.createdAt || 0).getTime();
    return Number.isFinite(created) && Math.abs(now - created) < 15000;
  });
}

function questSignature(q) {
  return [String(q.title || '').trim().toLocaleLowerCase(), q.category || '', q.questType || '', q.dueDate || ''].join('|');
}

function calculateQuestReward(q) {
  const minutes = clamp(Number(q.estimatedMinutes || 60), 5, 100000);
  const priorityFactor = { Low: .72, Medium: 1, High: 1.28, Critical: 1.48 }[q.priority] || 1;
  const difficultyFactor = { E: .58, D: .82, C: 1.05, B: 1.38, A: 1.82, S: 2.4 }[q.difficulty] || .82;
  const typeFactor = { 'Daily Quest': .62, 'Side Quest': .9, 'Main Quest': 1.62, 'Campaign Quest': 2.25, 'Boss Quest': 4.1 }[q.questType] || .9;
  const longTermFactor = .82 + clamp(Number(q.longTermValue || 2),1,5) * .17;
  const impactFactor = .82 + clamp(Number(q.impactScore || 2),1,5) * .16;
  const effort = 18 + 22 * Math.min(7.5, Math.sqrt(minutes / 25));
  let raw = effort * priorityFactor * difficultyFactor * typeFactor * longTermFactor * impactFactor;
  const trivial = detectLowValueTask(q, minutes);
  const caps = { 'Daily Quest': 180, 'Side Quest': 550, 'Main Quest': 3500, 'Campaign Quest': 8000, 'Boss Quest': 18000 };
  const cap = caps[q.questType] || 550;
  const antiFarmCap = q.questType === 'Daily Quest' ? 25 : 18;
  if (trivial.flag) raw = Math.min(raw * .35, antiFarmCap);
  const xp = clamp(Math.round(raw / 5) * 5, 3, cap);
  return {
    xp, cap, antiFarmCap, antiFarm: trivial.flag, antiFarmReason: trivial.reason,
    explanation: `${formatMinutes(minutes)} • ${q.difficulty}-difficulty • ${q.priority} priority • value ${q.longTermValue || 2}/5 • impact ${q.impactScore || 2}/5`
  };
}

function detectLowValueTask(q, minutes) {
  const t = String(q.title || '').toLowerCase();
  const tinyWords = /(open laptop|فتح اللابتوب|drink water|اشرب موية|brush teeth|فرش اسنان|charge phone|شحن الجوال|put shoes|لبس الشراب|check phone|افتح الجوال)/i;
  if (tinyWords.test(t)) return { flag: true, reason: 'This looks like a tiny action rather than meaningful progression.' };
  if (minutes <= 10 && Number(q.longTermValue || 1) <= 1 && Number(q.impactScore || 1) <= 1) return { flag: true, reason: 'Very short + low-value tasks receive minimal XP.' };
  return { flag: false, reason: '' };
}

function buildStatImpact(primary, secondary = '') {
  return secondary && secondary !== primary ? { [primary]: .72, [secondary]: .28 } : { [primary]: 1 };
}
function normalizeStatImpact(input, primary, secondary, allowedCategories=availableCategories()) {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    const entries = Object.entries(input).filter(([k,v]) => allowedCategories.includes(canonicalArea(k))&&Number(v)>0);
    const total = entries.reduce((s,[,v]) => s + Number(v), 0);
    if (total > 0) return Object.fromEntries(entries.map(([k,v]) => [k, Number(v)/total]));
  }
  return buildStatImpact(primary, secondary);
}

function subquestReward(quest) {
  const count = Math.max(1, (quest.subquests || []).length);
  return Math.max(3, Math.floor((quest.xp * .35) / count));
}
function subquestEarned(quest) { return (quest.subquests || []).reduce((sum, s) => sum + Number(s.xpAwarded || 0), 0); }
function questHasEarnedProgress(quest){return quest?.status==='completed'||subquestEarned(quest)>0||(quest?.dailyHistory||[]).length>0;}
function finalQuestReward(quest) { return Math.max(0, quest.xp - subquestEarned(quest)); }

function toggleSubquest(questId, subId) {
  const quest = state.quests.find(q => q.id === questId);
  const sub = quest?.subquests?.find(s => s.id === subId);
  if (!quest || !sub) return;
  if (quest.questType === 'Daily Quest' && DAILY_CYCLE.isLocked(quest,localDateKey(new Date()))) return toast(`This Daily Quest unlocks ${friendlyDate(DAILY_CYCLE.scheduledDate(quest))}.`);
  if (quest.status === 'completed') return toast('Reopen the quest before changing completed subquests.');
  if (sub.status === 'completed') {
    const amount = Number(sub.xpAwarded || 0);
    sub.status = 'active'; sub.completedAt = null; sub.xpAwarded = 0;
    if (amount) removeXp(amount, quest);
    state.metrics.subquestsCleared = Math.max(0, state.metrics.subquestsCleared - 1);
    addActivity('subquest-reopened', `Subquest reopened: ${sub.title}`, -amount, quest.category, { parent: quest.title });
  } else {
    const amount = subquestReward(quest);
    sub.status = 'completed'; sub.completedAt = new Date().toISOString(); sub.xpAwarded = amount;
    awardXp(amount, quest);
    state.metrics.subquestsCleared += 1;
    markActiveDay();
    addActivity('subquest-completed', `Subquest cleared: ${sub.title}`, amount, quest.category, { parent: quest.title });
    queueSystemFlash('SUBQUEST CLEARED', sub.title, `+${amount} XP`, '◇', 'SYSTEM PROGRESS');
  }
  saveState(); unlockAchievements(true); renderAll();
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;
  if (quest.questType === 'Daily Quest') return completeDailyQuest(quest);
  if (quest.status === 'completed') return reopenQuest(id);
  const incomplete = (quest.subquests || []).filter(s => s.status !== 'completed');
  if (incomplete.length) return toast(`${incomplete.length} subquest${incomplete.length === 1 ? '' : 's'} remain before this quest can clear.`);

  const oldLevel = overallLevel(state.totalXp);
  const amount = finalQuestReward(quest);
  quest.status = 'completed'; quest.completedAt = new Date().toISOString(); quest.completionXpAwarded = amount;
  awardXp(amount, quest);
  state.metrics.totalClears += 1;
  if (quest.questType === 'Main Quest') state.metrics.mainClears += 1;
  if (quest.questType === 'Boss Quest') state.metrics.bossClears += 1;
  if (quest.questType === 'Campaign Quest') state.metrics.campaignClears += 1;
  markActiveDay();
  addActivity('quest-completed', quest.title, amount, quest.category, { questType: quest.questType, estimatedMinutes: quest.estimatedMinutes, difficulty: quest.difficulty });
  saveState();
  const newLevel = overallLevel(state.totalXp);
  queueSystemFlash(quest.questType === 'Boss Quest' ? 'BOSS DEFEATED' : 'QUEST CLEARED', quest.title, `+${amount.toLocaleString()} XP${newLevel > oldLevel ? ` • LEVEL ${newLevel}` : ''}`, quest.questType === 'Boss Quest' ? '⬢' : '◇', 'SYSTEM CLEAR');
  if (newLevel > oldLevel) queueSystemFlash('LEVEL UP', `Level ${newLevel}`, `${rankDisplay(state.rankStage)} • ${state.totalXp.toLocaleString()} total XP`, '✦', 'PLAYER ADVANCEMENT');
  unlockAchievements(true);
  renderAll();
}

function completeDailyQuest(quest) {
  const today = localDateKey(new Date());
  if (DAILY_CYCLE.isLocked(quest,today)) return toast(`This Daily Quest unlocks ${friendlyDate(DAILY_CYCLE.scheduledDate(quest))}.`);
  quest.dailyHistory ||= [];
  quest.dailyAwards ||= {};
  if (quest.status === 'completed' || quest.dailyHistory.includes(today)) return toast('Daily completion is locked. Use Undo Today if you completed it by mistake.');
  const oldLevel = overallLevel(state.totalXp);
  // Daily subquests already award part of the configured total. The final clear
  // awards only the remainder so a 20 XP Daily can never mint 20 + subquest XP.
  const amount = finalQuestReward(quest);
  quest.dailySeriesId ||= quest.id;
  quest.dailyScheduledFor ||= DAILY_CYCLE.scheduledDate(quest) || today;
  quest.dueDate ||= today;
  quest.dailyHistory.push(today); quest.dailyAwards[today] = amount; quest.lastCompletedAt = new Date().toISOString();
  quest.status = 'completed'; quest.completedAt = quest.lastCompletedAt; quest.completionXpAwarded = amount;
  const tomorrow = DAILY_CYCLE.addDays(today,1);
  if (!DAILY_CYCLE.hasOccurrence(state.quests,quest,tomorrow)) {
    const next = DAILY_CYCLE.createNextOccurrence(quest,today,{id:crypto.randomUUID(),createdAt:new Date().toISOString()});
    state.quests.unshift(next);
    addActivity('daily-scheduled', `Daily scheduled for tomorrow: ${quest.title}`, 0, quest.category, { questId:next.id, seriesId:quest.dailySeriesId, scheduledFor:tomorrow });
  }
  awardXp(amount, quest);
  state.metrics.totalClears += 1; state.metrics.dailyClears += 1;
  markActiveDay();
  addActivity('daily-completed', quest.title, amount, quest.category, { questType: quest.questType, estimatedMinutes: quest.estimatedMinutes, difficulty: quest.difficulty });
  saveState();
  const newLevel = overallLevel(state.totalXp);
  queueSystemFlash('DAILY CLEARED', quest.title, `+${amount.toLocaleString()} XP • streak ${state.streak}`, '◈', 'DAILY PROTOCOL');
  if (newLevel > oldLevel) queueSystemFlash('LEVEL UP', `Level ${newLevel}`, `${rankDisplay(state.rankStage)} • ${state.totalXp.toLocaleString()} total XP`, '✦', 'PLAYER ADVANCEMENT');
  unlockAchievements(true); renderAll();
}

function undoDailyToday(id) {
  const quest = state.quests.find(q => q.id === id);
  const today = localDateKey(new Date());
  if (!DAILY_CYCLE.canUndoToday(quest,today)) return toast('Only today’s Daily completion can be undone.');
  const finalAmount = Number(quest.dailyAwards?.[today] ?? quest.completionXpAwarded ?? 0);
  const earnedSubquests = (quest.subquests || [])
    .filter(sub => Number(sub.xpAwarded || 0) > 0)
    .map(sub => ({ sub, amount: Number(sub.xpAwarded || 0) }));
  const subquestAmount = earnedSubquests.reduce((sum, entry) => sum + entry.amount, 0);
  const amount = Math.max(0, finalAmount + subquestAmount);
  const tomorrow = DAILY_CYCLE.addDays(today,1);
  const generatedNext = state.quests.find(q => q.dailyPreviousId === quest.id && DAILY_CYCLE.scheduledDate(q) === tomorrow);
  if (generatedNext && questHasEarnedProgress(generatedNext)) return toast('Tomorrow’s occurrence already has progress and cannot be removed.');
  if (generatedNext) state.quests = state.quests.filter(q => q.id !== generatedNext.id);
  quest.dailyHistory = quest.dailyHistory.filter(d => d !== today);
  delete quest.dailyAwards[today];
  for (const { sub } of earnedSubquests) { sub.status = 'active'; sub.completedAt = null; sub.xpAwarded = 0; }
  quest.status = 'active'; quest.completedAt = null; quest.completionXpAwarded = 0; quest.lastCompletedAt = null;
  // Reverse each ledger component separately so Attribute/Skill rounding mirrors
  // the original awards exactly, including occurrences completed in v0.5.3.4.10.
  removeXp(finalAmount, quest);
  for (const entry of earnedSubquests) removeXp(entry.amount, quest);
  state.metrics.totalClears = Math.max(0, state.metrics.totalClears - 1);
  state.metrics.dailyClears = Math.max(0, state.metrics.dailyClears - 1);
  state.metrics.subquestsCleared = Math.max(0, state.metrics.subquestsCleared - earnedSubquests.length);
  addActivity('daily-reopened', `Daily undone: ${quest.title}`, -amount, quest.category, { removedNextOccurrence:Boolean(generatedNext) });
  saveState(); renderAll(); toast('Today’s daily completion was undone.');
}

function reopenQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.status !== 'completed') return;
  const amount = Number(quest.completionXpAwarded || finalQuestReward(quest));
  quest.status = 'active'; quest.completedAt = null; quest.completionXpAwarded = 0;
  removeXp(amount, quest);
  state.metrics.totalClears = Math.max(0, state.metrics.totalClears - 1);
  if (quest.questType === 'Main Quest') state.metrics.mainClears = Math.max(0, state.metrics.mainClears - 1);
  if (quest.questType === 'Boss Quest') state.metrics.bossClears = Math.max(0, state.metrics.bossClears - 1);
  if (quest.questType === 'Campaign Quest') state.metrics.campaignClears = Math.max(0, (state.metrics.campaignClears || 0) - 1);
  addActivity('quest-reopened', `Reopened: ${quest.title}`, -amount, quest.category);
  saveState(); renderAll(); toast('Quest returned to the active board.');
}

function normalizeSkillImpact(input){
  if(!input||typeof input!=='object'||Array.isArray(input))return null;
  const entries=Object.entries(input).filter(([key,value])=>key.startsWith(SKILL_SYSTEM.CORE_PREFIX)&&Number(value)>0);
  const total=entries.reduce((sum,[,value])=>sum+Number(value),0);
  return total>0?Object.fromEntries(entries.map(([key,value])=>[key,Number(value)/total])):null;
}
function skillImpactForQuest(quest){return normalizeSkillImpact(quest?.skillImpact)||SKILL_SYSTEM.impactForQuest(quest);}
function awardXp(amount,quest){amount=Math.max(0,Math.round(amount));state.totalXp+=amount;const impact=quest.statImpact||buildStatImpact(quest.category,quest.secondaryCategory);for(const[stat,w]of Object.entries(impact)){const area=canonicalArea(stat);state.stats[area]=(state.stats[area]||0)+Math.round(amount*Number(w));}state.skills||={};for(const[key,w]of Object.entries(skillImpactForQuest(quest)))state.skills[key]=(state.skills[key]||0)+Math.round(amount*Number(w));const d=Math.max(1,Math.round(amount*.14));state.stats.Discipline=(state.stats.Discipline||0)+d;}
function removeXp(amount,quest){amount=Math.max(0,Math.round(amount));state.totalXp=Math.max(0,state.totalXp-amount);const impact=quest.statImpact||buildStatImpact(quest.category,quest.secondaryCategory);for(const[stat,w]of Object.entries(impact)){const area=canonicalArea(stat);state.stats[area]=Math.max(0,(state.stats[area]||0)-Math.round(amount*Number(w)));}state.skills||={};for(const[key,w]of Object.entries(skillImpactForQuest(quest)))state.skills[key]=Math.max(0,(state.skills[key]||0)-Math.round(amount*Number(w)));const d=Math.max(1,Math.round(amount*.14));state.stats.Discipline=Math.max(0,(state.stats.Discipline||0)-d);}

function editQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;
  if (quest.questType === 'Daily Quest' && DAILY_CYCLE.isLocked(quest,localDateKey(new Date()))) return toast('Tomorrow’s Daily Quest stays locked until its scheduled day.');
  if (quest.status === 'completed') return toast('Reopen a completed quest before editing it.');
  if (subquestEarned(quest) > 0 || (quest.dailyHistory || []).length) return toast('Undo earned progress before changing this quest configuration.');
  openQuestDialog({ ...quest, suggestedSubquests: quest.subquests || [] }, id);
}

function deleteQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest) return;
  if (quest.questType === 'Daily Quest' && quest.dailyGenerated) return toast('Generated Daily occurrences are managed by the Daily cycle. Undo today’s completion to remove tomorrow’s occurrence.');
  if (quest.status === 'completed' || subquestEarned(quest) > 0 || (quest.dailyHistory || []).length) return toast('Undo earned progress before deleting this quest.');
  if (!confirm(`Delete “${quest.title}”?`)) return;
  state.quests = state.quests.filter(q => q.id !== id);
  addActivity('quest-deleted', `Quest deleted: ${quest.title}`, 0, quest.category);
  saveState(); renderAll(); toast('Quest deleted.');
}

function renderAll() {
  const dailyCatchUp = reconcileDailyQuestDates(state);
  if (dailyCatchUp.moved) saveState();
  renderNavigation();
  const renderers = [renderPlayer, renderStats, renderFocusQuests, renderActivity, renderQuestBoard, renderPlanner, renderHabits, renderFocusCircles, renderFriends, renderGuide, renderAchievements, renderProgress, renderSettings, renderDirective, renderSystemReview, renderSeason];
  for (const render of renderers) {
    try { render(); } catch (error) { console.error(`ASCEND render failure in ${render.name}:`, error); }
  }
  renderNavigation();
}

function reconcileDailyQuestDates(sourceState=state,today=localDateKey(new Date())) {
  if(!sourceState||!Array.isArray(sourceState.quests)||!DAILY_CYCLE.isDateKey(today))return {moved:0,missed:0};
  let moved=0,missed=0;
  sourceState.quests=sourceState.quests.map(quest=>{
    const rolled=DAILY_CYCLE.rollForwardMissedOccurrence(quest,today,{rolledAt:new Date().toISOString()});
    if(!rolled)return quest;
    moved+=1;
    missed+=Math.max(0,Number(rolled.dailyMissedCount||0)-Number(quest.dailyMissedCount||0));
    return rolled;
  });
  if(moved){
    sourceState.activity=Array.isArray(sourceState.activity)?sourceState.activity:[];
    sourceState.activity.unshift({id:crypto.randomUUID(),type:'daily-date-catchup',label:`${moved} overdue Daily ${moved===1?'Quest was':'Quests were'} moved to today`,xp:0,category:'Discipline & Habits',at:new Date().toISOString(),meta:{moved,missed,today}});
    sourceState.activity=sourceState.activity.slice(0,6000);
  }
  return {moved,missed};
}

function refreshDateSensitiveState(){
  const result=reconcileDailyQuestDates(state);
  refreshStreak();
  if(result.moved)saveState();
  renderAll();
  scheduleDailyBoundaryRefresh();
}

function scheduleDailyBoundaryRefresh(){
  clearTimeout(dailyBoundaryTimer);
  const now=new Date(),next=new Date(now.getFullYear(),now.getMonth(),now.getDate()+1,0,0,1,0);
  dailyBoundaryTimer=setTimeout(refreshDateSensitiveState,Math.max(1000,next.getTime()-now.getTime()));
}

function renderNavigation() {
  const activeCount = activeForToday().length;
  el('questCountBadge').textContent = activeCount;
  const info = xpLevelInfo(state.totalXp);
  const initial = state.profile.name.trim().charAt(0).toUpperCase() || 'P';
  const meta = `LV.${info.level} • ${rankDisplay(state.rankStage)}`;
  ['sidebarPlayerInitial','sheetPlayerInitial'].forEach(id => el(id).textContent = initial);
  ['sidebarPlayerName','sheetPlayerName'].forEach(id => el(id).textContent = state.profile.name);
  ['sidebarPlayerMeta','sheetPlayerMeta'].forEach(id => el(id).textContent = meta);
  renderCloudStatus();
}

function renderPlayer() {
  const info = xpLevelInfo(state.totalXp);
  const rank = state.rankStage;
  el('playerName').textContent = state.profile.name;
  el('playerTitle').textContent = state.profile.identity;
  el('equippedTitleChip').textContent = state.profile.equippedTitle || 'Awakening';
  el('avatarInitial').textContent = state.profile.name.trim().charAt(0).toUpperCase() || 'P';
  el('overallLevel').textContent = info.level;
  el('overallRankText').textContent = rankDisplay(rank);
  el('rankStageText').textContent = rankConfig(rank).subtitle.toUpperCase();
  el('rankChip').textContent = rank.startsWith('S') ? 'S' : rank;
  el('rankChip').style.background = rankColor(rank);
  el('levelXp').textContent = info.progress.toLocaleString();
  el('levelXpNeeded').textContent = info.needed.toLocaleString();
  el('totalXp').textContent = state.totalXp.toLocaleString();
  el('xpBar').style.width = `${Math.min(100, (info.progress / info.needed) * 100)}%`;
  el('avatarWrap').dataset.rank = rank;
  el('playerCard').dataset.rank = rank;
}

function renderStats(){
  state.skills||={};
  const skills=activeSkillDefinitions();
  el('statsGrid').innerHTML=skills.length?skills.map(skill=>{const xp=Number(state.skills[coreSkillKey(skill.id)]||0),info=statLevelInfo(xp),pct=Math.min(100,(info.progress/info.needed)*100);return `<article class="stat-card core-skill-card" style="--stat-color:${skill.color}"><div class="stat-card__top"><div class="stat-icon">${skill.icon}</div><span class="eyebrow">${Math.round(pct)}%</span></div><small class="skill-domain">TRANSFERABLE SKILL</small><h3>${escapeHtml(skill.name)}</h3><p>${escapeHtml(skill.description)}</p><div class="skill-level-line"><strong>LV. ${info.level}</strong><small>${xp.toLocaleString()} XP</small></div><div class="mini-track"><i style="width:${pct}%"></i></div></article>`;}).join(''):`<div class="empty-state">Choose focus areas to activate relevant core skills.</div>`;
}

function activeForToday() {
  const today=localDateKey(new Date());
  return state.quests.filter(q => !q.projectId && q.status === 'active' && !DAILY_CYCLE.isLocked(q,today) && !(q.questType === 'Daily Quest' && isDailyDoneToday(q)));
}
function isDailyDoneToday(q) { return (q.dailyHistory || []).includes(localDateKey(new Date())); }

function renderFocusQuests() {
  const active = prioritizedActiveQuests().slice(0, 4);
  el('focusQuestList').innerHTML = active.length ? active.map(q => {
    const boss = q.questType === 'Boss Quest';
    const campaign = q.questType === 'Campaign Quest';
    const progress = subquestProgress(q);
    return `<div class="focus-item ${boss ? 'boss-focus' : campaign ? 'campaign-focus' : ''}">
      <div class="focus-item__top"><h4>${escapeHtml(q.title)}</h4><span class="diff-badge">${q.difficulty}</span></div>
      <p>${escapeHtml(q.category)} • ${escapeHtml(q.questType)} • ${formatEffort(q.estimatedMinutes)} • +${q.xp.toLocaleString()} XP${q.dueDate ? ` • ${friendlyDate(q.dueDate)}` : ''}</p>
      ${(boss || campaign) && q.subquests?.length ? `<div class="boss-mini-track"><i style="width:${progress}%"></i></div>` : ''}
    </div>`;
  }).join('') : `<div class="empty-state">No unfinished objectives for today. The board is clear.</div>`;
}

function renderActivity() {
  const recent = state.activity.slice(0, 8);
  el('activityStrip').innerHTML = recent.length ? recent.slice(0, 4).map(a => `
    <article class="activity-card"><span>${friendlyDateTime(a.at)}</span><strong>${escapeHtml(a.label)}</strong><small>${escapeHtml(a.category || 'System')}</small>${a.xp ? `<b class="${a.xp < 0 ? 'negative' : ''}">${a.xp > 0 ? '+' : ''}${a.xp.toLocaleString()} XP</b>` : ''}</article>`).join('') : `<div class="empty-state">Your progression history will appear here.</div>`;
}

function renderQuestBoard() {
  const scope = el('questScopeFilter')?.value || 'standalone';
  const category = el('categoryFilter').value || 'All';
  const type = el('typeFilter').value || 'All';
  const status = el('statusFilter').value || 'active';
  const dateMode = el('dateFilter').value || 'All';
  const todayKey = localDateKey(new Date());
  let quests = [...state.quests];
  if(scope==='standalone')quests=quests.filter(q=>!q.projectId);
  else if(scope==='project')quests=quests.filter(q=>Boolean(q.projectId));
  if (category !== 'All') quests = quests.filter(q => q.category === category || q.secondaryCategory === category);
  if (type !== 'All') quests = quests.filter(q => q.questType === type);
  if (status === 'active') quests = quests.filter(q => q.status === 'active' || (q.questType === 'Daily Quest' && DAILY_CYCLE.canUndoToday(q,todayKey)));
  else if (status === 'completed') quests = quests.filter(q => q.status === 'completed' || (q.questType === 'Daily Quest' && isDailyDoneToday(q)));
  if (dateMode === 'Today') quests = quests.filter(q => q.dueDate === todayKey);
  else if (dateMode === 'Overdue') quests = quests.filter(q => q.dueDate && parseLocalDate(q.dueDate) < parseLocalDate(todayKey) && q.status !== 'completed');
  else if (dateMode === 'Next7') quests = quests.filter(q => q.dueDate && dayDiff(todayKey, q.dueDate) >= 0 && dayDiff(todayKey, q.dueDate) <= 7);
  else if (dateMode === 'NoDate') quests = quests.filter(q => !q.dueDate);
  quests.sort((a,b) => {
    const ad = a.dueDate ? parseLocalDate(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.dueDate ? parseLocalDate(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    if (ad !== bd) return ad - bd;
    return questScore(b) - questScore(a);
  });

  const grouped = QUEST_LANES.map(lane => ({...lane, quests:quests.filter(q => q.questType === lane.type)})).filter(lane => lane.quests.length);
  el('questBoardSummary').textContent = `${quests.length} quest${quests.length === 1 ? '' : 's'} shown • ${grouped.length} lane${grouped.length === 1 ? '' : 's'}`;
  el('questBoard').innerHTML = grouped.length ? grouped.map(lane => `
    <section class="quest-type-section" data-type="${escapeHtml(lane.type)}">
      <header class="quest-type-header"><span class="quest-type-icon">${lane.icon}</span><div class="quest-type-copy"><strong>${escapeHtml(lane.title)}</strong><small>${escapeHtml(lane.description)}</small></div><span class="quest-type-count">${lane.quests.length}</span></header>
      <div class="quest-type-cards">${lane.quests.map(renderQuestCard).join('')}</div>
    </section>`).join('') : `<div class="empty-state">No quests match this filter.</div>`;
  el('questBoard').querySelectorAll('[data-complete]').forEach(btn => btn.addEventListener('click', () => completeQuest(btn.dataset.complete)));
  el('questBoard').querySelectorAll('[data-subquest]').forEach(btn => btn.addEventListener('click', () => toggleSubquest(btn.dataset.quest, btn.dataset.subquest)));
  el('questBoard').querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => editQuest(btn.dataset.edit)));
  el('questBoard').querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => deleteQuest(btn.dataset.delete)));
  el('questBoard').querySelectorAll('[data-undo-daily]').forEach(btn => btn.addEventListener('click', () => undoDailyToday(btn.dataset.undoDaily)));
}

function renderQuestCard(q) {
  const completed = q.status === 'completed';
  const dailyDone = q.questType === 'Daily Quest' && isDailyDoneToday(q);
  const dailyLocked = DAILY_CYCLE.isLocked(q,localDateKey(new Date()));
  const isBoss = q.questType === 'Boss Quest';
  const isCampaign = q.questType === 'Campaign Quest';
  const subs = q.subquests || [];
  const progress = subquestProgress(q);
  const allSubs = !subs.length || subs.every(s => s.status === 'completed');
  const project= q.projectId ? state.projects.find(item=>item.id===q.projectId) : null;
  const secondary = `${q.secondaryCategory ? `<span>${escapeHtml(q.secondaryCategory)}</span>` : ''}${project?`<span class="project-context-badge">PROJECT • ${escapeHtml(project.title)}</span>`:''}`;
  const anti = q.antiFarm?.flag ? `<span class="anti-tag">LOW XP</span>` : '';
  const missedDaily = q.questType==='Daily Quest'&&q.status==='active'&&Number(q.dailyMissedCount||0)>0 ? `<span class="daily-missed-label">${Number(q.dailyMissedCount).toLocaleString()} MISSED • READY TODAY</span>` : '';
  const subHtml = subs.length ? `<div class="subquest-zone">
    <div class="subquest-head"><span>${isBoss ? 'BOSS HP' : 'SUBQUESTS'} • ${subs.filter(s => s.status === 'completed').length}/${subs.length}</span><strong>${progress}%</strong></div>
    <div class="subquest-track"><i style="width:${progress}%"></i></div>
    <div class="subquest-list">${subs.map(s => `<button type="button" class="subquest-item ${s.status === 'completed' ? 'done' : ''}" data-quest="${q.id}" data-subquest="${s.id}"><i>${s.status === 'completed' ? '✓' : '◇'}</i><span>${escapeHtml(s.title)}</span>${s.xpAwarded ? `<small>+${s.xpAwarded} XP</small>` : ''}</button>`).join('')}</div>
  </div>` : '';
  const buttonLabel = dailyLocked ? '⌛' : completed ? '✓' : dailyDone ? '✓' : isBoss && allSubs ? '⬢' : '◇';
  const rewardRemaining = completed || dailyDone || dailyLocked ? 0 : finalQuestReward(q);
  const checkAttributes=dailyLocked?'disabled aria-disabled="true"':completed&&q.questType==='Daily Quest'?'disabled aria-disabled="true"':`data-complete="${q.id}"`;
  const checkTitle=dailyLocked?`Unlocks ${friendlyDate(DAILY_CYCLE.scheduledDate(q))}`:completed&&q.questType==='Daily Quest'?'Daily completion locked':completed?'Reopen quest':isBoss?'Defeat boss when ready':'Complete quest';
  return `<article id="quest-${q.id}" class="quest-card ${completed ? 'completed' : ''} ${dailyDone ? 'daily-done' : ''} ${dailyLocked ? 'daily-locked' : ''} type-${slug(q.questType)} ${isBoss ? 'boss-card' : ''} ${isCampaign ? 'campaign-card' : ''}">
    <button class="quest-check" ${checkAttributes} title="${escapeHtml(checkTitle)}">${buttonLabel}</button>
    <div class="quest-main">
      <div class="quest-title-row"><h3>${escapeHtml(q.title)}</h3>${isBoss ? '<span class="boss-label">BOSS</span>' : ''}${isCampaign ? '<span class="campaign-label">CAMPAIGN</span>' : ''}${dailyDone ? '<span class="done-label">DONE TODAY</span>' : ''}${dailyLocked ? `<span class="locked-label">UNLOCKS ${escapeHtml(friendlyDate(DAILY_CYCLE.scheduledDate(q)))}</span>` : ''}${missedDaily}${anti}</div>
      <div class="quest-meta"><span>${escapeHtml(q.category)}</span>${secondary}<span>${escapeHtml(q.questType)}</span><span>${escapeHtml(q.priority)}</span><span>Rank ${q.difficulty}</span><span>${formatEffort(q.estimatedMinutes)}</span>${q.estimatedSessions ? `<span>${q.estimatedSessions} session${q.estimatedSessions === 1 ? '' : 's'}</span>` : ''}${q.mentalLoad ? `<span>${escapeHtml(q.mentalLoad)} load</span>` : ''}${q.dueDate ? `<span class="${isOverdue(q) ? 'overdue' : ''}">${friendlyDate(q.dueDate)}</span>` : ''}</div>
      ${q.reminderAt?`<div class="quest-reminder-badge">🔔 ${escapeHtml(new Date(q.reminderAt).toLocaleString())}</div>`:''}
      ${subHtml}
    </div>
    <div class="quest-reward"><strong>+${rewardRemaining.toLocaleString()}</strong><span>${dailyLocked ? 'LOCKED' : completed || dailyDone ? 'CLEARED' : 'XP LEFT'}</span><div class="quest-actions">${DAILY_CYCLE.canUndoToday(q,localDateKey(new Date())) ? `<button class="undo-daily" data-undo-daily="${q.id}">Undo Today</button>` : !completed && !dailyLocked ? `<button data-edit="${q.id}">Edit Quest</button><button data-delete="${q.id}">Delete</button>` : ''}</div></div>
  </article>`;
}

function subquestProgress(q) {
  const subs = q.subquests || [];
  if (!subs.length) return q.status === 'completed' ? 100 : 0;
  return Math.round((subs.filter(s => s.status === 'completed').length / subs.length) * 100);
}

function renderDirective() {
  state.ai ||= { directive:null, review:null, lastMode:'local+' };
  const active = prioritizedActiveQuests();
  const cached = state.ai.directive;
  if (cached && cached.signature === intelligenceSignature() && cached.result) {
    renderDirectiveResult(cached.result, cached.mode || 'local+');
  } else {
    const directive = active[0];
    if (!directive) {
      el('directiveText').textContent = 'The board is clear. Add one meaningful objective instead of manufacturing busywork.';
      el('directiveMini').innerHTML = '';
      el('directiveAction').textContent = 'Create Quest';
      el('directiveAction').onclick = () => openQuestDialog();
      el('directiveLoad').textContent = 'LIGHT';
    } else {
      const urgency = isOverdue(directive) ? 'Overdue objective' : directive.priority === 'Critical' ? 'Critical objective' : directive.questType === 'Boss Quest' ? 'Boss objective' : directive.questType === 'Campaign Quest' ? 'Campaign objective' : 'Highest-value objective';
      el('directiveText').textContent = `${urgency}: ${directive.title}`;
      el('directiveMini').innerHTML = active.slice(1,3).map((q,i) => `<span><b>${i === 0 ? 'SECONDARY' : 'OPTIONAL'}</b>${escapeHtml(q.title)}</span>`).join('');
      el('directiveAction').textContent = 'Open Quest Board';
      el('directiveAction').onclick = () => switchView('quests');
      el('directiveLoad').textContent = 'LOCAL';
    }
  }
  el('streakText').textContent = `${state.streak} day streak • ${state.activeDates.length} active days`;
}

function renderDirectiveResult(result, mode = 'local+') {
  const lookup = new Map(activeForToday().map(q => [q.id, q]));
  const primary = lookup.get(result.primaryQuestId);
  if (!primary) {
    el('directiveText').textContent = result.headline || 'No primary objective selected.';
    el('directiveMini').innerHTML = '';
    el('directiveAction').textContent = 'Create Quest';
    el('directiveAction').onclick = () => openQuestDialog();
  } else {
    el('directiveText').textContent = result.headline || `Primary objective: ${primary.title}`;
    const secondary = (result.secondaryQuestIds || []).map(id => lookup.get(id)).filter(Boolean);
    const optional = lookup.get(result.optionalQuestId);
    const rows = [
      ...secondary.map((q,i)=>`<span><b>${i===0?'SECONDARY':'SECONDARY II'}</b>${escapeHtml(q.title)}</span>`),
      ...(optional ? [`<span><b>OPTIONAL</b>${escapeHtml(optional.title)}</span>`] : [])
    ];
    el('directiveMini').innerHTML = rows.join('');
    el('directiveAction').textContent = 'Open Quest Board';
    el('directiveAction').onclick = () => switchView('quests');
  }
  el('directiveLoad').textContent = `${mode === 'ai' ? 'AI' : 'LOCAL'} • ${String(result.loadAssessment || 'Balanced').toUpperCase()}`;
  el('directiveReason').textContent = result.warning || result.reasoning || '';
}

async function generateDirective() {
  const button = el('directiveRefreshButton');
  const quests = activeForToday().map(questForAi);
  if (!quests.length) { state.ai.directive = null; renderDirective(); return toast('No active quests to prioritize.'); }
  button.disabled = true; button.textContent = 'Thinking…';
  try {
    const response = await fetch('/api/directive', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ context:buildAiContext(), quests })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Directive analysis failed.');
    state.ai ||= {}; state.ai.directive = { signature:intelligenceSignature(), result:data.result, mode:data.mode, at:new Date().toISOString() };
    state.ai.lastMode = data.mode;
    saveState(); renderDirective();
    toast(data.mode === 'ai' ? 'Semantic directive generated.' : 'Local directive generated.');
  } catch (error) { toast(error.message || 'Could not generate directive.'); }
  finally { button.disabled = false; button.textContent = 'Recalculate'; }
}

async function runSystemReview() {
  const button = el('runSystemReviewButton');
  button.disabled = true; button.textContent = 'Analyzing…';
  try {
    const response = await fetch('/api/review', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({ context:buildAiContext(), quests:activeForToday().map(questForAi), activity:state.activity.slice(0,60) })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'System review failed.');
    state.ai ||= {}; state.ai.review = { signature:intelligenceSignature(), result:data.result, mode:data.mode, at:new Date().toISOString() };
    state.ai.lastMode = data.mode;
    saveState(); renderSystemReview();
    toast(data.mode === 'ai' ? 'Semantic system review complete.' : 'Local system review complete.');
  } catch (error) { toast(error.message || 'Could not run system review.'); }
  finally { button.disabled = false; button.textContent = 'Run System Review'; }
}

function renderSystemReview() {
  const cache = state.ai?.review;
  const body = el('systemReviewBody');
  if (!body) return;
  if (!cache?.result || cache.signature !== intelligenceSignature()) {
    body.innerHTML = `<div class="advisor-empty"><strong>No current review.</strong><span>Run a review after adding real quests. The system will inspect workload, balance, and your next move.</span></div>`;
    el('systemReviewMode').textContent = 'READY';
    el('systemReviewMode').classList.remove('ai');
    return;
  }
  const r = cache.result;
  el('systemReviewMode').textContent = cache.mode === 'ai' ? 'GEMINI' : 'LOCAL+';
  el('systemReviewMode').classList.toggle('ai', cache.mode === 'ai');
  body.innerHTML = `<div class="advisor-headline"><span>${escapeHtml(r.state || 'Stable')}</span><strong>${escapeHtml(r.headline || '')}</strong></div>
    <div class="advisor-metrics"><div><small>STRONGEST</small><b>${escapeHtml(r.strongestArea || '—')}</b></div><div><small>NEGLECTED</small><b>${escapeHtml(r.neglectedArea || '—')}</b></div></div>
    <p>${escapeHtml(r.observation || '')}</p>
    ${r.warning ? `<div class="advisor-warning">${escapeHtml(r.warning)}</div>` : ''}
    <div class="advisor-recs">${(r.recommendations || []).map(x=>`<span>◇ ${escapeHtml(x)}</span>`).join('')}</div>
    <div class="advisor-next"><small>NEXT SYSTEM MOVE</small><strong>${escapeHtml(r.nextSystemMove || '')}</strong></div>`;
}

function renderProgress() {
  const level = overallLevel(state.totalXp);
  el('progressTotalXp').textContent = state.totalXp.toLocaleString();
  el('progressCompleted').textContent = state.metrics.totalClears.toLocaleString();
  el('progressActiveDays').textContent = state.activeDates.length.toLocaleString();
  el('progressStreak').textContent = `${state.streak} current • ${state.metrics.bestStreak} best`;
  el('progressRank').textContent = state.rankStage;
  el('progressRankLabel').textContent = `Level ${level} • ${rankConfig(state.rankStage).subtitle}`;
  renderRankTrial(); renderWeeklyChart(); renderRankLadder();
  state.skills||={};el('skillProgressList').innerHTML=activeSkillDefinitions().map(skill=>{const xp=Number(state.skills[coreSkillKey(skill.id)]||0),info=statLevelInfo(xp);return `<div class="skill-progress-row"><span>${escapeHtml(skill.name)}</span><div class="line"><i style="width:${Math.min(100,(info.progress/info.needed)*100)}%"></i></div><strong>Lv ${info.level}</strong></div>`;}).join('');
  el('progressLog').innerHTML = state.activity.length ? state.activity.slice(0, 14).map(a => `<div class="progress-log-item"><strong>${escapeHtml(a.label)}${a.xp ? ` • ${a.xp > 0 ? '+' : ''}${a.xp.toLocaleString()} XP` : ''}</strong><p>${friendlyDateTime(a.at)} • ${escapeHtml(a.category || 'System')}</p></div>`).join('') : `<div class="empty-state">No gains recorded yet.</div>`;
}

function renderRankTrial() {
  const currentIdx = rankIndex(state.rankStage);
  const next = RANKS[currentIdx + 1];
  if (!next) {
    el('rankTrialHeading').textContent = 'S-V // MYTHIC STATUS';
    el('rankEligibility').textContent = 'MAXIMUM'; el('rankEligibility').classList.add('ai');
    el('rankTrialBody').innerHTML = `<div class="max-rank-message"><strong>You reached the visible summit.</strong><span>The system can still track levels, attributes, milestones, and lifetime XP beyond S-V.</span></div>`;
    return;
  }
  const reqs = rankRequirementStatus(next);
  const eligible = reqs.every(r => r.met);
  el('rankTrialHeading').textContent = `${state.rankStage} → ${next.stage} Rank Trial`;
  el('rankEligibility').textContent = eligible ? 'READY' : 'LOCKED';
  el('rankEligibility').classList.toggle('ai', eligible);
  el('rankTrialBody').innerHTML = `<div class="rank-trial-copy"><strong>${next.label} // ${next.subtitle}</strong><span>${next.stage.startsWith('S') ? 'S-tier advancement is designed to represent sustained, multi-year progress.' : 'XP alone is not enough. Every requirement must be earned.'}</span></div>
    <div class="trial-requirements">${reqs.map(r => `<div class="trial-item ${r.met ? 'met' : ''}"><i>${r.met ? '✓' : '◇'}</i><span>${escapeHtml(r.label)}</span><strong>${formatRequirement(r.current)} / ${formatRequirement(r.target)}</strong></div>`).join('')}</div>
    <button id="claimRankButton" class="primary-btn rank-claim" ${eligible ? '' : 'disabled'}>${eligible ? `Claim ${next.stage} Advancement` : 'Advancement Locked'}</button>`;
  const btn = document.getElementById('claimRankButton');
  if (btn && eligible) btn.addEventListener('click', () => claimRank(next.stage));
}

function rankRequirementStatus(config) {
  const r = config.requirements || {};
  const selectedAreas=selectedFocusAreas(),statsAtLevel=selectedAreas.filter(k=>statLevel(state.stats[k]||0)>=(r.statLevel||0)).length;
  // Rank badges are consequences of advancement, so they must never be counted
  // as prerequisites for that same advancement (especially the final S tier).
  const eligibleIds=new Set(eligibleMilestones().filter(item=>item.group!=='Rank').map(item=>item.id));
  const unlockedEligible=new Set((state.unlockedAchievements||[]).filter(id=>eligibleIds.has(id))).size;
  const milestoneTarget=Math.min(r.milestones||0,eligibleIds.size);
  return [
    { label:'Total XP', current:state.totalXp, target:r.xp || 0 },
    { label:'Quest clears', current:state.metrics.totalClears, target:r.clears || 0 },
    { label:'Active days', current:state.activeDates.length, target:config.stage.startsWith('S-') ? effectiveRankMinDays(config) : (r.activeDays || 0) },
    { label:'Main Quests', current:state.metrics.mainClears, target:r.main || 0 },
    { label:'Campaigns', current:state.metrics.campaignClears || 0, target:r.campaigns || 0 },
    { label:'Boss Quests', current:state.metrics.bossClears, target:r.bosses || 0 },
    { label:'Milestones', current:unlockedEligible, target:milestoneTarget },
    { label:`Attributes at Lv.${r.statLevel || 0}`, current:statsAtLevel, target:Math.min(r.statCount||0,selectedAreas.length) }
  ].filter(x => x.target > 0).map(x => ({ ...x, met: x.current >= x.target }));
}

function claimRank(stage) {
  const targetIdx = rankIndex(stage);
  if (targetIdx !== rankIndex(state.rankStage) + 1) return;
  const config = RANKS[targetIdx];
  if (!rankRequirementStatus(config).every(r => r.met)) return toast('Rank requirements are not complete.');
  state.rankStage = stage;
  if (!state.rankTrialsClaimed.includes(stage)) state.rankTrialsClaimed.push(stage);
  addActivity('rank-up', `Rank advanced: ${config.label}`, 0, 'System');
  saveState();
  queueSystemFlash('RANK ADVANCEMENT', config.label, config.stage.startsWith('S') ? `${config.subtitle} • S-tier progression unlocked` : config.subtitle, config.stage.startsWith('S') ? 'S' : config.stage, 'ADVANCEMENT PROTOCOL');
  unlockAchievements(true); renderAll();
}

function renderRankLadder() {
  const current = rankIndex(state.rankStage);
  el('rankLadder').innerHTML = RANKS.map((r,i) => {
    const claimed = i <= current; const next = i === current + 1;
    return `<article class="rank-ladder-card ${claimed ? 'claimed' : ''} ${next ? 'next' : ''} ${r.stage.startsWith('S') ? 's-tier' : ''}"><span>${r.stage}</span><strong>${r.subtitle}</strong><small>${r.minDays ? `${effectiveRankMinDays(r)}+ active days minimum${r.stage.startsWith('S-') && totalImpactCreditPercent()>0 ? ' • impact adjusted' : ''}` : 'Starting rank'}</small><i>${claimed ? 'CLAIMED' : next ? 'NEXT TRIAL' : 'LOCKED'}</i></article>`;
  }).join('');
}

function renderWeeklyChart() {
  const days = []; const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i); const key = localDateKey(d);
    const xp = Math.max(0, state.activity.filter(a => localDateKey(new Date(a.at)) === key).reduce((sum,a) => sum + Number(a.xp || 0), 0));
    days.push({ d, xp });
  }
  const max = Math.max(100, ...days.map(d => d.xp));
  el('weeklyChart').innerHTML = days.map(({d,xp}) => `<div class="chart-day"><strong>${xp.toLocaleString()}</strong><div class="chart-bar-wrap"><div class="chart-bar" style="height:${Math.max(2,(xp/max)*100)}%"></div></div><small>${d.toLocaleDateString(undefined,{weekday:'short'}).slice(0,3)}</small></div>`).join('');
}

function areaCompletionCount(sourceState,area){return(sourceState.quests||[]).filter(q=>canonicalArea(q.category)===area).reduce((total,q)=>total+(q.questType==='Daily Quest'?(q.dailyHistory||[]).length:(q.status==='completed'?1:0)),0);}
function areaSubstantialCount(sourceState,area){return(sourceState.quests||[]).filter(q=>q.status==='completed'&&canonicalArea(q.category)===area&&['Main Quest','Campaign Quest','Boss Quest'].includes(q.questType)).length;}
function adaptiveGuidePath(area){const p=profileForArea(area),skills=skillDefinitionsForArea(area);return{id:`adaptive-${area}`,icon:p.icon,title:`${area} Route`,subtitle:`A measurable path based on completed work in ${area}.`,nodes:[{title:'First Clear',desc:`Complete one ${area} quest.`,req:`1 ${area} completion`,progress:s=>[areaCompletionCount(s,area),1]},{title:'Foundation',desc:`Accumulate enough verified work to reach ${area} Level 3.`,req:`${area} Level 3`,progress:s=>[statLevel(s.stats[area]||0),3]},{title:'Practice Volume',desc:'Build a real body of completed work; Daily completions count individually.',req:`10 ${area} completions`,progress:s=>[areaCompletionCount(s,area),10]},{title:'Substantial Outcome',desc:'Complete work larger than a Side or Daily Quest.',req:`1 substantial ${area} clear`,progress:s=>[areaSubstantialCount(s,area),1]},{title:'Capability Growth',desc:'Develop more than one transferable capability through relevant work.',req:'2 relevant skills at Level 5',progress:s=>[skills.filter(skill=>statLevel((s.skills||{})[coreSkillKey(skill.id)]||0)>=5).length,2]},{title:'Established Practice',desc:`Sustain a meaningful history of completed ${area} work.`,req:`50 ${area} completions`,progress:s=>[areaCompletionCount(s,area),50]}]};}
function renderGuide(){const grid=el('guidePathGrid');if(!grid)return;const foundation=GUIDE_PATHS.find(path=>path.id==='foundation'),paths=[foundation,...selectedFocusAreas().map(adaptiveGuidePath)].filter(Boolean);const currentCandidates=[];grid.innerHTML=paths.map(path=>{let previousCleared=true;const nodes=path.nodes.map((node,index)=>{let[value,target]=node.progress(state);value=Math.max(0,Number(value)||0);target=Math.max(1,Number(target)||1);const cleared=value>=target,current=!cleared&&previousCleared,pct=Math.min(100,Math.round((value/target)*100));if(current)currentCandidates.push({path:path.title,node:node.title,value,target,pct});const status=cleared?'cleared':current?'current':'locked',statusLabel=cleared?'CLEARED':current?'ACTIVE':'LOCKED',connector=index<path.nodes.length-1?'<div class="guide-connector"></div>':'';previousCleared=previousCleared&&cleared;return `<div class="guide-node ${status}"><div class="guide-node-core"><span>${cleared?'✓':current?'◇':'·'}</span></div><div class="guide-node-copy"><div class="guide-node-title"><strong>${escapeHtml(node.title)}</strong><em>${statusLabel}</em></div><p>${escapeHtml(node.desc)}</p><div class="guide-node-progress"><i style="width:${pct}%"></i></div><small>${escapeHtml(node.req)} • ${Math.min(value,target).toLocaleString()} / ${target.toLocaleString()}</small></div>${connector}</div>`;}).join('');const clearedCount=path.nodes.filter(n=>{const[v,t]=n.progress(state);return Number(v)>=Number(t)}).length;return `<article class="guide-path panel" data-path="${escapeHtml(path.id)}"><div class="guide-path-head"><div class="guide-path-icon">${path.icon}</div><div><span class="eyebrow">${clearedCount}/${path.nodes.length} NODES</span><h3>${escapeHtml(path.title)}</h3><p>${escapeHtml(path.subtitle)}</p></div></div><div class="guide-node-list">${nodes}</div></article>`;}).join('');currentCandidates.sort((x,y)=>y.pct-x.pct);const next=currentCandidates[0];if(next){el('guideNextUnlock').textContent=next.node;el('guideNextUnlockDetail').textContent=`${next.path} • ${next.value.toLocaleString()} / ${next.target.toLocaleString()} • ${next.pct}%`;}else{el('guideNextUnlock').textContent='Visible map cleared';el('guideNextUnlockDetail').textContent='Every visible pathway is complete.';}}

function adaptiveAreaMilestones(sourceState=state){return selectedFocusAreas(sourceState).flatMap(area=>{const p=profileForArea(area),skills=skillDefinitionsForArea(area),level=s=>statLevel(s.stats[area]||0),clears=s=>areaCompletionCount(s,area),substantial=s=>areaSubstantialCount(s,area),skillCount=(s,t)=>skills.filter(skill=>statLevel((s.skills||{})[coreSkillKey(skill.id)]||0)>=t).length;return[
  milestone(`adaptive:${area}:start`,area,'Common',p.icon,'First Verified Step',`Complete your first ${area} quest.`,s=>clears(s)>=1,{progress:s=>[clears(s),1]}),
  milestone(`adaptive:${area}:foundation`,area,'Common',p.icon,'Foundation Established',`Reach ${area} Level 3 through completed work.`,s=>level(s)>=3,{progress:s=>[level(s),3]}),
  milestone(`adaptive:${area}:practice`,area,'Uncommon',p.icon,'Practice Record',`Record 10 completed ${area} quests. Daily completions count individually.`,s=>clears(s)>=10,{progress:s=>[clears(s),10]}),
  milestone(`adaptive:${area}:deep`,area,'Rare',p.icon,'Substantial Outcome',`Clear one ${area} Main, Campaign, or Boss Quest.`,s=>substantial(s)>=1,{progress:s=>[substantial(s),1]}),
  milestone(`adaptive:${area}:capability`,area,'Rare',p.icon,'Capability Growth','Reach Level 5 in at least 2 transferable skills relevant to this focus area.',s=>skillCount(s,5)>=2,{progress:s=>[skillCount(s,5),2]}),
  milestone(`adaptive:${area}:depth`,area,'Epic',p.icon,'Depth of Work',`Clear 5 substantial ${area} objectives.`,s=>substantial(s)>=5,{progress:s=>[substantial(s),5]}),
  milestone(`adaptive:${area}:mastery`,area,'Epic',p.icon,'Developed Capabilities','Reach Level 10 in at least 2 transferable skills relevant to this focus area.',s=>skillCount(s,10)>=2,{progress:s=>[skillCount(s,10),2]}),
  milestone(`adaptive:${area}:established`,area,'Legendary',p.icon,'Established Practice',`Record 50 completed ${area} quests.`,s=>clears(s)>=50,{progress:s=>[clears(s),50]}),
  milestone(`adaptive:${area}:longterm`,area,'Mythic',p.icon,'Long-Term Development',`Record 200 completed ${area} quests and reach ${area} Level 25.`,s=>clears(s)>=200&&level(s)>=25,{progress:s=>[Math.min(clears(s),Math.floor(level(s)/25*200)),200]})
];});}
function eligibleMilestones(sourceState=state){return[...MILESTONES.filter(a=>['Progression','Rank','Discipline'].includes(a.group)),...adaptiveAreaMilestones(sourceState)];}

function renderAchievements(){const unlocked=new Set(state.unlockedAchievements||[]),group=el('achievementGroupFilter')?.value||'All',status=el('achievementStatusFilter')?.value||'all';let milestones=eligibleMilestones();if(group!=='All')milestones=milestones.filter(x=>x.group===group);if(status==='unlocked')milestones=milestones.filter(x=>unlocked.has(x.id));if(status==='locked')milestones=milestones.filter(x=>!unlocked.has(x.id));milestones.sort((x,y)=>compareMilestonesByProgression(x,y,unlocked));el('achievementCount').textContent=`${milestones.filter(x=>unlocked.has(x.id)).length} / ${milestones.length} visible unlocked`;el('achievementGrid').innerHTML=milestones.map(x=>renderMilestoneCard(x,unlocked.has(x.id))).join('')||`<div class="empty-state">No milestones match this filter.</div>`;}

function milestoneProgressRatio(a) {
  if (typeof a.progress !== 'function') return -1;
  try {
    const [current, target] = a.progress(state);
    const value = Number(current);
    const goal = Number(target);
    if (!Number.isFinite(value) || !Number.isFinite(goal) || goal <= 0) return -1;
    return Math.max(0, Math.min(1, value / goal));
  } catch {
    return -1;
  }
}

function compareMilestonesByProgression(a, b, unlocked) {
  const unlockedDelta = Number(unlocked.has(b.id)) - Number(unlocked.has(a.id));
  if (unlockedDelta) return unlockedDelta;

  // After cleared milestones, walk upward naturally: Common → Uncommon → Rare → Epic → Legendary → Mythic.
  const rarityDelta = (RARITY_SCORE[a.rarity] || 99) - (RARITY_SCORE[b.rarity] || 99);
  if (rarityDelta) return rarityDelta;

  // Inside the same tier, surface milestones the user is already closest to finishing.
  if (!unlocked.has(a.id)) {
    const progressDelta = milestoneProgressRatio(b) - milestoneProgressRatio(a);
    if (Math.abs(progressDelta) > 0.0001) return progressDelta;
  }

  return(MILESTONE_INDEX.get(a.id)??9999)-(MILESTONE_INDEX.get(b.id)??9999);
}

function renderMilestoneCard(a, isUnlocked) {
  const hiddenLocked = a.hidden && !isUnlocked;
  const title = hiddenLocked ? '???' : (isUnlocked && a.revealedTitle ? a.revealedTitle : a.title);
  const desc = hiddenLocked ? 'Hidden milestone. Its condition is not revealed.' : (isUnlocked && a.revealedDesc ? a.revealedDesc : a.desc);
  let progress = '';
  if (!isUnlocked && !hiddenLocked && typeof a.progress === 'function') {
    const [current,target] = a.progress(state); const pct = Math.min(100,(current/target)*100);
    progress = `<div class="milestone-progress"><span>${formatRequirement(current)} / ${formatRequirement(target)}</span><div><i style="width:${pct}%"></i></div></div>`;
  }
  return `<article class="achievement-card rarity-${a.rarity.toLowerCase()} ${isUnlocked ? 'unlocked' : 'locked'} ${hiddenLocked ? 'hidden-achievement' : ''}">
    <div class="achievement-card-top"><div class="achievement-icon">${hiddenLocked ? '?' : a.icon}</div><div class="milestone-labels"><span class="path-label">${escapeHtml(a.group)}</span><span class="rarity-label">${a.rarity}</span></div></div>
    <h3>${escapeHtml(title)}</h3><p>${escapeHtml(desc)}</p>${progress}<small>${isUnlocked ? 'UNLOCKED' : 'LOCKED'}</small>
  </article>`;
}

function unlockAchievements(notify) {
  const unlocked = new Set(state.unlockedAchievements);
  const newly = [];
  for(const a of eligibleMilestones()){
    if (!unlocked.has(a.id) && a.test(state)) {
      unlocked.add(a.id); newly.push(a);
      if (a.unlockTitle && TITLE_DEFS.includes(a.unlockTitle) && !state.titlesUnlocked.includes(a.unlockTitle)) state.titlesUnlocked.push(a.unlockTitle);
      addActivity('achievement', `Milestone unlocked: ${a.revealedTitle || a.title}`, 0, 'System', { rarity:a.rarity });
    }
  }
  if (newly.length) {
    state.unlockedAchievements = [...unlocked]; saveState();
    if (notify) {
      const best = [...newly].sort((a,b) => RARITY_SCORE[b.rarity] - RARITY_SCORE[a.rarity])[0];
      queueSystemFlash('MILESTONE UNLOCKED', best.revealedTitle || best.title, `${best.rarity}${newly.length > 1 ? ` • +${newly.length-1} more milestone${newly.length-1 === 1 ? '' : 's'}` : ''}`, best.icon, best.rarity.toUpperCase());
    }
  }
  return newly;
}

function renderSettings() {
  el('settingsName').value = state.profile.name;
  el('settingsIdentity').value = state.profile.identity;
  el('settingsFocusSummary').textContent=selectedFocusAreas().join(' • ');
  const titles = [...new Set(['Awakening', ...(state.titlesUnlocked || [])])];
  el('settingsEquippedTitle').innerHTML = titles.map(t => `<option value="${escapeHtml(t)}" ${t === state.profile.equippedTitle ? 'selected' : ''}>${escapeHtml(t)}</option>`).join('');
  el('settingsSeasonName').value = state.season.name || '';
  el('settingsSeasonStart').value = state.season.start || '';
  el('settingsSeasonEnd').value = state.season.end || '';
  el('settingsSeasonPurpose').value = state.season.purpose || '';
  el('settingsSystemContext').value = state.systemContext || '';
  renderInstallState();
  renderCloudStatus();
  renderExternalRequestSettings();
}

function randomShareToken(){const bytes=crypto.getRandomValues(new Uint8Array(32));return base64UrlEncode(bytes);}
function externalRequestUrl(token=state.externalInbox?.token){return token?`${location.origin}/request/${token}`:'';}
function maskedExternalRequestUrl(token=state.externalInbox?.token){return token?`${location.origin}/request/${'•'.repeat(10)}${token.slice(-6)}`:'';}

async function encryptExternalPrivateKey(privateKeyJwk){
  if(!cloudUser?.id)throw new Error('A signed-in account is required to protect the request inbox.');
  const vault=await ensureVaultKey(cloudUser.id),iv=crypto.getRandomValues(new Uint8Array(12));
  const aad=new TextEncoder().encode(`ASCEND-EXTERNAL-INBOX:${cloudUser.id}:V1`);
  const plaintext=new TextEncoder().encode(JSON.stringify(privateKeyJwk));
  const ciphertext=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad,tagLength:128},vault.key,plaintext);
  return{version:1,iv:base64UrlEncode(iv),ciphertext:base64UrlEncode(new Uint8Array(ciphertext))};
}

async function decryptExternalPrivateKey(envelope){
  if(!cloudUser?.id||!envelope?.iv||!envelope?.ciphertext)throw new Error('Request decryption key is missing from this encrypted player-state.');
  const vault=await loadVaultKey(cloudUser.id);if(!vault)throw new Error('Unlock this device with your Recovery File before opening requests.');
  try{
    const aad=new TextEncoder().encode(`ASCEND-EXTERNAL-INBOX:${cloudUser.id}:V1`);
    const plaintext=await crypto.subtle.decrypt({name:'AES-GCM',iv:base64UrlDecode(envelope.iv),additionalData:aad,tagLength:128},vault.key,base64UrlDecode(envelope.ciphertext));
    return JSON.parse(new TextDecoder().decode(plaintext));
  }catch{throw new Error('This device cannot unlock the encrypted request inbox. Verify the Recovery File.');}
}

async function ensureExternalInboxIdentity({rotate=false}={}){
  if(!globalThis.isSecureContext||!crypto?.subtle)throw new Error('Secure HTTPS is required to create an encrypted request link.');
  const current=state.externalInbox||{};
  if(!rotate&&current.token&&current.publicKeyJwk&&current.privateKeyEnvelope)return current;
  if(rotate&&current.publicKeyJwk&&current.privateKeyEnvelope){state.externalInbox={...current,token:randomShareToken(),enabled:true};return state.externalInbox;}
  const keyPair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['wrapKey','unwrapKey']);
  const [publicKeyJwk,privateKeyJwk]=await Promise.all([crypto.subtle.exportKey('jwk',keyPair.publicKey),crypto.subtle.exportKey('jwk',keyPair.privateKey)]);
  publicKeyJwk.alg='RSA-OAEP-256';privateKeyJwk.alg='RSA-OAEP-256';
  const privateKeyEnvelope=await encryptExternalPrivateKey(privateKeyJwk);
  state.externalInbox={token:randomShareToken(),publicKeyJwk,privateKeyEnvelope,enabled:true,createdAt:new Date().toISOString()};
  return state.externalInbox;
}

async function externalInboxApi(path,options={},retry=true){
  if(!cloudSession?.access_token)throw new Error('Sign in before using External Requests.');
  const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),15000);
  let response;
  try{response=await fetch(path,{...options,signal:controller.signal,headers:{...(options.body?{'Content-Type':'application/json'}:{}),Authorization:`Bearer ${cloudSession.access_token}`,...(options.headers||{})}});}
  catch(error){if(error?.name==='AbortError')throw new Error('Request Inbox timed out. Check your connection and retry.');throw error;}
  finally{clearTimeout(timeout);}
  const data=await response.json().catch(()=>({}));
  if(response.status===401&&retry&&await refreshCloudSession())return externalInboxApi(path,options,false);
  if(!response.ok)throw new Error(data.error||'External Request operation failed.');
  return data;
}

function bindCircleEvents(){
  el('refreshCirclesButton').addEventListener('click',()=>void loadFocusCircles(true));
  el('circlesOpenAccountButton').addEventListener('click',openCloudSettings);
  el('createCircleButton').addEventListener('click',()=>void createFocusCircle());
  el('joinCircleButton').addEventListener('click',()=>void joinFocusCircle());
  el('circleItemForm').addEventListener('submit',event=>{event.preventDefault();void submitCircleItem();});
  ['circleItemDialogClose','circleItemCancel'].forEach(id=>el(id).addEventListener('click',closeCircleItemDialog));
  el('circleItemDialog').addEventListener('click',event=>{if(event.target===el('circleItemDialog'))closeCircleItemDialog();});
}

function sevenDayCircleXp(){
  const since=Date.now()-7*86400000;
  return Math.max(0,state.activity.filter(item=>new Date(item.at||0).getTime()>=since).reduce((sum,item)=>sum+Number(item.xp||0),0));
}

function circleProfilePayload(circleId){
  const info=xpLevelInfo(state.totalXp);
  return{circleId,displayName:state.profile.name,rankStage:state.rankStage,level:info.level,totalXp:state.totalXp,sevenDayXp:sevenDayCircleXp(),activeDays:state.activeDates.length};
}

async function circleApi(path,options={}){return externalInboxApi(path,options);}

async function createFocusCircle(){
  if(!cloudUser)return openCloudSettings();
  if(!cloudConfig.socialEnabled)return toast('Focus Circles need the one-time v0.6.0.8 Supabase SQL setup.');
  const name=el('circleNameInput').value.trim();if(name.length<3)return toast('Enter a clear circle name.');
  const button=el('createCircleButton'),inviteToken=randomShareToken();button.disabled=true;button.textContent='Creating…';
  try{
    const result=await circleApi('/api/circles/create',{method:'POST',body:JSON.stringify({name,inviteToken,displayName:state.profile.name})});
    state.social||={inviteTokens:{},activeCircleId:''};state.social.inviteTokens[result.circleId]=inviteToken;state.social.activeCircleId=result.circleId;
    el('circleNameInput').value='';saveState();await loadFocusCircles(true);toast('Private Focus Circle created. Share only its invite code with people you trust.');
  }catch(error){toast(error.message||'Could not create the circle.');}finally{button.disabled=false;button.textContent='Create Circle';}
}

async function joinFocusCircle(){
  if(!cloudUser)return openCloudSettings();
  const inviteToken=el('circleInviteInput').value.trim();if(!/^[A-Za-z0-9_-]{43,86}$/.test(inviteToken))return toast('Paste the full private invite code.');
  const button=el('joinCircleButton');button.disabled=true;button.textContent='Joining…';
  try{const result=await circleApi('/api/circles/join',{method:'POST',body:JSON.stringify({inviteToken,displayName:state.profile.name})});state.social.activeCircleId=result.circleId;el('circleInviteInput').value='';saveState();await loadFocusCircles(true);toast('Joined Focus Circle.');}
  catch(error){toast(error.message||'Could not join the circle.');}finally{button.disabled=false;button.textContent='Join Circle';}
}

async function publishFocusCircleStats(){
  await Promise.allSettled(focusCircles.map(circle=>circleApi('/api/circles/profile',{method:'POST',body:JSON.stringify(circleProfilePayload(circle.id))})));
}

async function loadFocusCircles(manual=false){
  if(focusCirclesLoading)return;
  if(guestMode||!cloudUser||!cloudConfig.socialEnabled){focusCircles=[];renderFocusCircles();return;}
  focusCirclesLoading=true;renderFocusCircles();
  focusCirclesError='';
  try{
    const data=await circleApi('/api/circles');focusCircles=Array.isArray(data.circles)?data.circles:[];
    if(focusCircles.length){
      await publishFocusCircleStats();
      // Reflect the just-published local summary without an additional network
      // round trip. This is display-only and never awards XP or changes rank.
      for(const circle of focusCircles){
        const mine=(circle.members||[]).find(member=>member.isMe);
        if(mine)Object.assign(mine,circleProfilePayload(circle.id));
      }
    }
    if(manual&&focusCircles.length)toast('Focus Circles refreshed.');
  }catch(error){focusCirclesError=error.message||'Could not refresh Focus Circles.';toast(focusCirclesError);}
  finally{focusCirclesLoading=false;renderFocusCircles();}
}

function renderFocusCircles(){
  const signedOut=guestMode||!cloudUser;
  el('circlesSignedOut').hidden=!signedOut;el('circlesWorkspace').hidden=signedOut;
  el('refreshCirclesButton').disabled=signedOut||focusCirclesLoading||!cloudConfig.socialEnabled;
  if(signedOut)return;
  const board=el('circleBoard');
  if(!cloudConfig.socialEnabled){board.innerHTML='<div class="empty-state">Focus Circles need the one-time secure database setup from the ASCEND owner.</div>';return;}
  if(focusCirclesLoading&&!focusCircles.length){board.innerHTML='<div class="empty-state">Loading private circles…</div>';return;}
  if(focusCirclesError&&!focusCircles.length){board.innerHTML=`<div class="empty-state circle-setup-error"><strong>Focus Circles are not ready.</strong><span>${escapeHtml(focusCirclesError)}</span><small>The ASCEND owner must run <code>SUPABASE-FOCUS-CIRCLES-v0.6.0.8.sql</code> then <code>SUPABASE-UPGRADE-v0.6.0.11.3.sql</code> once in Supabase. Testers do not run setup.</small><button type="button" class="ghost-btn" data-circle-retry="1">Retry</button></div>`;board.querySelector('[data-circle-retry]')?.addEventListener('click',()=>void loadFocusCircles(true));return;}
  if(!focusCircles.length){board.innerHTML='<div class="empty-state">No circles yet. Create one or join with a private invite code.</div>';return;}
  const active=focusCircles.filter(c=>!c.archived);
  const archived=focusCircles.filter(c=>c.archived);
  const renderCircle=circle=>{
    const invite=state.social?.inviteTokens?.[circle.id]||'';
    const members=[...(circle.members||[])].sort((a,b)=>Number(b.circleXp||0)-Number(a.circleXp||0));
    const memberRows=members.map((member,index)=>`<div class="circle-rank-row ${member.isMe?'me':''}"><b>${index+1}</b><span><strong>${escapeHtml(member.displayName)}</strong><small>${escapeHtml(member.rankStage)}-Rank • LV.${Number(member.level)||1} • ${Number(member.activeDays)||0} active days${member.isMe?' • YOU':''}</small></span><em>+${Number(member.circleXp||0).toLocaleString()}<small>CIRCLE XP</small></em></div>`).join('');
    const items=(circle.items||[]).map(item=>`<button type="button" class="circle-plan-row ${item.completedByMe?'done':''}" ${circle.archived?'disabled':''} data-circle-progress="${item.id}" data-completed="${item.completedByMe?'1':'0'}"><i>${item.completedByMe?'✓':'◇'}</i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.kind)} • ${friendlyDateTime(item.startsAt)} • ${formatMinutes(item.durationMinutes)} • ${Number(item.completionCount)||0}/${members.length} done</small></span></button>`).join('')||'<div class="circle-empty-plan">No shared sessions yet.</div>';
    const ownerActions=circle.role==='owner'&&!circle.archived?`<button type="button" class="text-btn" data-circle-finish="${circle.id}">Finish Circle</button>`:'';
    return `<article class="circle-card panel ${circle.archived?'circle-archived':''}"><header><div><span class="eyebrow">${circle.archived?'ARCHIVED':(circle.role==='owner'?'YOUR CIRCLE':'MEMBER')}</span><h3>${escapeHtml(circle.name)}</h3>${circle.archived&&circle.finishedAt?`<small>Finished ${friendlyDateTime(circle.finishedAt)}</small>`:''}</div><div class="circle-card-actions">${circle.archived?'':`<button type="button" class="ghost-btn" data-circle-add="${circle.id}">+ Shared Plan</button>`}${ownerActions}<button type="button" class="text-btn danger-text" data-circle-manage="${circle.id}" data-role="${circle.role}">${circle.role==='owner'?'Delete':'Leave'}</button></div></header>${invite&&!circle.archived?`<div class="circle-invite"><code>${escapeHtml(invite)}</code><button type="button" data-circle-copy="${circle.id}">Copy Invite</button></div>`:''}<div class="circle-columns"><section><span class="eyebrow">CIRCLE CONTRIBUTION XP</span>${memberRows}</section><section><span class="eyebrow">SHARED SCHEDULE</span>${items}</section></div><small class="circle-integrity">Circle Contribution XP is earned only from completing shared circle sessions and is verified by the server. It never changes your account XP, level, or rank.</small></article>`;
  };
  board.innerHTML=(active.length?`<div class="circle-group">${active.map(renderCircle).join('')}</div>`:'<div class="empty-state">No active circles. Create one or join with a private invite code.</div>')
    +(archived.length?`<div class="circle-group-label">Archived Circles</div><div class="circle-group">${archived.map(renderCircle).join('')}</div>`:'');
  board.querySelectorAll('[data-circle-copy]').forEach(button=>button.addEventListener('click',async()=>{const token=state.social?.inviteTokens?.[button.dataset.circleCopy];if(!token)return;try{await navigator.clipboard.writeText(token);toast('Private invite code copied.');}catch{toast('Copy failed. Select the invite code manually.');}}));
  board.querySelectorAll('[data-circle-add]').forEach(button=>button.addEventListener('click',()=>openCircleItemDialog(button.dataset.circleAdd)));
  board.querySelectorAll('[data-circle-progress]').forEach(button=>button.addEventListener('click',()=>void toggleCircleProgress(button.dataset.circleProgress,button.dataset.completed!=='1')));
  board.querySelectorAll('[data-circle-manage]').forEach(button=>button.addEventListener('click',()=>void manageFocusCircle(button.dataset.circleManage,button.dataset.role)));
  board.querySelectorAll('[data-circle-finish]').forEach(button=>button.addEventListener('click',()=>void finishFocusCircle(button.dataset.circleFinish)));
}

function openCircleItemDialog(circleId){activeCircleItemId=circleId;el('circleItemForm').reset();el('circleItemDuration').value='60';const when=new Date(Date.now()+3600000);when.setMinutes(Math.ceil(when.getMinutes()/15)*15,0,0);el('circleItemStartsAt').value=new Date(when.getTime()-when.getTimezoneOffset()*60000).toISOString().slice(0,16);el('circleItemDialog').hidden=false;document.body.classList.add('modal-open');setTimeout(()=>el('circleItemTitle').focus(),50);}
function closeCircleItemDialog(){activeCircleItemId=null;el('circleItemDialog').hidden=true;document.body.classList.remove('modal-open');}
async function submitCircleItem(){
  if(!activeCircleItemId)return;
  const payload={circleId:activeCircleItemId,title:el('circleItemTitle').value.trim(),kind:el('circleItemKind').value,durationMinutes:Number(el('circleItemDuration').value),startsAt:el('circleItemStartsAt').value};
  if(!payload.title||!payload.startsAt)return toast('Add a title and start time.');
  try{await circleApi('/api/circles/item',{method:'POST',body:JSON.stringify(payload)});closeCircleItemDialog();await loadFocusCircles();toast('Shared plan added to the circle.');}catch(error){toast(error.message||'Could not share this plan.');}
}
async function toggleCircleProgress(itemId,completed){try{await circleApi('/api/circles/progress',{method:'POST',body:JSON.stringify({itemId,completed})});await loadFocusCircles();toast(completed?'Shared plan marked done.':'Shared completion removed.');}catch(error){toast(error.message||'Could not update circle progress.');}}
async function manageFocusCircle(circleId,role){const action=role==='owner'?'delete':'leave';if(!confirm(`${action==='delete'?'Delete this circle for every member':'Leave this circle'}?`))return;try{await circleApi('/api/circles/manage',{method:'POST',body:JSON.stringify({circleId,action})});if(action==='delete')delete state.social?.inviteTokens?.[circleId];saveState();await loadFocusCircles();toast(action==='delete'?'Circle deleted.':'You left the circle.');}catch(error){toast(error.message||'Could not update circle membership.');}}
async function finishFocusCircle(circleId){
  if(!confirm('Finish this circle? This freezes it permanently — no more shared plans, completions, or edits. This cannot be undone.'))return;
  try{
    const result=await circleApi('/api/circles/manage',{method:'POST',body:JSON.stringify({circleId,action:'finish'})});
    await loadFocusCircles();
    if(result?.alreadyFinished){toast('This circle was already finished.');return;}
    const summary=result?.summary;
    if(summary)toast(`Circle finished. ${summary.participants} participants, ${summary.sessionsCompleted} sessions completed, ${Number(summary.totalCircleXp||0).toLocaleString()} total Circle XP earned.`);
    else toast('Circle finished and archived.');
  }catch(error){toast(error.message||'Could not finish this circle.');}
}

function friendState(){
  state.social||={inviteTokens:{},activeCircleId:'',friendInviteToken:'',friendInviteEnabled:true,shareFriendProgress:true};
  state.social.friendInviteToken||=randomShareToken();
  if(typeof state.social.friendInviteEnabled!=='boolean')state.social.friendInviteEnabled=true;
  if(typeof state.social.shareFriendProgress!=='boolean')state.social.shareFriendProgress=true;
  return state.social;
}
function bindFriendEvents(){
  el('refreshFriendsButton').addEventListener('click',()=>void loadFriends(true));
  el('friendsOpenAccountButton').addEventListener('click',openCloudSettings);
  el('copyFriendCodeButton').addEventListener('click',copyFriendCode);
  el('rotateFriendCodeButton').addEventListener('click',()=>void rotateFriendCode());
  el('toggleFriendCodeButton').addEventListener('click',()=>void toggleFriendCode());
  el('sendFriendRequestButton').addEventListener('click',()=>void sendFriendRequest());
  el('shareFriendProgressToggle').addEventListener('change',event=>void updateFriendPrivacy(event.target.checked));
  el('friendPlanForm').addEventListener('submit',event=>{event.preventDefault();void submitFriendPlan();});
  ['friendPlanDialogClose','friendPlanCancel'].forEach(id=>el(id).addEventListener('click',closeFriendPlanDialog));
  el('friendPlanDialog').addEventListener('click',event=>{if(event.target===el('friendPlanDialog'))closeFriendPlanDialog();});
}
async function publishFriendProfile(){
  const social=friendState();
  await circleApi('/api/friends/profile',{method:'POST',body:JSON.stringify({displayName:state.profile.name,inviteToken:social.friendInviteToken,inviteEnabled:social.friendInviteEnabled,shareCollaboration:social.shareFriendProgress,rankStage:state.rankStage,totalXp:state.totalXp})});
}
async function loadFriends(manual=false){
  if(friendsLoading)return;
  if(guestMode||!cloudUser||!cloudConfig.socialEnabled){friendsData={profile:{},relationships:[],leaderboard:[]};renderFriends();return;}
  friendsLoading=true;friendsError='';renderFriends();
  try{await publishFriendProfile();const data=await circleApi('/api/friends');friendsData={profile:data.profile||{},relationships:Array.isArray(data.relationships)?data.relationships:[],leaderboard:Array.isArray(data.leaderboard)?data.leaderboard:[]};saveState();if(manual)toast('Friends refreshed.');}
  catch(error){friendsError=error.message||'Could not load Friends.';toast(friendsError);}
  finally{friendsLoading=false;renderFriends();}
}
async function copyFriendCode(){const token=friendState().friendInviteToken;try{await navigator.clipboard.writeText(token);toast('Private friend code copied.');}catch{el('friendCodeOutput').focus();el('friendCodeOutput').select();toast('Select and copy the private code.');}}
async function rotateFriendCode(){if(!confirm('Rotate your private friend code? The previous code will stop working.'))return;friendState().friendInviteToken=randomShareToken();friendState().friendInviteEnabled=true;saveState();try{await publishFriendProfile();renderFriends();await copyFriendCode();}catch(error){toast(error.message||'Could not rotate the code.');}}
async function toggleFriendCode(){const social=friendState();social.friendInviteEnabled=!social.friendInviteEnabled;saveState();try{await publishFriendProfile();renderFriends();toast(social.friendInviteEnabled?'Friend code enabled.':'Friend code disabled. Existing friends remain connected.');}catch(error){social.friendInviteEnabled=!social.friendInviteEnabled;saveState();renderFriends();toast(error.message||'Could not update the friend code.');}}
async function updateFriendPrivacy(enabled){const social=friendState(),previous=social.shareFriendProgress;social.shareFriendProgress=Boolean(enabled);saveState();try{await publishFriendProfile();await loadFriends();toast(enabled?'Collaboration count is visible to friends.':'Collaboration count is private.');}catch(error){social.shareFriendProgress=previous;saveState();renderFriends();toast(error.message||'Could not update privacy.');}}
async function sendFriendRequest(){const input=el('friendCodeInput'),inviteToken=input.value.trim();if(!/^[A-Za-z0-9_-]{43,86}$/.test(inviteToken))return toast('Paste the full private friend code.');const button=el('sendFriendRequestButton');button.disabled=true;button.textContent='Sending…';try{const result=await circleApi('/api/friends/request',{method:'POST',body:JSON.stringify({inviteToken})});input.value='';await loadFriends();toast(result.alreadyFriends?'You are already friends.':result.alreadyPending?'A request is already pending.':'Friend request sent privately.');}catch(error){toast(error.message||'Could not send friend request.');}finally{button.disabled=false;button.textContent='Send Request';}}
async function friendAction(relationshipId,action){
  const dangerous=['remove','block'].includes(action);if(dangerous&&!confirm(`${action==='block'?'Block this person':'Remove this friend'}?`))return;
  try{await circleApi('/api/friends/action',{method:'POST',body:JSON.stringify({relationshipId,action})});await loadFriends();toast({accept:'Friend request accepted.',decline:'Request declined.',cancel:'Request cancelled.',remove:'Friend removed.',block:'Person blocked.'}[action]);}catch(error){toast(error.message||'Could not update this friend request.');}
}
function openFriendPlanDialog(relationshipId){activeFriendRelationshipId=relationshipId;el('friendPlanForm').reset();el('friendPlanDuration').value='30';el('friendPlanDialog').hidden=false;document.body.classList.add('modal-open');setTimeout(()=>el('friendPlanTitle').focus(),50);}
function closeFriendPlanDialog(){activeFriendRelationshipId=null;el('friendPlanDialog').hidden=true;document.body.classList.remove('modal-open');}
async function submitFriendPlan(){if(!activeFriendRelationshipId)return;const payload={relationshipId:activeFriendRelationshipId,title:el('friendPlanTitle').value.trim(),kind:el('friendPlanKind').value,durationMinutes:Number(el('friendPlanDuration').value),startsAt:el('friendPlanStartsAt').value||null};if(!payload.title)return toast('Add a plan title.');try{await circleApi('/api/friends/plan',{method:'POST',body:JSON.stringify(payload)});closeFriendPlanDialog();await loadFriends();toast('Shared friend plan added. No account XP was awarded.');}catch(error){toast(error.message||'Could not add the friend plan.');}}
async function toggleFriendPlan(planId,completed){try{await circleApi('/api/friends/progress',{method:'POST',body:JSON.stringify({planId,completed})});await loadFriends();toast(completed?'Your completion was recorded.':'Your completion was removed.');}catch(error){toast(error.message||'Could not update your completion.');}}
async function cancelFriendPlan(planId){if(!confirm('Cancel this shared plan for both friends?'))return;try{await circleApi('/api/friends/plan/cancel',{method:'POST',body:JSON.stringify({planId})});await loadFriends();toast('Shared plan cancelled.');}catch(error){toast(error.message||'Could not cancel the plan.');}}
function renderFriends(){
  const signedOut=guestMode||!cloudUser,social=friendState();el('friendsSignedOut').hidden=!signedOut;el('friendsWorkspace').hidden=signedOut;el('refreshFriendsButton').disabled=signedOut||friendsLoading||!cloudConfig.socialEnabled;
  const incoming=(friendsData.relationships||[]).filter(item=>item.status==='pending'&&item.direction==='incoming').length;el('friendRequestBadge').hidden=!incoming;el('friendRequestBadge').textContent=String(incoming);
  if(signedOut)return;
  el('friendCodeOutput').value=social.friendInviteEnabled?social.friendInviteToken:'Private code disabled';el('friendCodeOutput').disabled=!social.friendInviteEnabled;el('copyFriendCodeButton').disabled=!social.friendInviteEnabled;el('toggleFriendCodeButton').textContent=social.friendInviteEnabled?'Disable':'Enable';el('shareFriendProgressToggle').checked=social.shareFriendProgress;
  const pendingBox=el('friendPendingList'),listBox=el('friendList'),leaderboard=el('friendLeaderboard');
  if(!cloudConfig.socialEnabled){pendingBox.innerHTML='<div class="empty-state">Friends need the one-time secure database setup.</div>';listBox.innerHTML='';leaderboard.innerHTML='';return;}
  if(friendsLoading&&!friendsData.relationships.length){pendingBox.innerHTML='<div class="empty-state">Loading private connections…</div>';listBox.innerHTML='';leaderboard.innerHTML='';return;}
  if(friendsError&&!friendsData.relationships.length){pendingBox.innerHTML=`<div class="empty-state circle-setup-error"><strong>Friends are not ready.</strong><span>${escapeHtml(friendsError)}</span><small>The ASCEND owner must run <code>SUPABASE-FRIENDS-v0.6.0.11.3.sql</code> once in Supabase.</small><button class="ghost-btn" data-friend-retry="1">Retry</button></div>`;pendingBox.querySelector('[data-friend-retry]')?.addEventListener('click',()=>void loadFriends(true));listBox.innerHTML='';leaderboard.innerHTML='';return;}
  const pending=(friendsData.relationships||[]).filter(item=>item.status==='pending');
  pendingBox.innerHTML=pending.length?pending.map(item=>`<article class="friend-card"><div class="friend-card-head"><div class="friend-identity"><span class="friend-avatar">${escapeHtml(item.friend.displayName.slice(0,1).toUpperCase())}</span><div><h3>${escapeHtml(item.friend.displayName)}</h3><small>${item.direction==='incoming'?'Wants to add you':'Waiting for response'}</small></div></div><div class="friend-actions">${item.direction==='incoming'?`<button class="primary-btn" data-friend-action="accept" data-relationship="${item.id}">Accept</button><button class="ghost-btn" data-friend-action="decline" data-relationship="${item.id}">Decline</button><button class="text-btn" data-friend-action="block" data-relationship="${item.id}">Block</button>`:`<button class="ghost-btn" data-friend-action="cancel" data-relationship="${item.id}">Cancel Request</button>`}</div></div></article>`).join(''):'<div class="empty-state">No pending friend requests.</div>';
  const accepted=(friendsData.relationships||[]).filter(item=>item.status==='accepted');
  listBox.innerHTML=accepted.length?accepted.map(item=>`<article class="friend-card"><div class="friend-card-head"><div class="friend-identity"><span class="friend-avatar">${escapeHtml(item.friend.displayName.slice(0,1).toUpperCase())}</span><div><h3>${escapeHtml(item.friend.displayName)}</h3><small>${item.friend.shareCollaboration?`${Number(item.friend.collaborationScore||0)} shared completions`:'Collaboration count private'}</small></div></div><div class="friend-actions"><button class="primary-btn" data-friend-plan-add="${item.id}">+ Shared Plan</button><button class="text-btn" data-friend-action="remove" data-relationship="${item.id}">Remove</button><button class="text-btn" data-friend-action="block" data-relationship="${item.id}">Block</button></div></div><div class="friend-plan-list">${item.plans.length?item.plans.map(plan=>`<div class="friend-plan"><button type="button" class="${plan.completedByMe?'done':''}" data-friend-progress="${plan.id}" data-completed="${plan.completedByMe?'1':'0'}">${plan.completedByMe?'✓':'◇'}</button><span class="friend-plan-copy"><strong>${escapeHtml(plan.title)}</strong><small>${escapeHtml(plan.kind)} • ${Number(plan.durationMinutes)}m${plan.startsAt?` • ${escapeHtml(new Date(plan.startsAt).toLocaleString())}`:''}</small></span><span class="friend-plan-state">You: <strong>${plan.completedByMe?'done':'open'}</strong> • Friend: <strong>${plan.completedByFriend?'done':'open'}</strong>${plan.isMine?` • <button class="text-btn" data-friend-plan-cancel="${plan.id}">Cancel</button>`:''}</span></div>`).join(''):'<div class="empty-state">No shared plans yet.</div>'}</div></article>`).join(''):'<div class="empty-state">No accepted friends yet. Share your private code with someone you trust.</div>';
  leaderboard.innerHTML=(friendsData.leaderboard||[]).length?friendsData.leaderboard.map((row,index)=>`<div class="friend-rank-row"><i>${index+1}</i><span><strong>${escapeHtml(row.displayName)}</strong>${row.isMe?'<small class="friend-you-label">-YOU</small>':''}</span><b>${escapeHtml(row.rankStage || 'E')}-RANK • ${Number(row.totalXp || 0).toLocaleString()} XP</b></div>`).join(''):'<div class="empty-state">The board appears after a friend is accepted.</div>';
  document.querySelectorAll('[data-friend-action]').forEach(button=>button.addEventListener('click',()=>void friendAction(button.dataset.relationship,button.dataset.friendAction)));
  document.querySelectorAll('[data-friend-plan-add]').forEach(button=>button.addEventListener('click',()=>openFriendPlanDialog(button.dataset.friendPlanAdd)));
  document.querySelectorAll('[data-friend-progress]').forEach(button=>button.addEventListener('click',()=>void toggleFriendPlan(button.dataset.friendProgress,button.dataset.completed!=='1')));
  document.querySelectorAll('[data-friend-plan-cancel]').forEach(button=>button.addEventListener('click',()=>void cancelFriendPlan(button.dataset.friendPlanCancel)));
}

async function configureExternalRequestLink(rotate=false){
  if(guestMode||!cloudUser)return toast('Sign in to create a private request link.');
  if(!cloudConfig.externalRequestsEnabled)return toast('External Requests need the one-time secure owner setup first.');
  if(rotate&&!confirm('Rotate this request link? The previous URL will stop accepting requests immediately.'))return;
  const button=rotate?el('rotateExternalRequestLinkButton'):el('createExternalRequestLinkButton');
  button.disabled=true;button.textContent=rotate?'Rotating…':'Creating…';
  try{
    const inbox=await ensureExternalInboxIdentity({rotate});
    await externalInboxApi('/api/external-inbox/setup',{method:'POST',body:JSON.stringify({token:inbox.token,publicKey:inbox.publicKeyJwk,enabled:true})});
    inbox.enabled=true;saveState();renderExternalRequestSettings();await loadExternalRequests(true);
    toast(rotate?'New secure link created. The previous link is invalid.':'Secure request link created.');
  }catch(error){toast(error.message||'Could not create the request link.');}
  finally{button.disabled=false;button.textContent=rotate?'Rotate Link':'Create Secure Link';}
}

async function toggleExternalRequestLink(){
  const inbox=state.externalInbox||{};
  if(!inbox.token||!inbox.publicKeyJwk)return;
  const next=!inbox.enabled;
  if(!next&&!confirm('Disable this request link? New submissions will be blocked until you enable it again.'))return;
  try{await externalInboxApi('/api/external-inbox/setup',{method:'POST',body:JSON.stringify({token:inbox.token,publicKey:inbox.publicKeyJwk,enabled:next})});inbox.enabled=next;saveState();renderExternalRequestSettings();toast(next?'Request link enabled.':'Request link disabled.');}catch(error){toast(error.message||'Could not update the request link.');}
}

async function copyExternalRequestLink(){
  const value=externalRequestUrl();if(!value)return toast('Create a secure request link first.');
  try{await navigator.clipboard.writeText(value);toast('Private request link copied.');}catch{window.prompt('Copy your private request link:',value);}
}

function renderExternalRequestSettings(){
  const configured=Boolean(cloudConfig.externalRequestsEnabled),inbox=state.externalInbox||{},hasLink=Boolean(inbox.token&&inbox.publicKeyJwk&&inbox.privateKeyEnvelope);
  el('externalRequestUnavailable').hidden=configured;
  el('externalRequestLink').value=hasLink?maskedExternalRequestUrl(inbox.token):'';
  el('externalRequestLink').disabled=!hasLink;
  el('copyExternalRequestLinkButton').disabled=!configured||!hasLink||!inbox.enabled;
  el('createExternalRequestLinkButton').hidden=hasLink;
  el('createExternalRequestLinkButton').disabled=!configured||!cloudUser;
  el('rotateExternalRequestLinkButton').hidden=!hasLink;
  el('toggleExternalRequestLinkButton').hidden=!hasLink;
  el('rotateExternalRequestLinkButton').disabled=!configured||!cloudUser;
  el('toggleExternalRequestLinkButton').disabled=!configured||!cloudUser;
  el('toggleExternalRequestLinkButton').textContent=inbox.enabled?'Disable Link':'Enable Link';
  const badge=el('externalRequestStateBadge');badge.textContent=!configured?'SETUP':!cloudUser?'SIGN IN':hasLink?(inbox.enabled?'LIVE':'PAUSED'):'READY';badge.classList.toggle('ai',configured&&hasLink&&inbox.enabled);
  el('commandExternalPendingCount').textContent=String(externalRequests.length);
  el('openExternalInboxButton').disabled=!configured||!cloudUser||!hasLink;
}

function b64urlBytes(value){return base64UrlDecode(String(value||''));}
async function decryptExternalEnvelope(envelope){
  const privateJwk=await decryptExternalPrivateKey(state.externalInbox?.privateKeyEnvelope);
  const privateKey=await crypto.subtle.importKey('jwk',privateJwk,{name:'RSA-OAEP',hash:'SHA-256'},false,['unwrapKey']);
  const aes=await crypto.subtle.unwrapKey('raw',b64urlBytes(envelope.wrappedKey),privateKey,{name:'RSA-OAEP'},{name:'AES-GCM',length:256},false,['decrypt']);
  const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:b64urlBytes(envelope.iv),additionalData:new TextEncoder().encode('ASCEND-EXTERNAL-REQUEST-V1'),tagLength:128},aes,b64urlBytes(envelope.ciphertext));
  const raw=JSON.parse(new TextDecoder().decode(plain));
  const parsed={version:Number(raw?.version),type:String(raw?.type||''),senderName:String(raw?.senderName||'').slice(0,80),senderContact:String(raw?.senderContact||'').slice(0,160),subject:String(raw?.subject||'').slice(0,140),requestedFor:raw?.requestedFor?String(raw.requestedFor).slice(0,40):null,durationMinutes:Math.max(5,Math.min(1440,Number(raw?.durationMinutes)||30)),details:String(raw?.details||'').slice(0,3000)};
  if(!parsed||parsed.version!==1||!['meeting','task','other'].includes(parsed.type))throw new Error('Unsupported encrypted request.');
  return parsed;
}

async function loadExternalRequests(manual=false){
  if(externalRequestsLoading)return;
  if(guestMode||!cloudUser||!cloudConfig.externalRequestsEnabled||!state.externalInbox?.privateKeyEnvelope){externalRequests=[];renderExternalRequests();return;}
  externalRequestsLoading=true;if(manual)el('refreshExternalRequestsButton').textContent='Loading…';
  try{
    const data=await externalInboxApi('/api/external-inbox',{method:'GET'});
    const decrypted=[];
    for(const row of data.requests||[]){try{decrypted.push({id:row.id,createdAt:row.created_at,payload:await decryptExternalEnvelope(row.envelope)});}catch(error){decrypted.push({id:row.id,createdAt:row.created_at,decryptError:true,payload:null});}}
    externalRequests=decrypted;renderExternalRequests();
    if(manual)toast(`${decrypted.length} pending request${decrypted.length===1?'':'s'} loaded.`);
  }catch(error){if(manual)toast(error.message||'Could not load External Requests.');}
  finally{externalRequestsLoading=false;el('refreshExternalRequestsButton').textContent='Refresh';}
}

function renderExternalRequests(){
  const section=el('externalInboxSection');
  const available=!guestMode&&cloudUser&&cloudConfig.externalRequestsEnabled&&state.externalInbox?.privateKeyEnvelope;
  section.hidden=!available;el('externalInboxCount').textContent=String(externalRequests.length);el('commandExternalPendingCount').textContent=String(externalRequests.length);
  if(!available)return;
  el('externalRequestList').innerHTML=externalRequests.length?externalRequests.map(item=>{
    if(item.decryptError)return `<article class="external-request-card corrupt"><div><span class="request-kind">ENCRYPTED REQUEST</span><h3>Could not decrypt this envelope</h3><p>The request may be damaged or was sent before the link was rotated.</p></div><button class="danger-btn" data-dismiss-request="${item.id}">Dismiss</button></article>`;
    const p=item.payload,date=p.requestedFor?new Date(p.requestedFor):null;
    return `<article class="external-request-card"><div class="external-request-main"><div class="external-request-top"><span class="request-kind">${escapeHtml(p.type.toUpperCase())}</span><small>${escapeHtml(friendlyDateTime(item.createdAt))}</small></div><h3>${escapeHtml(p.subject)}</h3><p>${escapeHtml(p.details)}</p><div class="request-sender"><strong>${escapeHtml(p.senderName)}</strong>${p.senderContact?`<span>${escapeHtml(p.senderContact)}</span>`:''}</div><div class="request-meta">${date&&!Number.isNaN(date.getTime())?`<span>Requested: ${escapeHtml(date.toLocaleString())}</span>`:''}<span>${Number(p.durationMinutes||30)} minutes</span><span>Untrusted external suggestion</span></div></div><div class="external-request-actions"><button class="primary-btn" data-review-request="${item.id}">Review as Quest</button><button class="ghost-btn" data-analyze-request="${item.id}">Analyze with AI</button><button class="text-btn" data-dismiss-request="${item.id}">Dismiss</button></div></article>`;
  }).join(''):`<div class="external-inbox-empty"><strong>No pending requests.</strong><span>Your private share link is ready when someone needs to propose a meeting or task.</span></div>`;
  el('externalRequestList').querySelectorAll('[data-review-request]').forEach(b=>b.addEventListener('click',()=>reviewExternalRequest(b.dataset.reviewRequest,false)));
  el('externalRequestList').querySelectorAll('[data-analyze-request]').forEach(b=>b.addEventListener('click',()=>reviewExternalRequest(b.dataset.analyzeRequest,true)));
  el('externalRequestList').querySelectorAll('[data-dismiss-request]').forEach(b=>b.addEventListener('click',()=>dismissExternalRequest(b.dataset.dismissRequest)));
}

function externalRequestQuestPrefill(payload){
  const proposed=payload.requestedFor?new Date(payload.requestedFor):null,dueDate=proposed&&!Number.isNaN(proposed.getTime())?localDateKey(proposed):null;
  const type=payload.type==='meeting'?'Meeting':'Request';
  const arabic=/[\u0600-\u06ff]/.test(`${payload.subject} ${payload.details}`);
  return{title:payload.subject,category:selectedFocusAreas()[0]||'Personal',secondaryCategory:'',questType:'Side Quest',priority:'Medium',difficulty:'E',estimatedMinutes:Math.max(5,Math.min(1440,Number(payload.durationMinutes)||30)),dueDate,longTermValue:2,impactScore:2,successCriteria:arabic?`الرد على ${payload.senderName} وتنفيذ ما تم الاتفاق عليه.`:`Respond to ${payload.senderName} and complete the agreed ${type.toLowerCase()}.`,rationale:payload.details,suggestedSubquests:[],antiFarm:{flag:false,reason:''}};
}

function externalRequestAiText(payload){const arabic=/[\u0600-\u06ff]/.test(`${payload.subject} ${payload.details}`);if(arabic)return `هذا طلب واحد مرسل من ${payload.senderName}: ${payload.subject}\nالتفاصيل: ${payload.details}${payload.requestedFor?`\nالوقت المقترح: ${payload.requestedFor}`:''}\nالمدة المتوقعة: ${payload.durationMinutes} دقيقة`;return `This is one external ${payload.type} request from ${payload.senderName}: ${payload.subject}\nDetails: ${payload.details}${payload.requestedFor?`\nRequested time: ${payload.requestedFor}`:''}\nEstimated duration: ${payload.durationMinutes} minutes`;}

function reviewExternalRequest(id,withAi){
  const item=externalRequests.find(x=>x.id===id);if(!item?.payload)return;
  if(state.quests.some(quest=>quest.externalSourceId===id)){
    void updateExternalRequestStatus(id,'accepted').then(()=>toast('This request is already on your Quest Board; the pending copy was closed.')).catch(error=>toast(error.message||'Could not close the pending request.'));
    return;
  }
  pendingExternalRequestId=id;
  if(withAi){switchView('dashboard');pendingExternalRequestText=externalRequestAiText(item.payload);el('questInput').value=pendingExternalRequestText;openAiQuestConsole();toast('External request copied into the AI Quest Console. Accept it only after review.');return;}
  openQuestDialog(externalRequestQuestPrefill(item.payload),null,'external-request');
}

async function updateExternalRequestStatus(requestId,status){
  await externalInboxApi('/api/external-inbox/status',{method:'POST',body:JSON.stringify({requestId,status})});
  externalRequests=externalRequests.filter(x=>x.id!==requestId);renderExternalRequests();
}
async function dismissExternalRequest(id){if(!confirm('Dismiss this external request? It will leave the pending inbox.'))return;try{await updateExternalRequestStatus(id,'dismissed');toast('External request dismissed.');}catch(error){toast(error.message||'Could not dismiss the request.');}}

function currentViewName() { return Object.entries(views).find(([,node]) => node.classList.contains('active'))?.[0] || 'dashboard'; }

function browserLabel() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'Edge';
  if (/CriOS|Chrome\//.test(ua)) return 'Chrome';
  if (/FxiOS|Firefox\//.test(ua)) return 'Firefox';
  if (/Safari\//.test(ua)) return 'Safari';
  return 'Other browser';
}

async function submitBetaFeedback() {
  const button = el('sendFeedbackButton');
  const message = el('feedbackMessage').value.trim();
  if (!cloudUser || !cloudSession?.access_token) return toast('Sign in to send Private Beta feedback.');
  if (!cloudConfig.feedbackEnabled) return toast('Feedback storage needs the one-time Supabase setup from the project owner.');
  if (message.length < 8) return toast('Add a little more detail before sending.');
  button.disabled = true; button.textContent = 'Sending…';
  try {
    const diagnostics = el('feedbackDiagnostics').checked ? {
      viewport:`${window.innerWidth}x${window.innerHeight}`,
      browser:browserLabel(),
      platform:/iPad|iPhone|iPod/.test(navigator.userAgent) ? 'Apple mobile' : navigator.platform || 'Unknown',
      standalone:window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
      online:navigator.onLine
    } : null;
    const response = await fetch('/api/feedback', {
      method:'POST', headers:{'Content-Type':'application/json',Authorization:`Bearer ${cloudSession.access_token}`},
      body:JSON.stringify({category:el('feedbackCategory').value,message,page:currentViewName(),appVersion:SYSTEM_VERSION,diagnostics})
    });
    const payload = await response.json().catch(()=>({}));
    if (!response.ok) throw new Error(payload.error || 'Feedback could not be sent.');
    el('feedbackMessage').value = '';
    toast('Feedback sent. Thank you for improving ASCEND.');
  } catch (error) { toast(error.message || 'Feedback could not be sent.'); }
  finally { button.disabled = !cloudConfig.feedbackEnabled || !cloudUser; button.textContent = 'Send Feedback'; }
}

function saveProfile() {
  state.profile.name = el('settingsName').value.trim() || 'Player';
  state.profile.identity = el('settingsIdentity').value.trim() || 'Focused Operator';
  const selected = el('settingsEquippedTitle').value;
  state.profile.equippedTitle = state.titlesUnlocked.includes(selected) ? selected : 'Awakening';
  saveState(); renderAll(); toast('Player profile updated.');
}

function saveSeason() {
  state.season = {
    name: el('settingsSeasonName').value.trim() || 'Current Season',
    start: el('settingsSeasonStart').value || localDateKey(new Date()),
    end: el('settingsSeasonEnd').value || localDateKey(new Date()),
    purpose: el('settingsSeasonPurpose').value.trim() || 'Build meaningful progress.'
  };
  saveState(); renderAll(); toast('Season updated.');
}

function saveSystemContext() {
  state.systemContext = el('settingsSystemContext').value.trim().slice(0, 4000);
  state.ai ||= {}; state.ai.directive = null; state.ai.review = null;
  saveState(); renderAll(); toast('System context updated.');
}

async function testAiConnection() {
  const button = el('testAiButton');
  button.disabled = true; button.textContent = 'Testing…';
  try {
    const response = await fetch('/api/ai/test', { method:'POST' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'AI test failed.');
    toast(`Gemini connected • Fast: ${data.fastModel || 'available'} • Deep: ${data.deepModel || 'available'}`);
    await checkAiStatus();
  } catch (error) {
    toast(error.message || 'AI connection failed.');
  } finally { button.disabled = false; button.textContent = 'Test AI Connection'; }
}

function renderSeason() {
  const s = state.season;
  el('seasonName').textContent = s.name;
  el('seasonText').textContent = s.purpose;
  const start = parseLocalDate(s.start); const end = parseLocalDate(s.end); const today = parseLocalDate(localDateKey(new Date()));
  const total = Math.max(1, Math.round((end - start)/86400000) + 1);
  const elapsed = clamp(Math.round((today - start)/86400000) + 1, 0, total);
  const remaining = Math.max(0, Math.round((end - today)/86400000) + 1);
  el('seasonDays').textContent = `${remaining} DAY${remaining === 1 ? '' : 'S'} LEFT`;
  el('seasonBar').style.width = `${Math.min(100,(elapsed/total)*100)}%`;
  const next = RANKS[rankIndex(state.rankStage)+1];
  if (!next) {
    el('nextRankTitle').textContent = 'Visible Rank Summit';
    el('nextRankPreview').innerHTML = `<strong>S-V // MYTHIC</strong><span>Lifetime progression continues beyond the visible ladder.</span>`;
  } else {
    const reqs = rankRequirementStatus(next); const done = reqs.filter(x=>x.met).length;
    el('nextRankTitle').textContent = `Next: ${next.stage} // ${next.subtitle}`;
    el('nextRankPreview').innerHTML = `<div class="rank-preview-score"><strong>${done}/${reqs.length}</strong><span>trial requirements met</span></div><div class="rank-preview-track"><i style="width:${(done/reqs.length)*100}%"></i></div><small>${next.stage.startsWith('S') ? `${effectiveRankMinDays(next)}+ active days is only one gate${totalImpactCreditPercent()>0?' after impact credit':''}.` : 'XP alone cannot promote your rank.'}</small>`;
  }
}

function exportBackup() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type:'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `ascend-v${SYSTEM_VERSION}-backup-${localDateKey(new Date())}.json`; a.click(); URL.revokeObjectURL(url); toast('Backup exported.');
}

async function importBackup(event) {
  const file = event.target.files?.[0]; if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const currentInbox=state.externalInbox;
    state = migrateState(parsed);
    // An older progress backup must not orphan the owner's live encrypted
    // request channel or destroy the only private decryption envelope.
    if(cloudUser&&currentInbox?.privateKeyEnvelope&&!state.externalInbox?.privateKeyEnvelope)state.externalInbox=currentInbox;
    saveState(); refreshStreak(); unlockAchievements(false); renderAll(); toast('Backup restored and migrated.');
  } catch (error) { toast(error.message || 'Could not import backup.'); }
  finally { event.target.value = ''; }
}

function resetData() {
  if (!confirm('Reset ALL ASCEND data on this device? Export a backup first if you want to preserve progress.')) return;
  const protectedInbox=cloudUser&&state.externalInbox?.privateKeyEnvelope?state.externalInbox:null;
  state = defaultState();
  if(protectedInbox)state.externalInbox=protectedInbox;
  localStorage.removeItem(LEGACY_V3_STORAGE_KEY);
  localStorage.removeItem(LEGACY_V2_STORAGE_KEY);
  localStorage.removeItem(LEGACY_V1_STORAGE_KEY);
  saveState(); renderAll(); toast('System reset.');
}

function loadState() {
  try {
    if (guestMode) {
      const guestRaw = localStorage.getItem(GUEST_STATE_KEY);
      return guestRaw ? migrateState(JSON.parse(guestRaw)) : defaultState();
    }

    // Privacy on reload: when a cloud session exists, hydrate only that session's
    // account-specific cache. Never flash generic/Guest device state before sync.
    try {
      const session=loadCloudSession();
      const sessionUserId=String(session?.user?.id||'');
      if(sessionUserId){
        const accountRaw=localStorage.getItem(userStorageKey(sessionUserId));
        return accountRaw?migrateState(JSON.parse(accountRaw)):defaultState();
      }
    } catch {}

    const rawV4 = localStorage.getItem(STORAGE_KEY);
    if (rawV4) return migrateState(JSON.parse(rawV4));
    const rawV3 = localStorage.getItem(LEGACY_V3_STORAGE_KEY);
    if (rawV3) {
      const migrated = migrateState(JSON.parse(rawV3));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const rawV2 = localStorage.getItem(LEGACY_V2_STORAGE_KEY);
    if (rawV2) {
      const migrated = migrateState(JSON.parse(rawV2));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    const rawV1 = localStorage.getItem(LEGACY_V1_STORAGE_KEY);
    if (rawV1) {
      const migrated = migrateState(JSON.parse(rawV1));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
  } catch (error) { console.warn('ASCEND state load failed:', error); }
  return defaultState();
}

function migrateState(parsed) {
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid ASCEND state.');
  const base = defaultState();
  const sourceVersion = Number(parsed.version || 1);
  const isV1 = sourceVersion < 2;
  const migrated = {
    ...base, ...parsed, version: 12, systemVersion: SYSTEM_VERSION,
    profile: {
      ...base.profile,
      ...(parsed.profile || {}),
      identity: parsed.profile?.identity || parsed.profile?.title || base.profile.identity,
      equippedTitle: parsed.profile?.equippedTitle || 'Awakening',
      onboardingComplete: parsed.profile?.onboardingComplete ?? stateHasMeaningfulProgress(parsed),
      focusAreas:Array.isArray(parsed.profile?.focusAreas)?parsed.profile.focusAreas.filter(x=>typeof x==='string'&&x.trim()).map(canonicalArea).slice(0,40):[],
      operatingMode: parsed.profile?.operatingMode || 'Balance',
      aiPrivacyMode: parsed.profile?.aiPrivacyMode === 'local' ? 'local' : 'ai'
    },
    season: { ...base.season, ...(parsed.season || {}) },
    systemContext: String(parsed.systemContext || base.systemContext).slice(0,4000),
    ai: { ...base.ai, ...(parsed.ai || {}) },
    stats:{...base.stats,...(parsed.stats||{})},
    skills:SKILL_SYSTEM.migrateSkillState(parsed.skills||{}),
    metrics: { ...base.metrics, ...(parsed.metrics || {}) },
    activeDates: Array.isArray(parsed.activeDates) ? [...new Set(parsed.activeDates)] : [],
    titlesUnlocked: Array.isArray(parsed.titlesUnlocked) ? [...new Set(['Awakening', ...parsed.titlesUnlocked.filter(title=>TITLE_DEFS.includes(title))])] : ['Awakening'],
    rankStage: RANKS.some(r => r.stage === parsed.rankStage) ? parsed.rankStage : 'E',
    rankTrialsClaimed: Array.isArray(parsed.rankTrialsClaimed) ? parsed.rankTrialsClaimed : [],
    unlockedAchievements: Array.isArray(parsed.unlockedAchievements) ? [...new Set(parsed.unlockedAchievements.filter(id=>typeof id==='string'))] : [],
    activity: Array.isArray(parsed.activity) ? parsed.activity.map(a => ({ ...a, meta:a.meta || {} })) : [],
    quests: Array.isArray(parsed.quests) ? parsed.quests.map(q => migrateQuest(q,parsed)) : [],
    projects: Array.isArray(parsed.projects) ? parsed.projects.map(p => migrateProject(p,parsed)) : [],
    planner:PLANNER.migratePlanner(parsed.planner || {}),
    habits:HABIT_SYSTEM.migrateHabits(parsed.habits || [],()=>crypto.randomUUID(),localDateKey(new Date())),
    reminders: {
      enabled:Boolean(parsed.reminders?.enabled),
      sent:parsed.reminders?.sent && typeof parsed.reminders.sent==='object'
        ? Object.fromEntries(Object.entries(parsed.reminders.sent).filter(([key,value])=>typeof key==='string'&&key.length<220&&typeof value==='string').slice(-500))
        : {}
    },
    impactCredits: Array.isArray(parsed.impactCredits) ? parsed.impactCredits.map(c=>({...c, percent:Math.max(0,Math.min(.05,Number(c.percent||0)))})) : [],
    externalInbox: parsed.externalInbox && typeof parsed.externalInbox==='object' ? {
      token:String(parsed.externalInbox.token||''), publicKeyJwk:parsed.externalInbox.publicKeyJwk||null,
      privateKeyEnvelope:parsed.externalInbox.privateKeyEnvelope||null, enabled:Boolean(parsed.externalInbox.enabled),
      createdAt:parsed.externalInbox.createdAt||null
    } : base.externalInbox,
    social: parsed.social && typeof parsed.social==='object' ? {
      inviteTokens:Object.fromEntries(Object.entries(parsed.social.inviteTokens||{}).filter(([id,token])=>/^[0-9a-f-]{36}$/i.test(id)&&/^[A-Za-z0-9_-]{43,86}$/.test(String(token||'')))),
      activeCircleId:/^[0-9a-f-]{36}$/i.test(String(parsed.social.activeCircleId||''))?String(parsed.social.activeCircleId):'',
      friendInviteToken:/^[A-Za-z0-9_-]{43,86}$/.test(String(parsed.social.friendInviteToken||''))?String(parsed.social.friendInviteToken):'',
      friendInviteEnabled:parsed.social.friendInviteEnabled!==false,
      shareFriendProgress:parsed.social.shareFriendProgress!==false
    } : base.social,
    updatedAt: parsed.updatedAt || parsed.migratedAt || parsed.createdAt || new Date().toISOString()
  };

  if (isV1) {
    migrated.metrics.totalClears = migrated.quests.filter(q => q.status === 'completed').length;
    migrated.metrics.mainClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Main Quest').length;
    migrated.metrics.bossClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Boss Quest').length;
    migrated.metrics.campaignClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Campaign Quest').length;
    migrated.metrics.questsAccepted = migrated.quests.length;
    migrated.activeDates = [...new Set(migrated.activity.filter(a => a.xp > 0).map(a => localDateKey(new Date(a.at))))].sort();
    migrated.metrics.bestStreak = calculateBestStreak(migrated.activeDates);
    migrated.migratedAt = new Date().toISOString();
    if (migrated.totalXp === 0 && migrated.quests.length === 0) {
      migrated.unlockedAchievements = migrated.unlockedAchievements.filter(id => id !== 'first-quest');
      migrated.metrics.questsAccepted = 0;
    }
  }
  migrated.quests = dedupeAccidentalActiveQuests(migrated.quests);
  const today=localDateKey(new Date()),tomorrow=DAILY_CYCLE.addDays(today,1);
  for(const quest of [...migrated.quests]){
    if(quest.questType!=='Daily Quest'||quest.status!=='completed'||!quest.dailyHistory.includes(today)||DAILY_CYCLE.hasOccurrence(migrated.quests,quest,tomorrow))continue;
    migrated.quests.unshift(DAILY_CYCLE.createNextOccurrence(quest,today,{id:crypto.randomUUID(),createdAt:new Date().toISOString()}));
  }
  migrated.metrics.dailyClears = migrated.quests.filter(q=>q.questType==='Daily Quest').reduce((count,q)=>count+(q.dailyHistory||[]).length,0);
  migrated.metrics.totalClears = migrated.quests.filter(q => q.status === 'completed' && q.questType !== 'Daily Quest').length + migrated.metrics.dailyClears;
  migrated.metrics.mainClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Main Quest').length;
  migrated.metrics.campaignClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Campaign Quest').length;
  migrated.metrics.bossClears = migrated.quests.filter(q => q.status === 'completed' && q.questType === 'Boss Quest').length;
  migrated.metrics.questsAccepted = Math.max(migrated.metrics.questsAccepted || 0, migrated.quests.length);
  migrated.metrics.projectClears = migrated.projects.filter(p=>p.status==='completed').length;
  const eligibleIds=new Set(eligibleMilestones(migrated).map(item=>item.id));
  migrated.unlockedAchievements=migrated.unlockedAchievements.filter(id=>eligibleIds.has(id));
  if(!migrated.titlesUnlocked.includes(migrated.profile.equippedTitle))migrated.profile.equippedTitle='Awakening';
  return migrated;
}

function dedupeAccidentalActiveQuests(quests) {
  const kept = [];
  for (const q of quests) {
    const duplicate = kept.find(k => k.status === 'active' && q.status === 'active' && questSignature(k) === questSignature(q) && Math.abs(new Date(k.createdAt || 0) - new Date(q.createdAt || 0)) < 60000 && !subquestEarned(k) && !subquestEarned(q));
    if (!duplicate) kept.push(q);
  }
  return kept;
}

function migrateQuest(q, sourceState=state) {
  const allowedCategories=availableCategories(sourceState);
  const rewardInput = {
    title:q.title || '', category:allowedCategories.includes(canonicalArea(q.category))?canonicalArea(q.category):(allowedCategories[0]||'Personal'), secondaryCategory:q.secondaryCategory || '',
    questType:QUEST_TYPES.includes(q.questType) ? q.questType : 'Side Quest', priority:q.priority || 'Medium', difficulty:q.difficulty || 'D',
    estimatedMinutes:Number(q.estimatedMinutes || 60), longTermValue:Number(q.longTermValue || 2), impactScore:Number(q.impactScore || 2)
  };
  const reward = calculateQuestReward(rewardInput);
  const earnedBeforeSkillLedger = Number(q.completionXpAwarded||0)>0 || (q.subquests||[]).some(s=>Number(s?.xpAwarded||0)>0) || Object.values(q.dailyAwards||{}).some(value=>Number(value)>0);
  const stableSkillImpact = normalizeSkillImpact(q.skillImpact) || (earnedBeforeSkillLedger ? SKILL_SYSTEM.legacyImpactForQuest(q) : SKILL_SYSTEM.impactForQuest(q));
  const questType=QUEST_TYPES.includes(q.questType) ? q.questType : 'Side Quest';
  const dailyHistory=Array.isArray(q.dailyHistory) ? [...new Set(q.dailyHistory.filter(DAILY_CYCLE.isDateKey))] : [];
  const dailyCompleted=questType==='Daily Quest'&&(String(q.status)==='completed'||dailyHistory.includes(localDateKey(new Date())));
  return {
    ...rewardInput, ...q,
    projectId: q.projectId || '', projectRole:q.projectRole || '', projectRequired:q.projectRequired !== false,
    externalSourceId:/^[0-9a-f-]{36}$/i.test(String(q.externalSourceId||''))?String(q.externalSourceId):'',
    secondaryCategory: allowedCategories.includes(canonicalArea(q.secondaryCategory))&&canonicalArea(q.secondaryCategory)!==canonicalArea(q.category)?canonicalArea(q.secondaryCategory):'',
    longTermValue: Number(q.longTermValue || 2), impactScore:Number(q.impactScore || 2), xp:Number(q.xp || reward.xp),
    estimatedSessions:Number(q.estimatedSessions || Math.max(1,Math.ceil(Number(q.estimatedMinutes||60)/120))),
    mentalLoad:q.mentalLoad || (['A','S'].includes(q.difficulty) ? 'High' : q.difficulty === 'B' ? 'Medium' : 'Low'),
    flexibility:q.flexibility || (q.dueDate ? 'Semi-fixed' : 'Flexible'), successCriteria:q.successCriteria || '',
    dependencies:Array.isArray(q.dependencies) ? q.dependencies : [], suggestedEvidence:Array.isArray(q.suggestedEvidence) ? q.suggestedEvidence : [],
    skillTags:Array.isArray(q.skillTags) ? q.skillTags : [], intelligenceRationale:q.intelligenceRationale || '', intelligenceConfidence:q.intelligenceConfidence || null,
    skillImpact:stableSkillImpact,
    statImpact:normalizeStatImpact(q.statImpact,rewardInput.category,q.secondaryCategory,allowedCategories), antiFarm:q.antiFarm || { flag:false, reason:'' },
    subquests:Array.isArray(q.subquests) ? q.subquests.map((s,i) => typeof s === 'string' ? {id:crypto.randomUUID(),title:s,status:'active',completedAt:null,xpAwarded:0,order:i} : {id:s.id||crypto.randomUUID(),title:s.title||`Step ${i+1}`,status:s.status||'active',completedAt:s.completedAt||null,xpAwarded:Number(s.xpAwarded||0),order:i}) : [],
    status:(q.status==='completed'||dailyCompleted)?'completed':'active', completedAt:q.completedAt||(dailyCompleted?q.lastCompletedAt||new Date().toISOString():null), startedAt:q.startedAt||null,
    completionXpAwarded:Number(q.completionXpAwarded || ((q.status === 'completed'||dailyCompleted) ? q.xp || 0 : 0)), dailyHistory, dailyAwards:q.dailyAwards || {},
    dailySeriesId:questType==='Daily Quest'?String(q.dailySeriesId||q.id||''):'', dailyScheduledFor:questType==='Daily Quest'?(DAILY_CYCLE.isDateKey(q.dailyScheduledFor)?q.dailyScheduledFor:(dailyCompleted?(dailyHistory.at(-1)||''):(DAILY_CYCLE.isDateKey(q.dueDate)?q.dueDate:''))):'',
    dailyPreviousId:questType==='Daily Quest'?String(q.dailyPreviousId||''):'', dailyGenerated:questType==='Daily Quest'&&Boolean(q.dailyGenerated),
    dailyMissedCount:questType==='Daily Quest'?Math.max(0,Number(q.dailyMissedCount)||0):0,
    dailyLastMissedFrom:questType==='Daily Quest'&&DAILY_CYCLE.isDateKey(q.dailyLastMissedFrom)?q.dailyLastMissedFrom:'',
    dailyLastRolledAt:questType==='Daily Quest'?String(q.dailyLastRolledAt||''):''
  };
}

function saveState(options = {}) {
  state.systemVersion = SYSTEM_VERSION;
  if (!options.preserveUpdatedAt) state.updatedAt = new Date().toISOString();
  // Resolve the namespace again on every write. A stale mutable key must never
  // redirect Guest or Account A state into Account B or the generic device cache.
  activeStorageKey = currentStateStorageKey();
  localStorage.setItem(activeStorageKey, JSON.stringify(state));
  if (guestMode) return;
  if (cloudUser && !cloudApplyingRemote && !vaultRecoveryRequired && !options.skipCloud) scheduleCloudPush();
}


function markActiveDay() {
  const today = localDateKey(new Date());
  if (state.activeDates.includes(today)) return;
  const last = state.activeDates.length ? [...state.activeDates].sort().at(-1) : null;
  if (last) {
    const diff = dayDiff(last, today);
    if (diff === 1) state.streak = Math.max(1, state.streak) + 1;
    else if (diff > 1) { if (diff >= 7) state.metrics.returnCount += 1; state.streak = 1; }
  } else state.streak = 1;
  state.activeDates.push(today); state.activeDates = [...new Set(state.activeDates)].sort(); state.lastActiveDate = today;
  state.metrics.bestStreak = Math.max(state.metrics.bestStreak || 0, state.streak);
}

function refreshStreak() {
  const sorted = [...new Set(state.activeDates || [])].sort();
  if (!sorted.length) { state.streak = 0; state.lastActiveDate = null; return; }
  const last = sorted.at(-1); const today = localDateKey(new Date()); const diff = dayDiff(last,today);
  state.lastActiveDate = last;
  if (diff > 1) state.streak = 0;
  else state.streak = calculateCurrentStreak(sorted);
  state.metrics.bestStreak = Math.max(state.metrics.bestStreak || 0, calculateBestStreak(sorted));
}

function calculateCurrentStreak(dates) {
  if (!dates.length) return 0;
  let streak = 1;
  for (let i = dates.length-1; i > 0; i--) { if (dayDiff(dates[i-1],dates[i]) === 1) streak++; else break; }
  return streak;
}
function calculateBestStreak(dates) {
  if (!dates.length) return 0; let best=1,current=1;
  for (let i=1;i<dates.length;i++) { if (dayDiff(dates[i-1],dates[i])===1) current++; else current=1; best=Math.max(best,current); }
  return best;
}

function addActivity(type, label, xp = 0, category = 'System', meta = {}) {
  state.activity.unshift({ id:crypto.randomUUID(), type, label, xp, category, meta, at:new Date().toISOString() });
  state.activity = state.activity.slice(0, 1200);
}

function xpLevelInfo(totalXp) {
  let level=1, remaining=Math.max(0,totalXp);
  while (remaining >= xpNeeded(level)) { remaining -= xpNeeded(level); level++; if(level>999) break; }
  return { level, progress:remaining, needed:xpNeeded(level) };
}
function xpNeeded(level) { return Math.round(160 * Math.pow(level, 1.22)); }
function overallLevel(totalXp) { return xpLevelInfo(totalXp).level; }
function statLevelInfo(xp) {
  let level=1, remaining=Math.max(0,xp);
  while (remaining >= statXpNeeded(level)) { remaining -= statXpNeeded(level); level++; if(level>999) break; }
  return { level, progress:remaining, needed:statXpNeeded(level) };
}
function statXpNeeded(level) { return Math.round(110 * Math.pow(level,1.16)); }
function statLevel(xp) { return statLevelInfo(xp).level; }

function rankIndex(stage) { const i=RANKS.findIndex(r=>r.stage===stage); return i<0?0:i; }
function rankConfig(stage) { return RANKS[rankIndex(stage)]; }
function rankDisplay(stage) { return stage.startsWith('S') ? `${stage} // S-RANK` : `${stage}-RANK`; }
function rankColor(stage) {
  if (stage.startsWith('S')) return '#ffc96b';
  return ({E:'#86a5b4',D:'#70f0b1',C:'#58e8ff',B:'#77a8ff',A:'#9d83ff'})[stage] || '#58e8ff';
}

function prioritizedActiveQuests() { return activeForToday().sort((a,b)=>questScore(b)-questScore(a)); }
function questScore(q) {
  const priority={Low:1,Medium:2,High:4,Critical:7}[q.priority]||2;
  const diff={E:1,D:2,C:3,B:5,A:7,S:10}[q.difficulty]||2;
  const type={'Daily Quest':1,'Side Quest':2,'Main Quest':5,'Campaign Quest':6.5,'Boss Quest':8}[q.questType]||2;
  let due=0;
  if(q.dueDate){ const days=dayDiff(localDateKey(new Date()),q.dueDate); due=days<0?12:days===0?10:days===1?7:days<=3?4:1; }
  return priority*3 + diff + type + due + Number(q.longTermValue||2)*1.5 + Number(q.impactScore||2)*1.5 + Math.min(8,q.xp/300);
}
function isOverdue(q) { return q.dueDate && parseLocalDate(q.dueDate) < parseLocalDate(localDateKey(new Date())) && q.status !== 'completed'; }

function queueSystemFlash(title, text, detail = '', sigil = '◇', eyebrow = 'SYSTEM NOTIFICATION') {
  flashQueue.push({title,text,detail,sigil,eyebrow}); processFlashQueue();
}
function processFlashQueue() {
  if (flashBusy || !flashQueue.length) return;
  flashBusy = true; const item = flashQueue.shift();
  el('systemFlashTitle').textContent = item.title; el('systemFlashText').textContent = item.text; el('systemFlashDetail').textContent = item.detail;
  el('systemFlashSigil').textContent = item.sigil; el('systemFlashEyebrow').textContent = item.eyebrow;
  el('systemFlash').classList.add('show');
  setTimeout(() => { el('systemFlash').classList.remove('show'); setTimeout(() => { flashBusy=false; processFlashQueue(); }, 300); }, 1650);
}

function friendlyDate(dateString) { try{return parseLocalDate(dateString).toLocaleDateString(undefined,{month:'short',day:'numeric'});}catch{return dateString;} }
function formatEffort(minutes) {
  minutes = Math.round(Number(minutes)||0);
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  if (hours < 10) { const h=Math.floor(hours), m=minutes%60; return m ? `${h}h ${m}m` : `${h}h`; }
  return `${Math.round(hours)}h total`;
}
function friendlyDateTime(iso) { const d=new Date(iso); return `${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})} • ${d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'})}`; }
function formatMinutes(minutes) { minutes=Math.round(minutes); if(minutes<60)return `${minutes}m`; const h=Math.floor(minutes/60),m=minutes%60; if(h<24)return m?`${h}h ${m}m`:`${h}h`; const d=Math.floor(h/24),rh=h%24; return rh?`${d}d ${rh}h`:`${d}d`; }
function formatRequirement(n) { return Number(n).toLocaleString(); }
function localDateKey(d) { const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; }
function parseLocalDate(str) { const [y,m,d]=String(str).split('-').map(Number); return new Date(y,m-1,d); }
function dayDiff(from,to) { return Math.round((parseLocalDate(to)-parseLocalDate(from))/86400000); }
function clamp(n,min,max) { return Math.min(max,Math.max(min,Number(n)||0)); }
function slug(v='') { return String(v).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,''); }
function escapeHtml(value='') { return String(value).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

let toastTimer;
function toast(message) { const node=el('toast'); node.textContent=message; node.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>node.classList.remove('show'),2600); }

function registerPwa() {
  if('serviceWorker' in navigator) navigator.serviceWorker.register(`/sw.js?v=${encodeURIComponent(SYSTEM_VERSION)}`,{updateViaCache:'none'}).then(registration=>registration.update()).catch(()=>{});
  if(isAppleMobile()&&!isStandaloneApp())el('installButton').hidden=false;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;el('installButton').hidden=false;renderInstallState();});
  window.addEventListener('appinstalled',()=>{installPrompt=null;el('installButton').hidden=true;renderInstallState();toast('ASCEND installed.');});
  renderInstallState();
}
function isStandaloneApp(){return window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;}
function isAppleMobile(){return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);}
function renderInstallState(){
  if(!el('installStateBadge'))return;
  const installed=isStandaloneApp();
  el('installStateBadge').textContent=installed?'INSTALLED':isAppleMobile()?'SAFARI STEPS':installPrompt?'INSTALL READY':'WEB APP';
  el('installFromSettingsButton').textContent=installed?'ASCEND Is Installed':isAppleMobile()?'Show Apple Install Steps':installPrompt?'Install ASCEND':'Show Install Instructions';
  el('installFromSettingsButton').disabled=installed;
}
async function installApp() {
  if(isStandaloneApp())return toast('ASCEND is already running as an installed app.');
  if(!installPrompt){switchView('settings');setTimeout(()=>el('installGuideCard').scrollIntoView({behavior:'smooth',block:'center'}),80);return toast(isAppleMobile()?'In Safari: Share → Add to Home Screen → Open as Web App → Add.':'Use your browser menu and choose Install app or Add to Home Screen.');}
  installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; el('installButton').hidden=true;
  renderInstallState();
}


// ============================================================================
// ASCEND v0.5.3.1 // IDENTITY + PROJECT ARCHITECT
// ============================================================================
let entryMode = 'signin';
let onboardingStep = 1;
let onboardingRecalibration = false;
let pendingProjectPlan = null;
let editingProjectId = null;
let projectDraftSubquests = new Map();

function migrateProject(p={},sourceState=state) {
  const id = p.id || crypto.randomUUID();
  const allowedCategories=availableCategories(sourceState);
  return {
    id, title:String(p.title||'Untitled Project').slice(0,120), category:allowedCategories.includes(canonicalArea(p.category))?canonicalArea(p.category):(allowedCategories[0]||'Personal'),
    difficulty:['C','B','A','S'].includes(p.difficulty)?p.difficulty:'B', outcome:String(p.outcome||'').slice(0,220),
    dueDate:/^20\d\d-\d\d-\d\d$/.test(String(p.dueDate||''))?p.dueDate:null, impact:Math.max(1,Math.min(5,Number(p.impact||3))),
    finalQuestTitle:String(p.finalQuestTitle||'Final validation and delivery').slice(0,140),
    questIds:Array.isArray(p.questIds)?[...new Set(p.questIds.map(String))]:[], status:p.status==='completed'?'completed':'active',
    completionXpAwarded:Number(p.completionXpAwarded||0), createdAt:p.createdAt||new Date().toISOString(), completedAt:p.completedAt||null
  };
}

function totalImpactCreditPercent() {
  return Math.min(.05, (state.impactCredits||[]).reduce((s,c)=>s+Math.max(0,Number(c.percent||0)),0));
}
function effectiveRankMinDays(rank) {
  const days=Number(rank?.minDays||0);
  if (!String(rank?.stage||'').startsWith('S-')) return days;
  return Math.ceil(days*(1-totalImpactCreditPercent()));
}
function renderImpactCredit() {
  if(el('aiPrivacyMode')) el('aiPrivacyMode').value=state.profile?.aiPrivacyMode||'ai';
  if (!el('impactCreditBadge')) return;
  const pct=totalImpactCreditPercent();
  el('impactCreditBadge').textContent=`${(pct*100).toFixed(2)}%`;
  el('impactCreditBar').style.width=`${Math.min(100,pct/.05*100)}%`;
  const saved=Math.round((RANKS.find(r=>r.stage==='S-V')?.minDays||3000)*pct);
  el('impactCreditText').textContent=pct ? `${(pct*100).toFixed(2)}% verified credit • up to ${saved} S-Rank gate days offset at S-V. The 5% lifetime cap cannot be exceeded.` : 'No exceptional impact credit recorded. Ordinary work intentionally receives zero.';
}

function assessExceptionalImpact(project) {
  if (!project || project.status!=='completed') return {eligible:false, percent:0, reason:'Project is not completed.'};
  const quests=state.quests.filter(q=>q.projectId===project.id);
  const completed=quests.filter(q=>q.status==='completed');
  const workMinutes=completed.reduce((s,q)=>s+Number(q.estimatedMinutes||0),0);
  const sDiff=completed.filter(q=>['A','S'].includes(q.difficulty)).length;
  const evidenceSignals=completed.filter(q=>(q.suggestedEvidence||[]).length || /publish|deploy|validated|research|award|users|production|prototype|اختبار|توثيق/i.test(`${q.title} ${q.successCriteria||''}`)).length;
  let score=0;
  if (project.difficulty==='S') score+=3; else if(project.difficulty==='A') score+=1;
  if (project.impact>=5) score+=3; else if(project.impact>=4) score+=1;
  if (workMinutes>=12000) score+=3; else if(workMinutes>=6000) score+=2; else if(workMinutes>=2400) score+=1;
  if (completed.length>=12) score+=2; else if(completed.length>=7) score+=1;
  if (sDiff>=4) score+=1;
  if (evidenceSignals>=4) score+=1;
  if (score<9) return {eligible:false,percent:0,reason:`Impact audit score ${score}/13. Exceptional threshold is 9; no S-Rank time credit awarded.`};
  const percent=score>=13?.01:score>=11?.0075:.005;
  return {eligible:true,percent,reason:`Exceptional impact audit ${score}/13. Award: ${(percent*100).toFixed(2)}% S-Rank time credit.`};
}
function maybeAwardImpactCredit(project) {
  if ((state.impactCredits||[]).some(c=>c.projectId===project.id)) return;
  const result=assessExceptionalImpact(project);
  addActivity('impact-audit', result.reason, 0, project.category, {projectId:project.id,score:result.score||0});
  if (!result.eligible || totalImpactCreditPercent()>=.05) return;
  const remaining=.05-totalImpactCreditPercent();
  const grant=Math.min(result.percent,remaining);
  state.impactCredits.push({id:crypto.randomUUID(),projectId:project.id,percent:grant,reason:result.reason,awardedAt:new Date().toISOString()});
  queueSystemFlash('EXCEPTIONAL IMPACT', `+${(grant*100).toFixed(2)}% S-Rank Credit`, 'Rare impact credit awarded after a strict completed-project audit. Lifetime cap: 5%.', '◆', 'IMPACT PROTOCOL');
}

function updateGuestEntryControls(){
  const hasGuest=Boolean(localStorage.getItem(GUEST_STATE_KEY));
  if(el('entryGuestButtonTitle'))el('entryGuestButtonTitle').textContent=hasGuest?'Continue Guest Profile':'Continue as Guest';
  if(el('entryGuestButtonDetail'))el('entryGuestButtonDetail').textContent=hasGuest?'Resume device-only Guest progress • no cloud sync':'No email • saved on this device • no cloud sync';
  if(el('entryNewGuestButton'))el('entryNewGuestButton').hidden=!hasGuest;
}
async function updateEntryExperience() {
  const gate=el('entryGate'); if(!gate) return;
  updateGuestEntryControls();
  const recovery=parseRecoveryHash();
  if (recovery) { gate.hidden=true; el('vaultUnlockGate').hidden=true; el('onboardingGate').hidden=true; el('passwordRecoveryGate').hidden=false; return; }
  el('passwordRecoveryGate').hidden=true;
  el('vaultUnlockGate').hidden=true;

  if (guestMode) {
    gate.hidden=true;
    document.body.classList.add('guest-session');
    if (!state.profile?.onboardingComplete) openOnboarding();
    else el('onboardingGate').hidden=true;
    return;
  }

  document.body.classList.remove('guest-session');
  if (!cloudConfig.enabled) { gate.hidden=false; setEntryStatus('Cloud is not configured. You can still continue as a guest.', false); return; }
  if (!cloudUser) { gate.hidden=false; el('onboardingGate').hidden=true; if(cloudConfig.turnstileEnabled)await initTurnstileSlot('entry'); return; }
  if (vaultRecoveryRequired) { showVaultUnlockGate(); return; }
  gate.hidden=true;
  if (!state.profile?.onboardingComplete) openOnboarding();
  else el('onboardingGate').hidden=true;
}
function setEntryStatus(text,error=false){if(!el('entryStatus'))return;el('entryStatus').textContent=text;el('entryStatus').classList.toggle('error',error)}
function setEntryMode(mode){entryMode=mode;hideEmailConfirmationState();if(cloudConfig.turnstileEnabled)void initTurnstileSlot('entry');el('entrySignInTab').classList.toggle('active',mode==='signin');el('entryCreateTab').classList.toggle('active',mode==='create');el('entryPrimaryButton').textContent=mode==='signin'?'Enter ASCEND':'Create My System';el('entryForgotButton').hidden=mode!=='signin';el('entryRememberLabel').hidden=mode!=='signin';el('entryPassword').autocomplete=mode==='signin'?'current-password':'new-password';}
function bindIdentityExperience(){
  if(!el('entryGate'))return;
  el('entrySignInTab').onclick=()=>{clearEntryFieldErrors();setEntryMode('signin');}; el('entryCreateTab').onclick=()=>{clearEntryFieldErrors();setEntryMode('create');};
  const submitEntry=async()=>{
    const credentials=validateEntryCredentials(entryMode);
    if(!credentials.ok)return;
    el('cloudEmail').value=credentials.email;
    el('cloudPassword').value=credentials.password;
    setEntryActionBusy(true,entryMode==='signin'?'Authenticating…':'Creating…');
    setEntryStatus(entryMode==='signin'?'Authenticating securely…':'Creating encrypted player account…');
    try{
      const result=entryMode==='signin'?await cloudSignIn('entry'):await cloudSignUp('entry');
      if(!result?.ok){setEntryStatus(result?.error||'Authentication failed.',true);return;}
      if(result.pendingVerification)return;
      if(cloudUser)setEntryStatus('Account linked. Loading private player state…');
    } finally { setEntryActionBusy(false); }
  };
  el('entryPrimaryButton').onclick=submitEntry;
  el('entryEmail').addEventListener('input',()=>setFieldError('entryEmail','entryEmailError',''));
  el('entryPassword').addEventListener('input',()=>setFieldError('entryPassword','entryPasswordError',''));
  for(const input of [el('entryEmail'),el('entryPassword')])input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void submitEntry();}});
  el('entryForgotButton').onclick=()=>{const email=el('entryEmail').value.trim();clearEntryFieldErrors();if(!email){setFieldError('entryEmail','entryEmailError','Enter your email address first.');return setEntryStatus('Enter your email address first.',true);}if(!validEmailAddress(email)){setFieldError('entryEmail','entryEmailError','Enter a valid email address.');return setEntryStatus('Enter a valid email address.',true);}requestPasswordReset(email,'entry');};
  if(el('entryResendButton')) el('entryResendButton').onclick=()=>resendSignupConfirmation('entry');
  if(el('entryBackToSignInButton')) el('entryBackToSignInButton').onclick=()=>{setEntryMode('signin');setEntryStatus('Email verified? Sign in to continue.');};
  if(el('entryGuestButton')) el('entryGuestButton').onclick=()=>enterGuestMode({fresh:false});
  if(el('entryNewGuestButton')) el('entryNewGuestButton').onclick=startFreshGuestMode;
  if(el('forgotPasswordSettingsButton')) el('forgotPasswordSettingsButton').onclick=()=>requestPasswordReset(cloudUser?.email||el('cloudEmail').value.trim(),'settings');
  if(el('exportPrivateBackupButton')) el('exportPrivateBackupButton').onclick=exportBackup;
  if(el('deleteAccountForm'))el('deleteAccountForm').onsubmit=permanentlyDeleteCloudAccount;
  if(el('deleteAccountCloseButton'))el('deleteAccountCloseButton').onclick=closeDeleteAccountDialog;
  if(el('deleteAccountCancelButton'))el('deleteAccountCancelButton').onclick=closeDeleteAccountDialog;
  if(el('deleteAccountPassword'))el('deleteAccountPassword').oninput=()=>setFieldError('deleteAccountPassword','deleteAccountPasswordError','');
  if(el('deleteAccountAcknowledge'))el('deleteAccountAcknowledge').onchange=()=>setFieldError('deleteAccountAcknowledge','deleteAccountAcknowledgeError','');
  if(el('aiPrivacyMode')){el('aiPrivacyMode').value=state.profile.aiPrivacyMode||'ai';el('aiPrivacyMode').onchange=()=>{state.profile.aiPrivacyMode=el('aiPrivacyMode').value==='local'?'local':'ai';saveState();toast(state.profile.aiPrivacyMode==='local'?'Private Local AI mode enabled. Submitted quest text will not be sent to Gemini.':'Semantic AI mode enabled. Analyzed objective text may be sent to Gemini.');};}
  document.querySelectorAll('[data-focus]').forEach(b=>b.onclick=()=>{b.classList.toggle('selected');updateFocusSelectionCount();});
  if(el('addCustomFocusButton')) el('addCustomFocusButton').onclick=addCustomFocusArea;
  if(el('clearFocusSelectionButton')) el('clearFocusSelectionButton').onclick=clearFocusSelection;
  if(el('customFocusInput')) el('customFocusInput').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addCustomFocusArea();}};
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-mode]').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
  el('onboardingNextButton').onclick=()=>moveOnboarding(1);el('onboardingBackButton').onclick=()=>{if(onboardingRecalibration&&onboardingStep===1){onboardingRecalibration=false;el('onboardingGate').hidden=true;return;}moveOnboarding(-1);};
  el('recoverySaveButton').onclick=saveRecoveredPassword;
}
function addCustomFocusArea(){
  const input=el('customFocusInput'); const value=(input?.value||'').trim();
  if(!value) return toast('Type an area first.');
  const existing=[...document.querySelectorAll('[data-focus]')].find(b=>b.dataset.focus.toLowerCase()===value.toLowerCase());
  if(existing){existing.classList.add('selected');input.value='';updateFocusSelectionCount();return;}
  const button=document.createElement('button');button.type='button';button.dataset.focus=value;button.dataset.customFocus='1';button.textContent=`＋ ${value}`;button.classList.add('selected');button.onclick=()=>{button.classList.toggle('selected');updateFocusSelectionCount();};el('onboardingFocusGrid').appendChild(button);input.value='';updateFocusSelectionCount();
}
function updateFocusSelectionCount(){const count=document.querySelectorAll('[data-focus].selected').length;if(el('focusSelectionCount'))el('focusSelectionCount').textContent=`${count} selected`;}
function clearFocusSelection(){document.querySelectorAll('[data-focus].selected').forEach(b=>b.classList.remove('selected'));updateFocusSelectionCount();}
function prepareOnboardingChoices({preserveCurrent=false}={}){
  document.querySelectorAll('[data-focus]').forEach(b=>b.classList.remove('selected'));
  document.querySelectorAll('[data-custom-focus="1"]').forEach(b=>b.remove());
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('selected'));
  if(el('customFocusInput'))el('customFocusInput').value='';
  if(preserveCurrent){for(const area of selectedFocusAreas()){let button=[...document.querySelectorAll('[data-focus]')].find(b=>b.dataset.focus===area);if(!button){button=document.createElement('button');button.type='button';button.dataset.focus=area;button.dataset.customFocus='1';button.textContent=`＋ ${area}`;button.onclick=()=>{button.classList.toggle('selected');updateFocusSelectionCount();};el('onboardingFocusGrid').appendChild(button);}button.classList.add('selected');}const mode=[...document.querySelectorAll('[data-mode]')].find(b=>b.dataset.mode===(state.profile.operatingMode||'Balance'));(mode||document.querySelector('[data-mode="Balance"]'))?.classList.add('selected');}
  updateFocusSelectionCount();
}
function enterGuestMode({fresh=false}={}){
  persistCloudSession(null);
  cloudUser = null;
  vaultKeyCache = null;
  vaultRecoveryRequired = false;
  vaultUnlockHydrationRequired = false;
  cloudStatus = cloudConfig.enabled ? 'ready' : 'local';

  guestMode = true;
  localStorage.setItem(GUEST_ACTIVE_KEY, '1');
  activeStorageKey = GUEST_STATE_KEY;

  if(fresh)localStorage.removeItem(GUEST_STATE_KEY);
  const existingGuest = localStorage.getItem(GUEST_STATE_KEY);
  if (existingGuest) {
    try { state = migrateState(JSON.parse(existingGuest)); }
    catch { state = defaultState(); }
  } else {
    state = defaultState();
    state.profile.identity = 'Guest profile saved on this device';
    saveState({ skipCloud:true });
  }

  document.body.classList.add('guest-session');
  renderAll();
  el('entryGate').hidden = true;

  if (!state.profile?.onboardingComplete) openOnboarding();
  else {
    el('onboardingGate').hidden = true;
    toast(fresh?'Fresh Guest profile started.':'Guest profile resumed from this device.');
  }
}

function startFreshGuestMode(){
  if(localStorage.getItem(GUEST_STATE_KEY)&&!confirm('Start a fresh Guest profile? This permanently replaces the Guest progress currently saved on this device.'))return;
  localStorage.removeItem(GUEST_STATE_KEY);
  localStorage.removeItem(GUEST_ACTIVE_KEY);
  state=defaultState();
  prepareOnboardingChoices();
  enterGuestMode({fresh:true});
}

async function exitGuestMode(){
  guestMode = false;
  localStorage.removeItem(GUEST_ACTIVE_KEY);
  document.body.classList.remove('guest-session');
  activeStorageKey = STORAGE_KEY;
  state = defaultState();
  refreshStreak();
  unlockAchievements(false);
  renderAll();
  await updateEntryExperience();
  toast('Logged out. Guest progress is still saved on this device.');
}

function setDeleteAccountStatus(text,error=false){const node=el('deleteAccountStatus');if(!node)return;node.textContent=text;node.classList.toggle('error',error);}
function closeDeleteAccountDialog(){const dialog=el('deleteAccountDialog');if(dialog)dialog.hidden=true;if(el('deleteAccountPassword'))el('deleteAccountPassword').value='';if(el('deleteAccountAcknowledge'))el('deleteAccountAcknowledge').checked=false;setFieldError('deleteAccountPassword','deleteAccountPasswordError','');setFieldError('deleteAccountAcknowledge','deleteAccountAcknowledgeError','');resetTurnstile('deleteAccount');}
async function openDeleteAccountDialog(){
  closeMobileSystemSheet();
  if(guestMode)return deleteGuestProfile();
  if(!cloudUser?.id)return toast('Sign in before deleting an account.');
  const dialog=el('deleteAccountDialog');
  if(!dialog)return;
  el('deleteAccountEmail').textContent=cloudUser.email||'Signed-in account';
  el('deleteAccountConfirmButton').disabled=!cloudConfig.accountDeletionEnabled;
  setDeleteAccountStatus(cloudConfig.accountDeletionEnabled?'Enter your current password, acknowledge permanent deletion, and complete the fresh security check.':'Permanent deletion is not configured on this server yet. Add the server-only Supabase admin key to the backend environment first.',!cloudConfig.accountDeletionEnabled);
  dialog.hidden=false;
  if(cloudConfig.turnstileEnabled)await initTurnstileSlot('deleteAccount');
  setTimeout(()=>el('deleteAccountPassword')?.focus(),50);
}
async function permanentlyDeleteCloudAccount(event){
  event?.preventDefault?.();
  if(!cloudUser?.id)return closeDeleteAccountDialog();
  if(!cloudConfig.accountDeletionEnabled)return setDeleteAccountStatus('Server-side account deletion is not configured yet.',true);
  const userId=cloudUser.id;
  const email=String(cloudUser.email||'').trim();
  const password=el('deleteAccountPassword').value;
  const acknowledged=Boolean(el('deleteAccountAcknowledge')?.checked);
  setFieldError('deleteAccountPassword','deleteAccountPasswordError','');setFieldError('deleteAccountAcknowledge','deleteAccountAcknowledgeError','');
  let valid=true;
  if(!password){setFieldError('deleteAccountPassword','deleteAccountPasswordError','Enter your current password.');valid=false;}
  if(!acknowledged){setFieldError('deleteAccountAcknowledge','deleteAccountAcknowledgeError','Confirm that you understand this deletion cannot be undone.');valid=false;}
  if(!valid)return setDeleteAccountStatus('Complete the password and deletion acknowledgement before continuing.',true);
  const button=el('deleteAccountConfirmButton');button.disabled=true;button.textContent='Verifying…';
  try{
    setDeleteAccountStatus('Reauthenticating your identity…');
    const security=await requireCaptchaSecurity('deleteAccount');
    const reauth=await fetch(`${cloudConfig.url}/auth/v1/token?grant_type=password`,{method:'POST',headers:cloudBaseHeaders(false),body:JSON.stringify({email,password,...security})});
    const fresh=await reauth.json().catch(()=>({}));
    if(!reauth.ok){const reauthMessage=authErrorMessage(fresh,'Password verification failed.','signin');throw new Error(reauthMessage==='Incorrect email or password.'?'Current password is incorrect.':reauthMessage);}
    if(!fresh?.access_token||fresh?.user?.id!==userId)throw new Error('Fresh identity verification failed. Sign in again and retry.');
    if(!confirm('Final confirmation: permanently delete this ASCEND account and all synced player-state? This cannot be undone.')){setDeleteAccountStatus('Deletion cancelled. Your account was not changed.');return;}
    setDeleteAccountStatus('Identity verified. Permanently deleting the account…');
    const response=await fetch('/api/account/delete',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${fresh.access_token}`},body:JSON.stringify({confirm:'DELETE',email})});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(payload?.error||'Account deletion failed.');

    clearTimeout(cloudSaveTimer);
    await markDeletedAccount(email);
    localStorage.removeItem(userStorageKey(userId));
    localStorage.removeItem(vaultKeyStorageKey(userId));
    localStorage.removeItem(recoverySavedStorageKey(userId));
    if(localStorage.getItem(CLOUD_BOUND_USER_KEY)===userId){localStorage.removeItem(CLOUD_BOUND_USER_KEY);localStorage.removeItem(STORAGE_KEY);}
    persistCloudSession(null);
    vaultKeyCache=null;vaultRecoveryRequired=false;vaultUnlockHydrationRequired=false;cloudLastSyncAt=null;cloudStatus=cloudConfig.enabled?'ready':'local';guestMode=false;document.body.classList.remove('guest-session');activeStorageKey=STORAGE_KEY;state=defaultState();
    el('deleteAccountDialog').hidden=true;
    renderAll();
    await updateEntryExperience();
    setEntryMode('signin');
    setEntryStatus('Account permanently deleted. You can now create a fresh account with that email.');
    toast('Account permanently deleted.');
  }catch(error){
    const message=error.message||'Account deletion failed.';
    setDeleteAccountStatus(message,true);
    toast(message);
  }finally{
    resetTurnstile('deleteAccount');
    button.disabled=!cloudConfig.accountDeletionEnabled;button.textContent='Permanently Delete Account';
  }
}

async function deleteGuestProfile(){closeMobileSystemSheet();if(!guestMode)return toast('Delete Guest Profile is available only while using Guest.');if(!confirm('Delete this Guest profile permanently? All Guest quests, XP, projects, milestones, and settings saved on this device will be erased. This cannot be undone.'))return;localStorage.removeItem(GUEST_STATE_KEY);localStorage.removeItem(GUEST_ACTIVE_KEY);guestMode=false;document.body.classList.remove('guest-session');activeStorageKey=STORAGE_KEY;state=defaultState();renderAll();await updateEntryExperience();updateGuestEntryControls();toast('Guest profile deleted from this device.');}
async function quickLogout(){closeMobileSystemSheet();if(!confirm('Log out of ASCEND? Your saved data will remain available for the next sign in.'))return;if(guestMode)return exitGuestMode();if(cloudUser)return cloudSignOut();await updateEntryExperience();}

function habitState(){
  state.habits=HABIT_SYSTEM.migrateHabits(state.habits||[],()=>crypto.randomUUID(),localDateKey(new Date()));
  return state.habits;
}

function reminderState(){
  state.reminders||={enabled:false,sent:{}};
  state.reminders.sent||={};
  return state.reminders;
}

function updateReminderButton(){
  const buttons=[el('enableRemindersButton'),el('enableNotificationsSettingsButton')].filter(Boolean);
  const permission=typeof Notification==='undefined'?'unsupported':Notification.permission;
  buttons.forEach(button=>{button.textContent=permission==='granted'&&reminderState().enabled?'Notifications On':permission==='denied'?'Notifications Blocked':'Enable Notifications';button.disabled=permission==='unsupported';});
  if(el('notificationPermissionStatus'))el('notificationPermissionStatus').textContent=permission==='granted'&&reminderState().enabled?'ON':permission==='denied'?'BLOCKED':'OFF';
}

async function enableReminders(){
  if(typeof Notification==='undefined')return toast('This browser does not support notifications.');
  const permission=await Notification.requestPermission();
  reminderState().enabled=permission==='granted';
  saveState();updateReminderButton();
  toast(permission==='granted'?'Reminders enabled. Install ASCEND as a PWA for the best delivery.':'Notification permission was not granted.');
  if(permission==='granted')void checkReminderNotifications();
}

function launchUrl(view,id='',projectId=''){
  const url=new URL(location.origin+location.pathname);url.searchParams.set('view',view);
  if(id)url.searchParams.set('item',id);if(projectId)url.searchParams.set('project',projectId);return url.href;
}
function applyLaunchTarget(){
  const params=new URLSearchParams(location.search),view=params.get('view'),item=params.get('item'),projectId=params.get('project');
  if(!view)return;switchView(view);
  if(view==='quests'&&projectId&&el('questScopeFilter')){el('questScopeFilter').value='project';renderQuestBoard();}
  const target=view==='projects'&&item
    ? document.getElementById(`project-quest-${item}`)||document.getElementById(`project-${projectId}`)
    : document.getElementById(view==='projects'&&projectId?`project-${projectId}`:item?`quest-${item}`:'');
  setTimeout(()=>target?.scrollIntoView({behavior:'smooth',block:'center'}),120);
  history.replaceState({},document.title,location.pathname);
}
async function deliverAscendNotification(title,body,tag,targetUrl=location.href){
  const options={body,tag,renotify:false,icon:'/icons/icon-192.png',badge:'/icons/icon-192.png',data:{url:targetUrl}};
  try{
    const registration=await navigator.serviceWorker?.ready;
    if(registration?.showNotification)return registration.showNotification(title,options);
    new Notification(title,options);
  }catch(error){console.warn('ASCEND reminder delivery failed:',error);}
}

async function checkReminderNotifications(){
  if(typeof Notification==='undefined'||Notification.permission!=='granted'||!reminderState().enabled)return;
  const now=new Date(),today=localDateKey(now),currentMinutes=now.getHours()*60+now.getMinutes(),sent=reminderState().sent;
  let changed=false;
  const dueQuests=state.quests.filter(q=>q.status==='active'&&q.dueDate&&q.dueDate<=today&&q.questType!=='Daily Quest');
  const questKey=`quest-summary:${today}`;
  if(currentMinutes>=540&&dueQuests.length&&!sent[questKey]){
    await deliverAscendNotification('ASCEND // Quest reminder',`${dueQuests.length} active quest${dueQuests.length===1?'':'s'} due today or overdue.`,questKey);
    sent[questKey]=new Date().toISOString();
    changed=true;
  }
  for(const quest of state.quests){
    if(quest.status!=='active'||!quest.reminderAt)continue;
    const due=new Date(quest.reminderAt),key=`quest:${quest.id}:${quest.reminderAt}`;
    if(Number.isFinite(due.getTime())&&now>=due&&now.getTime()-due.getTime()<=5*60000&&!sent[key]){await deliverAscendNotification(`ASCEND // ${quest.title}`,'Your Quest reminder is ready.',key,launchUrl(quest.projectId?'projects':'quests',quest.id,quest.projectId||''));sent[key]=new Date().toISOString();changed=true;}
  }
  const currentDay=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()];
  for(const item of activeSemester()?.commitments||[]){
    if(!item.reminderEnabled||item.day!==currentDay)continue;
    const [hours,minutes]=String(item.start||'').split(':').map(Number),trigger=hours*60+minutes-(Number(item.reminderMinutes)||15),key=`commitment:${item.id}:${today}:${trigger}`;
    if(currentMinutes>=trigger&&currentMinutes-trigger<=2&&!sent[key]){await deliverAscendNotification(`ASCEND // ${item.title}`,`${item.start} • ${item.location||item.type}`,key);sent[key]=new Date().toISOString();changed=true;}
  }
  for(const course of activeSemester()?.courses||[]){
    if(!course.reminderEnabled)continue;
    for(const meeting of course.classes||[]){
      if(meeting.day!==currentDay)continue;
      const [hours,minutes]=String(meeting.start||'').split(':').map(Number),trigger=hours*60+minutes-(Number(course.reminderMinutes)||15),key=`class:${course.id}:${meeting.id}:${today}:${trigger}`;
      if(Number.isFinite(trigger)&&currentMinutes>=trigger&&currentMinutes<trigger+5&&!sent[key]){await deliverAscendNotification(`ASCEND // ${course.code||course.name}`,`${meeting.type||'Class'} starts at ${meeting.start}${meeting.location?` • ${meeting.location}`:''}.`,key);sent[key]=new Date().toISOString();changed=true;}
    }
  }
  for(const habit of habitState()){
    if(habit.reminderMode!=='interval'&&HABIT_SYSTEM.isDone(habit,today))continue;
    for(const slot of HABIT_SYSTEM.reminderSlots(habit,today)){
      const [hours,minutes]=slot.split(':').map(Number),slotMinutes=hours*60+minutes,key=`habit:${habit.id}:${today}:${slot}`;
      if(currentMinutes>=slotMinutes&&currentMinutes-slotMinutes<=2&&!sent[key]){
        await deliverAscendNotification(`ASCEND // ${habit.title}`,habit.reminderMode==='interval'?`Time for another check-in. ${HABIT_SYSTEM.reminderLabel(habit)}.`:'Your scheduled habit is ready.',key,launchUrl('habits',habit.id));
        sent[key]=new Date().toISOString();
        changed=true;
      }
    }
  }
  const cutoff=new Date(now.getTime()-14*86400000).toISOString();
  for(const [key,at] of Object.entries(sent))if(String(at)<cutoff){delete sent[key];changed=true;}
  if(changed)saveState();
}

function startReminderScheduler(){
  updateReminderButton();
  void checkReminderNotifications();
  setInterval(()=>void checkReminderNotifications(),30000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')void checkReminderNotifications();});
}

function updateHabitReminderFields(){
  const mode=el('habitReminderMode')?.value||'none';
  if(el('habitTimeField'))el('habitTimeField').hidden=mode!=='once';
  if(el('habitIntervalFields'))el('habitIntervalFields').hidden=mode!=='interval';
}

function bindHabitEvents(){
  el('enableRemindersButton')?.addEventListener('click',()=>void enableReminders());
  el('enableNotificationsSettingsButton')?.addEventListener('click',()=>void enableReminders());
  el('testNotificationButton')?.addEventListener('click',async()=>{if(Notification?.permission!=='granted'||!reminderState().enabled)return enableReminders();await deliverAscendNotification('ASCEND // Test','Notifications are working on this device.','ascend-test');});
  el('addHabitButton')?.addEventListener('click',()=>openHabitDialog());
  el('habitStarterButton')?.addEventListener('click',addHabitStarterPack);
  el('habitForm')?.addEventListener('submit',saveHabitFromForm);
  el('habitDialogClose')?.addEventListener('click',closeHabitDialog);
  el('habitCancelButton')?.addEventListener('click',closeHabitDialog);
  el('habitReminderMode')?.addEventListener('change',updateHabitReminderFields);
  el('habitDialog')?.addEventListener('click',event=>{if(event.target===el('habitDialog'))closeHabitDialog();});
  el('habitBoard')?.addEventListener('click',event=>{
    const toggle=event.target.closest?.('[data-habit-toggle]');
    if(toggle)return toggleHabitToday(toggle.dataset.habitToggle);
    const edit=event.target.closest?.('[data-habit-edit]');
    if(edit)return openHabitDialog(edit.dataset.habitEdit);
    const remove=event.target.closest?.('[data-habit-delete]');
    if(remove)return deleteHabit(remove.dataset.habitDelete);
    const create=event.target.closest?.('[data-habit-create]');
    if(create)return openHabitDialog();
  });
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!el('habitDialog')?.hidden)closeHabitDialog();});
}

function openHabitDialog(id=''){
  const habit=habitState().find(item=>item.id===id)||null;
  editingHabitId=habit?.id||null;
  el('habitDialogTitle').textContent=habit?'Edit Habit':'Create Habit';
  el('habitTitle').value=habit?.title||'';
  el('habitCategory').value=CATEGORIES.includes(habit?.category)?habit.category:(selectedFocusAreas()[0]||'Personal');
  el('habitReminderMode').value=habit?.reminderMode||'none';
  el('habitTime').value=habit?.time||'';
  el('habitIntervalMinutes').value=String(habit?.intervalMinutes||60);
  el('habitWindowStart').value=habit?.windowStart||'08:00';
  el('habitWindowEnd').value=habit?.windowEnd||'20:00';
  updateHabitReminderFields();
  el('habitNote').value=habit?.note||'';
  const days=habit?.days||[0,1,2,3,4,5,6];
  document.querySelectorAll('[data-habit-day]').forEach(input=>{input.checked=days.includes(Number(input.dataset.habitDay));});
  el('habitDialog').hidden=false;
  setTimeout(()=>el('habitTitle').focus(),40);
}

function closeHabitDialog(){
  editingHabitId=null;
  if(el('habitDialog'))el('habitDialog').hidden=true;
  el('habitForm')?.reset();
}

function saveHabitFromForm(event){
  event?.preventDefault?.();
  const habits=habitState(),previous=habits.find(item=>item.id===editingHabitId),title=el('habitTitle').value.trim();
  if(!title)return toast('Add a habit name.');
  if(!previous&&habits.length>=100)return toast('Habit limit reached. Archive your system by deleting habits you no longer track.');
  const days=[...document.querySelectorAll('[data-habit-day]:checked')].map(input=>Number(input.dataset.habitDay));
  if(!days.length)return toast('Choose at least one scheduled day.');
  const now=new Date().toISOString(),habit=HABIT_SYSTEM.normalizeHabit({
    ...previous,id:previous?.id||crypto.randomUUID(),title,category:el('habitCategory').value,note:el('habitNote').value,
    reminderMode:el('habitReminderMode').value,time:el('habitTime').value,intervalMinutes:Number(el('habitIntervalMinutes').value),windowStart:el('habitWindowStart').value,windowEnd:el('habitWindowEnd').value,days,
    checkIns:previous?.checkIns||{},createdDate:previous?.createdDate||localDateKey(new Date()),createdAt:previous?.createdAt||now,updatedAt:now
  },()=>crypto.randomUUID(),localDateKey(new Date()));
  if(previous)habits[habits.indexOf(previous)]=habit;else habits.unshift(habit);
  saveState();closeHabitDialog();renderHabits();toast(previous?'Habit updated. No XP was changed.':'Habit created. Habit check-ins award no XP.');
}

function toggleHabitToday(id){
  const habits=habitState(),index=habits.findIndex(item=>item.id===id),today=localDateKey(new Date());
  if(index<0)return;
  if(!HABIT_SYSTEM.isScheduled(habits[index],today))return toast('This habit is not scheduled today.');
  if(habits[index].reminderMode==='interval'){
    const status=HABIT_SYSTEM.intervalStatus(habits[index],today,new Date());
    if(!status.inWindow)return toast(`This habit is available during ${habits[index].windowStart}–${habits[index].windowEnd}.`);
    if(!status.available)return toast(`Next check-in is available at ${status.nextAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}.`);
    habits[index]=HABIT_SYSTEM.recordInterval(habits[index],today,new Date());saveState();renderHabits();return toast('Check-in recorded. No XP awarded.');
  }
  const wasDone=HABIT_SYSTEM.isDone(habits[index],today);habits[index]=HABIT_SYSTEM.toggleDate(habits[index],today);
  saveState();renderHabits();toast(wasDone?'Today’s habit check-in was removed. No XP changed.':'Habit checked for today. No XP awarded.');
}

function deleteHabit(id){
  const habit=habitState().find(item=>item.id===id);
  if(!habit||!confirm(`Delete habit “${habit.title}” and its private check-in history?`))return;
  state.habits=habitState().filter(item=>item.id!==id);
  saveState();renderHabits();toast('Habit deleted. Quest and XP history were not changed.');
}

function addHabitStarterPack(){
  if(!confirm('Add three simple starter habits? You can edit or delete each one. They never award XP.'))return;
  const habits=habitState(),existing=new Set(habits.map(item=>item.title.toLowerCase())),categories=availableCategories(),pick=(...choices)=>choices.find(choice=>categories.includes(choice))||categories[0]||'Personal';
  const templates=[
    {title:'Choose tomorrow’s top priority',category:pick('Productivity','Discipline & Habits','Personal'),note:'Name one concrete priority before the day ends.',time:'20:30'},
    {title:'Ten-minute focused reset',category:pick('Discipline & Habits','Productivity','Personal'),note:'Remove friction and prepare the next useful action.',time:''},
    {title:'Move for twenty minutes',category:pick('Fitness','Health & Wellness','Sports','Personal'),note:'Any intentional movement that honestly reaches twenty minutes.',time:''}
  ];
  let added=0;
  for(const template of templates){
    if(existing.has(template.title.toLowerCase())||habits.length>=100)continue;
    habits.push(HABIT_SYSTEM.normalizeHabit({...template,id:crypto.randomUUID(),days:[0,1,2,3,4,5,6],createdDate:localDateKey(new Date()),checkIns:{}},()=>crypto.randomUUID(),localDateKey(new Date())));added+=1;
  }
  saveState();renderHabits();toast(added?`${added} starter habit${added===1?'':'s'} added. No XP attached.`:'Starter habits already exist.');
}

function renderHabits(){
  if(!el('habitBoard'))return;
  const today=localDateKey(new Date()),habits=habitState(),scheduled=habits.filter(habit=>HABIT_SYSTEM.isScheduled(habit,today)),done=scheduled.filter(habit=>HABIT_SYSTEM.isDone(habit,today));
  el('habitDueToday').textContent=scheduled.length;
  el('habitDoneToday').textContent=done.length;
  el('habitBestStreak').textContent=habits.reduce((best,habit)=>Math.max(best,HABIT_SYSTEM.currentStreak(habit,today)),0);
  el('habitTotal').textContent=habits.length;
  el('habitBoard').innerHTML=habits.length?habits.map(habit=>{
    const profile=profileForArea(habit.category),todayScheduled=HABIT_SYSTEM.isScheduled(habit,today),todayDone=HABIT_SYSTEM.isDone(habit,today),streak=HABIT_SYSTEM.currentStreak(habit,today),week=HABIT_SYSTEM.windowProgress(habit,today,7),missed=HABIT_SYSTEM.missedCount(habit,today,30),interval=habit.reminderMode==='interval'?HABIT_SYSTEM.intervalStatus(habit,today,new Date()):null;
    return `<article class="habit-card panel ${todayDone?'done':''}" style="--habit-color:${profile.color}">
      <header><span class="habit-icon">${escapeHtml(profile.icon)}</span><div><span class="eyebrow">${escapeHtml(habit.category)}</span><h3>${escapeHtml(habit.title)}</h3><p>${escapeHtml(habit.note||'A private repeatable action.')}</p></div><span class="habit-streak compact"><strong>${streak} day${streak===1?'':'s'}</strong><small>CURRENT STREAK</small></span></header>
      <div class="habit-week" aria-label="Last seven days">${week.slots.map(slot=>`<span class="${slot.scheduled?'scheduled':'off'} ${slot.completed?'complete':''}" title="${escapeHtml(slot.key)}"><i></i><small>${slot.day}</small></span>`).join('')}</div>
      <div class="habit-stats readable"><span><small>CONSISTENCY</small><strong>${streak?`${streak}-day streak`:'Building now'}</strong></span><span><small>SCHEDULE</small><strong>${escapeHtml(HABIT_SYSTEM.scheduleLabel(habit))}</strong></span><span><small>REMINDERS</small><strong>${escapeHtml(HABIT_SYSTEM.reminderLabel(habit))}</strong></span>${missed?`<span><small>PAST 30 DAYS</small><strong>${missed} missed day${missed===1?'':'s'}</strong></span>`:''}</div>
      ${interval?`<div class="habit-interval-status"><strong>${interval.count} check-in${interval.count===1?'':'s'} today</strong><small>${interval.available?'Ready now':interval.nextAt?`Next at ${interval.nextAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`:`Available ${habit.windowStart}–${habit.windowEnd}`}</small></div>`:''}
      <footer><button class="habit-check-button ${!interval&&todayDone?'checked':''}" type="button" data-habit-toggle="${habit.id}" ${(todayScheduled&&(!interval||interval.available))?'':'disabled'}>${!todayScheduled?'Not Scheduled Today':interval?(interval.available?'Mark Done':interval.nextAt?`Next ${interval.nextAt.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`:'Outside Window'):(todayDone?'✓ Done Today':'Mark Today')}</button><button class="text-btn" type="button" data-habit-edit="${habit.id}">Edit</button><button class="text-btn danger-text" type="button" data-habit-delete="${habit.id}">Delete</button></footer>
    </article>`;
  }).join(''):`<article class="habit-empty panel"><span>↻</span><strong>No habits yet.</strong><p>Start with one repeatable behavior. Habits stay separate from Quests and never award XP.</p><button class="primary-btn" type="button" data-habit-create="1">Create First Habit</button></article>`;
}

function openOnboarding({recalibrate=false}={}){if(vaultRecoveryRequired){showVaultUnlockGate();return;}onboardingRecalibration=Boolean(recalibrate);onboardingStep=1;prepareOnboardingChoices({preserveCurrent:onboardingRecalibration});el('onboardingGate').hidden=false;el('onboardingName').value=state.profile.name==='Player'?'':state.profile.name;renderOnboarding();}
function moveOnboarding(delta){
  if(delta>0&&onboardingStep===1&&!el('onboardingName').value.trim()) return toast('Add the name you want ASCEND to use.');
  if(delta>0&&onboardingStep===2&&!document.querySelector('[data-focus].selected')) return toast('Select at least one focus area.');
  if(delta>0&&onboardingStep===3&&!document.querySelector('[data-mode].selected')) return toast('Choose an operating style.');
  if(onboardingStep===4&&delta>0){finishOnboarding(false);return;}
  onboardingStep=Math.max(1,Math.min(4,onboardingStep+delta));renderOnboarding();
}
function renderOnboarding(){
  for(let i=1;i<=4;i++)el(`onboardingStep${i}`).hidden=i!==onboardingStep;
  el('onboardingProgressBar').style.width=`${onboardingStep*25}%`;el('onboardingEyebrow').textContent=`SYSTEM CALIBRATION // ${onboardingStep} OF 4`;
  el('onboardingBackButton').hidden=onboardingStep===1&&!onboardingRecalibration;el('onboardingBackButton').textContent=onboardingStep===1&&onboardingRecalibration?'Cancel':'Back';el('onboardingNextButton').textContent=onboardingStep===4?'Save Calibration':'Continue';if(onboardingStep===2)updateFocusSelectionCount();
  if(onboardingStep===4){const focuses=[...document.querySelectorAll('[data-focus].selected')].map(b=>b.dataset.focus);const mode=document.querySelector('[data-mode].selected')?.dataset.mode||'Balance';el('onboardingSummary').innerHTML=`<strong>${escapeHtml(el('onboardingName').value.trim())}</strong><span>${focuses.map(escapeHtml).join(' • ')}</span><small>Operating style: ${escapeHtml(mode)}${onboardingRecalibration?' • Existing progress stays intact':' • First-run tour starts automatically and can be skipped'}</small>`;}
}
function finishOnboarding(){
  if(vaultRecoveryRequired){showVaultUnlockGate();return;}
  const recalibrating=onboardingRecalibration,previousIdentity=state.profile.identity;state.profile.name=el('onboardingName').value.trim()||'Player';state.profile.focusAreas=[...document.querySelectorAll('[data-focus].selected')].map(b=>canonicalArea(b.dataset.focus));state.profile.operatingMode=document.querySelector('[data-mode].selected')?.dataset.mode||'Balance';state.profile.identity=recalibrating?previousIdentity:(state.profile.focusAreas.length?`${state.profile.operatingMode} mode • ${state.profile.focusAreas.slice(0,3).join(' / ')}`:'Building a personal progression system');state.profile.onboardingComplete=true;state.skills=SKILL_SYSTEM.migrateSkillState(state.skills||{});for(const area of selectedFocusAreas())state.stats[area]??=0;for(const skill of activeSkillDefinitions())state.skills[coreSkillKey(skill.id)]??=0;onboardingRecalibration=false;saveState();populateSelects();unlockAchievements(false);renderAll();el('onboardingGate').hidden=true;if(recalibrating)toast('Focus areas recalibrated. Existing quests, XP, Skills, and history were preserved.');else{localStorage.removeItem(TOUR_SEEN_KEY);startGuidedTour();}
}
async function requestPasswordReset(email,captchaSource='entry'){
  if(!email)return setEntryStatus('Enter your email first.',true);if(!cloudConfig.enabled)return setEntryStatus('Cloud is not configured.',true);
  try{const security=await requireCaptchaSecurity(captchaSource);const redirectTo=`${location.origin}${location.pathname}`;const r=await fetch(`${cloudConfig.url}/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`,{method:'POST',headers:cloudBaseHeaders(false),body:JSON.stringify({email,...security})});const p=await r.json().catch(()=>({}));if(!r.ok)throw new Error(captchaErrorMessage(p,'Could not send reset email.'));setEntryStatus('Password reset email sent. Open the verified link on this device.');toast('Password reset email sent.');}catch(e){setEntryStatus(e.message,true);toast(e.message)}finally{resetTurnstile(captchaSource);}
}
function parseRecoveryHash(){const raw=location.hash.replace(/^#/,'');if(!raw)return null;const p=new URLSearchParams(raw);if(p.get('type')!=='recovery'||!p.get('access_token'))return null;return{accessToken:p.get('access_token'),refreshToken:p.get('refresh_token')||''};}
async function saveRecoveredPassword(){const rec=parseRecoveryHash();const pwd=el('recoveryNewPassword').value;if(!rec)return; if(pwd.length<8)return el('recoveryStatus').textContent='Use at least 8 characters.';try{const r=await fetch(`${cloudConfig.url}/auth/v1/user`,{method:'PUT',headers:{...cloudBaseHeaders(false),Authorization:`Bearer ${rec.accessToken}`},body:JSON.stringify({password:pwd})});const p=await r.json();if(!r.ok)throw new Error(p.msg||p.message||'Password update failed.');history.replaceState({},document.title,location.pathname);el('passwordRecoveryGate').hidden=true;el('entryGate').hidden=false;setEntryMode('signin');setEntryStatus('Password updated. Sign in with the new password.');}catch(e){el('recoveryStatus').textContent=e.message;}}

function plannerState(){ state.planner=PLANNER.migratePlanner(state.planner||{}); return state.planner; }
function activeSemester(){const planner=plannerState();return planner.semesters.find(s=>s.id===planner.activeSemesterId)||planner.semesters[0]||null;}
function parsePlannerItems(raw,previous=[]){return String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,300).map((line,index)=>{const [title,...rest]=line.split('|').map(x=>x.trim());const old=previous.find(item=>item.title.toLocaleLowerCase()===title.toLocaleLowerCase());return PLANNER.normalizeItem({...old,title,estimatedMinutes:Number(rest[0])||old?.estimatedMinutes||30,order:index});});}
function parseClassMeetings(raw,previous=[]){return String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).slice(0,40).map((line,index)=>{const [day,start,end,type,location]=line.split('|').map(x=>x.trim());const old=previous[index];return PLANNER.normalizeClassMeeting({...old,day,start,end,type,location});});}
function listItemLines(items=[]){return items.map(item=>`${item.title} | ${item.estimatedMinutes}`).join('\n');}
function classLines(items=[]){return items.map(item=>[item.day,item.start,item.end,item.type,item.location].filter((value,index)=>value||index<4).join(' | ')).join('\n');}

function bindPlannerEvents(){
  if(!el('plannerView'))return;
  document.querySelectorAll('[data-planner-tab]').forEach(button=>button.addEventListener('click',()=>{activePlannerTab=button.dataset.plannerTab;renderPlanner();}));
  el('newListButton').onclick=()=>openListDialog();el('newSemesterButton').onclick=()=>openSemesterDialog();
  el('listDialogClose').onclick=closeListDialog;el('listCancelButton').onclick=closeListDialog;el('listForm').onsubmit=event=>{event.preventDefault();saveListFromForm();};
  el('semesterDialogClose').onclick=closeSemesterDialog;el('semesterCancelButton').onclick=closeSemesterDialog;el('semesterForm').onsubmit=event=>{event.preventDefault();saveSemesterFromForm();};
  el('courseDialogClose').onclick=closeCourseDialog;el('courseCancelButton').onclick=closeCourseDialog;el('courseForm').onsubmit=event=>{event.preventDefault();saveCourseFromForm();};
  el('commitmentDialogClose').onclick=closeCommitmentDialog;el('commitmentCancelButton').onclick=closeCommitmentDialog;el('commitmentForm').onsubmit=event=>{event.preventDefault();saveCommitmentFromForm();};
  el('commitmentReminderEnabled')?.addEventListener('change',()=>{el('commitmentReminderMinutesField').hidden=!el('commitmentReminderEnabled').checked;});
  el('courseReminderEnabled')?.addEventListener('change',()=>{el('courseReminderMinutesField').hidden=!el('courseReminderEnabled').checked;});
  el('semesterSelect').onchange=event=>{plannerState().activeSemesterId=event.target.value;saveState();renderPlanner();};
  el('editSemesterButton').onclick=()=>{const semester=activeSemester();if(semester)openSemesterDialog(semester);};
  el('deleteSemesterButton').onclick=deleteActiveSemester;
  el('addCourseButton').onclick=()=>activeSemester()?openCourseDialog():toast('Create a semester first.');
  el('addCommitmentButton').onclick=()=>activeSemester()?openCommitmentDialog():toast('Create a semester first.');
  document.addEventListener('click',event=>{
    const target=event.target.closest?.('[data-list-create],[data-list-edit],[data-list-delete],[data-list-toggle],[data-list-quest],[data-list-move],[data-course-edit],[data-course-delete],[data-course-toggle],[data-course-quest],[data-course-move],[data-commitment-edit],[data-commitment-delete]');if(!target)return;
    const planner=plannerState();
    if(target.dataset.listCreate)openListDialog();
    if(target.dataset.listEdit)openListDialog(planner.lists.find(list=>list.id===target.dataset.listEdit));
    if(target.dataset.listDelete)deletePlannerList(target.dataset.listDelete);
    if(target.dataset.listToggle){const [listId,itemId]=target.dataset.listToggle.split(':');togglePlannerItem('list',listId,itemId);}
    if(target.dataset.listMove){const [listId,itemId,direction]=target.dataset.listMove.split(':');movePlannerItem('list',listId,itemId,Number(direction));}
    if(target.dataset.listQuest){const [listId,itemId]=target.dataset.listQuest.split(':');const list=planner.lists.find(x=>x.id===listId),item=list?.items.find(x=>x.id===itemId);if(item)openPlannerQuest({kind:'list',listId,itemId},item,{category:list.category,parentTitle:list.title,notes:list.description});}
    if(target.dataset.courseEdit){const semester=activeSemester(),course=semester?.courses.find(x=>x.id===target.dataset.courseEdit);if(course)openCourseDialog(course);}
    if(target.dataset.courseDelete)deletePlannerCourse(target.dataset.courseDelete);
    if(target.dataset.courseToggle){const [courseId,itemId]=target.dataset.courseToggle.split(':');togglePlannerItem('course',courseId,itemId);}
    if(target.dataset.courseMove){const [courseId,itemId,direction]=target.dataset.courseMove.split(':');movePlannerItem('course',courseId,itemId,Number(direction));}
    if(target.dataset.courseQuest){const [courseId,itemId]=target.dataset.courseQuest.split(':');const semester=activeSemester(),course=semester?.courses.find(x=>x.id===courseId),item=course?.sections.find(x=>x.id===itemId);if(item)openPlannerQuest({kind:'course',semesterId:semester.id,courseId,itemId},item,{category:'University',parentTitle:`${course.code} ${course.name}`.trim(),notes:course.target});}
    if(target.dataset.commitmentEdit){const commitment=activeSemester()?.commitments.find(x=>x.id===target.dataset.commitmentEdit);if(commitment)openCommitmentDialog(commitment);}
    if(target.dataset.commitmentDelete)deletePlannerCommitment(target.dataset.commitmentDelete);
  });
}

function openListDialog(list=null){editingListId=list?.id||null;el('listDialogTitle').textContent=list?'Edit List':'Create List';el('listTitle').value=list?.title||'';setSelectValue('listCategory',list?.category||(availableCategories()[0]||'Personal'),'Personal');el('listDueDate').value=list?.dueDate||'';el('listDescription').value=list?.description||'';el('listItems').value=listItemLines(list?.items);el('listDialog').hidden=false;document.body.classList.add('modal-open');}
function closeListDialog(){el('listDialog').hidden=true;editingListId=null;document.body.classList.remove('modal-open');}
function saveListFromForm(){const planner=plannerState(),previous=planner.lists.find(x=>x.id===editingListId);const items=parsePlannerItems(el('listItems').value,previous?.items||[]);if(!el('listTitle').value.trim())return toast('Add a list name.');if(!items.length)return toast('Add at least one list item.');const list=PLANNER.normalizeList({...previous,id:editingListId||crypto.randomUUID(),title:el('listTitle').value,category:el('listCategory').value,description:el('listDescription').value,dueDate:el('listDueDate').value,items,updatedAt:new Date().toISOString()});if(previous)planner.lists[planner.lists.indexOf(previous)]=list;else planner.lists.unshift(list);saveState();closeListDialog();renderPlanner();toast(previous?'List updated.':'List created. Planning items award no XP.');}
function deletePlannerList(id){const planner=plannerState(),list=planner.lists.find(x=>x.id===id);if(!list||!confirm(`Delete list “${list.title}”? Any Quests created from it stay safely in the Quest Board.`))return;planner.lists=planner.lists.filter(x=>x.id!==id);saveState();renderPlanner();toast('List deleted. Linked Quests were preserved.');}

function openSemesterDialog(semester=null){editingSemesterId=semester?.id||null;el('semesterDialogTitle').textContent=semester?'Edit Semester':'Create Semester';el('semesterName').value=semester?.name||'';el('semesterStart').value=semester?.start||'';el('semesterEnd').value=semester?.end||'';el('semesterPurpose').value=semester?.purpose||'';el('semesterDialog').hidden=false;document.body.classList.add('modal-open');}
function closeSemesterDialog(){el('semesterDialog').hidden=true;editingSemesterId=null;document.body.classList.remove('modal-open');}
function saveSemesterFromForm(){const planner=plannerState(),previous=planner.semesters.find(x=>x.id===editingSemesterId),name=el('semesterName').value.trim(),start=el('semesterStart').value,end=el('semesterEnd').value;if(!name)return toast('Add a semester name.');if(start&&end&&end<start)return toast('Semester end must be after its start.');const semester=PLANNER.normalizeSemester({...previous,id:editingSemesterId||crypto.randomUUID(),name,start,end,purpose:el('semesterPurpose').value,courses:previous?.courses||[],commitments:previous?.commitments||[]});if(previous)planner.semesters[planner.semesters.indexOf(previous)]=semester;else planner.semesters.push(semester);planner.activeSemesterId=semester.id;saveState();closeSemesterDialog();renderPlanner();toast(previous?'Semester updated.':'Semester created. Add courses when ready.');}
function deleteActiveSemester(){const planner=plannerState(),semester=activeSemester();if(!semester||!confirm(`Delete semester “${semester.name}”? Quests created from its sections stay in the Quest Board.`))return;planner.semesters=planner.semesters.filter(x=>x.id!==semester.id);planner.activeSemesterId=planner.semesters.at(-1)?.id||'';saveState();renderPlanner();toast('Semester deleted. Linked Quests were preserved.');}

function openCourseDialog(course=null){editingCourseId=course?.id||null;el('courseDialogTitle').textContent=course?'Edit Course':'Add Course';el('courseCode').value=course?.code||'';el('courseName').value=course?.name||'';el('courseFocus').value=String(course?.focus||3);el('courseColor').value=course?.color||'cyan';el('courseTarget').value=course?.target||'';el('courseSections').value=listItemLines(course?.sections);el('courseClasses').value=classLines(course?.classes);el('courseReminderEnabled').checked=Boolean(course?.reminderEnabled);el('courseReminderMinutes').value=String(course?.reminderMinutes||15);el('courseReminderMinutesField').hidden=!el('courseReminderEnabled').checked;el('courseDialog').hidden=false;document.body.classList.add('modal-open');}
function closeCourseDialog(){el('courseDialog').hidden=true;editingCourseId=null;document.body.classList.remove('modal-open');}
function saveCourseFromForm(){const semester=activeSemester();if(!semester)return toast('Create a semester first.');const previous=semester.courses.find(x=>x.id===editingCourseId),name=el('courseName').value.trim();if(!name)return toast('Add a course name.');const classRows=String(el('courseClasses').value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean).map(line=>line.split('|').map(x=>x.trim()));const invalid=classRows.some(([day,start,end])=>!PLANNER.canonicalDay(day)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(start||'')||!/^([01]\d|2[0-3]):[0-5]\d$/.test(end||'')||end<=start);if(invalid)return toast('Use DAY | HH:MM | HH:MM, with a valid English or Arabic day and an end time after the start.');const sections=parsePlannerItems(el('courseSections').value,previous?.sections||[]),classes=parseClassMeetings(el('courseClasses').value,previous?.classes||[]);const course=PLANNER.normalizeCourse({...previous,id:editingCourseId||crypto.randomUUID(),code:el('courseCode').value,name,focus:el('courseFocus').value,color:el('courseColor').value,target:el('courseTarget').value,sections,classes,reminderEnabled:el('courseReminderEnabled').checked,reminderMinutes:Number(el('courseReminderMinutes').value)||15});if(previous)semester.courses[semester.courses.indexOf(previous)]=course;else semester.courses.push(course);saveState();closeCourseDialog();renderPlanner();const conflicts=PLANNER.scheduleConflicts(semester.courses,semester.commitments);toast(conflicts.length?`Course saved. Warning: ${conflicts.length} schedule conflict${conflicts.length===1?'':'s'} detected.`:'Course saved. No schedule conflicts.');}
function deletePlannerCourse(id){const semester=activeSemester(),course=semester?.courses.find(x=>x.id===id);if(!course||!confirm(`Delete course “${course.name}”? Quests created from its sections stay in the Quest Board.`))return;semester.courses=semester.courses.filter(x=>x.id!==id);saveState();renderPlanner();toast('Course deleted. Linked Quests were preserved.');}

function openCommitmentDialog(commitment=null){editingCommitmentId=commitment?.id||null;el('commitmentDialogTitle').textContent=commitment?'Edit Fixed Time':'Add Fixed Time';el('commitmentTitle').value=commitment?.title||'';el('commitmentDay').value=commitment?.day||'Sunday';el('commitmentType').value=commitment?.type||'Commitment';el('commitmentStart').value=commitment?.start||'08:00';el('commitmentEnd').value=commitment?.end||'09:00';el('commitmentColor').value=commitment?.color||'amber';el('commitmentLocation').value=commitment?.location||'';el('commitmentReminderEnabled').checked=Boolean(commitment?.reminderEnabled);el('commitmentReminderMinutes').value=String(commitment?.reminderMinutes||15);el('commitmentReminderMinutesField').hidden=!el('commitmentReminderEnabled').checked;el('commitmentDialog').hidden=false;document.body.classList.add('modal-open');}
function closeCommitmentDialog(){el('commitmentDialog').hidden=true;editingCommitmentId=null;document.body.classList.remove('modal-open');}
function saveCommitmentFromForm(){const semester=activeSemester();if(!semester)return toast('Create a semester first.');const previous=semester.commitments.find(x=>x.id===editingCommitmentId),title=el('commitmentTitle').value.trim(),day=PLANNER.canonicalDay(el('commitmentDay').value),start=el('commitmentStart').value,end=el('commitmentEnd').value;if(!title)return toast('Add a title for this fixed time.');if(!day||!start||!end||end<=start)return toast('Choose a valid day and an end time after the start.');const commitment=PLANNER.normalizeCommitment({...previous,id:editingCommitmentId||crypto.randomUUID(),title,day,type:el('commitmentType').value,start,end,color:el('commitmentColor').value,location:el('commitmentLocation').value,reminderEnabled:el('commitmentReminderEnabled').checked,reminderMinutes:Number(el('commitmentReminderMinutes').value)||15});if(previous)semester.commitments[semester.commitments.indexOf(previous)]=commitment;else semester.commitments.push(commitment);saveState();closeCommitmentDialog();renderPlanner();const conflicts=PLANNER.scheduleConflicts(semester.courses,semester.commitments);toast(conflicts.length?`Fixed time saved. Warning: ${conflicts.length} schedule conflict${conflicts.length===1?'':'s'} detected.`:'Fixed time saved. No schedule conflicts.');}
function deletePlannerCommitment(id){const semester=activeSemester(),commitment=semester?.commitments.find(x=>x.id===id);if(!commitment||!confirm(`Delete fixed time “${commitment.title}”?`))return;semester.commitments=semester.commitments.filter(x=>x.id!==id);saveState();renderPlanner();toast('Fixed time deleted.');}

function togglePlannerItem(kind,parentId,itemId){const planner=plannerState();let item;if(kind==='list')item=planner.lists.find(x=>x.id===parentId)?.items.find(x=>x.id===itemId);else item=activeSemester()?.courses.find(x=>x.id===parentId)?.sections.find(x=>x.id===itemId);if(!item)return;item.status=item.status==='completed'?'active':'completed';item.completedAt=item.status==='completed'?new Date().toISOString():null;saveState();renderPlanner();toast(item.status==='completed'?'Planning item checked. No XP awarded.':'Planning item reopened.');}
function movePlannerItem(kind,parentId,itemId,direction){const collection=kind==='list'?plannerState().lists.find(x=>x.id===parentId)?.items:activeSemester()?.courses.find(x=>x.id===parentId)?.sections;if(!collection||![1,-1].includes(direction))return;const index=collection.findIndex(x=>x.id===itemId),next=index+direction;if(index<0||next<0||next>=collection.length)return;[collection[index],collection[next]]=[collection[next],collection[index]];collection.forEach((item,order)=>item.order=order);saveState();renderPlanner();}
function openPlannerQuest(ref,item,context){if(item.convertedQuestId){const linked=state.quests.find(q=>q.id===item.convertedQuestId);if(linked){switchView('quests');document.getElementById(`quest-${linked.id}`)?.scrollIntoView({behavior:'smooth',block:'center'});return toast('This item already has a Quest.');}item.convertedQuestId='';}pendingPlannerItemRef=ref;openQuestDialog(PLANNER.questDraft(item,context),null,'planner');}
function linkPlannerItemToQuest(ref,questId){if(!ref)return;let item;if(ref.kind==='list')item=plannerState().lists.find(x=>x.id===ref.listId)?.items.find(x=>x.id===ref.itemId);else item=plannerState().semesters.find(x=>x.id===ref.semesterId)?.courses.find(x=>x.id===ref.courseId)?.sections.find(x=>x.id===ref.itemId);if(item)item.convertedQuestId=questId;}

function plannerItemHtml(item,ref){const linked=item.convertedQuestId&&state.quests.some(q=>q.id===item.convertedQuestId);return `<div class="planner-item ${item.status==='completed'?'done':''}"><button class="planner-check" type="button" data-${ref.kind}-toggle="${ref.parentId}:${item.id}" aria-label="${item.status==='completed'?'Reopen':'Complete'} item">${item.status==='completed'?'✓':'◇'}</button><div><strong>${escapeHtml(item.title)}</strong><small>${formatEffort(item.estimatedMinutes)}${item.dueDate?` • ${friendlyDate(item.dueDate)}`:''}${linked?' • Quest linked':''}</small></div><div class="planner-item-actions"><button type="button" data-${ref.kind}-move="${ref.parentId}:${item.id}:-1" aria-label="Move up">↑</button><button type="button" data-${ref.kind}-move="${ref.parentId}:${item.id}:1" aria-label="Move down">↓</button><button class="planner-quest-btn" type="button" data-${ref.kind}-quest="${ref.parentId}:${item.id}">${linked?'Open Quest':'Make Quest'}</button></div></div>`;}
function renderPlanner(){if(!el('plannerView'))return;const planner=plannerState();document.querySelectorAll('[data-planner-tab]').forEach(button=>button.classList.toggle('active',button.dataset.plannerTab===activePlannerTab));el('plannerListsPanel').hidden=activePlannerTab!=='lists';el('plannerSemesterPanel').hidden=activePlannerTab!=='semester';el('plannerSchedulePanel').hidden=activePlannerTab!=='schedule';renderPlannerLists(planner);renderSemesterPlanner(planner);renderClassSchedule(planner);}
function renderPlannerLists(planner){el('plannerListBoard').innerHTML=planner.lists.length?planner.lists.map(list=>{const p=PLANNER.progress(list.items);return `<article class="planner-list-card panel"><div class="planner-card-head"><div><span class="eyebrow">${escapeHtml(list.category)} LIST</span><h3>${escapeHtml(list.title)}</h3><p>${escapeHtml(list.description||'Structured preparation and sections.')}</p></div><strong>${p.percent}%</strong></div><div class="planner-progress"><i style="width:${p.percent}%"></i></div><div class="planner-items">${list.items.map(item=>plannerItemHtml(item,{kind:'list',parentId:list.id})).join('')}</div><div class="planner-card-actions"><span>${p.completed}/${p.total} complete${list.dueDate?` • Target ${friendlyDate(list.dueDate)}`:''}</span><button type="button" data-list-edit="${list.id}">Edit</button><button type="button" data-list-delete="${list.id}">Delete</button></div></article>`;}).join(''):`<article class="panel planner-empty"><strong>No lists yet.</strong><span>Create a course breakdown, reading queue, preparation list, or any structured checklist.</span><button class="primary-btn" type="button" data-list-create="1">Create First List</button></article>`;}
function renderSemesterPlanner(planner){const semester=activeSemester();el('semesterSelect').innerHTML=planner.semesters.length?planner.semesters.map(s=>`<option value="${s.id}" ${s.id===semester?.id?'selected':''}>${escapeHtml(s.name)}</option>`).join(''):'<option value="">No semester yet</option>';el('editSemesterButton').disabled=!semester;el('deleteSemesterButton').disabled=!semester;el('addCourseButton').disabled=!semester;el('addCommitmentButton').disabled=!semester;if(!semester){el('semesterBoard').innerHTML='<article class="panel planner-empty"><strong>No semester configured.</strong><span>Add a semester, then organize courses, sections, focus levels, weekly classes, and fixed commitments.</span></article>';return;}el('semesterBoard').innerHTML=`<article class="semester-overview panel"><div><span class="eyebrow">ACTIVE SEMESTER</span><h2>${escapeHtml(semester.name)}</h2><p>${escapeHtml(semester.purpose||'Define the outcome you want from this semester.')}</p></div><span>${semester.start?friendlyDate(semester.start):'Open start'} → ${semester.end?friendlyDate(semester.end):'Open end'}<small>${semester.courses.length} courses • ${semester.commitments.length} fixed times</small></span></article><div class="course-board">${semester.courses.length?semester.courses.map(course=>{const p=PLANNER.progress(course.sections);return `<article class="course-card panel color-${course.color}"><div class="planner-card-head"><div><span class="eyebrow">${escapeHtml(course.code||'COURSE')} • FOCUS ${course.focus}/5</span><h3>${escapeHtml(course.name)}</h3><p>${escapeHtml(course.target||'Add a measurable course target.')}</p></div><strong>${p.percent}%</strong></div><div class="planner-progress"><i style="width:${p.percent}%"></i></div><div class="planner-items">${course.sections.length?course.sections.map(item=>plannerItemHtml(item,{kind:'course',parentId:course.id})).join(''):'<small class="planner-muted">No study sections yet. Edit this course to add them.</small>'}</div><div class="planner-card-actions"><span>${course.classes.length} weekly class${course.classes.length===1?'':'es'} • ${p.completed}/${p.total} sections</span><button type="button" data-course-edit="${course.id}">Edit</button><button type="button" data-course-delete="${course.id}">Delete</button></div></article>`;}).join(''):'<article class="panel planner-empty"><strong>No courses yet.</strong><span>Add each course once, then define its sections and class times.</span></article>'}</div>`;}
function renderClassSchedule(){const semester=activeSemester(),courses=semester?.courses||[],commitments=semester?.commitments||[],conflicts=PLANNER.scheduleConflicts(courses,commitments),conflictingIds=new Set(conflicts.flatMap(c=>[c.first.id,c.second.id]));el('scheduleConflictSummary').textContent=conflicts.length?`${conflicts.length} conflict${conflicts.length===1?'':'s'} — review highlighted times`:'No schedule conflicts';el('scheduleConflictSummary').classList.toggle('danger-text',Boolean(conflicts.length));if(!courses.some(c=>c.classes.length)&&!commitments.length){el('classScheduleBoard').innerHTML='<article class="panel planner-empty"><strong>No weekly times yet.</strong><span>Add class times inside a course, or add work, appointments, and protected study blocks here.</span></article>';return;}el('classScheduleBoard').innerHTML=PLANNER.DAYS.map(day=>{const classMeetings=courses.flatMap(course=>course.classes.filter(m=>m.day===day).map(m=>({...m,title:course.code||course.name,color:course.color,isCommitment:false}))),fixedMeetings=commitments.filter(m=>m.day===day).map(m=>({...m,isCommitment:true})),meetings=[...classMeetings,...fixedMeetings].sort((a,b)=>a.start.localeCompare(b.start));return `<section class="schedule-day"><header><strong>${day}</strong><span>${meetings.length}</span></header>${meetings.length?meetings.map(m=>`<article class="schedule-meeting color-${m.color} ${m.isCommitment?'fixed':''} ${conflictingIds.has(m.id)?'conflict':''}"><time>${m.start}–${m.end}</time><strong>${escapeHtml(m.title)}</strong><span>${escapeHtml(m.type)}${m.location?` • ${escapeHtml(m.location)}`:''}</span>${conflictingIds.has(m.id)?'<small>TIME CONFLICT</small>':''}${m.isCommitment?`<div class="schedule-controls"><button type="button" data-commitment-edit="${m.id}">Edit</button><button type="button" data-commitment-delete="${m.id}">Delete</button></div>`:''}</article>`).join(''):'<div class="schedule-free">Free</div>'}</section>`;}).join('');}

function bindProjectEvents(){
  if(!el('projectsView'))return;
  el('newProjectButton').onclick=()=>openProjectDialog();el('projectDialogClose').onclick=closeProjectDialog;el('projectCancelButton').onclick=closeProjectDialog;el('projectForm').onsubmit=e=>{e.preventDefault();saveProjectFromForm()};el('analyzeProjectButton').onclick=analyzeProject;
  document.addEventListener('click',e=>{
    const create=e.target.closest?.('[data-project-create]');if(create)openProjectDialog();
    const open=e.target.closest?.('[data-project-open]');if(open){switchView('projects');document.getElementById(`project-${open.dataset.projectOpen}`)?.scrollIntoView({behavior:'smooth',block:'center'});}
    const edit=e.target.closest?.('[data-project-edit]');if(edit)openProjectDialog(state.projects.find(p=>p.id===edit.dataset.projectEdit));
    const del=e.target.closest?.('[data-project-delete]');if(del)deleteProject(del.dataset.projectDelete);
    const questEdit=e.target.closest?.('[data-project-quest-edit]');if(questEdit)editQuest(questEdit.dataset.projectQuestEdit);
    const questComplete=e.target.closest?.('[data-project-quest-complete]');if(questComplete)completeQuest(questComplete.dataset.projectQuestComplete);
    const sub=e.target.closest?.('[data-project-subquest]');if(sub)toggleSubquest(sub.dataset.projectQuest,sub.dataset.projectSubquest);
    const accept=e.target.closest?.('#acceptProjectPlan');if(accept)acceptProjectPlan();
    const audit=e.target.closest?.('[data-impact-audit]');if(audit)requestImpactAudit(audit.dataset.impactAudit);
  });
}
function openProjectDialog(p=null){editingProjectId=p?.id||null;el('projectDialogTitle').textContent=p?'Edit Project':'Create Project';el('projectTitle').value=p?.title||'';el('projectCategory').value=p?.category||(availableCategories()[0]||'Personal');el('projectDifficulty').value=p?.difficulty||'B';el('projectOutcome').value=p?.outcome||'';el('projectDueDate').value=p?.dueDate||'';el('projectImpact').value=String(p?.impact||3);el('projectFinalQuest').value=p?.finalQuestTitle||'Full-system validation and delivery';const linked=state.quests.filter(q=>q.projectId===p?.id&&q.projectRole!=='final');el('projectRequiredQuests').value=linked.filter(q=>q.projectRequired!==false).map(q=>q.title).join('\n');el('projectOptionalQuests').value=linked.filter(q=>q.projectRequired===false).map(q=>q.title).join('\n');el('projectDialog').hidden=false;}
function closeProjectDialog(){el('projectDialog').hidden=true;editingProjectId=null;}
function makeProjectQuest(title,project,required=true,role='workstream',subquestTitles=[]){const draft={title,category:project.category,secondaryCategory:'',questType:'Main Quest',priority:project.dueDate?'High':'Medium',difficulty:project.difficulty==='S'?'A':project.difficulty,estimatedMinutes:project.difficulty==='S'?600:project.difficulty==='A'?360:240,dueDate:project.dueDate,longTermValue:Math.max(3,project.impact),impactScore:project.impact};const reward=calculateQuestReward(draft);return migrateQuest({...draft,id:crypto.randomUUID(),xp:reward.xp,projectId:project.id,projectRole:role,projectRequired:required,status:'active',createdAt:new Date().toISOString(),subquests:(subquestTitles||[]).map((t,i)=>({id:crypto.randomUUID(),title:String(t),status:'active',completedAt:null,xpAwarded:0,order:i}))});}
function saveProjectFromForm(){const creating=!editingProjectId;const project=migrateProject({id:editingProjectId||crypto.randomUUID(),title:el('projectTitle').value.trim(),category:el('projectCategory').value,difficulty:el('projectDifficulty').value,outcome:el('projectOutcome').value.trim(),dueDate:el('projectDueDate').value||null,impact:Number(el('projectImpact').value),finalQuestTitle:el('projectFinalQuest').value.trim()||'Full-system validation and delivery',createdAt:state.projects.find(p=>p.id===editingProjectId)?.createdAt});if(!project.title)return toast('Add a project title.');const required=el('projectRequiredQuests').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);if(!required.length)return toast('Add at least one required quest.');const optional=el('projectOptionalQuests').value.split(/\n+/).map(x=>x.trim()).filter(Boolean);if(editingProjectId&&state.quests.some(q=>q.projectId===project.id&&questHasEarnedProgress(q)))return toast('A linked quest already has earned progress. Reopen or undo that progress before rebuilding this Project map.');if(editingProjectId){state.projects=state.projects.filter(p=>p.id!==project.id);state.quests=state.quests.filter(q=>q.projectId!==project.id);}state.projects.push(project);const newQs=[...required.map(t=>makeProjectQuest(t,project,true,'workstream',projectDraftSubquests.get(t)||[])),...optional.map(t=>makeProjectQuest(t,project,false,'workstream',projectDraftSubquests.get(t)||[])),makeProjectQuest(project.finalQuestTitle,project,true,'final')];state.quests.push(...newQs);project.questIds=[...state.quests.filter(q=>q.projectId===project.id).map(q=>q.id)];if(creating)state.metrics.questsAccepted+=newQs.length;projectDraftSubquests.clear();saveState();renderAll();closeProjectDialog();toast(creating?'Project map created. Required quests now control the final objective.':'Project map updated without duplicating acceptance history.');}
function projectProgress(p){const qs=state.quests.filter(q=>q.projectId===p.id&&q.projectRole!=='final'&&q.projectRequired!==false);if(!qs.length)return 0;return Math.round(qs.filter(q=>q.status==='completed').length/qs.length*100)}
function projectFinalUnlocked(p){const required=state.quests.filter(q=>q.projectId===p.id&&q.projectRole!=='final'&&q.projectRequired!==false);return required.length>0&&required.every(q=>q.status==='completed')}
function projectQuestHtml(q,finalUnlocked){
  const completed=q.status==='completed',isFinal=q.projectRole==='final',locked=isFinal&&!finalUnlocked&&!completed;
  const subs=q.subquests||[],done=subs.filter(s=>s.status==='completed').length,progress=subs.length?Math.round(done/subs.length*100):0;
  return `<section class="project-work-item ${completed?'done':''} ${locked?'locked':''}" id="project-quest-${q.id}">
    <header><span class="project-work-sigil">${completed?'✓':locked?'🔒':isFinal?'⬢':'◇'}</span><div><span class="project-work-role">${isFinal?'FINAL OBJECTIVE':q.projectRequired===false?'OPTIONAL WORKSTREAM':'REQUIRED WORKSTREAM'}</span><h4>${escapeHtml(q.title)}</h4><small>${escapeHtml(q.category)} • ${formatEffort(q.estimatedMinutes)}${q.dueDate?` • ${friendlyDate(q.dueDate)}`:''}</small></div><span class="project-work-state">${completed?'CLEARED':locked?'LOCKED':'ACTIVE'}</span></header>
    ${locked?`<p class="project-lock-note">Clear every required workstream to unlock this final objective.</p>`:subs.length?`<div class="project-subquest-zone"><div class="project-subquest-progress"><span>${done}/${subs.length} steps</span><strong>${progress}%</strong></div><div class="project-track compact"><i style="width:${progress}%"></i></div><div class="project-subquest-list">${subs.map(s=>`<button type="button" class="project-subquest ${s.status==='completed'?'done':''}" data-project-quest="${q.id}" data-project-subquest="${s.id}" ${completed?'disabled':''}><i>${s.status==='completed'?'✓':'◇'}</i><span>${escapeHtml(s.title)}</span></button>`).join('')}</div></div>`:'<p class="project-lock-note">No smaller steps configured. Edit this workstream if you want a checklist.</p>'}
    <footer><button type="button" class="text-btn" data-project-quest-edit="${q.id}" ${completed?'disabled':''}>Edit Workstream</button><button type="button" class="${completed?'ghost-btn':'primary-btn'}" data-project-quest-complete="${q.id}" ${locked?'disabled':''}>${completed?'Reopen':'Complete'}</button></footer>
  </section>`;
}
function renderProjects(){
  if(!el('projectBoard'))return;
  state.projects||=[];
  el('projectCountBadge')&&(el('projectCountBadge').textContent=String(state.projects.filter(p=>p.status!=='completed').length));
  renderImpactCredit();
  if(!state.projects.length){el('projectBoard').innerHTML=`<article class="panel empty-state"><strong>No projects yet.</strong><span>Use a Project when one outcome needs several major workstreams before it can exist.</span><button class="primary-btn" data-project-create="1">Create First Project</button></article>`;return;}
  el('projectBoard').innerHTML=state.projects.map(p=>{
    const qs=state.quests.filter(q=>q.projectId===p.id),progress=projectProgress(p),unlocked=projectFinalUnlocked(p);
    const ordered=[...qs.filter(q=>q.projectRole!=='final'),...qs.filter(q=>q.projectRole==='final')];
    return `<article class="project-card project-workspace ${p.status==='completed'?'completed':''}" id="project-${p.id}"><div class="project-head"><div><span class="eyebrow">${escapeHtml(p.category)} PROJECT • ${escapeHtml(p.difficulty)}-CLASS</span><h3>${escapeHtml(p.title)}</h3><p>${escapeHtml(p.outcome||'Define the final outcome in Edit Project.')}</p></div><div class="project-progress-ring" style="--p:${progress}%"><strong>${progress}%</strong></div></div><div class="project-track"><i style="width:${progress}%"></i></div><div class="project-workspace-heading"><div><span class="eyebrow">PROJECT WORKSPACE</span><h4>Workstreams & steps</h4></div><small>${ordered.length} linked objective${ordered.length===1?'':'s'} • managed here</small></div><div class="project-work-list">${ordered.map(q=>projectQuestHtml(q,unlocked)).join('')}</div><div class="project-actions">${p.status==='completed'?`${!(state.impactCredits||[]).some(c=>c.projectId===p.id)?`<button data-impact-audit="${p.id}">Request Impact Audit</button>`:''}<span class="project-record-label">COMPLETED RECORD</span>`:`<button data-project-edit="${p.id}">Edit Map</button><button data-project-delete="${p.id}">Delete Project</button>`}</div></article>`;
  }).join('');
}
function syncProjectCompletion(){for(const p of state.projects||[]){const final=state.quests.find(q=>q.projectId===p.id&&q.projectRole==='final');if(final&&final.status==='completed'&&p.status!=='completed'){p.status='completed';p.completedAt=new Date().toISOString();const bonus=Math.round(250*(1+Number(p.impact||3)*.45)*(p.difficulty==='S'?2.2:p.difficulty==='A'?1.7:p.difficulty==='B'?1.3:1));p.completionXpAwarded=bonus;state.totalXp+=bonus;state.stats[canonicalArea(p.category)]=Number(state.stats[canonicalArea(p.category)]||0)+Math.round(bonus*.55);state.stats.Discipline=Number(state.stats.Discipline||0)+Math.round(bonus*.15);state.skills||={};for(const[key,w]of Object.entries(skillImpactForQuest({title:p.title,category:p.category,questType:'Main Quest',skillTags:['project delivery']})))state.skills[key]=(state.skills[key]||0)+Math.round(bonus*.35*Number(w));state.metrics.projectClears=(state.metrics.projectClears||0)+1;addActivity('project-clear',`PROJECT CLEARED • ${p.title}`,bonus,p.category,{projectId:p.id});queueSystemFlash('PROJECT CLEARED',p.title,`+${bonus.toLocaleString()} completion XP • outcome delivered`,'⬡','PROJECT PROTOCOL');}}}
function deleteProject(id){const p=state.projects.find(x=>x.id===id);if(!p)return;if(p.status==='completed'||Number(p.completionXpAwarded||0)>0)return toast('Completed Projects are permanent progression history and cannot be deleted.');const linked=state.quests.filter(q=>q.projectId===id),earned=linked.filter(questHasEarnedProgress);if(!confirm(`Delete project map “${p.title}”? Unstarted linked quests will be removed${earned.length?`; ${earned.length} quest${earned.length===1?'':'s'} with progress will be kept as standalone history`:''}.`))return;state.projects=state.projects.filter(x=>x.id!==id);state.quests=state.quests.filter(q=>q.projectId!==id||questHasEarnedProgress(q));for(const q of earned){q.projectId='';q.projectRole='';q.projectRequired=true;}saveState();renderAll();toast('Project map deleted without discarding earned progress.');}
async function analyzeProject(){const text=el('projectInput').value.trim();if(!text)return toast('Describe the outcome you want to build.');el('projectAiMode').textContent='ANALYZING';el('analyzeProjectButton').disabled=true;try{const r=await fetch('/api/project-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,context:buildAiContext(),forceLocal:state.profile?.aiPrivacyMode==='local'})});const p=await r.json();if(!r.ok)throw new Error(p.error||'Project analysis failed.');pendingProjectPlan=p.result;renderProjectAnalysis(p.result,p.mode); }catch(e){toast(e.message);el('projectAiMode').textContent='ERROR';}finally{el('analyzeProjectButton').disabled=false;}}
function renderProjectAnalysis(plan,mode='ai'){el('projectAiMode').textContent=mode==='ai'?'AI':'LOCAL';el('projectAnalysis').hidden=false;el('projectAnalysis').innerHTML=`<div class="project-analysis-card"><span class="eyebrow">PROPOSED PROJECT MAP</span><h4>${escapeHtml(plan.title)}</h4><p>${escapeHtml(plan.outcome||'')}</p><div>${(plan.requiredQuests||[]).map((q,i)=>`<div class="project-analysis-quest"><span>${String(i+1).padStart(2,'0')}</span><strong>${escapeHtml(typeof q==='string'?q:q.title)}</strong>${typeof q==='object'&&q.subquests?.length?`<small>${q.subquests.length} subquests</small>`:''}</div>`).join('')}</div><button id="acceptProjectPlan" class="primary-btn" style="margin-top:14px">Accept Project Map</button></div>`;}
function acceptProjectPlan(){const p=pendingProjectPlan;if(!p)return;openProjectDialog();el('projectTitle').value=p.title||'';el('projectCategory').value=availableCategories().includes(canonicalArea(p.category))?canonicalArea(p.category):(availableCategories()[0]||'Personal');el('projectDifficulty').value=['C','B','A','S'].includes(p.difficulty)?p.difficulty:'B';el('projectOutcome').value=p.outcome||'';el('projectDueDate').value=p.dueDate||'';el('projectImpact').value=String(Math.max(1,Math.min(5,Number(p.impact||3))));projectDraftSubquests.clear();for(const q of [...(p.requiredQuests||[]),...(p.optionalQuests||[])]){if(q&&typeof q==='object'&&q.title)projectDraftSubquests.set(q.title,Array.isArray(q.subquests)?q.subquests:[]);}el('projectRequiredQuests').value=(p.requiredQuests||[]).map(q=>typeof q==='string'?q:q.title).join('\n');el('projectOptionalQuests').value=(p.optionalQuests||[]).map(q=>typeof q==='string'?q:q.title).join('\n');el('projectFinalQuest').value=p.finalQuest||'Full-system validation and delivery';pendingProjectPlan=null;}


async function requestImpactAudit(projectId){
  const project=state.projects.find(p=>p.id===projectId); if(!project||project.status!=='completed')return toast('Complete the project before requesting an impact audit.');
  if((state.impactCredits||[]).some(c=>c.projectId===projectId))return toast('This project already has an impact-credit decision.');
  const evidence=prompt('Exceptional Impact Audit\\n\\nPaste a concise evidence summary: measured results, real users/beneficiaries, validation, research/publication, deployment, award, external review, or other objective proof. Unsupported claims receive zero credit.','');
  if(evidence===null)return;
  try{
    const quests=state.quests.filter(q=>q.projectId===projectId).map(q=>({title:q.title,status:q.status,difficulty:q.difficulty,estimatedMinutes:q.estimatedMinutes,category:q.category,successCriteria:q.successCriteria||'',suggestedEvidence:q.suggestedEvidence||[]}));
    const r=await fetch('/api/impact-audit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,quests,evidence:String(evidence).slice(0,4000)})});
    const payload=await r.json(); if(!r.ok)throw new Error(payload.error||'Impact audit failed.'); const result=payload.result;
    const available=Math.max(0,.05-totalImpactCreditPercent()); const requested=Math.max(0,Math.min(.01,Number(result.creditPercent||0))); const grant=result.eligible?Math.min(available,requested):0;
    state.impactCredits.push({id:crypto.randomUUID(),projectId,percent:grant,eligible:Boolean(result.eligible),score:Number(result.score||0),reason:String(result.reason||''),evidenceQuality:String(result.evidenceQuality||''),awardedAt:new Date().toISOString()});
    addActivity('impact-audit',`Impact audit • ${project.title} • ${grant?`+${(grant*100).toFixed(2)}%`:'NO CREDIT'}`,0,project.category,{projectId,score:result.score||0}); saveState();renderAll();
    if(grant)queueSystemFlash('EXCEPTIONAL IMPACT',`+${(grant*100).toFixed(2)}% S-Rank Credit`,result.reason||'Strict impact audit passed.','◆','IMPACT PROTOCOL'); else toast(`Impact audit: no S-Rank credit. ${result.reason||''}`);
  }catch(e){toast(e.message||'Impact audit failed.');}
}

// Wrap rendering and quest completion so project state stays coherent without duplicating XP.
const _renderAllV049 = renderAll;
renderAll = function(){ _renderAllV049(); renderProjects(); renderImpactCredit(); };
const _completeQuestV049 = completeQuest;
completeQuest = function(id){const q=state.quests.find(x=>x.id===id),project=q?.projectId?state.projects.find(p=>p.id===q.projectId):null;if(q?.status==='completed'&&project?.status==='completed')return toast('Completed Project quests are permanent progression history.');if(q?.projectRole==='final'&&q.status!=='completed'&&!projectFinalUnlocked(project))return toast('Final objective is locked until all required project quests are cleared.');_completeQuestV049(id);syncProjectCompletion();saveState();renderAll();};
