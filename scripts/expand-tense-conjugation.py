"""Author full tense paradigms from explicit model stems; no guessed missing forms."""
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
TARGET=ROOT/'website/src/grammar-preview/conjugation-bank.json'
P=['je','tu','il / elle / on','nous','vous','ils / elles']
def forms(text):return text.split(',')
def suffix(stem,endings):return [stem+e for e in endings]
def para(rows):return {'t':'table','headers':['人称','形式'],'rows':[[p,x or '—（无此形式 / 不使用）'] for p,x in zip(P,rows)]}
def p(x):return {'t':'p','x':x}
def table(headers,rows):return {'t':'table','headers':headers,'rows':rows}

# Explicit present, future stem, past participle, subjunctive stem(s), simple-past stem/type.
# The regular imperative follows present tu/nous/vous; exceptions are set below.
DATA='''
être|是|suis,es,est,sommes,êtes,sont|ser|été|soi/soy|fu/u|être
avoir|有|ai,as,a,avons,avez,ont|aur|eu|ai/ay|eu/u|avoir
aller|去|vais,vas,va,allons,allez,vont|ir|allé|aill/all|all/a|aller
faire|做|fais,fais,fait,faisons,faites,font|fer|fait|fass|fi/i|faire
dire|说|dis,dis,dit,disons,dites,disent|dir|dit|dis|di/i|dire
redire|再说|redis,redis,redit,redisons,redites,redisent|redir|redit|redis|redi/i|dire
contredire|反驳|contredis,contredis,contredit,contredisons,contredisez,contredisent|contredir|contredit|contredis|contredi/i|dire-isez
interdire|禁止|interdis,interdis,interdit,interdisons,interdisez,interdisent|interdir|interdit|interdis|interdi/i|dire-isez
prédire|预言|prédis,prédis,prédit,prédisons,prédisez,prédisent|prédir|prédit|prédis|prédi/i|dire-isez
maudire|诅咒|maudis,maudis,maudit,maudissons,maudissez,maudissent|maudir|maudit|maudiss|maudi/i|maudire
prendre|拿|prends,prends,prend,prenons,prenez,prennent|prendr|pris|prenn/pren|pri/i|prendre
venir|来|viens,viens,vient,venons,venez,viennent|viendr|venu|vienn/ven|vin/in|venir
tenir|拿住|tiens,tiens,tient,tenons,tenez,tiennent|tiendr|tenu|tienn/ten|tin/in|tenir
pouvoir|能够|peux,peux,peut,pouvons,pouvez,peuvent|pourr|pu|puiss|pu/u|pouvoir
vouloir|想要|veux,veux,veut,voulons,voulez,veulent|voudr|voulu|veuill/voul|voulu/u|vouloir
devoir|必须|dois,dois,doit,devons,devez,doivent|devr|dû|doiv/dev|du/u|devoir
savoir|知道|sais,sais,sait,savons,savez,savent|saur|su|sach|su/u|savoir
voir|看见|vois,vois,voit,voyons,voyez,voient|verr|vu|voi/voy|vi/i|voir
prévoir|预见|prévois,prévois,prévoit,prévoyons,prévoyez,prévoient|prévoir|prévu|prévoi/prévoy|prévi/i|prévoir
pourvoir|配备|pourvois,pourvois,pourvoit,pourvoyons,pourvoyez,pourvoient|pourvoir|pourvu|pourvoi/pourvoy|pourvu/u|pourvoir
recevoir|收到|reçois,reçois,reçoit,recevons,recevez,reçoivent|recevr|reçu|reçoiv/recev|reçu/u|recevoir
boire|喝|bois,bois,boit,buvons,buvez,boivent|boir|bu|boiv/buv|bu/u|boire
croire|相信|crois,crois,croit,croyons,croyez,croient|croir|cru|croi/croy|cru/u|croire
mettre|放|mets,mets,met,mettons,mettez,mettent|mettr|mis|mett|mi/i|mettre
battre|打|bats,bats,bat,battons,battez,battent|battr|battu|batt|batti/i|battre
vivre|生活|vis,vis,vit,vivons,vivez,vivent|vivr|vécu|viv|vécu/u|vivre
suivre|跟随|suis,suis,suit,suivons,suivez,suivent|suivr|suivi|suiv|suivi/i|suivre
lire|读|lis,lis,lit,lisons,lisez,lisent|lir|lu|lis|lu/u|lire
écrire|写|écris,écris,écrit,écrivons,écrivez,écrivent|écrir|écrit|écriv|écrivi/i|écrire
conduire|驾驶|conduis,conduis,conduit,conduisons,conduisez,conduisent|conduir|conduit|conduis|conduisi/i|conduire
connaître|认识|connais,connais,connaît,connaissons,connaissez,connaissent|connaîtr|connu|connaiss|connu/u|connaître
paraître|看起来|parais,parais,paraît,paraissons,paraissez,paraissent|paraîtr|paru|paraiss|paru/u|paraître
naître|出生|nais,nais,naît,naissons,naissez,naissent|naîtr|né|naiss|naqui/i|naître
croître|增长|croîs,croîs,croît,croissons,croissez,croissent|croîtr|crû|croiss|crû/u|croître
craindre|害怕|crains,crains,craint,craignons,craignez,craignent|craindr|craint|craign|craigni/i|indre
peindre|画|peins,peins,peint,peignons,peignez,peignent|peindr|peint|peign|peigni/i|indre
joindre|连接|joins,joins,joint,joignons,joignez,joignent|joindr|joint|joign|joigni/i|indre
résoudre|解决|résous,résous,résout,résolvons,résolvez,résolvent|résoudr|résolu|résolv|résolu/u|résoudre
absoudre|赦免|absous,absous,absout,absolvons,absolvez,absolvent|absoudr|absous|absolv|-|absoudre
dissoudre|溶解|dissous,dissous,dissout,dissolvons,dissolvez,dissolvent|dissoudr|dissous|dissolv|-|absoudre
coudre|缝|couds,couds,coud,cousons,cousez,cousent|coudr|cousu|cous|cousi/i|coudre
moudre|磨|mouds,mouds,moud,moulons,moulez,moulent|moudr|moulu|moul|moulu/u|moudre
vaincre|战胜|vaincs,vaincs,vainc,vainquons,vainquez,vainquent|vaincr|vaincu|vainqu|vainqui/i|vaincre
rompre|打破|romps,romps,rompt,rompons,rompez,rompent|rompr|rompu|romp|rompi/i|rompre
conclure|得出结论|conclus,conclus,conclut,concluons,concluez,concluent|conclur|conclu|conclu|conclu/u|conclure
inclure|包含|inclus,inclus,inclut,incluons,incluez,incluent|inclur|inclus|inclu|inclu/u|inclure
exclure|排除|exclus,exclus,exclut,excluons,excluez,excluent|exclur|exclu|exclu|exclu/u|exclure
plaire|使喜欢|plais,plais,plaît,plaisons,plaisez,plaisent|plair|plu|plais|plu/u|plaire
taire|不说|tais,tais,tait,taisons,taisez,taisent|tair|tu|tais|tu/u|taire
rire|笑|ris,ris,rit,rions,riez,rient|rir|ri|ri|ri/i|rire
suffire|足够|suffis,suffis,suffit,suffisons,suffisez,suffisent|suffir|suffi|suffis|suffi/i|suffire
nuire|损害|nuis,nuis,nuit,nuisons,nuisez,nuisent|nuir|nui|nuis|nuisi/i|nuire
partir|出发|pars,pars,part,partons,partez,partent|partir|parti|part|parti/i|partir
sortir|出去|sors,sors,sort,sortons,sortez,sortent|sortir|sorti|sort|sorti/i|partir
dormir|睡觉|dors,dors,dort,dormons,dormez,dorment|dormir|dormi|dorm|dormi/i|partir
servir|服务|sers,sers,sert,servons,servez,servent|servir|servi|serv|servi/i|partir
sentir|感觉|sens,sens,sent,sentons,sentez,sentent|sentir|senti|sent|senti/i|partir
mentir|撒谎|mens,mens,ment,mentons,mentez,mentent|mentir|menti|ment|menti/i|partir
ouvrir|打开|ouvre,ouvres,ouvre,ouvrons,ouvrez,ouvrent|ouvrir|ouvert|ouvr|ouvri/i|ouvrir
couvrir|盖住|couvre,couvres,couvre,couvrons,couvrez,couvrent|couvrir|couvert|couvr|couvri/i|ouvrir
offrir|赠送|offre,offres,offre,offrons,offrez,offrent|offrir|offert|offr|offri/i|ouvrir
souffrir|受苦|souffre,souffres,souffre,souffrons,souffrez,souffrent|souffrir|souffert|souffr|souffri/i|ouvrir
cueillir|采摘|cueille,cueilles,cueille,cueillons,cueillez,cueillent|cueiller|cueilli|cueill|cueilli/i|cueillir
courir|跑|cours,cours,court,courons,courez,courent|courr|couru|cour|couru/u|courir
mourir|死亡|meurs,meurs,meurt,mourons,mourez,meurent|mourr|mort|meur/mour|mouru/u|mourir
acquérir|获得|acquiers,acquiers,acquiert,acquérons,acquérez,acquièrent|acquerr|acquis|acquièr/acquér|acqui/i|acquérir
fuir|逃跑|fuis,fuis,fuit,fuyons,fuyez,fuient|fuir|fui|fui/fuy|fui/i|fuir
haïr|憎恨|hais,hais,hait,haïssons,haïssez,haïssent|haïr|haï|haïss|haï/i|haïr
valoir|值|vaux,vaux,vaut,valons,valez,valent|vaudr|valu|vaill/val|valu/u|valoir
asseoir|使坐下|assieds,assieds,assied,asseyons,asseyez,asseyent|assiér|assis|assey|assi/i|asseoir
asseoir (variante)|使坐下（另一套）|assois,assois,assoit,assoyons,assoyez,assoient|assoir|assis|assoi/assoy|assi/i|asseoir
émouvoir|打动|émeus,émeus,émeut,émouvons,émouvez,émeuvent|émouvr|ému|émeuv/émouv|ému/u|mouvoir
mouvoir|移动|meus,meus,meut,mouvons,mouvez,meuvent|mouvr|mû|meuv/mouv|mu/u|mouvoir
vêtir|穿衣|vêts,vêts,vêt,vêtons,vêtez,vêtent|vêtir|vêtu|vêt|vêti/i|vêtir
bouillir|沸腾|bous,bous,bout,bouillons,bouillez,bouillent|bouillir|bouilli|bouill|bouilli/i|bouillir
falloir|必须|—,—,faut,—,—,—|faudr|fallu|faill|fallu/u|impersonal
pleuvoir|下雨|—,—,pleut,—,—,pleuvent|pleuvr|plu|pleuv|plu/u|impersonal
'''
models=[]
for line in DATA.strip().splitlines():
 id,zh,present,future,pp,subj,ps,family=line.split('|')
 pres=[None if x=='—' else x for x in forms(present)]
 stems=subj.split('/');s1=stems[0];s2=stems[-1]
 sub=[s1+'e',s1+'es',s1+'e',s2+'ions',s2+'iez',s1+'ent']
 if id=='être':sub=forms('sois,sois,soit,soyons,soyez,soient')
 if id=='avoir':sub=forms('aie,aies,ait,ayons,ayez,aient')
 imp=[None]*6 if not pres[3] else suffix(pres[3][:-3],forms('ais,ais,ait,ions,iez,aient'))
 if id=='être':imp=suffix('ét',forms('ais,ais,ait,ions,iez,aient'))
 if id=='falloir':imp=[None,None,'fallait',None,None,None]
 if id=='pleuvoir':imp=[None,None,'pleuvait',None,None,'pleuvaient']
 fut=suffix(future,forms('ai,as,a,ons,ez,ont'));cond=suffix(future,forms('ais,ais,ait,ions,iez,aient'))
 past=[None]*6
 if ps!='-':
  stem,kind=ps.split('/')
  if kind=='a':past=suffix(stem,forms('ai,as,a,âmes,âtes,èrent'))
  elif kind=='i':past=[stem+'s',stem+'s',stem+'t',stem[:-1]+'îmes',stem[:-1]+'îtes',stem+'rent']
  elif kind=='u':past=[stem+'s',stem+'s',stem+'t',stem[:-1]+'ûmes',stem[:-1]+'ûtes',stem+'rent']
  else:past=[stem+'s',stem+'s',stem+'t',stem[:-2]+'înmes',stem[:-2]+'întes',stem+'rent']
 if id=='haïr':past=forms('haïs,haïs,haït,haïmes,haïtes,haïrent')
 if id=='croître':past=forms('crûs,crûs,crût,crûmes,crûtes,crûrent')
 command=[None,pres[1],None,pres[3],pres[4],None]
 if family in ['ouvrir','cueillir']:command[1]=pres[1][:-1]
 if id=='aller':command[1]='va'
 if id=='être':command=[None,'sois',None,'soyons','soyez',None]
 if id=='avoir':command=[None,'aie',None,'ayons','ayez',None]
 if id=='savoir':command=[None,'sache',None,'sachons','sachez',None]
 if id=='pouvoir':command=[None]*6
 if id=='vouloir':command=[None,'veuille',None,'veuillons','veuillez',None]
 if family=='impersonal':
  for rows in [fut,cond,sub,past]:
   for i in range(6):
    if i!=2 and not(id=='pleuvoir' and i==5):rows[i]=None
  command=[None]*6
 aux='être' if id in ['aller','venir','partir','sortir','naître','mourir'] else 'avoir'
 models.append({'id':id,'zh':zh,'family':family,'participle':pp,'auxiliary':aux,'futureStem':future,'forms':{'present':pres,'imperfect':imp,'future':fut,'conditional':cond,'subjunctive':sub,'simple-past':past,'imperative':command}})

