import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, readdirSync, mkdtempSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import vm from 'node:vm';
import {build} from 'esbuild';
import {initialBooks, loadBook, loadBookBank, loadAllBookBanks, bookNeedsBank} from '../src/books.js';
import {loadMnemonics, mnemonicFor, mnemonicsLoaded} from '../src/vocabulary-mnemonics.js';
import {loadGrammarData, getGrammarData} from '../src/grammar-preview/grammar-data.js';
import {freshMulti} from '../src/multi-learning.js';

// 约 4.3 MB 的 JSON 数据：首屏入口不得静态导入，只能按需动态导入。
const DATA_FILES = [
  'textbook-bank.json',
  'inspire-a1-bank.json',
  'edito-a2-2022-bank.json',
  'edito-a1-2022-bank.json',
  'vocabulary-mnemonics.json',
  'grammar-preview/bank.json',
  'tense-bank.json',
  'conjugation-bank.json',
];
const ENTRY_GRAPH = [
  'src/site.jsx',
  'src/textbooks-preview.jsx',
  'src/books.js',
  'src/supplied-books.js',
  'src/multi-learning.js',
  'src/useMultiLearning.js',
  'src/preview-backup.js',
  'src/vocabulary-mnemonics.js',
  'src/grammar-preview/main.jsx',
  'src/grammar-preview/grammar-data.js',
  'src/grammar-preview/state.js',
  'src/grammar-preview/backup.js',
  'src/grammar-preview/tense-state.js',
  'src/grammar-preview/tense-ui.jsx',
  'src/grammar-preview/tense-reading.jsx',
  'src/grammar-preview/conjugation-ui.jsx',
  'src/grammar-preview/local-learning.js',
];
const STATIC_IMPORT = new RegExp(`import\\s+[^;]*?from\\s+['"][^'"]*(${DATA_FILES.map(f => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})['"]`);

