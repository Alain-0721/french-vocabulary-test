import bank from './bank.json' with {type:'json'};
import {exercises} from './exercises.js';
import {freshState,summary} from './state.js';
import {normalizeTense,tenseSummary} from './tense-state.js';

const object=value=>value!==null&&typeof value==='object'&&!Array.isArray(value);
const fail=message=>{throw new Error(message);};
export function grammarBackup(state,scope='full'){
 const saved={...state,space:'grammar'};
 if(scope==='book'){
  const base=freshState();
  Object.assign(base,{space:'grammar',current:state.current,topics:state.topics,answers:state.answers});
  return {format:'franlumi-grammar-backup',version:1,book:bank.book,scope,exportedAt:new Date().toISOString(),state:base};
 }
 return {format:'franlumi-grammar-backup',version:1,book:bank.book,scope,exportedAt:new Date().toISOString(),state:saved};
}
export function readGrammarBackup(source){
 const wrapped=source?.format==='franlumi-grammar-backup';
 if(wrapped&&(source.version!==1||source.book!==bank.book||!['full','book'].includes(source.scope)))fail('备份版本或语法课本不匹配。');
 const s=wrapped?source.state:source;
 if(!object(s)||s.version!==1||!['grammar','words',null].includes(s.space)||!object(s.topics)||!object(s.answers))fail('请选择法语之光的语法备份文件。');
 const valid=new Set(bank.topics.map(t=>t.id)),questions=new Map(exercises.map(q=>[q.id,q])),topics={},answers={},counts={};
 for(const [id,choice] of Object.entries(s.answers)){
  const q=questions.get(id);
  if(!q||!Number.isInteger(choice)||choice<0||choice>=q.options.length)fail('练习答案无效，当前记录未修改。');
  answers[id]=choice;
  const count=counts[q.topic]??={good:0,bad:0};count[choice===q.correct?'good':'bad']++;
 }
 for(const [id,record] of Object.entries(s.topics)){
  if(!valid.has(id)||!object(record))fail('语法专题记录无效。');
  const clean={};
  for(const field of ['read','bookmarked','started'])if(record[field]!==undefined){if(typeof record[field]!=='boolean')fail('阅读或收藏标记无效。');clean[field]=record[field];}
  if(record.level!==undefined){if(!['review','understood','confident'].includes(record.level))fail('自评状态无效。');clean.level=record.level;}
  if(record.lastOpened!==undefined){if(typeof record.lastOpened!=='string'||!Number.isFinite(Date.parse(record.lastOpened)))fail('学习时间无效。');clean.lastOpened=record.lastOpened;}
  for(const field of ['good','bad']){
   const number=record[field]??0;
   if(!Number.isSafeInteger(number)||number<0||number!==(counts[id]?.[field]||0))fail('练习统计与答案不一致，当前记录未修改。');
   if(record[field]!==undefined||counts[id])clean[field]=number;
  }
  topics[id]=clean;
 }
 for(const id of Object.keys(counts))if(!topics[id])fail('练习缺少对应专题的记录。');
 if(s.current!==undefined&&!valid.has(s.current))fail('上次学习的专题无效。');
 const base=freshState();const state={...base,space:'grammar',topics,answers,current:s.current||base.current};
 state.tense=normalizeTense(s.tense);
 if(s.practiceMode!==undefined&&!['book','tense'].includes(s.practiceMode))fail('练习类型无效。');
 if(s.recordsMode!==undefined&&!['book','tense'].includes(s.recordsMode))fail('记录类型无效。');
 state.practiceMode=s.practiceMode||'book';state.recordsMode=s.recordsMode||'book';
 if(!wrapped||source.scope==='full'){
  if(s.font!==undefined&&!['normal','large'].includes(s.font))fail('阅读字号无效。');
  if(s.theme!==undefined&&!['light','dark','system'].includes(s.theme))fail('界面外观无效。');
  for(const key of ['translation','headerCollapsed'])if(s[key]!==undefined){if(typeof s[key]!=='boolean')fail('显示设置无效。');state[key]=s[key];}
  state.font=s.font||base.font;state.theme=s.theme||base.theme;
  if(s.practiceUnit!==undefined&&(!Number.isInteger(s.practiceUnit)||s.practiceUnit<0||s.practiceUnit>12))fail('练习单元无效。');
  if(s.practiceTopic!=null&&(!valid.has(s.practiceTopic)||(s.practiceUnit&&bank.topics.find(t=>t.id===s.practiceTopic).unit!==s.practiceUnit)))fail('练习专题无效。');
  state.practiceUnit=s.practiceUnit||0;state.practiceTopic=s.practiceTopic||null;
 }
 return {state,scope:wrapped?source.scope:'full',stats:summary(state),tenseStats:tenseSummary(state.tense),tenseAnswered:Object.keys(state.tense.answers).length,answered:Object.keys(answers).length,recorded:Object.keys(topics).length};
}
export function restoreGrammarBackup(current,backup){
 const data=backup.scope==='book'?{current:backup.state.current,topics:backup.state.topics,answers:backup.state.answers}:backup.state;
 return {...current,...data,space:current.space,last:current.last};
}
export function normalizeGrammarState(raw){
 const validated=readGrammarBackup(raw).state;
 const pages={grammar:['home','catalog','tenses','tense-topic','practice','records','settings','about'],words:['home','study','daily','library','settings','books','dictionary','records','guide','about','practice']};
 const last=Object.fromEntries(Object.entries(pages).map(([space,allowed])=>[space,allowed.includes(raw.last?.[space])?raw.last[space]:'home']));
 return {...validated,space:raw.space,last};
}
