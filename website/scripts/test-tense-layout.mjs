import test from 'node:test';
import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import bank from '../src/grammar-preview/tense-bank.json' with {type:'json'};
import conjugations from '../src/grammar-preview/conjugation-bank.json' with {type:'json'};
import {buildTenseLesson,tenseFamilies,readingOrder,familyFor} from '../src/grammar-preview/tense-layout.js';
import {etreVerbs} from '../src/grammar-preview/compound-past-notes.js';

test('all 22 existing topic IDs occur exactly once in the new taxonomy',()=>{
 assert.equal(readingOrder.length,22);
 assert.equal(new Set(readingOrder).size,22);
 assert.deepEqual([...readingOrder].sort(),bank.topics.map(t=>t.id).sort());
 assert.equal(familyFor('present').label,'直陈式');
 assert.equal(familyFor('conditional-past').label,'条件式');
 assert.equal(familyFor('subjunctive').label,'虚拟式');
 assert.equal(familyFor('nonfinite').label,'非人称形式');
 assert.equal(familyFor('hypothesis').label,'综合运用');
 assert.deepEqual(tenseFamilies[0].groups.map(g=>g.label),['现在','过去','将来']);
});
test('each topic has populated reading sections; present-tense rules exclude other-tense insertions',()=>{
 for(const topic of bank.topics){
  const tabs=buildTenseLesson(topic,conjugations.supplements[topic.id]);
  assert.ok(tabs.length>=2,topic.id);
  assert.equal(new Set(tabs.map(t=>t.id)).size,tabs.length);
  for(const tab of tabs){assert.ok(tab.sections.length,`${topic.id}:${tab.id}`);for(const s of tab.sections)assert.ok(s.title&&s.blocks.length,`${topic.id}:${s.title}`);}
 }
 const present=buildTenseLesson(bank.topics[0],conjugations.supplements.present);
 assert.deepEqual(present.map(t=>t.label),['用法','构成','变位','辨析']);
 assert.doesNotMatch(JSON.stringify(present),/mangeai|étudiions|achèter-/);
 const common=present.find(t=>t.id==='verbs').sections.slice(0,3).flatMap(s=>s.blocks[0].rows);
 assert.equal(common.length,22);assert.equal(new Set(common.map(r=>r[0])).size,22);
 for(const id of ['future','conditional']){
  const lesson=buildTenseLesson(bank.topics.find(t=>t.id===id),conjugations.supplements[id]);
  const rows=lesson.find(t=>t.id==='verbs').sections[0].blocks[0].rows;
  assert.ok(rows.some(r=>r[0]==='être'&&r[1]==='ser-'));
  assert.ok(rows.some(r=>r[0]==='envoyer'&&r[1]==='enverr-'));
  assert.equal(lesson.find(t=>t.id==='form').sections[0].blocks[1].rows.length,6);
 }
 for(const [id,aux] of [['pluperfect','imperfect'],['future-perfect','future'],['conditional-past','conditional'],['subjunctive-past','subjunctive']]){
  const lesson=buildTenseLesson(bank.topics.find(t=>t.id===id),conjugations.supplements[id]);
  const blocks=lesson.find(t=>t.id==='form').sections[0].blocks;
  assert.deepEqual(blocks[0].rows.map(r=>r[1]),conjugations.models.find(m=>m.id==='avoir').forms[aux]);
  assert.deepEqual(blocks[0].rows.map(r=>r[2]),conjugations.models.find(m=>m.id==='être').forms[aux]);
  assert.ok(blocks.some(b=>b.t==='past-reference'));
 }
 const past=buildTenseLesson(bank.topics.find(t=>t.id==='compound-past'),conjugations.supplements['compound-past']);
 assert.ok(past.find(t=>t.id==='form').sections.some(s=>s.title==='否定与疑问'));
 assert.ok(past.find(t=>t.id==='verbs').sections.some(s=>s.blocks.some(b=>b.rows?.length>100)));
});

