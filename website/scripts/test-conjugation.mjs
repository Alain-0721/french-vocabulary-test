import test from 'node:test';
import assert from 'node:assert/strict';
import data from '../src/grammar-preview/conjugation-bank.json' with {type:'json'};
const m=id=>data.models.find(v=>v.id===id),f=(id,tense)=>m(id).forms[tense];
test('specific irregular forms and orthographic exceptions retain independently checked spellings',()=>{
 assert.deepEqual(f('être','subjunctive'),['sois','sois','soit','soyons','soyez','soient']);
 assert.deepEqual(f('avoir','subjunctive'),['aie','aies','ait','ayons','ayez','aient']);
 assert.equal(f('venir','simple-past')[3],'vînmes');assert.equal(f('tenir','simple-past')[4],'tîntes');
 assert.equal(f('acquérir','future')[0],'acquerrai');assert.equal(f('acquérir','subjunctive')[3],'acquérions');
 assert.equal(f('voir','future')[0],'verrai');assert.equal(f('prévoir','future')[0],'prévoirai');assert.equal(f('pourvoir','future')[0],'pourvoirai');
 assert.equal(f('dire','present')[4],'dites');assert.equal(f('redire','present')[4],'redites');assert.equal(f('interdire','present')[4],'interdisez');
 assert.equal(f('cueillir','imperative')[1],'cueille');assert.equal(f('cueillir','future')[0],'cueillerai');
 assert.equal(f('manger','imperfect')[3],'mangions');assert.equal(f('manger','simple-past')[3],'mangeâmes');
 assert.equal(f('commencer','imperfect')[0],'commençais');assert.equal(f('commencer','subjunctive')[3],'commencions');
 assert.equal(f('haïr','simple-past')[3],'haïmes');assert.equal(f('croître','simple-past')[0],'crûs');
 assert.equal(f('aller','subjunctive-past')[3],'soyons allé(e)s');assert.equal(f('faire','pluperfect')[4],'aviez fait');
 assert.equal(f('avoir','recent-past')[0],'viens d’avoir');assert.equal(f('ouvrir','ongoing')[0],'suis en train d’ouvrir');
 assert.equal(f('pouvoir','imperative').filter(Boolean).length,0);assert.equal(f('falloir','present').filter(Boolean).length,1);
 assert.equal(f('comprendre','present')[5],'comprennent');assert.equal(f('prévenir','compound-past')[0],'ai prévenu');
 assert.equal(m('confire').participle,'confit');assert.equal(f('confire','compound-past')[0],'ai confit');
 assert.equal(f('prévaloir','subjunctive')[0],'prévale');assert.equal(f('apparaître','compound-past')[0],'suis apparu(e)');
 assert.equal(f('accroître','simple-past')[0],'accrus');assert.equal(f('accroître','simple-past')[3],'accrûmes');
 assert.equal(f('traduire','present')[3],'traduisons');assert.equal(f('s’asseoir','present')[0],'m’assieds');
 assert.equal(f('se souvenir','compound-past')[3],'nous sommes souvenu(e)s');assert.equal(f('s’enfuir','present')[0],'m’enfuis');
 assert.equal(f('absoudre','simple-past').filter(Boolean).length,0);assert.equal(m('inclure').participle,'inclus');assert.equal(m('exclure').participle,'exclu');
});
test('all model tables have six slots and every tense has construction, regular and exception coverage',()=>{
 assert.equal(new Set(data.models.map(m=>m.id)).size,data.models.length);
 for(const model of data.models)for(const [tense,rows] of Object.entries(model.forms)){assert.equal(rows.length,6,model.id+':'+tense);for(const value of rows)assert.ok(value===null||typeof value==='string'&&value.length>0);}
 for(const id of ['present','near-future','recent-past','ongoing','imperative','compound-past','imperfect','pluperfect','simple-past','future','future-perfect','conditional','conditional-past','subjunctive','subjunctive-past']){
  assert.ok(data.supplements[id]?.[0].blocks.some(b=>b.t==='table'));
  for(const verb of ['parler','finir','vendre'])assert.ok(f(verb,id).some(Boolean));
 }
 assert.ok(data.defective.some(x=>x[0]==='frire'));
});
