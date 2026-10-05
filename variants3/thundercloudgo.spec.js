// THUNDERCLOUDGO — 雷雲碁: 雷雲が盤上を漂い、16手ごとに落雷。3x3の範囲の石が吹き飛ぶ
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
const ST_INIT = `{ cloud: { x: 2, y: 2 } }`;
module.exports = {
    file: 'thundercloudgo.html',
    en: 'THUNDERCLOUDGO',
    jp: '雷雲碁',
    prefix: 'thundercloudgo',
    desc: '雷雲が盤を漂い、16手ごとに落雷。雲の下の3x3の石が吹き飛ぶ。',
    kind: 'stone',
    icon: 'thundercloudgo',
    spec: [
        ...K.rb('THUNDERCLOUDGO', '雷雲碁', 'thundercloudgo'),
        K.params([
            { key: 'strike_interval', label: '落雷の間隔', min: 4, max: 40, def: 16, unit: '手' },
            { key: 'blast_r', label: '落雷範囲の半径', min: 0, max: 3, def: 1, hint: '1=3x3' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        ...ST(ST_INIT),
        // 落雷: 16手ごとに雲の下 3x3 の石が吹き飛び、雲は次の位置へ
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 落雷: 16手ごとに雷雲の下 (3x3) の石が吹き飛ぶ
            if (history.length > 0 && history.length % (P('strike_interval') || 16) === 0) {
                const victims = [];
                const br = P('blast_r') || 1;
                for (let dy = -br; dy <= br; dy++) {
                    for (let dx = -br; dx <= br; dx++) {
                        const x = st.cloud.x + dx, y = st.cloud.y + dy;
                        if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) continue;
                        const i = y * BOARD_SIZE + x;
                        if (board[i] === 1 || board[i] === 2) victims.push(i);
                    }
                }
                // 全滅防止: 盤上の石が全部吹き飛ぶなら1個残す
                const total = board.filter(v => v === 1 || v === 2).length;
                const keep = victims.length >= total && victims.length > 0 ? victims[0] : -1;
                victims.forEach(i => {
                    if (i === keep) return;
                    board[i] = 0;
                    fxBurst(i, '#facc15', 10, 2.0);
                });
                if (victims.length - (keep >= 0 ? 1 : 0) > 0) {
                    fxText(st.cloud.y * BOARD_SIZE + st.cloud.x, '落雷!', '#facc15', 1300);
                    fxShake(6, 400);
                    soundManager.playCapture();
                    cleanUpPieces();
                }
                // 雲の移動 (一周する巡回)
                st.cloud.x = (st.cloud.x + 5) % (BOARD_SIZE - 2) + 1;
                st.cloud.y = (st.cloud.y + 3) % (BOARD_SIZE - 2) + 1;
            }

            turn = opponent;`],
        // 雷雲の可視化
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 雷雲: 雲の位置に暗い雲塊と稲妻の予兆を描く
        fxAmbient((ctx2, now, pad, cs) => {
            const cx = pad + st.cloud.x * cs, cy = pad + st.cloud.y * cs;
            ctx2.save();
            ctx2.fillStyle = 'rgba(51,65,85,0.5)';
            [[0, 0], [-0.6, 0.12], [0.6, 0.12], [0, -0.4]].forEach(([dx, dy]) => {
                ctx2.beginPath();
                ctx2.arc(cx + dx * cs, cy + dy * cs, cs * 0.55, 0, Math.PI * 2);
                ctx2.fill();
            });
            const warn = (P('strike_interval') || 16) - (history.length % (P('strike_interval') || 16));
            if (warn <= 3) {
                ctx2.strokeStyle = 'rgba(250,204,21,' + (0.4 + 0.4 * Math.sin(now / 120)) + ')';
                ctx2.lineWidth = cs * 0.06;
                const br = P('blast_r') || 1;
                for (let dy = -br; dy <= br; dy++) for (let dx = -br; dx <= br; dx++) {
                    const x = st.cloud.x + dx, y = st.cloud.y + dy;
                    if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) continue;
                    ctx2.strokeRect(pad + x * cs - cs * 0.45, pad + y * cs - cs * 0.45, cs * 0.9, cs * 0.9);
                }
            }
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`'落雷まで ' + ((P('strike_interval') || 16) - history.length % (P('strike_interval') || 16)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            雷雲碁: 雷雲が盤を漂い、16手毎に雲の下 3x3 の石が吹き飛ぶ<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '雷雲は盤上を巡回する。16手ごとに雲の下の3x3範囲に落雷し、そこの石は全部吹き飛ぶ。',
            '吹き飛ぶ石は取りにもならない。落雷前3手は危険域が点滅する。',
            '盤上の石が全部吹き飛ぶ時は1個だけ残る。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.cloud = { x: 2, y: 2 };
        // 雲の近くと遠くに石
        [[2, 2], [3, 3], [10, 10]].forEach(([x, y]) => {
            board[y * BOARD_SIZE + x] = 1;
            pieces.push({ p: 1, cells: [{ x, y }] });
        });
        history.length = 15;
        const oldCloud = { ...st.cloud };
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('雲の下の石が吹き飛ぶ', board[2 * BOARD_SIZE + 2] === 0);
        assert('3x3内の石も吹き飛ぶ', board[3 * BOARD_SIZE + 3] === 0);
        assert('遠くの石は残る', board[10 * BOARD_SIZE + 10] === 1);
        assert('雲が移動する', st.cloud.x !== oldCloud.x || st.cloud.y !== oldCloud.y);
    `,
};
