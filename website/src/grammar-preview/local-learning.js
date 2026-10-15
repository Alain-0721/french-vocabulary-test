import {useCallback,useEffect,useState} from 'react';
import {freshMulti,restoreMulti} from '../multi-learning.js';
import {loadState} from './state.js';

export const LOCAL_SYSTEM_KEY='franlumi:local-system:v1';
export function useLocalLearning(enabled){
 const [bundle,setBundle]=useState(()=>{
  if(enabled){try{const saved=restoreMulti(localStorage.getItem(LOCAL_SYSTEM_KEY));if(saved)return saved;}catch{}}
  const fresh=freshMulti();if(enabled)fresh.grammar=loadState(localStorage);return fresh;
 });
 const [sync,setSync]=useState('local'),[message,setMessage]=useState('');
 useEffect(()=>{if(!enabled)return;try{localStorage.setItem(LOCAL_SYSTEM_KEY,JSON.stringify(bundle));setSync('local');}catch{setSync('memory');}},[bundle,enabled]);
 const update=useCallback(fn=>setBundle(fn),[]),adopt=useCallback(data=>setBundle(data),[]);
 return {localPreview:true,bundle,update,adopt,sync,message,setMessage,user:null,offlineAccount:null,settings:false,authCallback:null};
}
