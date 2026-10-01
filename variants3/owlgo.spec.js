// OWLGO — 梟碁: 各側4手ごとの「夜」に梟が目覚め、隣の敵石1つを狩る
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 } }`;
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let capFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'owlgo.html',
    en: 'OWLGO',
    jp: '梟碁',
    prefix: 'owlgo',
    desc: '各側4手ごとに訪れる「夜」。その手の梟は隣の敵石を1つ狩る。',
    kind: 'stone',
    icon: 'owlgo',
    spec: [
        ...K.rb('OWLGO', '梟碁', 'owlgo'),
        K.params([
            { key: 'night_interval', label: '夜の周期', min: 2, max: 10, def: 4, unit: '手ごと' },
            { key: 'prey_max', label: '1夜に狩れる敵石数', min: 1, max: 4, def: 1, unit: '個' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.8, step: 0.05 },
        ]),
        ...ST(ST_INIT),
        // 梟ルール: 各プレイヤーの4手ごとの着手は夜。梟が隣の敵石を1つ狩る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 梟: 各側4手ごとの着手は夜 — 隣接する敵石1つを狩る
            {
                st.pcnt[player] = (st.pcnt[player] || 0) + 1;
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                if (st.pcnt[player] % Math.max(2, P('night_interval') || 4) === 0) {
                    // 夜の狩り: 隣の敵石 (孤立した獲物を優先)
                    const foes = getNeighbors(mi).filter(i => board[i] === opponent);
                    const lone = foes.filter(i => getNeighbors(i).every(n => board[n] !== opponent));
                    const pool = lone.length ? lone : foes;
                    const preyList = pool.slice(0, Math.max(1, P('prey_max') || 1));
                    if (preyList.length) {
                        preyList.forEach(prey => {
                            board[prey] = 0;
                            captures[player]++;
                            fxBurst(prey, '#6366f1', 12, 1.6);
                        });
                        fxGlow(mi, '#818cf8', 800);
                        fxText(mi, '夜の狩り!', '#a5b4fc', 1200);
                        cleanUpPieces();
                    } else {
                        fxGlow(mi, '#818cf8', 600);
                        fxText(mi, '梟が見ている…', '#a5b4fc', 900);
                    }
                }
            }

            turn = opponent;`],
        // 常夜の薄暗がりと月明かり
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 夜の気配: 常時ほの暗いヴィネット
        fxAmbient((ctx2, now, pad, cs) => {
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.fillStyle = 'rgba(8,10,40,0.16)';
            ctx2.fillRect(0, 0, w, w);
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`st.pcnt[turn] % (P('night_interval') || 4) === (P('night_interval') || 4) - 1 ? '今晩は夜! 梟が狩る' : '夜まで ' + ((P('night_interval') || 4) - (st.pcnt[turn] || 0) % (P('night_interval') || 4)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            梟碁: 自分の4手ごとの着手は「夜」。その手に置いた梟は隣の敵石を1つ狩る<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '自分の着手数が4の倍数の手は「夜」— 置いた梟が隣接する敵石1つを狩る (孤立した獲物を優先)。',
            '昼 (他の手) では梟は眠る。夜の手番は両者に同じ周期で訪れる対称ルール。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 3, 2: 0 };
        board[4 * BOARD_SIZE + 5] = 2; // 隣の獲物
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('夜に隣の敵石を狩る', board[4 * BOARD_SIZE + 5] === 0 && captures[1] === 1);
        st.pcnt = { 1: 0, 2: 0 };
        board[8 * BOARD_SIZE + 5] = 2;
        executeMove({ cells: [{ x: 8, y: 4 }] }, 1);
        assert('昼は眠る (狩らない)', board[8 * BOARD_SIZE + 5] === 2);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
