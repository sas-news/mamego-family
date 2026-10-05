// ROKKIGO — 六曜碁: 六曜(6手周期)が回り、大安の日に置いた石は吉(+2)、仏滅の石は凶(-1)
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
const ST_INIT = `{ pcnt: 0, marks: {} }`;
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
module.exports = {
    file: 'rokkigo.html',
    en: 'ROKKIGO',
    jp: '六曜碁',
    prefix: 'rokkigo',
    desc: '六曜が6手周期で回る。大安に置いた石は吉+2点、仏滅に置いた石は凶-1点。',
    kind: 'stone',
    icon: 'rokkigo',
    spec: [
        ...K.rb('ROKKIGO', '六曜碁', 'rokkigo'),
        K.params([
            { key: 'taian_bonus', label: '大安の吉点', min: 0, max: 10, def: 2, unit: '目' },
            { key: 'butsumetsu_penalty', label: '仏滅の凶点', min: 0, max: 10, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        ...ST(ST_INIT),
        // 六曜ヘルパー
        [K.ONE, `        function endGameByScore() {`, `        // 六曜: 先勝→友引→先負→仏滅→大安→赤口
        const ROKKI_DAYS = ['先勝', '友引', '先負', '仏滅', '大安', '赤口'];
        function rokkiDay() { return st.pcnt % 6; } // 着手前の今日
        function rokkiScore(pl) {
            let s = 0;
            for (const k in st.marks) {
                const i = +k;
                if (board[i] !== pl) continue;
                if (st.marks[i] === 4) s += (P('taian_bonus') ?? 2);      // 大安の石は吉
                else if (st.marks[i] === 3) s -= (P('butsumetsu_penalty') ?? 1); // 仏滅の石は凶
            }
            return s;
        }

        function endGameByScore() {`],
        // 採点に吉凶点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + rokkiScore(1);
            const whiteTotal = territory.white + captures[2] + komi + rokkiScore(2);`],
        // 六曜: 着手した石に今日の六曜印が付く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 六曜: 着手で日が進み、置いた石にその日の印が付く
            {
                const cell = move.cells[0].y * BOARD_SIZE + move.cells[0].x;
                st.marks[cell] = rokkiDay();
                if (rokkiDay() === 4) fxGlow(cell, '#fde047', 700);
                else if (rokkiDay() === 3) fxText(cell, '凶', '#94a3b8', 900);
                st.pcnt++;
            }

            turn = opponent;`],
        // 吉凶印を描く (大安=金環、仏滅=灰×)
        ...K.STONE_MARKS_SPEC(`            // 六曜: 大安の石に金環、仏滅の石に凶印
            {
                ctx.save();
                for (const k in st.marks) {
                    const i = +k;
                    if (board[i] !== 1 && board[i] !== 2) continue;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    if (st.marks[i] === 4) {
                        ctx.strokeStyle = 'rgba(253,224,71,0.9)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.4, 0, Math.PI * 2);
                        ctx.stroke();
                    } else if (st.marks[i] === 3) {
                        ctx.strokeStyle = 'rgba(148,163,184,0.9)';
                        ctx.lineWidth = Math.max(1, cellSize * 0.05);
                        const r = cellSize * 0.16;
                        ctx.beginPath();
                        ctx.moveTo(cx - r, cy - r); ctx.lineTo(cx + r, cy + r);
                        ctx.moveTo(cx + r, cy - r); ctx.lineTo(cx - r, cy + r);
                        ctx.stroke();
                    }
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'今日: ' + ROKKI_DAYS[st.pcnt % 6]`),
        [K.ONE, K.INFO_BASE, `            六曜碁: 六曜が6手周期で回る。大安に置いた石は吉+2点、仏滅に置いた石は凶-1点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '石を置くたび日が進み、六曜 (先勝→友引→先負→仏滅→大安→赤口) が6手周期で回る。',
            '置いた石にはその日の印が付く。終局時に盤上にある大安の石は1つ+2点、仏滅の石は1つ-1点。',
            '印は相手にも同じ周期 — 大安の日は奪い合い、仏滅の日は置かない判断も一手。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        st.pcnt = 0; st.marks = {};
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        st.pcnt = 4; // 今日は大安
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('大安の石は吉', st.marks[0] === 4 && rokkiScore(1) === 2);
        st.pcnt = 3; // 今日は仏滅
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        assert('仏滅の石は凶', st.marks[1] === 3 && rokkiScore(1) === 1);
        st.pcnt = 4;
        executeMove({ cells: [{ x: 5, y: 5 }] }, 2);
        assert('白も同条件で吉', st.marks[5 * B + 5] === 4 && rokkiScore(2) === 2);
    `,
};
