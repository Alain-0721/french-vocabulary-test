import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createWordTest,answerWordTest,nextWordTest,recordWordTest,testScore,validWordTest} from '../src/word-test.js';
import {collectGrowth,growthCandidates,growthDay,growthSeries,firstAchievements,growthComparison,growthReviewEvents,loadGrowthView,saveGrowthView,normalizeGrowthView,shiftGrowthPeriod} from '../src/learning-growth.js';
import {manualMistakeRound,validMistakeRound,withTestResults,mistakeIds,applyJudge} from '../src/mistake-review.js';
import * as Study from '../src/preview-study.js';
import {readBackup,fullBackup} from '../src/preview-backup.js';
import {initialBooks} from '../src/books.js';

const book=initialBooks.find(b=>b.id==='edito-b1'),ids=book.bank.slice(0,7).map(e=>e.id);
const options={source:'study',scope:'U1 · P1 · 第一主题'};
function complete(q,bad=false){
 while(!q.completedAt){const x=q.questions[q.index];q=answerWordTest(q,bad?(x.correct+1)%x.options.length:x.correct);if(!q.completedAt)q=nextWordTest(q);}
 return q;
}
test('mixed questions cover exactly the requested group, use current book and roundtrip both directions',()=>{
 for(const direction of ['fr-zh','zh-fr'])for(const kind of ['choice','judgement','mixed']){
  const q=createWordTest(book,ids,{...options,kind,direction});
  assert.deepEqual(new Set(q.questions.map(x=>x.wordId)),new Set(ids));
  assert.ok(validWordTest(q,book));
  const answered=complete(q);
  assert.ok(validWordTest(answered,book));assert.equal(testScore(answered).good,ids.length);
 }
});
test('ambiguous duplicate prompts do not become incorrect distractors',()=>{
 const ambiguous={bank:[{id:'a',fr:'salut',zh:'你好'},{id:'b',fr:'salut',zh:'再见'},{id:'c',fr:'livre',zh:'书'},{id:'d',fr:'eau',zh:'水'}]};
 for(let n=0;n<25;n++){
  const q=createWordTest(ambiguous,['a'],options);
  assert.ok(!q.questions[0].options.includes('再见'));assert.ok(validWordTest(q,ambiguous));
 }
 assert.throws(()=>createWordTest({bank:[ambiguous.bank[0]]},['a'],options),/无法生成/);
});
test('answering and completion are idempotent, self-ratings are untouched',()=>{
 const main=Study.create(book.bank),before=structuredClone(main);
 let q=createWordTest(book,ids,options);const x=q.questions[0];
 q=answerWordTest(q,x.correct);assert.equal(answerWordTest(q,(x.correct+1)%x.options.length),q);
 q=complete(q);let tests=recordWordTest({},q);assert.equal(tests.serial,1);assert.equal(recordWordTest(tests,q),tests);
 assert.deepEqual(testScore(q),{done:7,good:7,bad:0,total:7});
 assert.deepEqual(main,before);assert.equal(tests.stats.study[ids[0]].good,1);
});
test('growth requires three rounds, a recent rate strictly below 30 percent and a correct latest judgment',()=>{
 const main={attempts:[]};let seq=0;
 const judge=(wordId,vote)=>{seq++;main.attempts.push({id:'round-'+seq,votes:{[wordId]:vote},votesAt:{[wordId]:`2026-09-${String(seq).padStart(2,'0')}T08:00:00Z`}});};
 for(const vote of ['good','good','good'])judge(ids[0],vote);
 for(const vote of ['good','good','bad'])judge(ids[1],vote);
 for(const vote of ['bad','bad','good','good','good','good','good'])judge(ids[2],vote);
 for(const vote of ['good','good','good','good','good','good','good','good','bad','bad','good'])judge(ids[3],vote);
 for(const vote of ['good','good'])judge(ids[4],vote);
 const own={consolidatedMistakes:[ids[5]]};
 const found=growthCandidates(main,own);
 assert.deepEqual(found.map(e=>e.wordId),[ids[0],ids[2],ids[5]]);
 own.growth=collectGrowth(main,own);assert.ok(own.growth.events.every(e=>e.at===null));
 assert.equal(collectGrowth(main,own),own.growth);
 judge(ids[1],'good');judge(ids[1],'good');
 const next=collectGrowth(main,own,'2026-10-27T18:00:00Z');
 assert.equal(next.events.at(-1).wordId,ids[1]);
 assert.equal(next.events.at(-1).at,'2026-10-27T18:00:00Z');assert.equal(growthDay(next.events.at(-1).at),'2026-10-28');
 assert.equal(growthDay(null),'此前积累');
});

