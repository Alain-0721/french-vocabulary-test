import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import bank from '../src/grammar-preview/bank.json' with {type:'json'};
import {STORAGE_KEY,loadState,freshState,recordAnswer,summary} from '../src/grammar-preview/state.js';
import {exercises} from '../src/grammar-preview/exercises.js';
import {grammarBackup,readGrammarBackup,restoreGrammarBackup} from '../src/grammar-preview/backup.js';
test('grammar backups round-trip records and preferences, validate statistics and isolate book restores',()=>{
 let source=recordAnswer(freshState(),exercises[0],exercises[0].correct);source.space='grammar';source.theme='dark';source.translation=false;source.topics[exercises[0].topic].read=true;
 const full=readGrammarBackup(grammarBackup(source));assert.deepEqual(full.state.topics,source.topics);assert.deepEqual(full.state.answers,source.answers);assert.equal(full.state.theme,'dark');assert.equal(full.answered,1);
 const legacy=readGrammarBackup(source);assert.equal(legacy.stats.read,1);
 const current={...freshState(),space:'words',theme:'system',translation:true,last:{grammar:'settings',words:'study'}};
 const book=restoreGrammarBackup(current,readGrammarBackup(grammarBackup(source,'book')));assert.equal(book.theme,'system');assert.equal(book.translation,true);assert.equal(book.space,'words');assert.deepEqual(book.last,current.last);assert.deepEqual(book.answers,source.answers);
 const restored=restoreGrammarBackup(current,full);assert.equal(restored.theme,'dark');assert.equal(restored.space,'words');
 for(const mutate of [s=>s.answers[exercises[0].id]=99,s=>s.topics[exercises[0].topic].good=9,s=>s.theme='invalid',s=>s.topics.unknown={}]){
  const malformed=structuredClone(source);mutate(malformed);assert.throws(()=>readGrammarBackup(malformed));
 }
 assert.throws(()=>readGrammarBackup({mode:'atelier',version:1}));assert.equal(loadState({getItem:()=>JSON.stringify({...source,theme:'bad'})}).theme,'light');
});
test('grammar source retains 36 ordered topics, 69 tables and all three content sections',()=>{
 assert.equal(bank.units.length,12);assert.equal(bank.topics.length,36);assert.equal(new Set(bank.topics.map(t=>t.id)).size,36);
 assert.equal(new Set(bank.topics.map(t=>`${t.unit}:${t.part}`)).size,24);
 assert.equal(bank.topics.flatMap(t=>t.blocks).filter(b=>b.type==='table').length,69);
 for(const t of bank.topics){assert.ok(t.page&&t.fr&&t.zh);assert.deepEqual([...new Set(t.blocks.map(b=>b.section))].sort(),['original','summary','supplement']);}
 for(const q of exercises){assert.ok(bank.topics.some(t=>t.id===q.topic));assert.ok(q.options[q.correct]);assert.ok(q.explanation);}
});
test('answer corrections count once and reading status does not imply mastery',()=>{
 let s=freshState(),q=exercises[0];s=recordAnswer(s,q,1);assert.equal(summary(s).bad,1);assert.equal(summary(s).read,0);s=recordAnswer(s,q,q.correct);assert.equal(summary(s).good,1);assert.equal(summary(s).bad,0);assert.equal(recordAnswer(s,q,q.correct),s);
 assert.equal(loadState({getItem:()=>'{broken'}).space,null);
});
test('full exercise bank covers each unit and topic with six distinct bilingual questions and compatible legacy IDs',()=>{
 assert.equal(exercises.length,216);assert.equal(new Set(exercises.map(q=>q.id)).size,216);
 assert.equal(new Set(exercises.map(q=>q.prompt)).size,216);
 for(const t of bank.topics){const questions=exercises.filter(q=>q.topic===t.id);assert.equal(questions.length,6,t.id);for(const question of questions){assert.equal(question.options.length,3);assert.equal(new Set(question.options).size,3);assert.ok(Number.isInteger(question.correct)&&question.correct>=0&&question.correct<3);for(const field of ['prompt','zh','explanation'])assert.ok(question[field]?.trim(),`${question.id}: ${field}`);}}
 for(const unit of bank.units)assert.equal(exercises.filter(q=>bank.topics.find(t=>t.id===q.topic).unit===unit.number).length,18);
 const legacy={ 'pc-1':0,'pc-2':1,'pc-3':2,'time-1':0,'time-2':1,'pqp-1':2,'pqp-2':1,'q-1':0,'q-2':0,'ob-1':1,'ob-2':0,'emotion-1':2 };
 for(const [id,correct] of Object.entries(legacy))assert.equal(exercises.find(q=>q.id===id)?.correct,correct,id);
 const old=freshState();old.answers={'pc-1':0};old.topics[exercises[0].topic]={good:1,bad:0};const restored=loadState({getItem:()=>JSON.stringify(old)});assert.equal(restored.answers['pc-1'],0);assert.equal(summary(restored).good,1);
});
const bundle=await build({entryPoints:['src/grammar-preview/main.jsx'],bundle:true,write:false,platform:'browser',format:'iife',loader:{'.css':'empty'},define:{'import.meta.env.VITE_NATIVE_APP':'"true"'},logLevel:'silent'});
const pause=()=>new Promise(r=>setTimeout(r,100));
function app(saved){const d=new JSDOM('<div id="franlumi-root"></div>',{url:'http://localhost/franlumi-preview.html',runScripts:'dangerously',pretendToBeVisual:true});d.window.structuredClone=structuredClone;d.window.scrollTo=()=>{};d.window.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});d.window.localStorage.setItem('franmo-atelier:v2:guest','original-production-record');if(saved)d.window.localStorage.setItem(STORAGE_KEY,saved);d.window.eval(bundle.outputFiles[0].text);return d;}
const click=async(d,selector)=>{assert.ok(d.window.document.querySelector(selector),selector);d.window.document.querySelector(selector).click();await pause();};
test('settings theme and translation persist, export and preview import work and cancellation preserves records',async()=>{
 let initial=recordAnswer(freshState(),exercises[0],exercises[0].correct);initial.space='grammar';initial.last.grammar='settings';
 const d=app(JSON.stringify(initial));try{
  await pause();const doc=d.window.document;await click(d,'.gl-theme-options button:nth-child(2)');assert.ok(doc.querySelector('.gl-theme-dark'));assert.equal(doc.documentElement.dataset.previewTheme,'dark');
  await click(d,'[aria-label="显示中文翻译"]');assert.equal(JSON.parse(d.window.localStorage.getItem(STORAGE_KEY)).translation,false);
  let exported;d.window.FranmotestNative={saveText:(filename,text)=>exported={filename,data:JSON.parse(text)}};
  await click(d,'.gl-setting-actions .gl-primary');assert.equal(exported.data.state.theme,'dark');assert.equal(exported.data.state.answers[exercises[0].id],exercises[0].correct);
  const upload=async data=>{const input=doc.querySelector('[aria-label="导入语法备份文件"]');Object.defineProperty(input,'files',{configurable:true,value:[{name:'grammar.json',size:1024,text:async()=>JSON.stringify(data)}]});input.dispatchEvent(new d.window.Event('change',{bubbles:true}));await pause();};
  const empty=freshState();empty.space='grammar';empty.theme='light';await upload(grammarBackup(empty));assert.ok(doc.querySelector('[aria-modal=true]'));assert.match(doc.querySelector('.gl-restore-summary').textContent,/已答题 0/);
  await click(d,'[aria-label="关闭恢复窗口"]');assert.equal(JSON.parse(d.window.localStorage.getItem(STORAGE_KEY)).topics[exercises[0].topic].good,1);
  await upload(grammarBackup(empty));await click(d,'.gl-restore-dialog .gl-primary');assert.equal(JSON.parse(d.window.localStorage.getItem(STORAGE_KEY)).theme,'light');assert.deepEqual(JSON.parse(d.window.localStorage.getItem(STORAGE_KEY)).answers,{});assert.equal(doc.querySelector('[aria-modal=true]'),null);
  await upload({format:'wrong'});assert.equal(doc.querySelector('[aria-modal=true]'),null);assert.match(doc.querySelector('.gl-toast').textContent,/导入未完成/);
  const tutorial=[...doc.querySelectorAll('button')].find(b=>b.textContent.includes('语法之光使用教程'));tutorial.click();await pause();assert.match(doc.querySelector('.gl-page-intro h1').textContent,/使用教程/);assert.equal(doc.querySelectorAll('.gl-guide-number').length,8);
  assert.equal(d.window.localStorage.getItem('franmo-atelier:v2:guest'),'original-production-record');
 }finally{d.window.close();}
});
test('shared header folds, closes menus and remembers its state without changing learning records',async()=>{
 const initial=freshState();initial.space='grammar';initial.last.grammar='catalog';initial.topics[bank.topics[0].id]={read:true,good:2,bad:1};
 let d=app(JSON.stringify(initial));try{
  await pause();await click(d,'.gl-book-trigger');assert.ok(d.window.document.querySelector('.gl-book-menu'));
  await click(d,'.gl-header-toggle');let doc=d.window.document;
  assert.ok(doc.querySelector('.gl-top-collapsed'));assert.equal(doc.querySelector('.gl-header-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(doc.querySelector('#gl-space-controls').hidden,true);assert.equal(doc.querySelector('#gl-book-controls').hidden,true);assert.equal(doc.querySelector('.gl-menu-dismiss'),null);
  let saved=d.window.localStorage.getItem(STORAGE_KEY);assert.equal(JSON.parse(saved).headerCollapsed,true);assert.deepEqual(JSON.parse(saved).topics,initial.topics);
  d.window.close();d=app(saved);await pause();doc=d.window.document;assert.ok(doc.querySelector('.gl-top-collapsed'));
  await click(d,'.gl-header-toggle');assert.equal(doc.querySelector('#gl-space-controls').hidden,false);assert.equal(doc.querySelector('.gl-header-toggle').getAttribute('aria-expanded'),'true');
  await click(d,'.gl-space-switch button:first-child');await click(d,'.gl-avatar');assert.ok(doc.querySelector('.gl-profile-menu'));
  await click(d,'.gl-header-toggle');assert.ok(doc.querySelector('.gl-space-words.gl-top-collapsed'));assert.equal(doc.querySelector('.gl-profile-menu'),null);
  saved=JSON.parse(d.window.localStorage.getItem(STORAGE_KEY));assert.equal(saved.space,'words');assert.deepEqual(saved.topics,initial.topics);assert.equal(d.window.localStorage.getItem('franmo-atelier:v2:guest'),'original-production-record');
 }finally{d.window.close();}
});
test('local App preview remembers space, stores bookmarks and scores, preserves existing vocabulary storage',async()=>{
 let d=app();try{await pause();assert.ok(d.window.document.querySelector('.gl-welcome'));await click(d,'.gl-space-grammar');assert.ok(d.window.document.querySelector('.gl-hero'));await click(d,'.gl-hero .gl-primary');assert.ok(d.window.document.querySelector('.gl-reader'));await click(d,'.gl-bookmark');await click(d,'.gl-read-check');await click(d,'.gl-practice-link');await click(d,'.gl-answer-options button');assert.ok(d.window.document.querySelector('.gl-explanation.correct'));const saved=d.window.localStorage.getItem(STORAGE_KEY),s=JSON.parse(saved);assert.equal(s.space,'grammar');assert.equal(summary(s).read,1);assert.equal(summary(s).bookmarks,1);assert.equal(summary(s).good,1);assert.equal(d.window.localStorage.getItem('franmo-atelier:v2:guest'),'original-production-record');d.window.close();d=app(saved);await pause();assert.ok(d.window.document.querySelector('.gl-exercise'));await click(d,'.gl-book-trigger');assert.ok(d.window.document.querySelector('.gl-book-menu'));assert.equal(d.window.franmotestBack(),true);await pause();assert.equal(d.window.document.querySelector('.gl-book-menu'),null);}finally{d.window.close();}
});

test('practice picker filters questions, resets position, preserves answers and remembers the selected grammar',async()=>{
 let d=app();try{
  await pause();await click(d,'.gl-space-grammar');await click(d,'.gl-bottom-nav button:nth-child(3)');await click(d,'[aria-label="选择练习语法"]');
  let doc=d.window.document;assert.equal(doc.querySelectorAll('.choice-dropdown [role=option]').length,37);
  const choose=async name=>{const option=[...doc.querySelectorAll('.choice-dropdown [role=option]')].find(n=>n.textContent.includes(name));assert.ok(option);option.click();await pause();};
  await choose('疑问句');assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 6/);assert.match(doc.querySelector('.gl-practice-info').textContent,/疑问句/);assert.equal(doc.querySelector('.gl-question-translation').hidden,true);await click(d,'.gl-question button');assert.equal(doc.querySelector('.gl-question-translation').hidden,false);await click(d,'.gl-question button');assert.equal(doc.querySelector('.gl-question-translation').hidden,true);await click(d,'.gl-question button');await click(d,'.gl-answer-options button');
  await click(d,'.gl-topic-pagination .gl-primary');assert.match(doc.querySelector('.gl-exercise-meta').textContent,/2 \/ 6/);assert.equal(doc.querySelector('.gl-question-translation').hidden,true);
  assert.match(doc.querySelector('[aria-label="选择练习单元"]').textContent,/U2/);await click(d,'[aria-label="选择练习单元"]');assert.equal(doc.querySelectorAll('.choice-dropdown [role=option]').length,13);await choose('U1');assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 18/);
  await click(d,'[aria-label="选择练习语法"]');assert.equal(doc.querySelectorAll('.choice-dropdown [role=option]').length,4);assert.ok(!doc.querySelector('.choice-dropdown').textContent.includes('疑问句'));await choose('复合过去时');assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 6/);
  await click(d,'[aria-label="选择练习单元"]');await choose('U2');await click(d,'[aria-label="选择练习语法"]');await choose('疑问句');assert.ok(doc.querySelector('.gl-explanation.correct'));assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 6/);
  const saved=d.window.localStorage.getItem(STORAGE_KEY);d.window.close();d=app(saved);await pause();doc=d.window.document;assert.match(doc.querySelector('[aria-label="选择练习语法"]').textContent,/疑问句/);assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 6/);assert.ok(doc.querySelector('.gl-explanation.correct'));
  await click(d,'[aria-label="选择练习语法"]');[...doc.querySelectorAll('[role=option]')].find(n=>n.textContent.includes('全部语法')).click();await pause();assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 18/);
  await click(d,'[aria-label="选择练习单元"]');[...doc.querySelectorAll('[role=option]')].find(n=>n.textContent.includes('全部单元')).click();await pause();assert.match(doc.querySelector('.gl-exercise-meta').textContent,/1 \/ 216/);
 }finally{d.window.close();}
});
