import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {ChevronDown,ArrowRight,PenLine} from 'lucide-react';
import {ChoiceMenu} from '../choice-menu.jsx';
import {ConjugationPanel,conjugationBank,conjugationNames} from './conjugation-ui.jsx';
import {buildTenseLesson,formulas,formulaExamples} from './tense-layout.js';
import {sharedPastReference} from './tense-notes.js';

export function Rich({text}){return String(text).split(/(\*\*.*?\*\*)/g).map((x,i)=>x.startsWith('**')?<strong key={i}>{x.slice(2,-2)}</strong>:<React.Fragment key={i}>{x}</React.Fragment>);}
export function Example({block}){const [open,setOpen]=useState(false);return <div className="tl-example"><button type="button" aria-expanded={open} onClick={()=>setOpen(!open)}><span lang="fr"><Rich text={block.f}/></span>{block.z&&<ChevronDown size={16}/>}</button>{block.z&&<p hidden={!open}>{block.z}</p>}</div>;}
function Formula({topic}){
 const [translated,setTranslated]=useState(false),sample=formulaExamples[topic.id];
 return <div className="tl-formula"><strong>{formulas[topic.id]}</strong>{sample&&<><button className="tl-formula-example" aria-label="展开或收起示例翻译" aria-expanded={translated} onClick={()=>setTranslated(v=>!v)}>{sample.parts.map(([word,label])=><span key={word}><b lang="fr">{word}</b><small>{label}</small></span>)}<ChevronDown size={15}/></button><p hidden={!translated}>{sample.translation}</p></>}</div>;
}

