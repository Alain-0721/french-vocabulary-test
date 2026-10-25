import '../../assets/daily-core.js';
import * as Study from './preview-study.js';

export const D=globalThis.DailyCore;
export const day=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Shanghai',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const eligible=main=>main.order.filter(p=>main.mastered[p]);
export function createDaily(book,main,previous=null){
  const allowed=eligible(main),problem=D.problem(book.bank,allowed);
  return problem?{problem,round:null}:{problem:null,round:D.create(book.bank,allowed,crypto.randomUUID(),day(),previous)};
}
export function reviewGroups(quiz){return Array.from({length:5},(_,i)=>({label:quiz.themes[i],ids:quiz.ids.slice(i*10,i*10+10),part:quiz.parts[i]}));}
export function validDaily(quiz,book,main){return !quiz||D.validRound(quiz,book.bank,eligible(main));}
// 副进度组内排序：教材顺序按词库位置还原；打乱只发生在每组 10 词内部，组与组的归属不变。
function reorderQuiz(quiz,book,shuffle){
  const index=new Map(book.bank.map((e,i)=>[e.id,i]));
  const blocks=Array.from({length:quiz.ids.length/10},(_,g)=>quiz.ids.slice(g*10,g*10+10));
  return blocks.map(block=>{
    const ordered=block.slice().sort((a,b)=>index.get(a)-index.get(b));
    if(!shuffle)return ordered;
    for(let i=ordered.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[ordered[i],ordered[j]]=[ordered[j],ordered[i]];}
    return ordered;
  }).flat();
}
export function reviewAction(quiz,action,id,kind,book){
  if(!quiz)return null;const next=structuredClone(quiz);
  if(action==='toggle')return D.toggle(next,id)?next:quiz;
  if(action==='vote')return D.vote(next,id,kind)?next:quiz;
  if(action==='group'&&Number.isInteger(id)&&id>=0&&id<5){next.group=id;return next;}
  if(action==='order'){const shuffle=id===true;next.shuffled=shuffle;next.ids=reorderQuiz(next,book,shuffle);return next;}
  if(action==='repeat')return {...next,round:next.round+1,launchId:crypto.randomUUID(),opened:{},votes:{},group:0};
  return quiz;
}

export function restoreStudy(raw,book){
  try{
    const s=structuredClone(raw),order=Study.parts(book.bank).map(p=>p.key),dictionary=new Map(book.bank.map(e=>[e.id,e]));
    if(s?.version!==2||s.mode!=='preview-study'||s.level!==book.level||JSON.stringify(s.order)!==JSON.stringify(order)||!Array.isArray(s.attempts)||!s.attempts.length||s.attempts.length>2000||!Number.isInteger(s.view)||s.view<0||s.view>=s.attempts.length||!s.stats||!s.mastered)throw Error();
    const attemptIds=new Set(),rounds={},voteCounts={};
    for(const a of s.attempts){
      if(typeof a.id!=='string'||!a.id||attemptIds.has(a.id)||!order.includes(a.part)||!Array.isArray(a.ids)||typeof a.shuffled!=='boolean'||![null,'manual','automatic'].includes(a.passReason)||!a.opened||!a.votes)throw Error();
      attemptIds.add(a.id);rounds[a.part]=(rounds[a.part]||0)+1;if(a.round!==rounds[a.part])throw Error();
      const expected=book.bank.filter(e=>Study.key(e)===a.part).map(e=>e.id);
      if(a.ids.length!==expected.length||new Set(a.ids).size!==expected.length||a.ids.some(id=>!expected.includes(id)))throw Error();
      const groups=Study.groups(book.bank,a);
      if(!Number.isInteger(a.group)||a.group<0||a.group>=groups.length||JSON.stringify(groups.flatMap(g=>g.ids))!==JSON.stringify(a.ids))throw Error();
      if(!a.shuffled&&JSON.stringify(expected)!==JSON.stringify(a.ids))throw Error();
      for(const [id,open] of Object.entries(a.opened))if(!a.ids.includes(id)||typeof open!=='boolean')throw Error();
      for(const [id,vote] of Object.entries(a.votes)){if(!a.ids.includes(id)||!['good','bad'].includes(vote))throw Error();voteCounts[id]||={good:0,bad:0};voteCounts[id][vote]++;}
    }
    for(const [id,c] of Object.entries(s.stats))if(!dictionary.has(id)||!c||!['good','bad'].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0&&(c[k]>=(voteCounts[id]?.[k]||0))))throw Error();
    for(const id of Object.keys(voteCounts))if(!s.stats[id])throw Error();
    for(const [part,m] of Object.entries(s.mastered)){
      const a=s.attempts.find(a=>a.id===m?.attemptId&&a.part===part);
      if(!a||!['manual','automatic'].includes(m.reason))throw Error();
      const proof=a.completion||{reason:a.passReason,votes:a.votes};
      if(proof.reason!==m.reason||!proof.votes||Object.entries(proof.votes).some(([id,v])=>!a.ids.includes(id)||!['good','bad'].includes(v))||m.reason==='automatic'&&a.ids.some(id=>proof.votes[id]!=='good'))throw Error();
    }
    if(s.current!==Object.keys(s.mastered).length||s.completed!==(s.current===order.length))throw Error();
    return s;
  }catch{return null;}
}

export function convertClassicMain(raw,book){
  if(book.id!=='edito-b1')return null;
  const old=globalThis.TextbookCore.restore(raw,book.bank);if(!old)return null;
  const s=Study.create(book.bank,book.level),rounds={};
  s.attempts=old.attempts.map(a=>({...a,round:rounds[a.part]=(rounds[a.part]||0)+1,shuffled:false}));
  s.view=old.view;s.stats=old.stats;s.mastered=Object.fromEntries(Object.entries(old.mastered).filter(([p])=>old.order.slice(0,old.current).includes(p)));
  s.current=Object.keys(s.mastered).length;s.completed=s.current===s.order.length;s.round=s.attempts.length;
  return restoreStudy(s,book);
}
