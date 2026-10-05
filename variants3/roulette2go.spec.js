// ROULETTE2GO — 回転盤碁: 盤を4象限に分け、その手番で打てるのはルーレットが止まった象限だけ
const K = require('../gen_kit.js');
module.exports = {
    file: 'roulette2go.html',
    en: 'ROULETTE2GO',
    jp: '回転盤碁',
    prefix: 'roulette2go',
    desc: '盤は4象限。手番ごとにルーレットが回り、止まった象限にだけ着手できる。',
    kind: 'stone',
    icon: 'roulette2go',
    spec: [
        ...K.rb('ROULETTE2GO', '回転盤碁', 'roulette2go'),
        K.params([
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        // 象限: 盤中央の十字で4分割 (中央線は下/右側に属する)
        [K.ONE, '        function executeMove(move, player) {',
`        // 回転盤: 指定プレイヤーが現在打てる象限を求める (盤面依存・純粋関数)
        function zoneOfCell(x, y) {
            const h = Math.floor(BOARD_SIZE / 2);
            return (x > h ? 1 : 0) + (y > h ? 2 : 0);
        }
        function zoneEmpty(player, z) {
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                if (zoneOfCell(x, y) !== z) continue;
                const i = y * BOARD_SIZE + x;
                if (board[i] === 0) {
                    // 空点があれば打てる可能性あり (厳密な適法性は isValidPlacement が判断)
                    return true;
                }
            }
            return false;
        }
        function activeZone(player) {
            const base = (history.length + consecutivePasses) % 4;
            for (let k = 0; k < 4; k++) {
                const z = (base + k) % 4;
                if (zoneEmpty(player, z)) return z;
            }
            return -1; // 全象限が埋まっている
        }

        function executeMove(move, player) {`],
        // 着手はアクティブな象限のみ
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 回転盤ルール: アクティブな象限の外には打てない
            {
                const z = activeZone(player);
                if (z < 0) return false;
                for (const p of cells) {
                    if (zoneOfCell(p.x, p.y) !== z) return false;
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // ルーレット象限を描画: アクティブ象限をハイライト、中央十字を描く
        K.CUE_GRID(`            {
                const z = activeZone(turn);
                const h = Math.floor(BOARD_SIZE / 2);
                const rects = [
                    [0, 0, h, h], [h + 1, 0, BOARD_SIZE - 1, h],
                    [0, h + 1, h, BOARD_SIZE - 1], [h + 1, h + 1, BOARD_SIZE - 1, BOARD_SIZE - 1]
                ];
                ctx.save();
                rects.forEach((r, i) => {
                    const x0 = padding + r[0] * cellSize - cellSize / 2;
                    const y0 = padding + r[1] * cellSize - cellSize / 2;
                    const x1 = padding + r[2] * cellSize + cellSize / 2;
                    const y1 = padding + r[3] * cellSize + cellSize / 2;
                    if (i === z) {
                        ctx.fillStyle = 'rgba(250, 204, 21, 0.10)';
                        ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
                        ctx.strokeStyle = 'rgba(234, 179, 8, 0.9)';
                        ctx.lineWidth = Math.max(2, cellSize * 0.1);
                        ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
                    }
                });
                ctx.strokeStyle = 'rgba(100, 116, 139, 0.7)';
                ctx.lineWidth = Math.max(1, cellSize * 0.05);
                ctx.beginPath();
                ctx.moveTo(padding - cellSize / 2, padding + h * cellSize + cellSize / 2);
                ctx.lineTo(padding + (BOARD_SIZE - 1) * cellSize + cellSize / 2, padding + h * cellSize + cellSize / 2);
                ctx.moveTo(padding + h * cellSize + cellSize / 2, padding - cellSize / 2);
                ctx.lineTo(padding + h * cellSize + cellSize / 2, padding + (BOARD_SIZE - 1) * cellSize + cellSize / 2);
                ctx.stroke();
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(() => { const z = activeZone(turn); return z >= 0 ? '停止象限 ' + ['左上', '右上', '左下', '右下'][z] : '盤面満杯'; })()`),
        [K.ONE, K.INFO_BASE, `            回転盤碁: 手番ごとにルーレットが回り、止まった象限にだけ着手できる<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は4象限。手番ごとにルーレットが回り、金色の枠で示された象限にだけ着手できる。',
            '止まった象限が埋まっていれば次の象限へ自動で回る。全滅ならパスするしかない。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof activeZone === 'function');
        const z = activeZone(1);
        assert('アクティブ象限がある', z >= 0 && z < 4);
        // アクティブ象限内は打てる
        const h = Math.floor(BOARD_SIZE / 2);
        const rects = [[0, 0, h, h], [h + 1, 0, BOARD_SIZE - 1, h], [0, h + 1, h, BOARD_SIZE - 1], [h + 1, h + 1, BOARD_SIZE - 1, BOARD_SIZE - 1]];
        const r = rects[z];
        assert('象限内は合法', isValidPlacement([{ x: r[0], y: r[1] }], 1) === true);
        const out = rects[(z + 1) % 4];
        assert('象限外は違法', isValidPlacement([{ x: out[0], y: out[1] }], 1) === false);
        // 埋まった象限はスキップされる
        rects.forEach((rr, i) => { if (i !== 2) { for (let y = rr[1]; y <= rr[3]; y++) for (let x = rr[0]; x <= rr[2]; x++) board[y * BOARD_SIZE + x] = 1; } });
        assert('空き象限へ回る', activeZone(1) === 2);
    `,
};
