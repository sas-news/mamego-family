// TUGGO — 綱引碁: 中央の綱標が侵入度で行方を変える。敵陣に深く侵入した側が標を引き寄せ、端まで届けば勝ち
const K = require('../gen_kit.js');
const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 0.75)) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'tuggo.html',
    en: 'TUGGO',
    jp: '綱引碁',
    prefix: 'tuggo',
    desc: '中央の綱標を引き合う。敵陣への侵入数で標が動き、端まで引けば勝利。',
    kind: 'stone',
    icon: 'tuggo',
    spec: [
        ...K.rb('TUGGO', '綱引碁', 'tuggo'),
        // winByRule + 綱標の状態 (st.knot: 標の行 = 黒側に近いほど小さい)
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN +
`        // 綱標: st.knot は標の行位置 (0=白陣端, BOARD_SIZE-1=黒陣端, 中央=mid)
        // 黒の侵入 (敵陣=上半分 y<mid の黒石数) と白の侵入 (y>mid の白石数) を比べて標を引く
        function tugStep() {
            const mid = (BOARD_SIZE - 1) / 2;
            let blackInv = 0, whiteInv = 0;
            for (let i = 0; i < board.length; i++) {
                const y = Math.floor(i / BOARD_SIZE);
                if (board[i] === 1 && y < mid) blackInv++;
                if (board[i] === 2 && y > mid) whiteInv++;
            }
            if (blackInv > whiteInv) st.knot++;
            else if (whiteInv > blackInv) st.knot--;
            if (st.knot <= 0) { st.knot = 0; winByRule(2, '綱引き勝ち', '綱標を白陣端まで引いた'); }
            else if (st.knot >= BOARD_SIZE - 1) { st.knot = BOARD_SIZE - 1; winByRule(1, '綱引き勝ち', '綱標を黒陣端まで引いた'); }
        }
        function endGameByScore() {`],
        // 綱標の状態を持つ st を導入 (全操作で永続化)
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { knot: 0 }; // 綱標の行`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { knot: (BOARD_SIZE - 1) / 2 };`],
        [K.ONE, K.SNAP_PUSH, K.SNAP_PUSH.replace('holdUsed', 'holdUsed,\n                st: { ...st }')],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            if (snap.st) st = { ...snap.st };`],
        [K.ONE, K.SAVE_TAIL, K.SAVE_TAIL.replace('holdUsed,', 'holdUsed,\n                    st,')],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? { ...s.st } : { knot: (BOARD_SIZE - 1) / 2 };`],
        [K.ONE, K.ONLINE_SEND, K.ONLINE_SEND.replace('holdUsed,', 'holdUsed,\n                st,')],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? { ...data.st } : st;`],
        // 着手後に綱を引く
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 綱引: 敵陣への侵入数の差で標を1段引く
            tugStep();
            if (gameOver) return;

            turn = opponent;`],
        // 綱標リングを描く
        K.CUE_GRID(`            // 綱標: 標の行全体に紅白の綱目と中央の結び目リング
            {
                const ky = padding + st.knot * cellSize;
                ctx.save();
                // 綱目線
                ctx.strokeStyle = 'rgba(180,83,9,0.5)';
                ctx.lineWidth = Math.max(2, cellSize * 0.12);
                ctx.setLineDash([cellSize * 0.25, cellSize * 0.15]);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize * 0.5, ky);
                ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize * 0.5, ky);
                ctx.stroke();
                ctx.setLineDash([]);
                // 中央の結び目リング
                const m = Math.floor(BOARD_SIZE / 2);
                const cx = padding + m * cellSize;
                ctx.strokeStyle = '#dc2626';
                ctx.lineWidth = Math.max(2.5, cellSize * 0.10);
                ctx.beginPath();
                ctx.arc(cx, ky, cellSize * 0.34, 0, Math.PI * 2);
                ctx.stroke();
                ctx.fillStyle = '#fef3c7';
                ctx.beginPath();
                ctx.arc(cx, ky, cellSize * 0.10, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'綱標: 敵陣侵入で標を引く'`),
        [K.ONE, K.INFO_ALGO, `            綱引碁: 敵陣への侵入数で中央の綱標が動く。端まで引けば勝利<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤中央に綱標。各着手後、敵陣 (相手側半分) に侵入した石の数で標を1段引き寄せる。',
            '標を自分側の端まで引けば綱引き勝ち = 即勝利。互いに対称な力。',
            '攻め込むほど標は動くが、取られれば侵入数は減る — 持久戦との綱引き。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        const I = (x, y) => y * BOARD_SIZE + x;
        const mid = (BOARD_SIZE - 1) / 2;
        board.fill(0); pieces = []; history.length = 0; turn = 1; gamePhase = 'playing'; gameOver = false;
        st.knot = mid;
        // 黒が敵陣 (上半分) に侵入 → 標が黒側端へ1段
        board[I(4, 2)] = 1;
        tugStep();
        assert('黒侵入で標が黒側へ', st.knot === mid + 1);
        // 白も同数侵入 → 標は動かない
        board[I(4, BOARD_SIZE - 2)] = 2;
        tugStep();
        assert('互角なら標は動かない', st.knot === mid + 1);
        // 端まで引けば勝利
        st.knot = BOARD_SIZE - 2;
        board[I(5, 1)] = 1;
        tugStep();
        assert('端まで引いて黒勝利', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
