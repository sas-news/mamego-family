// 診断プローブ: 1ファイルを1局シミュレートし、各plyの出来事を要約出力する。
// 使い方: node tools/probe-game.js [--plies 600] [--dump-moves] file.html
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
    const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
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
            body: makeEl(),
        },
        window: { addEventListener: () => {}, devicePixelRatio: 1 },
        localStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        sessionStorage: {
            getItem: k => (k in store ? store[k] : null),
            setItem: (k, v) => { store[k] = String(v); },
            removeItem: k => { delete store[k]; },
        },
        console,
        setTimeout: () => 1, clearTimeout: () => {},
        setInterval: () => 1, clearInterval: () => {},
        requestAnimationFrame: () => {},
        performance: { now: () => Date.now() },
        Date,
        Math, JSON, Object, Array, Set, Map, Number, String, Boolean, parseInt, parseFloat, isNaN, isFinite,
    };
    vm.createContext(sandbox);
    vm.runInContext(m[1], sandbox, { filename: file + '<script>', timeout: 15000 });
    if (typeof sandbox.window.onload === 'function') {
        vm.runInContext('window.onload()', sandbox, { timeout: 15000 });
    }
    return sandbox;
}

const args = process.argv.slice(2);
const file = args.find(a => a.endsWith('.html'));
const plies = parseInt(args[args.indexOf('--plies') + 1] || '600', 10);
const dumpMoves = args.includes('--dump-moves');

const sandbox = loadSandbox(file);

// サンドボックス内診断
const SRC = `
(function (MAX_PLIES, DUMP) {
    const out = [];
    function stones() { return board.filter(v => v === 1 || v === 2).length; }
    function empt() { return board.filter(v => v === 0).length; }
    try {
        if (typeof resetGame === 'function') resetGame();
        gamePhase = 'playing'; gameMode = 'local';
        let passStreak = 0;
        for (let ply = 0; ply < MAX_PLIES; ply++) {
            if (gameOver) { out.push('[' + ply + '] gameOver'); break; }
            if (gamePhase !== 'playing') { out.push('[' + ply + '] phase=' + gamePhase); break; }
            let m;
            try { m = evaluateBestAiMove(); }
            catch (e) { out.push('[' + ply + '] EVAL-ERR ' + e.message); break; }
            const mover = turn;
            if (!m) {
                try { handlePass(); }
                catch (e) { out.push('[' + ply + '] PASS-ERR ' + e.message); break; }
                passStreak++;
                out.push('[' + ply + '] pass P' + mover + ' (streak ' + passStreak + ', cp=' + (typeof consecutivePasses !== 'undefined' ? consecutivePasses : '?') + ') phase=' + gamePhase);
                if (passStreak > 30) { out.push('...pass loop, stopping'); break; }
                continue;
            }
            passStreak = 0;
            let err = null;
            try { executeMove({ cells: m.cells, type: m.type, rot: m.rot }, mover); }
            catch (e) { err = e.message; }
            if (err) { out.push('[' + ply + '] EXEC-ERR ' + err); break; }
            if (DUMP || ply < 8 || ply % 25 === 0 || ply > MAX_PLIES - 5) {
                out.push('[' + ply + '] P' + mover + ' move ' + m.type + ' ' + JSON.stringify(m.cells).slice(0, 60)
                    + ' stones=' + stones() + ' empty=' + empt()
                    + ' cap1=' + (captures ? captures[1] : '?') + ' cap2=' + (captures ? captures[2] : '?')
                    + ' turn=' + turn + ' phase=' + gamePhase + ' over=' + gameOver);
            }
        }
        out.push('END: phase=' + gamePhase + ' over=' + gameOver + ' stones=' + stones() + ' empty=' + empt()
            + ' cap1=' + (captures ? captures[1] : '?') + ' cap2=' + (captures ? captures[2] : '?'));
    } catch (e) { out.push('BOOT-ERR ' + e.message + '\\n' + (e.stack || '')); }
    return out;
})`;

const lines = vm.runInContext(`${SRC}(${plies}, ${dumpMoves})`, sandbox, { timeout: 60000 });
console.log(lines.join('\n'));
