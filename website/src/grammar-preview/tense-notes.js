import data from './conjugation-bank.json' with {type:'json'};
import {etreVerbs,avoirParticiples} from './compound-past-notes.js';

export const notebookReferences=[
 {label:'UT Austin 将来时',url:'https://www.laits.utexas.edu/tex/gr/taf2.html'},
 {label:'UT Austin 条件式',url:'https://www.laits.utexas.edu/tex/gr/tac1.html'},
 {label:'UT Austin 虚拟式',url:'https://www.laits.utexas.edu/tex/gr/tas2.html'},
];

const p=x=>({t:'p',x});
const h=x=>({t:'h3',x});
const ex=(f,z)=>({t:'fr',f,z});
const s=(title,blocks,extra={})=>({title,blocks,...extra});
const t=(headers,rows)=>({t:'table',presentation:'notes',headers,rows});
const person=['je','tu','il / elle / on','nous','vous','ils / elles'];
const model=id=>data.models.find(m=>m.id===id);
const forms=(id,tense)=>model(id).forms[tense];
const endings=(tails,examples)=>t(['人称','词尾','例词'],person.map((n,i)=>[n,tails[i],examples[i]]));
const paradigm=(id,tense,label='形式')=>t(['人称',label],person.map((n,i)=>[n,forms(id,tense)[i]||'—']));
const futureIds=['être','avoir','aller','faire','venir','tenir','pouvoir','vouloir','devoir','savoir','voir','recevoir','envoyer','courir','mourir','cueillir','acquérir','valoir','asseoir','falloir','pleuvoir'];
const futureStems=()=>t(['动词原形','词干','中文'],futureIds.map(id=>[id,model(id).futureStem+'-',model(id).zh]));
const regularForms=supplements=>s('规则模型完整人称',supplements[0].blocks.filter(b=>b.t==='table'&&b.headers[0]==='人称'),{advanced:true});
const exhaustive=supplements=>supplements.slice(1).map(a=>({...a,advanced:true}));
const copyNotes=sections=>sections.map(a=>({...a,blocks:a.blocks.filter(b=>b.t!=='part').map(b=>b.t==='table'?{...b,presentation:'notes'}:b)}));
const uses={
 present:[
  ['此刻发生','Je travaille à la maison.','我现在在家工作。'],
  ['日常习惯','Je prends le métro chaque matin.','我每天早上乘地铁。'],
  ['普遍事实','La Terre tourne autour du Soleil.','地球围绕太阳运转。'],
  ['确定的安排','Demain, je pars à Lyon.','明天我去里昂。'],
  ['持续到现在','J’apprends le français depuis deux ans.','我学法语已经两年了，现在仍在学。'],
 ],
 imperfect:[
  ['过去的背景或状态','Il faisait beau.','当时天气很好。'],
  ['过去的习惯','Enfant, je jouais souvent au foot.','小时候，我经常踢足球。'],
  ['当时正在进行','Je dormais quand le téléphone a sonné.','电话响时，我正在睡觉。'],
  ['同时发生','Elle lisait pendant que je cuisinais.','我做饭时，她在看书。'],
 ],
 future:[
  ['将来的事或预测','Nous partirons demain.','我们明天出发。'],
  ['承诺','Je t’aiderai.','我会帮你。'],
  ['将来的时间从句','Quand tu arriveras, appelle-moi.','你到的时候给我打电话。'],
 ],
 conditional:[
  ['礼貌请求','Pourriez-vous m’aider ?','您能帮我一下吗？'],
  ['愿望与建议','J’aimerais voyager. / Tu devrais te reposer.','我想旅行。/ 你应该休息。'],
  ['假设的结果','Si j’avais le temps, je viendrais.','如果我有时间，我就会来。'],
  ['过去视角中的将来','Il a dit qu’il viendrait.','他说他会来。'],
  ['未经确认的信息','Le ministre serait en voyage.','据说部长正在出差。'],
 ],
 'near-future':[
  ['计划或即将发生','Nous allons visiter le musée demain.','我们明天打算参观博物馆。'],
  ['根据当前迹象判断','Regarde les nuages ! Il va pleuvoir.','看这些云！要下雨了。'],
 ],
 'recent-past':[
  ['刚刚做完','Je viens d’arriver.','我刚到。'],
  ['动作紧接当前参照点','Nous venons de finir le travail.','我们刚做完工作。'],
 ],
 ongoing:[
  ['强调正在进行的过程','Je suis en train de préparer le dîner.','我正在准备晚饭。'],
 ],
 imperative:[
  ['指示或命令','Fermez la porte !','把门关上！'],
  ['建议','Prends le temps de réfléchir.','花点时间想想。'],
  ['禁止','Ne fumez pas ici.','请勿在此吸烟。'],
 ],
 pluperfect:[
  ['先于另一个过去动作','Quand je suis arrivé, le train était déjà parti.','我到的时候，火车已经开走了。'],
  ['更早的原因','Il était fatigué parce qu’il avait mal dormi.','他很累，因为之前没睡好。'],
  ['转述已经完成的事','Il a dit qu’il avait fini.','他说他已经做完了。'],
 ],
 'future-perfect':[
  ['将来某时之前已完成','Quand tu auras fini, tu pourras sortir.','你做完后就可以出去。'],
  ['从将来回望','Dans deux ans, j’aurai terminé mes études.','两年后，我就完成学业了。'],
  ['对过去的推测','Il n’est pas là ? Il aura oublié.','他不在？他大概是忘了。'],
 ],
 'conditional-past':[
  ['过去的遗憾或愿望','J’aurais voulu te voir.','我本想见你一面。'],
  ['责备或反省','Tu aurais pu me prévenir !','你本可以提前告诉我！'],
  ['过去未实现的假设','Si j’avais su, je serais venu.','如果我当时知道，我就会来了。'],
  ['未经确认的过去信息','Il aurait eu un accident.','据说他出了事故。'],
 ],
 subjunctive:[
  ['必要或愿望','Il faut que tu partes.','你必须离开。'],
  ['情感','Je suis heureux que tu sois là.','你在这里，我很高兴。'],
  ['怀疑','Je doute qu’il vienne.','我怀疑他会来。'],
 ],
 'subjunctive-past':[
  ['虚拟式中表示已经完成','Je suis content que tu sois venu.','我很高兴你已经来了。'],
  ['某个期限前完成','Il faut que vous ayez fini avant midi.','你们必须在中午前完成。'],
  ['过去的让步','Bien qu’il ait plu, nous sommes sortis.','尽管下了雨，我们还是出门了。'],
 ],
 'simple-past':[
  ['书面叙事中推进事件','Il entra, regarda autour de lui et sourit.','他走进来，环顾四周，微笑了。'],
 ],
};
const usage=id=>s('核心用途',uses[id].flatMap(([title,f,z])=>[h(title),ex(f,z)]),{defaultOpen:true});
const tails={
 imperfect:['-ais','-ais','-ait','-ions','-iez','-aient'],
 future:['-ai','-as','-a','-ons','-ez','-ont'],
 conditional:['-ais','-ais','-ait','-ions','-iez','-aient'],
 subjunctive:['-e','-es','-e','-ions','-iez','-ent'],
};
const tenseLabels={imperfect:'未完成过去时',future:'简单将来时',conditional:'条件式现在时',subjunctive:'虚拟式现在时'};
const compoundAux={pluperfect:'imperfect','future-perfect':'future','conditional-past':'conditional','subjunctive-past':'subjunctive'};