test('effective review counts later correct judgments of achieved words once per period',()=>{
 const events=[{wordId:ids[0],source:'study',at:'2026-10-10T10:00:00Z'},{wordId:ids[1],source:'study',at:'2026-10-10T10:00:00Z'}];
 const attempt=(id,wordId,vote,at)=>({id,votes:{[wordId]:vote},votesAt:{[wordId]:at}});
 const main={attempts:[
  attempt('a1',ids[0],'good','2026-10-10T09:00:00Z'),
  attempt('a2',ids[0],'good','2026-10-11T09:00:00Z'),
  attempt('a3',ids[0],'good','2026-10-11T12:00:00Z'),
  attempt('a4',ids[0],'bad','2026-10-11T13:00:00Z'),
  attempt('a5',ids[0],'good','2026-10-12T09:00:00Z'),
  attempt('b1',ids[1],'good','2026-10-11T10:00:00Z')
 ]};
 const secondary={growth:{version:1,startedAt:'2026-10-01T00:00:00Z',events}};
 const reviews=growthReviewEvents(main,secondary);
 assert.equal(reviews.filter(e=>e.wordId===ids[0]).length,3);
 assert.equal(reviews.filter(e=>e.wordId===ids[1]).length,1);
 const series=growthSeries(events,{days:3,today:'2026-10-11',startedAt:'2026-10-01T00:00:00Z',reviews});
 assert.equal(series.todayReviewCount,2);
 assert.equal(series.points.at(-1).reviewCount,2);
 assert.equal(series.totalReviewCount,2);
});

test('group retests count as distinct growth rounds',()=>{
 const main=Study.create(book.bank),wordId=Study.active(main).ids[0];
 const rate=()=>{Study.toggle(main,wordId);Study.vote(main,wordId,'good');};
 rate();Study.repeatGroup(main,book.bank);
 rate();Study.repeatGroup(main,book.bank);
 rate();
 assert.equal(Object.keys(Study.active(main).judgments).length,3);
 assert.deepEqual(growthCandidates(main,{}),[{wordId,source:'study'}]);
});

test('daily growth curve deduplicates both sources and fills missing calendar dates with zero',()=>{
 const events=[
  {wordId:'a',source:'study',at:'2026-10-25T10:00:00Z'},
  {wordId:'a',source:'mistakes',at:'2026-10-25T11:00:00Z'},
  {wordId:'b',source:'study',at:'2026-10-27T16:01:00Z'},
  {wordId:'c',source:'mistakes',at:'2026-10-28T10:00:00Z'},
  {wordId:'legacy',source:'study',at:null},
 ];
 const s=growthSeries(events,{days:7,today:'2026-10-28'});
 assert.equal(s.points.length,7);assert.equal(s.points[0].date,'2026-10-22');
 assert.deepEqual(s.points.map(p=>p.count),[null,null,null,1,0,0,2]);
 assert.deepEqual(s.points[3].ids,['a']);assert.equal(s.legacyCount,1);
 assert.deepEqual(growthSeries(events,{days:7,source:'study',today:'2026-10-28'}).points.map(p=>p.count),[null,null,null,1,0,0,1]);
 assert.equal(growthSeries(events,{days:7,source:'mistakes',today:'2026-10-28'}).legacyCount,0);
});

