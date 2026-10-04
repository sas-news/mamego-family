// tetogo.html (TETOGO) 内のスクリプトを vm サンドボックスで実行し、
// ルール判定ロジックを直接テストする (DOM はスタブ化)。
// 使い方: node test-logic.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'docs', 'tetogo.html'), 'utf8');
// <script src=...> ではないインラインスクリプトを抽出
const m = html.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('inline <script> not found'); process.exit(1); }

// CanvasRenderingContext2D スタブ: メソッド呼び出しは別スタブを返す
// (createRadialGradient().addColorStop 等に対応)。プロパティ代入は保持。
function makeCtx() {
    return new Proxy({}, {
        get: (t, p) => {
            if (!(p in t)) t[p] = function () { return makeCtx(); };
            return t[p];
        },
        set: (t, p, v) => { t[p] = v; return true; },
    });
}

// DOM要素スタブ (canvas兼用: 数値のwidth/heightとgetBoundingClientRectが必要)
function makeEl() {
    return {
        width: 68, height: 68,
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener() {},
        appendChild() {},
        getContext: () => makeCtx(),
        getBoundingClientRect: () => ({ width: 500, height: 500, left: 0, top: 0 }),
        textContent: '', innerHTML: '', value: '', disabled: false, title: '',
    };
}

// sessionStorage スタブ (インメモリ)
const sessionStorageStub = (() => {
    const m = {};
    return {
        getItem: k => (k in m ? m[k] : null),
        setItem: (k, v) => { m[k] = String(v); },
        removeItem: k => { delete m[k]; },
    };
})();

const sandbox = {
    document: {
        getElementById: () => makeEl(),
        querySelectorAll: () => [],
        createElement: () => makeEl(),
        addEventListener: () => {},
        activeElement: null,
    },
    window: { addEventListener: () => {}, devicePixelRatio: 1 },
    sessionStorage: sessionStorageStub,
    performance: { now: () => Date.now() },
    requestAnimationFrame: () => {},
    console,
};
vm.createContext(sandbox);
vm.runInContext(m[1], sandbox, { filename: 'index.html<script>' });

