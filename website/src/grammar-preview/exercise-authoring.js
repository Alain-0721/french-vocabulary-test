import bank from './bank.json' with {type:'json'};
// Each row is an individually authored prompt, translation, answer, two
// distractors and explanation. Rotation balances answer positions, not content.
export function topicQuestions(number,rows){
 const topic=bank.topics[number-1];
 if(!topic)throw Error('Unknown grammar topic '+number);
 return rows.map(([prompt,zh,answer,wrong1,wrong2,explanation],i)=>{
  const correct=(number+i)%3,options=[wrong1,wrong2];options.splice(correct,0,answer);
  return {id:`grammar-${String(number).padStart(2,'0')}-${i+1}`,topic:topic.id,prompt,zh,options,correct,explanation};
 });
}