test('growth date ranges cross months and leap days, excluding future and out-of-range events',()=>{
 const s=growthSeries([
  {wordId:'a',source:'study',at:'2024-02-28T16:00:00Z'},
  {wordId:'b',source:'study',at:'2024-03-02T02:00:00Z'},
  {wordId:'c',source:'study',at:'2024-01-01T02:00:00Z'},
 ],{days:3,today:'2024-03-01'});
 assert.deepEqual(s.points.map(p=>p.date),['2024-02-28','2024-02-29','2024-03-01']);
 assert.deepEqual(s.points.map(p=>p.count),[0,1,0]);
 const empty=growthSeries([],{days:90,today:'2026-10-28'});
 assert.ok(empty.points.slice(0,-1).every(p=>p.count===null));assert.equal(empty.points.at(-1).count,0);
});

test('first mastery deduplicates across dates and sources; later consolidation stays separate',()=>{
 const events=[
  {wordId:'a',source:'mistakes',at:'2026-10-28T10:00:00Z'},
  {wordId:'a',source:'study',at:'2026-10-25T10:00:00Z'},
  {wordId:'b',source:'mistakes',at:'2026-10-27T10:00:00Z'},
  {wordId:'b',source:'study',at:'2026-10-28T10:00:00Z'},
  {wordId:'old',source:'study',at:null},
  {wordId:'old',source:'mistakes',at:'2026-10-28T11:00:00Z'},
 ];
 const original=structuredClone(events),first=firstAchievements(events);
 assert.equal(first.size,3);assert.equal(first.get('a').source,'study');assert.equal(first.get('b').source,'mistakes');assert.equal(first.get('old').at,null);
 const all=growthSeries(events,{today:'2026-10-28'});
 assert.equal(all.totalCount,3);assert.equal(all.legacyCount,1);
 assert.equal(all.points.reduce((n,p)=>n+(p.count||0),0),2);
 assert.deepEqual(all.points.at(-1).consolidatedIds,['a','old']);
 const study=growthSeries(events,{today:'2026-10-28',source:'study'}),mistakes=growthSeries(events,{today:'2026-10-28',source:'mistakes'});
 assert.equal(study.totalCount,2);assert.equal(mistakes.totalCount,1);
 assert.equal(study.points.at(-1).count,0);assert.equal(mistakes.points.at(-1).count,0);
 assert.deepEqual(events,original);
});

test('cumulative mastery includes prior and undated words while daily counts cover only the selected period',()=>{
 const events=[{wordId:'old',source:'study',at:null},{wordId:'a',source:'study',at:'2026-09-01T10:00:00Z'},{wordId:'b',source:'mistakes',at:'2026-10-27T10:00:00Z'}];
 const s=growthSeries(events,{days:7,today:'2026-10-28',startedAt:'2026-09-01T00:00:00Z'});
 assert.deepEqual(s.points.map(p=>p.cumulative),[2,2,2,2,2,3,3]);
 assert.deepEqual(s.points.map(p=>p.count),[0,0,0,0,0,1,0]);assert.equal(s.totalCount,3);
 const noEvents=growthSeries([],{days:7,today:'2026-10-28',startedAt:'2026-10-26T10:00:00Z'});
 assert.deepEqual(noEvents.points.map(p=>p.count),[null,null,null,null,0,0,0]);
 assert.deepEqual(noEvents.points.map(p=>p.cumulative),[null,null,null,null,0,0,0]);
});

test('recording start migrates without deleting legacy source history and survives backup',()=>{
 const main=Study.create(book.bank),at='2026-10-28T10:00:00Z';
 const previous={version:1,events:[{wordId:ids[0],source:'study',at:'2026-10-25T10:00:00Z'},{wordId:ids[0],source:'mistakes',at:'2026-10-28T09:00:00Z'}]};
 const migrated=collectGrowth(main,{growth:previous},at);
 assert.equal(migrated.startedAt,'2026-10-25T10:00:00.000Z');assert.deepEqual(migrated.events,previous.events);
 assert.equal(collectGrowth(main,{growth:migrated},at),migrated);
 const raw=fullBackup([book],{[book.id]:main},Study.DEFAULT_SETTINGS,book.id,{[book.id]:{growth:migrated}},'light');
 assert.deepEqual(readBackup(raw,[book],{}).secondary[book.id].growth,migrated);
 raw.secondary[book.id].growth.startedAt='not-a-date';assert.throws(()=>readBackup(raw,[book],{}));
});

