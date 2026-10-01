// POLARITYGO — 磁界碁: 列の偶奇でN極S極。縦の敵石は反発して押し退く、横に離れた敵石は吸着して引き寄せる
const K = require('../gen_kit.js');
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'polaritygo.html',
    en: 'POLARITYGO',
    jp: '磁界碁',
    prefix: 'polaritygo',
    desc: '偶数列はN極・奇数列はS極。縦の敵石は反発で押し退き、横に2マスの敵石は吸着で引き寄せられる。',
    kind: 'stone',
    icon: 'polaritygo',
    spec: [
        ...K.rb('POLARITYGO', '磁界碁', 'polaritygo'),
        K.params([{ key: 'repel_d', label: '反発の距離', min: 1, max: 3, def: 1, unit: 'マス' }, { key: 'attract_d', label: '吸着の届く距離', min: 1, max: 3, def: 1, unit: 'マス', hint: '1=2マス先を1マス引く' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.8, def: 0.9, step: 0.05, hint: '交点数×倍率' }]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 磁界: 偶数列=N極・奇数列=S極
        function poleOf(x) { return x % 2 === 0 ? 'N' : 'S'; }
        // 着手段の磁力: 同極の敵石を押し退き、異極の敵石を引き寄せる
        function magnetPush(px, py, player, mv) {
            const opp = player === 1 ? 2 : 1;
            const jobs = [];
            // 反発: 同じ列の上下の敵石を1マス押し退く
            [-1, 1].forEach(dy => {
                const _rd = Math.max(1, P('repel_d') || 1), ny = py + dy, ty = py + dy * (1 + _rd);
                if (ny < 0 || ny >= BOARD_SIZE || ty < 0 || ty >= BOARD_SIZE) return;
                const ni = ny * BOARD_SIZE + px, ti = ty * BOARD_SIZE + px;
                if (board[ni] === opp && board[ti] === 0) jobs.push([ni, ti]);
            });
            // 吸着: 左右2マスの敵石を1マス引き寄せる
            [-1, 1].forEach(dx => {
                const _ad = Math.max(1, P('attract_d') || 1) + 1, nx = px + dx * _ad, tx = px + dx * (_ad - 1);
                if (nx < 0 || nx >= BOARD_SIZE) return;
                const ni = py * BOARD_SIZE + nx, ti = py * BOARD_SIZE + tx;
                if (board[ni] === opp && board[ti] === 0) jobs.push([ni, ti]);
            });
            jobs.forEach(([ni, ti]) => {
                board[ti] = board[ni];
                board[ni] = 0;
                pieces.push({ id: Date.now() + Math.random(), player: opp, type: mv.type, rot: mv.rot, cells: [{ x: ti % BOARD_SIZE, y: Math.floor(ti / BOARD_SIZE) }] });
                fxSlide(ni, ti, 360);
            });
            if (jobs.length) { fxShake(4, 300); cleanUpPieces(); }
        }`],
        // 着手後に磁力を解決 (取り判定の前)
        [K.ONE, `            // 捕獲処理
            const opponent = player === 1 ? 2 : 1;`,
`            // 磁界: 着手の磁力で敵石が動く (捕獲の前)
            if (move.cells.length === 1) magnetPush(move.cells[0].x, move.cells[0].y, player, move);

            // 捕獲処理
            const opponent = player === 1 ? 2 : 1;`],
        // 極性マーク
        ...K.STONE_MARKS_SPEC(`            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                if (v !== 1 && v !== 2) continue;
                const cx = padding + x * cellSize, cy = padding + y * cellSize;
                ctx.save();
                ctx.fillStyle = poleOf(x) === 'N'
                    ? (v === 1 ? 'rgba(120,180,255,0.95)' : 'rgba(30,80,180,0.9)')
                    : (v === 1 ? 'rgba(255,140,120,0.95)' : 'rgba(180,50,30,0.9)');
                ctx.font = 'bold ' + Math.max(8, cellSize * 0.3) + 'px sans-serif';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillText(poleOf(x), cx, cy);
                ctx.restore();
            }`),
        K.CUE_GRID(`            // N/S の列帯
            {
                ctx.save();
                for (let x = 0; x < BOARD_SIZE; x++) {
                    ctx.fillStyle = poleOf(x) === 'N' ? 'rgba(80,130,220,0.10)' : 'rgba(220,90,70,0.10)';
                    ctx.fillRect(padding + (x - 0.5) * cellSize, padding - cellSize / 2, cellSize, cellSize * BOARD_SIZE);
                }
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            磁界碁: 偶数列=N・奇数列=S。縦の敵石は反発、横に2マスの敵石は吸着<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '列に極性がある: 偶数列はN極、奇数列はS極。',
            '着手すると同じ列 (同極) の上下の敵石は反発して1マス押し退く。',
            '左右2マス (異極) の敵石は吸着して1マス引き寄せられる。',
            '磁力は取り判定の前に働く — 押し込んで囲み、引き寄せて絞めよ。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('極性は列で決まる', poleOf(0) === 'N' && poleOf(1) === 'S' && poleOf(4) === 'N');
        board[I(4, 4)] = 2;
        executeMove({ cells: [{ x: 4, y: 5 }] }, 1); // 同じ列の下から近づく → 上に押し退く
        assert('同極の敵石は反発する', board[I(4, 4)] === 0 && board[I(4, 3)] === 2);
        board.fill(0); pieces = []; history.length = 0;
        board[I(6, 3)] = 2;
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // 右2マスの敵石 → 1マス引き寄せ
        assert('異極の敵石は吸着する', board[I(6, 3)] === 0 && board[I(5, 3)] === 2);
        board.fill(0); pieces = []; history.length = 0;
        assert('起動して通常着手可', isValidPlacement([{ x: 7, y: 7 }], 1) === true);
    `,
};
