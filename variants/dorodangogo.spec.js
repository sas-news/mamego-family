// DORODANGOGO — 泥団子碁: 石は自分の手を重ねるほど磨かれて固くなる (磨き具合で終局ボーナス)
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
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止)
            if (capFired && history.length === 0) capFired = false;
            if (!capFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 80) / 100))) {
                capFired = true;
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
const ST_INIT = `{ pol: {} }`; // 磨き度 idx → 持ち主が何手磨いたか
module.exports = {
    file: 'dorodangogo.html',
    en: 'DORODANGOGO',
    jp: '泥団子碁',
    prefix: 'dorodangogo',
    desc: '石は自分の手を重ねるほど磨かれて光る。磨き1段につき終局+0.5目 (最大5段)。',
    kind: 'stone',
    icon: 'dorodangogo',
    spec: [
        ...K.rb('DORODANGOGO', '泥団子碁', 'dorodangogo'),
        K.params([
            { key: 'pol_max', label: '磨きの最大段数', min: 2, max: 10, def: 5, unit: '段' },
            { key: 'pol_pt', label: '磨き1段の得点', min: 0, max: 2, step: 0.5, def: 0.5, unit: '目' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 80, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        ...ST(ST_INIT),
        // 自分の手番ごとに自分の全石を1段磨く (新しい石は磨き0から)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 泥団子碁: 自分の石は自分の手を重ねるほど磨かれる (最大5段)
            Object.keys(st.pol).forEach(k => {
                if (board[+k] === 0) delete st.pol[k]; // 取られた石の磨きは消える
            });
            for (let i = 0; i < board.length; i++) {
                if (board[i] === player) st.pol[i] = Math.min((P('pol_max') || 5), (st.pol[i] || 0) + 1);
            }

            turn = opponent;`],
        // 磨きボーナス: 磨き1段につき+0.5目
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + polBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + polBonus(2);`],
        [K.ONE, `                    <div class="my-1 border-b border-current/10"></div>`,
`                    <div class="flex justify-between"><span>泥団子の艶:</span> <strong>黒 \${polBonus(1)} / 白 \${polBonus(2)}</strong></div>
                    <div class="my-1 border-b border-current/10"></div>`],
        [K.ONE, `        function endGameByScore() {`,
`        // 磨きボーナス: 自石の磨き度合計 x0.5目
        function polBonus(player) {
            let b = 0;
            for (let i = 0; i < board.length; i++)
                if (board[i] === player) b += (st.pol[i] || 0) * (P('pol_pt') ?? 0.5);
            return b;
        }

        function endGameByScore() {`],
        ...K.STONE_MARKS_SPEC(`            // 磨かれた泥団子: 高磨きの石に艶のハイライト
            {
                ctx.save();
                for (const k in st.pol) {
                    const i = +k;
                    if ((st.pol[k] || 0) < 3 || board[i] === 0) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillStyle = 'rgba(255,255,255,' + (0.18 + st.pol[k] * 0.05) + ')';
                    ctx.beginPath();
                    ctx.arc(cx - cellSize * 0.14, cy - cellSize * 0.16, cellSize * 0.10, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            泥団子碁: 自分の石は自分の手を重ねるほど磨かれて固く光る (磨き1段=+0.5目・最大5段)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '自分の石は、自分が手を指すたびに転がされて磨かれていく (石ごとに最大5段)。',
            '終局時、磨き1段につき+0.5目の艶ボーナス。取られると磨きは失われる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.pol = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('初手で磨き1段', st.pol[4 * BOARD_SIZE + 4] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        assert('3手で磨き3段', st.pol[4 * BOARD_SIZE + 4] === 3);
        assert('艶ボーナス = 段数 x 0.5', polBonus(1) === (3 + 2 + 1) * 0.5);
        executeMove({ cells: [{ x: 9, y: 9 }] }, 2);
        assert('白の手番では黒は磨かれない', st.pol[4 * BOARD_SIZE + 4] === 3);
    `,
};
