import {initialBooks, ensureBookBanks} from './books.js';
import * as Study from './preview-study.js';
import {readBackup} from './preview-backup.js';
import {freshState as freshGrammar} from './grammar-preview/state.js';

export function freshMulti(){
  // 只给已有词库的课本建进度；其他课本的进度在打开课本、词库加载完成后再建。
  return {version:2,mode:'multi-atelier',books:initialBooks,progress:Object.fromEntries(initialBooks.filter(b=>b.bank).map(b=>[b.id,Study.create(b.bank,b.level)])),secondary:{},bookId:'edito-b1',settings:{...Study.DEFAULT_SETTINGS},theme:'light',grammar:freshGrammar(),generation:crypto.randomUUID(),updatedAt:new Date().toISOString()};
}
export function touchMulti(s){return {...s,generation:crypto.randomUUID(),updatedAt:new Date().toISOString()};}
export function restoreMulti(raw){
  try{
    const s=typeof raw==='string'?JSON.parse(raw):raw;
    if(s?.version!==2||s.mode!=='multi-atelier'||typeof s.generation!=='string'||!s.generation||!Number.isFinite(Date.parse(s.updatedAt)))return null;
    // 本机 / 云端保存的记录：内置课本的词库以文件里保存的为准（放宽模式），
    // 尚未打开过的课本本来就没有词库，直接保留描述即可。
    const base=freshMulti(),restored=readBackup({...s,version:1,mode:'multi-atelier-preview'},initialBooks,base.progress,{allowStoredBanks:true});
    return {...restored,grammar:restored.grammar||freshGrammar(),version:2,mode:'multi-atelier',generation:s.generation,updatedAt:s.updatedAt};
  }catch{return null;}
}
export async function migrateClassic(raw){
  // 旧版单课本记录的迁移需要旧引擎（含 Édito B1 词库），只在真正迁移时加载。
  const {restoreBundle}=await import('./engine.js');
  const old=restoreBundle(raw);if(!old)return null;
  await ensureBookBanks(['edito-b1']);
  const s=freshMulti(),converted=readBackup(old,initialBooks,s.progress);
  s.progress=converted.progress;
  // 普通检测功能已移除；旧版普通练习记录不再迁移。
  s.secondary['edito-b1']={daily:old.daily,dailyHistory:old.dailyHistory,dailyAllowed:s.progress['edito-b1'].order.filter(p=>s.progress['edito-b1'].mastered[p]),dailyStats:old.dailyStats,dailySerial:old.dailySerial};
  return restoreMulti(touchMulti(s));
}