# Regular models and spelling alternations, explicitly not treated as lexical exceptions.
REG=[('parler','说','parl','parl','parler','parlé'),('finir','完成','fin','finiss','finir','fini'),('vendre','出售','vend','vend','vendr','vendu')]
for id,zh,sing,pl,fut,pp in REG:
 pres=suffix(sing,forms('e,es,e,ons,ez,ent')) if id=='parler' else [sing+'s',sing+'s',sing,pl+'ons',pl+'ez',pl+'ent'] if id=='vendre' else [sing+'is',sing+'is',sing+'it',pl+'ons',pl+'ez',pl+'ent']
 ps=suffix('parl',forms('ai,as,a,âmes,âtes,èrent')) if id=='parler' else suffix(sing,forms('is,is,it,îmes,îtes,irent'))
 models.append({'id':id,'zh':zh,'family':'regular','participle':pp,'auxiliary':'avoir','futureStem':fut,'forms':{'present':pres,'imperfect':suffix(pl,forms('ais,ais,ait,ions,iez,aient')),'future':suffix(fut,forms('ai,as,a,ons,ez,ont')),'conditional':suffix(fut,forms('ais,ais,ait,ions,iez,aient')),'subjunctive':suffix(pl,forms('e,es,e,ions,iez,ent')),'simple-past':ps,'imperative':[None,pres[1][:-1] if id=='parler' else pres[1],None,pres[3],pres[4],None]}})
