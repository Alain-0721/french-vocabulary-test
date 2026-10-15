import bank from './tense-bank.json' with {type:'json'};

const questions=[];
function choose(topic,prompt,zh,options,correct,explanation){questions.push({id:`tense-${topic}-${questions.filter(q=>q.topic===topic).length+1}`,topic,type:'choice',prompt,zh,options,correct,explanation});}
function fill(topic,prompt,zh,expected,explanation){questions.push({id:`tense-${topic}-${questions.filter(q=>q.topic===topic).length+1}`,topic,type:'fill',prompt,zh,expected:Array.isArray(expected)?expected:[expected],explanation});}
choose('present','J’habite ici depuis trois ans et j’y habite toujours. Quel temps convient ?','我住在这里三年了，现在仍在这里。选哪个时态？',['现在时','复合过去时','愈过去时'],0,'持续到现在的居住状态用现在时；depuis 说明起点或时长。');
fill('present','Chaque matin, nous ___ (prendre) le métro.','每天早上，我们乘地铁。','prenons','prendre 的 nous 现在时形式为 prenons。');
choose('near-future','Regarde ces nuages ! Il ___ pleuvoir.','看那些云！要下雨了。',['vient de','va','a'],1,'aller + 不定式可表达根据当前迹象预期的将来动作。');
fill('near-future','Nous ___ visiter le musée demain. (aller au présent)','我们打算明天参观博物馆。','allons','nous allons + 不定式 visiter。');
choose('recent-past','Paul vient de partir. Que signifie cette phrase ?','Paul vient de partir 这句话什么意思？',['Paul 刚走','Paul 马上走','Paul 正在走'],0,'venir de + 不定式表达刚发生的动作。');
fill('recent-past','Vous ___ de finir le travail. (venir au présent)','你们刚完成工作。','venez','venir 的 vous 形式为 venez，后接 de + 不定式。');
choose('ongoing','Marie est en train de lire. Quelle phrase a le même sens général ?','Marie 正在读书。哪个表达基本含义相同？',['Marie lira.','Marie a lu.','Marie lit.'],2,'现在时本身也可表示正在进行；en train de 更强调过程。');
fill('ongoing','Je suis en train de ___ (préparer) le dîner.','我正在准备晚饭。','préparer','en train de 后使用不定式。');
choose('imperative','Choisissez l’impératif affirmatif avec deux pronoms.','选出带两个代词的肯定命令式。',['Donne-moi-le !','Donne-le-moi !','Me le donne !'],1,'肯定命令式中 le 在 moi 前，以连字符连接。');
fill('imperative','___ (aller, tu) à la bibliothèque !','去图书馆！','Va','aller 的 tu 命令式为 va；在 vas-y 中为便于发音才保留 s。');
choose('compound-past','Hier, Marie ___ au marché.','昨天 Marie 去了市场。',['a allée','est allé','est allée'],2,'aller 用 être，Marie 为女性，过去分词 allée 配合主语。');
fill('compound-past','Elle s’est ___ les mains. (laver)','她洗了手。','lavé','直接宾语 les mains 在动词后，se 为间接宾语，lavé 不配合。');
choose('imperfect','Quand j’étais enfant, je ___ au foot tous les mercredis.','小时候，我每周三都踢足球。',['jouais','jouerai','avais joué'],0,'这里描述过去习惯，用未完成过去时。');
fill('imperfect','Il ___ froid quand nous sommes sortis. (faire à l’imparfait)','我们出去时天气很冷。','faisait','天气作为过去场景的背景，用 il faisait。');
choose('past-contrast','Je ___ quand le téléphone a sonné. (action en cours)','电话响的时候，我正在睡觉。',['ai dormi','dormais','dormirai'],1,'正在进行的背景用未完成过去时；电话响是发生的事件。');
choose('past-contrast','J’ai lu ce livre en deux jours. Comment présente-t-on la lecture ?','我两天读完了这本书。这里怎样呈现阅读？',['过去的习惯','尚未结束的背景','完整的事件'],2,'en deux jours 标出完成阅读花费的时间，复合过去时呈现整个事件。');
choose('pluperfect','À mon arrivée, le train ___ déjà parti.','我到达时，火车已先开走。',['sera','a','était'],2,'先于过去参照点的动作，用 être 未完成过去时 + parti。');
fill('pluperfect','J’___ fini avant son arrivée. (avoir à l’imparfait)','他到之前我已经完成了。','avais','愈过去时：avais + fini。');
choose('simple-past','Dans un récit, « il fut » correspond généralement à…','叙事中的 il fut 一般对应哪个表达？',['il sera','il a été','il est'],1,'fut 是 être 的简单过去时第三人称单数。');
choose('simple-past','Quel est l’infinitif de « ils vinrent » ?','ils vinrent 的不定式是什么？',['voir','vendre','venir'],2,'vinrent 是 venir 的简单过去时第三人称复数。');
choose('future','Si j’ai le temps, je ___ demain.','如果有时间，我明天会来。',['viendrais','viendrai','venais'],1,'真实条件用 si + 现在时，结果可用将来时。');
fill('future','Demain, nous ___ à Lyon. (aller au futur simple)','明天我们去里昂。','irons','aller 将来时词干 ir-，nous 词尾 -ons。');
choose('future-perfect','Quand tu ___ fini, tu pourras sortir.','你先做完后，就可以出去。',['as','auras','avais'],1,'用先将来时 auras fini 明确表达先已完成。');
fill('future-perfect','À midi, j’___ terminé le travail. (avoir au futur simple)','到中午，我会已经完成工作。','aurai','先将来时由将来时助动词 + 过去分词构成。');
choose('conditional','Pourriez-vous m’aider ? Quel usage du conditionnel ?','您能帮帮我吗？条件式用于什么？',['礼貌请求','过去的习惯','确定的过去事件'],0,'条件式可以让请求更委婉。');
fill('conditional','Si j’avais le temps, je ___ davantage. (voyager au conditionnel présent)','如果有时间，我会多旅行。','voyagerais','si + 未完成过去时，假设结果用条件式现在时。');
choose('conditional-past','Si j’avais su, je ___ venu plus tôt.','如果早知道，我就早点来了。',['suis','serai','serais'],2,'过去未实现的假设：si + 愈过去时，结果用条件式过去时 serais venu。');
fill('conditional-past','Tu ___ pu me prévenir ! (avoir au conditionnel présent)','你本可以提前告诉我！','aurais','aurais pu 表示过去本可以做到。');
choose('subjunctive','Il faut que tu ___ à l’heure.','你必须准时。',['es','sois','seras'],1,'il faut que 引出虚拟式；être 的 tu 形式为 sois。');
fill('subjunctive','Je veux que nous ___ ensemble. (venir au subjonctif présent)','我希望我们一起来。','venions','venir 的虚拟式 nous 形式为 venions。');
choose('subjunctive-past','Je suis heureuse que tu ___ venu hier.','我很高兴你昨天来了。',['sois','seras','étais'],0,'来了先于现在的情感，使用虚拟式过去时 sois venu。');
fill('subjunctive-past','Bien qu’il ___ plu, nous sommes sortis. (avoir au subjonctif présent)','虽然下过雨，我们还是出去了。','ait','bien que 引出虚拟式，已完成动作用 ait plu。');
choose('nonfinite','Elle apprend en ___ des films. (regarder)','她通过看电影学习。',['regarde','regardé','regardant'],2,'副动词 en + 现在分词 regardant 表示方式。');
fill('nonfinite','Après ___ mangé, il est sorti.','吃完后，他出门了。','avoir','不定式过去式 avoir mangé 表示先完成的动作。');
choose('reported','Hier, Paul a dit : « Je viendrai demain. » Aujourd’hui, on rapporte ses paroles.','Paul 昨天说“我明天来”。今天以过去参照转述。',['Il a dit qu’il venait la veille.','Il a dit qu’il viendrait le lendemain.','Il a dit qu’il vient hier.'],1,'采用过去参照转述：将来时变条件式；demain 对应 le lendemain。');
fill('reported','Il a dit : « J’ai fini. » → Il a dit qu’il ___ fini.','他说“我做完了”。采用时态后移转述。','avait','复合过去时在过去参照的间接引语中对应愈过去时。');
choose('hypothesis','Si j’___ riche, je voyagerais.','假如我有钱，我就会旅行。',['aurais','serai','étais'],2,'假设条件中 si + 未完成过去时；不能写 si je serais。');
fill('hypothesis','Si tu as le temps, ___ ! (venir, tu, impératif)','如果你有时间，来吧！','viens','真实条件的结果可以使用命令式。');
choose('time-relations','Choisissez la forme enseignée après « avant que ».','选出教材中 avant que 后采用的语气。',['虚拟式','不定式','命令式'],0,'avant que 引出虚拟式从句；同一主语可用 avant de + 不定式。');
fill('time-relations','Je te le dirai avant que tu ___. (partir au subjonctif présent)','你走之前，我会告诉你。','partes','avant que 后接虚拟式，tu partes。');
choose('time-markers','J’habite ici ___ 2020. J’y habite encore.','我从 2020 年起住在这里，现在仍住这里。',['pendant','dans','depuis'],2,'depuis 引入延续至现在的起点。');
fill('time-markers','J’ai fini ce livre ___ trois jours.','我花三天读完了这本书。','en','en + 时长表示完成一件事所用的时间。');
choose('passive','Paul a fermé la porte. → La porte ___ par Paul.','Paul 关了门。变被动句并保持复合过去时。',['est fermée','a été fermée','avait fermé'],1,'être 变为复合过去时 a été，fermée 与 la porte 配合。');
fill('passive','Les lettres sont ___ par Marie. (écrire, participe passé)','信由 Marie 写。','écrites','过去分词 écrit 与被动句主语 les lettres 作阴性复数配合。');

