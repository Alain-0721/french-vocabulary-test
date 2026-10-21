"""Copy reviewed local content into an offline, textbook-scoped App asset."""
import argparse
import json
from pathlib import Path

root = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('source', type=Path, help='Reviewed mnemonic JSON to apply')
reviewed = json.loads(parser.parse_args().source.read_text('utf-8'))


def mnemonic(row):
    sections = row.get('sections')
    if sections is None:
        return row['mnemonic']
    labels = ['发音联想', '派生联想', '技巧联想', '助记']
    assert sections and all(s['label'] in labels and s['text'].strip() for s in sections)
    assert len({s['label'] for s in sections}) == len(sections)
    assert [labels.index(s['label']) for s in sections] == sorted(labels.index(s['label']) for s in sections)
    return '\n'.join(s['text'] if s['label'] == '助记' else s['label'].removesuffix('联想') + '：' + s['text'] for s in sections)
names = {'Édito A1': 'edito-a1-2022', 'Inspire A1': 'inspire-a1',
         'Édito A2': 'edito-a2-2022', 'Édito B1': 'edito-b1'}
result = {}
for row in reviewed:
    if row['book'] in names:
        result.setdefault(names[row['book']], []).append(
            [row['id'], row['fr'], row['zh'], mnemonic(row)])
# The reviewed demonstration has editorial row IDs; bind it to the actual App
# IDs and meanings explicitly instead of matching IDs across unrelated books.
demo = [r for r in reviewed if r['book'] not in names]
demo_sources = [
    ('DEMO-P1-01', 'bonjour', '你好'), ('DEMO-P1-02', 'merci', '谢谢'),
    ('DEMO-P1-03', 'à bientôt', '回头见'), ('DEMO-P2-01', 'un livre', '一本书'),
    ('DEMO-P2-02', 'un café', '一杯咖啡；一家咖啡馆'),
    ('DEMO-P2-03', 'une maison', '一所房子'),
]
result['my-notebook'] = []
for entry_id, fr, zh in demo_sources:
    matches = [r for r in demo if r['fr'] == fr]
    assert len(matches) == 1, (fr, matches)
    result['my-notebook'].append([entry_id, fr, zh, mnemonic(matches[0])])
assert sum(map(len, result.values())) == 3469
for rows in result.values():
    assert len({r[0] for r in rows}) == len(rows)
    assert all(r[3].strip() and '助记解析' not in r[3] for r in rows)
target = root / 'website/src/vocabulary-mnemonics.json'
target.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({k: len(v) for k, v in result.items()}, ensure_ascii=False))
