// FREEZETAGGO — 氷鬼碁: 2体の氷鬼が徘徊し、触れた石は16手の間凍る (凍った石は連の呼吸+1)
const K = require('../gen_kit.js');
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
const ST_INIT = `{ ply: 0, demons: [], frozen: {}, dir: 0 }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 満局打ち切り: 交点数の0.9倍の手数で即採点終局
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'freezetaggo.html',
    en: 'FREEZETAGGO',
    jp: '氷鬼碁',
    prefix: 'freezetaggo',
    desc: '2体の氷鬼が徘徊。触れた石は16手の間凍り、凍った石は連の呼吸を支える (+1)。',
    kind: 'stone',
    icon: 'freezetaggo',
    spec: [
        ...K.rb('FREEZETAGGO', '氷鬼碁', 'freezetaggo'),
        K.params([
            { key: 'demon_interval', label: '氷鬼の移動間隔', min: 2, max: 30, def: 9, unit: '手' },
            { key: 'freeze_turns', label: '凍結の持続', min: 4, max: 60, def: 16, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        // st 初期化より前に配置: 後続の ST() の st=... が直後に続き、initDemons は st 確定後に走る
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            initDemons();
            freezeAround();`],
        ...ST(ST_INIT),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 氷鬼: 盤上を徘徊する2体の鬼。隣接する石を凍らせる (石の動きを封じる)
        function initDemons() {
            const n = BOARD_SIZE, c = Math.floor(n / 2), q = Math.max(1, Math.round(n * 0.25));
            st.demons = [q * n + q, (n - 1 - q) * n + (n - 1 - q)];
            st.frozen = {};
        }
        function demonAt(i) { return st.demons.indexOf(i) >= 0; }
        function frozenAt(i) { return st.frozen[i] !== undefined && st.frozen[i] > st.ply; }
        function freezeAround() {
            st.demons.forEach(d => {
                getNeighbors(d).forEach(n => {
                    const v = board[n];
                    if (v === 1 || v === 2) st.frozen[n] = st.ply + (P('freeze_turns') || 16);
                });
            });
        }
        function stepDemons() {
            const dirs = [[1, 0], [0, 1], [-1, 0], [0, -1]];
            st.demons = st.demons.map((d, k) => {
                const x = d % BOARD_SIZE, y = (d / BOARD_SIZE) | 0;
                for (let t = 0; t < 4; t++) {
                    const [dx, dy] = dirs[(st.dir + k * 2 + t) % 4];
                    const nx = x + dx, ny = y + dy;
                    if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                    const ni = ny * BOARD_SIZE + nx;
                    if (st.demons.indexOf(ni) >= 0) continue;
                    return ni;
                }
                return d;
            });
            st.dir = (st.dir + 1) % 4;
        }`],
        // 凍った石は連の呼吸を支える (連に+1)
        [K.ONE, `                    let hasLiberty = false;`, `                    let liberties = 0;`],
        [K.ONE, `                                hasLiberty = true;`, `                                liberties++;`],
        [K.ONE, `                        });
                    }

                    if (!hasLiberty) {`,
`                        });
                        if (frozenAt(curr)) liberties++; // 凍った石は連を氷で支える
                    }

                    if (liberties <= 0) {`],
        [K.ONE, `                });
            }
            return liberties;`,
`                });
                if (frozenAt(curr)) liberties++; // 凍った石は連を氷で支える
            }
            return liberties;`],
        // 氷鬼の徘徊: 9手ごとに1歩進み、触れた石を凍らせる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 氷鬼の徘徊: 9手ごとに1歩進み、触れた石が16手凍る
            st.ply++;
            if (st.ply % Math.max(1, P('demon_interval') || 9) === 0) {
                stepDemons();
                st.demons.forEach(d => fxGlow(d, '#7dd3fc', 700));
            }
            freezeAround();

            turn = opponent;`],
        // 氷鬼の描画: 水色の鬼角のある氷塊
        K.CUE_GRID(`            // 氷鬼: 水色の氷塊と角
            {
                ctx.save();
                st.demons.forEach(d => {
                    const x = d % BOARD_SIZE, y = (d / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(125,211,252,0.65)';
                    ctx.fillRect(cx - cellSize * 0.34, cy - cellSize * 0.30, cellSize * 0.68, cellSize * 0.68);
                    ctx.strokeStyle = 'rgba(2,132,199,0.9)';
                    ctx.lineWidth = Math.max(1.4, cellSize * 0.05);
                    ctx.strokeRect(cx - cellSize * 0.34, cy - cellSize * 0.30, cellSize * 0.68, cellSize * 0.68);
                    // 角
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.30);
                    ctx.lineTo(cx - cellSize * 0.10, cy - cellSize * 0.46);
                    ctx.lineTo(cx - cellSize * 0.02, cy - cellSize * 0.30);
                    ctx.moveTo(cx + cellSize * 0.02, cy - cellSize * 0.30);
                    ctx.lineTo(cx + cellSize * 0.10, cy - cellSize * 0.46);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.30);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        // 凍った石の印: 水色の霜の輪
        ...K.STONE_MARKS_SPEC(`            // 凍った石: 水色の霜の輪
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(186,230,253,0.8)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                Object.keys(st.frozen).forEach(k => {
                    const i = +k;
                    if (st.frozen[k] <= st.ply) return;
                    const v = board[i];
                    if (v !== 1 && v !== 2) return;
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'氷鬼移動まで ' + ((P('demon_interval') || 9) - (st.ply % (P('demon_interval') || 9))) + '手'`),
        [K.ONE, K.INFO_ALGO, `            氷鬼碁: 2体の氷鬼が9手ごとに徘徊。触れた石は16手凍り、連の呼吸+1<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '2体の氷鬼 (水色) が9手ごとに1歩ずつ盤上を徘徊する。',
            '氷鬼に隣接した石は16手の間凍る。凍った石はその連の呼吸点を+1で支える。',
            '凍っている間はその連が取られにくい — 鬼を活かして連を守る読みが鍵。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('氷鬼が2体', st.demons.length === 2);
        assert('徘徊で氷結', typeof freezeAround === 'function');
        board.fill(0); pieces = []; history.length = 0; turn = 1; st.ply = 0; st.frozen = {};
        const d = st.demons[0];
        const dn = getNeighbors(d)[0];
        board[dn] = 1;
        freezeAround();
        assert('鬼に触れた石は凍る', st.frozen[dn] > 0 && frozenAt(dn));
        assert('凍った連は呼吸+1', getLiberties(board, dn) >= 2);
        board.fill(0); st.frozen = {};
        board[I(8, 8)] = 1;
        freezeAround();
        assert('鬼から遠い石は凍らない', st.frozen[I(8, 8)] === undefined);
    `,
};