test('weekly growth uses Monday to Sunday, crosses the year and deduplicates first mastery',()=>{
 const events=[
  {wordId:'a',source:'study',at:'2025-12-28T15:59:00Z'},
  {wordId:'b',source:'study',at:'2025-12-28T16:00:00Z'},
  {wordId:'a',source:'mistakes',at:'2026-01-01T08:00:00Z'},
  {wordId:'c',source:'mistakes',at:'2026-01-04T15:59:00Z'},
  {wordId:'d',source:'study',at:'2026-01-04T16:00:00Z'},
  {wordId:'future',source:'study',at:'2026-01-07T01:00:00Z'},
 ];
 const original=structuredClone(events);
 const s=growthSeries(events,{period:'week',periods:4,today:'2026-01-06',startedAt:'2025-12-22T00:00:00Z'});
 assert.deepEqual(s.points.map(p=>p.date),['2025-12-15','2025-12-22','2025-12-29','2026-01-05']);
 assert.deepEqual(s.points.map(p=>p.count),[null,1,2,1]);
 assert.equal(s.points[1].endDate,'2025-12-28');assert.equal(s.points[2].endDate,'2026-01-04');
 assert.equal(s.points[3].endDate,'2026-01-06');assert.equal(s.points[3].partial,true);
 assert.deepEqual(s.points[2].consolidatedIds,['a']);assert.deepEqual(s.points[2].ids,['b','c']);
 assert.equal(s.totalCount,4);assert.equal(s.todayCount,0);assert.deepEqual(events,original);
 const monday=growthSeries(events,{period:'week',periods:2,today:'2026-01-05'});
 assert.equal(monday.points.at(-1).date,'2026-01-05');assert.equal(monday.points.at(-1).count,1);assert.equal(monday.todayCount,1);
 const filtered=growthSeries(events,{period:'week',periods:4,today:'2026-01-06',source:'mistakes'});
 assert.equal(filtered.totalCount,1);assert.equal(filtered.points[2].count,1);
});

test('monthly growth uses natural months, handles leap years and unknown history',()=>{
 const events=[
  {wordId:'legacy',source:'study',at:null},
  {wordId:'a',source:'study',at:'2023-12-31T15:59:00Z'},
  {wordId:'b',source:'study',at:'2023-12-31T16:00:00Z'},
  {wordId:'c',source:'study',at:'2024-02-29T15:59:00Z'},
  {wordId:'d',source:'mistakes',at:'2024-02-29T16:00:00Z'},
  {wordId:'c',source:'mistakes',at:'2024-03-01T04:00:00Z'},
 ];
 const s=growthSeries(events,{period:'month',periods:5,today:'2024-03-01',startedAt:'2023-12-10T08:00:00Z'});
 assert.deepEqual(s.points.map(p=>p.date),['2023-11-01','2023-12-01','2024-01-01','2024-02-01','2024-03-01']);
 assert.deepEqual(s.points.map(p=>p.count),[null,1,1,1,1]);
 assert.deepEqual(s.points.map(p=>p.cumulative),[null,2,3,4,5]);
 assert.equal(s.points[3].endDate,'2024-02-29');assert.equal(s.points[3].label,'2024-02');
 assert.equal(s.points[4].endDate,'2024-03-01');assert.equal(s.points[4].partial,true);
 assert.equal(s.todayCount,1);assert.equal(s.legacyCount,1);assert.equal(s.totalCount,5);
 assert.deepEqual(s.points[4].consolidatedIds,['c']);
 const empty=growthSeries([],{period:'month',periods:6,today:'2026-10-28',startedAt:'2026-08-15T08:00:00Z'});
 assert.deepEqual(empty.points.map(p=>p.count),[null,null,null,0,0,0]);
 assert.equal(empty.points[3].partial,true);
});