SPELL=[
 ('manger','吃','mange,manges,mange,mangeons,mangez,mangent','manger','mangé','mang','mangeais,mangeais,mangeait,mangions,mangiez,mangeaient','mangeai,mangeas,mangea,mangeâmes,mangeâtes,mangèrent'),
 ('commencer','开始','commence,commences,commence,commençons,commencez,commencent','commencer','commencé','commenc','commençais,commençais,commençait,commencions,commenciez,commençaient','commençai,commenças,commença,commençâmes,commençâtes,commencèrent'),
 ('acheter','买','achète,achètes,achète,achetons,achetez,achètent','achèter','acheté','achèt/achet',None,None),
 ('appeler','呼叫','appelle,appelles,appelle,appelons,appelez,appellent','appeller','appelé','appell/appel',None,None),
 ('jeter','扔','jette,jettes,jette,jetons,jetez,jettent','jetter','jeté','jett/jet',None,None),
 ('préférer','更喜欢','préfère,préfères,préfère,préférons,préférez,préfèrent','préférer','préféré','préfèr/préfér',None,None),
 ('payer','支付','paie,paies,paie,payons,payez,paient','paier','payé','pai/pay',None,None),
 ('envoyer','发送','envoie,envoies,envoie,envoyons,envoyez,envoient','enverr','envoyé','envoi/envoy',None,None),
]
for id,zh,present,future,pp,subj,imp,ps in SPELL:
 pres=forms(present);ss=subj.split('/');base=id[:-2]
 models.append({'id':id,'zh':zh,'family':'spelling','participle':pp,'auxiliary':'avoir','futureStem':future,'forms':{'present':pres,'imperfect':forms(imp) if imp else suffix(pres[3][:-3],forms('ais,ais,ait,ions,iez,aient')),'future':suffix(future,forms('ai,as,a,ons,ez,ont')),'conditional':suffix(future,forms('ais,ais,ait,ions,iez,aient')),'subjunctive':[ss[0]+'e',ss[0]+'es',ss[0]+'e',ss[-1]+'ions',ss[-1]+'iez',ss[0]+'ent'],'simple-past':forms(ps) if ps else suffix(base,forms('ai,as,a,âmes,âtes,èrent')),'imperative':[None,pres[1][:-1],None,pres[3],pres[4],None]}})

