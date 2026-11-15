// 助记只在第一次真正需要时加载（进入课本检测、每日检测、易错复习或词库时）。
// 加载前 mnemonicFor 返回空字符串，界面不显示助记；加载完成后重新渲染即可看到。
let indexes = null;
let pending = null;
export function loadMnemonics() {
  if (indexes) return Promise.resolve(indexes);
  if (!pending) pending = import('./vocabulary-mnemonics.json', {with: {type: 'json'}}).then(({default: books}) => {
    // Scope by textbook and verify the source text: imported/revised rows must not
    // inherit a mnemonic just because their entry IDs happen to match.
    indexes = new Map(Object.entries(books).map(([bookId, rows]) => [
      bookId, new Map(rows.map(([id, fr, zh, mnemonic]) => [id, {fr, zh, mnemonic}])),
    ]));
    return indexes;
  }).catch(error => { pending = null; throw error; });
  return pending;
}
export function mnemonicsLoaded() {
  return !!indexes;
}
export function mnemonicFor(book, entry) {
  if (!entry || !indexes) return '';
  const reviewed = indexes.get(book.id)?.get(entry.id);
  return reviewed && reviewed.fr === entry.fr && reviewed.zh === entry.zh ? reviewed.mnemonic : '';
}
