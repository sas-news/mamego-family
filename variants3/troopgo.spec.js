// TROOPGO — 猿山碁: 最大の連が群れ。群れを自己記録更新で大きくするとボスに貢物(+1目)
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
const ST_INIT = `{ troop: { 1: 0, 2: 0 } }`;
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
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.8)) {
                capFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'troopgo.html',
    en: 'TROOPGO',
    jp: '猿山碁',
    prefix: 'troopgo',
    desc: '最大の連が猿の群れ。群れを自己最大に育てるたびボスへ貢物+1目。',
    kind: 'stone',
    icon: 'troopgo',
    spec: [
        ...K.rb('TROOPGO', '猿山碁', 'troopgo'),
        ...ST(ST_INIT),
        // 猿山ルール: 着手した連が自己最大の群れ(3石以上)を更新するたび+1目
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 猿山: 着手連が自己最大の群れ記録を更新 (3石以上) すると貢物+1
            {
                const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                const g = getConnectedGroup(mi, player);
                if (g.length >= 3 && g.length > st.troop[player]) {
                    st.troop[player] = g.length;
                    captures[player]++;
                    fxGlow(mi, '#fbbf24', 700);
                    fxText(mi, 'ボスに貢物 +1', '#fbbf24', 1200);
                }
            }

            turn = opponent;`],
        // ボスの印: 最大の連の長(最小index)に冠マーク
        ...K.STONE_MARKS_SPEC(`            {
                // 現在の手番側の最大の連の先頭石に冠を描く
                const seen = {};
                let best = null;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== turn || seen[i]) continue;
                    const g = getConnectedGroup(i, turn);
                    g.forEach(j => { seen[j] = true; });
                    if (!best || g.length > best.length) best = g;
                }
                if (best && best.length >= 3) {
                    const i = best[0];
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.save();
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.moveTo(cx - cellSize * 0.18, cy - cellSize * 0.10);
                    ctx.lineTo(cx - cellSize * 0.18, cy - cellSize * 0.26);
                    ctx.lineTo(cx - cellSize * 0.06, cy - cellSize * 0.14);
                    ctx.lineTo(cx, cy - cellSize * 0.28);
                    ctx.lineTo(cx + cellSize * 0.06, cy - cellSize * 0.14);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.26);
                    ctx.lineTo(cx + cellSize * 0.18, cy - cellSize * 0.10);
                    ctx.closePath();
                    ctx.fill();
                    ctx.restore();
                }
            }`),
        ...K.EVENT_CHIP_SPEC(`'群れの記録 ' + st.troop[turn] + '石'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            猿山碁: 最大の連はボス率いる群れ。着手連が自己記録 (3石〜) を更新するたび+1目<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '着手した連が自分の「群れの最大記録」 (3石以上から) を更新するたび、ボスへの貢物で+1目。',
            '大きな群れを育てるほど貢物が増えるが、取られても記録は戻らない。両者同じ条件。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.troop = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        assert('2石ではまだ貢物なし', captures[1] === 0 && st.troop[1] === 0);
        executeMove({ cells: [{ x: 6, y: 4 }] }, 1);
        assert('3石で貢物+1', captures[1] === 1 && st.troop[1] === 3);
        executeMove({ cells: [{ x: 7, y: 4 }] }, 1);
        assert('記録更新でさらに+1', captures[1] === 2 && st.troop[1] === 4);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 2) === true);
    `,
};
