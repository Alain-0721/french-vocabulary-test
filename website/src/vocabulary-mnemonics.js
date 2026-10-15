import books from './vocabulary-mnemonics.json' with {type:'json'};

// Scope by textbook and verify the source text: imported/revised rows must not
// inherit a mnemonic just because their entry IDs happen to match.
const indexes = new Map(Object.entries(books).map(([bookId,rows])=>[
  bookId,new Map(rows.map(([id,fr,zh,mnemonic])=>[id,{fr,zh,mnemonic}]))
]));
export function mnemonicFor(book,entry){
  if(!entry)return '';
  const reviewed=indexes.get(book.id)?.get(entry.id);
  return reviewed&&reviewed.fr===entry.fr&&reviewed.zh===entry.zh?reviewed.mnemonic:'';
}
