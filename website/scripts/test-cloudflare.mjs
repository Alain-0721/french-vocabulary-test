import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {PGlite} from '@electric-sql/pglite';
import {handleApi} from '../cloudflare/worker.js';
import {normalizeUser} from '../src/supabase-client.js';
import {freshMulti,restoreMulti} from '../src/multi-learning.js';
const env={SUPABASE_URL:'https://backend.test',SUPABASE_ANON_KEY:'public-test-key',ALLOWED_ORIGINS:'https://franmotest.netlify.app'};
const request=(path='/api/multi-progress',{method='GET',token='a',origin='https://app.test',body,headers={}}={})=>new Request('https://app.test'+path,{method,headers:{Origin:origin,...token?{Authorization:'Bearer '+token}:{},...headers},...body!==undefined?{body:typeof body==='string'?body:JSON.stringify(body)}:{}});
test('Pages shell excludes its server worker from offline storage and routes only APIs through it',async()=>{
 const sw=await readFile('dist-cloudflare/sw.js','utf8');
 const files=JSON.parse(sw.match(/const FILES=(\[[^;]+\]);/)[1]);
 assert.ok(files.includes('/index.html'));assert.ok(!files.some(file=>file.startsWith('/_')));
 for(const file of files)await readFile('dist-cloudflare'+file);
 assert.deepEqual(JSON.parse(await readFile('dist-cloudflare/_routes.json','utf8')),{version:1,include:['/api/*'],exclude:[]});
});
test('Cloudflare verifies users, isolates queries and sends auth to Supabase only',async()=>{
 const calls=[];const fetcher=async(url,options)=>{
  calls.push({url,options});assert.equal(new URL(url).origin,env.SUPABASE_URL);
  if(url.endsWith('/auth/v1/user'))return options.headers.Authorization==='Bearer bad'?new Response('',{status:401}):Response.json({id:options.headers.Authorization.slice(7)});
  assert.match(url,/user_id=eq.b$/);return Response.json([{data:{test:true},etag:'cloud-b'}]);
 };
 assert.equal((await handleApi(request(undefined,{token:null}),env,fetcher)).status,401);assert.equal(calls.length,0);
 assert.equal((await handleApi(request(undefined,{token:'bad'}),env,fetcher)).status,401);
 const result=await handleApi(request(undefined,{token:'b'}),env,fetcher);assert.equal(result.status,200);assert.equal((await result.json()).etag,'cloud-b');
 assert.equal(calls.at(-1).options.headers.Authorization,'Bearer b');
});
test('Cloudflare protects origins, permits existing native storage origin, validates backups and conflicts',async()=>{
 const calls=[];let modified=false;
 const fetcher=async(url,options)=>{calls.push({url,options});return url.endsWith('/user')?Response.json({id:'a'}):Response.json({modified,etag:modified?'new':null});};
 const data=freshMulti();
 assert.equal((await handleApi(request(undefined,{origin:'https://evil.test',method:'PUT',body:{data,etag:null}}),env,fetcher)).status,403);assert.equal(calls.length,0);
 const preflight=await handleApi(request(undefined,{method:'OPTIONS',origin:'https://franmotest.netlify.app',token:null}),env,fetcher);assert.equal(preflight.headers.get('Access-Control-Allow-Origin'),'https://franmotest.netlify.app');
 assert.equal((await handleApi(request(undefined,{method:'PUT',body:'{bad'}),env,fetcher)).status,400);
 assert.equal((await handleApi(request(undefined,{method:'PUT',body:{data:{invalid:true},etag:null}}),env,fetcher)).status,400);
 const result=await handleApi(request(undefined,{method:'PUT',body:{data,etag:'old'}}),env,fetcher);assert.equal(result.status,409);
 assert.deepEqual(JSON.parse(calls.at(-1).options.body),{p_data:restoreMulti(data),p_expected_etag:'old'});
 modified=true;assert.equal((await (await handleApi(request(undefined,{method:'PUT',body:{data,etag:'old'}}),env,fetcher)).json()).etag,'new');
});
test('legacy APK saves preserve existing grammar and still use atomic ETag protection',async()=>{
 const previous=freshMulti();previous.grammar.space='grammar';previous.grammar.topics[previous.grammar.current]={read:true,bookmarked:true};
 const old=freshMulti();delete old.grammar;let written;
 const fetcher=async(url,options)=>{
  if(url.endsWith('/user'))return Response.json({id:'a'});
  if(url.includes('/learning_records?'))return Response.json([{data:previous,etag:'existing'}]);
  written=JSON.parse(options.body);return Response.json({modified:true,etag:'next'});
 };
 const result=await handleApi(request(undefined,{method:'PUT',body:{data:old,etag:'existing'}}),env,fetcher);
 assert.equal(result.status,200);assert.deepEqual(written.p_data.grammar,previous.grammar);assert.equal(written.p_expected_etag,'existing');
 const unavailable=async(url,options)=>url.includes('/learning_records?')?new Response('',{status:503}):fetcher(url,options);
 assert.equal((await handleApi(request(undefined,{method:'PUT',body:{data:old,etag:'existing'}}),env,unavailable)).status,503);
});
test('2.0 clients preserve tense records and current clients can explicitly reset them',async()=>{
 const previous=freshMulti();previous.grammar.tense.topics.present={read:true,bookmarked:true};previous.grammar.practiceMode='tense';previous.grammar.recordsMode='tense';
 const old=freshMulti();delete old.grammar.tense;delete old.grammar.practiceMode;delete old.grammar.recordsMode;old.grammar.topics[old.grammar.current]={read:true};let written;
 const fetcher=async(url,options)=>{
  if(url.endsWith('/user'))return Response.json({id:'a'});
  if(url.includes('/learning_records?'))return Response.json([{data:previous,etag:'existing'}]);
  written=JSON.parse(options.body);return Response.json({modified:true,etag:'next'});
 };
 assert.equal((await handleApi(request(undefined,{method:'PUT',body:{data:old,etag:'existing'}}),env,fetcher)).status,200);
 assert.deepEqual(written.p_data.grammar.tense,previous.grammar.tense);assert.equal(written.p_data.grammar.practiceMode,'tense');assert.equal(written.p_data.grammar.recordsMode,'tense');assert.equal(written.p_data.grammar.topics[old.grammar.current].read,true);assert.equal(written.p_expected_etag,'existing');
 const current=freshMulti();assert.equal((await handleApi(request(undefined,{method:'PUT',body:{data:current,etag:'existing'}}),env,fetcher)).status,200);assert.deepEqual(written.p_data.grammar.tense,current.grammar.tense);
});

