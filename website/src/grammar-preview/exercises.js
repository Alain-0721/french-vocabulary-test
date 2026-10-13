// Original preview exercises, kept separate from the textbook excerpts.
import {additionalQuestions as u01} from './exercises-u01-u03.js';
import {additionalQuestions as u04} from './exercises-u04-u06.js';
import {additionalQuestions as u07} from './exercises-u07-u09.js';
import {additionalQuestions as u10} from './exercises-u10-u12.js';
import bank from './bank.json' with {type:'json'};
const originalQuestions=[
 {id:'pc-1',topic:'edito-b1-u01-p1-g01',prompt:'Action en cours dans le passé : hier, pendant que je ___, le téléphone a sonné.',zh:'过去正在进行的动作：昨天，我正在读书时，电话响了。',options:['lisais','ai lu','lirai'],correct:0,explanation:'未完成过去时 lisais 描写正在进行的背景；复合过去时 a sonné 表示发生的事件。'},
 {id:'pc-2',topic:'edito-b1-u01-p1-g01',prompt:'Nous ___ le musée hier après-midi.',zh:'我们昨天下午参观了博物馆。（把参观作为完整事件）',options:['visitions','avons visité','avions visité'],correct:1,explanation:'此处以完整事件叙述参观，用 avoir 的现在时 + 过去分词 visité。'},
 {id:'pc-3',topic:'edito-b1-u01-p1-g01',prompt:'Quand elle était petite, elle ___ du piano tous les jours.',zh:'她小时候每天弹钢琴。',options:['a joué','jouera','jouait'],correct:2,explanation:'过去反复发生的习惯用未完成过去时：jouait。'},
 {id:'time-1',topic:'edito-b1-u01-p2-g02',prompt:'J’habite ici ___ trois ans. J’y habite toujours.',zh:'我在这里住了三年，现在仍然住在这里。',options:['depuis','il y a','dans'],correct:0,explanation:'depuis 引入延续至参照时刻的时长；这里仍在居住，动词用现在时。'},
 {id:'time-2',topic:'edito-b1-u01-p2-g02',prompt:'Il est arrivé ___ deux heures.',zh:'他两小时前到了。',options:['dans','il y a','depuis'],correct:1,explanation:'il y a + 时长表示相对于现在的“……以前”。'},
 {id:'pqp-1',topic:'edito-b1-u01-p2-g03',prompt:'Plus-que-parfait : quand je suis arrivé, Marie ___ déjà.',zh:'使用愈过去时：我到的时候，Marie 已经离开了。',options:['partira','est partie','était partie'],correct:2,explanation:'离开先于另一个过去事件，用愈过去时：être 的未完成过去时 + partie。'},
 {id:'pqp-2',topic:'edito-b1-u01-p2-g03',prompt:'选择愈过去时的构成。',zh:'Le plus-que-parfait',options:['助动词现在时 + 过去分词','助动词未完成过去时 + 过去分词','助动词将来时 + 过去分词'],correct:1,explanation:'助动词 avoir / être 使用未完成过去时，再接过去分词。'},
 {id:'q-1',topic:'edito-b1-u02-p1-g04',prompt:'Choisissez la question correctement écrite avec inversion.',zh:'选择书写正确的主谓倒装疑问句：他来吗？',options:['Vient-il ?','Vient il ?','Il vient-t ?'],correct:0,explanation:'主谓倒装时用连字符连接动词与主语代词：Vient-il ?'},
 {id:'q-2',topic:'edito-b1-u02-p1-g04',prompt:'Pour demander le lieu : ___ tu habites ?',zh:'询问地点：你住在哪里？（使用 est-ce que 结构）',options:['Où est-ce que','Pourquoi est-ce que','Quand est-ce que'],correct:0,explanation:'询问地点使用 où；est-ce que 后保持主语 + 动词的顺序。'},
 {id:'ob-1',topic:'edito-b1-u02-p1-g05',prompt:'Il faut que tu ___ à l’heure.',zh:'你必须准时。',options:['es','sois','seras'],correct:1,explanation:'il faut que 后接虚拟式，être 的 tu 形式为 sois。'},
 {id:'ob-2',topic:'edito-b1-u02-p1-g05',prompt:'Il faut ___ ce formulaire.',zh:'必须填写这张表格。（没有单独引出主语）',options:['remplir','remplissez','rempli'],correct:0,explanation:'il faut 可以直接接不定式 remplir；有 que 从句时才采用相应的虚拟式结构。'},
 {id:'emotion-1',topic:'edito-b1-u02-p2-g06',prompt:'Je suis contente que tu ___ là.',zh:'我很高兴你在这里。',options:['es','seras','sois'],correct:2,explanation:'表达情感的主句后使用 que 从句，通常用虚拟式：que tu sois。'},
];
const combined=[...originalQuestions,...u01,...u04,...u07,...u10];
export const exercises=bank.topics.flatMap(topic=>combined.filter(q=>q.topic===topic.id));