const bundle=await build({stdin:{contents:`
 import React from 'react';import {createRoot} from 'react-dom/client';
 import {TenseCatalog,TenseReader} from './src/grammar-preview/tense-ui.jsx';
 import {freshTense} from './src/grammar-preview/tense-state.js';
 import bank from './src/grammar-preview/tense-bank.json';
 const root=createRoot(document.getElementById('root'));
 window.showCatalog=()=>root.render(<TenseCatalog state={freshTense()} open={t=>window.selected=t.id}/>);
 window.showReader=id=>root.render(<TenseReader key={id} topic={bank.topics.find(t=>t.id===id)} state={freshTense()} update={()=>{}} open={()=>{}} go={()=>{}} practice={id=>window.practiced=id} bookBank={{topics:[]}} openBook={()=>{}}/>);
 `,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',platform:'browser',loader:{'.css':'empty'},logLevel:'silent'});
const pause=()=>new Promise(r=>setTimeout(r,80));
test('catalog, every reader, verb selection and translation toggles work without losing content',async()=>{
 const d=new JSDOM('<div class="gl-scroll-area"><div id="root"></div></div>',{url:'http://localhost/',runScripts:'dangerously',pretendToBeVisual:true});
 try{
  d.window.eval(bundle.outputFiles[0].text);d.window.showCatalog();await pause();
  const doc=d.window.document;
  assert.equal(doc.querySelectorAll('.tl-card').length,22);
  assert.equal(doc.querySelectorAll('[data-family=indicative] .tl-card').length,10);
  for(const t of bank.topics){
   d.window.showReader(t.id);await pause();
   assert.equal(doc.querySelector('.gl-topic-heading h1').textContent,t.zh);
   assert.ok(doc.querySelector('[role=tabpanel]:not([hidden])'));
   assert.equal(doc.querySelectorAll('[role=tab]').length,buildTenseLesson(t,conjugations.supplements[t.id]).length);
  }
  d.window.showReader('present');await pause();
  const use=doc.querySelector('[role=tabpanel]:not([hidden])');
  const translation=use.querySelector('.tl-example p');assert.equal(translation.hidden,true);
  use.querySelector('.tl-example button').click();await pause();assert.equal(translation.hidden,false);
  use.querySelector('.tl-example button').click();await pause();assert.equal(translation.hidden,true);
  doc.querySelector('#lesson-tab-verbs').click();await pause();
  const panel=doc.querySelector('#lesson-panel-verbs');assert.equal(panel.hidden,false);
  assert.equal(panel.querySelectorAll('.tl-person-table>div').length,6); // optional regular full-person model
  assert.equal(panel.querySelectorAll('.tl-note-table tbody tr').length,30); // 22 verbs + eight spelling rules
  panel.querySelector('.tl-model-table .choice-trigger').click();await pause();
  [...doc.querySelectorAll('[role=option]')].find(o=>o.textContent.includes('finir')).click();await pause();
  assert.match(panel.querySelector('.tl-person-table').textContent,/finissons/);
  const saved=JSON.parse(d.window.sessionStorage.getItem('franlumi:tense-view:present'));assert.equal(saved.active,'verbs');
  d.window.showReader('compound-past');await pause();d.window.showReader('present');await pause();
  assert.equal(doc.querySelector('#lesson-tab-verbs').getAttribute('aria-selected'),'true');
  doc.querySelector('#lesson-panel-verbs .gl-practice-link').click();assert.equal(d.window.practiced,'present');
  d.window.showReader('compound-past');await pause();
  doc.querySelector('#lesson-tab-form').click();await pause();
  const etre=[...doc.querySelectorAll('#lesson-panel-form details')].find(e=>e.querySelector('summary').textContent.includes('être +'));
  assert.equal(etre.open,true);
  assert.equal(etre.querySelectorAll('.tl-note-table tbody tr').length,17);
  for(const row of etreVerbs)for(const cell of row)assert.ok(etre.textContent.includes(cell));
  assert.equal(etre.querySelector('.choice-trigger'),null);
  assert.match(etre.textContent,/Elle s’est vue/);
 }finally{d.window.close();}
});
