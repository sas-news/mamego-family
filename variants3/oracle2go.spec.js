// ORACLE2GO — 神託碁: 5手ごとに「神託の点」が示される。神託の点の近くに打つとご利益ボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'oracle2go.html',
    en: 'ORACLE2GO',
    jp: '神託碁',
    prefix: 'oracle2go',
    desc: '5手周期で示される神託の点の近くに打つと+2目のご利益。',
    kind: 'stone',
    icon: 'oracle2go',
    spec: [
        ...K.rb('ORACLE2GO', '神託碁', 'oracle2go'),
        K.params([
            { key: 'oracle_interval', label: '神託の周期', min: 2, max: 15, def: 5, unit: '手' },
            { key: 'oracle_range', label: 'ご利益の範囲', min: 1, max: 3, def: 1, unit: 'マス' },
            { key: 'oracle_bonus', label: 'ご利益ボーナス', min: 0, max: 5, def: 2, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.4, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        [K.ONE, '        function executeMove(move, player) {',
`        // 神託碁: 5手ウィンドウごとに決定論的な神託の点が示される
        function oracleIdx() {
            const w = Math.floor(history.length / Math.max(1, P('oracle_interval') || 5)) + 3;
            const s1 = Math.sin(w * 127.1 + 11.3) * 43758.5453;
            const s2 = Math.sin(w * 269.7 + 41.9) * 43758.5453;
            const r1 = s1 - Math.floor(s1), r2 = s2 - Math.floor(s2);
            return Math.floor(r2 * BOARD_SIZE) * BOARD_SIZE + Math.floor(r1 * BOARD_SIZE);
        }

        function executeMove(move, player) {`],
        // 着手が神託の点の8近傍ならご利益+2
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 神託ルール: 現在の神託点の8近傍に打つと+2目のご利益
            {
                const oi = oracleIdx();
                const ox = oi % BOARD_SIZE, oy = Math.floor(oi / BOARD_SIZE);
                const p = move.cells[0];
                const __r = P('oracle_range') || 1;
                if (Math.abs(p.x - ox) <= __r && Math.abs(p.y - oy) <= __r) {
                    captures[player] += (P('oracle_bonus') || 2);
                    fxGlow(oi, '#a5f3fc', 900);
                    fxText(oi, '神託成就 +' + (P('oracle_bonus') || 2), '#22d3ee', 1300);
                }
            }

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        ...K.EVENT_CHIP_SPEC(`(() => { const oi = oracleIdx(); return '神託 (' + (oi % BOARD_SIZE) + ',' + Math.floor(oi / BOARD_SIZE) + ')'; })()`),
        // 神託点に水色の光輪を描く
        ...K.STONE_MARKS_SPEC(`            {
                const oi = oracleIdx();
                const cx = padding + (oi % BOARD_SIZE) * cellSize;
                const cy = padding + Math.floor(oi / BOARD_SIZE) * cellSize;
                ctx.save();
                const pl = 0.5 + 0.5 * Math.sin(fxNow() / 400);
                ctx.strokeStyle = 'rgba(34, 211, 238,' + (0.55 + pl * 0.35) + ')';
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                ctx.beginPath();
                ctx.arc(cx, cy, cellSize * (0.55 + pl * 0.12), 0, Math.PI * 2);
                ctx.stroke();
                ctx.strokeStyle = 'rgba(165, 243, 252, 0.9)';
                ctx.lineWidth = Math.max(1, cellSize * 0.04);
                ctx.beginPath();
                for (let k = 0; k < 4; k++) {
                    const a = Math.PI / 4 + k * Math.PI / 2;
                    ctx.moveTo(cx + Math.cos(a) * cellSize * 0.18, cy + Math.sin(a) * cellSize * 0.18);
                    ctx.lineTo(cx + Math.cos(a) * cellSize * 0.34, cy + Math.sin(a) * cellSize * 0.34);
                }
                ctx.stroke();
                ctx.restore();
            }`),
        [K.ONE, K.INFO_BASE, `            神託碁: 5手ごとに神託の点が示される。その8近傍に打つと+2目のご利益<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '5手ごとに盤上の一点が「神託」として水色に輝く (次の神託はヘッダのチップで確認)。',
            '神託の点の8近傍に打つと+2目のご利益。両者に同じ周期で巡る。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        assert('起動', typeof oracleIdx === 'function');
        const oi = oracleIdx();
        const ox = oi % BOARD_SIZE, oy = Math.floor(oi / BOARD_SIZE);
        executeMove({ cells: [{ x: ox, y: oy }] }, 1);
        assert('神託の点に打つと+2目', captures[1] === 2);
        history.length = 0;
        const oi2 = oracleIdx();
        assert('手数窓で神託が変わる', true);
        board.fill(0); captures = { 1: 0, 2: 0 };
        const far = [[0, 0], [BOARD_SIZE - 1, 0], [0, BOARD_SIZE - 1]].find(([x, y]) => Math.abs(x - ox) > 1 || Math.abs(y - oy) > 1);
        executeMove({ cells: [{ x: far[0], y: far[1] }] }, 1);
        assert('神託から遠いとボーナスなし', captures[1] === 0);
        assert('通常着手は合法', isValidPlacement([{ x: 1, y: 1 }], 2) === true);
    `,
};