test('same-period comparison aligns current weeks and months and rejects insufficient history',()=>{
 const events=[
  {wordId:'a',source:'study',at:'2026-10-19T09:00:00Z'},
  {wordId:'b',source:'study',at:'2026-10-21T09:00:00Z'},
  {wordId:'c',source:'study',at:'2026-10-23T09:00:00Z'},
  {wordId:'d',source:'study',at:'2026-10-26T09:00:00Z'},
  {wordId:'e',source:'mistakes',at:'2026-10-28T09:00:00Z'},
  {wordId:'f',source:'study',at:'2026-10-28T10:00:00Z'},
  {wordId:'a',source:'mistakes',at:'2026-10-28T11:00:00Z'},
 ];
 const options={today:'2026-10-28',date:'2026-10-26',period:'week',startedAt:'2026-09-01T00:00:00Z'};
 const w=growthComparison(events,options);
 assert.deepEqual([w.current,w.previous,w.delta],[3,2,1]);
 assert.equal(w.previousStart,'2026-10-19');assert.equal(w.previousEnd,'2026-10-21');
 assert.equal(growthComparison(events,{...options,source:'mistakes'}).current,1);
 assert.equal(growthComparison(events,{...options,date:'2026-10-19',startedAt:'2026-10-20T00:00:00Z'}).available,false);
 const m=growthComparison([{wordId:'x',source:'study',at:'2024-02-29T09:00:00Z'},{wordId:'y',source:'study',at:'2024-03-31T09:00:00Z'}],{today:'2024-03-31',date:'2024-03-01',period:'month',startedAt:'2024-01-01T00:00:00Z'});
 assert.equal(m.previousEnd,'2024-02-29');assert.equal(m.delta,0);
 const current=growthComparison([{wordId:'x',source:'study',at:'2026-09-29T09:00:00Z'},{wordId:'y',source:'study',at:'2026-09-28T09:00:00Z'}],{today:'2026-10-28',date:'2026-10-01',period:'month',startedAt:'2026-09-01T00:00:00Z'});
 assert.equal(current.previousEnd,'2026-09-28');assert.equal(current.previous,1);
});

test('historical windows keep live totals but show historical cumulative and source breakdowns',()=>{
 const events=[{wordId:'old',source:'study',at:null},{wordId:'a',source:'study',at:'2026-09-01T09:00:00Z'},{wordId:'b',source:'mistakes',at:'2026-09-28T09:00:00Z'},{wordId:'c',source:'study',at:'2026-10-28T09:00:00Z'}];
 const historical=growthSeries(events,{period:'month',periods:6,today:'2026-10-28',anchor:'2026-09-01',startedAt:'2026-09-01T00:00:00Z'});
 assert.equal(historical.points.at(-1).label,'2026-09');assert.equal(historical.totalCount,4);assert.equal(historical.todayCount,1);
 assert.equal(historical.points.at(-1).count,2);assert.equal(historical.points.at(-1).cumulative,3);
 assert.deepEqual(historical.points.at(-1).sourceCounts,{study:1,mistakes:1});assert.deepEqual(historical.points.at(-1).cumulativeSourceCounts,{study:2,mistakes:1});
 assert.deepEqual(new Set(historical.points.at(-1).cumulativeIds),new Set(['old','a','b']));
 assert.equal(shiftGrowthPeriod('2026-01-01',-1,'month'),'2025-12-01');
 assert.equal(shiftGrowthPeriod('2026-01-05',-1,'week'),'2025-12-29');
 assert.equal(growthSeries(events,{today:'2026-10-28',anchor:'2027-01-01'}).points.at(-1).date,'2026-10-28');
});