export function sharedPastReference(){return [
 s('être 常用动词',[
  t(['动词原形','过去分词','中文'],etreVerbs),
  p('代词式动词也用 être。sortir、monter、descendre、rentrer、retourner、passer 等带直接宾语时改用 avoir；派生词按具体用法判断。'),
 ],{advanced:true}),
 s('过去分词',[
  t(['类型','变化','例词'],[['第一组 -er','-er → -é','parler → parlé'],['第二组 -ir','-ir → -i','finir → fini'],['部分 -re','-re → -u','vendre → vendu']]),
  t(['动词原形','过去分词','中文'],avoirParticiples),
 ],{advanced:true}),
 s('性数配合',[
  p('**普通 être：**与主语一致，阴性加 -e，复数加 -s。'),
  p('**avoir：**通常不配合；直接宾语（COD）在前时，与它配合。'),
  p('**代词式动词：**本质代词式通常与主语配合；可作普通动词使用的代词式结构，需判断直接宾语。'),
  ex('Elle s’est lavée. / Elle s’est lavé les mains.','她洗了澡。/ 她洗了手。'),
  ex('Elles se sont parlé.','她们互相说了话；se 是间接宾语，不配合。'),
 ],{advanced:true}),
 ];}

export function notebookLesson(topic,supplements,existing){
 const id=topic.id,o=topic.sections;
 let g=Object.fromEntries(existing.map(tab=>[tab.id,tab.sections]));
 if(uses[id])g.use=[usage(id),...copyNotes(o.filter(a=>a.title==='时间标志词'))];
 const full=supplements.length?[regularForms(supplements),...exhaustive(supplements)]:[];
 if(id==='present'){
  const regular=[['第一组 -er','parler',['-e','-es','-e','-ons','-ez','-ent']],['第二组 -ir','finir',['-is','-is','-it','-issons','-issez','-issent']],['第三组 vendre 模型','vendre',['-s','-s','无','-ons','-ez','-ent']]];
  g.form=regular.map(([name,verb,end])=>s(name,[p(`去掉 ${verb==='parler'?'-er':verb==='finir'?'-ir':'-re'}，加对应人称词尾。`),endings(end,forms(verb,id))],{defaultOpen:true}));
  g.form.push(s('第三组的其他模型',[p('第三组没有统一词尾。partir、prendre、ouvrir 等分别按变位家族记；aller 属于第三组。')],{advanced:true}));
  const families=[
   ['基础动词',['être','avoir','aller','faire','dire']],
   ['多词干家族',['prendre','venir','boire','recevoir','voir','pouvoir','vouloir','devoir']],
   ['其他常用模型',['savoir','mettre','partir','sortir','dormir','écrire','lire','connaître','ouvrir']],
  ];
  g.verbs=[...families.map(([title,ids])=>s(title,[t(['动词原形','je / nous / ils','中文'],ids.map(verb=>[verb,[0,3,5].map(i=>forms(verb,id)[i]).join(' / '),model(verb).zh]))],{defaultOpen:true})),
   s('拼写变化',[
    t(['类型','单数例子','nous 形式'],[['-ger','je mange','mangeons'],['-cer','je commence','commençons'],['-yer','je nettoie','nettoyons'],['-ayer','je paie / paye','payons'],['appeler / jeter','j’appelle / je jette','appelons / jetons'],['e → è','j’achète / je lève','achetons / levons'],['é → è','je préfère','préférons'],['haïr','je hais / il hait','haïssons']]),
    p('geler → je gèle；多数 -eler / -eter 动词的传统拼写与改革拼写有差异，完整词形按动词查询。'),
   ]),regularForms(supplements)];
 }
 if(id==='imperfect'){
  g.form=[s('取词干，再加词尾',[
   t(['原形','nous 现在时','词干'],[['parler','parlons','parl-'],['finir','finissons','finiss-'],['faire','faisons','fais-'],['prendre','prenons','pren-']]),
   endings(tails[id],forms('parler',id)),
  ],{defaultOpen:true})];
  g.verbs=[s('特殊词干与无人称形式',[
   t(['动词原形','形式','中文'],[['être','ét- → j’étais','是'],['falloir','il fallait','需要'],['pleuvoir','il pleuvait','下雨']]),
   p('多数现在时不规则动词，在这里仍按 nous 词干规则变化。'),
  ],{defaultOpen:true}),s('拼写变化',[
   t(['动词原形','je 形式','nous / vous 形式'],[['manger','mangeais','mangions / mangiez'],['commencer','commençais','commencions / commenciez'],['étudier','étudiais','étudiions / étudiiez'],['crier','criais','criions / criiez'],['voir','voyais','voyions / voyiez']]),
  ],{defaultOpen:true}),...full];
  g.compare=[s('事件还是背景',[
   t(['视角','时态','例句'],[['当时的状态或过程','未完成过去时','Il pleuvait.'],['完整事件','复合过去时','Il a plu hier.']]),
   p('下雨并不固定对应某一个时态；先判断叙述视角。'),
   ex('Si on partait demain ?','要不我们明天出发？'),
   ex('Je voulais vous demander un service.','我想请您帮个忙。'),
  ])];
 }
 if(id==='future'||id==='conditional'){
  g.form=[s('词干与词尾',[
   t(['动词类型','词干','例词'],[['-er','保留不定式','parler-'],['-ir','保留不定式','finir-'],['-re','去掉末尾 e','vendre → vendr-']]),
   endings(tails[id],forms('parler',id)),
  ],{defaultOpen:true})];
  g.verbs=[s('常用不规则词干',[futureStems()],{defaultOpen:true}),s('拼写与变体',[
   t(['原形','词干','提醒'],[['acheter / appeler / jeter','achèter- / appeller- / jetter-','按对应模型记'],['payer','paier- / payer-','两种均可'],['préférer','préférer- / préfèrer-','传统 / 改革拼写'],['asseoir','assiér- / assoir-','两套常用形式'],['envoyer / renvoyer','enverr- / renverr-','不能直接保留不定式']]),
   p('派生词不总与原动词完全一致，如 voir → verr-，但 prévoir → prévoir-。'),
  ]),...full];
  g.compare=[s('将来时与条件式',[
   t(['人称','简单将来时','条件式现在时'],person.map((n,i)=>[n,forms('être','future')[i],forms('être','conditional')[i]])),
   p('两者词干相同，区别在词尾。'),
   ex('Si j’ai le temps, je viendrai.','如果有时间，我会来：可能实现。'),
   ex('Si j’avais le temps, je viendrais.','如果我有时间，我就会来：假设。'),
   p('表示条件的 si 从句不用将来时或条件式。'),
  ]),...copyNotes(o.filter(a=>a.title==='易错点')).map(a=>({...a,advanced:true}))];
 }
 if(['near-future','recent-past','ongoing'].includes(id)){
  const verb=id==='near-future'?'aller':id==='recent-past'?'venir':'être';
  const suffix=id==='near-future'?' + 不定式':id==='recent-past'?' + de / d’ + 不定式':' + en train de / d’ + 不定式';
  g.form=[s(`${verb} 的现在时`,[paradigm(verb,'present',verb),p(`以上形式${suffix}。后面的动词保持不定式，不再按人称变位。`),
   ...(id==='near-future'?[ex('Je ne vais pas partir. / Je vais le faire.','我不打算走。/ 我会做这件事。')]:id==='recent-past'?[ex('Je viens de finir. / Je viens d’arriver.','我刚做完。/ 我刚到。')]:[ex('Je suis en train de lire.','我正在看书。')]),
  ],{defaultOpen:true})];
  if(id==='recent-past')g.form.push(s('过去的参照点',[
   p('参照点移到过去时，venir 可用未完成过去时：venais / venais / venait / venions / veniez / venaient。'),
   ex('Je venais de rentrer quand tu as appelé.','你打来电话时，我刚刚回到家。'),
  ],{advanced:true}));
  g.verbs=[s('完整结构示例',[t(['人称','形式'],person.map((n,i)=>[n,forms('parler',id)[i]])),p('这里没有另加一套不规则词尾；只需变 aller、venir 或 être。')],{defaultOpen:true}),...full];
  if(id==='ongoing')g.compare=[s('现在时与进行结构',[
   p('现在时本身可以表示正在发生；en train de 强调过程。它是一种结构，不是独立的人称词尾体系。'),
   ex('Je lis. / Je suis en train de lire.','我在读书。/ 我正处于读书的过程中。'),
   ex('J’étais en train de dormir quand tu as appelé.','你打来电话时，我正在睡觉。'),
   p('一般不与 savoir 等静态含义搭配。'),
  ])];
 }
 if(compoundAux[id]){
  const auxTense=compoundAux[id],label=tenseLabels[auxTense];
  g.form=[s(`助动词用${label}`, [
   t(['人称','avoir','être'],person.map((n,i)=>[n,forms('avoir',auxTense)[i],forms('être',auxTense)[i]])),
   p('再接过去分词；助动词选择和配合规则与复合过去时相同。'),
   ex(id==='pluperfect'?'J’avais parlé. / Elle était partie.':id==='future-perfect'?'J’aurai parlé. / Elle sera partie.':id==='conditional-past'?'J’aurais parlé. / Elle serait partie.':'…que j’aie parlé. / …qu’elle soit partie.',
    id==='pluperfect'?'我之前已说过。/ 她之前已离开。':id==='future-perfect'?'我到时将已说过。/ 她到时将已离开。':id==='conditional-past'?'我本会说。/ 她本会离开。':'……我已说过。/ ……她已离开。'),
   {t:'past-reference'},
  ],{defaultOpen:true}),s('否定与代词位置',[
   p('否定词围住变位的助动词；宾语代词放在助动词前。'),
   ex(id==='pluperfect'?'Je ne l’avais pas vu.':id==='future-perfect'?'Je ne l’aurai pas vu.':id==='conditional-past'?'Je ne l’aurais pas vu.':'Je regrette que tu ne l’aies pas vu.',
    id==='pluperfect'?'我之前没有见过他。':id==='future-perfect'?'到那个时候，我将还没有见过他。':id==='conditional-past'?'我本不会见到他。':'你没见到他，我感到遗憾。'),
  ])];
  g.verbs=[s('完整人称示例',supplements[0].blocks.filter(b=>b.t==='table'&&b.headers[0]==='人称'),{defaultOpen:true}),...exhaustive(supplements)];
  if(id==='subjunctive-past')g.compare=[s('现在式还是过去式',[
   t(['选择','相对时间','例句'],[['虚拟式现在时','同时或之后','Je suis content que tu viennes.'],['虚拟式过去时','强调先已完成','Je suis content que tu sois venu.']]),
   p('先由结构决定是否用虚拟式，再判断从句动作是否已完成。现代常用法中，主句在过去也可以使用虚拟式过去时。'),
  ])];
 }
 if(id==='subjunctive'){
  g.use.push(s('常见触发结构',[
   t(['类别','常见结构','中文'],[['必要','il faut que','必须……'],['愿望','vouloir / souhaiter que','希望……'],['情感','être heureux / regretter que','高兴 / 遗憾……'],['怀疑','douter que','怀疑……'],['目的','pour que / afin que','为了……'],['让步','bien que / quoique','尽管……'],['时间','avant que / jusqu’à ce que','在……前 / 直到……'],['条件','à condition que','只要……']]),
   p('最高级、唯一对象、不确定的寻找对象等关系从句，也可能使用虚拟式，取决于是否把对象作为已确定事实。'),
  ],{defaultOpen:true}));
  g.use.push({...copyNotes([o[2]])[0],title:'触发结构补充',advanced:true});
  g.form=[s('先取词干，再加词尾',[
   t(['人称','一般词干来源','词尾'],person.map((n,i)=>[n,[3,4].includes(i)?'nous 现在时去 -ons':'ils 现在时去 -ent',tails.subjunctive[i]])),
   ex('ils finissent → que je finisse ; nous finissons → que nous finissions','先从现在时取词干，再加对应词尾。'),
   p('être、avoir 等特殊形式单独记；不要把一般规则直接套在它们上面。'),
  ],{defaultOpen:true})];
  const double=['venir','tenir','prendre','boire','voir','croire','devoir','recevoir','mourir','aller','vouloir','valoir'];
  g.verbs=[s('双词干常用动词',[
   t(['动词原形','que je','que nous'],double.map(v=>[v,forms(v,id)[0],forms(v,id)[3]])),
   p('je / tu / il / ils 共用第一组词干，nous / vous 共用第二组词干。'),
  ],{defaultOpen:true}),s('特殊形式',[
   ...['être','avoir'].map(v=>{const f=forms(v,id);return t(['人称',v],person.map((n,i)=>[n,f[i]]));}),
   t(['动词原形','que je','que nous'],['faire','pouvoir','savoir'].map(v=>[v,forms(v,id)[0],forms(v,id)[3]])),
   p('falloir → qu’il faille；pleuvoir → qu’il pleuve；prévaloir → que je prévale / que nous prévalions。'),
  ],{defaultOpen:true}),...full];
  g.compare=[s('先判断结构，再判断时间',[
   ex('Je pense qu’il vient. / Je ne pense pas qu’il vienne.','我认为他会来。/ 我不认为他会来。'),
   ex('J’espère qu’il viendra.','我希望他会来。肯定陈述中的 espérer que 通常接直陈式。'),
   ex('Je veux partir. / Je veux que tu partes.','我想走。/ 我想让你走。'),
   p('虚拟式不等于“不真实”：Je suis heureux que tu sois là 可以描述真实情况。'),
   p('主从句同一主语且结构允许时，通常用不定式；虚拟式现在时和过去时仍有相对时间区别。'),
  ])];
 }
 if(id==='imperative'){
  g.form=[s('只保留 tu / nous / vous',[
   t(['对应人称','形式','中文'],[['tu','Parle ! / Finis ! / Vends !','你说！/ 完成！/ 卖掉！'],['nous','Parlons ! / Finissons ! / Vendons !','我们说吧！/ 完成吧！/ 卖掉吧！'],['vous','Parlez ! / Finissez ! / Vendez !','请说！/ 请完成！/ 请卖掉！']]),
   p('去掉主语。第一组及 ouvrir、offrir、cueillir 等的 tu 形式去 -s；aller → va。'),
  ],{defaultOpen:true}),s('代词位置',[
   t(['句式','位置','例句'],[['肯定','动词后，用连字符连接','Donne-le-moi ! / Lève-toi !'],['否定','动词前，不用连字符','Ne me le donne pas ! / Ne te lève pas !']]),
   p('肯定句 me / te 通常改为 moi / toi；接 y / en 时有 m’ / t’ 等变化：Donne-m’en ! / Va-t’en !'),
  ],{defaultOpen:true})];
  g.verbs=[s('常用特殊形式',[
   t(['动词原形','tu','nous / vous'],['être','avoir','savoir','vouloir','aller','faire','dire'].map(v=>[v,forms(v,id)[1],`${forms(v,id)[3]} / ${forms(v,id)[4]}`])),
   p('vouloir 常用 veuillez 表示礼貌要求；veuille / veuillons 较少见。pouvoir、falloir 没有普通命令式。'),
  ],{defaultOpen:true}),s('词尾 -s 的保留与恢复',[
   t(['结构','形式','原因'],[['单独使用','Mange ! / Va !','tu 不保留 s'],['直接接 en / y','Manges-en ! / Vas-y !','为读音恢复 s'],['en 属于后面的不定式结构','Va en acheter !','不恢复 s']]),
  ]),...exhaustive(supplements)];
 }
 if(id==='simple-past'){
  g.form=[s('常见词尾模型',[
   t(['人称','-er 型','-i 型'],person.map((n,i)=>[n,['-ai','-as','-a','-âmes','-âtes','-èrent'][i],['-is','-is','-it','-îmes','-îtes','-irent'][i]])),
   t(['人称','-u 型','venir / tenir 型'],person.map((n,i)=>[n,['-us','-us','-ut','-ûmes','-ûtes','-urent'][i],['-ins','-ins','-int','-înmes','-întes','-inrent'][i]])),
   p('这是阅读拓展。-ir / -re 并非一律用 -i 型；按具体动词模型识别。'),
  ],{defaultOpen:true})];
  g.verbs=[s('高频阅读形式',[
   t(['原形','il / ils','中文'],['être','avoir','faire','aller','venir','tenir','voir','prendre','dire','pouvoir','vouloir','savoir','écrire','naître','mourir'].map(v=>[v,[2,5].map(i=>forms(v,id)[i]).join(' / '),model(v).zh])),
  ],{defaultOpen:true}),...full];
  g.compare=[s('叙事中的分工',[
   p('简单过去时推进完整事件；未完成过去时描写背景与过程。日常交流通常用复合过去时叙述完整事件。'),
   ex('Il pleuvait quand Paul entra.','保罗进来时，天正在下雨。'),
  ])];
 }
 if(id==='nonfinite'){
  g={rule:[s('不定式',[
   t(['形式','构成','例子'],[['现在不定式','动词原形','parler / finir / prendre'],['过去不定式','avoir / être + 过去分词','avoir parlé / être parti(e)']]),
   ex('Je veux partir. / Avant de partir, ferme la porte.','我想走。/ 走之前把门关上。'),
   ex('Après avoir mangé, il est sorti.','吃完后，他出门了。'),
  ],{defaultOpen:true})],examples:[s('现在分词与副动词',[
   t(['项目','构成','例子'],[['现在分词','nous 现在时去 -ons + -ant','parlant / finissant / prenant'],['副动词','en + 现在分词','en parlant / en finissant'],['特殊形式','être / avoir / savoir','étant / ayant / sachant']]),
   ex('Elle écoute de la musique en travaillant.','她一边工作一边听音乐。'),
   p('副动词通常与主句共用主语，可表示同时、方式、原因或条件；tout en 可强调同时或让步。'),
   ex('Tout en souriant, elle a refusé.','她微笑着拒绝了。'),
  ],{defaultOpen:true})],compare:[s('动作形式还是形容词',[
   t(['用法','配合','例子'],[['现在分词表示动作','不变','des enfants parlant anglais'],['动词形容词','与名词配合','des histoires intéressantes'],['过去分词','看具体结构','une porte fermée']]),
   p('拼写也可能不同：communiquant / communicant，fatiguant / fatigant，provoquant / provocant。'),
   p('副动词不能随意更换主语：En entrant, j’ai vu Paul.（我进门时看见了保罗。）'),
  ]),s('复合形式补充',[p('过去副动词：en ayant / en étant + 过去分词。过去不定式和过去副动词的过去分词配合，按相应助动词规则判断。'),{t:'past-reference'}],{advanced:true})],reference:supplements.map(a=>({...a,advanced:true}))};
 }
 if(id==='passive'){
  g={rule:[s('être + 过去分词',[
   p('原主动句的直接宾语成为新主语；être 保留原来的时态，过去分词与新主语保持性数一致。施事可由 par 引出。'),
   ex('Paul écrit la lettre. → La lettre est écrite par Paul.','保罗写信。→ 信由保罗来写。'),
  ],{defaultOpen:true})],examples:[s('按时态套用',[
   t(['时态','être 的形式','被动句'],[['现在时','est','La lettre est écrite.'],['复合过去时','a été','La lettre a été écrite.'],['未完成过去时','était','La lettre était écrite.'],['愈过去时','avait été','La lettre avait été écrite.'],['简单将来时','sera','La lettre sera écrite.'],['条件式现在时','serait','La lettre serait écrite.'],['虚拟式现在时','soit','…que la lettre soit écrite.']]),
  ],{defaultOpen:true})],compare:[s('动作与状态',[
   ex('La porte est fermée. / La porte a été fermée par Paul.','门关着。/ 门被保罗关上了。'),
   p('前句可描述状态；后句明确叙述关门动作。只有适合被动化的及物动词才能套用此结构。'),
  ])]};
 }
 // Synthesis topics use the same compact tables, while retaining examples and
 // every source rule instead of forcing a conjugation lesson on them.
 if(['past-contrast','reported','hypothesis','time-relations','time-markers'].includes(id)){
  g=Object.fromEntries(Object.entries(g).map(([key,sections])=>[key,copyNotes(sections)]));
  if(id==='hypothesis')g.compare=[s('si 条件从句',[
   p('表示“如果”的条件从句不用将来时或条件式：Si j’ai le temps, je viendrai. / Si j’avais le temps, je viendrais.'),
   p('si 表示“是否”时不受这条条件句规则限制：Je me demande s’il viendra.（我想知道他会不会来。）'),
  ])];
 }
 const labels={use:'用法',form:'构成',verbs:'变位',compare:'辨析',rule:'规则',examples:id==='nonfinite'?'分词':'例句',extra:'拓展',reference:'速查'};
 return Object.entries(g).map(([key,sections])=>({id:key,label:labels[key],sections}));
}
