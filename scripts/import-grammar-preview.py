"""Read the supplied grammar DOCX into the isolated FranLumi preview."""
import sys, json, re, zipfile, hashlib
from pathlib import Path
import xml.etree.ElementTree as ET

source = Path(sys.argv[1])
ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
root = ET.fromstring(zipfile.ZipFile(source).read('word/document.xml'))
body = root.find('w:body', ns)
def paragraphs(element):
    return [line for p in element.findall('.//w:p', ns) for line in text(p).split('\n') if line.strip()]
def text(element):
    return ''.join((e.text or '') if e.tag.endswith('}t') else '\n' if e.tag.endswith('}br') else '' for e in element.iter())
def style(element):
    s = element.find('w:pPr/w:pStyle', ns)
    return s.get('{'+ns['w']+'}val', '') if s is not None else ''

units, topics = [], []
unit, part, topic, section = None, None, None, 'original'
for element in body:
    if element.tag.endswith('}p'):
        value, kind = text(element).strip(), style(element)
        if not value: continue
        if kind == 'Heading1':
            match = re.match(r'Unité (\d+) (.+)', value)
            topic = None
            if match:
                unit = {'number': int(match[1]), 'fr': match[2], 'zh': ''}
                units.append(unit)
            else: unit = None
            continue
        if not unit: continue
        if kind == 'Heading2':
            match = re.search(r'Part (\d+)', value)
            if match: part = int(match[1])
            topic = None
            continue
        if kind == 'Heading3':
            topic = {'id': f'edito-b1-u{unit["number"]:02}-p{part}-g{len(topics)+1:02}', 'unit': unit['number'], 'part': part, 'fr': value, 'zh': '', 'page': None, 'blocks': []}
            section = 'original'
            topics.append(topic)
            continue
        if not topic:
            if not unit['zh']: unit['zh'] = value
            continue
        if not topic['zh'] and kind != 'Subtitle':
            topic['zh'] = value
            continue
        if kind == 'Subtitle':
            page = re.search(r'(\d+)', value)
            if page: topic['page'] = int(page[1])
            continue
        if kind == 'Heading4':
            if value == '课本原文与逐句翻译': section = 'original'; continue
            if value == '知识点总结': section = 'summary'; continue
            if value == '补充复习': section = 'supplement'; continue
            topic['blocks'].append({'type': 'heading', 'section': section, 'text': value})
        else: topic['blocks'].append({'type': 'paragraph', 'section': section, 'text': value})
    elif element.tag.endswith('}tbl') and topic:
        rows = [[paragraphs(cell) for cell in row.findall('w:tc', ns)] for row in element.findall('w:tr', ns)]
        topic['blocks'].append({'type': 'table', 'section': section, 'rows': rows})

assert len(units) == 12 and len(topics) == 36
assert all(t['zh'] and t['page'] and t['blocks'] for t in topics)
assert all({b['section'] for b in t['blocks']} == {'original', 'summary', 'supplement'} for t in topics)
result = {'book': 'Édito B1', 'edition': '2023', 'source': source.name, 'sourceSha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'units': units, 'topics': topics}
target = Path(__file__).resolve().parents[1] / 'website/src/grammar-preview/bank.json'
target.parent.mkdir(parents=True, exist_ok=True)
target.write_text(json.dumps(result, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'Grammar preview: {len(units)} units, {len(topics)} topics, {sum(b["type"] == "table" for t in topics for b in t["blocks"])} tables')
