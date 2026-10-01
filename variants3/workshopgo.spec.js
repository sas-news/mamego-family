// WORKSHOPGO — 工房碁: 素材が盤に現れる。隣に置いて集め、2個で道具を鍛えると次の着手に助っ人石が付く
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
const ST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];
const ST_INIT = `{ mats: [], mat: { 1: 0, 2: 0 }, tools: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'workshopgo.html',
    en: 'WORKSHOPGO',
    jp: '工房碁',
    prefix: 'workshopgo',
    desc: '素材の隣に置いて回収。素材2個で道具を鍛えると、次の着手に助っ人石が自動で付く。',
    kind: 'stone',
    icon: 'workshopgo',
    spec: [
        ...K.rb('WORKSHOPGO', '工房碁', 'workshopgo'),
        K.params([
            { key: 'mat_interval', label: '素材スポーン間隔', min: 2, max: 20, def: 8, unit: '手' },
            { key: 'mat_max', label: '素材の盤上最大数', min: 1, max: 9, def: 3, unit: '個' },
            { key: 'tool_cost', label: '道具の素材コスト', min: 1, max: 5, def: 2, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),
        // 素材回収 (隣接配置) + 道具による助っ人石
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                board[p.y * BOARD_SIZE + p.x] = player;
            });
            // 素材回収: 置いた石に隣接する素材を拾う
            move.cells.forEach(p => {
                getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => {
                    const mi = st.mats.indexOf(n);
                    if (mi >= 0) {
                        st.mats.splice(mi, 1);
                        st.mat[player]++;
                        fxText(n, '素材!', '#a78bfa', 900);
                    }
                });
            });
            // 道具があれば助っ人石を隣に自動配置
            if (st.tools[player] > 0) {
                for (const p of move.cells) {
                    const hi = getNeighbors(p.y * BOARD_SIZE + p.x).find(n => board[n] === 0 && !st.mats.includes(n));
                    if (hi !== undefined) {
                        board[hi] = player;
                        st.tools[player]--;
                        fxText(hi, '助っ人!', '#a78bfa', 1100);
                        break;
                    }
                }
            }`],
        // 素材スポーン (8手毎・盤上最大3) と鍛錬 (素材2→道具1)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 素材スポーン: N手毎に空点へ (盤上最大M個)
            if (history.length % (P('mat_interval') || 8) === 0 && st.mats.length < (P('mat_max') || 3)) {
                let mi = (history.length * 37 + 11) % board.length;
                for (let k = 0; k < board.length; k++) {
                    const c = (mi + k) % board.length;
                    if (board[c] === 0 && !st.mats.includes(c)) { mi = c; break; }
                }
                if (board[mi] === 0 && !st.mats.includes(mi)) {
                    st.mats.push(mi);
                    fxGlow(mi, '#a78bfa', 900);
                }
            }
            // 鍛錬: 素材N個で道具1個
            while (st.mat[player] >= (P('tool_cost') || 2)) {
                st.mat[player] -= (P('tool_cost') || 2);
                st.tools[player]++;
            }

            turn = opponent;`],
        // 素材マスの描画 (紫の鉱石)
        ...K.CUE_STARS(`
            // 素材
            st.mats.forEach(mi => {
                const mx = padding + (mi % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(mi / BOARD_SIZE) * cellSize;
                ctx.fillStyle = '#a78bfa';
                ctx.strokeStyle = '#5b21b6';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(mx, my - cellSize * 0.22);
                ctx.lineTo(mx + cellSize * 0.2, my);
                ctx.lineTo(mx, my + cellSize * 0.22);
                ctx.lineTo(mx - cellSize * 0.2, my);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
            });`),
        ...K.EVENT_CHIP_SPEC(`'素材 ' + st.mat[turn] + ' / 道具 ' + st.tools[turn]`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            工房碁: 素材の隣に置いて回収。素材2個で道具を鍛え、道具は次の着手に助っ人石を付ける<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_ALGO, K.rv([
            '8手ごとに紫の素材が盤上に現れる (最大3個)。自分の石の隣に素材があると回収できる。',
            '素材2個で道具を1個鍛える。道具を持って着手すると、置いた石の隣に助っ人石が無料で付く。',
            '素材の取り合いが駆け引きになる資源管理ゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.mats = []; st.mat = { 1: 0, 2: 0 }; st.tools = { 1: 0, 2: 0 };
        // 素材を (1,0) に置き、その隣 (0,0) に着手 → 回収
        st.mats = [1];
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('素材を回収', st.mat[1] === 1 && st.mats.length === 0);
        // 2個目の素材で道具ができる
        st.mats = [BOARD_SIZE + 1];
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('素材2個で道具1個', st.tools[1] === 1 && st.mat[1] === 0);
        // 道具で助っ人石
        executeMove({ cells: [{ x: 6, y: 6 }] }, 1);
        const helper = getNeighbors(6 * BOARD_SIZE + 6).filter(n => board[n] === 1).length;
        assert('助っ人石が付く', helper >= 1);
        assert('道具を消費', st.tools[1] === 0);
    `,
};
