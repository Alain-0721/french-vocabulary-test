const p=x=>({t:'p',x});
const h=x=>({t:'h3',x});
const example=(f,z)=>({t:'fr',f,z});
const table=(headers,rows)=>({t:'table',presentation:'notes',headers,rows});

export const etreVerbs=[
 ['aller','allé','去'],['arriver','arrivé','到达'],['venir','venu','来'],
 ['revenir','revenu','回来'],['retourner','retourné','返回'],['rentrer','rentré','回家；回来'],
 ['passer','passé','经过'],['partir','parti','离开；出发'],['rester','resté','停留'],
 ['entrer','entré','进入'],['sortir','sorti','出去'],['naître','né','出生'],
 ['mourir','mort','死亡'],['monter','monté','上去；上升'],['descendre','descendu','下去；下降'],
 ['tomber','tombé','掉落；摔倒'],['devenir','devenu','变成'],
];
export const avoirParticiples=[
 ['pouvoir','pu','能；可以'],['vouloir','voulu','想要'],['avoir','eu','有'],
 ['être','été','是'],['faire','fait','做'],['apprendre','appris','学习；得知'],
 ['devoir','dû','应该；必须'],['dire','dit','说'],['écrire','écrit','写'],
 ['lire','lu','读'],['prendre','pris','拿；取'],['boire','bu','喝'],
 ['mettre','mis','放置'],['tenir','tenu','握住；保持'],['obtenir','obtenu','获得'],
 ['recevoir','reçu','收到'],
];

export const compoundPastNotes=[
 {title:'avoir + 过去分词',hint:'avoir 用直陈式现在时；大多数动词用这一类',defaultOpen:true,blocks:[
  h('规则过去分词'),
  table(['动词类型','变化','例子'],[
   ['第一组 -er','-er → -é','parler → parlé'],
   ['第二组 -ir','-ir → -i','finir → fini'],
   ['部分 -re','-re → -u','vendre → vendu'],
  ]),
  h('常用不规则过去分词'),table(['动词原形','过去分词','中文'],avoirParticiples),
  p('**配合：**通常不变；直接宾语（COD）在前时，与该宾语保持性数一致。'),
  example('Les pommes, ils les ont mangées.','那些苹果，他们吃掉了。'),
 ]},
 {title:'être + 过去分词',hint:'être 用直陈式现在时；常用动词如下',defaultOpen:true,blocks:[
  table(['动词原形','过去分词','中文'],etreVerbs),
  p('以上列出常用核心词；repartir 等其他派生词也需按具体用法判断。'),
  p('**配合：**普通 être 结构与主语一致：阴性 **-e**，复数 **-s**，阴性复数 **-es**。'),
  example('Il est allé. / Elle est allée. / Ils sont allés. / Elles sont allées.','他去了。/ 她去了。/ 他们去了。/ 她们去了。'),
  h('代词式动词（se + 动词）也用 être'),
  example('Elle se voit. → Elle s’est vue.','她看见自己。→ 她看见了自己。'),
  p('**配合看宾语：**se 是前置直接宾语时配合；是间接宾语时不按 se 配合。'),
  example('Elle s’est lavée. / Elle s’est lavé les mains.','她洗了澡。/ 她洗了手。'),
  example('Elles se sont parlé.','她们互相说了话。'),
  h('少量动词可改用 avoir'),
  p('sortir、monter、descendre、rentrer、retourner、passer 等，带直接宾语时用 avoir。'),
  example('Elle est sortie. / Elle a sorti son téléphone.','她出去了。/ 她拿出了手机。'),
 ]},
 {title:'否定与疑问',blocks:[
  p('**否定：**ne … pas 围住助动词。'),example('Je n’ai pas parlé.','我没有说。'),
  p('**疑问：**est-ce que + 主语 + 助动词 + 过去分词。'),example('Est-ce que tu as parlé ?','你说过了吗？'),
 ]},
];