const persons=['je','tu','il / elle','nous','vous','ils / elles'];
const labels={'present':'现在时','compound-past':'复合过去时','imperfect':'未完成过去时','future':'简单将来时','conditional':'条件式现在时','subjunctive':'虚拟式现在时'};
for(const verb of bank.verbs)for(const [topic,forms] of Object.entries(verb.forms))forms.forEach((form,i)=>{
 const base=form.replace(/\(e\)\(s\)/g,'').replace(/\(e\)/g,'');
 const expected=[base];if(form.includes('(e)'))expected.push(base.replace(/(allé|venu)(s?)$/,'$1e$2'));
 if(i===4&&form.includes('(s)')){expected.push(base+'s',base.replace(/(allé|venu)$/,'$1es'));}
 questions.push({id:`tense-conjugate-${verb.id}-${topic}-${i}`,topic,type:'fill',prompt:`${verb.id} — ${persons[i]} — ${labels[topic]}`,zh:`写出 ${verb.id}（${verb.zh}）的${labels[topic]}、${persons[i]} 形式。${topic==='compound-past'?'包括助动词；性数按你选定的主语填写。':'只填动词形式。'}`,expected,explanation:`参考形式：${form}。${topic==='compound-past'?'过去分词按主语配合，être / avoir 本身使用 avoir 作助动词。':''}`});
});
export const tenseQuestions=questions;
export function normalizeText(value){return String(value).normalize('NFC').trim().replace(/[’‘]/g,"'").replace(/\s+/g,' ').replace(/[.!?]+$/,'').toLocaleLowerCase('fr');}
export function isCorrect(q,value){return q.type==='choice'?value===q.correct:q.expected.some(a=>normalizeText(a)===normalizeText(value));}
