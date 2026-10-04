// build-manifest.js — index.html の GAMES 配列を正として、
// games.json / games.js / VARIANTS.md / sitemap.xml / robots.txt を生成する。
// 使い方: node tools/build-manifest.js
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BASE = 'https://sas-news.github.io/mamego-family/';
const FLAGS_PATH = path.join(__dirname, 'health-flags.json');

// ---- GAMES配列を index.html から抽出 ----
const indexHtml = fs.readFileSync(path.join(ROOT, 'docs', 'index.html'), 'utf8');
const m = indexHtml.match(/const GAMES = \[([\s\S]*?)\];/);
if (!m) { console.error('index.html 内に GAMES 配列が見つかりません'); process.exit(1); }
const games = eval(`[${m[1]}]`);

// ---- wave(追加世代) 判定: GAMES 内の WAVE マーカー位置でタグ付け ----
const w2pos = indexHtml.indexOf('WAVE2 GAMES BEGIN');
const w3pos = indexHtml.indexOf('WAVE3 GAMES BEGIN');
const waveOf = (file) => {
    const p = indexHtml.indexOf(`file: '${file}'`);
    if (w3pos !== -1 && p > w3pos) return 'wave3';
    if (w2pos !== -1 && p > w2pos) return 'wave2';
    return 'wave1';
};

// ---- 各ファイルの初追加日 (git history) ----
const added = {};
try {
    const log = execSync('git log --diff-filter=A --format="COMMIT %cI" --name-only -- "*.html"', { cwd: ROOT, encoding: 'utf8' });
    let date = null;
    for (const line of log.split('\n')) {
        const cm = line.match(/^COMMIT (.+)$/);
        if (cm) { date = cm[1].slice(0, 10); continue; }
        const f = line.trim().replace(/^docs\//, '');
        if (f.endsWith('.html') && !added[f]) added[f] = date;
    }
} catch (e) {
    console.warn('git log 取得失敗 (追加日は未設定):', e.message);
}
const today = new Date().toISOString().slice(0, 10);

// ---- 健全性フラグ (手動保守) ----
let flags = {};
try { flags = JSON.parse(fs.readFileSync(FLAGS_PATH, 'utf8')); } catch (e) {}

const list = games.map(g => {
    const slug = g.file.replace(/\.html$/, '');
    const out = {
        slug,
        file: g.file,
        name: g.name,
        jp: g.jp,
        desc: g.desc,
        kind: g.kind,
        icon: g.icon || g.kind,
        wave: waveOf(g.file),
        added: added[g.file] || today,
    };
    if (flags[g.file]) out.health = flags[g.file];
    return out;
}).sort((a, b) => a.file.localeCompare(b.file));

// ---- games.json (データ正) ----
fs.writeFileSync(path.join(ROOT, 'docs', 'games.json'), JSON.stringify({
    generated: today,
    count: list.length,
    games: list,
}, null, 1) + '\n');

// ---- games.js (ブラウザ用・file://でも読める script 形式) ----
fs.writeFileSync(path.join(ROOT, 'docs', 'games.js'),
    `// 自動生成: tools/build-manifest.js — 直接編集しないこと\nwindow.MAMEGO_GAMES = ${JSON.stringify(list)};\n`);

// ---- VARIANTS.md (カテゴリ別カタログ) ----
const WAVE_LABEL = { wave1: 'wave1 (初期収録)', wave2: 'wave2', wave3: 'wave3 (量産)' };
const groups = new Map();
for (const g of list) {
    const key = WAVE_LABEL[g.wave] || g.wave;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(g);
}
let md = `# 変則碁シリーズ 全ゲームカタログ\n\n自動生成 (\`node tools/build-manifest.js\`)。全${list.length}種。\n\n`;
for (const [label, arr] of groups) {
    md += `## ${label} (${arr.length}種)\n\n| ゲーム | 和名 | 内容 | health |\n|---|---|---|---|\n`;
    for (const g of arr) {
        md += `| [${g.name}](${g.file}) | ${g.jp} | ${g.desc} | ${g.health || ''} |\n`;
    }
    md += '\n';
}
fs.writeFileSync(path.join(ROOT, 'docs', 'VARIANTS.md'), md);

// ---- sitemap.xml ----
const urls = [''].concat(list.map(g => g.file)).map(f =>
    `  <url><loc>${BASE}${f || 'index.html'}</loc></url>`);
fs.writeFileSync(path.join(ROOT, 'docs', 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);

// ---- robots.txt ----
fs.writeFileSync(path.join(ROOT, 'docs', 'robots.txt'),
    `User-agent: *\nAllow: /\n\nSitemap: ${BASE}sitemap.xml\n`);

// ---- ranking.js スタブ (無ければ作る。実データは nightly-ranking workflow が上書き) ----
const rankPath = path.join(ROOT, 'docs', 'ranking.js');
if (!fs.existsSync(rankPath)) {
    fs.writeFileSync(rankPath,
        `// 自動生成スタブ: nightly-ranking workflow が実データで上書きする\nwindow.MAMEGO_RANKING = { generated: null, games: {} };\n`);
}

console.log(`manifest: ${list.length} games → games.json / games.js / VARIANTS.md / sitemap.xml / robots.txt`);
console.log(`  added-date covered: ${Object.keys(added).length} files, health-flagged: ${Object.keys(flags).length}`);