function KnowledgeTable({block,tense}){
 const [selected,setSelected]=useState('0');
 const {headers,rows}=block,persons=headers[0]==='人称',verbRows=headers.slice(1).some(h=>/^je$|^tu$/.test(h));
 const index=Math.min(Number(selected),persons?headers.length-2:rows.length-1);
 if(block.presentation==='notes')return <div className={`tl-note-table${headers.length>3?' tl-note-table-wide':''}`}><table><thead><tr>{headers.map(h=><th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{rows.map((row,i)=><tr key={i}>{row.map((cell,j)=>j===0?<th key={j} scope="row"><Rich text={cell}/></th>:<td key={j} data-label={headers[j]}><Rich text={cell}/></td>)}</tr>)}</tbody></table></div>;
 if(persons||verbRows){
  const options=persons?headers.slice(1).map((h,i)=>({value:String(i),label:h})):rows.map((r,i)=>({value:String(i),label:r[0]}));
  const forms=persons?rows.map(r=>[r[0],r[index+1]]):headers.slice(1).map((h,i)=>[h,rows[index][i+1]]);
  const model=persons?headers[index+1]:null;
  const roots={parler:'parl',finir:'fin',vendre:'vend'};
  let stem=roots[model]||'';
  if(['future','conditional'].includes(tense))stem={parler:'parler',finir:'finir',vendre:'vendr'}[model]||'';
  if(['imperfect','subjunctive'].includes(tense)&&model==='finir')stem='finiss';
  if(!forms.every(([,f])=>f.startsWith(stem)))stem='';
  return <div className="tl-model-table"><ChoiceMenu presentation="dropdown" label="选择变位模型" value={selected} options={options} onChange={setSelected}/>{stem&&<p className="tl-stem-key">词干 <span lang="fr">{stem}</span> + <b>人称词尾</b></p>}<div className="tl-person-table">{forms.map(([person,form])=><div key={person}><span>{person}</span><strong lang="fr">{stem?<>{stem}<b className="tl-ending">{form.slice(stem.length)}</b></>:<Rich text={form}/>}</strong></div>)}</div></div>;
 }
 if(rows.length>12){
  return <div className="tl-reference-table"><ChoiceMenu label="选择查询条目" value={selected} options={rows.map((r,i)=>({value:String(i),label:r[0],description:r[1]}))} onChange={setSelected}/><small>{rows.length} 个条目</small><dl>{headers.slice(1).map((h,i)=><React.Fragment key={h}><dt>{h}</dt><dd><Rich text={rows[index][i+1]}/></dd></React.Fragment>)}</dl></div>;
 }
 return <div className="tl-fact-table">{rows.map((row,i)=><section key={i}><h4><Rich text={row[0]}/></h4><dl>{row.slice(1).map((cell,j)=><React.Fragment key={j}><dt>{headers[j+1]}</dt><dd><Rich text={cell}/></dd></React.Fragment>)}</dl></section>)}</div>;
}
function PastReference(){return <details className="tl-shared-reference"><summary>过去分词与配合<ChevronDown size={16}/></summary><div>{sharedPastReference().map(section=><details key={section.title}><summary>{section.title}<ChevronDown size={14}/></summary><Blocks blocks={section.blocks}/></details>)}</div></details>;}
export function Blocks({blocks,tense}){return blocks.map((b,i)=>b.t==='past-reference'?<PastReference key={i}/>:b.t==='fr'?<Example key={i} block={b}/>:b.t==='table'?<KnowledgeTable key={i} block={b} tense={tense}/>:b.t==='ul'||b.t==='ol'?React.createElement(b.t==='ul'?'ul':'ol',{key:i},b.x.map((x,n)=><li key={n}><Rich text={x}/></li>)):b.t==='note'?<aside className="tl-note" key={i}><strong>{b.title}</strong><p><Rich text={b.x}/></p></aside>:b.t==='h3'||b.t==='h4'||b.t==='part'?<h3 key={i}>{b.x}</h3>:<p key={i}><Rich text={b.x||''}/></p>);}

function loadView(key){try{return JSON.parse(sessionStorage.getItem(key))||{};}catch{return {};}}
export function TenseLesson({topic,practice,questionCount}){
 const tabs=buildTenseLesson(topic,conjugationBank.supplements[topic.id]);
 const storageKey=`franlumi:tense-view:${topic.id}`,saved=useRef(loadView(storageKey));
 const [active,setActive]=useState(()=>tabs.some(t=>t.id===saved.current.active)?saved.current.active:tabs[0].id);
 const [expanded,setExpanded]=useState(saved.current.expanded||{});
 const bar=useRef(),area=useRef(),current=useRef(active),switching=useRef(false),offsets=useRef(saved.current.offsets||{});
 const persist=()=>{try{sessionStorage.setItem(storageKey,JSON.stringify({active:current.current,offsets:offsets.current,expanded}));}catch{}};
 useEffect(()=>{persist();},[expanded]);
 useEffect(()=>{
  const scroll=area.current.closest('.gl-scroll-area');if(!scroll)return;
  const record=()=>{if(switching.current)return;offsets.current[current.current]=scroll.scrollTop;persist();};
  scroll.addEventListener('scroll',record,{passive:true});
  return()=>scroll.removeEventListener('scroll',record);
 },[expanded]);
 useLayoutEffect(()=>{
  const scroll=area.current.closest('.gl-scroll-area');
  if(scroll){switching.current=true;const id=requestAnimationFrame(()=>{scroll.scrollTop=offsets.current[active]??0;switching.current=false;persist();});return()=>cancelAnimationFrame(id);}
 },[active]);
 const select=id=>{
  if(id===active)return;
  const scroll=area.current.closest('.gl-scroll-area');
  if(scroll){offsets.current[active]=scroll.scrollTop;offsets.current[id]??=Math.max(0,bar.current.getBoundingClientRect().top-scroll.getBoundingClientRect().top+scroll.scrollTop);}
  switching.current=true;current.current=id;setActive(id);
 };
 const keyNav=e=>{
  if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
  e.preventDefault();const i=tabs.findIndex(t=>t.id===active);
  const next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
  select(tabs[next].id);bar.current.querySelectorAll('[role=tab]')[next].focus({preventScroll:true});
 };
 const sectionKey=(tab,s)=>`${tab.id}:${s.title}`;
 const isExpanded=(tab,s,i)=>expanded[sectionKey(tab,s)]??s.defaultOpen??(i===0&&!s.advanced);
 const toggleSections=tab=>{
  const all=tab.sections.every((s,i)=>isExpanded(tab,s,i));
  setExpanded(old=>({...old,...Object.fromEntries(tab.sections.map(s=>[sectionKey(tab,s),!all]))}));
 };
 return <div className="tl-lesson" ref={area}>
  <div ref={bar} className="tl-lesson-tabs" role="tablist" aria-label="专题知识栏目" onKeyDown={keyNav}>{tabs.map(t=><button type="button" key={t.id} id={`lesson-tab-${t.id}`} role="tab" tabIndex={active===t.id?0:-1} aria-selected={active===t.id} aria-controls={`lesson-panel-${t.id}`} onClick={()=>select(t.id)}>{t.label}</button>)}</div>
  {tabs.map(tab=><div key={tab.id} role="tabpanel" id={`lesson-panel-${tab.id}`} aria-labelledby={`lesson-tab-${tab.id}`} hidden={active!==tab.id} tabIndex={0} className="tl-lesson-panel">
   {tab.id==='form'&&formulas[topic.id]&&<Formula topic={topic}/>}
   <div className="tl-section-tools"><span>{tab.sections.length} 个知识点</span><button type="button" onClick={()=>toggleSections(tab)}>{tab.sections.every((s,i)=>isExpanded(tab,s,i))?'全部收起':'全部展开'}</button></div>
   {tab.sections.map((s,i)=>{
    const id=sectionKey(tab,s),open=isExpanded(tab,s,i);
    return <details className="tl-reading-section" key={id} open={open} onToggle={e=>{const next=e.currentTarget.open;setExpanded(old=>old[id]===next?old:{...old,[id]:next});}}><summary><span className="tl-section-number">{String(i+1).padStart(2,'0')}</span><span className="tl-section-heading"><strong>{s.title}</strong>{s.hint&&<small>{s.hint}</small>}</span><ChevronDown size={17}/></summary><div><Blocks blocks={s.blocks} tense={topic.id}/></div></details>;
   })}
   {tab.id==='verbs'&&conjugationNames[topic.id]&&<ConjugationPanel tense={topic.id} compact/>}
   {questionCount>0&&<button className="gl-practice-link tl-section-practice" onClick={()=>practice(topic.id)}><PenLine size={18}/><span><strong>练习这个专题</strong><small>{questionCount} 道题</small></span><ArrowRight size={17}/></button>}
   <div className="tl-next-section">{tabs.findIndex(t=>t.id===tab.id)<tabs.length-1&&<button className="gl-secondary" onClick={()=>select(tabs[tabs.findIndex(t=>t.id===tab.id)+1].id)}>继续：{tabs[tabs.findIndex(t=>t.id===tab.id)+1].label}<ArrowRight size={15}/></button>}</div>
  </div>)}
 </div>;
}
