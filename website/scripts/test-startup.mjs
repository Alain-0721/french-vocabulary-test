import assert from 'node:assert/strict';
import {test} from 'node:test';
import {performance} from 'node:perf_hooks';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {freshMulti} from '../src/multi-learning.js';
import * as Study from '../src/preview-study.js';
import {rememberLocalAccount} from '../src/offline-account.js';

const identity=`const listeners=new Set();window.emitAuth=(event,user)=>{window.identityUser=user;for(const fn of listeners)fn(event,user);};export const refreshSession=()=>window.authGate.promise,getUser=async()=>window.identityUser,getSettings=async()=>({disableSignup:false}),handleAuthCallback=async()=>null,onAuthChange=fn=>{listeners.add(fn);return()=>listeners.delete(fn);},login=async()=>{},logout=async()=>window.emitAuth('logout',null),signup=async()=>({}),requestPasswordRecovery=async()=>{},updateUser=async()=>{},acceptInvite=async()=>{};`;
const bundle=await build({entryPoints:['src/site.jsx'],bundle:true,write:false,format:'iife',loader:{'.css':'empty'},define:{'import.meta.env.PROD':'false','import.meta.env.VITE_NATIVE_APP':'"true"'},logLevel:'silent',plugins:[{name:'startup-network-fixtures',setup(b){
 b.onResolve({filter:/^@netlify\/identity$/},()=>({path:'identity',namespace:'startup'}));
 b.onResolve({filter:/(^|\/)api-fetch\.js$/},()=>({path:'api',namespace:'startup'}));
 b.onResolve({filter:/(^|\/)supabase-client\.js$/},()=>({path:'backend',namespace:'startup'}));
 b.onLoad({filter:/.*/,namespace:'startup'},a=>({contents:a.path==='identity'?identity:a.path==='api'?'export const apiFetch=(url,options)=>fetch(url,options),apiUrl=path=>path;':'export const backendConfigured=true;export const normalizeUser=user=>user;export const supabaseClient=()=>{throw Error("Unexpected real SDK call")};',loader:'js'}));
}}]});
const pause=(ms=30)=>new Promise(r=>setTimeout(r,ms));
const gate=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function ready(w,selector){for(let i=0;i<60&&!w.document.querySelector(selector);i++)await pause();assert.ok(w.document.querySelector(selector),selector);}
function boot({account=true}={}){
 const dom=new JSDOM('<div id="root"></div>',{url:'https://app.example.test/',runScripts:'dangerously',pretendToBeVisual:true}),w=dom.window;
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
 w.authGate=gate();w.cloudGate=gate();w.identityUser=account?{id:'slow-user',name:'Alain',email:'test@example.invalid'}:null;w.requests=[];
 w.fetch=async(url,options={})=>{w.requests.push({url,options});return options.method==='PUT'?{ok:true,status:200,json:async()=>({etag:'saved'})}:w.cloudGate.promise;};
 const own=freshMulti();own.grammar.space='words';own.grammar.last.words='study';const main=own.progress['edito-b1'],word=Study.active(main).ids[0];Study.toggle(main,word);Study.vote(main,word,'good');
 const guest=freshMulti();guest.grammar.space='words';guest.grammar.last.words='home';const guestRaw=JSON.stringify({bundle:guest,dirty:false,etag:null});w.localStorage.setItem('franmo-atelier:v2:guest',guestRaw);
 if(account){rememberLocalAccount(w.identityUser,w.localStorage);w.localStorage.setItem('franmo-atelier:v2:user:slow-user',JSON.stringify({bundle:own,dirty:false,etag:'known'}));}
 const started=performance.now();w.eval(bundle.outputFiles[0].text);return {dom,w,own,word,guestRaw,started};
}
const saved=w=>JSON.parse(w.localStorage.getItem('franmo-atelier:v2:user:slow-user'));
async function vote(w,kind){await ready(w,'.dp-votes .'+kind);w.document.querySelector('.dp-votes .'+kind).click();await pause();}
test('cached App opens and saves edits even when authentication never completes',async t=>{
 const {dom,w,word,guestRaw,started}=boot();try{
  await ready(w,'.study-mnemonic-toggle');t.diagnostic(`Local App became interactive in ${Math.round(performance.now()-started)}ms with authentication still pending`);
  assert.ok(!w.document.body.textContent.includes('正在恢复学习记录'));assert.equal(w.requests.length,0);assert.equal(w.document.querySelector('.ac-trigger').getAttribute('aria-label'),'查看本机账号记录');
  await vote(w,'bad');assert.equal(saved(w).bundle.progress['edito-b1'].stats[word].bad,1);assert.equal(saved(w).dirty,true);assert.equal(w.localStorage.getItem('franmo-atelier:v2:guest'),guestRaw);
 }finally{dom.window.close();}
});
test('edits during auth and cloud reads are retained and uploaded only after ETag checks',async()=>{
 const {dom,w,word,own}=boot();try{
  await ready(w,'.dp-votes');await vote(w,'bad');w.authGate.resolve();await pause(80);assert.ok(w.requests.some(r=>!r.options.method));assert.ok(!w.requests.some(r=>r.options.method==='PUT'));
  await vote(w,'good');await vote(w,'bad');w.cloudGate.resolve({ok:true,status:200,json:async()=>({data:own,etag:'known'})});await pause(900);
  const put=w.requests.find(r=>r.options.method==='PUT');assert.ok(put);const body=JSON.parse(put.options.body);assert.equal(body.etag,'known');assert.equal(body.data.progress['edito-b1'].stats[word].bad,1);assert.equal(saved(w).dirty,false);
 }finally{dom.window.close();}
});
test('a newer cloud record cannot overwrite edits made while the App was opening',async()=>{
 const {dom,w,word,own}=boot();try{
  await ready(w,'.dp-votes');w.authGate.resolve();await pause(80);await vote(w,'bad');w.cloudGate.resolve({ok:true,status:200,json:async()=>({data:own,etag:'another-device'})});await pause(800);
  assert.equal(saved(w).bundle.progress['edito-b1'].stats[word].bad,1);assert.ok(saved(w).dirty);assert.ok(!w.requests.some(r=>r.options.method==='PUT'));assert.ok(w.document.body.textContent.includes('另一台设备已更新'));
 }finally{dom.window.close();}
});
test('logout cancels a pending cloud read and prevents old responses from restoring the account',async()=>{
 const {dom,w,own}=boot();try{
  await ready(w,'.dp-votes');w.authGate.resolve();await pause(80);w.emitAuth('logout',null);await ready(w,'.np-hero');w.cloudGate.resolve({ok:true,status:200,json:async()=>({data:own,etag:'known'})});await pause(120);
  assert.ok(w.document.querySelector('.ac-trigger.guest'));assert.equal(JSON.parse(w.localStorage.getItem('franmo-atelier:v2:guest')).bundle.progress['edito-b1'].current,0);assert.ok(!w.requests.some(r=>r.options.method==='PUT'));
 }finally{dom.window.close();}
});
test('guest App also opens without waiting for the network',async()=>{
 const {dom,w}=boot({account:false});try{await ready(w,'.np-hero');assert.ok(!w.document.body.textContent.includes('正在恢复学习记录'));assert.equal(w.requests.length,0);}finally{dom.window.close();}
});
test('a delayed startup auth result cannot re-enter an account after logout',async()=>{
 const {dom,w}=boot();try{
  await ready(w,'.dp-votes');await pause(80);const previous=w.identityUser;w.emitAuth('logout',null);await ready(w,'.np-hero');w.identityUser=previous;w.authGate.resolve();await pause(150);
  assert.ok(w.document.querySelector('.ac-trigger.guest'));assert.equal(w.requests.length,0);
 }finally{dom.window.close();}
});
test('failed cloud reads also preserve edits made while checking',async()=>{
 const {dom,w,word}=boot();try{
  await ready(w,'.dp-votes');w.authGate.resolve();await pause(80);await vote(w,'bad');w.cloudGate.resolve({ok:false,status:503});await pause(150);
  assert.equal(saved(w).bundle.progress['edito-b1'].stats[word].bad,1);assert.equal(saved(w).dirty,true);assert.ok(w.document.querySelector('.study-mnemonic-toggle'));
 }finally{dom.window.close();}
});
