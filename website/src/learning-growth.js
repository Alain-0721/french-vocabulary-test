export const growthDay=at=>at?new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(at)):'此前积累';

// Keep source history, but each word contributes to growth only once across sources.
export function firstAchievements(events){
  const first=new Map();
  for(const e of events){
    const previous=first.get(e.wordId),time=e.at?Date.parse(e.at):-Infinity;
    const before=previous?.at?Date.parse(previous.at):-Infinity;
    if(!previous||time<before||time===before&&e.source==='study')first.set(e.wordId,e);
  }
  return first;
}

const validGrowthTime=at=>typeof at==='string'&&Number.isFinite(Date.parse(at));
const growthTime=at=>validGrowthTime(at)?Date.parse(at):-Infinity;

// One effective judgment per completed self-test round or objective-test round.
export function growthJudgments(main,secondary={}){
  const rows=[];let order=0;
  for(const attempt of main?.attempts||[]){
    const recorded=Object.entries(attempt.judgments||{}),recordedWords=new Set();
    for(const [roundKey,row] of recorded){
      if(!row||!['good','bad'].includes(row.vote))continue;
      recordedWords.add(row.wordId);
      rows.push({wordId:row.wordId,vote:row.vote,at:validGrowthTime(row.at)?row.at:null,source:'study',roundId:roundKey,order:order++});
    }
    for(const [wordId,vote] of Object.entries(attempt.votes||{})){
      if(recordedWords.has(wordId))continue;
      if(!['good','bad'].includes(vote))continue;
      const at=validGrowthTime(attempt.votesAt?.[wordId])?attempt.votesAt[wordId]:validGrowthTime(attempt.createdAt)?attempt.createdAt:null;
      rows.push({wordId,vote,at,source:'study',roundId:`attempt:${attempt.id}`,order:order++});
    }
  }
  for(const test of secondary.wordTests?.history||[]){
    if(test.source!=='study'||!validGrowthTime(test.completedAt))continue;
    for(const question of test.questions||[]){
      const answer=test.answers?.[question.wordId];
      if(answer===undefined)continue;
      rows.push({wordId:question.wordId,vote:answer===question.correct?'good':'bad',at:test.completedAt,source:'study',roundId:`test:${test.id}`,order:order++});
    }
  }
  return rows.sort((a,b)=>growthTime(a.at)-growthTime(b.at)||a.order-b.order);
}

const calendarDate=milliseconds=>new Date(milliseconds).toISOString().slice(0,10);
const calendarTime=date=>Date.parse(date+'T00:00:00Z');
function periodStart(date,period){
  if(period==='month')return date.slice(0,7)+'-01';
  const time=calendarTime(date);
  return period==='week'?calendarDate(time-((new Date(time).getUTCDay()+6)%7)*86400000):date;
}
function shiftPeriod(date,amount,period){
  const time=calendarTime(date);
  if(period==='month'){const d=new Date(time);return calendarDate(Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+amount,1));}
  return calendarDate(time+amount*(period==='week'?7:1)*86400000);
}
export const growthPeriodStart=periodStart;
export const shiftGrowthPeriod=shiftPeriod;
export const GROWTH_VIEW_DEFAULTS=Object.freeze({mode:'daily',source:'all',ranges:{daily:7,weekly:8,monthly:6,cumulative:7}});
export function normalizeGrowthView(raw){
  const base=GROWTH_VIEW_DEFAULTS,ranges={...base.ranges};
  for(const [mode,allowed] of Object.entries({daily:[7,30,90],weekly:[8,12,26],monthly:[6,12,24],cumulative:[7,30,90]}))if(allowed.includes(raw?.ranges?.[mode]))ranges[mode]=raw.ranges[mode];
  return {mode:Object.hasOwn(ranges,raw?.mode)?raw.mode:base.mode,source:['all','study','mistakes'].includes(raw?.source)?raw.source:base.source,ranges};
}
export const growthViewKey=bookId=>'franlumi:growth-view:v1:'+encodeURIComponent(bookId);
export function loadGrowthView(storage,bookId){try{return normalizeGrowthView(JSON.parse(storage.getItem(growthViewKey(bookId))));}catch{return normalizeGrowthView();}}
export function saveGrowthView(storage,bookId,value){try{storage.setItem(growthViewKey(bookId),JSON.stringify(normalizeGrowthView(value)));return true;}catch{return false;}}

