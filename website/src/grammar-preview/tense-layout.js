import {compoundPastNotes} from './compound-past-notes.js';
import {notebookLesson} from './tense-notes.js';
// Presentation taxonomy is separate from persisted topic/practice IDs.
export const tenseFamilies = [
 {id:'indicative',label:'直陈式',fr:'Indicatif',groups:[
  {label:'现在',ids:['present','ongoing']},
  {label:'过去',ids:['recent-past','compound-past','imperfect','pluperfect','simple-past']},
  {label:'将来',ids:['near-future','future','future-perfect']},
 ]},
 {id:'conditional',label:'条件式',fr:'Conditionnel',groups:[{ids:['conditional','conditional-past']}]},
 {id:'subjunctive',label:'虚拟式',fr:'Subjonctif',groups:[{ids:['subjunctive','subjunctive-past']}]},
 {id:'imperative',label:'命令式',fr:'Impératif',groups:[{ids:['imperative']}]},
 {id:'nonfinite',label:'非人称形式',fr:'Formes non personnelles',groups:[{ids:['nonfinite']}]},
 {id:'application',label:'综合运用',fr:'Mise en pratique',groups:[{ids:['past-contrast','hypothesis','reported','time-relations','passive']}]},
 {id:'reference',label:'查询工具',fr:'Repères',groups:[{ids:['time-markers']}]},
];
export const familyFor = id => tenseFamilies.find(f=>f.groups.some(g=>g.ids.includes(id)));
export const readingOrder = tenseFamilies.flatMap(f=>f.groups.flatMap(g=>g.ids));

// Each original section is assigned once. Supplements enrich the appropriate
// section instead of being inserted as a second lesson before the original.
const plans = {
 present:{use:[0,4],form:[1],verbs:[2,3],compare:[5]},
 'near-future':{use:[0],form:[1],verbs:[],compare:[2,3]},
 'recent-past':{use:[0],form:[1],verbs:[],compare:[2,3]},
 ongoing:{use:[0],form:[1],verbs:[],compare:[2]},
 imperative:{use:[0],form:[1,2],verbs:[],compare:[3]},
 'compound-past':{use:[0,5],form:[1,2,3,4,7],verbs:[],compare:[6]},
 imperfect:{use:[0,2],form:[1],verbs:[],compare:[3]},
 pluperfect:{use:[0,2],form:[1],verbs:[],compare:[3]},
 'simple-past':{use:[0,3],form:[1],verbs:[2],compare:[]},
 future:{use:[0,3],form:[1],verbs:[2],compare:[4]},
 'future-perfect':{use:[0],form:[1],verbs:[],compare:[2]},
 conditional:{use:[0],form:[1],verbs:[],compare:[2]},
 'conditional-past':{use:[0],form:[1],verbs:[],compare:[2,3]},
 subjunctive:{use:[0,2],form:[1],verbs:[],compare:[3,4,5]},
 'subjunctive-past':{use:[0],form:[],verbs:[],compare:[1]},
};
const generalPlans = {
 'past-contrast':{rule:[0],examples:[1,2,3],compare:[4]},
 nonfinite:{rule:[0,1],examples:[2],compare:[3]},
 reported:{rule:[0,1],examples:[2,3],compare:[4,5]},
 hypothesis:{rule:[0],examples:[2],compare:[3],extra:[1]},
 'time-relations':{rule:[0,1],examples:[2],compare:[3]},
 'time-markers':{rule:[0],compare:[1]},
 passive:{rule:[0],examples:[1]},
};
const section=(title,blocks,extra={})=>({title,blocks,...extra});
const p=x=>({t:'p',x});
const example=(f,z)=>({t:'fr',f,z});
export const formulas = {
 present:'词干 + 现在时人称词尾',
 'near-future':'aller 现在时 + 不定式',
 'recent-past':'venir 现在时 + de / d’ + 不定式',
 ongoing:'être 现在时 + en train de + 不定式',
 imperative:'省略主语，使用 tu / nous / vous 对应形式',
 'compound-past':'avoir / être 现在时 + 过去分词',
 imperfect:'现在时 nous 形式去掉 -ons + 未完成过去时词尾',
 pluperfect:'avoir / être 未完成过去时 + 过去分词',
 'simple-past':'对应词干 + 简单过去时词尾',
 future:'将来时词干 + -ai, -as, -a, -ons, -ez, -ont',
 'future-perfect':'avoir / être 简单将来时 + 过去分词',
 conditional:'将来时词干 + 未完成过去时词尾',
 'conditional-past':'avoir / être 条件式现在时 + 过去分词',
 subjunctive:'对应词干 + 虚拟式现在时词尾',
 'subjunctive-past':'avoir / être 虚拟式现在时 + 过去分词',
};
export const formulaExamples={

};

