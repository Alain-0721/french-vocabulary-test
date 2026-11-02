import React,{useEffect,useId,useRef,useState} from 'react';
import {Info,CheckCircle2,ChevronLeft,ChevronRight,ArrowRight} from 'lucide-react';
import {growthDay,growthSeries,firstAchievements,growthComparison,growthPeriodStart,shiftGrowthPeriod,loadGrowthView,saveGrowthView,growthReviewEvents} from './learning-growth.js';
import {testScore} from './word-test.js';

function GrowthChart({points,selected,onSelect,mode}){
 const host=useRef(null),[width,setWidth]=useState(600),headingId=useId(),fillId=useId().replaceAll(':','');
 useEffect(()=>{
  const resize=()=>setWidth(Math.max(230,Math.round(host.current?.clientWidth||600)));
  resize();
  if(typeof ResizeObserver==='undefined'){window.addEventListener('resize',resize);return()=>window.removeEventListener('resize',resize);}
  const observer=new ResizeObserver(resize);observer.observe(host.current);return()=>observer.disconnect();
 },[]);
 const height=236,left=34,right=16,top=20,bottom=34,plotWidth=width-left-right,plotHeight=height-top-bottom;
 const value=p=>mode==='cumulative'?p.cumulative:p.count;
 const peak=Math.max(0,...points.map(p=>value(p)||0)),step=Math.max(1,Math.ceil(peak/4)),ceiling=step*4;
 const x=i=>left+i/(points.length-1)*plotWidth,y=n=>top+plotHeight-n/ceiling*plotHeight;
 const known=points.map((p,i)=>({p,i})).filter(({p})=>value(p)!==null);
 const path=known.map(({p,i},n)=>`${n?'L':'M'}${x(i)},${y(value(p))}`).join(' ');
 const tickCount=width<300?3:width<400?4:6;
 const ticks=[...new Set(Array.from({length:tickCount},(_,i)=>Math.round(i*(points.length-1)/(tickCount-1))))];
 const pick=e=>{const r=e.currentTarget.getBoundingClientRect(),local=(e.clientX-r.left)/r.width*width;onSelect(Math.max(0,Math.min(points.length-1,Math.round((local-left)/plotWidth*(points.length-1)))));};
 const move=e=>{if(e.pointerType==='mouse'||e.buttons)pick(e);};
 const name=mode==='cumulative'?'累计掌握':mode==='weekly'?'本周新增过关':mode==='monthly'?'本月新增过关':'当日新增过关';
 return <div className="growth-chart" ref={host}><svg viewBox={`0 0 ${width} ${height}`} role="group" aria-labelledby={headingId} onPointerMove={move} onPointerDown={pick}>
  <title id={headingId}>{name}曲线图，横轴为日期，纵轴为词数。点击或拖动查看日期，方向键切换；统计开始前留空。</title>
  <defs><linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".1"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
  <text className="growth-axis-label" x={left} y="11">词数</text>
  {Array.from({length:5},(_,i)=>{const count=i*step;return <g key={i}><line className="growth-grid-line" x1={left} x2={width-right} y1={y(count)} y2={y(count)}/><text className="growth-axis-label" x={left-9} y={y(count)+4} textAnchor="end">{count}</text></g>;})}
  {ticks.map(i=><text className="growth-axis-label" key={i} x={x(i)} y={height-9} textAnchor={i===0?'start':i===points.length-1?'end':'middle'}>{points[i].axisLabel}</text>)}
  {known.length>0&&<><path d={`${path} L${x(known.at(-1).i)},${y(0)} L${x(known[0].i)},${y(0)} Z`} fill={`url(#${fillId})`}/><path className="growth-curve" d={path}/></>}
  <line className="growth-selected-line" x1={x(selected)} x2={x(selected)} y1={top} y2={y(0)}/>
  {points.map((p,i)=><g key={p.date}><rect className="growth-hit" x={i===0?0:(x(i-1)+x(i))/2} y={top-8} width={i===0?(x(0)+x(1))/2:i===points.length-1?width-(x(i-1)+x(i))/2:plotWidth/(points.length-1)} height={plotHeight+16} role="button" tabIndex={i===selected?0:-1} aria-label={`${p.label}，${value(p)===null?'无历史记录':name+' '+value(p)+' 词'}`} aria-pressed={i===selected} onFocus={()=>onSelect(i)} onClick={()=>onSelect(i)} onKeyDown={e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?points.length-1:Math.max(0,Math.min(points.length-1,i+(e.key==='ArrowRight'?1:-1)));onSelect(next);e.currentTarget.ownerSVGElement.querySelectorAll('[role=button]')[next]?.focus({preventScroll:true});}if(['Enter',' '].includes(e.key)){e.preventDefault();onSelect(i);}}}/>{value(p)!==null&&(points.length<=7||i===selected)&&<circle className={`growth-point${i===selected?' selected':''}`} cx={x(i)} cy={y(value(p))} r={i===selected?4.5:2.5}/>}</g>)}
 </svg></div>;
}
export function GrowthJourney({book,secondary,main,go}){
 const [view,setView]=useState(()=>loadGrowthView(globalThis.localStorage,book.id));
 const {source,ranges,mode}=view;
 const [date,setDate]=useState(null),[anchor,setAnchor]=useState(null),[rules,setRules]=useState(false),[detailOpen,setDetailOpen]=useState(false),[limit,setLimit]=useState(40);
 const modes=[['daily','每日'],['weekly','每周'],['monthly','每月'],['cumulative','累计']];
 const period=mode==='weekly'?'week':mode==='monthly'?'month':'day',range=ranges[mode],rangeUnit=period==='week'?'周':period==='month'?'个月':'天';
 const rangeOptions=period==='week'?[8,12,26]:period==='month'?[6,12,24]:[7,30,90];
 const changeView=patch=>{setView(old=>({...old,...patch}));setDate(null);setAnchor(null);};
 const [todayDate,setTodayDate]=useState(()=>growthDay(new Date().toISOString())),rulesId=useId(),detailsId=useId();
 useEffect(()=>{const timer=setInterval(()=>setTodayDate(growthDay(new Date().toISOString())),60000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{saveGrowthView(globalThis.localStorage,book.id,view);},[book.id,view]);
  const growth=secondary?.growth,events=growth?.events||[],dictionary=new Map(book.bank.map(e=>[e.id,e])),reviews=growthReviewEvents(main,secondary);
  const {points,legacyCount,totalCount,startedDay,todayCount,todayReviewCount}=growthSeries(events,{period,periods:range,source,today:todayDate,startedAt:growth?.startedAt,anchor:anchor||todayDate,reviews});
 const found=points.findIndex(p=>p.date===date),selected=found<0?points.length-1:found,current=points[selected];
 const periodTotal=points.reduce((sum,p)=>sum+(p.count||0),0),selectedCount=mode==='cumulative'?current.cumulative:current.count;
 const comparison=growthComparison(events,{date:current.date,period,source,today:todayDate,startedAt:growth?.startedAt});
 const first=firstAchievements(events),detailIds=mode==='cumulative'?current.cumulativeIds:current.ids,sourceCounts=mode==='cumulative'?current.cumulativeSourceCounts:current.sourceCounts;
 const currentStart=growthPeriodStart(todayDate,period),earliest=growthPeriodStart(startedDay,period),isCurrent=current.date===currentStart;
 const periodName=period==='week'?'周':period==='month'?'月':'日';
 const selectPrevious=delta=>{
  const target=shiftGrowthPeriod(current.date,delta,period);
  if(target<earliest||target>currentStart)return;
  setDate(target);
  if(target<points[0].date||target>points.at(-1).date)setAnchor(target);
 };
 const returnCurrent=()=>{setAnchor(null);setDate(null);};
 useEffect(()=>{setDetailOpen(false);setLimit(40);},[mode,current.date,source]);
 const dateLabel=mode==='monthly'?current.label.replace('-',' 年 ')+' 月':mode==='weekly'?current.label.replaceAll('-','/'):current.date.replaceAll('-',' / ');
 return <section className="growth-journey">
  <div className="growth-chart-toolbar"><label className="growth-source"><span className="growth-sr-only">筛选成长来源</span><select aria-label="筛选成长来源" value={source} onChange={e=>changeView({source:e.target.value})}><option value="all">全部来源</option><option value="study">课本达标</option><option value="mistakes">错题本</option></select></label><div className="growth-range" role="group" aria-label="选择曲线日期范围">{rangeOptions.map(n=><button key={n} aria-pressed={range===n} onClick={()=>changeView({ranges:{...ranges,[mode]:n}})}>近 {n} {rangeUnit}</button>)}</div></div>
   <div className="growth-chart-panel"><div className="growth-chart-metrics"><div><span>今日新增</span><strong>{todayCount}<small>词</small></strong></div><div><span>今日复习</span><strong>{todayReviewCount}<small>词</small></strong></div><div><span>{anchor?'所选新增':'范围新增'}</span><strong>{periodTotal}<small>词</small></strong></div><div><span>累计掌握</span><strong>{totalCount}<small>词</small></strong></div></div>
   <div className="growth-view-toolbar"><div className="growth-view" role="group" aria-label="切换成长曲线">{modes.map(([id,label])=><button key={id} aria-pressed={mode===id} onClick={()=>changeView({mode:id})}>{label}</button>)}</div><button className="growth-rules-toggle" aria-label="查看成长统计规则" aria-expanded={rules} aria-controls={rulesId} onClick={()=>setRules(!rules)}><Info size={16}/><span>统计规则</span></button></div>
    {rules&&<div className="growth-rules" id={rulesId}><p>每个词至少完成 3 个不同轮次的有效判定，且最近 5 次判定错误率严格低于 30%（不足 5 次按已有次数），最近一次判定必须正确。课本自测与“题目”检测都计入。错题本中的词由你手动取消错题标记后也可达标。</p><p>同一个词只在首次达标时计入一次，按首次来源筛选。达标后在课本自测或题目中再次答对，只记“有效复习”，按词去重，不重复增加新增词数；再次巩固单独提示。</p><p>按北京时间统计；开始记录前留空，开始后没有新增过关的日期记为 0。无日期的此前积累只计入累计掌握。旧自测判定没有时间，不补造日期；已有时间的题目检测按原完成时间计入。每周按周一至周日、每月按自然月汇总；本周、本月截至今天。</p><p>本周与上周相同星期范围比较，本月与上月相同日期范围比较；上月天数不足时取月末。记录不完整时不作比较。查看偏好仅保存到本设备，各课本分别记忆。</p></div>}
   <div className="growth-period-nav" aria-label="切换历史周期"><button aria-label={'上一'+periodName} disabled={current.date<=earliest} onClick={()=>selectPrevious(-1)}><ChevronLeft size={17}/></button><span>{dateLabel}</span><button aria-label={'下一'+periodName} disabled={isCurrent} onClick={()=>selectPrevious(1)}><ChevronRight size={17}/></button></div>
   <div className="growth-chart-selection" aria-live="polite"><button className="growth-return" disabled={isCurrent} onClick={returnCurrent}>回到{period==='week'?'本周':period==='month'?'本月':'今天'}</button><button className="growth-selected-value" disabled={selectedCount===null} aria-label="查看所选数据的来源明细" aria-expanded={detailOpen} aria-controls={detailsId} onClick={()=>setDetailOpen(!detailOpen)}>{selectedCount===null?'无历史记录':(mode==='cumulative'?'累计掌握 ':'新增过关 ')+selectedCount+' 词'}{selectedCount!==null&&<ChevronRight size={12}/>}</button></div>
   <p className="growth-comparison" aria-live="polite">{comparison.available?<><span>{comparison.label}</span><b className={comparison.delta>0?'increased':comparison.delta<0?'decreased':''}>{comparison.delta===0?'持平':(comparison.delta>0?'+':'')+comparison.delta+' 词'}</b><small>{comparison.previousStart.slice(5).replace('-','/')}–{comparison.previousEnd.slice(5).replace('-','/')} · {comparison.previous} 词{mode==='cumulative'?'（对比新增词数）':''}</small></>:<span>历史记录不足，暂无同期对比</span>}</p>
   <GrowthChart points={points} selected={selected} mode={mode} onSelect={index=>setDate(points[index].date)}/>
   <p className="growth-chart-hint">{mode==='weekly'?'周一至周日汇总':mode==='monthly'?'按自然月汇总':'点选或拖动查看'} · {startedDay.replaceAll('-','/')} 起记录</p>
  </div>
  {selectedCount!==null&&<details className="growth-day growth-source-details" id={detailsId} key={mode+current.date+source} open={detailOpen} onToggle={e=>{if(e.currentTarget.open!==detailOpen)setDetailOpen(e.currentTarget.open);}}><summary><span>{mode==='cumulative'?'累计掌握':'本'+periodName+'过关'}来源与词单</span><small>{selectedCount} 词</small></summary><div className="growth-source-counts"><span>课本达标 <b>{sourceCounts.study}</b></span><span>错题本 <b>{sourceCounts.mistakes}</b></span></div><div>{detailIds.slice(0,limit).map(id=>{const word=dictionary.get(id);return word&&<div className="growth-word" key={id}><CheckCircle2 size={15}/><span><strong lang="fr">{word.fr}</strong><small>{word.zh}</small></span><small>{first.get(id)?.source==='study'?'课本达标':'错题本'}</small></div>;})}</div>{detailIds.length>limit&&<button className="growth-more" onClick={()=>setLimit(n=>n+40)}>加载更多（{limit} / {detailIds.length}）</button>}</details>}
   {current.count===0&&<div className="growth-empty-action"><p>{isCurrent?(period==='day'?'今天':'本'+periodName):'所选'+periodName}{source==='all'?'还没有新增达标词':'在当前来源中没有新增达标词'}。</p>{go&&<button onClick={()=>go('study')}>继续检测<ArrowRight size={14}/></button>}</div>}
   {current.reviewCount>0&&<p className="growth-review">{mode==='daily'?'今天':mode==='weekly'?'本周':'本月'}有效复习 <b>{current.reviewCount}</b> 词，不重复计入新增过关。</p>}
  {current.consolidatedIds.length>0&&<p className="growth-consolidation">{mode==='weekly'?'这一周':mode==='monthly'?'这个月':'这一天'}另有 {current.consolidatedIds.length} 个已掌握词再次巩固，不重复计入过关词数。</p>}
  {legacyCount>0&&<p className="growth-legacy">此前积累 <b>{legacyCount}</b> 词，已计入累计掌握；达标日期未知。</p>}
 </section>;
}
export function WordTestRecords({secondary}){
 const history=secondary?.wordTests?.history||[],sources={study:'课本过关',daily:'每日检测',mistakes:'错题本'};
 return <section className="wt-records"><h2>单词检测记录</h2>{history.length?history.map(q=>{const s=testScore(q);return <details key={q.id} className="np-round-details"><summary><span className="np-round-tag">{sources[q.source]}</span><span className="np-round-title">{q.scope}<small>{new Date(q.completedAt).toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'})}</small></span><span className="np-round-brief">✔ {s.good} · ✘ {s.bad} · {Math.round(s.good/s.total*100)}%</span></summary><div className="wt-history-words">{q.questions.map(x=><div key={x.wordId}><span>{x.prompt}</span><small className={q.answers[x.wordId]===x.correct?'score-good':'score-bad'}>{q.answers[x.wordId]===x.correct?'✔':'✘'} · {x.answer}</small></div>)}</div></details>;}):<p className="growth-note">完成一轮单词检测后，在这里查看逐题结果。</p>}</section>;
}
