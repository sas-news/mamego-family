// GARAPONGO — 宝籤碁: 各側5手ごとの着手後にガラポンを回す。金+4目・白+2目・赤は敵石1個獲得・ハズレ無し
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
const ST_INIT = `{ pcnt: { 1: 0, 2: 0 } }`;
module.exports = {
    file: 'garapongo.html',
    en: 'GARAPONGO',
    jp: '宝籤碁',
    prefix: 'garapongo',
    desc: '5手ごとにガラポンを回す。金+4目/白+2目/赤=敵石1個/ハズレ。両者同じ周期。',
    kind: 'stone',
    icon: 'garapongo',
    spec: [
        ...K.rb('GARAPONGO', '宝籤碁', 'garapongo'),
        K.params([
            { key: 'garapon_interval', label: 'ガラポンの周期', min: 2, max: 20, def: 5, unit: '手' },
            { key: 'gold_prob', label: '金玉の確率', min: 0.02, max: 0.4, step: 0.01, def: 0.1 },
            { key: 'silver_prob', label: '白玉の確率', min: 0.02, max: 0.6, step: 0.01, def: 0.2 },
            { key: 'gold_pts', label: '金玉の得点', min: 1, max: 16, def: 4, unit: '目' },
            { key: 'silver_pts', label: '白玉の得点', min: 1, max: 8, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (盤面比)', min: 0.3, max: 1.5, step: 0.05, def: 0.75 },
        ]),
        ...ST(ST_INIT),

        // ガラポン: 各側5手ごとに玉が出る
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 宝籤碁: 5手ごとにガラポン — 金+4/白+2/赤=敵石1個/ハズレ
            st.pcnt[player]++;
            if (st.pcnt[player] % Math.max(1, P('garapon_interval') || 5) === 0) {
                const pi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                fxShake(5, 300);
                const _gp = P('gold_prob') || 0.10, _sp = P('silver_prob') || 0.20;
                const r = Math.random();
                if (r < _gp) {
                    captures[player] += (P('gold_pts') || 4);
                    fxText(pi, '金 +' + (P('gold_pts') || 4) + '!', '#facc15', 1400);
                    fxGlow(pi, '#facc15', 950);
                } else if (r < _gp + _sp) {
                    captures[player] += (P('silver_pts') || 2);
                    fxText(pi, '白 +' + (P('silver_pts') || 2), '#e2e8f0', 1200);
                } else if (r < _gp + _sp + (P('red_prob') || 0.15)) {
                    const foes = [];
                    for (let i = 0; i < board.length; i++) if (board[i] === opponent) foes.push(i);
                    if (foes.length) {
                        const t = foes[Math.floor(Math.random() * foes.length)];
                        board[t] = 0; captures[player]++;
                        fxBurst(t, '#ef4444', 12, 1.8);
                        fxText(t, '赤玉命中!', '#ef4444', 1200);
                        cleanUpPieces();
                    } else {
                        fxText(pi, 'ハズレ', '#94a3b8', 900);
                    }
                } else {
                    fxText(pi, 'ハズレ', '#94a3b8', 900);
                }
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`'ガラポンまで ' + ((P('garapon_interval') || 5) - (st.pcnt[turn] || 0) % (P('garapon_interval') || 5)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            宝籤碁: 各側5手ごとの着手後にガラポンを回す。金+4目/白+2目/赤=敵石1個獲得/ハズレ<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の5回目の着手ごとにガラポンが回る。出た玉で効果が決まる。',
            '金10%=+4目、白20%=+2目、赤15%=敵石1個がそのままアゲハマ、残りはハズレ。',
            '両者同じ周期の運試し。回る直前の手番が少しだけ期待値を持つ。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.pcnt = { 1: 4, 2: 0 };
        const _r = Math.random;
        Math.random = () => 0.05; // 金
        executeMove({ cells: [{ x: 1, y: 1 }] }, 1);
        assert('金で+4目', captures[1] === 4);
        Math.random = () => 0.20; // 白
        st.pcnt[2] = 4;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 2);
        assert('白玉で+2目', captures[2] === 2);
        Math.random = () => 0.99; // ハズレ
        st.pcnt[1] = 9;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('ハズレは増分なし', captures[1] === 4);
        Math.random = _r;
    `,
};
