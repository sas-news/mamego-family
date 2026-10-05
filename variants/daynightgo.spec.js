// DAYNIGHTGO — 二時碁: 20手ごとに盤が昼面⇄夜面に入れ替わり、全ての石の持ち主が反転する
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
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * ((P('cap_pct') ?? 75) / 100))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];
module.exports = {
    file: 'daynightgo.html',
    en: 'DAYNIGHTGO',
    jp: '二時碁',
    prefix: 'daynightgo',
    desc: '20手ごとに昼⇄夜が巡り、盤上の全石の持ち主が反転する。布石は寝返る。',
    kind: 'stone',
    icon: 'daynightgo',
    spec: [
        ...K.rb('DAYNIGHTGO', '二時碁', 'daynightgo'),
        K.params([
            { key: 'cycle', label: '昼夜の周期', min: 4, max: 40, def: 20, unit: '手' },
            { key: 'cap_pct', label: '打ち切り手数', min: 50, max: 150, def: 75, unit: '%', hint: '盤面交点数に対する割合' },
        ]),
        // 20手ごとの昼夜反転 (両者共通の周期イベント)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 二時: N手ごとに昼面⇄夜面が入れ替わり、全石の持ち主が反転する (周期は設定で調整)
            {
                const __cyc = Math.max(1, P('cycle') || 20);
                if (history.length > 0 && history.length % __cyc === 0) {
                const night = Math.floor(history.length / __cyc) % 2 === 1;
                for (let i = 0; i < board.length; i++) {
                    if (board[i] === 1 || board[i] === 2) {
                        board[i] = 3 - board[i];
                        fxGlow(i, night ? '#6366f1' : '#fbbf24', 650);
                    }
                }
                pieces.forEach(pc => { pc.player = 3 - pc.player; });
                const cc = Math.floor(BOARD_SIZE / 2) * BOARD_SIZE + Math.floor(BOARD_SIZE / 2);
                fxText(cc, night ? '夜面!' : '昼面!', night ? '#818cf8' : '#f59e0b', 1300);
                fxShake(4, 360);
                }
            }

            turn = opponent;`],
        // 夜面: 盤全体に薄い夜の帳が降りる
        [K.ONE, K.FX_BOOT, K.FX_BOOT + `
        // 夜面の暗がり: 夜パリティの間だけ盤を藍色に沈める
        fxAmbient((ctx2, now, pad, cs) => {
            if (Math.floor(history.length / (P('cycle') || 20)) % 2 !== 1) return;
            ctx2.save();
            const w = pad * 2 + (BOARD_SIZE - 1) * cs;
            ctx2.fillStyle = 'rgba(10,14,58,0.22)';
            ctx2.fillRect(0, 0, w, w);
            for (let i = 0; i < board.length; i++) {
                const x = i % BOARD_SIZE, y = (i / BOARD_SIZE) | 0;
                const tw = Math.sin(now / 900 + i * 2.1);
                if (tw > 0.86) {
                    ctx2.fillStyle = 'rgba(199,210,254,' + ((tw - 0.86) * 3) + ')';
                    ctx2.beginPath();
                    ctx2.arc(pad + x * cs, pad + y * cs, cs * 0.05, 0, Math.PI * 2);
                    ctx2.fill();
                }
            }
            ctx2.restore();
        });`],
        ...K.EVENT_CHIP_SPEC(`(Math.floor(history.length / (P('cycle') || 20)) % 2 === 1 ? '夜面 ' : '昼面 ') + '反転まで ' + ((P('cycle') || 20) - history.length % (P('cycle') || 20)) + '手'`),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, `            二時碁: 20手ごとに昼面⇄夜面が入れ替わり全石の持ち主が反転する<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '20手ごとに盤の「面」が昼⇄夜で入れ替わり、全ての石の持ち主が反転する。',
            '反転直前に自分の大きな連を作ると相手に献上する。周期に合わせた布石が鍵。',
            '反転は両者に同時に効く対称イベント。取り・コウ・パス終局は通常通り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        executeMove({ cells: [{ x: 7, y: 7 }] }, 2);
        history.length = 19; // 次の着手で20手目 → 反転発火
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('黒石が白に反転', board[3 * BOARD_SIZE + 3] === 2);
        assert('白石が黒に反転', board[7 * BOARD_SIZE + 7] === 1);
        assert('新しい石も反転する', board[0] === 2);
        assert('ピースの持ち主も反転', pieces.every(pc => (board[pc.cells[0].y * BOARD_SIZE + pc.cells[0].x] === pc.player) || board[pc.cells[0].y * BOARD_SIZE + pc.cells[0].x] === 0));
        assert('起動して通常着手可', isValidPlacement([{ x: 1, y: 0 }], 1) === true);
    `,
};
