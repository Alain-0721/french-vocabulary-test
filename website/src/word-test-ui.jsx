import React,{useEffect,useId,useState} from 'react';
import {ArrowRight,Check,RotateCcw} from 'lucide-react';
import {testScore} from './word-test.js';

const sources={study:'课本过关',daily:'每日检测',mistakes:'错题本'};

export function WordTopicSwitch({mode,onChange}){
  return <div className="word-topic-switch" role="group" aria-label="学习内容切换">
    <button type="button" aria-pressed={mode==='translation'} onClick={()=>onChange('translation')}>翻译</button>
    <button type="button" aria-pressed={mode==='test'} onClick={()=>onChange('test')}>题目</button>
  </div>;
}

export function WordTestPanel({request,tests,onStart,onAnswer,onNext}){
  const [kind,setKind]=useState('mixed'),[direction,setDirection]=useState('fr-zh');
  const session=tests?.current;
  const requestIds=new Set(request.ids);
  const matches=!!session&&session.source===request.source&&session.scope===request.scope&&session.questions.length===request.ids.length&&session.questions.every(q=>requestIds.has(q.wordId));
  const [showSession,setShowSession]=useState(matches);
  const titleId=useId();

  useEffect(()=>{setShowSession(matches);},[session?.id,request.source,request.scope,matches]);

  const current=showSession&&matches?session:null;
  const q=current?.questions[current.index];
  const choice=q&&current.answers[q.wordId];
  const score=current&&testScore(current);

  return <section className="wt-dialog wt-inline" aria-labelledby={titleId}>
    <header><div><small>{current?sources[current.source]:sources[request.source]} · {current?.scope||request.scope}</small><h2 id={titleId}>单词检测</h2></div></header>
    {!current?<div className="wt-setup">
      <p>检测当前组的 {request.ids.length} 个词。自动判分，结果单独保存，不覆盖翻词自评。</p>
      <label>题型<select value={kind} onChange={e=>setKind(e.target.value)}><option value="mixed">混合题 · 选择与判断</option><option value="choice">选择题</option><option value="judgement">判断题</option></select></label>
      <label>方向<select value={direction} onChange={e=>setDirection(e.target.value)}><option value="fr-zh">看法语选中文</option><option value="zh-fr">看中文选法语</option></select></label>
      <button className="dp-button primary" onClick={()=>{if(onStart({...request,kind,direction}))setShowSession(true);}}>开始检测<ArrowRight size={16}/></button>
    </div>
    :current.completedAt?<div className="wt-result">
      <span className="wt-result-icon"><Check size={24}/></span>
      <h3>本轮检测已完成</h3>
      <p role="status">{score.total} 题 · <span className="score-good">✔ {score.good}</span> · <span className="score-bad">✘ {score.bad}</span> · 正确率 {Math.round(score.good/score.total*100)}%</p>
      <p>已保存到学习记录的“检测记录”。</p>
      <div className="wt-result-words">{current.questions.map(x=><div key={x.wordId}><span>{x.prompt}<small className="wt-result-answer">{x.answer}</small></span><small className={current.answers[x.wordId]===x.correct?'score-good':'score-bad'}>{current.answers[x.wordId]===x.correct?'✔':'✘'}</small></div>)}</div>
      <div className="wt-result-actions"><button className="dp-button" onClick={()=>setShowSession(false)}><RotateCcw size={15}/>再测一轮</button></div>
    </div>
    :<div className="wt-question">
      <div className="wt-question-meta"><span>{q.type==='choice'?'选择题':'判断题'}</span><span>{current.index+1} / {current.questions.length}</span></div>
      <p className="wt-instruction">{q.type==='choice'?'选择对应释义':'这组词义对应是否正确？'}</p>
      <h3 lang={current.direction==='fr-zh'?'fr':'zh'}>{q.prompt}</h3>
      {q.type==='judgement'&&<p className="wt-pair">{q.pair}</p>}
      <div className="wt-options">{q.options.map((text,i)=><button key={i} disabled={choice!==undefined} className={choice===undefined?'':i===q.correct?'wt-correct':i===choice?'wt-wrong':''} onClick={()=>onAnswer(current.id,i)}><span>{q.type==='choice'?String.fromCharCode(65+i):i===0?'✔':'✘'}</span>{text}</button>)}</div>
      {choice!==undefined&&<div className="wt-feedback" role="status"><span className={choice===q.correct?'score-good':'score-bad'}>{choice===q.correct?'回答正确':'回答错误'}</span><p>正确答案：{q.answer}</p><button className="dp-button primary" onClick={()=>onNext(current.id)}>下一题<ArrowRight size={15}/></button></div>}
      <small className="wt-save-note">已答 {score.done} 题 · 切换到“翻译”不会清空本轮进度</small>
    </div>}
  </section>;
}
