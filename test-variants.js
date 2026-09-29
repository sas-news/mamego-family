// 派生バリアント各HTMLのスクリプトを vm サンドボックスで実行し、
// 起動 + 各バリアント固有ルールのスモークテストを行う (DOM はスタブ化)。
// 使い方: node test-variants.js
const fs = require('fs');
const vm = require('vm');
const path = require('path');

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

function makeEl() {
    return {
        width: 68, height: 68,
        style: {},
        dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener() {},
        appendChild() {},
        querySelectorAll: () => [],
        querySelector: () => null,
        getContext: () => makeCtx(),
        getBoundingClientRect: () => ({ width: 500, height: 500, left: 0, top: 0 }),
        textContent: '', innerHTML: '', value: '', disabled: false, title: '',
    };
}

function loadSandbox(file) {
    const html = fs.readFileSync(path.join(__dirname, file), 'utf8');
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) throw new Error(file + ': inline <script> not found');
    const store = {};
    const sandbox = {
        document: {
            getElementById: () => makeEl(),
            querySelectorAll: () => [],
            createElement: () => makeEl(),
            addEventListener: () => {},
            activeElement: null,
        },
        window: { addEventListener: () => {}, devicePixelRatio: 1 },
        sessionStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        console,
        setTimeout: () => 1, clearTimeout: () => {},
        setInterval: () => 1, clearInterval: () => {},
        requestAnimationFrame: () => {},
    };
    vm.createContext(sandbox);
    vm.runInContext(m[1], sandbox, { filename: file + '<script>' });
    if (typeof sandbox.window.onload === 'function') sandbox.window.onload();
    return sandbox;
}