test('avatar API remains public for existing URLs, bounds uploads and rejects disguised images',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return url.endsWith('/user')?Response.json({id:'a'}):url.includes('/public/')?new Response('image'):Response.json({Key:'avatar'});};
 const name='12345678-1234-1234-1234-123456789012.webp';
 assert.equal((await handleApi(request('/api/avatar/../invalid'),env,fetcher)).status,404);
 const publicAvatar=await handleApi(request('/api/avatar/'+name,{token:null}),env,fetcher);assert.equal(publicAvatar.status,200);assert.match(publicAvatar.headers.get('Cache-Control'),/immutable/);assert.equal(calls.length,1);
 assert.equal((await handleApi(request('/api/avatar',{method:'POST',body:'html',headers:{'Content-Type':'image/webp'}}),env,fetcher)).status,400);
 assert.equal((await handleApi(request('/api/avatar',{method:'POST',body:'x',headers:{'Content-Length':'262145'}}),env,fetcher)).status,413);
 const body='RIFF1234WEBP';const result=await handleApi(request('/api/avatar',{method:'POST',body,headers:{'Content-Type':'image/webp'}}),env,fetcher);
 assert.match((await result.json()).url,/^\/api\/avatar\/[a-f0-9-]{36}\.webp$/);assert.equal(calls.at(-1).options.headers.Authorization,'Bearer a');
});
test('only trusted app metadata can map a migrated account to its prior local record scope',()=>{
 assert.equal(normalizeUser({id:'new',user_metadata:{legacy_user_id:'victim'}}).id,'new');
 assert.equal(normalizeUser({id:'new',app_metadata:{legacy_user_id:'old'}}).id,'old');
 assert.equal(normalizeUser({id:'new',app_metadata:{legacy_user_id:'../victim'}}).id,'new');
});
test('real PostgreSQL migration enforces own-user reads, atomic ETags, RPC-only writes and avatar ownership',async()=>{
 const db=new PGlite();const a='11111111-1111-1111-1111-111111111111',b='22222222-2222-2222-2222-222222222222';
 try{
  await db.exec(`create role anon; create role authenticated; create schema auth; create schema storage;
   create table auth.users(id uuid primary key);
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   grant usage on schema auth,public,storage to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text); alter table storage.objects enable row level security;
   grant insert on storage.objects to authenticated;
   insert into auth.users values('${a}'),('${b}');`);
  await db.exec(await readFile('supabase/migrations/202610070001_learning.sql','utf8'));
  // The migration is repeatable during deployment recovery.
  await db.exec(await readFile('supabase/migrations/202610070001_learning.sql','utf8'));
  const login=async id=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false)",[id]);await db.exec('set role authenticated');};
  const save=async(data,etag)=>((await db.query('select public.save_learning_record($1::jsonb,$2::text) as result',[JSON.stringify(data),etag])).rows[0].result);
  const data={mode:'multi-atelier',version:2,progress:{}};
  await login(a);const first=await save(data,null);assert.equal(first.modified,true);
  assert.equal((await save(data,null)).modified,false);assert.equal((await save(data,'stale')).modified,false);
  const second=await save(data,first.etag);assert.equal(second.modified,true);assert.notEqual(first.etag,second.etag);
  await assert.rejects(db.query('update public.learning_records set etag=$1',['bad']),/permission denied/);
  await assert.rejects(save({mode:'invalid'},second.etag),/Invalid learning record/);
  await login(b);assert.equal((await db.query('select * from public.learning_records')).rows.length,0);
  assert.equal((await save(data,second.etag)).modified,false);assert.equal((await save(data,null)).modified,true);
  assert.equal((await db.query('select * from public.learning_records')).rows[0].user_id,b);
  const name='12345678-1234-1234-1234-123456789012.webp';
  await assert.rejects(db.query('insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)',['avatars',name,a]),/row-level security/);
  await db.query('insert into storage.objects(bucket_id,name,owner_id) values($1,$2,$3)',['avatars',name,b]);
  await db.exec('reset role; set role anon');
  await assert.rejects(db.query('select * from public.learning_records'),/permission denied/);
  await assert.rejects(save(data,null),/permission denied/);
 }finally{await db.close();}
});
