import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as Study from '../src/preview-study.js';
import {mistakeIds,mistakePartList,sortMistakes,mistakeRound,validMistakeRound,mistakeAction,applyJudge,MISTAKE_RATE,MISTAKE_MIN} from '../src/mistake-review.js';
import {readBackup,fullBackup} from '../src/preview-backup.js';
import bank from '../../assets/textbook-bank.json' with {type:'json'};

const b1={id:'edito-b1',name:'Édito B1',level:'B1',edition:'2023 版',bank};
const ids=n=>bank.slice(0,n).map(e=>e.id);
const idsOf=(part,n)=>bank.filter(e=>Study.key(e)===part).slice(0,n).map(e=>e.id);
// 直接构造多轮 attempt；rounds=[{part?,bad:[...],good:[...]}]，每轮各投一票。
function buildMain(rounds){
  const s=Study.create(bank);
  for(let i=0;i<rounds.length;i++){
    const part=rounds[i].part||'U1P1';
    const base=s.attempts.find(a=>a.part===part);
    const partIds=base?base.ids:bank.filter(e=>Study.key(e)===part).map(e=>e.id);
    const roundInPart=s.attempts.filter(a=>a.part===part).length+1;
    s.attempts.push({id:crypto.randomUUID(),part,round:roundInPart,group:0,ids:partIds,opened:{},votes:{},passReason:null,shuffled:false});
    s.view=s.attempts.length-1;s.round=s.attempts.length;
    const a=Study.active(s);
    for(const id of rounds[i].bad){a.opened[id]=true;assert.ok(Study.vote(s,id,'bad'),id);}
    for(const id of rounds[i].good){a.opened[id]=true;assert.ok(Study.vote(s,id,'good'),id);}
  }
  return s;
}