// ---- バリアント別テスト本体 (各ファイルのグローバルで実行される) ----
const SPECS = {
    'pengo.html': `
        assert('ペントミノ12種', Object.keys(ORIENTATIONS).length === 12);
        assert('PIECE_SIZE=5', PIECE_SIZE === 5);
        assert('全形5セル', PIECE_TYPES.every(t => ORIENTATIONS[t].every(s => s.length === 5)));
        resetGame();
        board.fill(1); board[0]=0; board[1]=0; board[BOARD_SIZE]=0; board[BOARD_SIZE+1]=0;
        assert('4マス空領域は窒息(5未満)', computeDeadMask(board)[0] === 1);
        board[2]=0; board[BOARD_SIZE+2]=0; // 2x3=6マスに拡張
        assert('6マス空領域は生存', computeDeadMask(board)[0] === 0);
    `,
    'torusgo.html': `
        const N = BOARD_SIZE;
        assert('左端→右端wrap', getNeighbors(0).includes(N - 1));
        assert('上端→下端wrap', getNeighbors(0).includes((N - 1) * N));
        assert('中央は通常4近傍', getNeighbors(4 * N + 4).length === 4);
        resetGame();
        assert('wrap重複セルは不可', isValidPlacement([{x:0,y:0},{x:0,y:0}], 1) === false);
        assert('通常配置は可', isValidPlacement([{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 1) === true);
    `,
    'decaygo.html': `
        assert('DECAY_LIMIT定義', typeof DECAY_LIMIT === 'number' && DECAY_LIMIT > 0);
        resetGame();
        for (let k = 0; k < BOARD_SIZE; k++) {
            executeMove({ cells: [{x:0,y:k},{x:1,y:k},{x:2,y:k},{x:3,y:k}], type: 'I', rot: 0 }, k % 2 + 1);
        }
        assert('9手後に最初の石が崩壊', board[0] === 0 && board[3] === 0);
        assert('直前に置いた石は残存', board[8 * BOARD_SIZE] !== 0 && board[8 * BOARD_SIZE + 3] !== 0);
        assert('ages永続化あり', typeof ages !== 'undefined' && ages.length === board.length);
    `,
    'lifego.html': `
        assert('applyLifeStep存在', typeof applyLifeStep === 'function');
        resetGame();
        board.fill(0);
        // 直行近傍ルールでは 2x2 ブロックが定常 (各セル2近傍で生存)
        const c = 4;
        board[c * BOARD_SIZE + c] = 1; board[c * BOARD_SIZE + c + 1] = 1;
        board[(c + 1) * BOARD_SIZE + c] = 1; board[(c + 1) * BOARD_SIZE + c + 1] = 1;
        applyLifeStep();
        assert('2x2ブロックは定常で残る',
            board[c * BOARD_SIZE + c] === 1 && board[c * BOARD_SIZE + c + 1] === 1
            && board[(c + 1) * BOARD_SIZE + c] === 1 && board[(c + 1) * BOARD_SIZE + c + 1] === 1);
        board.fill(0);
        board[0] = 1; // 孤立石は過疎死
        applyLifeStep();
        assert('孤立石は消える', board[0] === 0);
    `,
    'rushgo.html': `
        assert('タイマーAPI', typeof armMoveTimer === 'function' && typeof clearMoveTimer === 'function');
        resetGame();
        timeLimit = 5;
        updateUI();
        assert('制限時間設定でタイマー作動', moveTimerInterval !== null);
        clearMoveTimer();
        timeLimit = 0;
    `,
    'cyclogo.html': `
        assert('シクロ7種', Object.keys(ORIENTATIONS).length === 7);
        assert('シクロブタン=1向き', ORIENTATIONS.CYCLOBUTANE.length === 1);
        assert('ナフタレン定義', MOLECULES.NAPHTHALENE.atoms.length === 8);
        resetGame();
        assert('シクロブタン(2x2)配置可',
            isValidPlacement([{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], 1) === true);
    `,
    'alkenego.html': `
        assert('不飽和7種', Object.keys(ORIENTATIONS).length === 7);
        assert('全分子1向き(回転不可)', PIECE_TYPES.every(t => ORIENTATIONS[t].length === 1));
        assert('DBONDS定義', typeof DBONDS === 'object' && DBONDS.BUTYNE.length === 1 && DBONDS.BUTADIENE.length === 2);
        assert('回転ボタン無効', btnRotate.disabled === true);
    `,
    'polygo.html': `
        assert('MONOMERS=4', MONOMERS === 4);
        assert('chainCells配列', Array.isArray(chainCells));
        resetGame();
        chainCells = [{x:2,y:2},{x:3,y:2},{x:3,y:3},{x:4,y:3}];
        assert('4連鎖は合法配置', isValidPlacement(chainCells, 1) === true);
        const mv = evaluateBestAiMove();
        assert('AIが4セル鎖を返す', mv && mv.cells.length === 4);
    `,
    '3dgo.html': `
        assert('LAYERS=3', LAYERS === 3);
        assert('盤面3層分', board.length === BOARD_SIZE * BOARD_SIZE * 3);
        assert('中層中央は6近傍', getNeighbors(cellIndex({x:4,y:4,z:1})).length === 6);
        assert('上層は5近傍', getNeighbors(cellIndex({x:4,y:4,z:0})).length === 5);
        resetGame();
        const w = cellIndex({x:4,y:4,z:0});
        board[w] = 2;
        [[3,4,0],[5,4,0],[4,3,0],[4,5,0]].forEach(([x,y,z]) => board[cellIndex({x,y,z})] = 1);
        assert('層内だけでは取れない(上層が呼吸点)', getCapturedStones(board, 2).length === 0);
        board[cellIndex({x:4,y:4,z:1})] = 1;
        assert('垂直呼吸点を塞ぐと取れる', getCapturedStones(board, 2).length === 1);
    `,
    'asymgo.html': `
        assert('黒セットIOT', JSON.stringify(PLAYER_PIECES[1]) === JSON.stringify(['I','O','T']));
        assert('白セットLJSZ', JSON.stringify(PLAYER_PIECES[2]) === JSON.stringify(['L','J','S','Z']));
        resetGame();
        assert('黒の手番ピースは黒セット', PLAYER_PIECES[1].includes(currentPieceType));
        executeMove({ cells: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], type: currentPieceType, rot: 0 }, 1);
        assert('交代後は白セットから供給', turn === 2 && PLAYER_PIECES[2].includes(currentPieceType));
        assert('白キューは白セットのみ', pieceQueues[2].every(t => PLAYER_PIECES[2].includes(t)));
    `,
    'draftgo.html': `
        resetGame();
        assert('ドラフト開始(7種プール)', draftState !== null && draftState.pool.length === 7);
        applyDraftPick(draftState.pool[0]);
        assert('黒1種獲得→白の番', draftState.picks[1].length === 1 && draftState.turn === 2);
        for (let i = 0; i < 5; i++) applyDraftPick(draftState.pool[0]);
        assert('6ピックでドラフト終了', draftState === null);
        assert('各3種獲得', PLAYER_PIECES[1].length === 3 && PLAYER_PIECES[2].length === 3);
        assert('黒番で対局開始', turn === 1 && PLAYER_PIECES[1].includes(currentPieceType));
    `,
    'graphgo.html': `
        assert('隣接リスト', Array.isArray(ADJ) && ADJ.length === BOARD_SIZE * BOARD_SIZE);
        const seen = new Set([0]), q = [0];
        while (q.length) { for (const m2 of ADJ[q.pop()]) { if (!seen.has(m2)) { seen.add(m2); q.push(m2); } } }
        assert('盤面グラフは連結', seen.size === BOARD_SIZE * BOARD_SIZE);
        assert('辺が除去されている', graphRemoved.length > 0);
        const e = gridEdges()[graphRemoved[0]];
        const ca = { x: e[0] % BOARD_SIZE, y: (e[0] / BOARD_SIZE) | 0 };
        const cb = { x: e[1] % BOARD_SIZE, y: (e[1] / BOARD_SIZE) | 0 };
        assert('除去辺はhasEdge=偽', hasEdge(e[0], e[1]) === false);
        assert('切断辺を跨ぐ配置は不可', isValidPlacement([ca, cb], 1) === false);
        const fi = gridEdges().findIndex((_, i) => !graphRemoved.includes(i));
        const f = gridEdges()[fi];
        const fa = { x: f[0] % BOARD_SIZE, y: (f[0] / BOARD_SIZE) | 0 };
        const fb = { x: f[1] % BOARD_SIZE, y: (f[1] / BOARD_SIZE) | 0 };
        assert('有効辺上の配置は可', isValidPlacement([fa, fb], 1) === true);
    `,
};

let total = 0, failed = 0;
for (const [file, src] of Object.entries(SPECS)) {
    let sandbox;
    try {
        sandbox = loadSandbox(file);
    } catch (e) {
        console.log(`FAIL  ${file}: boot error — ${e.message}`);
        failed++; continue;
    }
    let results;
    try {
        results = JSON.parse(vm.runInContext(
            `JSON.stringify((() => { const r = []; function assert(n, c) { r.push([n, !!c]); }
            try { ${src} } catch (e) { r.push(['runtime error: ' + e.message, false]); } return r; })())`,
            sandbox));
    } catch (e) {
        console.log(`FAIL  ${file}: test crash — ${e.message}`);
        failed++; continue;
    }
    for (const [name, ok] of results) {
        total++;
        console.log(`${ok ? 'PASS' : 'FAIL'}  [${file}] ${name}`);
        if (!ok) failed++;
    }
}
console.log(`\n${total - failed}/${total} checks passed`);
process.exit(failed ? 1 : 0);
