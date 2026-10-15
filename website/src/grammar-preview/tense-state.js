import bank from './tense-bank.json' with {type:'json'};
import {tenseQuestions,isCorrect} from './tense-exercises.js';
const ids=new Set(bank.topics.map(t=>t.id)),qs=new Map(tenseQuestions.map(q=>[q.id,q]));
export const freshTense=()=>({version:1,current:'present',topics:{},answers:{},practiceGroup:'all',practiceTopic:'all'});
export function tenseSummary(s){const records=Object.values(s?.topics||{}),good=records.reduce((a,r)=>a+(r.good||0),0),bad=records.reduce((a,r)=>a+(r.bad||0),0);return {read:records.filter(r=>r.read).length,bookmarks:records.filter(r=>r.bookmarked).length,review:records.filter(r=>r.level==='review').length,good,bad,accuracy:good+bad?Math.round(good/(good+bad)*100)+'%':'—'};}
export function answerTense(s,q,value){if(!qs.has(q.id))throw Error('未知时态题目');if(s.answers[q.id]===value)return s;const answers={...s.answers,[q.id]:value},topics={...s.topics},counts={};for(const [id,v] of Object.entries(answers)){const question=qs.get(id);if(!question)continue;const r=counts[question.topic]??={good:0,bad:0};r[isCorrect(question,v)?'good':'bad']++;}for(const [id,c] of Object.entries(counts))topics[id]={...topics[id],...c};return {...s,topics,answers};}
export function normalizeTense(raw){
 if(raw===undefined)return freshTense();
 const object=x=>x&&typeof x==='object'&&!Array.isArray(x),fail=()=>{throw Error('时态学习记录无效，未修改当前记录。');};
 if(!object(raw)||raw.version!==1||!ids.has(raw.current)||!object(raw.topics)||!object(raw.answers))fail();
 const counts={},answers={},topics={};
 for(const [id,value] of Object.entries(raw.answers)){const q=qs.get(id);if(!q||q.type==='choice'&&(!Number.isInteger(value)||value<0||value>=q.options.length)||q.type==='fill'&&(typeof value!=='string'||!value.trim()||value.length>200))fail();answers[id]=value;const c=counts[q.topic]??={good:0,bad:0};c[isCorrect(q,value)?'good':'bad']++;}
 for(const [id,r] of Object.entries(raw.topics)){if(!ids.has(id)||!object(r))fail();const clean={};for(const key of ['read','bookmarked','started'])if(r[key]!==undefined){if(typeof r[key]!=='boolean')fail();clean[key]=r[key];}if(r.level!==undefined){if(!['review','understood','confident'].includes(r.level))fail();clean.level=r.level;}if(r.lastOpened!==undefined){if(typeof r.lastOpened!=='string'||!Number.isFinite(Date.parse(r.lastOpened)))fail();clean.lastOpened=r.lastOpened;}for(const key of ['good','bad']){if(!Number.isSafeInteger(r[key]??0)||(r[key]??0)!==(counts[id]?.[key]||0))fail();if(r[key]!==undefined||counts[id])clean[key]=r[key];}topics[id]=clean;}
 for(const id of Object.keys(counts))if(!topics[id])fail();
 const group=raw.practiceGroup||'all',topic=raw.practiceTopic||'all';if(group!=='all'&&!bank.groups.some(g=>g.id===group)||topic!=='all'&&(!ids.has(topic)||group!=='all'&&bank.topics.find(t=>t.id===topic).group!==group))fail();
 return {...freshTense(),current:raw.current,topics,answers,practiceGroup:group,practiceTopic:topic};
}