export function buildTenseLesson(topic,supplements=[]){
 const original=topic.sections,plan=plans[topic.id];
 const read=indices=>(indices||[]).map(i=>({...original[i],sourceIndex:i}));
 if(!plan){
  const config=generalPlans[topic.id];
  const labels={rule:'规则',examples:topic.id==='nonfinite'?'分词':'例句',compare:'辨析',extra:'拓展'};
  const tabs=Object.entries(config).map(([id,indices])=>({id,label:labels[id],sections:read(indices)}));
  if(supplements.length)tabs.push({id:'reference',label:'速查',sections:supplements});
  return notebookLesson(topic,supplements,tabs);
 }
 const groups=Object.fromEntries(Object.entries(plan).map(([id,indices])=>[id,read(indices)]));
 const regular=supplements[0];
 if(regular){
  const forms=regular.blocks.filter(b=>b.t==='table'&&b.headers[0]==='人称');
  const notes=regular.blocks.filter(b=>!forms.includes(b));
  groups.verbs.unshift(section('规则模型与完整人称',forms));
  // Keep the extra construction details in the construction column; do not
  // repeat them above the person selector in the conjugation column.
  groups.form.push(section('构成细节与特殊情况',notes));
  groups.verbs.push(...supplements.slice(1));
 }

 if(topic.id==='present'){
  groups.use[0]=section('什么时候用',[
   p('现在时可以表示此刻发生的事，也可以表示习惯、普遍事实、确定的安排，以及持续到现在的状态。'),
   {t:'h3',x:'此刻与日常'},original[0].blocks[2],original[0].blocks[3],
   {t:'h3',x:'确定安排与持续状态'},
   example('Demain, je pars à Lyon.','明天我去里昂。'),
   example('J’apprends le français depuis deux ans.','我学法语已经两年了（现在仍在学）。'),
   {t:'h3',x:'普遍事实'},example('La Terre tourne autour du Soleil.','地球围绕太阳运转。'),
  ]);
  groups.form=[section('词干与词尾',[
   p('先判断动词所属模型，再取词干、加人称词尾。aller 虽以 -er 结尾，仍是不规则动词。'),
   original[1].blocks[0],original[1].blocks[1],
  ])];
  groups.verbs=[
   section('规则模型与完整人称',regular.blocks.filter(b=>b.t==='table'&&b.headers[0]==='人称')),
   section('拼写变化',[
    original[2].blocks[0],
    p('geler → je gèle；appeler / jeter 保留双辅音。haïr → je hais、tu hais、il hait，但 nous haïssons、vous haïssez、ils haïssent。'),
   ]),
   section('常用不规则动词',original[3].blocks),
  ];
 }
 if(topic.id==='compound-past'){
  groups.use=[section('什么时候用',[
   {t:'h3',x:'一次完成的事件'},original[0].blocks[1],
   {t:'h3',x:'连续发生的动作'},original[0].blocks[2],
   {t:'h3',x:'限定次数或时长的经历'},original[0].blocks[3],
   example('J’ai travaillé pendant huit heures.','我工作了八个小时。'),
   {t:'h3',x:'有明确结果的变化'},example('Il a grandi. / Elle est devenue médecin.','他长大了。/ 她成了医生。'),
  ],{hint:'完成的事件、经历与变化'}),{...original[5],hint:'过去时点、次数与限定时长'}];
  groups.form=[...compoundPastNotes,section('补充与例外',[...original[7].blocks,regular.blocks.at(-1)],{advanced:true})];
  // Full irregular index below supersedes the shorter duplicate participle list.
 }
 // Put the compact common stem list and the exhaustive index under one heading.
 if(topic.id==='future'){
  groups.verbs=groups.verbs.filter(s=>s.sourceIndex!==2);
  groups.verbs.push(section('词干使用提醒',original[2].blocks.filter(b=>b.t!=='table')));
 }
 if(topic.id==='subjunctive-past'){
  groups.form=[section('构成公式',[p(formulas[topic.id])])];
 }
 if(topic.id==='simple-past')groups.compare=[section('阅读辨析',[
  p('简单过去时用于书面叙事。阅读时结合上下文区分完整事件与未完成过去时描写的背景。'),
 ])];
 const labels={use:'用法',form:'构成',verbs:'变位',compare:'辨析'};
 const tabs=Object.entries(groups).map(([id,sections])=>({id,label:labels[id],sections}));
 return topic.id==='compound-past'?tabs:notebookLesson(topic,supplements,tabs);
}
