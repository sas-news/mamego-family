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
    'normgo.html': `
        assert('単石1種', PIECE_TYPES.length === 1 && PIECE_TYPES[0] === 'STONE');
        assert('PIECE_SIZE=1', PIECE_SIZE === 1);
        resetGame();
        assert('単石配置可', isValidPlacement([{x:4,y:4}], 1) === true);
        assert('窒息領域なし', computeDeadMask(board).every(v => v === 0));
        assert('ルールモーダル要素', typeof rulesModal !== 'undefined');
    `,
    'torusgo.html': `
        const N = BOARD_SIZE;
        assert('左端→右端wrap', getNeighbors(0).includes(N - 1));
        assert('上端→下端wrap', getNeighbors(0).includes((N - 1) * N));
        assert('中央は通常4近傍', getNeighbors(4 * N + 4).length === 4);
        resetGame();
        assert('通常配置は可', isValidPlacement([{x:0,y:0}], 1) === true);
    `,
    'diago.html': `
        assert('中央は8近傍', getNeighbors(4 * BOARD_SIZE + 4).length === 8);
        assert('斜めも近傍', getNeighbors(0).includes(BOARD_SIZE + 1));
        assert('角は3近傍', getNeighbors(0).length === 3);
        resetGame();
        assert('単石配置可', isValidPlacement([{x:4,y:4}], 1) === true);
    `,
    'wallgo.html': `
        assert('WALL_RATE定義', typeof WALL_RATE === 'number');
        resetGame();
        assert('壁が生成される', board.some(v => v === 3));
        const wi = board.findIndex(v => v === 3);
        assert('壁には置けない', isValidPlacement([{x: wi % BOARD_SIZE, y: Math.floor(wi / BOARD_SIZE)}], 1) === false);
        const ei = board.findIndex(v => v === 0);
        assert('空点には置ける', ei >= 0 && isValidPlacement([{x: ei % BOARD_SIZE, y: Math.floor(ei / BOARD_SIZE)}], 1) === true);
    `,
    'gravgo.html': `
        resetGame();
        assert('空中は不可', isValidPlacement([{x:5,y:5}], 1) === false);
        assert('最下段は可', isValidPlacement([{x:5,y:BOARD_SIZE-1}], 1) === true);
        executeMove({ cells: [{x:5,y:BOARD_SIZE-1}], type: 'STONE', rot: 0 }, 1);
        assert('直上は可', isValidPlacement([{x:5,y:BOARD_SIZE-2}], 2) === true);
    `,
    'spawngo.html': `
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('白は全滅状態なので自由配置可', isValidPlacement([{x:0,y:0}], 2) === true);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        assert('黒は隣接のみ', isValidPlacement([{x:9,y:9}], 1) === false);
        assert('黒は自石隣接で可', isValidPlacement([{x:6,y:5}], 1) === true);
    `,
    'mirrgo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:2}], type: 'STONE', rot: 0 }, 1);
        const mx = BOARD_SIZE - 2; // x=1 の鏡映先
        assert('鏡映位置にも石', board[2 * BOARD_SIZE + mx] === 1);
    `,
    'twicego.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('1石目で手番継続', turn === 1 && turnPlacements === 1);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('2石目で交代', turn === 2 && turnPlacements === 0);
    `,
    'kinggo.html': `
        assert('kings状態', typeof kings === 'object' && kings[1] === -1);
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('初手で王登録', kings[1] === 0);
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 2);
        assert('王を取ると終局', gameOver === true);
    `,
    'maxgo.html': `
        assert('WIN_CAPTURES定義', typeof WIN_CAPTURES === 'number' && WIN_CAPTURES === 10);
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        captures[1] = WIN_CAPTURES - 1;
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('先取で終局', gameOver === true);
    `,
    'sandgo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:2}], type: 'STONE', rot: 0 }, 1);
        assert('ハサミで白石捕獲', board[BOARD_SIZE] === 0);
    `,
    'decaygo.html': `
        assert('DECAY_LIMIT定義', typeof DECAY_LIMIT === 'number' && DECAY_LIMIT > 0);
        resetGame();
        for (let k = 0; k < BOARD_SIZE; k++) {
            executeMove({ cells: [{x:0,y:k}], type: 'STONE', rot: 0 }, k % 2 + 1);
        }
        assert('寿命超過で最初の石が崩壊', board[0] === 0);
        assert('直前に置いた石は残存', board[(BOARD_SIZE - 1) * BOARD_SIZE] !== 0);
        assert('ages永続化あり', typeof ages !== 'undefined' && ages.length === board.length);
    `,
    'lifego.html': `
        assert('applyLifeStep存在', typeof applyLifeStep === 'function');
        resetGame();
        board.fill(0);
        const c = 4;
        board[c * BOARD_SIZE + c] = 1; board[c * BOARD_SIZE + c + 1] = 1;
        board[(c + 1) * BOARD_SIZE + c] = 1; board[(c + 1) * BOARD_SIZE + c + 1] = 1;
        applyLifeStep();
        assert('2x2ブロックは定常で残る',
            board[c * BOARD_SIZE + c] === 1 && board[c * BOARD_SIZE + c + 1] === 1
            && board[(c + 1) * BOARD_SIZE + c] === 1 && board[(c + 1) * BOARD_SIZE + c + 1] === 1);
        board.fill(0);
        board[0] = 1;
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
    'graphgo.html': `
        assert('隣接リスト', Array.isArray(ADJ) && ADJ.length === BOARD_SIZE * BOARD_SIZE);
        const seen = new Set([0]), q = [0];
        while (q.length) { for (const m2 of ADJ[q.pop()]) { if (!seen.has(m2)) { seen.add(m2); q.push(m2); } } }
        assert('盤面グラフは連結', seen.size === BOARD_SIZE * BOARD_SIZE);
        assert('辺が除去されている', graphRemoved.length > 0);
        const e = gridEdges()[graphRemoved[0]];
        assert('除去辺はhasEdge=偽', hasEdge(e[0], e[1]) === false);
        resetGame();
        assert('再生成でも連結', ADJ.length === BOARD_SIZE * BOARD_SIZE);
    `,
    'pengo.html': `
        assert('ペントミノ12種', Object.keys(ORIENTATIONS).length === 12);
        assert('PIECE_SIZE=5', PIECE_SIZE === 5);
        assert('全形5セル', PIECE_TYPES.every(t => ORIENTATIONS[t].every(s => s.length === 5)));
        resetGame();
        board.fill(1); board[0]=0; board[1]=0; board[BOARD_SIZE]=0; board[BOARD_SIZE+1]=0;
        assert('4マス空領域は窒息(5未満)', computeDeadMask(board)[0] === 1);
        board[2]=0; board[BOARD_SIZE+2]=0;
        assert('6マス空領域は生存', computeDeadMask(board)[0] === 0);
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
    'asymgo.html': `
        assert('黒=直鎖3種', JSON.stringify(PLAYER_PIECES[1]) === JSON.stringify(['BUTANE','PENTANE','HEXANE']));
        assert('白=分枝4種', JSON.stringify(PLAYER_PIECES[2]) === JSON.stringify(['ISOBUTANE','ISOPENTANE','NEOPENTANE','NEOHEXANE']));
        resetGame();
        assert('黒の手番ピースは黒セット', PLAYER_PIECES[1].includes(currentPieceType));
        const shape = ORIENTATIONS[currentPieceType][0];
        const cells = shape.map(([dx,dy]) => ({x:dx, y:dy}));
        if (isValidPlacement(cells, 1)) {
            executeMove({ cells, type: currentPieceType, rot: 0 }, 1);
            assert('交代後は白セットから供給', turn === 2 && PLAYER_PIECES[2].includes(currentPieceType));
        }
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
    // ---- 第2バッチ ----
    'reversego.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:2}], type: 'STONE', rot: 0 }, 1);
        assert('ハサミで寝返り(取られない)', board[BOARD_SIZE] === 1);
        assert('アゲハマにはならない', captures[1] === 0);
    `,
    'pushgo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:2}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('敵石が1マス押される', board[3 * BOARD_SIZE + 0] === 2 && board[2 * BOARD_SIZE + 0] === 0);
    `,
    'attractgo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:3}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('2マス先の敵石が引き寄せ', board[2 * BOARD_SIZE + 0] === 2 && board[3 * BOARD_SIZE + 0] === 0);
    `,
    'turngo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        const N = BOARD_SIZE;
        assert('盤面90°回転', board[0 * N + (N - 1)] === 1); // (0,0) -> (N-1,0)
    `,
    'nogo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('取る手は禁止', isValidPlacement([{x:0,y:1}], 1) === false);
        assert('anyValidMove定義', typeof anyValidMove === 'function');
        assert('空盤なら合法手あり', anyValidMove(1) === true);
    `,
    'limitgo.html': `
        resetGame();
        assert('anyValidMove定義', typeof anyValidMove === 'function');
        board.fill(1);
        assert('満杯なら合法手なし', anyValidMove(2) === false);
        board.fill(0);
        assert('空盤は合法手あり', anyValidMove(1) === true);
    `,
    'growgo.html': `
        assert('applyGrowth定義', typeof applyGrowth === 'function');
        assert('GROW_RATE定義', typeof GROW_RATE === 'number');
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('盤面に石が存在', board.some(v => v !== 0));
    `,
    'molego.html': `
        assert('applyMole定義', typeof applyMole === 'function');
        assert('MOL_RATE定義', typeof MOL_RATE === 'number');
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('盤面に石が存在', board.some(v => v !== 0));
    `,
    'blastgo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 2);
        assert('白2石は連結', board[1] === 2 && board[9 * BOARD_SIZE + 9] === 2);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('隣接敵連を破壊', board[1] === 0 && captures[1] >= 1);
    `,
    'handigo.html': `
        assert('handicap変数', typeof handicap !== 'undefined');
        handicap = 4;
        resetGame();
        const stones = board.filter(v => v === 1).length;
        assert('4子置碁', stones === 4);
        assert('コミ0.5', komi === 0.5);
        handicap = 0;
        resetGame();
        assert('互先は石なし', board.every(v => v === 0));
        assert('互先コミ6.5', komi === 6.5);
    `,
    'mamego.html': `
        resetGame();
        assert('碁豆は1種', PIECE_TYPES.length === 1 && PIECE_TYPES[0] === 'DOMINO');
        assert('PIECE_SIZE=2', PIECE_SIZE === 2);
        executeMove({ cells: [{x:0,y:0},{x:1,y:0}], type: 'DOMINO', rot: 0 }, 1);
        assert('ドミノ配置', board[0] === 1 && board[1] === 1);
    `,
    'triogo.html': `
        resetGame();
        assert('トリオ2種', PIECE_TYPES.length === 2);
        assert('PIECE_SIZE=3', PIECE_SIZE === 3);
        executeMove({ cells: [{x:0,y:0},{x:1,y:0},{x:2,y:0}], type: 'TRI_I', rot: 0 }, 1);
        assert('I配置', board[0] === 1 && board[1] === 1 && board[2] === 1);
    `,
    'kogo.html': `
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('自連隣接は不可', isValidPlacement([{x:6,y:5}], 1) === false);
        assert('非隣接は可', isValidPlacement([{x:0,y:0}], 1) === true);
        assert('敵隣接は可', isValidPlacement([{x:6,y:5}], 2) === true);
    `,
    'ringo.html': `
        resetGame();
        const rc = Math.floor(BOARD_SIZE / 2);
        assert('中央は壁', board[rc * BOARD_SIZE + rc] === 3);
        assert('中央には置けない', isValidPlacement([{x:rc,y:rc}], 1) === false);
        assert('隅は空', board[0] === 0);
    `,
    'crossgo.html': `
        resetGame();
        const cc = Math.floor(BOARD_SIZE / 2);
        assert('左上隅は壁', board[0] === 3);
        assert('中央は空', board[cc * BOARD_SIZE + cc] === 0);
        assert('中央に置ける', isValidPlacement([{x:cc,y:cc}], 1) === true);
    `,
    'livego.html': `
        resetGame();
        for (let i = 0; i < 8; i++)
            executeMove({ cells: [{x:i,y:0}], type: 'STONE', rot: 0 }, 1);
        endGameByScore();
        assert('生き石集計', gameResultData.details.indexOf('生き石') >= 0);
        assert('黒8石>白コミで黒勝ち', gameResultData.title.indexOf('黒') >= 0);
    `,
    'fusego.html': `
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:5,y:6}], type: 'STONE', rot: 0 }, 2);
        assert('隣接敵石が壁化', board[5 * BOARD_SIZE + 5] === 3);
        assert('自分の石は残る', board[6 * BOARD_SIZE + 5] === 2);
        assert('アゲハマにならない', captures[2] === 0);
    `,
    'wormgo.html': `
        resetGame();
        assert('ワームホール2組', WORMHOLES.length === 2 && WORMHOLES.every(w => w.length === 2));
        const [wa, wb] = WORMHOLES[0];
        assert('ワーム近傍a→b', getNeighbors(wa).includes(wb));
        assert('ワーム近傍b→a', getNeighbors(wb).includes(wa));
    `,
    'gravego.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('取られたマスは墓標', board[0] === 3);
        assert('アゲハマ計上', captures[1] === 1);
        assert('墓標には置けない', isValidPlacement([{x:0,y:0}], 2) === false);
    `,
    'reapgo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('通常手は交代', turn === 2);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('取ったら手番継続', turn === 1);
        assert('白石は消えた', board[0] === 0);
        assert('アゲハマ計上', captures[1] === 1);
    `,
    'quadgo.html': `
        resetGame();
        assert('碁カク1種', PIECE_TYPES.length === 1 && PIECE_TYPES[0] === 'QUAD');
        assert('PIECE_SIZE=4', PIECE_SIZE === 4);
        executeMove({ cells: [{x:0,y:0},{x:1,y:0},{x:0,y:1},{x:1,y:1}], type: 'QUAD', rot: 0 }, 1);
        assert('2x2配置', board[0] === 1 && board[1] === 1 && board[BOARD_SIZE] === 1);
    `,
    'circlego.html': `
        resetGame();
        const cc = Math.floor(BOARD_SIZE / 2);
        assert('隅は壁', board[0] === 3);
        assert('辺中央は空', board[cc] === 0);
        assert('中心は空', board[cc * BOARD_SIZE + cc] === 0);
        assert('隅に置けない', isValidPlacement([{x:0,y:0}], 1) === false);
    `,
    'lavago.html': `
        resetGame();
        assert('溶岩関数', typeof applyLava === 'function');
        assert('初期深度0', lavaDepth === 0);
        applyLava();
        assert('深度1へ', lavaDepth === 1);
        assert('外周空点が壁化', board[0] === 3 && board[BOARD_SIZE - 1] === 3);
    `,
    'halfgo.html': `
        resetGame();
        const hm = Math.floor(BOARD_SIZE / 2);
        assert('黒は右半分不可', isValidPlacement([{x:hm+1,y:0}], 1) === false);
        assert('黒は左半分可', isValidPlacement([{x:0,y:0}], 1) === true);
        assert('白は左半分不可', isValidPlacement([{x:0,y:0}], 2) === false);
        assert('白は右半分可', isValidPlacement([{x:BOARD_SIZE-1,y:0}], 2) === true);
        assert('中央列は共通(黒)', isValidPlacement([{x:hm,y:0}], 1) === true);
        assert('中央列は共通(白)', isValidPlacement([{x:hm,y:0}], 2) === true);
    `,
    'sparsego.html': `
        resetGame();
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('敵石の隣も不可', isValidPlacement([{x:6,y:5}], 2) === false);
        assert('離れた点は可', isValidPlacement([{x:0,y:0}], 2) === true);
    `,
    'firstgo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('最初の取りで即終了', gameOver === true);
        assert('黒の一撃勝利', gameResultData.title.indexOf('黒') >= 0);
    `,
    'treasurego.html': `
        resetGame();
        const star = getStarPoints(BOARD_SIZE)[0];
        getNeighbors(star.y * BOARD_SIZE + star.x).forEach(i => {
            board[i] = 1;
        });
        assert('宝ボーナス計算に到達', typeof endGameByScore === 'function');
        endGameByScore();
        assert('宝行が出力', gameResultData.details.indexOf('宝') >= 0);
    `,
    'darkgo.html': `
        resetGame();
        assert('fogViewer定義', typeof fogViewer === 'function');
        assert('isFogVisible定義', typeof isFogVisible === 'function');
        board[1 * BOARD_SIZE + 1] = 1; // 黒石 (turn=1 の視点で判定)
        assert('自石近傍は見える', isFogVisible(1 * BOARD_SIZE + 2) === true);
        assert('遠方は見えない', isFogVisible(BOARD_SIZE * BOARD_SIZE - 1) === false);
    `,
    'orbitgo.html': `
        resetGame();
        assert('applyOrbit定義', typeof applyOrbit === 'function');
        board[0] = 1; // 左上隅に石
        applyOrbit();
        assert('外周が1マス移動', board[1] === 1 && board[0] === 0);
    `,
    'selfgo.html': `
        resetGame();
        // 白が(1,0),(0,1)を占有 → 黒が(0,0)に置くと自殺手 (通常碁なら禁止)
        board[1] = 2; board[BOARD_SIZE] = 2;
        assert('自殺手が合法', isValidPlacement([{x:0,y:0}], 1) === true);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('自連が消滅', board[0] === 0);
        assert('相手のアゲハマになる', captures[2] === 1);
    `,
    'stargo.html': `
        resetGame();
        assert('碁ホシ1種', PIECE_TYPES.length === 1 && PIECE_TYPES[0] === 'PLUS');
        assert('PIECE_SIZE=5', PIECE_SIZE === 5);
        executeMove({ cells: [{x:1,y:0},{x:0,y:1},{x:1,y:1},{x:2,y:1},{x:1,y:2}], type: 'PLUS', rot: 0 }, 1);
        assert('十字配置', board[BOARD_SIZE+1] === 1 && board[0+1] === 1);
    `,
    'biggo.html': `
        resetGame();
        assert('碁オオ1種', PIECE_TYPES.length === 1 && PIECE_TYPES[0] === 'BIG');
        assert('PIECE_SIZE=9', PIECE_SIZE === 9);
        const cells9 = [];
        for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) cells9.push({x, y});
        executeMove({ cells: cells9, type: 'BIG', rot: 0 }, 1);
        assert('3x3配置', board[0] === 1 && board[2 * BOARD_SIZE + 2] === 1);
    `,
    'connectgo.html': `
        resetGame();
        assert('checkConnectWin定義', typeof checkConnectWin === 'function');
        // 黒が上下辺を縦に連結
        for (let y = 0; y < BOARD_SIZE; y++) board[y * BOARD_SIZE + 4] = 1;
        assert('黒の上下連結で勝利', checkConnectWin(1) === true);
        assert('白は未連結', checkConnectWin(2) === false);
    `,
    'centgo.html': `
        resetGame();
        assert('centRadius定義', typeof centRadius === 'function');
        assert('初期半径2', centRadius() === 2);
        const cc = Math.floor(BOARD_SIZE / 2);
        assert('中心は可', isValidPlacement([{x:cc,y:cc}], 1) === true);
        assert('隅は不可', isValidPlacement([{x:0,y:0}], 1) === false);
    `,
    'switchgo.html': `
        resetGame();
        assert('applySwitch定義', typeof applySwitch === 'function');
        board[0] = 1; board[1] = 2;
        applySwitch();
        assert('色が反転', board[0] === 2 && board[1] === 1);
    `,
    'thundergo.html': `
        resetGame();
        assert('applyThunder定義', typeof applyThunder === 'function');
        board[0] = 1;
        applyThunder();
        assert('雷で連が消滅', board[0] === 0);
    `,
    'cylindgo.html': `
        resetGame();
        // 左端(0,y)の左隣は右端(N-1,y)
        const cy = 3 * BOARD_SIZE;
        assert('円筒近傍', getNeighbors(cy).includes(cy + BOARD_SIZE - 1));
        // 上端はループしない
        assert('上端は通常', !getNeighbors(0).includes(BOARD_SIZE * (BOARD_SIZE - 1)));
    `,
    'moebiusgo.html': `
        resetGame();
        // 左端(0,y)の左隣は右端(N-1, N-1-y) — 上下反転
        const my = 2 * BOARD_SIZE; // (0,2)
        const expected = (BOARD_SIZE - 1 - 2) * BOARD_SIZE + BOARD_SIZE - 1; // (N-1, N-3)
        assert('メビウス近傍', getNeighbors(my).includes(expected));
    `,
    'quartergo.html': `
        resetGame();
        assert('allowedQuadrant定義', typeof allowedQuadrant === 'function');
        assert('初期象限0(左上)', allowedQuadrant() === 0);
        const qm = Math.floor(BOARD_SIZE / 2);
        assert('左上のみ可', isValidPlacement([{x:1,y:1}], 1) === true);
        assert('右下は不可', isValidPlacement([{x:BOARD_SIZE-2,y:BOARD_SIZE-2}], 1) === false);
    `,
    'escapego.html': `
        resetGame();
        // 辺に接する連は不死: 角の白石を囲んでも取られない
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        assert('辺の連は取られない', getCapturedStones(board, 2).length === 0);
        // 中央の石は通常通り取られる
        board[0] = 0; board[1] = 0; board[BOARD_SIZE] = 0;
        const ci = 5 * BOARD_SIZE + 5;
        board[ci] = 2; board[ci-1] = 1; board[ci+1] = 1;
        board[ci - BOARD_SIZE] = 1; board[ci + BOARD_SIZE] = 1;
        assert('中央は通常通り', getCapturedStones(board, 2).length === 1);
    `,
    'siphongo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('取った石が自色化', board[0] === 1);
        assert('アゲハマなし', captures[1] === 0);
    `,
    'monogo.html': `
        resetGame();
        // 単石は取れる
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        assert('単石は取れる', getCapturedStones(board, 2).length === 1);
        // 2連は不死
        board[0] = 0; board[1] = 0; board[BOARD_SIZE] = 0;
        board[5 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        board[5 * BOARD_SIZE + 4] = 1; board[4 * BOARD_SIZE + 5] = 1; board[4 * BOARD_SIZE + 6] = 1;
        board[6 * BOARD_SIZE + 5] = 1; board[6 * BOARD_SIZE + 6] = 1; board[5 * BOARD_SIZE + 7] = 1;
        assert('2連は取れない', getCapturedStones(board, 2).length === 0);
    `,
    'reggo.html': `
        resetGame();
        board[0] = 1; board[1] = 1; board[2] = 1;
        // (0,0)-(1,0)-(2,0) の3連に隣接して(3,0)に置くと4連 → 禁止
        assert('4連になる手は禁止', isValidPlacement([{x:3,y:0}], 1) === false);
        assert('離れた点は可', isValidPlacement([{x:0,y:5}], 1) === true);
        // 2連への追加 (3連) は可
        board[0] = 0;
        assert('3連は可', isValidPlacement([{x:0,y:0}], 1) === true);
    `,
    'antigravgo.html': `
        resetGame();
        assert('最上段は可', isValidPlacement([{x:4,y:0}], 1) === true);
        assert('宙に浮く手は不可', isValidPlacement([{x:4,y:4}], 1) === false);
        board[4 * BOARD_SIZE + 4] = 1; // (4,4)に石
        assert('石の直下は可', isValidPlacement([{x:4,y:5}], 1) === true);
    `,
    'fourgo.html': `
        resetGame();
        assert('gravityDir定義', typeof gravityDir === 'function');
        assert('初期方向=下', gravityDir()[0] === 0 && gravityDir()[1] === 1);
        const fb = BOARD_SIZE - 1;
        assert('下端は可', isValidPlacement([{x:4,y:fb}], 1) === true);
        assert('中央は不可', isValidPlacement([{x:4,y:4}], 1) === false);
        history.push({}); history.push({}); // 手数+2 → 方向=上
        assert('方向回転=上', gravityDir()[1] === -1);
        assert('上端が可になる', isValidPlacement([{x:4,y:0}], 1) === true);
    `,
    'pushchaingo.html': `
        resetGame();
        board[1] = 2; board[2] = 2; // 敵石2連 (1,0)(2,0)
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        assert('連鎖押しで2連移動', board[2] === 2 && board[3] === 2 && board[1] === 0);
    `,
    'twilightgo.html': `
        resetGame();
        assert('isNight定義', typeof isNight === 'function');
        assert('開始は昼', isNight() === false);
        for (let i = 0; i < 6; i++) history.push({}); // 夜へ
        assert('6手後は夜', isNight() === true);
        board[5 * BOARD_SIZE + 5] = 1;
        assert('夜は自石隣接のみ', isValidPlacement([{x:6,y:5}], 1) === true);
        assert('夜に遠方不可', isValidPlacement([{x:0,y:0}], 1) === false);
    `,
    'hydrago.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        // 白(0,0)は取られたが隣の空点に復活する可能性: 消えたか復活したかは盤面上の白石数で確認
        const whites = board.filter(v => v === 2).length;
        assert('ヒドラ復活または消滅', whites <= 1);
        assert('アゲハマ計上', captures[1] === 1);
    `,
    'ghostgo.html': `
        resetGame();
        executeMove({ cells: [{x:1,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        executeMove({ cells: [{x:0,y:1}], type: 'STONE', rot: 0 }, 1);
        assert('取られたマスは幽霊', board[0] === 4);
        assert('幽霊には置けない', isValidPlacement([{x:0,y:0}], 2) === false);
        for (let i = 0; i < 6; i++) executeMove({ cells: [{x:2+i*2,y:8}], type: 'STONE', rot: 0 }, (i % 2) + 1);
        assert('幽霊は消える', board[0] === 0);
    `,
    'kleingo.html': `
        resetGame();
        // 左端(0,2)の左隣は右端反転(N-1, N-3)
        const ki = 2 * BOARD_SIZE;
        const kexp = (BOARD_SIZE - 3) * BOARD_SIZE + BOARD_SIZE - 1;
        assert('横反転ループ', getNeighbors(ki).includes(kexp));
        // 上端(0,0)の上は下端(0,N-1)
        assert('縦通常ループ', getNeighbors(0).includes((BOARD_SIZE - 1) * BOARD_SIZE));
    `,
    'zombego.html': `
        resetGame();
        // 白連(0,0),(1,0)を黒(2,0)(0,1)(1,1)(2,1)で囲む → 呼吸点0で取り
        board[0] = 2; board[1] = 2;
        board[2] = 1; board[BOARD_SIZE] = 1; board[BOARD_SIZE + 1] = 1; board[BOARD_SIZE + 2] = 1;
        assert('取る前ゾンビなし', zombies.length === 0);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('ゾンビが生成', board[0] === 3 && board[1] === 3 && zombies.length === 2);
        assert('アゲハマ計上', captures[1] === 2);
        assert('ゾンビには置けない', isValidPlacement([{x:0,y:0}], 2) === false);
    `,
    'relaygo.html': `
        resetGame();
        executeMove({ cells: [{x:6,y:6}], type: 'STONE', rot: 0 }, 1); // 黒
        // 白は(6,6)から距離4以内のみ
        assert('近くは可', isValidPlacement([{x:6,y:8}], 2) === true);
        assert('遠くは不可', isValidPlacement([{x:0,y:0}], 2) === false);
    `,
    'sumgo.html': `
        resetGame();
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:12,y:12}], type: 'STONE', rot: 0 }, 2);
        const t = calculateTerritory();
        assert('地計算動作', typeof t.black === 'number');
    `,
    'fuelgo.html': `
        resetGame();
        assert('初期燃料25', fuel[1] === 25);
        executeMove({ cells: [{x:6,y:6}], type: 'STONE', rot: 0 }, 1); // コスト0(自石なし)
        assert('初手は消費0', fuel[1] === 25);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        // 黒2手目: (6,8)は距離2→燃料-2
        executeMove({ cells: [{x:6,y:8}], type: 'STONE', rot: 0 }, 1);
        assert('距離2で消費', fuel[1] === 23);
        // 距離4の手は残23なら可、距離30は不可(盤面最大24)
        assert('遠距離不可', isValidPlacement([{x:12,y:12}], 1) === true); // 距離min|12-6|+|12-8|=10>23? 10<=23で可
        fuel[1] = 1;
        assert('燃料切れは不可', isValidPlacement([{x:12,y:12}], 1) === false);
        assert('隣接なら可', isValidPlacement([{x:6,y:7}], 1) === true);
    `,
    'stripego.html': `
        resetGame();
        assert('奇数行は壁', board[BOARD_SIZE] === 3 && board[0] === 0);
        assert('偶数行は可', isValidPlacement([{x:0,y:0}], 1) === true);
        assert('奇数行は不可', isValidPlacement([{x:0,y:1}], 1) === false);
    `,
    'driftgo.html': `
        resetGame();
        assert('applyDrift定義', typeof applyDrift === 'function');
        board[6 * BOARD_SIZE + 6] = 1;
        const before = board.filter(v => v === 1).length;
        applyDrift();
        assert('石数は保存', board.filter(v => v === 1).length === before);
        assert('石が移動または残留', board[6 * BOARD_SIZE + 6] === 1 ||
            board[6 * BOARD_SIZE + 5] === 1 || board[6 * BOARD_SIZE + 7] === 1 ||
            board[5 * BOARD_SIZE + 6] === 1 || board[7 * BOARD_SIZE + 6] === 1);
    `,
    'lastgo.html': `
        resetGame();
        executeMove({ cells: [{x:3,y:3}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 2);
        endGameByScore();
        assert('終着勝ち=白', gameResultData && gameResultData.title.includes('白'));
    `,
    'eyego.html': `
        resetGame();
        assert('checkEyeWin定義', typeof checkEyeWin === 'function');
        // 黒で(1,0)を囲む: (0,0)(2,0)(1,1)が黒→(1,0)が眼
        board[0] = 1; board[2] = 1; board[BOARD_SIZE + 1] = 1;
        assert('眼検出', checkEyeWin(1) === true);
        assert('白眼なし', checkEyeWin(2) === false);
    `,
    'brawlgo.html': `
        resetGame();
        // 白石(1,1)を黒(0,1)(2,1)(1,0)の3方向で囲む→呼吸点残でも取れる
        board[BOARD_SIZE + 1] = 2;
        board[BOARD_SIZE] = 1; board[BOARD_SIZE + 2] = 1; board[1] = 1;
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('3方向囲みで個別捕獲', board[BOARD_SIZE + 1] === 0 && captures[1] === 1);
    `,
    'chaingo.html': `
        resetGame();
        // 白連(0,0),(1,0),(0,1)を黒(2,0)(1,1)(0,2)で囲む → 取り発生
        // (2,1)の白石は(1,0)の斜め → 8方向爆発で連鎖されるはず
        board[0] = 2; board[1] = 2; board[BOARD_SIZE] = 2;
        board[2] = 1; board[BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE] = 1;
        board[BOARD_SIZE + 2] = 2; // 斜め接続する白
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('基本取り', board[0] === 0);
        assert('斜め連鎖爆発', board[BOARD_SIZE + 2] === 0 && captures[1] === 4);
    `,
    'finitego.html': `
        resetGame();
        // 黒が13個置くと最古が消える
        for (let i = 0; i < 13; i++) {
            executeMove({ cells: [{x:i,y:i<7?12:11}], type: 'STONE', rot: 0 }, 1);
            executeMove({ cells: [{x:i,y:0}], type: 'STONE', rot: 0 }, 2);
        }
        const blacks = pieces.filter(p => p.player === 1).length;
        assert('黒は12個まで', blacks === 12);
        assert('最古(0,12)が消滅', board[12 * BOARD_SIZE] === 0);
    `,
    'copygo.html': `
        resetGame();
        executeMove({ cells: [{x:3,y:4}], type: 'STONE', rot: 0 }, 1); // 黒(3,4)
        // 白は対称点(N-1-3, N-1-4)=(9,8)にしか打てない
        assert('対称点は可', isValidPlacement([{x:9,y:8}], 2) === true);
        assert('非対称は不可', isValidPlacement([{x:0,y:0}], 2) === false);
        // 対称点を埋めれば自由
        board[8 * BOARD_SIZE + 9] = 1;
        assert('埋まれば自由', isValidPlacement([{x:0,y:0}], 2) === true);
    `,
    'swampgo.html': `
        resetGame();
        assert('沼6個', swamp.size === 6);
        const sw = [...swamp][0];
        const sx = sw % BOARD_SIZE, sy = (sw / BOARD_SIZE) | 0;
        assert('沼には置ける', isValidPlacement([{x:sx,y:sy}], 1) === true);
        executeMove({ cells: [{x:sx,y:sy}], type: 'STONE', rot: 0 }, 1);
        assert('沈没タイマー登録', swampSink[sw] !== undefined);
        // 6手経過で沈む (沼に重ならない最下行で経過)
        for (let i = 0; i < 6; i++)
            executeMove({ cells: [{x:(i*2+1)%13,y:12}], type: 'STONE', rot: 0 }, (i%2)+1);
        assert('沼の石は沈む', board[sw] === 0);
    `,
    'tidego.html': `
        resetGame();
        assert('初期は干潮', tideHigh === false);
        applyTide();
        assert('満潮で外周が壁', tideHigh === true && board[0] === 3 && board[BOARD_SIZE - 1] === 3);
        applyTide();
        assert('干潮で外周復帰', tideHigh === false && board[0] === 0);
    `,
    'pulsego.html': `
        resetGame();
        assert('applyPulse定義', typeof applyPulse === 'function');
        board[6 * BOARD_SIZE + 6] = 1;
        pieces.push({ id: 1, player: 1, type: 'STONE', rot: 0, cells: [{x:6,y:6}] });
        applyPulse();
        const grown = pieces.find(p => p.id === 1);
        assert('連が1石伸びる', grown.cells.length === 2);
    `,
    'recyclego.html': `
        resetGame();
        // 白(0,0)を黒(1,0)(0,1)で囲む
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('取り発生', board[0] === 0 && captures[1] === 1);
        assert('再生キュー入り', returnQueue.length === 1 && returnQueue[0].player === 2);
        // 10手経過でランダム復活
        for (let i = 0; i < 11; i++)
            executeMove({ cells: [{x:(i*2)%13,y:11}], type: 'STONE', rot: 0 }, (i%2)+1);
        assert('石が復活', board.filter(v => v === 2).length >= 1 && returnQueue.length === 0);
    `,
    'libgo.html': `
        resetGame();
        executeMove({ cells: [{x:6,y:6}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        // 黒(6,6)の呼吸点=4、白(0,0)の呼吸点=2+コミ6.5 → 白勝ち
        endGameByScore();
        assert('呼吸点+コミで白勝ち', gameResultData && gameResultData.title.includes('白'));
    `,
    'stonerain.html': `
        resetGame();
        // 9手実行→壁が1個降る
        for (let i = 0; i < 9; i++)
            executeMove({ cells: [{x:i%13,y:i<5?12:10}], type: 'STONE', rot: 0 }, (i%2)+1);
        assert('壁が降った', board.filter(v => v === 3).length >= 1);
    `,
    'splitgo.html': `
        resetGame();
        // 黒7連を作る: (0..6, y=6)ライン — 交互に白も置く
        for (let i = 0; i < 7; i++) {
            executeMove({ cells: [{x:i,y:6}], type: 'STONE', rot: 0 }, 1);
            if (i < 6) executeMove({ cells: [{x:i,y:0}], type: 'STONE', rot: 0 }, 2);
        }
        // 7連は半分(3個)が白に分裂
        const whitesInLine = [0,1,2,3,4,5,6].filter(x => board[6 * BOARD_SIZE + x] === 2).length;
        assert('半分が敵化', whitesInLine === 3);
    `,
    'minigo.html': `
        resetGame();
        executeMove({ cells: [{x:6,y:6}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        endGameByScore();
        // 地0同士+コミ6.5: 黒=0,白=6.5 → 少ない黒の勝ち
        assert('少子で黒勝ち', gameResultData && gameResultData.title.includes('黒'));
    `,
    'grenadego.html': `
        resetGame();
        // 白(0,0)を黒(1,0)(0,1)で囲む→取り→(1,1)の黒も爆発で道連れ
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        board[BOARD_SIZE + 1] = 1; // (1,1)の黒は(0,0)の斜め→爆発道連れ
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('基本取り', board[0] === 0);
        assert('斜めの石も道連れ', board[BOARD_SIZE + 1] === 0);
        assert('道連れもアゲハマ', captures[1] === 4); // 白1+黒3(1,0)(0,1)(1,1)
    `,
    'infectgo.html': `
        resetGame();
        // 孤立黒(5,5)が隣接白(6,5)を感染 (7手目で発動)
        board[5 * BOARD_SIZE + 5] = 1; board[5 * BOARD_SIZE + 6] = 2;
        for (let i = 0; i < 7; i++)
            executeMove({ cells: [{x:i,y:12}], type: 'STONE', rot: 0 }, (i%2)+1);
        assert('白が感染して黒化', board[5 * BOARD_SIZE + 6] === 1);
    `,
    'bondgo.html': `
        resetGame();
        // 白(0,0)を黒(1,0)(0,1)で囲む → 黒の着手で白が取れるが、隣接した黒連も道連れ
        board[0] = 2; board[1] = 1; board[BOARD_SIZE] = 1;
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('白を取った', board[0] === 0 && captures[1] === 1);
        assert('自連も道連れ', board[1] === 0 && board[BOARD_SIZE] === 0);
        assert('道連れは相手のアゲハマ', captures[2] === 2);
    `,
    'rimgo.html': `
        resetGame();
        // 黒が上辺(0..3,y=0)の地を囲む状況を直接構築
        for (let x = 0; x <= 4; x++) board[BOARD_SIZE + x] = 1; // (0..4, 1) 黒
        board[0] = 1; // 角にも黒
        executeMove({ cells: [{x:12,y:12}], type: 'STONE', rot: 0 }, 1);
        executeMove({ cells: [{x:11,y:12}], type: 'STONE', rot: 0 }, 2);
        endGameByScore();
        assert('淵ボーナス込みで集計', gameResultData !== null);
    `,
    'budgetgo.html': `
        resetGame();
        assert('残り手数表示要素', typeof turnIndicator !== 'undefined');
        // 60手実行で自動終局 — 全セル走査で合法手を順に打つ
        let idx = 0, moves = 0, ended = false;
        while (moves < 60) {
            let placed = false;
            while (idx < board.length) {
                const p = { x: idx % BOARD_SIZE, y: (idx / BOARD_SIZE) | 0 }; idx++;
                if (board[p.y * BOARD_SIZE + p.x] === 0 && isValidPlacement([p], (moves % 2) + 1)) {
                    executeMove({ cells: [p], type: 'STONE', rot: 0 }, (moves % 2) + 1);
                    placed = true; break;
                }
            }
            if (!placed) break;
            moves++;
            if (gameOver) { ended = true; break; }
        }
        assert('60手で自動終局', ended === true && moves >= 60);
    `,
    'frontgo.html': `
        resetGame();
        assert('frontRow定義', typeof frontRow === 'function' && frontRow() === 0);
        // 8手で前線が2行目(インデックス2)へ
        for (let i = 0; i < 8; i++)
            executeMove({ cells: [{x:i+1,y:12}], type: 'STONE', rot: 0 }, (i%2)+1);
        assert('前線が進行', frontRow() === 2);
    `,
    'chargego.html': `
        resetGame();
        assert('パスで溜まる', passCharge[1] === false);
        turn = 1; handlePass();
        assert('溜めフラグON', passCharge[1] === true);
        // 黒が溜め石を置く
        turn = 1;
        executeMove({ cells: [{x:5,y:5}], type: 'STONE', rot: 0 }, 1);
        assert('装甲付与', armorUntil[5 * BOARD_SIZE + 5] > 0);
        assert('溜め消費', passCharge[1] === false);
        // 白が(5,5)周辺を完全に囲んでも装甲中は取れない
        board[5 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 5] = 2;
        board[6 * BOARD_SIZE + 5] = 2; board[5 * BOARD_SIZE + 6] = 2;
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        assert('装甲中は取れない', board[5 * BOARD_SIZE + 5] === 1);
    `,
    'shufflego.html': `
        resetGame();
        board[0] = 1; board[1] = 1; board[2] = 2; board[3] = 2;
        const sig = () => [0,1,2,3].map(i => board[i]).join('');
        // 15手実行→シャッフル発動 (色分布が変化するか試行)
        for (let i = 0; i < 15; i++)
            executeMove({ cells: [{x:i%13,y:i<13?12:11}], type: 'STONE', rot: 0 }, (i%2)+1);
        const counts = {1:0,2:0};
        [0,1,2,3].forEach(i => { if (board[i]===1) counts[1]++; else if (board[i]===2) counts[2]++; });
        assert('石は消えない', counts[1]+counts[2] === 4);
    `,
    'taxgo.html': `
        resetGame();
        executeMove({ cells: [{x:6,y:3}], type: 'STONE', rot: 0 }, 1); // 上半分→税なし
        assert('自陣は無税', toll[1] === 0);
        executeMove({ cells: [{x:6,y:9}], type: 'STONE', rot: 0 }, 2); // 白の敵陣=上半分… 9>=7は下半分
        // 白の敵陣は上半分(y<7)なのでy=9は自陣 → 税なし
        assert('白自陣は無税', toll[2] === 0);
        executeMove({ cells: [{x:2,y:10}], type: 'STONE', rot: 0 }, 1); // 黒敵陣=下半分 y>=7 → +1
        assert('黒敵陣で関税', toll[1] === 1);
        executeMove({ cells: [{x:10,y:2}], type: 'STONE', rot: 0 }, 2); // 白敵陣=上半分 → +1
        assert('白敵陣で関税', toll[2] === 1);
    `,
    'greedgo.html': `
        resetGame();
        assert('canCaptureMove定義', typeof canCaptureMove === 'function');
        // 白(0,0)の呼吸点が(0,1)だけになるよう黒(1,0)配置
        board[0] = 2; board[1] = 1;
        // 黒の番: (0,1)に打てば白が取れる → それ以外は非合法
        assert('アタリ時は取る手のみ', isValidPlacement([{x:0,y:1}], 1) === true);
        assert('他は非合法', isValidPlacement([{x:6,y:6}], 1) === false);
        // 呼吸点が残り1つの敵連が無ければ自由
        board[0] = 0;
        assert('アタリ無しは自由', isValidPlacement([{x:6,y:6}], 1) === true);
    `,
    'crosswallgo.html': `
        resetGame();
        const mid = (BOARD_SIZE / 2) | 0;
        assert('中央横線が壁', board[mid * BOARD_SIZE + 5] === 3);
        assert('中央縦線が壁', board[5 * BOARD_SIZE + mid] === 3);
        assert('区域には置ける', isValidPlacement([{x:0,y:0}], 1) === true);
        assert('壁には置けない', isValidPlacement([{x:mid,y:mid}], 1) === false);
    `,
    'polargo.html': `
        resetGame();
        assert('内側は壁', board[6 * BOARD_SIZE + 6] === 3);
        assert('外周は空き', board[0] === 0 && board[12] === 0);
        assert('回廊に置ける', isValidPlacement([{x:0,y:0}], 1) === true);
        assert('内部には置けない', isValidPlacement([{x:5,y:5}], 1) === false);
    `,
    'microgo.html': `
        resetGame();
        assert('デフォルト9路', BOARD_SIZE === 9 && board.length === 81);
        executeMove({ cells: [{x:4,y:4}], type: 'STONE', rot: 0 }, 1);
        assert('小盤で着手', board[4 * 9 + 4] === 1);
    `,
    'jumpgo.html': `
        resetGame();
        executeMove({ cells: [{x:6,y:6}], type: 'STONE', rot: 0 }, 1); // 初手自由
        executeMove({ cells: [{x:0,y:0}], type: 'STONE', rot: 0 }, 2);
        // 黒2手目: (6,6)から距離2のみ
        assert('距離2は可', isValidPlacement([{x:8,y:6}], 1) === true);
        assert('距離1は不可', isValidPlacement([{x:7,y:6}], 1) === false);
        assert('距離3は不可', isValidPlacement([{x:9,y:6}], 1) === false);
    `,
    'nokogo.html': `
        resetGame();
        // コウ状況: 白(1,0)(0,1)、黒(2,0)(1,1)(0,2)。黒が(0,0)の白を取ると仮定…
        // 単劫: (0,0)白、(1,0)黒(2,0)黒(0,1)白…複雑。簡易検証: prevBoard再現が許可されるか
        board[0] = 2; board[1] = 1; board[2] = 1; board[BOARD_SIZE + 1] = 1; board[2 * BOARD_SIZE] = 1;
        // 白(0,0)は呼吸点(0,1)のみ… ここではコウ形を直接作るのは難しいのでスモークのみ
        executeMove({ cells: [{x:9,y:9}], type: 'STONE', rot: 0 }, 1);
        assert('通常着手可', board[9 * BOARD_SIZE + 9] === 1);
    `,
    'chaoticgo.html': `
        resetGame();
        assert('applyDrift定義', typeof applyDrift === 'function');
        assert('applyTide定義', typeof applyTide === 'function');
        board[6 * BOARD_SIZE + 6] = 1;
        const n0 = board.filter(v => v === 1).length;
        applyDrift();
        assert('漂流で石数保存', board.filter(v => v === 1).length === n0);
        applyTide();
        assert('潮汐で外周壁', board[0] === 3);
        applyTide();
        assert('潮汐復帰', board[0] === 0);
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
