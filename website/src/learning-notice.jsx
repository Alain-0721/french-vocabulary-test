import React,{useEffect} from 'react';
import {Info,X} from 'lucide-react';

export function LearningNotice({message,setMessage,className='dp-toast',duration=4000}){
 useEffect(()=>{
  if(!message)return;
  const timer=setTimeout(()=>setMessage(current=>current===message?'':current),duration);
  return()=>clearTimeout(timer);
 },[message,setMessage,duration]);
 if(!message)return null;
 return <div className={className} role="status" aria-live="polite" aria-atomic="true" data-learning-notice>
  <Info size={18}/><span>{message}</span>
  <button type="button" aria-label="关闭提示" onClick={()=>setMessage(current=>current===message?'':current)}><X size={16}/></button>
 </div>;
}
