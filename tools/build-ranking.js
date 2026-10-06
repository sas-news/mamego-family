// build-ranking.js — GoatCounter のカスタムイベント (fav/<slug>, play/<slug>) を集計し
// ranking.js / ranking.json を生成する。nightly-ranking workflow から実行される。
// 必要な環境変数:
//   GOATCOUNTER_CODE   GoatCounter のサイトコード (例: mamego)
//   GOATCOUNTER_TOKEN  APIトークン (Authorization: Bearer)
//   RANK_SINCE         集計開始日時 ISO (省略時 2024-01-01 = 実質全期間)
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT = path.join(__dirname, '..');
const CODE = process.env.GOATCOUNTER_CODE;
const TOKEN = process.env.GOATCOUNTER_TOKEN;
const SINCE = process.env.RANK_SINCE || '2024-01-01T00:00:00Z';
const BATCH = 60;           // include_paths をこの数ずつ送る (URL長対策)
const SLEEP_MS = 700;       // 連続リクエスト間の間隔 (API優しさ)

if (!CODE || !TOKEN) {
    console.log('build-ranking: GOATCOUNTER_CODE/GOATCOUNTER_TOKEN が未設定のためスキップ');
    process.exit(0);
}

const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'games.json'), 'utf8'));
const slugs = manifest.games.map(g => g.slug);
// 集計対象パス: event/fav/<slug> と event/play/<slug>
const targets = [];
for (const s of slugs) { targets.push(`event/fav/${s}`, `event/play/${s}`); }

function apiGet(urlPath) {
    return new Promise((resolve, reject) => {
        const req = https.request({
            hostname: `${CODE}.goatcounter.com`,
            path: urlPath,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'mamego-ranking-builder',
            },
        }, res => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode}: ${body.slice(0, 300)}`));
                }
                try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(new Error('timeout')); });
        req.end();
    });
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main() {
    const fav = {}, play = {};
    let fetched = 0;
    for (let i = 0; i < targets.length; i += BATCH) {
        const chunk = targets.slice(i, i + BATCH);
        const q = chunk.map(p => `include_paths=${encodeURIComponent(p)}`).join('&');
        const url = `/api/v0/stats/hits?start=${encodeURIComponent(SINCE)}` +
            `&path_by_name=true&limit=100&${q}`;
        const res = await apiGet(url);
        for (const h of (res.hits || [])) {
            const m = String(h.path).match(/^event\/(fav|play)\/(.+)$/);
            if (!m) continue;
            (m[1] === 'fav' ? fav : play)[m[2]] = (m[1] === 'fav' ? fav : play)[m[2]] + (h.count || 0);
        }
        fetched++;
        if (i + BATCH < targets.length) await sleep(SLEEP_MS);
    }

    const games = {};
    for (const s of slugs) {
        const f = fav[s] || 0, p = play[s] || 0;
        if (f || p) games[s] = { favs: f, plays: p };
    }
    const data = { generated: new Date().toISOString().slice(0, 10), since: SINCE.slice(0, 10), games };

    fs.writeFileSync(path.join(ROOT, 'docs', 'ranking.json'), JSON.stringify(data, null, 1) + '\n');
    fs.writeFileSync(path.join(ROOT, 'docs', 'ranking.js'),
        `// 自動生成: nightly-ranking workflow (${data.generated}) — 直接編集しないこと\n` +
        `window.MAMEGO_RANKING = ${JSON.stringify(data)};\n`);
    console.log(`build-ranking: ${fetched} requests, ${Object.keys(games).length} games with data, ` +
        `favs=${Object.values(fav).reduce((a, b) => a + b, 0)} plays=${Object.values(play).reduce((a, b) => a + b, 0)}`);
}

main().catch(e => { console.error('build-ranking failed:', e.message); process.exit(1); });
