import React,{useMemo,useState} from 'react';
import {Search,ChevronDown} from 'lucide-react';
import {ChoiceMenu} from '../choice-menu.jsx';
import data from './conjugation-bank.json';
import './conjugation.css';

export const conjugationNames={'present':'现在时','near-future':'最近将来时','recent-past':'最近过去时','ongoing':'现在进行时','imperative':'命令式','compound-past':'复合过去时','imperfect':'未完成过去时','pluperfect':'愈过去时','simple-past':'简单过去时','future':'简单将来时','future-perfect':'先将来时','conditional':'条件式现在时','conditional-past':'条件式过去时','subjunctive':'虚拟式现在时','subjunctive-past':'虚拟式过去时'};
const canonical=x=>x.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’']/g,'');
export function ConjugationPanel({tense:fixedTense,compact=false}){
 const [tense,setTense]=useState(fixedTense||'present'),[verb,setVerb]=useState('être'),[query,setQuery]=useState(''),[kind,setKind]=useState('all');
 const selectedTense=fixedTense||tense,Panel=compact?'details':'section';
 const matching=useMemo(()=>data.models.filter(m=>(kind==='all'||kind==='regular'&&['regular','spelling'].includes(m.family)||kind==='irregular'&&!['regular','spelling'].includes(m.family))&&canonical(`${m.id} ${m.zh} ${m.familyWords.join(' ')}`).includes(canonical(query))),[query,kind]);
 const exact=query.trim()?matching.find(m=>canonical(m.id)===canonical(query)):null;
 const selected=exact||matching.find(m=>m.id===verb)||matching[0],actualVerb=selected?.id;
 return <Panel className={`cg-panel ${compact?'cg-compact':''}`} aria-label="完整变位查询">{compact?<summary className="cg-panel-toggle"><h2>不规则与特殊变位 完整人称表</h2><ChevronDown size={17}/></summary>:<h2>规则与不规则变位速查</h2>}<p>按动词、中文或同族动词搜索；包含派生词与代词式形式，例外单独说明。</p>
 <label className="gl-search"><Search size={17}/><input aria-label="搜索变位动词" value={query} placeholder="如 prendre、解决、comprendre…" onChange={e=>setQuery(e.target.value)}/></label>
 <div className="gl-chips" aria-label="变位模型分类">{[['all','全部模型'],['regular','规则与拼写'],['irregular','不规则']].map(([id,label])=><button key={id} aria-pressed={kind===id} className={kind===id?'active':''} onClick={()=>setKind(id)}>{label}</button>)}</div>
 <div className="tl-dual"><div><span>动词模型 · {matching.length} 个</span><ChoiceMenu presentation="dropdown" label="选择动词" value={actualVerb||''} options={matching.map(m=>({value:m.id,label:`${m.id} · ${m.zh}`}))} onChange={setVerb}/></div><div><span>时态</span>{fixedTense?<div className="cg-fixed-tense">{conjugationNames[fixedTense]}</div>:<ChoiceMenu presentation="dropdown" label="选择速查时态" value={selectedTense} options={Object.entries(conjugationNames).map(([value,label])=>({value,label}))} onChange={setTense}/>}</div></div>
 {selected?<><div className="tl-verb-forms" data-model={actualVerb} data-tense={selectedTense}>{data.persons.map((person,i)=><div key={person}><span>{person}</span><strong lang="fr">{selected.forms[selectedTense]?.[i]||'—'}</strong></div>)}</div><div className="cg-meta"><span>过去分词 <b lang="fr">{selected.participle}</b></span><span>助动词 <b lang="fr">{selected.auxiliary}</b></span><span>将来词干 <b lang="fr">{selected.futureStem}-</b></span></div><div className="tl-note"><strong>同族与例外</strong><p>{selected.familyWords.join(' · ')}</p><p>{selected.note}</p>{['imperative','simple-past'].includes(selectedTense)&&<p>— 表示没有该人称、缺损或此处不采用的罕用形式，并非漏写。命令式只有 tu、nous、vous。</p>}{['compound-past','pluperfect','future-perfect','conditional-past','subjunctive-past'].includes(selectedTense)&&<p>括号中的 e/s 由主语决定。avoir 前置直接宾语、代词式动词和动词含义变化时，须再核对配合与助动词。</p>}</div></>:<div className="gl-empty"><p>没有匹配模型</p><button className="gl-secondary" onClick={()=>{setQuery('');setKind('all');}}>重置搜索</button></div>}
 <details className="cg-defective"><summary>缺损、罕用与古旧动词<ChevronDown size={16}/></summary><p>这些词不构造不使用的形式；按具体含义查词典，A1–B1 以识别常见用法为主。</p>{data.defective.map(([id,forms,note])=><div key={id}><strong>{id}</strong><p lang="fr">{forms}</p><small>{note}</small></div>)}</details>
 {!compact&&<p className="gl-source-note">{data.models.length} 个变位模型 · 覆盖 {new Set(data.models.flatMap(m=>m.familyWords)).size} 个同族索引词。{data.scope}<span className="tl-sources">{data.references.map(r=><a key={r.url} href={r.url} target="_blank" rel="noreferrer">{r.label}</a>)}</span></p>}
 </Panel>;
}
export {data as conjugationBank};
