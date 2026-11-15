// 内置课本只保留描述信息；词库按需加载，不再随首屏一起打包。
// 词库版本：随 FranLumi 版本一起升级；旧版已保存的词库在打开课本时重新校验。
export const BANK_VERSION = '2.1.7';
export const SHIPPED_BOOK_IDS = ['edito-b1', 'inspire-a1', 'edito-a2-2022', 'edito-a1-2022'];

const demoBank = [
  {id:'DEMO-P1-01',fr:'bonjour',zh:'你好',ipa:'/bɔ̃ʒuʁ/',unite:1,partie:1,group:'Les premiers mots',partie_title:'Les premiers mots'},
  {id:'DEMO-P1-02',fr:'merci',zh:'谢谢',ipa:'/mɛʁsi/',unite:1,partie:1,group:'Les premiers mots',partie_title:'Les premiers mots'},
  {id:'DEMO-P1-03',fr:'à bientôt',zh:'回头见',ipa:'/a bjɛ̃to/',unite:1,partie:1,group:'Les premiers mots',partie_title:'Les premiers mots'},
  {id:'DEMO-P2-01',fr:'un livre',zh:'一本书',ipa:'/œ̃ livʁ/',unite:1,partie:2,group:'Les objets du quotidien',partie_title:'Les objets du quotidien'},
  {id:'DEMO-P2-02',fr:'un café',zh:'一杯咖啡；一家咖啡馆',ipa:'/œ̃ kafe/',unite:1,partie:2,group:'Les objets du quotidien',partie_title:'Les objets du quotidien'},
  {id:'DEMO-P2-03',fr:'une maison',zh:'一所房子',ipa:'/yn mɛzɔ̃/',unite:1,partie:2,group:'Les objets du quotidien',partie_title:'Les objets du quotidien'},
];
export const initialBooks = [
  {id:'edito-b1',name:'Édito B1',series:'Édito',level:'B1',edition:'2023 版',color:'blue',status:'ready',subtitle:'沿教材主题，一部分一部分掌握。'},
  {id:'inspire-a1',name:'Inspire A1',series:'Inspire',level:'A1',edition:'版本未标注',color:'sand',status:'ready',supplied:true,remember:false,subtitle:'课本核心词汇与实用表达，共 937 条；按 8 个单元学习。',notice:'P1–P3 为语言课，P4 为课堂交流、技巧及总结表达；这是整理词库的学习切分。全部音标为人工转写、待独立复核。'},
  {id:'edito-a2-2022',name:'Édito A2',series:'Édito',level:'A2',edition:'2022 · 第 2 版',color:'mint',status:'ready',supplied:true,remember:false,subtitle:'2022 年第 2 版，850 条专题词汇；Part 与主题均含中文标题。',notice:'覆盖 24 个专题词汇 Part。848 条音标仍待校核；另外 2 条保留文件原有的已校对标记，不代表本次重新核验。'},
  {id:'edito-a1-2022',name:'Édito A1',series:'Édito',level:'A1',edition:'2022 · 第 2 版',color:'sand',status:'ready',supplied:true,remember:false,subtitle:'2022 年第 2 版，566 条专题词汇；Part 与主题均含中文标题。',notice:'覆盖 10 个单元、20 个专题词汇 Part、80 个主题组。组合词条保留原书编排，不按词形去重；全部 566 条音标仍待校对。'},
  {id:'edito-b2',name:'Édito B2',series:'Édito',level:'B2',edition:'待确认版本',color:'peach',status:'pending',subtitle:'课本选项示例，尚未接入词库。'},
  {id:'my-notebook',name:'我的法语笔记',series:'Mon carnet',level:'自由',edition:'演示词表',color:'sand',status:'demo',bank:demoBank,subtitle:'用 6 个示例词，体验独立的课本进度。'},
];

// 同一本课本一节只加载一次；加载失败不缓存，下次打开可以重试。
const bookCache = new Map();
async function loadShippedBook(id) {
  const descriptor = initialBooks.find(b => b.id === id);
  if (!descriptor) throw new Error('未知的课本。');
  if (id === 'edito-b1') {
    const {default: bank} = await import('../../assets/textbook-bank.json', {with: {type: 'json'}});
    return {...descriptor, bank};
  }
  const {loadSuppliedBook} = await import('./supplied-books.js');
  return loadSuppliedBook(descriptor);
}
export function loadBook(id) {
  if (!SHIPPED_BOOK_IDS.includes(id)) return Promise.reject(new Error('这本课本还没有接入词库。'));
  if (!bookCache.has(id)) bookCache.set(id, loadShippedBook(id).catch(error => { bookCache.delete(id); throw error; }));
  return bookCache.get(id);
}
export function loadBookBank(id) {
  return loadBook(id).then(book => book.bank);
}
export function bookNeedsBank(book) {
  return !!book && SHIPPED_BOOK_IDS.includes(book.id) && book.status === 'ready' && (!book.bank || book.bankVersion !== BANK_VERSION);
}
// 把已加载的词库写回内置课本描述（同一对象），之后 freshMulti / restoreMulti
// 直接看到已加载的词库；学习界面仍通过 setBooks 得到的新对象重新渲染。
export async function ensureBookBanks(ids) {
  for (const id of ids) {
    const descriptor = initialBooks.find(b => b.id === id);
    if (!descriptor || !bookNeedsBank(descriptor)) continue;
    const loaded = await loadBook(id);
    Object.assign(descriptor, loaded, {bankVersion: BANK_VERSION});
  }
}
export async function loadAllBookBanks() {
  await ensureBookBanks(SHIPPED_BOOK_IDS);
}
// 导出备份前调用：把已加载的词库贴到学习记录里的课本对象上，
// 备份文件始终包含全部内置词库；尚未打开的课本由 loadAllBookBanks 先加载。
export function attachBanks(books) {
  return books.map(b => {
    const loaded = initialBooks.find(x => x.id === b.id);
    return loaded?.bank && !b.bank ? {...b, bank: loaded.bank, bankVersion: BANK_VERSION} : b;
  });
}
// 导入备份前调用：先加载备份文件里涉及的内置课本词库，
// 严格校验才能把文件里的词库和网站版本逐条比对。
export async function ensureBackupBanks(raw) {
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  const ids = new Set();
  if (data?.mode === 'multi-atelier-preview' || data?.mode === 'multi-atelier') for (const b of data.books || []) ids.add(b.id);
  else if (data?.mode === 'multi-atelier-main') { if (data.book?.id) ids.add(data.book.id); }
  else if (data?.mode === 'atelier') ids.add('edito-b1');
  await ensureBookBanks([...ids].filter(id => SHIPPED_BOOK_IDS.includes(id)));
}