FAMILIES={
 'être':['être'],'avoir':['avoir'],'aller':['aller'],
 'faire':['faire','refaire','défaire','satisfaire'],
 'dire':['dire','redire'], 'dire-isez':['contredire','interdire','prédire','médire','dédire'],
 'maudire':['maudire'], 'prendre':['prendre','apprendre','comprendre','reprendre','surprendre','entreprendre','méprendre'],
 'venir':['venir','revenir','devenir','parvenir','intervenir','survenir','prévenir','convenir','provenir','subvenir','se souvenir'],
 'tenir':['tenir','retenir','maintenir','obtenir','soutenir','contenir','appartenir','entretenir','détenir','s’abstenir'],
 'recevoir':['recevoir','apercevoir','concevoir','décevoir','percevoir'],
 'voir':['voir','revoir','entrevoir'], 'prévoir':['prévoir'], 'pourvoir':['pourvoir','dépourvoir'],
 'mettre':['mettre','admettre','permettre','promettre','remettre','soumettre','transmettre','commettre'],
 'battre':['battre','abattre','combattre','débattre'], 'vivre':['vivre','survivre','revivre'],
 'suivre':['suivre','poursuivre'], 'lire':['lire','relire','élire'],
 'écrire':['écrire','décrire','inscrire','prescrire','transcrire'],
 'conduire':['conduire','produire','traduire','réduire','construire','détruire','instruire','introduire','déduire','séduire'],
 'connaître':['connaître','reconnaître','méconnaître'], 'paraître':['paraître','apparaître','disparaître','reparaître'],
 'naître':['naître','renaître'], 'croître':['croître','accroître','décroître'],
 'indre':['craindre','plaindre','peindre','éteindre','atteindre','feindre','joindre','rejoindre','oindre'],
 'résoudre':['résoudre'], 'absoudre':['absoudre','dissoudre'],
 'coudre':['coudre','recoudre','découdre'], 'moudre':['moudre','remoudre'],
 'vaincre':['vaincre','convaincre'], 'rompre':['rompre','interrompre','corrompre'],
 'conclure':['conclure'], 'inclure':['inclure'], 'exclure':['exclure'],
 'plaire':['plaire','déplaire','se complaire'], 'taire':['taire','se taire'], 'rire':['rire','sourire'],
 'suffire':['suffire','confire'], 'nuire':['nuire'],
 'partir':['partir','repartir','sortir','ressortir','dormir','endormir','servir','desservir','sentir','ressentir','mentir','démentir','se repentir'],
 'ouvrir':['ouvrir','rouvrir','couvrir','découvrir','recouvrir','offrir','souffrir'],
 'cueillir':['cueillir','accueillir','recueillir'], 'courir':['courir','parcourir','concourir','recourir','secourir'],
 'mourir':['mourir'], 'acquérir':['acquérir','conquérir','reconquérir','requérir','s’enquérir'],
 'fuir':['fuir','s’enfuir'], 'haïr':['haïr'], 'valoir':['valoir','équivaloir','prévaloir'],
 'asseoir':['asseoir','s’asseoir','rasseoir'], 'mouvoir':['mouvoir','émouvoir','promouvoir'],
 'vêtir':['vêtir','revêtir','dévêtir'], 'bouillir':['bouillir'],
 'impersonal':['falloir','pleuvoir'], 'pouvoir':['pouvoir'], 'vouloir':['vouloir'], 'devoir':['devoir'], 'savoir':['savoir'], 'boire':['boire'], 'croire':['croire'],
 'spelling':['manger','commencer','acheter','appeler','jeter','préférer','payer','envoyer','renvoyer'], 'regular':['parler','finir','vendre'],
}
WARN={
 'dire':'dire / redire 是 vous dites / redites；contredire / interdire / prédire / médire / dédire 是 -disez。maudire 的复数和虚拟式为 maudiss-。',
 'dire-isez':'不能把 vous dites 套用到此类：vous interdisez / contredisez / prédisez。',
 'partir':'repartir（再次出发）按 partir；répartir（分配）按 finir。ressortir 表示“再出去”按 sortir，表示“归属/涉及”时可为 ressortissons。',
 'venir':'这里用不及物 venir 的 être 形式。prévenir / subvenir 通常用 avoir；convenir 的助动词依含义与语体变化；se souvenir 用自反结构。不能把整族都当作 être。',
 'tenir':'词干交替 tiens / tenons / tiennent；将来时 tiendr-。s’abstenir 用自反结构，être。',
 'ouvrir':'现在时像 -er 动词，但过去分词为 ouvert / couvert / offert / souffert；将来时仍为 ouvrir- 等。',
 'croître':'crû 与 cru（croire）不同。派生词过去分词 accru / décru 不加帽子。传统拼写在 croîs、croît、croîtr- 保留帽子。',
 'paraître':'paraître 本表取 avoir；apparaître 在现代常用 être，disparaître 用 avoir。助动词不可机械复制。',
 'absoudre':'过去分词传统拼写 absous / absoute，dissous / dissoute；1990 改革拼写 absout / absoute、dissout / dissoute 也可。简单过去时及未完成虚拟式罕用，字典存在分歧，本表不生成。',
 'asseoir':'两套常用形式：assieds / asseyons / assiérai 与 assois / assoyons / assoirai；不要混成 assisez。',
 'valoir':'valoir / équivaloir 虚拟式常为 vaille / équivaille；prévaloir 为 prévale（nous prévalions），不能整族照搬。',
 'acquérir':'acquiers / acquérons / acquièrent；将来时 acquerr-，过去分词 acquis；派生词保持这些词干交替。',
 'mouvoir':'mouvoir 的分词 mû；阴性 mue，复数 mus / mues 去掉帽子。émouvoir → ému、promouvoir → promu。',
 'impersonal':'falloir 仅 il；pleuvoir 通常仅 il，在比喻“纷纷落下”时可用 ils pleuvent。— 表示不使用，不是待补。',
 'spelling':'payer 可用 paie / paye、paierai / payerai；préférer 将来时有 préférerai（传统）/ préfèrerai（改革）；envoyer / renvoyer 的将来词干特殊。',
 'inclure':'过去分词 inclus（阴性 incluse），不要与 exclu（阴性 exclue）、conclu 混淆。',
 'plaire':'plaire 分词 plu；se plaire 等形式通常不配合：elles se sont plu。',
}
AVOID=[
 ['frire','je fris / tu fris / il frit；过去分词 frit / frite','不生成缺损的复数现在时、未完成过去时或虚拟式；一般用 faire frire。'],
 ['clore / éclore','je clos / il clôt / ils closent；éclore → il éclôt；clos / close，éclos / éclose','多个时态/人称缺损或罕用；查词典，不能套 -re。'],
 ['traire / distraire / extraire / soustraire','trais / trait / trayons / traient；虚拟式 traie / trayions；trait / traite','将来 trair-；简单过去时通常不用，勿自造。'],
 ['luire / reluire','luis / luit / luisons / luisent；过去分词 lui','将来 luir-；常用复合时态，罕用叙事形式查词典。'],
 ['paître / repaître','pais / paît / paissons / paissent；repaître → repu','传统与现代辞书对缺损形式处理不同，阅读认知为主。'],
 ['gésir','gis / gît / gisons / gisent；未完成过去时 gisait','主要用于躺卧/安葬，不构造普通复合时态。'],
 ['choir / échoir / déchoir','chu / échu / déchu；échoit / écherrа（常见 échéance 相关）','旧式、缺损或多套词干；按具体词条核对。'],
 ['faillir / défaillir','failli / défailli；j’ai failli tomber','常见结构 faillir + 不定式；完整形式及语体按辞书。'],
 ['ouïr / quérir / férir / seoir / messeoir','ouï / quérir / sans coup férir / il sied','古旧、固定结构或缺损动词；不属于 A1–B1 生产性变位要求。'],
]
AVOID[6][1]='chu / échu / déchu；échoit / écherra（échéance 相关）'

