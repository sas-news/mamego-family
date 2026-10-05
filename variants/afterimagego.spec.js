// AFTERIMAGEGO — 残響碁: 石が置かれた/消えた場所に残響が残る。自分の残響の上に置くと共鳴して強化
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('ply_cap') || 0.75))) {
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
const ST_INIT = `{ echo: {}, res: [] }`;
const IS_RES = `(i) => st.res.includes(i)`;
module.exports = {
    file: 'afterimagego.html',
    en: 'AFTERIMAGEGO',
    jp: '残響碁',
    prefix: 'afterimagego',
    desc: '着手・消滅した場所に残響が残る。自分の残響の上に置くと共鳴石になり、終局時+1目。',
    kind: 'stone',
    icon: 'afterimagego',
    spec: [
        ...K.rb('AFTERIMAGEGO', '残響碁', 'afterimagego'),
        K.params([
            { key: 'echo_life', label: '残響の持続', min: 10, max: 90, def: 30, unit: '手' },
            { key: 'res_bonus', label: '共鳴石ボーナス', min: 0, max: 4, def: 1, unit: '目' },
            { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' },
        ]),
        ...ST(ST_INIT),
        // 配置: 残響を刻み、自分の残響の上なら共鳴石になる
        [K.ONE, `            move.cells.forEach(p => { board[p.y * BOARD_SIZE + p.x] = player; });`,
`            move.cells.forEach(p => {
                const gi = p.y * BOARD_SIZE + p.x;
                board[gi] = player;
                // 残響の上に置くと共鳴 (30手以内の自分の残響)
                const e = st.echo[gi];
                if (e && e.p === player && history.length - e.at <= (P('echo_life') || 30)) {
                    st.res.push(gi);
                    fxText(gi, '共鳴!', '#c084fc', 1100);
                }
                st.echo[gi] = { p: player, at: history.length };
            });`],
        // 取られた石の場所にも残響が残る
        [K.ONE, K.CAPTURE_BLOCK, `            const captured = getCapturedStones(board, opponent);
            captured.forEach(i => {
                st.echo[i] = { p: opponent, at: history.length };
                const ri = st.res.indexOf(i);
                if (ri >= 0) st.res.splice(ri, 1); // 共鳴が途切れる
            });
            if (captured.length > 0) {
                captured.forEach(idx => board[idx] = 0);
                captures[player] += captured.length;
                soundManager.playCapture();
                cleanUpPieces();
            } else {
                soundManager.playPlace();
            }`],
        // 残響の掃除 (30手で消える)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 残響の掃除: 30手経った残響は消え、盤上に無い共鳴も外す
            Object.keys(st.echo).forEach(k => { if (history.length - st.echo[k].at > (P('echo_life') || 30)) delete st.echo[k]; });
            st.res = st.res.filter(i => board[i] !== 0);

            turn = opponent;`],
        // 共鳴石を得点に加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackRes = st.res.filter(i => board[i] === 1).length * (P('res_bonus') ?? 1);
            const whiteRes = st.res.filter(i => board[i] === 2).length * (P('res_bonus') ?? 1);
            const blackTotal = territory.black + captures[1] + blackRes;
            const whiteTotal = territory.white + captures[2] + komi + whiteRes;`],
        // 残響 (薄い色の環) と共鳴石 (二重環)
        ...K.CUE_STARS(`
            // 残響: 最近石があった場所に薄い環
            Object.keys(st.echo).forEach(k => {
                const i = +k;
                if (board[i] !== 0) return;
                const age = history.length - st.echo[k].at;
                const alpha = Math.max(0.08, 0.3 - age * 0.009);
                ctx.strokeStyle = st.echo[k].p === 1 ? 'rgba(40,40,40,' + alpha + ')' : 'rgba(255,255,255,' + alpha + ')';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.arc(padding + (i % BOARD_SIZE) * cellSize, padding + Math.floor(i / BOARD_SIZE) * cellSize, cellSize * (0.2 + age * 0.008), 0, Math.PI * 2);
                ctx.stroke();
            });`),
        ...K.STONE_MARKS_SPEC(`
            st.res.forEach(i => {
                if (board[i] === 0) return;
                const mx = padding + (i % BOARD_SIZE) * cellSize;
                const my = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                ctx.strokeStyle = '#c084fc';
                ctx.lineWidth = Math.max(1.4, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(mx, my, cellSize * 0.32, 0, Math.PI * 2);
                ctx.stroke();
            });`),
        ...K.EVENT_CHIP_SPEC(`'共鳴 ' + st.res.length`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            残響碁: 石が置かれた/消えた場所に残響が30手残る。自分の残響の上に置くと共鳴石 (終局時+1目)<br>
            PC: クリックで配置<br>
            スマホ: タップで配置`],
        [K.ONE, K.RV_BASE, K.rv([
            '石が置かれた場所と、取られて消えた場所には残響が30手残る (薄い環)。',
            '自分の残響の上に置くと石が共鳴する (紫の環)。共鳴石は終局時+1目。',
            '取られると共鳴は消える。名所の奪い合いが起こるゲーム。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.echo = {}; st.res = [];
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('残響が刻まれる', st.echo[5 * BOARD_SIZE + 5].p === 1);
        // 別の場所に置いてから、自分の残響の上へ (取られた想定: 一旦消す)
        board[5 * BOARD_SIZE + 5] = 0;
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 5, y: 5 }] }, 1);
        assert('残響の上で共鳴', st.res.includes(5 * BOARD_SIZE + 5));
        // 古い残響は消える
        history.length = 100;
        executeMove({ cells: [{ x: 1, y: 1 }] }, 2);
        assert('30手で残響は消える', !st.echo[8 * BOARD_SIZE + 8]);
    `,
};
