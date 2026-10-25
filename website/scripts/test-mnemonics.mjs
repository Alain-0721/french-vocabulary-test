import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {initialBooks} from '../src/books.js';
import {mnemonicFor} from '../src/vocabulary-mnemonics.js';
import * as Study from '../src/preview-study.js';
import {createDaily} from '../src/preview-review.js';

test('all 3469 supplied entries have reviewed mnemonics scoped to exact textbook content',()=>{
  let count=0;
  for(const book of initialBooks.filter(b=>b.bank))for(const entry of book.bank){
    const text=mnemonicFor(book,entry);assert.ok(text.trim(),`${book.id}/${entry.id}`);
    assert.ok(!text.includes('助记解析'));count++;
    assert.equal(mnemonicFor(book,{...entry,fr:entry.fr+'changed'}),'');
    assert.equal(mnemonicFor(book,{...entry,zh:entry.zh+'changed'}),'');
    assert.equal(mnemonicFor({id:'custom-import'},entry),'');
  }
  assert.equal(count,3469);
});
const book=initialBooks[0],main=Study.create(book.bank,book.level);
for(let i=0;i<4;i++)Study.pass(main,book.bank);
const quiz=createDaily(book,main).round;assert.ok(quiz);
const bundle=await build({stdin:{contents:`
 import React,{useState} from 'react';import {createRoot} from 'react-dom/client';
 import {ReviewQuiz,LibraryStatistics} from './src/navigation-preview-ui.jsx';
 import {reviewAction} from './src/preview-review.js';
 import {Quiz} from './src/study-preview-ui.jsx';
 import * as Study from './src/preview-study.js';
 const f=window.fixture;
 function StudyApp(){const [state,setState]=useState(f.main);window.currentStudy=state;
 const act=(action,id,kind)=>setState(previous=>{const next=structuredClone(previous);
 if(action==='toggle')Study.toggle(next,id);else if(action==='vote')Study.vote(next,id,kind);
 else if(action==='repeat')Study.repeat(next,f.book.bank);else if(action==='group')Study.active(next).group=id;
 return next;});
 return <Quiz book={f.book} state={state} attempt={Study.active(state)} act={act} settings={{layout:f.layout}} onSettings={()=>{}} titleFor={()=>({})} themeFor={()=>''}/>;}
 function App(){const [quiz,setQuiz]=useState(f.quiz);window.currentQuiz=quiz;
 return f.view==='library'?<LibraryStatistics book={f.book} state={f.main} view="library" go={()=>{}} titleFor={()=>({})} themeFor={()=>''}/>:<ReviewQuiz book={f.book} quiz={quiz} settings={{layout:'right'}} changeSettings={()=>{}} themeFor={()=>''} act={(a,id,k)=>setQuiz(q=>reviewAction(q,a,id,k,f.book))}/>;}
 createRoot(document.getElementById('root')).render(f.view==='study'?<StudyApp/>:<App/>);`,resolveDir:process.cwd(),loader:'jsx'},bundle:true,write:false,format:'iife',loader:{'.css':'empty'},logLevel:'silent'});