# Materialize productive family members; suffix substitution alone is unsafe for
# prévenir, prévaloir, accrue accents, and reflexive verbs, so handle these explicitly.
DERIVE={
 'faire':['refaire','défaire','satisfaire'], 'dire':['redire'], 'contredire':['médire','dédire'],
 'prendre':['apprendre','comprendre','reprendre','surprendre','entreprendre'],
 'venir':['revenir','devenir','parvenir','intervenir','survenir','prévenir','convenir','provenir','subvenir'],
 'tenir':['retenir','maintenir','obtenir','soutenir','contenir','appartenir','entretenir','détenir'],
 'recevoir':['apercevoir','concevoir','décevoir','percevoir'],
 'voir':['revoir','entrevoir'], 'pourvoir':['dépourvoir'],
 'mettre':['admettre','permettre','promettre','remettre','soumettre','transmettre','commettre'],
 'battre':['abattre','combattre','débattre'], 'vivre':['survivre','revivre'], 'suivre':['poursuivre'],
 'lire':['relire','élire'], 'écrire':['décrire','inscrire','prescrire','transcrire'],
 'conduire':['produire','traduire','réduire','construire','détruire','instruire','introduire','déduire','séduire'],
 'connaître':['reconnaître','méconnaître'], 'paraître':['apparaître','disparaître','reparaître'],
 'naître':['renaître'], 'croître':['accroître','décroître'],
 'craindre':['plaindre'], 'peindre':['éteindre','atteindre','feindre'], 'joindre':['rejoindre','oindre'],
 'coudre':['recoudre','découdre'], 'moudre':['remoudre'], 'vaincre':['convaincre'],
 'rompre':['interrompre','corrompre'], 'plaire':['déplaire'], 'rire':['sourire'],
 'suffire':['confire'], 'partir':['repartir'], 'sortir':['ressortir'], 'dormir':['endormir'],
 'servir':['desservir'], 'sentir':['ressentir'], 'mentir':['démentir'], 'ouvrir':['rouvrir'],
 'couvrir':['découvrir','recouvrir'], 'cueillir':['accueillir','recueillir'],
 'courir':['parcourir','concourir','recourir','secourir'],
 'acquérir':['conquérir','reconquérir','requérir'], 'valoir':['équivaloir','prévaloir'],
 'asseoir':['rasseoir'], 'émouvoir':['promouvoir'], 'vêtir':['revêtir','dévêtir'], 'envoyer':['renvoyer'],
}
COMMON_ZH={'comprendre':'理解','apprendre':'学习','prévenir':'告知、预防','devenir':'成为','revenir':'回来','obtenir':'获得','maintenir':'维持','permettre':'允许','promettre':'承诺','traduire':'翻译','construire':'建造','détruire':'摧毁','décrire':'描述','écrire':'写','apparaître':'出现','disparaître':'消失','prévaloir':'占优势','accueillir':'接待','repartir':'再次出发','interrompre':'打断','sourire':'微笑'}
SPECIAL_SUFFIX={('contredire','médire'):('contredir','médi'),('contredire','dédire'):('contredir','dédi')}
for base,words in DERIVE.items():
 original=next(m for m in models if m['id']==base)
 for word in words:
  if any(m['id']==word for m in models):continue
  if word.endswith(base):oldbase,newbase='',word[:-len(base)]
  else:
   oldbase=base[:-2];newbase=word[:-2]
   # Models which share a suffix rather than a full infinitive.
   for suffix0 in ['cevoir','uire','crire','indre','quérir','fire','mouvoir','dire']:
    if base.endswith(suffix0) and word.endswith(suffix0):oldbase=base[:-len(suffix0)];newbase=word[:-len(suffix0)];break
  def trans(value):
   if value is None:return None
   if oldbase and not value.startswith(oldbase):raise ValueError((base,word,value,oldbase))
   return newbase+value[len(oldbase):]
  clone={**original,'id':word,'zh':COMMON_ZH.get(word,'同族动词'),'derived':True,'participle':trans(original['participle']),'futureStem':trans(original['futureStem']),'forms':{tense:[trans(x) for x in rows] for tense,rows in original['forms'].items()}}
  if word in ['prévenir','subvenir']:clone['auxiliary']='avoir'
  if word=='convenir':clone['auxiliary']='avoir'
  if word in ['endormir','desservir']:clone['auxiliary']='avoir'
  if word=='apparaître':clone['auxiliary']='être'
  if word=='disparaître':clone['auxiliary']='avoir'
  if word in ['accroître','décroître']:
   clone['participle']=clone['participle'].replace('û','u')
   clone['forms']['simple-past']=[x.replace('û','u') if i not in [3,4] else x for i,x in enumerate(clone['forms']['simple-past'])]
  if word=='prévaloir':clone['forms']['subjunctive']=suffix('préval',forms('e,es,e,ions,iez,ent'))
  if word=='confire':clone['participle']='confit'
  models.append(clone)

# Reflexive forms are distinct entries, with pronouns and agreement caveats.
REFLEX=[('asseoir','s’asseoir','坐下'),('tenir','s’abstenir','克制'),('venir','se souvenir','记得'),('taire','se taire','保持沉默'),('partir','se repentir','后悔'),('fuir','s’enfuir','逃走'),('acquérir','s’enquérir','询问'),('plaire','se complaire','沉溺')]
refsmodels=[]
for base,word,zh in REFLEX:
 source=next(m for m in models if m['id']==base)
 # Translate lexical stem before attaching the reflexive pronoun.
 old,new=('', '')
 if word=='s’abstenir':old,new='','abs'
 if word=='se souvenir':old,new='','sou'
 if word=='se repentir':old,new='par','repen'
 if word=='s’enquérir':old,new='ac','en'
 if word=='s’enfuir':old,new='','en'
 if word=='se complaire':old,new='','com'
 def tr(x):return new+x[len(old):] if x else None
 refsmodels.append({**source,'id':word,'zh':zh,'reflexive':True,'participle':tr(source['participle']),'futureStem':tr(source['futureStem']),'auxiliary':'être','forms':{k:[tr(x) for x in v] for k,v in source['forms'].items()}})

