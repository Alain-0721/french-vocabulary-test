// 语法空间的三份数据（课本语法、时态、变位）只在第一次进入语法空间时加载。
// 同一节只加载一次；加载失败不缓存，下次进入可以重试。
let cached = null;
let resolved = null;
export function loadGrammarData() {
  if (!cached) {
    cached = Promise.all([
      import('./bank.json', {with: {type: 'json'}}).then(m => m.default),
      import('./tense-bank.json', {with: {type: 'json'}}).then(m => m.default),
      import('./conjugation-bank.json', {with: {type: 'json'}}).then(m => m.default),
    ]).then(([bank, tenseBank, conjugationBank]) => {
      resolved = {bank, tenseBank, conjugationBank};
      return resolved;
    }).catch(error => { cached = null; throw error; });
  }
  return cached;
}
export function getGrammarData() {
  return resolved;
}
