import assert from 'node:assert/strict';
import {test} from 'node:test';
import {build} from 'esbuild';
import {JSDOM} from 'jsdom';
import {profileName,avatarUrl,saveProfile,MAX_AVATAR_BYTES} from '../src/account-profile.js';

test('nickname trims whitespace and rejects empty, long and control-character names',()=>{
 assert.equal(profileName('  学法语 🍀  '),'学法语 🍀');for(const n of ['', ' '.repeat(5),'a'.repeat(41),'a\nb'])assert.throws(()=>profileName(n));
});
test('avatars permit uploaded paths and HTTPS provider images but reject unsafe URLs',()=>{
 assert.ok(avatarUrl({pictureUrl:'/api/avatar/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp'}));assert.ok(avatarUrl({pictureUrl:'https://example.test/image.png'}));for(const u of ['javascript:alert(1)','data:image/svg+xml,example','http://example.test/avatar','//other.test/image'])assert.equal(avatarUrl({pictureUrl:u}),'');
});
test('profile changes use Identity metadata and upload only the processed avatar',async()=>{
 const calls=[],identity={updateUser:async value=>{calls.push(value);return {id:'a',name:value.data.full_name,pictureUrl:value.data.avatar_url};}},url='/api/avatar/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp',blob=new Blob(['small'],{type:'image/webp'});
 const fetcher=async(path,options)=>{assert.equal(path,'/api/avatar');assert.equal(options.body,blob);assert.equal(options.credentials,'same-origin');assert.equal(options.headers['Content-Type'],'image/webp');return {ok:true,json:async()=>({url})};};
 await saveProfile({name:' 新昵称 ',file:blob},identity,fetcher);assert.deepEqual(calls.pop(),{data:{full_name:'新昵称',avatar_url:url}});
 await saveProfile({name:'只改昵称'},identity,()=>{throw Error('must not upload');});assert.deepEqual(calls.pop(),{data:{full_name:'只改昵称'}});
 await saveProfile({name:'移除头像',picture:''},identity);assert.equal(calls.pop().data.avatar_url,'');
 await assert.rejects(saveProfile({name:'姓名',file:blob},identity,async()=>({ok:false,json:async()=>({error:'上传失败'})})),/上传失败/);assert.equal(calls.length,0);
});
// Upload authentication, signature validation and size limits use the Cloudflare API tests.

test('same-account profile save updates shared settings and avatar without reloading or resetting learning',async()=>{
 const mock=`const listeners=new Set();export const getUser=async()=>window.testUser,refreshSession=async()=>null,getSettings=async()=>({disableSignup:false}),handleAuthCallback=async()=>null;export const onAuthChange=fn=>{listeners.add(fn);return()=>listeners.delete(fn)};export const updateUser=async value=>{window.profileCalls.push(value);if(window.profileFail)throw Error('保存失败');window.testUser={...window.testUser,name:value.data.full_name,pictureUrl:value.data.avatar_url===undefined?window.testUser.pictureUrl:value.data.avatar_url};for(const fn of listeners)fn('user_updated',window.testUser);return window.testUser;};export const login=async()=>{},signup=async()=>({}),logout=async()=>{},requestPasswordRecovery=async()=>{},acceptInvite=async()=>{},verifyPasswordRecovery=async()=>({}),resetRecoveredPassword=async()=>({unchanged:false});`;
 const result=await build({entryPoints:['src/site.jsx'],bundle:true,platform:'browser',format:'iife',write:false,loader:{'.css':'empty'},logLevel:'silent',plugins:[{name:'auth',setup(b){b.onResolve({filter:/(^|\/)supabase-identity\.js$/},()=>({path:'auth',namespace:'mock'}));b.onLoad({filter:/.*/,namespace:'mock'},()=>({contents:mock,loader:'js'}));}}]});
 const d=new JSDOM('<div id="root"></div>',{url:'https://example.test/#/settings',pretendToBeVisual:true,runScripts:'dangerously'}),w=d.window,doc=w.document;
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});w.testUser={id:'a',name:'Alain',email:'a@example.test',pictureUrl:'https://example.test/old.png'};w.profileCalls=[];w.reads=0;w.fetch=async(_url,options)=>{if(!options||options.method!=='PUT')w.reads++;return {ok:true,json:async()=>({data:null,etag:'test'})};};
 const pause=()=>new Promise(r=>setTimeout(r,100)),click=async el=>{assert.ok(el);el.click();await pause();},input=(value)=>{const el=doc.querySelector('[aria-label="修改昵称"]');Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new w.Event('input',{bubbles:true}));};
 try{
 w.eval(result.outputFiles[0].text);
 for(let i=0;i<30&&!doc.querySelector('.ac-trigger.signed-in');i++)await pause();
 await click([...doc.querySelectorAll('.gl-settings-panel button')].find(b=>b.textContent==='账号设置'));assert.ok(doc.querySelector('.account-profile-editor'));const reads=w.reads,cache=w.localStorage.getItem('franmo-atelier:v2:user:a');
 input(' 新昵称 ');await pause();doc.querySelector('.account-profile-editor').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(w.testUser.name,'新昵称');assert.equal(w.reads,reads);assert.deepEqual(JSON.parse(w.localStorage.getItem('franmo-atelier:v2:user:a')).bundle,JSON.parse(cache).bundle);assert.match(doc.querySelector('.gl-settings-panel').textContent,/新昵称/);assert.equal(doc.querySelector('.ac-trigger img').getAttribute('src'),'https://example.test/old.png');
 await click([...doc.querySelectorAll('.account-profile-photo button')].find(x=>x.textContent==='移除头像'));doc.querySelector('.account-profile-editor').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(w.testUser.pictureUrl,'');assert.equal(doc.querySelector('.ac-trigger img'),null);assert.equal(doc.querySelector('.ac-trigger .ac-avatar').textContent,'新');
 w.profileFail=true;input('不应保存');await pause();doc.querySelector('.account-profile-editor').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));await pause();assert.equal(w.testUser.name,'新昵称');assert.match(doc.querySelector('[role=alert]').textContent,/保存失败/);
 }finally{w.close();}
});