auxforms={v['id']:v['forms'] for v in models if v['id'] in ['avoir','être']}
for m in models:
 m['familyWords']=FAMILIES.get(m['family'],[m['id']]);m['note']=WARN.get(m['family'],'按此词干模式变化；本表助动词为该词通常用法，具体含义与前置宾语配合仍需核对。')
 pp=m['participle']
 if m['auxiliary']=='être':parts=[pp+'(e)',pp+'(e)',pp+'(e)',pp+'(e)s',pp+'(e)(s)',pp+'(e)s']
 else:parts=[pp]*6
 for name,aux_tense in [('compound-past','present'),('pluperfect','imperfect'),('future-perfect','future'),('conditional-past','conditional'),('subjunctive-past','subjunctive')]:
  m['forms'][name]=[auxforms[m['auxiliary']][aux_tense][i]+' '+parts[i] if m['id'] not in ['falloir','pleuvoir'] or i==2 else None for i in range(6)]
 for name,bridge in [('near-future','aller'),('recent-past','venir'),('ongoing','être')]:
  literal=m['id'].replace(' (variante)','')
  join=' de ' if name=='recent-past' else ' en train de ' if name=='ongoing' else ' '
  if name in ['recent-past','ongoing'] and literal[0] in 'aeiouyéèêâîôûù':join=join[:-3]+'d’'
  m['forms'][name]=[(auxforms['être']['present'][i] if bridge=='être' else next(v for v in models if v['id']==bridge)['forms']['present'][i])+join+literal if m['id'] not in ['falloir','pleuvoir'] or i==2 else None for i in range(6)]

for m in refsmodels:
 m['familyWords']=[m['id']];m['note']='代词式动词复合时态用 être；性数配合须判断自反代词。se plaire / se complaire 的 plu 通常不配合。'
 pron=['me','te','se','nous','vous','se']
 for k,rows in m['forms'].items():
  if k=='imperative':m['forms'][k]=[None,rows[1]+'-toi',None,rows[3]+'-nous',rows[4]+'-vous',None];continue
  m['forms'][k]=[(pron[i][0]+'’'+x if pron[i] in ['me','te','se'] and x and x[0] in 'aeiouéèêâ' else pron[i]+' '+x) if x else None for i,x in enumerate(rows)]
 pp=m['participle'];parts=[pp+'(e)',pp+'(e)',pp+'(e)',pp+'(e)s',pp+'(e)(s)',pp+'(e)s'] if m['id']!='se complaire' else [pp]*6
 for name,aux_tense in [('compound-past','present'),('pluperfect','imperfect'),('future-perfect','future'),('conditional-past','conditional'),('subjunctive-past','subjunctive')]:
  rows=[]
  for i,x in enumerate(auxforms['être'][aux_tense]):rows.append((pron[i][0]+'’'+x if pron[i] in ['me','te','se'] and x[0] in 'aeiouéèêâ' else pron[i]+' '+x)+' '+parts[i])
  m['forms'][name]=rows
 for name,bridge in [('near-future','aller'),('recent-past','venir'),('ongoing','être')]:
  base=m['id'][2:] if m['id'].startswith('s’') else m['id'][3:]
  join=' de ' if name=='recent-past' else ' en train de ' if name=='ongoing' else ' '
  inf=[x[0]+'’'+base if x in ['me','te','se'] and base[0] in 'aeiouéèêâ' else x+' '+base for x in pron]
  m['forms'][name]=[next(v for v in models if v['id']==bridge)['forms']['present'][i]+join+inf[i] for i in range(6)]
 models.append(m)

