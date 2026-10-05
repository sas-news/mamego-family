// MISOGO — 味噌碁: 味噌樽区域に入った連は取られない (発酵で石が硬くなる)
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.9))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'misogo.html',
    en: 'MISOGO',
    jp: '味噌碁',
    prefix: 'misogo',
    desc: '味噌樽に漬かった連は発酵して固くなり、二度と取られない。',
    kind: 'stone',
    icon: 'misogo',
    spec: [
        ...K.rb('MISOGO', '味噌碁', 'misogo'),
        K.params([
            { key: 'taru_size', label: '味噌樽のサイズ', min: 1, max: 4, def: 2, unit: 'マス', hint: '対角2箇所の正方形区域の一辺' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.9, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        // 味噌樽: 対角の2つの正方形区域 (サイズは設定で調整)
        const TARU_SET = new Set();
        function rebuildTaru() {
            TARU_SET.clear();
            const tc = Math.floor(BOARD_SIZE / 3);
            const ts = Math.max(1, P('taru_size') || 2);
            [[tc, tc], [BOARD_SIZE - ts - tc, BOARD_SIZE - ts - tc]].forEach(([bx, by]) => {
                for (let dy = 0; dy < ts; dy++) for (let dx = 0; dx < ts; dx++) {
                    TARU_SET.add((by + dy) * BOARD_SIZE + (bx + dx));
                }
            });
        }
        rebuildTaru();
        // 設定変更で区域を即時再構成
        function onVariantParam(p) {
            if (p.key === 'taru_size') rebuildTaru();
        }`],
        // 樽の中の連は発酵して固くなる — 取られない
        [K.ONE, `                    if (!hasLiberty) {
                        captured.push(...group);
                    }`,
`                    // 味噌樽: 樽内の石を含む連は発酵して取られない
                    const inTaru = group.some(g => TARU_SET.has(g));
                    if (!hasLiberty && !inTaru) {
                        captured.push(...group);
                    }`],
        // 樽の描画: 茶色の木樽区域
        K.CUE_GRID(`            // 味噌樽: 木樽の区域
            {
                ctx.save();
                TARU_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.fillStyle = 'rgba(146, 64, 14, 0.22)';
                    ctx.fillRect(cx - cellSize * 0.5, cy - cellSize * 0.5, cellSize, cellSize);
                });
                ctx.strokeStyle = 'rgba(92, 40, 8, 0.6)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                TARU_SET.forEach(i => {
                    const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.beginPath();
                    ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'味噌樽 ' + [...TARU_SET].filter(i => board[i] === 1 || board[i] === 2).length + '石'`),
        [K.ONE, K.INFO_BASE, `            味噌碁: 味噌樽区域に入った連は発酵して固くなり取られない<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '対角の2つの「味噌樽」区域。樽の中に石を含む連は発酵して固くなり、呼吸点が0でも取られない。',
            '樽は両者共通の聖域。敵石が樽に入れば同様に取れなくなる — 小さな区域を巡る攻防。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        resetGame();
        assert('味噌樽は8点', TARU_SET.size === 8);
        // 樽内の白石を完全に囲んでも取れない
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const zi = [...TARU_SET][0];
        const zx = zi % BOARD_SIZE, zy = (zi / BOARD_SIZE) | 0;
        board[zi] = 2;
        getNeighbors(zi).forEach(n => { if (!TARU_SET.has(n)) board[n] = 1; });
        // 樽内の全セルを囲むため樽内の味方石も全て黒で塞ぐ
        TARU_SET.forEach(i => { if (i !== zi) board[i] = 1; });
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('樽の石は取られない', board[zi] === 2);
        // 樽の外の石は普通に取れる
        board.fill(0); pieces = []; history.length = 0;
        board[I(5, 0)] = 2; board[I(4, 0)] = 1; board[I(6, 0)] = 1; board[I(5, 1)] = 1;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 1);
        assert('樽の外は普通に取れる', board[I(5, 0)] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
