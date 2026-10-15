import {useCallback,useEffect,useRef,useState} from 'react';
import {getUser,getSettings,handleAuthCallback,onAuthChange,refreshSession} from '@netlify/identity';
import {freshMulti as fresh,restoreMulti as restoreBundle,migrateClassic,touchMulti} from './multi-learning.js';
import {rememberIdentitySession,restoreIdentitySession} from './identity-session';
import {rememberLocalAccount,readLocalAccount} from './offline-account.js';
import {apiFetch as fetch} from './api-fetch.js';
import {backendConfigured} from './supabase-client.js';
const prefix='franmo-atelier:v2:';
function readCache(key){try{let raw=localStorage.getItem(key);if(!raw){const legacy=JSON.parse(localStorage.getItem(key.replace(prefix,'edito-atelier:v1:'))||'null');if(!legacy)return null;const migrated=migrateClassic(legacy.bundle);const theme=localStorage.getItem('edito-theme');if(migrated&&['light','dark','system'].includes(theme))migrated.theme=theme;return migrated?{bundle:migrated,dirty:true,etag:null}:{corrupt:true};}const data=JSON.parse(raw),bundle=restoreBundle(data.bundle);return {...data,bundle,corrupt:!bundle};}catch{return {corrupt:true};}}
function localStart(enabled){
 const account=enabled?readLocalAccount():null,scope=prefix+(account?'user:'+account.id:'guest'),local=enabled?readCache(scope):null;
 return {account,scope,bundle:local?.bundle||fresh(),dirty:!!local?.dirty,etag:local?.etag||null,corrupt:!!local?.corrupt};
}
export function useMultiLearning(enabled=true){
 const [start]=useState(()=>localStart(enabled)),[bundle,setBundle]=useState(start.bundle);
 const [user,setUser]=useState(null),[offlineAccount,setOfflineAccount]=useState(start.account),[settings,setSettings]=useState(null),[sync,setSync]=useState(start.corrupt?'memory':start.account?'offline-account':'local'),[message,setMessage]=useState(start.corrupt?'原本机记录无法读取，已保留原文件。请导入有效备份；当前记录仅暂存。':''),[authCallback,setAuthCallback]=useState(null);
 const scope=useRef(start.scope),ready=useRef(false),etag=useRef(start.etag),clean=useRef(start.dirty?null:start.bundle.generation),current=useRef(bundle),uid=useRef(null),writing=useRef(false),blocked=useRef(false),generation=useRef(0),storageBroken=useRef(start.corrupt);
 const localOwner=useRef(start.account),currentUser=useRef(null);localOwner.current=offlineAccount;currentUser.current=user;
 const cache=useCallback((data,dirty)=>{
  if(storageBroken.current)return false;
  try{localStorage.setItem(scope.current,JSON.stringify({bundle:data,dirty,etag:etag.current}));return true;}catch{setSync('memory');return false;}
 },[]);
 const load=useCallback(async(nextUser,localAccount=null)=>{
  // Flush edits before changing account scope, including edits made while auth
  // or a prior cloud read is still pending.
  cache(current.current,clean.current!==current.current.generation);
  const nextScope=prefix+(nextUser||localAccount?'user:'+(nextUser||localAccount).id:'guest'),sameScope=nextScope===scope.current;
  const local=sameScope?{bundle:current.current,dirty:clean.current!==current.current.generation,etag:etag.current,corrupt:storageBroken.current}:readCache(nextScope);
  const turn=++generation.current;ready.current=false;blocked.current=false;uid.current=nextUser?.id||null;setUser(nextUser);
  setOfflineAccount(localAccount);localOwner.current=localAccount;currentUser.current=nextUser;
  if(!localAccount)rememberLocalAccount(nextUser);
  scope.current=nextScope;storageBroken.current=!!local?.corrupt;
  let data=local?.bundle||fresh();etag.current=local?.etag||null;clean.current=local?.dirty?null:data.generation;
  current.current=data;setBundle(data);
  setSync(nextUser?'checking':localAccount?'offline-account':'local');
  if(local?.corrupt)setMessage('原本机记录无法读取，已保留原文件。请导入有效备份；当前记录仅暂存。');
  if(nextUser){
   try{
    const response=await fetch('/api/multi-progress',{credentials:'same-origin'});if(!response.ok)throw Error('暂时无法读取云端记录');
    const cloud=await response.json();if(turn!==generation.current)return;
    // Use the latest in-memory snapshot, never the snapshot captured before
    // the request: users can keep learning while the network is slow.
    data=current.current;const dirty=clean.current!==data.generation;
    if(cloud.data){
     const restored=restoreBundle(cloud.data);if(!restored)throw Error('云端记录校验失败');
     if(dirty&&etag.current!==cloud.etag){blocked.current=true;setSync('conflict');setMessage('另一台设备已更新。请先导出本机备份，再读取云端记录。');}
     else if(dirty){etag.current=cloud.etag;setSync('pending');}
     else{data=restored;etag.current=cloud.etag;clean.current=data.generation;setSync('cloud');storageBroken.current=false;}
    }else{etag.current=null;clean.current=null;setSync('pending');}
   }catch{if(turn!==generation.current)return;data=current.current;setSync('offline');setMessage('云端暂时不可用，继续使用本机记录。');}
  }
  if(turn!==generation.current)return;current.current=data;ready.current=true;setBundle(data);
 },[cache]);
 const saveCloud=useCallback(async()=>{
  if(!ready.current||!uid.current||blocked.current||writing.current||clean.current===current.current.generation)return;
  if(navigator.onLine===false){setSync('offline');return;}
  writing.current=true;const owner=uid.current,data=current.current,base=etag.current,turn=generation.current;
  setSync('saving');
  try{
   const response=await fetch('/api/multi-progress',{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({data,etag:base})});
   if(owner!==uid.current||turn!==generation.current)return;
   if(response.status===409){blocked.current=true;setSync('conflict');setMessage('另一台设备已更新。请导出本机备份，再读取云端记录。');return;}
   if(!response.ok)throw Error('同步未完成');
   const result=await response.json();etag.current=result.etag;clean.current=data.generation;
   cache(current.current,clean.current!==current.current.generation);setSync('cloud');
  }catch{if(owner===uid.current){setSync('offline');setMessage('暂时无法同步，记录保存在本机；可稍后重试。');}}
  finally{writing.current=false;if(owner!==uid.current&&uid.current)setTimeout(saveCloud,0);}
 },[cache]);
 useEffect(()=>{
  if(!enabled)return;
  let alive=true;
  (async()=>{
   try{const result=/(access_token|confirmation_token|recovery_token|invite_token|email_change_token)=/.test(location.hash)?await handleAuthCallback():null;if(result&&alive)setAuthCallback(result);}catch{if(alive)setMessage('账号验证链接未生效，请重新获取验证邮件。');}
   if(navigator.onLine===false){const last=readLocalAccount();if(alive){await load(null,last);setSettings(false);}return;}
   const authTurn=generation.current;
   try{const restored=await restoreIdentitySession({getUser,refreshSession});if(alive&&authTurn===generation.current)await load(restored,!restored&&backendConfigured?readLocalAccount():null);}catch{if(alive&&authTurn===generation.current){await load(null,readLocalAccount());setMessage('账号服务暂不可用，先使用本机记录；联网后可重新登录。');}}
   try{const config=await getSettings();if(alive)setSettings(config);}catch{if(alive)setSettings(false);}
  })();
  const unsubscribe=onAuthChange((_event,next)=>{if(next){rememberIdentitySession();rememberLocalAccount(next);}if(alive){if((next?.id||null)!==uid.current||next&&localOwner.current)load(next);else if(next)setUser(next);else if(/logout/i.test(_event)){rememberLocalAccount(null);load(null);}}});
  const reconnect=async()=>{
   if(!alive)return;
   if(!localOwner.current&&!uid.current){try{const config=await getSettings();if(alive)setSettings(config);}catch{}return;}
   cache(current.current,clean.current!==current.current.generation);
   const authTurn=generation.current;
   try{const next=await restoreIdentitySession({getUser,refreshSession});if(!alive||authTurn!==generation.current)return;await load(next,!next&&backendConfigured?readLocalAccount():null);if(!next)setMessage('登录已失效。原账号的离线记录仍保存在本机，请重新登录原账号后同步。');const config=await getSettings();if(alive)setSettings(config);}catch{if(alive&&authTurn===generation.current)setMessage('暂时无法恢复账号连接，本机记录保留，请稍后重试。');}
  };
  window.addEventListener('online',reconnect);
  return()=>{alive=false;unsubscribe();window.removeEventListener('online',reconnect);};
 },[load,enabled]);
 useEffect(()=>{
  if(!enabled||bundle!==current.current)return;
  const dirty=clean.current!==bundle.generation;
  const saved=cache(bundle,dirty);
  if(!user)setSync(saved?(offlineAccount?'offline-account':'local'):'memory');
  if(user&&dirty&&ready.current&&!blocked.current){const timer=setTimeout(saveCloud,650);return()=>clearTimeout(timer);}
 },[bundle,user,offlineAccount,cache,saveCloud,enabled]);
 // If an edit arrives during a request, serialize the newer snapshot after it completes.
 useEffect(()=>{if(enabled&&ready.current&&['cloud','pending'].includes(sync)&&!blocked.current&&clean.current!==current.current.generation){const timer=setTimeout(saveCloud,100);return()=>clearTimeout(timer);}},[sync,bundle,saveCloud,enabled]);
 const update=useCallback(fn=>{const data=fn(current.current);current.current=data;setBundle(data);},[]);
 const adopt=useCallback(data=>{storageBroken.current=false;blocked.current=false;clean.current=null;current.current=data;setBundle(data);},[]);
 const pull=useCallback(async()=>{
  if(!user)return;const response=await fetch('/api/multi-progress',{credentials:'same-origin'});if(!response.ok)throw Error('读取云端失败');
  const cloud=await response.json(),data=restoreBundle(cloud.data);if(!data)throw Error('云端尚无有效记录');
  etag.current=cloud.etag;clean.current=data.generation;blocked.current=false;storageBroken.current=false;current.current=data;setBundle(data);setSync('cloud');setMessage('已读取最新云端记录。');
 },[user]);
 return {bundle,update,adopt,user,offlineAccount,settings,sync,message,setMessage,saveCloud,pull,authCallback,setAuthCallback,returnToGuest:()=>{rememberLocalAccount(null);load(null);},guest:()=>readCache(prefix+'guest')?.bundle};
}

export function useLearningSlice(learning,key,initialize,enabled){
 const [local,setLocal]=useState(initialize);
 const set=useCallback(value=>{if(!enabled){setLocal(value);return;}learning.update(old=>{const next=typeof value==='function'?value(old[key]):value;return next===old[key]?old:touchMulti({...old,[key]:next});});},[enabled,learning.update,key]);
 return [enabled?learning.bundle[key]:local,set];
}