rules={
 'present':('现在时：按动词组选择词干与词尾','第一组（aller 除外）去 -er；第二组 -ir 在复数加入 -iss-；第三组必须按具体变位模型。',[['parler','-e, -es, -e, -ons, -ez, -ent'],['finir','-is, -is, -it, -issons, -issez, -issent'],['vendre 模式','-s, -s, 无词尾, -ons, -ez, -ent']]),
 'imperfect':('未完成过去时：nous 现在时去 -ons + 统一词尾','être 使用 ét-。falloir 是 il fallait，pleuvoir 是 il pleuvait。即使现在时不规则，多数动词在这里也直接按 nous 词干变化。',[['六个人称词尾','-ais, -ais, -ait, -ions, -iez, -aient'],['拼写','mangeais / mangions；commençais / commencions；étudiions / étudiiez；voyions / voyiez']]),
 'future':('简单将来时：将来词干 + 统一词尾','通常保留 -er / -ir 不定式，-re 动词去末尾 e；特殊词干按模型表。',[['六个人称词尾','-ai, -as, -a, -ons, -ez, -ont'],['拼写','achèter- / appeller- / jetter-；paier- 或 payer-；préférer- 或 préfèrer-']]),
 'conditional':('条件式现在时：将来词干 + 未完成过去时词尾','词干完全复用简单将来时，包括 ir-、aur-、ser-、courr-、acquerr-；区别只在词尾。',[['六个人称词尾','-ais, -ais, -ait, -ions, -iez, -aient'],['对比','je serai（将来）/ je serais（条件式）']]),
 'subjunctive':('虚拟式现在时：分清单数/ils 与 nous/vous 两套词干','一般 je/tu/il/ils 用 ils 现在时去 -ent 的词干；nous/vous 用 nous 现在时去 -ons 的词干。être、avoir、faire、pouvoir、savoir、aller、vouloir、valoir、falloir 需单记。',[['一般词尾','-e, -es, -e, -ions, -iez, -ent'],['双词干','vienne / venions；boive / buvions；prenne / prenions；voie / voyions'],['完全特殊','sois / soyons；aie / ayons；fasse / fassions；puisse / puissions；sache / sachions']]),
 'simple-past':('简单过去时：按 -a、-i、-u、-in 四套模式','-er 动词用 -a 类；多数 -ir 和不少 -re 用 -i 类；avoir / être 等用 -u 类；venir / tenir 用 -in 类。过去分词并非可靠的简单过去时词干。',[['-a','-ai, -as, -a, -âmes, -âtes, -èrent'],['-i','-is, -is, -it, -îmes, -îtes, -irent'],['-u','-us, -us, -ut, -ûmes, -ûtes, -urent'],['-in','-ins, -ins, -int, -înmes, -întes, -inrent']]),
 'imperative':('命令式：仅 tu、nous、vous，无主语','一般取现在时对应形式；第一组及 ouvrir / offrir / cueillir 的 tu 去 -s；aller 为 va。être / avoir / savoir / vouloir 特殊，pouvoir 没有普通命令式。',[['规则','parle / parlons / parlez；finis / finissons / finissez；vends / vendons / vendez'],['完全特殊','sois / soyons / soyez；aie / ayons / ayez；sache / sachons / sachez；veuille / veuillons / veuillez'],['恢复 s','vas-y、manges-en；va en acheter（en 是介词，仍无 s）']]),
 'compound-past':('复合过去时：助动词现在时 + 过去分词','先选 avoir / être，再变助动词；原动词不再加现在时词尾。过去分词的规则、不规则和性数配合单独查表。',[['规则过去分词','parler → parlé；finir → fini；vendre → vendu'],['配合','elle est partie；les lettres que j’ai écrites；elle s’est lavé les mains']]),
 'pluperfect':('愈过去时：助动词未完成过去时 + 过去分词','与复合过去时复用全部过去分词和助动词选择；仅把 ai / suis 换成 avais / étais。',[['avoir','avais, avais, avait, avions, aviez, avaient'],['être','étais, étais, était, étions, étiez, étaient']]),
 'future-perfect':('先将来时：助动词简单将来时 + 过去分词','只变助动词；过去分词与复合过去时相同，配合规则也相同。',[['avoir','aurai, auras, aura, aurons, aurez, auront'],['être','serai, seras, sera, serons, serez, seront']]),
 'conditional-past':('条件式过去时：助动词条件式现在时 + 过去分词','不规则部分是 avoir / être 的条件式和原动词过去分词；不存在额外一套条件式过去时词尾。',[['avoir','aurais, aurais, aurait, aurions, auriez, auraient'],['être','serais, serais, serait, serions, seriez, seraient']]),
 'subjunctive-past':('虚拟式过去时：助动词虚拟式现在时 + 过去分词','保留 que / qu’ 从句结构；过去分词的助动词选择和配合沿用复合过去时。',[['avoir','aie, aies, ait, ayons, ayez, aient'],['être','sois, sois, soit, soyons, soyez, soient']]),
 'near-future':('最近将来时：aller 现在时 + 不定式','后面的原动词保持不定式，不加将来时词尾；复杂程度只在 aller 的六个人称。',[['aller','vais, vas, va, allons, allez, vont'],['例子','je vais parler / finir / prendre / être；代词：je vais le faire']]),
 'recent-past':('最近过去时：venir 现在时 + de/d’ + 不定式','原动词不变；de 遇元音/哑音 h 为 d’。过去参照可用 venais de。',[['venir','viens, viens, vient, venons, venez, viennent'],['例子','je viens de parler；je viens d’arriver']]),
 'ongoing':('现在进行时：être + en train de/d’ + 不定式','原动词不变；être 按人称与参照时间变化。不存在独立的 -ing 型法语时态词尾。',[['être 现在时','suis, es, est, sommes, êtes, sont'],['过去参照','j’étais en train de lire；现在：je suis en train de lire']]),
}
supplements={}
for id,(title,explanation,rows) in rules.items():
 blocks=[p(explanation),table(['项目','规则 / 形式'],rows)]
 regs=[m for m in models if m['family']=='regular']
 # Compact full six-person table for all three regular reference models.
 blocks.append(table(['人称']+[m['id'] for m in regs],[[person]+[m['forms'][id][i] or '—' for m in regs] for i,person in enumerate(P)]))
 if id in ['compound-past','pluperfect','future-perfect','conditional-past','subjunctive-past']:
  blocks.append(p('être 形式的 (e)/(s) 由主语决定；avoir 仅直接宾语前置时通常配合。代词式动词需先判断自反代词的功能。近似“移动”的动词不都用 être；带直接宾语的 sortir / monter / descendre / rentrer / passer 等通常用 avoir。'))
 supplements[id]=[{'title':'构成与规则变位 全人称','blocks':blocks}]

spelling=[['-ger','manger','nous mangeons；mangeais / mangions；mangeai / mangèrent'],['-cer','commencer','nous commençons；commençais / commencions'],['-yer','payer / nettoyer / envoyer','paie/paye；nettoie；envoyer 将来 enverr-'],['-e- → -è-','acheter / lever / mener / peser','achète / achetons；将来 achèter-'],['-é- → -è-','préférer / espérer / céder','préfère / préférons；将来 préférer- 或 préfèrer-'],['-eler / -eter','appeler / jeter / geler / acheter','appelle / jette；但 gèle / achète；改革多数 -eler/-eter 可用 è，appeler/jeter 家族保留双辅音'],['双 i / y+i','étudier / crier / voir / envoyer','étudiions、criions、voyions、envoyions 都正确'],['分音符','haïr','je hais / il hait；nous haïssons；haïssais；haïmes（分音符保留）']]
supplements['present'].append({'title':'规则动词的拼写变化 不是额外的人称词尾','blocks':[table(['类型','例词','规则'],spelling)]})
supplements['imperfect'].append({'title':'不规则与特殊拼写 如何迁移','blocks':[table(['动词','词干来源','结果'],[['être','ét-','étais / étions'],['faire','nous faisons','faisais / faisions'],['boire','nous buvons','buvais / buvions'],['prendre','nous prenons','prenais / prenions'],['étudier','nous étudions','étudiions / étudiiez'],['voir','nous voyons','voyions / voyiez'],['falloir / pleuvoir','无人称形式','il fallait / il pleuvait']]),p('其余常用不规则动词在本时态一般没有新的词干例外。完整表可在下方按动词查询；缺损动词不硬套此规则。')]})
for id in ['future','conditional']:
 supplements[id].append({'title':'特殊词干完整索引 含派生词差异','blocks':[table(['动词','将来/条件式词干','派生词或例外'],[[m['id'],m['futureStem']+'-',m['note'] if m['family'] in ['voir','prévoir','pourvoir','cueillir','courir','acquérir','asseoir','valoir','spelling'] else '、'.join(m['familyWords'])] for m in models if m['family']!='regular' and (m['futureStem']!=m['id'] and m['futureStem']!=m['id'][:-1])])]})
