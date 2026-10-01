// PRIZEBOARDGO — 宝盤碁: 全着手点に1〜6の数字。終局時にルーレットの出目の数字の占有点が+3
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
const ST_INIT = `{ nums: null, roll: null }`;
const NUMS_FN = `        // 宝盤: 各着手点に1〜6の当たり数字 (盤サイズに合わせて生成)
        function prizeNums() {
            if (!st.nums || st.nums.length !== board.length) {
                st.nums = board.map(() => 1 + Math.floor(Math.random() * (P('num_max') || 6)));
            }
            return st.nums;
        }
`;
module.exports = {
    file: 'prizeboardgo.html',
    en: 'PRIZEBOARDGO',
    jp: '宝盤碁',
    prefix: 'prizeboardgo',
    desc: '全着手点に1〜6の数字。終局時のルーレットの出目と同じ数字の占有点は+3。',
    kind: 'stone',
    icon: 'prizeboardgo',
    spec: [
        ...K.rb('PRIZEBOARDGO', '宝盤碁', 'prizeboardgo'),
        K.params([{ key: 'num_max', label: '当たり数字の種類', min: 3, max: 10, def: 6, unit: '種類' }, { key: 'hit_pts', label: '命中1点の得点', min: 1, max: 9, def: 3, unit: '目' }, { key: 'ply_cap', label: '打ち切り手数', min: 0.4, max: 1.5, def: 0.75, step: 0.05, hint: '交点数×倍率' }]),
        ...ST(ST_INIT),
        [K.ONE, '        function updateUI() {', NUMS_FN + `
        function updateUI() {`],
        // 終局時: ルーレットを回し、出目の数字を占める石ごとに+3
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const nums = prizeNums();
            if (st.roll == null) st.roll = 1 + Math.floor(Math.random() * (P('num_max') || 6));
            const hitB = nums.filter((n, i) => n === st.roll && board[i] === 1).length * (P('hit_pts') || 3);
            const hitW = nums.filter((n, i) => n === st.roll && board[i] === 2).length * (P('hit_pts') || 3);
            const blackTotal = territory.black + captures[1] + hitB;
            const whiteTotal = territory.white + captures[2] + komi + hitW;`],
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>`,
`                    <div class="flex justify-between font-bold border-t pt-1"><span>白合計:</span> <span>\${whiteTotal}</span></div>
                    <div class="mt-1 text-xs">出目 \${st.roll}: 黒+\${hitB} / 白+\${hitW}</div>`],
        ...K.STONE_MARKS_SPEC(`            // 宝盤: 各点の当たり数字を薄く表示
            {
                ctx.save();
                const nums = prizeNums();
                ctx.fillStyle = 'rgba(146,64,14,0.35)';
                ctx.font = \`\${Math.max(7, cellSize * 0.2)}px sans-serif\`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let i = 0; i < board.length; i++) {
                    if (board[i] !== 0) continue;
                    const cx = padding + (i % BOARD_SIZE) * cellSize;
                    const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                    ctx.fillText(String(nums[i]), cx + cellSize * 0.28, cy - cellSize * 0.28);
                }
                ctx.restore();
            }`),
        ...GAME_OVER,
        [K.ONE, K.INFO_ALGO, `            宝盤碁: 全着手点に1〜6の当たり数字。終局の出目と同じ数字の占有点は+3<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の全点に1〜6の「当たり数字」が書かれている (右上の小さな数字)。',
            '終局時にルーレットが回り、出た目と同じ数字の点を自分の石で占めていれば1点につき+3。',
            'どの目が出るか分からないので、数字を散らして占める博打打ちの碁。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        st.nums = null; st.roll = null;
        const nums = prizeNums();
        assert('数字は盤と同じ長さ', nums.length === board.length);
        assert('数字は1〜6', nums.every(n => n >= 1 && n <= 6));
        // 出目を3に固定して黒が該当セルを占有
        st.nums = board.map(() => 3);
        st.roll = 3;
        const hitIdx = 0;
        board[hitIdx] = 1;
        endGameByScore();
        assert('終局できる', gameOver === true);
        assert('出目ボーナスが明記', gameResultData.details.includes('出目 3') && gameResultData.details.includes('黒+3'));
    `,
};
