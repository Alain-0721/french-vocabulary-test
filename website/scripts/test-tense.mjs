import test from 'node:test';
import assert from 'node:assert/strict';
import bank from '../src/grammar-preview/tense-bank.json' with {type:'json'};
import {tenseQuestions,isCorrect} from '../src/grammar-preview/tense-exercises.js';
import {freshTense,answerTense,normalizeTense} from '../src/grammar-preview/tense-state.js';
import {freshState} from '../src/grammar-preview/state.js';
import {readGrammarBackup,grammarBackup,restoreGrammarBackup} from '../src/grammar-preview/backup.js';
import {freshMulti,restoreMulti,touchMulti} from '../src/multi-learning.js';

test('all topics have usable content and distinct exercises, conjugation answers include valid agreements',()=>{
 assert.equal(bank.topics.length,22);assert.equal(bank.verbs.length,6);assert.equal(new Set(tenseQuestions.map(q=>q.id)).size,tenseQuestions.length);
 for(const t of bank.topics){assert.ok(t.sections.length);assert.ok(t.sections.every(s=>s.title&&s.blocks.length));assert.ok(tenseQuestions.filter(q=>q.topic===t.id).length>=2);}
 for(const q of tenseQuestions){assert.ok(bank.topics.some(t=>t.id===q.topic));assert.ok(q.zh&&q.explanation);if(q.type==='choice'){assert.equal(new Set(q.options).size,q.options.length);assert.ok(isCorrect(q,q.correct));}else{for(const a of q.expected)assert.ok(isCorrect(q,a));}}
 assert.ok(isCorrect(tenseQuestions.find(q=>q.id==='tense-conjugate-aller-compound-past-4'),'êtes allées'));
 assert.ok(isCorrect(tenseQuestions.find(q=>q.id==='tense-conjugate-venir-compound-past-3'),'sommes venues'));
 assert.equal(isCorrect(tenseQuestions.find(q=>q.topic==='compound-past'&&q.expected?.includes('lavé')),'lave'),false);
});
test('corrections update scores once and malformed scores/answers cannot enter backups',()=>{
 const q=tenseQuestions[0];let s=answerTense(freshTense(),q,1);assert.equal(s.topics[q.topic].bad,1);s=answerTense(s,q,q.correct);assert.equal(s.topics[q.topic].good,1);assert.equal(s.topics[q.topic].bad,0);assert.equal(answerTense(s,q,q.correct),s);assert.deepEqual(normalizeTense(s),s);
 for(const change of [s=>s.answers.unknown=0,s=>s.topics.present.good=99,s=>s.current='bad',s=>s.answers[q.id]=9]){const bad=structuredClone(s);change(bad);assert.throws(()=>normalizeTense(bad));}
});
test('legacy and full backups preserve separate textbook, tense, and word records',()=>{
 const old=freshState();delete old.tense;assert.deepEqual(readGrammarBackup(old).state.tense,freshTense());
 const source=freshState(),q=tenseQuestions[0];source.tense=answerTense(source.tense,q,q.correct);source.tense.topics.present.read=true;source.practiceMode='tense';
 const parsed=readGrammarBackup(grammarBackup(source));assert.deepEqual(parsed.state.tense,source.tense);assert.equal(parsed.state.practiceMode,'tense');
 const full=touchMulti({...freshMulti(),grammar:source});assert.deepEqual(restoreMulti(JSON.stringify(full)).grammar.tense,source.tense);
 const target={...freshState(),tense:source.tense};const book=readGrammarBackup(grammarBackup(freshState(),'book'));assert.deepEqual(restoreGrammarBackup(target,book).tense,source.tense);
 const corrupted=structuredClone(full);corrupted.grammar.tense.topics.present.good=20;assert.equal(restoreMulti(corrupted),null);
});