test('threshold: at least 3 judgments and at least 50% wrong',()=>{
  const [a1,a2,a3,a4]=ids(4);
  // 同一轮判错只算一次判定；两个判定次数的词不入选。
  assert.deepEqual(mistakeIds(buildMain([{bad:[a1,a2],good:[]}])),[]);
  // 三轮都判错：每个词累计 3 次、错误率 100% → 入选；a4 只有一次 good 不入选。
  const threeBad=buildMain([{bad:[a1,a2,a3],good:[a4]},{bad:[a1,a2,a3],good:[]},{bad:[a1,a2,a3],good:[]}]);
  assert.deepEqual(mistakeIds(threeBad).sort(),[a1,a2,a3].sort());
  // a4：good、bad（总数 2 不入选）→ 再 bad 一次：3 次、错误率 67% → 入选。
  const a4Two=buildMain([{good:[a4],bad:[]},{bad:[a4],good:[]}]);
  assert.ok(!mistakeIds(a4Two).includes(a4));
  const a4Three=buildMain([{good:[a4],bad:[]},{bad:[a4],good:[]},{bad:[a4],good:[]}]);
  assert.ok(mistakeIds(a4Three).includes(a4));
  // 恰好 50%（3 次中错 1.5 不可能；用 4 次中错 2 次=50%）也算易错词。
  const exactlyHalf=buildMain([{bad:[a1],good:[]},{good:[a1],bad:[]},{bad:[a1],good:[]},{good:[a1],bad:[]}]);
  assert.ok(mistakeIds(exactlyHalf).includes(a1));
  assert.ok(!mistakeIds(threeBad).includes(a4));
  assert.equal(MISTAKE_RATE,0.5);assert.equal(MISTAKE_MIN,3);
});
test('two consecutive bad votes in latest two judgments qualify',()=>{
  const [a1,a2,a3]=ids(3);
  // a3：bad → good → bad → bad；最近两次 (bad,bad) → 连错入选。
  const main=buildMain([{bad:[a3],good:[]},{good:[a3],bad:[]},{bad:[a3],good:[]},{bad:[a3],good:[]}]);
  const mid=buildMain([{bad:[a3],good:[]},{good:[a3],bad:[]},{bad:[a3],good:[]}]);
  // 中途最近两次 (good,bad)，不连错；但错误率 2/3 ≥50% 仍入选（此处 a3 是唯一记录词）。
  assert.ok(mistakeIds(mid).includes(a3));
  assert.ok(mistakeIds(main).includes(a3));
  // 不满足错误率门槛时，连错也能入选：good bad bad good bad bad。
  const consecutive=buildMain([{good:[a1,a2],bad:[]},{bad:[a1,a2],good:[]},{bad:[a1,a2],good:[]},{good:[a1,a2],bad:[]},{bad:[a1,a2],good:[]},{bad:[a1,a2],good:[]}]);
  assert.ok(mistakeIds(consecutive).includes(a1));
  assert.ok(mistakeIds(consecutive).includes(a2));
});
test('sorting prefers recent bad then recency, and consolidated words are excluded',()=>{
  const [a1,a2,a3]=ids(3);
  const main=buildMain([{bad:[a1,a2,a3],good:[]},{bad:[a1,a2,a3],good:[]}]);
  const stats={[a1]:{streak:2,consolidated:true,rounds:[1,2]},[a2]:{streak:0,consolidated:false,rounds:[]}};
  const list=mistakeIds(main,stats);
  assert.ok(!list.includes(a1));
  assert.ok(list.includes(a2)&&list.includes(a3));
  const sorted=sortMistakes([{id:'x',order:0,recentBad:false,rate:.5,margin:0,lowRate:true},{id:'y',order:1,recentBad:true,rate:.4,margin:0,lowRate:false}]);
  assert.equal(sorted[0].id,'y');
});
test('round creation, validation and actions',()=>{
  // 跨两个 Part 构造：U1P1 前 10 词 + U1P2 前 3 词，各判三轮。
  const p1=idsOf('U1P1',10),p2=idsOf('U1P2',3);
  const main=buildMain([{bad:p1,good:[]},{bad:p1,good:[]},{bad:p1,good:[]},{part:'U1P2',bad:p2,good:[]},{part:'U1P2',bad:p2,good:[]},{part:'U1P2',bad:p2,good:[]}]);
  const round=mistakeRound(main);
  assert.ok(round);
  // 13 个易错词按 Part 分组：U1P1 10 个 + U1P2 3 个，共 13 词两组。
  assert.equal(round.ids.length,13);
  assert.equal(round.parts.length,2);
  assert.deepEqual(round.parts.map(p=>p.part),['U1P1','U1P2']);
  assert.equal(round.parts[0].ids.length,10);
  assert.equal(round.parts[1].ids.length,3);
  assert.ok(validMistakeRound(round,main));
  // 分组按教材顺序排列。
  const partList=mistakePartList(main);
  assert.deepEqual(partList.map(p=>p.part),['U1P1','U1P2']);
  assert.ok(partList[0].ids.every(id=>id.startsWith('U01P01')));
  assert.ok(partList[1].ids.every(id=>id.startsWith('U01P02')));
  const toggled=mistakeAction(round,main,{},'toggle',round.ids[0]);
  assert.equal(toggled.opened[round.ids[0]],true);
  const voted=mistakeAction(toggled,main,{},'vote',round.ids[0],'good');
  assert.equal(voted.votes[round.ids[0]],'good');
  assert.equal(mistakeAction(round,main,{},'vote',round.ids[0],'bad').votes[round.ids[0]],undefined);
  // 组切换指向对应 Part。
  assert.equal(mistakeAction(round,main,{},'group',1).group,1);
  const repeated=mistakeAction(round,main,{},'repeat');
  assert.notEqual(repeated.launchId,round.launchId);
  assert.deepEqual(repeated.ids,round.ids);
  assert.equal(repeated.round,round.round+1);
  // 再测本组只清空当前 Part 的判定，另一 Part 保留。
  const crossToggled=mistakeAction(repeated,main,{},'toggle',repeated.parts[1].ids[0]);
  const crossVoted=mistakeAction(crossToggled,main,{},'vote',repeated.parts[1].ids[0],'good');
  const repeatSecond=mistakeAction(crossVoted,main,{},'group',0);
  const afterRepeat=mistakeAction(repeatSecond,main,{},'repeat');
  assert.ok(!Object.keys(afterRepeat.votes).some(id=>afterRepeat.parts[0].ids.includes(id)));
  assert.equal(afterRepeat.votes[repeated.parts[1].ids[0]],'good');
  // 下一 Part 循环切换。
  assert.equal(mistakeAction(round,main,{},'next').group,1);
  assert.equal(mistakeAction(mistakeAction(round,main,{},'next'),main,{},'next').group,0);
  // 重新扫描生成新一轮并保留历史。
  const refreshed=mistakeAction(round,main,{},'refresh');
  assert.equal(refreshed.round,round.round+1);
  assert.ok(validMistakeRound(refreshed,main));
  // 组内排序：教材顺序还原到课本顺序，打乱后仍是同一组词。
  const shuffled=mistakeAction(round,main,{},'order',true);
  assert.equal(shuffled.shuffled,true);
  assert.deepEqual(shuffled.ids.slice().sort(),round.ids.slice().sort());
  for(const [i,g] of shuffled.parts.entries())assert.deepEqual(g.ids.slice().sort(),round.parts[i].ids.slice().sort());
  const restored=mistakeAction(shuffled,main,{},'order',false);
  assert.equal(restored.shuffled,false);
  assert.deepEqual(restored.parts.map(g=>g.ids),round.parts.map(g=>g.ids));
  assert.equal(repeated.round,round.round+1);
  const next=mistakeAction(round,main,{},'next');
  assert.equal(next.group,1);
});
test('consolidation needs two distinct rounds and resets on bad',()=>{
  let stats={};
  stats=applyJudge('w','good',stats,1);
  stats=applyJudge('w','good',stats,1);
  assert.equal(stats.w.consolidated,false);
  stats=applyJudge('w','good',stats,2);
  assert.equal(stats.w.consolidated,true);
  stats=applyJudge('w','bad',stats,3);
  assert.deepEqual(stats.w,{streak:0,consolidated:false,rounds:[]});
});
test('backup roundtrip preserves mistake review data and old backups stay valid',()=>{
  const main=buildMain([{bad:ids(4),good:[]},{bad:ids(4),good:[]},{bad:ids(4),good:[]}]),round=mistakeRound(main);
  const books=[b1];
  const secondary={'edito-b1':{mistakes:round,mistakesHistory:[round],mistakeStats:{[round.ids[0]]:{streak:1,consolidated:false,rounds:[1]}}}};
  const data=fullBackup(books,{'edito-b1':main},{layout:'classic',shuffle:false},b1.id,secondary,'light');
  const restored=readBackup(JSON.stringify(data),books,{'edito-b1':main});
  assert.deepEqual(restored.secondary['edito-b1'].mistakes,round);
  assert.equal(restored.secondary['edito-b1'].mistakesHistory.length,1);
  assert.equal(restored.secondary['edito-b1'].mistakeStats[round.ids[0]].streak,1);
  const oldData=fullBackup(books,{'edito-b1':main},{layout:'classic',shuffle:false},b1.id,{'edito-b1':{daily:null,practice:null}},'light');
  const oldRestored=readBackup(JSON.stringify(oldData),books,{'edito-b1':main});
  assert.equal(oldRestored.secondary['edito-b1'].mistakes,null);
  assert.deepEqual(oldRestored.secondary['edito-b1'].mistakeStats,{});
});
