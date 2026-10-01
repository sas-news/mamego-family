// TUNNELGO — 隧道碁: 盤内4本のトンネル。入口に打つと出口へ石が瞬間移動する
const K = require('../gen_kit.js');
module.exports = {
    file: 'tunnelgo.html',
    en: 'TUNNELGO',
    jp: '隧道碁',
    prefix: 'tunnelgo',
    desc: '4つの隧道入口 (◇) に打つと出口へ石が瞬間移動する。出口が塞がると使えない。',
    kind: 'stone',
    icon: 'tunnelgo',
    spec: [
        ...K.rb('TUNNELGO', '隧道碁', 'tunnelgo'),
        K.params([
            { key: 'tun_in', label: '隧道入口の位置 (端から)', min: 0, max: 8, def: 0, hint: '0=自動 (盤の1/6)' },
            { key: 'tun_out', label: '隧道出口の位置 (端から)', min: 0, max: 12, def: 0, hint: '0=自動 (盤の2/5)' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点数比)', min: 0.3, max: 1.5, step: 0.05, def: 0.9 },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 隧道: 入口 (隅寄り) -> 出口 (中央寄り) の4本。位置は設定で調整 (0=自動)
        const TUN_A = Math.max(1, P('tun_in') || Math.floor(BOARD_SIZE / 6));
        const TUN_B = Math.max(2, P('tun_out') || Math.floor(BOARD_SIZE * 0.4));
        let TUNNELS = new Map();
        let TUNNEL_EXITS = new Set();
        function rebuildTunnels() {
            const a = Math.max(1, P('tun_in') || Math.floor(BOARD_SIZE / 6));
            const b = Math.max(2, P('tun_out') || Math.floor(BOARD_SIZE * 0.4));
            TUNNELS = new Map([
                [a * BOARD_SIZE + a, b * BOARD_SIZE + b],
                [a * BOARD_SIZE + (BOARD_SIZE - 1 - a), b * BOARD_SIZE + (BOARD_SIZE - 1 - b)],
                [(BOARD_SIZE - 1 - a) * BOARD_SIZE + a, (BOARD_SIZE - 1 - b) * BOARD_SIZE + b],
                [(BOARD_SIZE - 1 - a) * BOARD_SIZE + (BOARD_SIZE - 1 - a), (BOARD_SIZE - 1 - b) * BOARD_SIZE + (BOARD_SIZE - 1 - b)],
            ]);
            TUNNEL_EXITS = new Set(TUNNELS.values());
        }
        rebuildTunnels();
        function onVariantParam(p) {
            if (p.key === 'tun_in' || p.key === 'tun_out') rebuildTunnels();
        }
        function tunnelExit(x, y) {
            const e = TUNNELS.get(y * BOARD_SIZE + x);
            return e === undefined ? -1 : e;
        }`],
        // 入口は出口が空いている時だけ打てる
        [K.ONE, K.VALID_BOUNDS, `            for (const p of cells) {
                if (p.x < 0 || p.x >= BOARD_SIZE || p.y < 0 || p.y >= BOARD_SIZE) return false;
                if (board[p.y * BOARD_SIZE + p.x] !== 0) return false;
                const tx = tunnelExit(p.x, p.y);
                if (tx >= 0 && board[tx] !== 0) return false; // 隧道の出口が塞がっている
            }`],
        // 入口に打つと出口へ瞬間移動
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });
            // 隧道: 入口の石は出口へ瞬間移動する
            move.cells.forEach(p => {
                const ti = tunnelExit(p.x, p.y);
                if (ti >= 0 && board[ti] === 0) {
                    board[p.y * BOARD_SIZE + p.x] = 0;
                    board[ti] = player;
                    fxSlide(p.y * BOARD_SIZE + p.x, ti, 420);
                    fxGlow(ti, '#a78bfa', 600);
                }
            });`],
        // 隧道の描画: 入口は穴・出口は光
        ...K.STONE_MARKS_SPEC(`            {
                ctx.save();
                TUNNELS.forEach((out, inn) => {
                    const ix = inn % BOARD_SIZE, iy = (inn / BOARD_SIZE) | 0;
                    const ox = out % BOARD_SIZE, oy = (out / BOARD_SIZE) | 0;
                    ctx.strokeStyle = 'rgba(167,139,250,0.9)';
                    ctx.lineWidth = Math.max(2, cellSize * 0.08);
                    ctx.beginPath();
                    const icx = padding + ix * cellSize, icy = padding + iy * cellSize;
                    ctx.moveTo(icx - cellSize * 0.2, icy - cellSize * 0.2);
                    ctx.lineTo(icx + cellSize * 0.2, icy - cellSize * 0.2);
                    ctx.lineTo(icx + cellSize * 0.2, icy + cellSize * 0.2);
                    ctx.lineTo(icx - cellSize * 0.2, icy + cellSize * 0.2);
                    ctx.closePath();
                    ctx.stroke();
                    if (board[inn] === 0) {
                        ctx.fillStyle = 'rgba(41,37,36,0.5)';
                        ctx.fill();
                    }
                    const ocx = padding + ox * cellSize, ocy = padding + oy * cellSize;
                    ctx.fillStyle = 'rgba(167,139,250,0.4)';
                    ctx.beginPath();
                    ctx.arc(ocx, ocy, cellSize * 0.12, 0, Math.PI * 2);
                    ctx.fill();
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            隧道碁: 隧道入口 (◇) に打つと出口 (●) へ石が瞬間移動する。出口が塞がると入口は使えない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '4隅寄りの隧道入口 (◇) に打つと中央寄りの出口 (●) へ石が瞬間移動する。',
            '出口マスが埋まるとその隧道は使えない。奇襲・遠征に使える。',
            '満局打ち切り: 交点数の0.9倍の手数で即採点終局。連続パスでも即採点。',
        ])],
        // 終局保証: 長期戦打ち切り + 両パス即採点
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
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局 (死に石確認は簡略化)`],
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        board.fill(0); pieces = [];
        assert('隧道は4本', TUNNELS.size === 4);
        const inn = TUN_A * BOARD_SIZE + TUN_A, out = TUNNELS.get(inn);
        executeMove({ cells: [{ x: inn % BOARD_SIZE, y: (inn / BOARD_SIZE) | 0 }] }, 1);
        assert('入口の石は出口へ移動', board[inn] === 0 && board[out] === 1);
        board.fill(0); pieces = [];
        board[out] = 2;
        assert('出口が塞がると入口は使えない', isValidPlacement([{ x: inn % BOARD_SIZE, y: (inn / BOARD_SIZE) | 0 }], 1) === false);
        board[out] = 0;
        assert('出口マス自体は普通に打てる', isValidPlacement([{ x: out % BOARD_SIZE, y: (out / BOARD_SIZE) | 0 }], 1) === true);
    `,
};