test('view preferences persist per book, normalize invalid values, and tolerate denied storage',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const prefs={mode:'monthly',source:'mistakes',ranges:{daily:30,weekly:12,monthly:24,cumulative:90}};
 assert.equal(saveGrowthView(storage,'one',prefs),true);assert.deepEqual(loadGrowthView(storage,'one'),prefs);
 assert.equal(loadGrowthView(storage,'two').mode,'daily');
 assert.deepEqual(normalizeGrowthView({mode:'bad',source:'foreign',ranges:{daily:999,weekly:12}}),{mode:'daily',source:'all',ranges:{daily:7,weekly:12,monthly:6,cumulative:7}});
 const denied={getItem:()=>{throw Error('denied');},setItem:()=>{throw Error('denied');}};
 assert.equal(loadGrowthView(denied,'one').mode,'daily');assert.equal(saveGrowthView(denied,'one',prefs),false);
});
test('three distinct study tests qualify for growth; errors at exactly half qualify for mistake review',()=>{
 const main=Study.create(book.bank);let tests={};
 for(let i=0;i<3;i++)tests=recordWordTest(tests,complete(createWordTest(book,[ids[0]],options)));
 assert.deepEqual(growthCandidates(main,{wordTests:tests}),[{wordId:ids[0],source:'study'}]);
 let wrong={};for(let i=0;i<4;i++)wrong=recordWordTest(wrong,complete(createWordTest(book,[ids[1]],options),i%2===0));
 assert.deepEqual(mistakeIds(withTestResults(main,wrong,book.bank)),[ids[1]]);
 assert.equal(main.stats[ids[1]],undefined);
});
test('manual mistakes can include unseen Parts and removal preserves other words and reviews',()=>{
 const main=Study.create(book.bank),unseen=book.bank.find(e=>Study.key(e)==='U4P2').id;
 const q=manualMistakeRound(main,book.bank,[ids[0],unseen]);
 assert.equal(q.parts.length,2);assert.ok(validMistakeRound(q,main,book.bank));
 q.group=1;
 const samePart=manualMistakeRound(main,book.bank,[ids[1],unseen],q);
 assert.equal(samePart.parts[samePart.group].part,'U4P2');
 const next=manualMistakeRound(main,book.bank,[unseen],q);assert.deepEqual(next.ids,[unseen]);
 assert.equal(manualMistakeRound(main,book.bank,[],next),null);
 assert.deepEqual(main.stats,{});
});
test('new records survive full restore; corrupt answers, counts, flags and foreign IDs reject atomically',()=>{
 const main=Study.create(book.bank);let q=complete(createWordTest(book,ids,options)),tests=recordWordTest({},q);tests.current=q;
 const manual=[book.bank.find(e=>Study.key(e)==='U4P2').id],consolidatedMistakes=[ids[0]],own={wordTests:tests,manualMistakes:manual,consolidatedMistakes,manualQuiz:manualMistakeRound(main,book.bank,manual),growth:{version:1,events:[{wordId:ids[0],source:'study',at:null}]}};
 const raw=fullBackup([book],{[book.id]:main},Study.DEFAULT_SETTINGS,book.id,{[book.id]:own},'light');
 const restored=readBackup(raw,[book],{}).secondary[book.id];
 assert.deepEqual(restored.wordTests,tests);assert.deepEqual(restored.manualMistakes,manual);assert.deepEqual(restored.consolidatedMistakes,consolidatedMistakes);assert.deepEqual(restored.growth,own.growth);
 for(const corrupt of [
  o=>o.manualMistakes.push('foreign-id'),
  o=>o.consolidatedMistakes.push(o.manualMistakes[0]),
  o=>o.wordTests.history[0].questions[0].correct=99,
  o=>o.wordTests.stats.study[ids[0]].good=0,
  o=>o.growth.events[0].at='invalid-date',
  o=>o.manualQuiz.ids.push('foreign-id')
 ]){const copy=structuredClone(raw);corrupt(copy.secondary[book.id]);assert.throws(()=>readBackup(copy,[book],{}));}
 assert.deepEqual(raw.progress[book.id],main);
});
test('a manually removed mistake always contributes to growth as an active-mistake achievement',()=>{
 const main=Study.create(book.bank),removed=ids[0];
 const found=growthCandidates(main,{manualMistakes:[],consolidatedMistakes:[removed]});
 assert.deepEqual(found,[{wordId:removed,source:'mistakes'}]);
 const reAdded=growthCandidates(main,{manualMistakes:[removed],consolidatedMistakes:[]});
 assert.deepEqual(reAdded,[]);
});
test('objective mistake tests need two distinct rounds to consolidate and bad results reset it',()=>{
 let stats=applyJudge(ids[0],'good',{},1000000001);stats=applyJudge(ids[0],'good',stats,1000000001);assert.equal(stats[ids[0]].consolidated,false);
 stats=applyJudge(ids[0],'good',stats,1000000002);assert.equal(stats[ids[0]].consolidated,true);
 stats=applyJudge(ids[0],'bad',stats,1000000003);assert.equal(stats[ids[0]].consolidated,false);
});
