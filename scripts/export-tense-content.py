"""Convert the reviewed local tense manuscript into structured learning content."""
import importlib
import json
import re
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(root / '.netlify/tense-summary'))
modules = [importlib.import_module(name) for name in ['part2a', 'part2b', 'part2c', 'part2d', 'part3', 'part4']]
meta = [
 (5,'present','现在时','Le présent','A1','now','表达现在的事实、习惯与持续状态。'),
 (6,'near-future','最近将来时','Le futur proche','A1','future','用 aller + 不定式表达计划或有迹象的将来。'),
 (7,'recent-past','最近过去时','Le passé récent','A1','past','用 venir de + 不定式表达刚发生的动作。'),
 (8,'ongoing','现在进行时','Être en train de','A2','now','把注意力放在动作正在进行的过程中。'),
 (9,'imperative','命令式','L’impératif','A1','now','给出指示、建议与禁止。'),
 (10,'compound-past','复合过去时','Le passé composé','A1','past','把过去动作看作有边界的完整事件。'),
 (11,'imperfect','未完成过去时','L’imparfait','A2','past','描述过去的背景、习惯与正在进行的动作。'),
 (12,'past-contrast','过去时辨析','Passé composé ou imparfait','A2','synthesis','从叙述视角理解事件与背景的分工。'),
 (13,'pluperfect','愈过去时','Le plus-que-parfait','B1','past','表达先于另一个过去参照点的动作。'),
 (14,'simple-past','简单过去时','Le passé simple','拓展','extension','认识文学与历史叙事中的完成事件形式。'),
 (15,'future','简单将来时','Le futur simple','A2','future','表达将来的事实、预测与承诺。'),
 (16,'future-perfect','先将来时','Le futur antérieur','拓展','extension','表示在将来某个参照点之前已经完成。'),
 (17,'conditional','条件式现在时','Le conditionnel présent','A2','mood','礼貌请求、愿望、建议与假设结果。'),
 (18,'conditional-past','条件式过去时','Le conditionnel passé','B1','mood','表达过去未实现的结果或未经证实的信息。'),
 (19,'subjunctive','虚拟式现在时','Le subjonctif présent','A2','mood','在从句中表达意愿、情感、必要性等视角。'),
 (20,'subjunctive-past','虚拟式过去时','Le subjonctif passé','拓展','extension','在虚拟式从句中表达先已完成的动作。'),
 (21,'nonfinite','不定式与副动词','Infinitif et gérondif','A2','extension','表达动作之间的同时、方式与先后关系。'),
 (22,'reported','间接引语与时态配合','Le discours rapporté','B1','synthesis','转述时调整人称、时间参照与时态。'),
 (23,'hypothesis','假设句','La condition et l’hypothèse','B1','synthesis','根据真实条件或假设选择 si 两侧的时态。'),
 (24,'time-relations','时间关系与连词','Les relations temporelles','B1','synthesis','用连词表达动作的先后与同时。'),
 (25,'time-markers','时间标志词','Les indicateurs de temps','A2','synthesis','结合动作视角理解 depuis、pendant、en 等表达。'),
]
chapters = {}
chapter = None
for module in modules[:5]:
 for block in module.BLOCKS:
  if block['t']=='h1':
   chapter=block['x'];chapters[chapter]=[]
  elif chapter:
   chapters[chapter].append(block)
blocks = list(chapters.values())[:21]
topics=[]
for (n,id,zh,fr,level,group,description),content in zip(meta,blocks):
 sections=[]
 for block in content:
  if block['t']=='h2':
   sections.append({'title':re.sub(r'^\d+\.\d+\s*','',block['x']),'blocks':[]})
  else:
   if not sections:sections.append({'title':'理解与运用','blocks':[]})
   sections[-1]['blocks'].append(block)
 # Correct oversimplifications from the manuscript for the interactive version.
 text=json.dumps(sections,ensure_ascii=False)
 text=text.replace('两条轴的时态不能随意混用','两种叙述方式有不同的习惯用法，但可以因视角变化而组合')
 text=text.replace('全法语只有 être 一个例外','常用动词中 être 的词干为 ét-；falloir 用 il fallait')
 text=text.replace('语式（mode）','语式或动词形式')
 text=text.replace('（全法语只有 être 一个例外：ét-）','（être 的词干为 ét-；无人称 falloir 为 il fallait）')
 text=text.replace('「✗ Quand tu finiras」→「✓ Quand tu auras fini」','Quand tu finiras 表示结束这一事件；Quand tu auras fini 明确表示先已完成')
 text=text.replace('**第三组 -re（及不规则）**','**以 vendre 为模式的部分第三组动词**')
 text=text.replace('第三组 -re（及不规则）','第三组 vendre 模式')
 text=text.replace('第三组 -re','部分 -re 动词')
 text=text.replace('**主句是过去时** → 从句时态整体「后移一步」','**主句是过去时** → 采用过去参照转述时，从句时态常「后移一步」')
 text=text.replace('**主句是现在时 / 将来时** → 从句按自己的时间自由选择','**主句是现在时 / 将来时** → 在结构与语气允许的范围内，从句按相对时间选择')
 text=text.replace('两条轴的时态不能随意混用（日常写作不用简单过去时，文学作品也少见复合过去时）','两种叙述方式有不同习惯；日常口语以复合过去时为主，文学叙事常用简单过去时')
 sections=json.loads(text)
 if id=='near-future':
  # Temporal distance alone does not distinguish these two future expressions.
  for section in sections:
   for block in section['blocks']:
    if block['t']=='table' and block['headers'][0]=='对比项':
     block['rows']=[['与现在的联系','与当前计划、意图或迹象联系紧密','把事情放在将来参照下陈述'],['语体','口语中常见，也用于书面','口语与书面都可使用'],['同一时间','Je vais partir demain.','Je partirai demain.']]
 if id=='near-future':
  sections[0]['blocks'].insert(0,{'t':'note','title':'视角','x':'最近将来时与现在的计划或迹象联系紧密，并不只用于时间很近的事情；简单将来时也可表示马上发生的事。时间距离不是唯一标准。'})
 if id=='compound-past':
  sections.append({'title':'助动词与代词式动词的补充','blocks':[{'t':'p','x':'monter、descendre、sortir、rentrer、passer 等动词表示不及物移动时常用 être，带直接宾语时用 avoir：Elle est sortie. / Elle a sorti son téléphone. 代词式动词要先辨认直接宾语：Elle s’est lavée. / Elle s’est lavé les mains.（les mains 在动词后，不配合）Elles se sont parlé.（se 为间接宾语，不配合）'}]})
 if id=='subjunctive':
  sections.append({'title':'虚拟式并不等于不真实','blocks':[{'t':'p','x':'Je suis heureux que tu sois là. 中“你在这里”可以是事实。虚拟式体现主句对从句的态度，并不是把事实否定。条件式在现代语法中也常归入直陈式的时态；此处按学习用途单独整理。'}]})
 if id=='nonfinite':
  sections.append({'title':'现在分词的特殊形式','blocks':[{'t':'p','x':'être → étant，avoir → ayant，savoir → sachant。现在分词表示动作并且不随名词性数变化；形容词化的词如 intéressante 则需要配合。副动词通常与主句动作共用主语。'}]})
 if id=='reported':
  sections.append({'title':'时态配合有语境','blocks':[{'t':'p','x':'过去时引导的转述常采用时态后移；若内容仍然成立或是普遍真理，直陈式现在时可以保留。昨天/明天是否改成前一天/第二天，也取决于实际转述日期，并非机械替换。'}]})
 topics.append({'id':id,'zh':zh,'fr':fr,'level':level,'group':group,'description':description,'chapter':n,'sections':sections})
