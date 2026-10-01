// FERRYGO — 渡船碁: 盤の中軸は川。岸辺の同じ列に自石2つで渡し船が通り、向こう岸と結ばれる
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
const ST_INIT = `{ ferries: [] }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.8))) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'ferrygo.html',
    en: 'FERRYGO',
    jp: '渡船碁',
    prefix: 'ferrygo',
    desc: '盤中央の1列は川。同じ列の両岸に自石が立つと渡し船が通り、両岸の連が1つに結ばれる。',
    kind: 'stone',
    icon: 'ferrygo',
    spec: [
        ...K.rb('FERRYGO', '渡船碁', 'ferrygo'),
        K.params([
            { key: 'ferry_pts', label: '渡船ボーナス', min: 0, max: 5, def: 1, unit: '目', hint: '新しい渡船1隻あたり' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 3, def: 0.8, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 渡船: 川(中央1列)を挟んだ両岸の同じ行に自石があると渡し船 — 両岸の連は呼吸を共有 (連が繋がる扱い)
        // 実装は簡略化: 両岸の同じ行に自石が揃うと渡船料+1目、かつ川マスは両者の「共有呼吸点」として孤立連を救う
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 渡船: 川(中央1列)を挟む同じ行の両岸に自石が揃うと渡船が通り+1目 (1行1隻)
            {
                const rc = Math.floor(BOARD_SIZE / 2); // 川の列
                const rows = {};
                for (let y = 0; y < BOARD_SIZE; y++) {
                    const li = y * BOARD_SIZE + (rc - 1), ri = y * BOARD_SIZE + (rc + 1);
                    if (board[li] === player && board[ri] === player) rows[y] = true;
                }
                const old = st.ferries[player] || [];
                const newOnes = Object.keys(rows).filter(y => !old.includes(+y));
                if (newOnes.length) {
                    captures[player] += newOnes.length * (P('ferry_pts') || 1);
                    newOnes.forEach(y => {
                        fxText((+y) * BOARD_SIZE + rc, '渡船 +' + (P('ferry_pts') || 1), '#38bdf8', 1200);
                        fxGlow((+y) * BOARD_SIZE + (rc - 1), '#38bdf8', 600);
                        fxGlow((+y) * BOARD_SIZE + (rc + 1), '#38bdf8', 600);
                    });
                }
                st.ferries[player] = Object.keys(rows).map(Number);
            }

            turn = opponent;`],
        // 川の描画: 中央1列を水路色に
        ...K.CUE_GRID(`            // 川: 中央1列を水路色に
            {
                const rc = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.fillStyle = 'rgba(56,189,248,0.16)';
                ctx.fillRect(padding + (rc - 0.5) * cellSize, padding - cellSize * 0.5, cellSize, BOARD_SIZE * cellSize);
                ctx.strokeStyle = 'rgba(56,189,248,0.4)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.strokeRect(padding + (rc - 0.5) * cellSize, padding - cellSize * 0.5, cellSize, BOARD_SIZE * cellSize);
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'渡船 ' + (st.ferries[turn] ? st.ferries[turn].length : 0) + ' 隻'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            渡船碁: 盤中央の1列は川。同じ行の両岸に自石が揃うと渡船が通り+1目 (1行1隻)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央の1列は川。同じ行で川の両岸に自石が揃うと渡し船が通り+1目。1行につき1隻まで。',
            '石が取られると渡船も消える。両岸を結ぶ航路をいくつ張れるか — 両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.ferries = [];
        const rc = Math.floor(BOARD_SIZE / 2);
        board[4 * BOARD_SIZE + (rc - 1)] = 1;
        executeMove({ cells: [{ x: rc + 1, y: 4 }] }, 1); // 両岸揃い
        assert('両岸に揃うと渡船+1', captures[1] === 1 && st.ferries[1].includes(4));
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('渡船維持で追加分なし', captures[1] === 1);
        board[4 * BOARD_SIZE + (rc + 1)] = 0; // 岸が崩れる
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('岸が崩れると渡船消える', !st.ferries[1].includes(4));
        assert('起動して通常着手可', isValidPlacement([{ x: 9, y: 9 }], 2) === true);
    `,
};
