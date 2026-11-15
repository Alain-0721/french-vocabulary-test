import {makeImportedBook, vocabularySummary} from './vocabulary-import.js';

// 配套课本的词库与中文标题只在打开这本课本时加载。
// 传入 books.js 里的课本描述，返回带词库的完整课本对象；
// 描述里的名称、级别、版本、副标题与提示保持不变。
export async function loadSuppliedBook(book) {
  if (book.id === 'inspire-a1') {
    const [{default: bank}, {default: titles}] = await Promise.all([
      import('../../assets/inspire-a1-bank.json', {with: {type: 'json'}}),
      import('../../assets/inspire-a1-titles.json', {with: {type: 'json'}}),
    ]);
    const entries = bank.map(entry => ({
      ...entry,
      partie_title_zh: titles.parts[`U${entry.unite}P${entry.partie}`],
      group_zh: titles.themes[entry.group],
    }));
    return {...makeImportedBook({entries, summary: vocabularySummary(entries), filename: 'Inspire_A1_标准词库.csv'}, book, book.id), ...book, imported: true};
  }
  if (book.id === 'edito-a2-2022') {
    const [{default: bank}, {default: titles}] = await Promise.all([
      import('../../assets/edito-a2-2022-bank.json', {with: {type: 'json'}}),
      import('../../assets/edito-a2-2022-titles.json', {with: {type: 'json'}}),
    ]);
    const entries = bank.map(entry => {
      const part = `U${entry.unite}P${entry.partie}`;
      return {...entry, partie_title_zh: titles.parts[part], group_zh: titles.themesByPart[`${part}::${entry.group}`] || titles.themes[entry.group]};
    });
    return {...makeImportedBook({entries, summary: vocabularySummary(entries), filename: 'Édito_A2_2022_标准词库.csv'}, book, book.id), ...book, imported: true};
  }
  if (book.id === 'edito-a1-2022') {
    const [{default: bank}, {default: titles}] = await Promise.all([
      import('../../assets/edito-a1-2022-bank.json', {with: {type: 'json'}}),
      import('../../assets/edito-a1-2022-titles.json', {with: {type: 'json'}}),
    ]);
    const entries = bank.map(entry => {
      const part = `U${entry.unite}P${entry.partie}`;
      return {...entry, partie_title_zh: titles.parts[part], group_zh: titles.themesByPart[`${part}::${entry.group}`] || titles.themes[entry.group]};
    });
    return {...makeImportedBook({entries, summary: vocabularySummary(entries), filename: 'Édito_A1_2022_标准词库.csv'}, book, book.id), ...book, imported: true};
  }
  throw new Error('这本课本还没有接入词库。');
}