// Compare current weeks/months through the same weekday/day of the previous period.
export function growthComparison(events,{date,period='day',source='all',today=growthDay(new Date().toISOString()),startedAt}={}){
  const start=periodStart(date,period),next=shiftPeriod(start,1,period),calendarEnd=calendarDate(calendarTime(next)-86400000);
  const end=calendarEnd<today?calendarEnd:today,previousStart=shiftPeriod(start,-1,period),previousLast=calendarDate(calendarTime(start)-86400000);
  const elapsed=Math.round((calendarTime(end)-calendarTime(start))/86400000);
  const previousEnd=calendarEnd>today?calendarDate(Math.min(calendarTime(previousLast),calendarTime(previousStart)+elapsed*86400000)):previousLast;
  const startedDay=[today,...events.filter(e=>e.at).map(e=>growthDay(e.at)),...(startedAt?[growthDay(startedAt)]:[])].sort()[0];
  let current=0,previous=0;
  for(const e of firstAchievements(events).values()){
    if(!e.at||source!=='all'&&e.source!==source)continue;
    const day=growthDay(e.at);
    if(day>=start&&day<=end)current++;
    if(day>=previousStart&&day<=previousEnd)previous++;
  }
  const available=start<=today&&previousStart>=startedDay;
  return {current,previous,delta:available?current-previous:null,available,start,end,previousStart,previousEnd,label:period==='week'?'较上周同期':period==='month'?'较上月同期':'较前一日'};
}

export function growthSeries(events,{days=7,period='day',periods=days,source='all',today=growthDay(new Date().toISOString()),startedAt,anchor=today,reviews=[]}={}){
  const first=firstAchievements(events),counts=new Map(),legacy=new Set(),consolidations=new Map();
  const recordedDays=events.filter(e=>e.at).map(e=>growthDay(e.at));
  const startedDay=[today,...recordedDays,...(startedAt?[growthDay(startedAt)]:[])].sort()[0];
  const achievements=[...first.values()].filter(e=>source==='all'||e.source===source);
  const reviewByDay=new Map();
  for(const e of reviews){
    if(!e.at||source!=='all'&&e.source!==source)continue;
    const date=growthDay(e.at);
    if(!reviewByDay.has(date))reviewByDay.set(date,new Set());
    reviewByDay.get(date).add(e.wordId);
  }
  for(const e of achievements){
    if(!e.at){legacy.add(e.wordId);continue;}
    const date=growthDay(e.at);
    if(!counts.has(date))counts.set(date,new Set());
    counts.get(date).add(e.wordId);
  }
  for(const e of events){
    if(e.source!=='mistakes'||!e.at||first.get(e.wordId)===e||source==='study')continue;
    const date=growthDay(e.at);
    if(!consolidations.has(date))consolidations.set(date,new Set());
    consolidations.get(date).add(e.wordId);
  }
  const lastStart=periodStart(anchor<today?anchor:today,period),points=[];
  const firstDay=shiftPeriod(lastStart,1-periods,period);
  const cumulativeIds=new Set(legacy);
  for(const [date,ids] of counts)if(date<firstDay)for(const id of ids)cumulativeIds.add(id);
  const breakdown=ids=>ids.reduce((n,id)=>{n[first.get(id).source]++;return n;},{study:0,mistakes:0});
  for(let i=0;i<periods;i++){
    const date=shiftPeriod(firstDay,i,period),next=shiftPeriod(date,1,period);
    const calendarEnd=calendarDate(calendarTime(next)-86400000),endDate=calendarEnd<today?calendarEnd:today,known=endDate>=startedDay;
    const ids=[],consolidatedIds=new Set(),reviewIds=new Set();
    for(const [day,words] of counts)if(day>=date&&day<=endDate)ids.push(...words);
    for(const [day,words] of consolidations)if(day>=date&&day<=endDate)for(const id of words)consolidatedIds.add(id);
    for(const [day,words] of reviewByDay)if(day>=date&&day<=endDate)for(const id of words)reviewIds.add(id);
    for(const id of ids)cumulativeIds.add(id);
    const label=period==='month'?date.slice(0,7):period==='week'?date+' ~ '+endDate:date;
    const axisLabel=period==='month'?date.slice(0,7).replace('-','/'):date.slice(5).replace('-','/');
    points.push({date,endDate,label,axisLabel,count:known?ids.length:null,cumulative:known?cumulativeIds.size:null,ids,cumulativeIds:[...cumulativeIds],sourceCounts:breakdown(ids),cumulativeSourceCounts:breakdown([...cumulativeIds]),consolidatedIds:[...consolidatedIds],reviewIds:[...reviewIds],reviewCount:known?reviewIds.size:null,partial:known&&(date<startedDay||calendarEnd>today)});
  }
  const totalCount=legacy.size+[...counts].filter(([date])=>date<=today).reduce((n,[,ids])=>n+ids.size,0);
  const totalReviewCount=new Set([...reviewByDay].filter(([date])=>date<=today).flatMap(([,ids])=>[...ids])).size;
  return {points,legacyCount:legacy.size,totalCount,startedDay,todayCount:counts.get(today)?.size||0,todayReviewCount:reviewByDay.get(today)?.size||0,totalReviewCount};
}
export function growthCandidates(main,secondary={}){
  const result=[],rounds=new Map();
  for(const judgment of growthJudgments(main,secondary)){
    if(!rounds.has(judgment.wordId))rounds.set(judgment.wordId,[]);
    rounds.get(judgment.wordId).push(judgment);
  }
  for(const [wordId,attempts] of rounds){
    if(attempts.length<3)continue;
    const recent=attempts.slice(-5),bad=recent.filter(e=>e.vote==='bad').length;
    if(recent.at(-1)?.vote==='good'&&bad*10<recent.length*3)result.push({wordId,source:'study'});
  }
  for(const wordId of new Set(secondary.consolidatedMistakes||[]))result.push({wordId,source:'mistakes'});
  return result;
}