const pause=()=>new Promise(r=>setTimeout(r,40));
async function mount(view,layout='right'){const dom=new JSDOM('<div id="root"></div>',{url:'http://localhost',runScripts:'dangerously',pretendToBeVisual:true});dom.window.structuredClone=structuredClone;dom.window.fixture={book,main,quiz,view,layout};dom.window.eval(bundle.outputFiles[0].text);await pause();return dom;}
test('textbook mnemonics work in both layouts without flipping, voting or changing mastery; a retest collapses them',async()=>{
 for(const layout of ['classic','right']){
 const dom=await mount('study',layout),doc=dom.window.document,row=()=>doc.querySelector('.study-word-row');
 try{
  const before=JSON.stringify(dom.window.currentStudy),entry=book.bank.find(e=>e.id===row().dataset.wordId);
  assert.equal(doc.querySelectorAll('.study-mnemonic-toggle').length,doc.querySelectorAll('.study-word-row').length);
  assert.equal(row().querySelector('.word-mnemonic'),null);
  row().querySelector('.study-mnemonic-toggle').click();await pause();
  assert.equal(row().querySelector('.word-mnemonic p').textContent,mnemonicFor(book,entry));
  row().querySelector('.word-mnemonic p').click();await pause();
  assert.equal(JSON.stringify(dom.window.currentStudy),before);
  assert.ok(row().querySelector('.dp-answer').classList.contains('hidden'));
  row().querySelector('.dp-word-trigger').click();await pause();row().querySelector('.dp-votes .good').click();await pause();
  assert.equal(dom.window.currentStudy.stats[entry.id].good,1);assert.ok(row().querySelector('.word-mnemonic'));
  row().querySelector('.study-mnemonic-toggle').click();await pause();assert.equal(row().querySelector('.word-mnemonic'),null);
  row().querySelector('.study-mnemonic-toggle').click();await pause();
  [...doc.querySelectorAll('.dp-quiz-actions button')].find(b=>b.textContent.includes('再测本部分')).click();await pause();
  assert.equal(row().querySelector('.word-mnemonic'),null);assert.equal(dom.window.currentStudy.stats[entry.id].good,1);
  assert.equal(JSON.stringify(dom.window.currentStudy.mastered),JSON.stringify(main.mastered));
 }finally{dom.window.close();}
 }
});
test('daily mnemonics reveal independently of translation and scoring and reset for a new round',async()=>{
 const dom=await mount('daily'),doc=dom.window.document,row=()=>doc.querySelector('.study-word-row');
 try{
  const original=JSON.stringify(dom.window.currentQuiz);
  assert.equal(doc.querySelectorAll('.study-mnemonic-toggle').length,10);
  assert.equal(doc.querySelector('.word-mnemonic'),null);
  row().querySelector('.study-mnemonic-toggle').click();await pause();
  assert.equal(row().querySelector('.study-mnemonic-toggle').getAttribute('aria-expanded'),'true');
  assert.ok(row().querySelector('.word-mnemonic').textContent.includes(mnemonicFor(book,book.bank.find(e=>e.id===quiz.ids[0]))));
  assert.equal(JSON.stringify(dom.window.currentQuiz),original);
  assert.ok(row().querySelector('.dp-answer').classList.contains('hidden'));
  row().querySelector('.word-mnemonic p').click();await pause();assert.equal(JSON.stringify(dom.window.currentQuiz),original);
  row().querySelector('.dp-word-trigger').click();await pause();assert.ok(!row().querySelector('.dp-answer').classList.contains('hidden'));
  row().querySelector('.dp-votes .good').click();await pause();
  assert.equal(dom.window.currentQuiz.stats[quiz.ids[0]].good,1);assert.ok(row().querySelector('.word-mnemonic'));
  row().querySelector('.study-mnemonic-toggle').click();await pause();assert.equal(row().querySelector('.word-mnemonic'),null);
  row().querySelector('.study-mnemonic-toggle').click();await pause();
  doc.querySelector('.dp-quiz-actions button').click();await pause();
  assert.equal(row().querySelector('.word-mnemonic'),null);assert.equal(row().querySelector('.study-mnemonic-toggle').getAttribute('aria-expanded'),'false');
  assert.equal(dom.window.currentQuiz.stats[quiz.ids[0]].good,1);
 }finally{dom.window.close();}
});
test('complete dictionary uses the existing collapsed word details for mnemonics and retains source information',async()=>{
 const dom=await mount('library'),doc=dom.window.document;
 try{const details=doc.querySelector('.np-dictionary details');assert.equal(details.open,false);assert.equal(details.querySelector('.word-mnemonic p').textContent,mnemonicFor(book,book.bank[0]));assert.ok(details.textContent.includes('原书来源'));details.querySelector('summary').click();assert.equal(details.open,true);details.querySelector('summary').click();assert.equal(details.open,false);assert.ok(!doc.body.textContent.includes('助记解析'));}finally{dom.window.close();}
});