for id in ['compound-past','pluperfect','future-perfect','conditional-past','subjunctive-past']:
 supplements[id].append({'title':'不规则过去分词与同族动词索引','blocks':[table(['不定式','过去分词','助动词（本词的通常用法）'],[[m['id'],m['participle'],m['auxiliary']] for m in models if m['family'] not in ['regular','spelling']]),p('同族动词多复用过去分词词干，但有例外：prendre → pris，comprendre → compris；inclure → inclus、exclure → exclu；résoudre → résolu，dissoudre → dissous / dissoute；croire → cru，croître → crû；mouvoir → mû / mue / mus / mues。助动词请依具体动词含义判断。')]})
supplements['subjunctive'].append({'title':'所有常见特殊模型与双词干','blocks':[table(['模型','je/tu/il/ils 词干','nous/vous 词干'],[['être','sois / sois / soit / soient','soyons / soyez'],['avoir','aie / aies / ait / aient','ayons / ayez'],['faire','fass-','fass-'],['pouvoir','puiss-','puiss-'],['savoir','sach-','sach-'],['aller','aill-','all-'],['vouloir','veuill-','voul-'],['valoir','vaill-','val-'],['falloir','il faille','—'],['venir / tenir','vienn- / tienn-','ven- / ten-'],['prendre','prenn-','pren-'],['boire','boiv-','buv-'],['devoir','doiv-','dev-'],['recevoir','reçoiv-','recev-'],['voir / croire / fuir','voi- / croi- / fui-','voy- / croy- / fuy-'],['mourir','meur-','mour-'],['acquérir','acquièr-','acquér-'],['asseoir','assey- 或 assoi-','assey- 或 assoy-'],['émouvoir / mouvoir','émeuv- / meuv-','émouv- / mouv-']]),p('prévaloir → prévale / prévalions，是 valoir 家族的例外。多数其余第三组只需在 ils 和 nous 词干上加统一词尾，无额外“虚拟式专用词尾”。')]})
supplements['imperative'].append({'title':'不规则命令式与代词位置','blocks':[table(['动词','tu','nous','vous'],[[m['id']]+[m['forms']['imperative'][i] or '—' for i in [1,3,4]] for m in models if m['family'] not in ['regular','spelling']]),p('vouloir 的命令式常用 veuillez（礼貌要求），veuille / veuillons 较少用。pouvoir、falloir、通常的 pleuvoir 没有命令式，— 不是缺漏。肯定：donne-le-moi；否定：ne me le donne pas。')]})
supplements['nonfinite']=[{'title':'不定式 现在式与过去式构成','blocks':[p('现在不定式即词典原形，无人称变位；过去不定式 = avoir / être 的不定式 + 过去分词。规则：avoir parlé / fini / vendu；不规则：avoir fait / pris / écrit；être allé(e)(s)。'),table(['模型','现在分词/副动词','构成'],[['parler','parlant / en parlant','nous parlons 去 -ons 加 -ant'],['finir','finissant / en finissant','nous finissons 去 -ons 加 -ant'],['vendre','vendant / en vendant','nous vendons 去 -ons 加 -ant'],['faire / boire / prendre','faisant / buvant / prenant','继承 nous 词干'],['être / avoir / savoir','étant / ayant / sachant','三项必须单记']]),p('现在分词不作性数变化；形容词化形式作配合，并可能有不同拼写：en communiquant / communicant，en fatiguant / fatigant，en provoquant / provocant。副动词用 en + 现在分词；过去副动词（拓展）用 en ayant / en étant + 过去分词。')]}]
supplements['nonfinite'][0]['blocks'].append(table(['不规则动词','现在分词 / 副动词','过去不定式'],[[m['id'],('étant' if m['id']=='être' else 'ayant' if m['id']=='avoir' else 'sachant' if m['id']=='savoir' else 'fallant' if m['id']=='falloir' else 'pleuvant' if m['id']=='pleuvoir' else m['forms']['present'][3][:-3]+'ant'),m['auxiliary']+' '+m['participle']] for m in models if m['family'] not in ['regular','spelling']]))
supplements['passive']=[{'title':'被动式构成 与每个时态的助动词','blocks':[p('不是新词尾体系：把 être 变成对应时态 + 原动词过去分词。规则与不规则过去分词都与被动句主语配合；例如 écrire → la lettre est écrite，prendre → les décisions sont prises。'),table(['时态','规则例句','不规则例句'],[['现在时','La règle est expliquée.','La lettre est écrite.'],['复合过去时','La règle a été expliquée.','La lettre a été écrite.'],['未完成过去时','La règle était expliquée.','La lettre était écrite.'],['愈过去时','La règle avait été expliquée.','La lettre avait été écrite.'],['简单将来时','La règle sera expliquée.','La lettre sera écrite.'],['条件式现在时','La règle serait expliquée.','La lettre serait écrite.'],['虚拟式现在时','…que la règle soit expliquée.','…que la lettre soit écrite.']])]}]

refs=[{'label':'OQLF 规则与不规则分类','url':'https://vitrinelinguistique.oqlf.gouv.qc.ca/24654/la-grammaire/le-verbe/conjugaison/verbes-reguliers-et-irreguliers'},{'label':'OQLF 虚拟式形式','url':'https://vitrinelinguistique.oqlf.gouv.qc.ca/24237/la-grammaire/le-verbe/conjugaison/formes-du-subjonctif'},{'label':'OQLF 将来时形式','url':'https://vitrinelinguistique.oqlf.gouv.qc.ca/24655/la-grammaire/le-verbe/conjugaison/formes-du-futur-simple'},{'label':'Académie 缺损动词 frire','url':'https://www.dictionnaire-academie.fr/article/A9F1701'}]
TARGET.write_text(json.dumps({'version':1,'scope':'A1–B1 及常见现代法语变位模型；罕用、古旧、缺损词另列，未伪造缺失形式。','persons':P,'models':models,'supplements':supplements,'defective':AVOID,'references':refs},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Generated {len(models)} models, {len(supplements)} topic expansions, {len(set(w for m in models for w in m["familyWords"]))} family entries')
