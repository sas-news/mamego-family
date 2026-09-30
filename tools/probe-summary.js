// バッチ診断: 各ファイルの模擬対局ダイナミクスをJSONサマリで出力
// node tools/probe-summary.js [--plies 600] file1.html file2.html ...
const fs = require('fs');
const vm = require('vm');
const path = require('path');

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
        width: 68, height: 68, style: {}, dataset: {},
        classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
        addEventListener() {}, appendChild() {},
        querySelectorAll: () => [], querySelector: () => null,
        getContext: () => makeCtx(),
        getBoundingClientRect: () => ({ width: 500, height: 500, left: 0, top: 0 }),
        textContent: '', innerHTML: '', value: '', disabled: false, title: '',
    };
}
function loadSandbox(file) {
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const m = html.match(/<script>([\s\S]*?)<\/script>/);
    if (!m) throw new Error(file + ': inline <script> not found');
    const store = {};
    const sandbox = {
        document: {
            getElementById: () => makeEl(),
            querySelectorAll: () => [], createElement: () => makeEl(),
            addEventListener: () => {}, activeElement: null, body: makeEl(),
        },
        window: { addEventListener: () => {}, devicePixelRatio: 1 },
        localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
        sessionStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, removeItem: k => { delete store[k]; } },
        console,
        setTimeout: () => 1, clearTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
        requestAnimationFrame: () => {}, performance: { now: () => Date.now() }, Date,
        Math, JSON, Object, Array, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite,
    };
    vm.createContext(sandbox);
    vm.runInContext(m[1], sandbox, { filename: file + '<script>', timeout: 15000 });
    if (typeof sandbox.window.onload === 'function') {
        vm.runInContext('window.onload()', sandbox, { timeout: 15000 });
    }
    return sandbox;
}

const SRC = `
(function (MAX_PLIES) {
    const R = { plies: 0, passes: 0, noOpPasses: 0, errors: [], ended: null,
        stonesMin: 1e9, stonesMax: 0, stonesEnd: 0, emptyEnd: 0, cap1: 0, cap2: 0,
        turnParity: {1: 0, 2: 0}, firstZero: null, lastMoves: [] };
    function stones() { return board.filter(v => v === 1 || v === 2).length; }
    try {
        if (typeof resetGame === 'function') resetGame();
        gamePhase = 'playing'; gameMode = 'local';
        let noopStreak = 0;
        for (let ply = 0; ply < MAX_PLIES; ply++) {
            if (gameOver) { R.ended = 'gameOver'; break; }
            if (gamePhase !== 'playing') { R.ended = gamePhase; break; }
            const mover = turn;
            let m;
            try { m = evaluateBestAiMove(); }
            catch (e) { R.errors.push('eval@' + ply + ':' + e.message); break; }
            if (!m) {
                const cpBefore = (typeof consecutivePasses === 'number') ? consecutivePasses : -1;
                try { handlePass(); } catch (e) { R.errors.push('pass@' + ply + ':' + e.message); break; }
                R.passes++;
                const cpAfter = (typeof consecutivePasses === 'number') ? consecutivePasses : -1;
                if (cpAfter === cpBefore && turn === mover) { R.noOpPasses++; noopStreak++; if (noopStreak > 40) { R.ended = 'NOOP-PASS-LOOP'; break; } }
                else noopStreak = 0;
                continue;
            }
            noopStreak = 0;
            try { executeMove({ cells: m.cells, type: m.type, rot: m.rot }, mover); }
            catch (e) { R.errors.push('exec@' + ply + ':' + e.message); break; }
            R.plies++;
            R.turnParity[mover]++;
            const s = stones();
            if (s < R.stonesMin) R.stonesMin = s;
            if (s > R.stonesMax) R.stonesMax = s;
            if (s === 0 && R.firstZero === null) R.firstZero = ply;
            if (R.lastMoves.length >= 5) R.lastMoves.shift();
            R.lastMoves.push(ply + ':P' + mover + ':' + s + 'st');
        }
        R.stonesEnd = stones();
        R.emptyEnd = board.filter(v => v === 0).length;
        if (typeof captures !== 'undefined' && captures) { R.cap1 = captures[1] || 0; R.cap2 = captures[2] || 0; }
        if (!R.ended) R.ended = (gameOver ? 'gameOver' : gamePhase !== 'playing' ? gamePhase : 'HIT-CAP');
    } catch (e) { R.errors.push('boot:' + e.message); }
    return R;
})`;

const args = process.argv.slice(2);
const plies = parseInt(args[args.indexOf('--plies') + 1] || '600', 10);
const files = args.filter(a => a.endsWith('.html'));
for (const f of files) {
    try {
        const sb = loadSandbox(f);
        const r = vm.runInContext(`${SRC}(${plies})`, sb, { timeout: 120000 });
        console.log(f + ' ' + JSON.stringify(r));
    } catch (e) {
        console.log(f + ' FATAL ' + e.message);
    }
}
