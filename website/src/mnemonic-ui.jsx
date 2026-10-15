import React from 'react';
import {Lightbulb} from 'lucide-react';
import './mnemonics.css';

export function Mnemonic({text,id}){
  const parts=text.split(/([\p{Script=Latin}\p{M}]+(?:[’' -][\p{Script=Latin}\p{M}]+)*)/u);
  return <section className="word-mnemonic" id={id} aria-label="助记"><p>{parts.map((part,i)=>i%2?<span className="mnemonic-french" lang="fr" key={i}>{part}</span>:part)}</p></section>;
}
export function MnemonicButton({word,open,id,onToggle}){
  return <button type="button" className="study-mnemonic-toggle" title="助记" aria-label={`${word} 助记`} aria-expanded={open} aria-controls={id} onClick={e=>{e.stopPropagation();onToggle();}}><Lightbulb size={13} aria-hidden="true"/></button>;
}