test('首屏入口不再静态导入词库与语法数据', () => {
  for (const file of ENTRY_GRAPH) {
    const source = readFileSync(file, 'utf8');
    assert.ok(!STATIC_IMPORT.test(source), `${file} 仍在静态导入数据 JSON`);
  }
  const books = readFileSync('src/books.js', 'utf8');
  assert.ok(books.includes("import('../../assets/textbook-bank.json'"), 'Édito B1 应动态导入');
  assert.ok(books.includes("import('./supplied-books.js')"), '配套课本应动态导入');
  const grammar = readFileSync('src/grammar-preview/grammar-data.js', 'utf8');
  for (const file of ['bank.json', 'tense-bank.json', 'conjugation-bank.json']) assert.ok(grammar.includes(`import('./${file}'`), `语法数据 ${file} 应动态导入`);
  const mnemonics = readFileSync('src/vocabulary-mnemonics.js', 'utf8');
  assert.ok(mnemonics.includes("import('./vocabulary-mnemonics.json'"), '助记应动态导入');
  const main = readFileSync('src/grammar-preview/main.jsx', 'utf8');
  assert.ok(/lazy\(\(\)\s*=>\s*import\('\.\.\/textbooks-preview\.jsx'\)/.test(main), '单词空间应用 React.lazy 加载');
});

test('freshMulti 只给已有词库的课本建进度', () => {
  const fresh = freshMulti();
  assert.equal(fresh.books.find(b => b.id === 'edito-b1').bank, undefined);
  assert.deepEqual(Object.keys(fresh.progress), ['my-notebook']);
});

test('按需加载课本：只加载打开的那本，切换课本再加载下一本', async () => {
  assert.equal(bookNeedsBank(initialBooks.find(b => b.id === 'edito-b1')), true);
  assert.equal(bookNeedsBank(initialBooks.find(b => b.id === 'edito-b2')), false);
  assert.equal(bookNeedsBank(initialBooks.find(b => b.id === 'my-notebook')), false);
  const b1 = await loadBookBank('edito-b1');
  assert.equal(b1.length, 1110);
  // 同一本课本只加载一次：两次调用返回同一个 Promise。
  assert.equal(loadBook('edito-b1'), loadBook('edito-b1'));
  const inspire = await loadBookBank('inspire-a1');
  assert.equal(inspire.length, 937);
  assert.equal((await loadBookBank('edito-a2-2022')).length, 850);
  assert.equal((await loadBookBank('edito-a1-2022')).length, 566);
  await assert.rejects(loadBook('edito-b2'), /还没有接入/);
  await assert.rejects(loadBook('no-such-book'), /还没有接入/);
  await loadAllBookBanks();
  for (const id of ['edito-b1', 'inspire-a1', 'edito-a2-2022', 'edito-a1-2022']) {
    assert.equal(bookNeedsBank(initialBooks.find(b => b.id === id)), false);
  }
  const fresh = freshMulti();
  assert.deepEqual(Object.keys(fresh.progress).sort(), ['edito-a1-2022', 'edito-a2-2022', 'edito-b1', 'inspire-a1', 'my-notebook']);
});

test('助记只在第一次需要时加载，加载前返回空字符串', async () => {
  assert.equal(mnemonicsLoaded(), false);
  assert.equal(mnemonicFor({id: 'edito-b1'}, {id: 'X', fr: 'a', zh: 'b'}), '');
  const first = await loadMnemonics();
  assert.equal(mnemonicsLoaded(), true);
  assert.equal(await loadMnemonics(), first);
  const bank = await loadBookBank('edito-b1');
  const book = initialBooks.find(b => b.id === 'edito-b1');
  assert.ok(mnemonicFor(book, bank[0]).length > 0, '已加载的词条应有助记');
});

test('语法数据只在第一次进入语法空间时加载', async () => {
  assert.equal(getGrammarData(), null);
  const data = await loadGrammarData();
  assert.equal(data.bank.topics.length, 36);
  assert.equal(data.tenseBank.topics.length, 22);
  assert.ok(data.conjugationBank.models.length > 100);
  assert.equal(getGrammarData(), data);
  assert.equal(await loadGrammarData(), data);
});

test('打包后入口不再包含词库内容，数据各自成块', async () => {
  // 输出写到 gitignored 的 .netlify/，不在小容量的 /tmp 里写。
  const dir = mkdtempSync(join('.netlify', 'lazy-test-'));
  try {
    const auth = `export const getUser=async()=>null,refreshSession=async()=>{},getSettings=async()=>({disableSignup:false}),handleAuthCallback=async()=>null,onAuthChange=()=>()=>{},login=async()=>{},signup=async()=>({}),logout=async()=>{},requestPasswordRecovery=async()=>{},updateUser=async()=>{},acceptInvite=async()=>{};`;
    const result = await build({
      entryPoints: ['src/site.jsx'], bundle: true, splitting: true, format: 'esm', platform: 'browser',
      outdir: dir, loader: {'.css': 'empty'}, logLevel: 'silent',
      plugins: [{name: 'identity-fixture', setup(b) {
        b.onResolve({filter: /^@netlify\/identity$/}, () => ({path: 'identity', namespace: 'mock'}));
        b.onLoad({filter: /.*/, namespace: 'mock'}, () => ({contents: auth, loader: 'js'}));
      }}],
    });
    assert.equal(result.errors.length, 0);
    const files = readdirSync(dir).filter(f => f.endsWith('.js'));
    const contents = new Map(files.map(f => [f, readFileSync(join(dir, f), 'utf8')]));
    const entry = [...contents.entries()].find(([f]) => f === 'site.js');
    assert.ok(entry, '应生成入口 chunk');
    // esbuild 默认把非 ASCII 转义成 \uXXXX，探针用纯 ASCII 词条。
    const b1 = await loadBookBank('edito-b1');
    const probe = b1.find(e => /^[ -~]+$/.test(e.fr) && e.fr.length > 12)?.fr;
    assert.ok(probe, '需要一个足够长的纯 ASCII 法语词条作探针');
    assert.ok(!entry[1].includes(probe), '入口 chunk 不应包含 B1 词条内容');
    assert.ok([...contents.values()].some(code => code.includes(probe)), '应有单独的数据 chunk 包含 B1 词条');
    assert.ok(files.some(f => f.includes('textbook-bank')), 'B1 词库应单独成块');
    assert.ok(files.some(f => f.includes('vocabulary-mnemonics')), '助记应单独成块');
    assert.ok(files.some(f => f.includes('tense-bank') || f.includes('bank-')), '语法数据应单独成块');
    const mnemonics = JSON.parse(readFileSync('src/vocabulary-mnemonics.json', 'utf8'));
    const mnemonicProbe = Object.values(mnemonics).flat()[0][3];
    assert.ok(mnemonicProbe && mnemonicProbe.length > 10, '需要一个足够长的助记作探针');
    assert.ok(!entry[1].includes(mnemonicProbe), '入口 chunk 不应包含助记内容');
  } finally {
    rmSync(dir, {recursive: true, force: true});
  }
});

test('构建产物：数据块独立、预缓存不含数据块、首页不引用数据块', (t) => {
  if (!existsSync('dist/sw.js') || !existsSync('dist/index.html')) {
    t.skip('先跑 vite build 再验证产物');
    return;
  }
  const sw = readFileSync('dist/sw.js', 'utf8');
  const list = JSON.parse(sw.match(/const FILES=(.*);/)[1]);
  for (const name of ['data-b1-', 'data-inspire-a1-', 'data-a2-', 'data-a1-', 'data-mnemonics-', 'data-grammar-', 'data-tense-', 'data-conjugation-']) {
    assert.ok(readdirSync('dist/assets').some(f => f.startsWith(name)), `应生成 ${name} 数据块`);
    assert.ok(!list.some(f => f.includes(name)), `预缓存不应包含 ${name}`);
  }
  const html = readFileSync('dist/index.html', 'utf8');
  assert.ok(!html.includes('data-'), '首页不应引用数据块');
  const entry = readdirSync('dist/assets').find(f => f.startsWith('index-') && f.endsWith('.js'));
  assert.ok(entry, '应生成入口 chunk');
});

function serviceWorker({fetchImpl} = {}) {
  const handlers = new Map();
  const stores = new Map();
  const makeCache = store => ({
    addAll: async files => { for (const file of files) store.set(new URL(file.url).pathname, new Response(file.url.endsWith('index.html') ? 'offline shell' : 'asset', {headers: {'Content-Type': file.url.endsWith('index.html') ? 'text/html' : 'text/plain'}})); },
    match: async req => { const path = typeof req === 'string' ? new URL(req, 'https://example.test').pathname : new URL(req.url).pathname; const r = store.get(path); return r ? r.clone() : undefined; },
    put: async (req, res) => { const path = typeof req === 'string' ? new URL(req, 'https://example.test').pathname : new URL(req.url).pathname; store.set(path, res.clone()); },
    keys: async () => [...store.keys()].map(p => new Request('https://example.test' + p)),
    delete: async req => { const path = typeof req === 'string' ? new URL(req, 'https://example.test').pathname : new URL(req.url).pathname; return store.delete(path); },
  });
  const self = {location: {origin: 'https://example.test'}, addEventListener: (name, fn) => handlers.set(name, fn), skipWaiting: () => {}, clients: {claim: async () => {}}};
  // undici 的 Request 不接受相对 URL；像 test-pwa 那样先拼成绝对地址。
  const WrappedRequest = class extends Request { constructor(url, options) { super(new URL(url, 'https://example.test'), options); } };
  const script = readFileSync('src/service-worker.js', 'utf8')
    .replace('__CACHE_VERSION__', 'test')
    .replace('__PRECACHE_FILES__', JSON.stringify(['/index.html', '/assets/app.js', '/favicon.svg']));
  vm.runInNewContext(script, {self, caches: {
    open: async key => { if (!stores.has(key)) stores.set(key, new Map()); return makeCache(stores.get(key)); },
    keys: async () => [...stores.keys()],
    delete: async key => stores.delete(key),
  }, Request: WrappedRequest, Response, URL, fetch: fetchImpl || (async () => { throw Error('offline'); })});
  return {handlers, stores, async event(name) { let promise; handlers.get(name)({waitUntil: p => promise = p}); await promise; },
    async fetch(path, options = {}) { let response; handlers.get('fetch')({request: {url: new URL(path, self.location.origin).href, method: 'GET', mode: 'cors', ...options}, respondWith: r => response = r}); return response ? await response : null; }};
}

test('Service Worker 运行时缓存数据块：离线仍可用，旧构建的数据块会被清理', async () => {
  let fetches = 0;
  const w = serviceWorker({fetchImpl: async () => { fetches++; return new Response('data-bytes', {status: 200}); }});
  await w.event('install');
  const first = await w.fetch('/assets/data-b1-abc123.js');
  assert.equal(await first.text(), 'data-bytes');
  assert.equal(fetches, 1);
  assert.ok(w.stores.get('franmo-data')?.has('/assets/data-b1-abc123.js'));
  // 第二次命中缓存，不再请求网络。
  const second = await w.fetch('/assets/data-b1-abc123.js');
  assert.equal(await second.text(), 'data-bytes');
  assert.equal(fetches, 1);
  // 新构建的数据块缓存后，同名旧构建的数据块删除。
  w.stores.get('franmo-data').set('/assets/data-b1-oldhash.js', new Response('stale'));
  await w.fetch('/assets/data-b1-newhash.js');
  assert.ok(!w.stores.get('franmo-data').has('/assets/data-b1-oldhash.js'));
  assert.ok(w.stores.get('franmo-data').has('/assets/data-b1-newhash.js'));
  // 发新版时，数据缓存不随应用缓存一起删除。
  w.stores.set('franmo-app-old', new Map());
  await w.event('activate');
  assert.ok(!w.stores.has('franmo-app-old'));
  assert.ok(w.stores.has('franmo-data'));
});
