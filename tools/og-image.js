// og-image.js — games.json の全ゲーム分の OGP画像 (1200x630 PNG) を og/ に生成する。
// 使い方: node tools/og-image.js           (存在しない分だけ生成)
//         OG_FORCE=1 node tools/og-image.js (全再生成)
// 必要: npm install (devDependency canvas)。日本語は CJKフォントが見つかれば描画。
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'docs', 'og');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs', 'games.json'), 'utf8'));

let createCanvas;
try { ({ createCanvas, registerFont } = require('canvas')); }
catch (e) {
    console.error('node-canvas がありません: npm install を実行してください');
    process.exit(1);
}
const { drawIcon } = require('../icon-draw.js');

// ---- フォント探索 (環境差を吸収) ----
const FONT_CANDIDATES = [
    process.env.MAMEGO_OG_FONT,
    '/home/ubuntu/.local/share/fonts/NotoSansCJKjp-Regular.otf',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
    '/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc',
    '/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc',
    path.join(ROOT, 'assets/fonts/NotoSansCJKjp-Regular.otf'),
].filter(Boolean);
let jpFont = null;
for (const f of FONT_CANDIDATES) {
    if (fs.existsSync(f)) {
        try { registerFont(f, { family: 'MamegoJP' }); jpFont = 'MamegoJP'; break; }
        catch (e) { /* 次の候補へ */ }
    }
}
const JP = jpFont ? `"${jpFont}", ` : '';
const BG = '#f4e4bc', INK = '#3e2211', SUB = '#8a5a2b', FRAME = '#cbb07a';

function iconCanvas(kind, size) {
    const c = createCanvas(size, size);
    const x = c.getContext('2d');
    x.fillStyle = '#e8c88b';
    x.fillRect(0, 0, size, size);
    try { drawIcon(x, kind, size); } catch (e) { /* kind不明でも枠だけ出す */ }
    return c;
}

function drawBase() {
    const c = createCanvas(1200, 630);
    const x = c.getContext('2d');
    x.fillStyle = BG;
    x.fillRect(0, 0, 1200, 630);
    x.strokeStyle = FRAME; x.lineWidth = 3;
    x.strokeRect(18, 18, 1164, 594);
    x.strokeRect(24, 24, 1152, 582);
    return [c, x];
}

function gameCard(g) {
    const [c, x] = drawBase();
    // アイコン (左)
    x.drawImage(iconCanvas(g.icon || g.kind, 340), 78, 145);
    x.strokeStyle = FRAME; x.lineWidth = 4;
    x.strokeRect(78, 145, 340, 340);
    // テキスト (右)
    x.fillStyle = SUB;
    x.font = `700 30px ${JP}sans-serif`;
    x.fillText(jpFont ? '変則碁シリーズ' : 'MAMEGO family', 490, 180);
    x.fillStyle = INK;
    const enSize = g.name.length > 12 ? 58 : 76;
    x.font = `800 ${enSize}px "DejaVu Sans", sans-serif`;
    x.fillText(g.name, 486, 270);
    if (jpFont) {
        x.fillStyle = SUB;
        x.font = `400 52px ${JP}sans-serif`;
        x.fillText(g.jp, 490, 352);
    }
    // 説明 (1行に丸める。CJKフォントが無い環境では省略)
    if (jpFont) {
        x.fillStyle = INK;
        x.font = `400 28px ${JP}sans-serif`;
        const desc = String(g.desc || '');
        x.fillText(desc.length > 26 ? desc.slice(0, 25) + '…' : desc, 490, 430);
    }
    // フッター
    x.fillStyle = SUB;
    x.font = `400 24px ${JP}sans-serif`;
    x.fillText(jpFont
        ? `全${manifest.count}種の変則囲碁 · sas-news.github.io/mamego-family`
        : `${manifest.count} variant Go games · sas-news.github.io/mamego-family`, 490, 530);
    return c;
}

function indexCard() {
    const [c, x] = drawBase();
    x.drawImage(iconCanvas('mame', 300), 90, 165);
    x.strokeStyle = FRAME; x.lineWidth = 4;
    x.strokeRect(90, 165, 300, 300);
    x.fillStyle = INK;
    x.font = `800 88px ${JP}"DejaVu Sans", sans-serif`;
    x.fillText(jpFont ? '変則碁シリーズ' : 'MAMEGO', 440, 250);
    x.fillStyle = SUB;
    x.font = `700 44px "DejaVu Sans", sans-serif`;
    x.fillText(jpFont ? 'MAMEGO family' : 'family', 446, 330);
    x.fillStyle = INK;
    x.font = `400 34px ${JP}sans-serif`;
    x.fillText(jpFont
        ? `碁のルールを変えたブラウザゲーム集 · 全${manifest.count}種`
        : `a collection of variant Go games · ${manifest.count} games`, 446, 430);
    x.fillStyle = SUB;
    x.font = `400 26px ${JP}sans-serif`;
    x.fillText('sas-news.github.io/mamego-family', 446, 500);
    return c;
}

// ImageMagick があれば PNG8 (パレット化) に圧縮する。無ければ生PNGのまま。
let hasConvert = false;
try { execSync('convert -version', { stdio: 'ignore' }); hasConvert = true; } catch (e) {}
const RAW = path.join(OUT, '.raw');
function writeCard(outName, canvas) {
    const out = path.join(OUT, outName);
    if (hasConvert) {
        fs.mkdirSync(RAW, { recursive: true });
        const raw = path.join(RAW, outName);
        fs.writeFileSync(raw, canvas.toBuffer('image/png'));
        execSync(`convert ${JSON.stringify(raw)} -colors 128 PNG8:${JSON.stringify(out)}`);
        fs.unlinkSync(raw);
    } else {
        fs.writeFileSync(out, canvas.toBuffer('image/png'));
    }
}

fs.mkdirSync(OUT, { recursive: true });
const force = !!process.env.OG_FORCE;
let made = 0, skipped = 0;
for (const g of manifest.games) {
    const out = path.join(OUT, `${g.slug}.png`);
    if (!force && fs.existsSync(out)) { skipped++; continue; }
    writeCard(`${g.slug}.png`, gameCard(g));
    made++;
}
const idx = path.join(OUT, 'index.png');
if (force || !fs.existsSync(idx)) { writeCard('index.png', indexCard()); made++; }
try { fs.rmdirSync(RAW); } catch (e) {}
console.log(`og-image: generated=${made} skipped=${skipped} jpFont=${jpFont || 'none'}`);