// A correct review is a later dated correct judgment of a word that already achieved growth.
export function growthReviewEvents(main,secondary={}){
  const achievements=firstAchievements(secondary.growth?.events||[]),events=[];
  for(const judgment of growthJudgments(main,secondary)){
    if(judgment.vote!=='good'||!judgment.at)continue;
    const achieved=achievements.get(judgment.wordId);
    if(!achieved||achieved.at&&Date.parse(judgment.at)<=Date.parse(achieved.at))continue;
    events.push({wordId:judgment.wordId,source:judgment.source,at:judgment.at});
  }
  return events;
}
// Record the first achievement for each source. Legacy records have no invented date.
export function collectGrowth(main,secondary={},at=new Date().toISOString()){
  const previous=secondary.growth,events=previous?.events||[],known=new Set(events.map(e=>e.source+':'+e.wordId));
  const added=growthCandidates(main,secondary).filter(e=>!known.has(e.source+':'+e.wordId)).map(e=>({...e,at:previous?at:null}));
  if(previous?.startedAt&&!added.length)return previous;
  const startedAt=previous?.startedAt||new Date(Math.min(Date.parse(at),...events.filter(e=>e.at).map(e=>Date.parse(e.at)))).toISOString();
  return {version:1,startedAt,events:[...events,...added]};
}
export function restoreGrowth(raw,book){
  if(!raw)return undefined;
  const ids=new Set(book.bank.map(e=>e.id));
  if(raw.version!==1||raw.startedAt!==undefined&&(typeof raw.startedAt!=='string'||!Number.isFinite(Date.parse(raw.startedAt)))||!Array.isArray(raw.events)||raw.events.length>ids.size*2||raw.events.some(e=>!ids.has(e.wordId)||!['study','mistakes'].includes(e.source)||e.at!==null&&(typeof e.at!=='string'||!Number.isFinite(Date.parse(e.at))))||new Set(raw.events.map(e=>e.source+':'+e.wordId)).size!==raw.events.length)throw Error('成长之路记录无效。');
  return structuredClone(raw);
}
