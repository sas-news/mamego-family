// inject-site.js — 全ゲームHTMLに サイト共通部品を冪等に注入する。
//   <title>後ろ       → OGP/canonical/description メタ (games.json の値)
//   main div 先頭     → トップナビ (一覧へ/★/🎲/🔗/🐞)
//   モーダル直前      → フッター
//   </body> 直前      → site-config.js / games.js / site-common.js
// 使い方: node tools/inject-site.js   (tools/build-manifest.js の後に実行)
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://sas-news.github.io/mamego-family/';
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'games.json'), 'utf8'));
const games = manifest.games;
const byFile = new Map(games.map(g => [g.file, g]));

let sha = 'dev';
try { sha = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim(); } catch (e) {}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const mark = (name, body) => `    <!-- MAMEGO:${name} -->\n${body}\n    <!-- /MAMEGO:${name} -->`;

function metaBlock(g) {
    const isIndex = g.slug === 'index';
    const ogTitle = isIndex ? '変則碁シリーズ MAMEGO family' : `${g.name} - ${g.jp} | 変則碁シリーズ`;
    const ogDesc = isIndex
        ? `碁のルールを変えたブラウザゲーム集。全${manifest.count}種、無料・インストール不要・ランダムで未知の碁に出会える。`
        : `${g.desc} — ${g.jp}の変則囲碁。全${manifest.count}種の変則碁シリーズ。`;
    const ogImg = `${BASE}og/${isIndex ? 'index' : g.slug}.png`;
    return mark('META', [
        `    <meta name="description" content="${esc(ogDesc)}">`,
        `    <link rel="canonical" href="${BASE}${isIndex ? '' : g.file}">`,
        `    <meta property="og:type" content="website">`,
        `    <meta property="og:site_name" content="変則碁シリーズ MAMEGO family">`,
        `    <meta property="og:title" content="${esc(ogTitle)}">`,
        `    <meta property="og:description" content="${esc(ogDesc)}">`,
        `    <meta property="og:url" content="${BASE}${isIndex ? '' : g.file}">`,
        `    <meta property="og:image" content="${ogImg}">`,
        `    <meta property="og:locale" content="ja_JP">`,
        `    <meta name="twitter:card" content="summary_large_image">`,
        `    <meta name="mamego-build" content="${sha}">`,
    ].join('\n'));
}

const NAV = mark('NAV', [
    `        <style>`,
    `            .mg-nav-btn{width:2rem;height:2rem;display:flex;align-items:center;justify-content:center;border-radius:.5rem;border:1px solid;color:inherit;opacity:.75;transition:all .15s;cursor:pointer;background:transparent;font-size:.95rem;line-height:1}`,
    `            .mg-nav-btn:hover{opacity:1;transform:scale(1.08)}`,
    `            .mg-nav-btn.mg-faved{color:#f59e0b;opacity:1;text-shadow:0 0 8px rgba(251,191,36,.85)}`,
    `        </style>`,
    `        <nav class="w-full flex items-center justify-between text-xs sm:text-sm font-bold" aria-label="サイトナビ">`,
    `            <a href="index.html" class="px-2.5 py-1.5 rounded-lg border border-current/25 hover:bg-black/10 active:scale-95 transition-all" title="ゲーム一覧に戻る">← 一覧</a>`,
    `            <div class="relative flex items-center gap-1">`,
    `                <button id="mgFav" title="お気に入り" class="mg-nav-btn" aria-label="お気に入り">★</button>`,
    `                <a id="mgRand" href="#" title="別の碁をランダムで" class="mg-nav-btn" aria-label="ランダム">🎲</a>`,
    `                <button id="mgShare" title="シェア" class="mg-nav-btn" aria-label="シェア">🔗</button>`,
    `                <button id="mgBug" title="バグ報告" class="mg-nav-btn" aria-label="バグ報告">🐞</button>`,
    `                <div id="mgBugMenu" class="hidden absolute right-0 top-full mt-1 z-50 bg-white text-neutral-900 rounded-xl border border-neutral-300 shadow-lg p-1 min-w-[11rem]">`,
    `                    <button data-report="github" class="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100">GitHubで報告</button>`,
    `                    <button data-report="form" class="hidden w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100">フォームで報告</button>`,
    `                    <button data-report="copy" class="w-full text-left px-3 py-2 rounded-lg hover:bg-neutral-100">診断情報をコピー</button>`,
    `                </div>`,
    `            </div>`,
    `        </nav>`,
].join('\n'));

