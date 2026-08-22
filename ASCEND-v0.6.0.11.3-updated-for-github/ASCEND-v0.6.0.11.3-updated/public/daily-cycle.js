(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.AscendDailyCycle=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const DAILY_TYPE='Daily Quest';

  function isDateKey(value){return /^20\d\d-\d\d-\d\d$/.test(String(value||''));}
  function addDays(dateKey,days=1){
    if(!isDateKey(dateKey))return '';
    const [year,month,day]=dateKey.split('-').map(Number);
    const date=new Date(Date.UTC(year,month-1,day+Number(days||0)));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;
  }
  function daysBetween(fromKey,toKey){
    if(!isDateKey(fromKey)||!isDateKey(toKey))return 0;
    const [fromYear,fromMonth,fromDay]=fromKey.split('-').map(Number);
    const [toYear,toMonth,toDay]=toKey.split('-').map(Number);
    return Math.max(0,Math.round((Date.UTC(toYear,toMonth-1,toDay)-Date.UTC(fromYear,fromMonth-1,fromDay))/86400000));
  }
  function scheduledDate(quest){
    if(isDateKey(quest?.dailyScheduledFor))return quest.dailyScheduledFor;
    if(isDateKey(quest?.dueDate))return quest.dueDate;
    return '';
  }
  function isLocked(quest,today){
    if(quest?.questType!==DAILY_TYPE||quest?.status!=='active')return false;
    const scheduled=scheduledDate(quest);
    return Boolean(scheduled&&isDateKey(today)&&scheduled>today);
  }
  function isCompletedOn(quest,dateKey){
    return quest?.questType===DAILY_TYPE&&Array.isArray(quest.dailyHistory)&&quest.dailyHistory.includes(dateKey);
  }
  function canUndoToday(quest,today){
    return quest?.questType===DAILY_TYPE&&quest?.status==='completed'&&isCompletedOn(quest,today);
  }
  function seriesId(quest){return String(quest?.dailySeriesId||quest?.id||'');}
  function hasOccurrence(quests,quest,dateKey){
    const series=seriesId(quest);
    return (quests||[]).some(item=>item?.questType===DAILY_TYPE&&seriesId(item)===series&&scheduledDate(item)===dateKey);
  }
  function createNextOccurrence(quest,completedOn,{id,createdAt}={}){
    const nextDate=addDays(completedOn,1);
    const next={
      ...quest,
      id:String(id||''),
      status:'active',
      createdAt:createdAt||new Date().toISOString(),
      completedAt:null,
      completionXpAwarded:0,
      dueDate:nextDate,
      dailyScheduledFor:nextDate,
      dailySeriesId:seriesId(quest),
      dailyPreviousId:String(quest?.id||''),
      dailyGenerated:true,
      dailyMissedCount:0,
      dailyLastMissedFrom:'',
      dailyLastRolledAt:'',
      dailyHistory:[],
      dailyAwards:{},
      lastCompletedAt:null,
      subquests:(quest?.subquests||[]).map((sub,index)=>({...sub,status:'active',completedAt:null,xpAwarded:0,order:index}))
    };
    return next;
  }
  function rollForwardMissedOccurrence(quest,today,{rolledAt}={}){
    if(quest?.questType!==DAILY_TYPE||quest?.status!=='active'||!isDateKey(today))return null;
    const scheduled=scheduledDate(quest);
    if(!isDateKey(scheduled)||scheduled>=today)return null;
    const missedDays=daysBetween(scheduled,today);
    return {
      ...quest,
      dueDate:today,
      dailyScheduledFor:today,
      dailyMissedCount:Math.max(0,Number(quest.dailyMissedCount)||0)+missedDays,
      dailyLastMissedFrom:scheduled,
      dailyLastRolledAt:rolledAt||new Date().toISOString()
    };
  }

  return Object.freeze({DAILY_TYPE,isDateKey,addDays,daysBetween,scheduledDate,isLocked,isCompletedOn,canUndoToday,seriesId,hasOccurrence,createNextOccurrence,rollForwardMissedOccurrence});
});
