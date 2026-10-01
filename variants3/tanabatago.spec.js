// TANABATAGO — 七夕碁: 星の笹に短冊(石)を吊るすと採点で+2ずつ
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
module.exports = {
    file: 'tanabatago.html',
    en: 'TANABATAGO',
    jp: '七夕碁',
    prefix: 'tanabatago',
    desc: '星の笹に石の短冊を吊るせ。終局時に星の上の自石1つにつき+2点。',
    kind: 'stone',
    icon: 'tanabatago',
    spec: [
        ...K.rb('TANABATAGO', '七夕碁', 'tanabatago'),
        K.params([
            { key: 'star_bonus', label: '短冊1つあたりの得点', min: 0, max: 6, def: 2, unit: '点' },
            { key: 'cap_ratio', label: '打ち切り手数', min: 0.5, max: 1.5, step: 0.1, def: 0.75, hint: '交点数比' },
        ]),
        // 笹判定ヘルパー: 星の上にある自石を数える
        [K.ONE, `        function endGameByScore() {`, `        // 笹の判定: 星の点に置かれた石を数える
        function tanaStars(pl) {
            const pts = getStarPoints(BOARD_SIZE);
            let n = 0;
            pts.forEach(pt => { if (board[pt.y * BOARD_SIZE + pt.x] === pl) n++; });
            return n;
        }
        function tanaBonus(pl) { return tanaStars(pl) * (P('star_bonus') ?? 2); }

        function endGameByScore() {`],
        // 採点に願い点を加算
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + tanaBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + tanaBonus(2);`],
        // 星を笹の葉色で縁取り、吊るした短冊は色つきの札に
        ...K.STONE_MARKS_SPEC(`            // 七夕: 星の上の石に短冊の印
            {
                const pts = getStarPoints(BOARD_SIZE);
                const cols = { 1: '#7dd3fc', 2: '#f9a8d4' };
                ctx.save();
                pts.forEach(pt => {
                    const i = pt.y * BOARD_SIZE + pt.x;
                    const cx = padding + pt.x * cellSize, cy = padding + pt.y * cellSize;
                    if (board[i] === 1 || board[i] === 2) {
                        ctx.strokeStyle = cols[board[i]];
                        ctx.lineWidth = Math.max(1.3, cellSize * 0.06);
                        ctx.strokeRect(cx - cellSize * 0.13, cy - cellSize * 0.30, cellSize * 0.26, cellSize * 0.42);
                    } else {
                        ctx.strokeStyle = 'rgba(74,222,128,0.75)';
                        ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.20, Math.PI * 0.2, Math.PI * 1.4);
                        ctx.stroke();
                    }
                });
                ctx.restore();
            }`),
        [K.ONE, K.INFO_ALGO, `            七夕碁: 星の点は笹。星に石(短冊)を吊るしておくと、終局時に1つにつき+2点<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '盤の星の点は笹の枝。そこに石(短冊)を吊るすと願いが架かる。',
            '終局時、星の上に残っている自分の石1つにつき+2点。取られれば願いは散る。',
            '星はどちらからも吊るせる。争奪してもよい。双方同じ条件。',
        ])],
        ...GAME_OVER,
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        const B = BOARD_SIZE;
        const pts = getStarPoints(B);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
        assert('初期は短冊なし', tanaBonus(1) === 0);
        board[pts[0].y * B + pts[0].x] = 1;
        board[pts[1].y * B + pts[1].x] = 1;
        assert('星2個で+4', tanaBonus(1) === 4);
        board[pts[2].y * B + pts[2].x] = 2;
        assert('白も同条件で+2', tanaBonus(2) === 2);
        board[pts[0].y * B + pts[0].x] = 0;
        assert('取られると消える', tanaBonus(1) === 2);
    `,
};