const FOOT = mark('FOOT', [
    `    <footer class="w-full text-center text-[10px] opacity-50 leading-relaxed">`,
    `        変則碁シリーズ · <a href="index.html" class="underline">全ゲーム一覧</a> · <a href="https://github.com/sas-news/mamego-family" class="underline" target="_blank" rel="noopener">GitHub</a> · <a href="#" id="mgFootBug" class="underline">バグ報告</a>`,
    `    </footer>`,
].join('\n'));

// index はメインscriptより前に読み込む必要がある (NEW/調整中バッジ・ランキングが参照するため)
const SCRIPTS = isIndex => mark('SCRIPTS', [
    `    <script src="site-config.js"></script>`,
    `    <script src="games.js"></script>`,
    isIndex ? `    <script src="ranking.js"></script>` : null,
    `    <script src="site-common.js"></script>`,
].filter(Boolean).join('\n'));
const SCRIPTS_RE = /\s*<!-- MAMEGO:SCRIPTS -->[\s\S]*?<!-- \/MAMEGO:SCRIPTS -->[ \t]*\n*/;

// ---- 注入ロジック: マーカーがあれば置換、なければアンカーへ挿入 ----
function upsert(html, name, block, anchorRe, position) {
    // 前後の空白行ごと正規化: 実行のたびに空行が増えないようにする
    const re = new RegExp(`\\s*<!-- MAMEGO:${name} -->[\\s\\S]*?<!-- /MAMEGO:${name} -->[ \\t]*\\n*`);
    if (re.test(html)) return { html: html.replace(re, '\n' + block + '\n\n'), did: 'replace' };
    const mm = html.match(anchorRe);
    if (!mm) return { html, did: 'missing-anchor' };
    const at = position === 'before' ? mm.index : mm.index + mm[0].length;
    const tail = position === 'before' ? '\n\n' : '';
    return { html: html.slice(0, at) + '\n' + block + tail + html.slice(at), did: 'insert' };
}

const ANCHORS = {
    META: { re: /<\/title>/, pos: 'after' },
    NAV: { re: /    <div class="w-full max-w-xl flex flex-col items-center gap-4 sm:gap-5">/, pos: 'after' },
    FOOT: { re: /    <!-- 【ルールモーダル】 -->/, pos: 'before' },
    SCRIPTS: { re: /<\/body>/, pos: 'before' },
};

const targets = ['index.html', ...games.map(g => g.file)];
let done = { meta: 0, nav: 0, foot: 0, scripts: 0 };
const warns = [];
for (const file of targets) {
    const p = path.join(ROOT, 'docs', file);
    if (!fs.existsSync(p)) { warns.push(`${file}: not found`); continue; }
    let html = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
    const g = byFile.get(file) || { slug: 'index', name: 'MAMEGO', jp: '変則碁シリーズ', desc: '' };
    const isIndex = file === 'index.html';

    let r = upsert(html, 'META', metaBlock(g), ANCHORS.META.re, ANCHORS.META.pos);
    html = r.html; if (r.did !== 'missing-anchor') done.meta++; else warns.push(`${file}: META anchor missing`);

    if (!isIndex) {
        r = upsert(html, 'NAV', NAV, ANCHORS.NAV.re, ANCHORS.NAV.pos);
        html = r.html; if (r.did !== 'missing-anchor') done.nav++; else warns.push(`${file}: NAV anchor missing`);
        r = upsert(html, 'FOOT', FOOT, ANCHORS.FOOT.re, ANCHORS.FOOT.pos);
        html = r.html; if (r.did !== 'missing-anchor') done.foot++; else warns.push(`${file}: FOOT anchor missing`);
    }
    if (isIndex) {
        // index のスクリプトはメインscript実行前に置く: 既存ブロックを剥がして icon-draw.js の前に挿し直す
        html = html.replace(SCRIPTS_RE, '');
        r = upsert(html, 'SCRIPTS', SCRIPTS(true), /<script src="icon-draw.js"><\/script>/, 'before');
    } else {
        r = upsert(html, 'SCRIPTS', SCRIPTS(false), ANCHORS.SCRIPTS.re, ANCHORS.SCRIPTS.pos);
    }
    html = r.html; if (r.did !== 'missing-anchor') done.scripts++; else warns.push(`${file}: SCRIPTS anchor missing`);

    fs.writeFileSync(p, html);
}
console.log(`inject: meta=${done.meta} nav=${done.nav} foot=${done.foot} scripts=${done.scripts} (build=${sha})`);
if (warns.length) { console.warn('warnings:'); warns.forEach(w => console.warn('  ' + w)); }