topics.append({'id':'passive','zh':'被动式与时态','fr':'Le passif','level':'A2','group':'extension','description':'保持时间参照，用 être + 过去分词转换叙述焦点。','sections':[
 {'title':'怎么构成','blocks':[{'t':'p','x':'把主动句的直接宾语变成被动句主语，être 采用原主动句的时态，过去分词与新主语配合。动作施事常由 par 引出，也可省略。仅有可被动化的及物动词适用。'},{'t':'fr','f':'Le professeur explique la règle. → La règle est expliquée par le professeur.','z':'老师讲解规则。→ 规则由老师讲解。'}]},
 {'title':'保持原来的时间','blocks':[{'t':'table','headers':['时态','被动形式'], 'rows':[['现在时','La règle est expliquée.'],['复合过去时','La règle a été expliquée.'],['未完成过去时','La règle était expliquée.'],['简单将来时','La règle sera expliquée.']]}, {'t':'note','title':'状态与动作','x':'La porte est fermée 可以描述“门关着”的状态。若强调关门动作，可明确时间或施事：La porte a été fermée par Paul.'}]},
]})
groups=[{'id':id,'label':label} for id,label in [('now','现在与日常表达'),('past','过去的叙述'),('future','将来与计划'),('mood','条件与主观表达'),('synthesis','综合运用'),('extension','补充学习')]]
links={'compound-past':['g01'],'imperfect':['g01'],'past-contrast':['g01'],'pluperfect':['g03','g16'],'conditional':['g07','g30'],'conditional-past':['g30'],'subjunctive':['g05','g06','g11','g22'],'future':['g34'],'near-future':['g34'],'hypothesis':['g25'],'reported':['g28','g33'],'time-relations':['g27'],'time-markers':['g02','g17','g31','g35'],'nonfinite':['g21'],'passive':['g13']}
bank=json.loads((root/'website/src/grammar-preview/bank.json').read_text(encoding='utf-8'))
for t in topics:t['links']=[x['id'] for x in bank['topics'] if any(x['id'].endswith(s) for s in links.get(t['id'],[]))]
# Convert the six complete conjugation tables from the reviewed appendix.
verbs=[];name=None
for block in modules[-1].BLOCKS:
 if block['t']=='h3':name=block['x'].split(' ')[0]
 if name and block['t']=='table' and len(block['headers'])==7:
  keys=['present','compound-past','imperfect','future','conditional','subjunctive']
  verbs.append({'id':name,'zh':block['headers'][0], 'forms':{key:[row[i+1] for row in block['rows']] for i,key in enumerate(keys)}})
labels={'être':'是','avoir':'有','aller':'去','faire':'做','pouvoir':'能','venir':'来'}
for v in verbs:v['zh']=labels[v['id']]
target=root/'website/src/grammar-preview/tense-bank.json'
target.write_text(json.dumps({'groups':groups,'topics':topics,'verbs':verbs,'source':'法语时态系统总结 A1–B1','references':[{'label':'OQLF 时间连词与语气','url':'https://vitrinelinguistique.oqlf.gouv.qc.ca/21132/la-grammaire/le-verbe/modes/concordance-des-temps/mode-verbal-avec-apres-que-et-avant-que'},{'label':'OQLF 代词式动词与配合','url':'https://vitrinelinguistique.oqlf.gouv.qc.ca/22954/la-grammaire/le-verbe/verbes-pronominaux/verbe-pronominal-de-sens-reflechi'}]},ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Exported {len(topics)} topics and {len(verbs)} verb tables')
