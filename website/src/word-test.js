// Objective vocabulary tests use the selected book only. Self-ratings remain independent.
export const TEST_SOURCES = ['study','daily','mistakes'];
const normalize = s => s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase();
const validDate = at => typeof at === 'string' && Number.isFinite(Date.parse(at));
const shuffle = (list,rng) => {
  const out=[...list];
  for(let i=out.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[out[i],out[j]]=[out[j],out[i]];}
  return out;
};
export function createWordTest(book,ids,{source,scope,kind='mixed',direction='fr-zh'}={},rng=Math.random){
  if(!TEST_SOURCES.includes(source)||!['mixed','choice','judgement'].includes(kind)||!['fr-zh','zh-fr'].includes(direction))throw Error('检测设置无效。');
  const dictionary=new Map(book.bank.map(e=>[e.id,e])),selected=[...new Set(ids)].map(id=>dictionary.get(id));
  if(!selected.length||selected.some(e=>!e))throw Error('当前组没有可检测的词。');
  const promptKey=direction==='fr-zh'?'fr':'zh',answerKey=direction==='fr-zh'?'zh':'fr';
  const questions=shuffle(selected,rng).map((e,i)=>{
    // Avoid offering a distractor that is another valid sense of the same prompt.
    const accepted=new Set(book.bank.filter(x=>normalize(x[promptKey])===normalize(e[promptKey])).map(x=>normalize(x[answerKey])));
    const seen=new Set(),alternatives=shuffle(book.bank,rng).filter(x=>{
      const text=normalize(x[answerKey]);
      if(accepted.has(text)||seen.has(text))return false;
      seen.add(text);return true;
    }).slice(0,3).map(x=>x[answerKey]);
    if(!alternatives.length)throw Error('本课本缺少可区分的释义，暂时无法生成客观题。');
    const type=kind==='mixed'?(i%2?'judgement':'choice'):kind;
    if(type==='judgement'){
      const truth=rng()<.5;
      return {wordId:e.id,type,prompt:e[promptKey],answer:e[answerKey],pair:truth?e[answerKey]:alternatives[0],options:['正确','错误'],correct:truth?0:1};
    }
    const options=shuffle([e[answerKey],...alternatives],rng);
    return {wordId:e.id,type,prompt:e[promptKey],answer:e[answerKey],options,correct:options.indexOf(e[answerKey])};
  });
  return {id:crypto.randomUUID(),source,scope:String(scope||'当前组').slice(0,200),kind,direction,startedAt:new Date().toISOString(),completedAt:null,index:0,questions,answers:{}};
}
export function answerWordTest(session,choice){
  if(!session||session.completedAt)return session;
  const q=session.questions[session.index];
  if(session.answers[q.wordId]!==undefined||!Number.isInteger(choice)||choice<0||choice>=q.options.length)return session;
  const next={...session,answers:{...session.answers,[q.wordId]:choice}};
  if(Object.keys(next.answers).length===next.questions.length)next.completedAt=new Date().toISOString();
  return next;
}
export function nextWordTest(session){
  if(!session||session.completedAt||session.answers[session.questions[session.index].wordId]===undefined)return session;
  return {...session,index:Math.min(session.index+1,session.questions.length-1)};
}
export function testScore(session){
  const answered=session.questions.filter(q=>session.answers[q.wordId]!==undefined);
  const good=answered.filter(q=>session.answers[q.wordId]===q.correct).length;
  return {done:answered.length,good,bad:answered.length-good,total:session.questions.length};
}
export function recordWordTest(tests={},session){
  if(!session.completedAt||(tests.history||[]).some(h=>h.id===session.id))return tests;
  const stats=structuredClone(tests.stats||{}),counts=stats[session.source]||{};
  for(const q of session.questions){const kind=session.answers[q.wordId]===q.correct?'good':'bad';const c=counts[q.wordId]||{good:0,bad:0};counts[q.wordId]={...c,[kind]:c[kind]+1};}
  stats[session.source]=counts;
  return {...tests,serial:(tests.serial||0)+1,stats,history:[session,...(tests.history||[])].slice(0,50)};
}
export function validWordTest(q,book){
  if(!q||typeof q.id!=='string'||!q.id||!TEST_SOURCES.includes(q.source)||typeof q.scope!=='string'||q.scope.length>200||!['mixed','choice','judgement'].includes(q.kind)||!['fr-zh','zh-fr'].includes(q.direction)||!validDate(q.startedAt)||q.completedAt!==null&&!validDate(q.completedAt))return false;
  if(!Array.isArray(q.questions)||!q.questions.length||q.questions.length>book.bank.length||new Set(q.questions.map(x=>x.wordId)).size!==q.questions.length||!Number.isInteger(q.index)||q.index<0||q.index>=q.questions.length||!q.answers||typeof q.answers!=='object'||Array.isArray(q.answers))return false;
  const map=new Map(book.bank.map(e=>[e.id,e])),pk=q.direction==='fr-zh'?'fr':'zh',ak=q.direction==='fr-zh'?'zh':'fr',byPrompt=new Map(),allAnswers=new Set(book.bank.map(e=>e[ak]));
  for(const e of book.bank){const key=normalize(e[pk]);if(!byPrompt.has(key))byPrompt.set(key,new Set());byPrompt.get(key).add(normalize(e[ak]));}
  for(const x of q.questions){
    const e=map.get(x.wordId);
    if(!e||x.prompt!==e[pk]||x.answer!==e[ak]||!['choice','judgement'].includes(x.type)||!Array.isArray(x.options)||x.options.length<2||x.options.length>4||new Set(x.options).size!==x.options.length||!Number.isInteger(x.correct)||x.correct<0||x.correct>=x.options.length)return false;
    const accepted=byPrompt.get(normalize(e[pk]));
    if(x.type==='choice'&&(x.options[x.correct]!==e[ak]||x.options.some((s,i)=>typeof s!=='string'||i!==x.correct&&accepted.has(normalize(s))||!allAnswers.has(s))))return false;
    if(x.type==='judgement'&&(JSON.stringify(x.options)!==JSON.stringify(['正确','错误'])||typeof x.pair!=='string'||!allAnswers.has(x.pair)||x.correct!==(accepted.has(normalize(x.pair))?0:1)))return false;
  }
  for(const [id,a] of Object.entries(q.answers)){const x=q.questions.find(x=>x.wordId===id);if(!x||!Number.isInteger(a)||a<0||a>=x.options.length)return false;}
  if(Object.keys(q.answers).length!==(q.completedAt?q.questions.length:q.index+(q.answers[q.questions[q.index].wordId]!==undefined?1:0)))return false;
  return q.questions.slice(0,q.index).every(x=>q.answers[x.wordId]!==undefined);
}
export function restoreWordTests(raw,book){
  if(!raw)return undefined;
  if(!Number.isSafeInteger(raw.serial)||raw.serial<0||!Array.isArray(raw.history)||raw.history.length>50||raw.serial<raw.history.length||new Set(raw.history.map(q=>q.id)).size!==raw.history.length||raw.history.some(q=>!validWordTest(q,book)||!q.completedAt)||raw.current&&!validWordTest(raw.current,book))throw Error('单词检测记录无效。');
  const ids=new Set(book.bank.map(e=>e.id));
  for(const [source,counts] of Object.entries(raw.stats||{})){
    if(!TEST_SOURCES.includes(source)||!counts||typeof counts!=='object')throw Error('检测累计无效。');
    for(const [id,c] of Object.entries(counts))if(!ids.has(id)||!c||!['good','bad'].every(k=>Number.isSafeInteger(c[k])&&c[k]>=0))throw Error('检测累计无效。');
  }
  const required={};
  for(const q of raw.history)for(const x of q.questions){const k=q.answers[x.wordId]===x.correct?'good':'bad',key=q.source+':'+x.wordId;required[key]||={good:0,bad:0};required[key][k]++;if((raw.stats?.[q.source]?.[x.wordId]?.[k]||0)<required[key][k])throw Error('检测累计与历史不一致。');}
  if(raw.current?.completedAt&&!raw.history.some(q=>q.id===raw.current.id&&JSON.stringify(q)===JSON.stringify(raw.current)))throw Error('检测结果尚未记入历史。');
  return structuredClone(raw);
}