// 2本目のスクリプトとしてテストを実行 (トップレベルの let/const/function が見える)
const testSrc = `
const results = [];
function assert(name, cond) { results.push([name, !!cond]); }
const I = (x, y) => y * BOARD_SIZE + x;

// --- 1. 回転バリエーション ---
assert('I=2種', ORIENTATIONS.I.length === 2);
assert('O=1種', ORIENTATIONS.O.length === 1);
assert('T=4種', ORIENTATIONS.T.length === 4);
assert('L=4種', ORIENTATIONS.L.length === 4);
assert('J=4種', ORIENTATIONS.J.length === 4);
assert('S=2種', ORIENTATIONS.S.length === 2);
assert('Z=2種', ORIENTATIONS.Z.length === 2);
assert('全ピース4セル', PIECE_TYPES.every(t => ORIENTATIONS[t].every(s => s.length === 4)));

// --- 2. 窒息領域 (4マス未満の空領域) ---
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
let mask = computeDeadMask(board);
assert('空盤に窒息領域なし', mask.every(v => v === 0));

board = Array(BOARD_SIZE * BOARD_SIZE).fill(1);
board[I(0,0)] = 0; board[I(1,0)] = 0; board[I(2,0)] = 0; // 3マスの空領域
mask = computeDeadMask(board);
assert('3マス領域は窒息', mask[I(0,0)] === 1 && mask[I(1,0)] === 1 && mask[I(2,0)] === 1);

board[I(3,0)] = 0; // 4マスに拡張
mask = computeDeadMask(board);
assert('4マス領域は生存空点', mask[I(0,0)] === 0 && mask[I(3,0)] === 0);

// --- 3. 取り (呼吸点なし=取られる) ---
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
board[I(4,4)] = 2; // 白1石
board[I(3,4)] = 1; board[I(5,4)] = 1; board[I(4,3)] = 1; board[I(4,5)] = 1; // 黒で四方囲む
assert('四方囲まれた白石は取られる', getCapturedStones(board, 2).length === 1);

// 窒息領域しか接していない白グループは死ぬ (テトリス碁特有ルール)
board = Array(BOARD_SIZE * BOARD_SIZE).fill(1);
board[I(0,0)] = 0; board[I(1,0)] = 0; board[I(2,0)] = 0; // 3マス窒息領域
board[I(0,1)] = 2; // 白石は窒息領域と黒にのみ接する
assert('窒息領域のみに接する白石は死ぬ', getCapturedStones(board, 2).length === 1);

// --- 4. 着手判定 ---
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
prevBoard = null;
assert('空盤へのO配置は合法', isValidPlacement(
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 1) === true);
board[I(0,0)] = 2;
assert('占有マスへの重複配置は禁止', isValidPlacement(
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 1) === false);
assert('盤外はみ出しは禁止', isValidPlacement(
    [{x:8,y:0},{x:9,y:0},{x:8,y:1},{x:9,y:1}], 1) === false);

// 自殺手: 黒の壁に囲まれた2x2空領域へ白Oを置く (黒は外側に十分な呼吸点を持つ)
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
board[I(2,0)] = 1; board[I(2,1)] = 1; board[I(0,2)] = 1; board[I(1,2)] = 1; board[I(2,2)] = 1;
assert('囲まれた2x2を埋める白の自殺手は禁止', isValidPlacement(
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 2) === false);
assert('同じ2x2への黒O配置は連結により合法', isValidPlacement(
    [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 1) === true);

// 取りになる手は合法
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
board[I(0,0)] = 2; // 白の孤立石 (呼吸点: (1,0),(0,1))
assert('白石の呼吸点を全て塞ぐS配置は合法(取り)', isValidPlacement(
    [{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1}], 1) === true);

// --- 5. 配置位置の決定 (タップ位置 -> 平行移動) ---
currentPieceType = 'O'; currentRot = 0;
const pl = getPlacementAt(0.1, 0.1);
assert('Oピースは左上に吸着', pl.cells.length === 4 &&
    Math.min(...pl.cells.map(p => p.x)) === 0 && Math.min(...pl.cells.map(p => p.y)) === 0);
const plT = (() => { currentPieceType = 'T'; currentRot = 0; return getPlacementAt(4.0, 4.0); })();
assert('Tピースの重心がタップ位置近傍', plT.cells.some(p => p.x === 4 && p.y === 4) ||
    Math.abs(plT.cells.reduce((s,p)=>s+p.x,0)/4 - 4) <= 1);

// --- 6. ネクスト供給 (7種1巡) ---
pieceQueue = [];
const seen = new Set();
for (let i = 0; i < 7; i++) seen.add(drawNextPiece());
assert('7種1巡で7種すべて出る', seen.size === 7 && pieceQueue.length === 0);

// --- 7. 実着手フロー (executeMove: 配置・取り・手番交代) ---
gameMode = 'local'; pieceMode = 'next';
resetGame();
assert('リセットで手番=黒', turn === 1 && pieces.length === 0);
executeMove({ cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}], type: 'I', rot: 0 }, 1);
assert('I配置で4石置き手番交代', board[I(0,0)] === 1 && board[I(3,0)] === 1 && turn === 2 && pieces.length === 1);

// 白の孤立石を黒ピースで包囲して取る
resetGame();
board = Array(BOARD_SIZE * BOARD_SIZE).fill(0);
board[I(0,0)] = 2;
pieces = [{ id: 1, player: 2, type: 'x', rot: 0, cells: [{x:0,y:0}] }];
executeMove({ cells: [{x:1,y:0},{x:2,y:0},{x:0,y:1},{x:1,y:1}], type: 'S', rot: 0 }, 1);
assert('ピース配置で白石を取る', board[I(0,0)] === 0 && captures[1] === 1);

// --- 8. パス2連続 -> 死に石フェーズ ---
resetGame();
handlePass(); handlePass();
assert('パス2連続で死に石選択へ', gamePhase === 'dead_stone_selection');
gamePhase = 'playing'; consecutivePasses = 0;

// --- 9. 地計算 ---
resetGame();
let t = calculateTerritory();
assert('空盤は地0', t.black === 0 && t.white === 0);

// 黒の壁に囲まれた2x2空領域 (外側は白で埋め、外部領域が黒だけに接しないようする)
board = Array(BOARD_SIZE * BOARD_SIZE).fill(2);
board[I(0,0)] = 0; board[I(1,0)] = 0; board[I(0,1)] = 0; board[I(1,1)] = 0;
board[I(2,0)] = 1; board[I(2,1)] = 1; board[I(0,2)] = 1; board[I(1,2)] = 1; board[I(2,2)] = 1;
t = calculateTerritory();
assert('囲んだ2x2は黒地4', t.black === 4 && t.white === 0);

// 3マスの空領域は窒息領域なので地にならない
board = Array(BOARD_SIZE * BOARD_SIZE).fill(2);
board[I(0,0)] = 0; board[I(1,0)] = 0; board[I(0,1)] = 0; // L型3マス
board[I(2,0)] = 1; board[I(1,1)] = 1; board[I(0,2)] = 1; // 黒の壁
t = calculateTerritory();
assert('3マス窒息領域は地にならない', t.black === 0 && t.white === 0);

// --- 10. 1手戻る ---
resetGame();
assert('初期状態では戻れない', canUndo() === false);
executeMove({ cells: [{x:4,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4}], type: 'I', rot: 0 }, 1);
assert('着手後は戻れる', canUndo() === true);
undoMove();
assert('巻き戻しで盤面が空に戻る', board.every(v => v === 0) && pieces.length === 0 && turn === 1);

resetGame();
executeMove({ cells: [{x:4,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4}], type: 'I', rot: 0 }, 1);
handlePass(); // 白がパス -> 黒手番
assert('直前アクションがパスなら戻れない', canUndo() === false);

// --- 11. セーブ/ロード ---
resetGame();
executeMove({ cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0},{x:3,y:0}], type: 'I', rot: 0 }, 1);
saveState();
board.fill(0); pieces = []; turn = 1; // 状態を壊す
assert('loadStateで盤面・手番・ピースが復元',
    loadState() === true && board[I(0,0)] === 1 && turn === 2 && pieces.length === 1 && history.length === 1);

// --- 12. ホールド (ネクストモードのみ・1手につき1回) ---
gameMode = 'local'; pieceMode = 'next';
resetGame();
const h1 = currentPieceType;
holdPiece();
assert('初回ホールド: 保持+新ピース供給',
    heldPieces[1] === h1 && currentPieceType !== h1 && holdUsed === true);
const h2 = currentPieceType;
holdPiece();
assert('1手につきホールドは1回まで', currentPieceType === h2 && heldPieces[1] === h1);
executeMove({ cells: [{x:4,y:4},{x:5,y:4},{x:6,y:4},{x:7,y:4}], type: h2, rot: 0 }, 1);
assert('着手でホールド権利が戻る', holdUsed === false);
// 白(2P)のホールド枠は黒とは独立
const h3 = currentPieceType;
holdPiece();
assert('ホールド枠はプレイヤー別', heldPieces[2] === h3 && heldPieces[1] === h1);
executeMove({ cells: [{x:4,y:8},{x:5,y:8},{x:6,y:8},{x:7,y:8}], type: 'I', rot: 0 }, 2);
// 黒手番: 保持済みなら交換になる
const h4 = currentPieceType;
holdPiece();
assert('2回目ホールドは保持ピースと交換', currentPieceType === h1 && heldPieces[1] === h4);

JSON.stringify(results);
`;

const out = JSON.parse(vm.runInContext(testSrc, sandbox));
let fail = 0;
out.forEach(([name, ok]) => {
    console.log((ok ? 'PASS' : 'FAIL') + '  ' + name);
    if (!ok) fail++;
});
console.log(`\n${out.length - fail}/${out.length} passed`);
process.exit(fail ? 1 : 0);
