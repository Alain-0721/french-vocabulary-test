import assert from 'node:assert/strict';
import {build} from 'esbuild';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {JSDOM} from 'jsdom';
const dir=await mkdtemp(join(tmpdir(),'edito-test-'));
let passed=0;
function check(name,fn){fn();passed++;console.log('✓ '+name);}
try{
 await build({entryPoints:['src/engine.js'],bundle:true,platform:'node',format:'esm',outfile:join(dir,'engine.mjs'),logLevel:'silent'});
 const {bank,T,D,fresh,currentAttempt,bookAction,makeDaily,restoreBundle,importRecord}=await import(pathToFileURL(join(dir,'engine.mjs')));
 let s=fresh();const first=currentAttempt(s.main),id=first.ids[0];
 check('1110 stable entries and 24 Parts',()=>{assert.equal(bank.length,1110);assert.equal(new Set(bank.map(e=>e.id)).size,1110);assert.equal(s.main.order.length,24);});
 check('Fresh users start U1P1 without mastered Parts',()=>{assert.equal(first.part,'U1P1');assert.equal(s.main.current,0);assert.equal(s.daily,null);});
 check('Hidden words cannot be rated',()=>assert.equal(bookAction(s,first.id,'vote',id,'good'),s));
 s=bookAction(s,first.id,'toggle',id);s=bookAction(s,first.id,'vote',id,'good');
 check('Duplicate votes do not double count',()=>assert.equal(bookAction(s,first.id,'vote',id,'good'),s));
 s=bookAction(s,first.id,'vote',id,'bad');
 check('Changed votes replace cumulative totals',()=>assert.deepEqual(s.main.stats[id],{good:0,bad:1}));
 s=bookAction(s,first.id,'pass',null,'manual');const second=currentAttempt(s.main);
 check('Manual pass creates a separate card preserving the old one',()=>{assert.notEqual(second.id,first.id);assert.equal(second.part,'U1P2');assert.equal(s.main.attempts[0].votes[id],'bad');assert.equal(s.main.attempts[0].passReason,'manual');assert.deepEqual(second.votes,{});});
 check('Every textbook group contains a complete single theme',()=>{for(const g of T.groups(bank,second)){assert.equal(new Set(g.ids.map(id=>bank.find(e=>e.id===id).group)).size,1);assert.equal(g.ids.length,bank.filter(e=>T.key(e)===second.part&&e.group===g.label).length);}});
 let auto=fresh(),a=currentAttempt(auto.main);
 for(const word of a.ids){auto=bookAction(auto,a.id,'toggle',word);auto=bookAction(auto,a.id,'vote',word,'good');}
 auto=bookAction(auto,a.id,'pass',null,'automatic');
 check('100 percent automatically passes with new card',()=>{assert.equal(auto.main.current,1);assert.equal(auto.main.attempts[0].passReason,'automatic');assert.notEqual(currentAttempt(auto.main).id,a.id);});
 auto=bookAction(auto,a.id,'vote',a.ids[0],'bad');
 check('Correcting automatic history restores the earlier main Part',()=>{assert.equal(auto.main.current,0);assert.equal(currentAttempt(auto.main).id,a.id);assert.equal(auto.main.attempts.length,2);assert.ok(restoreBundle(auto));});
 check('Daily requires four passed Parts',()=>assert.ok(makeDaily(fresh()).problem));
 let fixture=fresh();for(let i=0;i<4;i++)fixture=bookAction(fixture,currentAttempt(fixture.main).id,'pass',null,'manual');
 const mainJSON=JSON.stringify(fixture.main);fixture=makeDaily(fixture).state;
 check('Daily samples 5 single-theme groups from mastered Parts',()=>{assert.ok(D.validRound(fixture.daily,bank,D.eligible(fixture.main,bank)));assert.deepEqual(fixture.daily.parts.slice(0,4),['U2P2','U2P2','U2P1','U1P2']);assert.equal(fixture.daily.parts[4],'U1P1');assert.equal(new Set(fixture.daily.ids).size,50);});
 const d=fixture.daily.ids[0];D.toggle(fixture.daily,d);D.vote(fixture.daily,d,'good');fixture.dailyStats=structuredClone(fixture.daily.stats);fixture.dailySerial=fixture.daily.round;
 fixture=makeDaily(fixture).state;
 check('Daily refresh preserves scores without advancing main',()=>{assert.equal(JSON.stringify(fixture.main),mainJSON);assert.equal(fixture.daily.stats[d].good,1);assert.equal(fixture.dailyHistory.length,1);assert.equal(fixture.daily.round,2);});
 fixture=bookAction(fixture,currentAttempt(fixture.main).id,'pass',null,'manual');
 check('Changing main archives obsolete daily sample and preserves totals',()=>{assert.equal(fixture.daily,null);assert.equal(fixture.dailyHistory.length,2);assert.equal(fixture.dailyStats[d].good,1);assert.ok(restoreBundle(fixture));});
 fixture=makeDaily(fixture).state;
 check('Full backup round trips',()=>assert.ok(restoreBundle(JSON.stringify(fixture))));
 check('Plugin main-progress imports without fake secondary progress',()=>{const imported=importRecord(JSON.stringify(fixture.main),fresh());assert.equal(imported.main.current,5);assert.equal(imported.daily,null);assert.deepEqual(imported.dailyStats,{});});
 check('Malformed imports and unknown IDs are rejected',()=>{const invalid=structuredClone(fixture);invalid.main.stats.unknown={good:1,bad:0};assert.equal(restoreBundle(invalid),null);assert.throws(()=>importRecord({mode:'textbook'},fresh()));});
 console.log(`${passed} legacy data migration checks passed.`);
}finally{await rm(dir,{recursive:true,force:true});}
