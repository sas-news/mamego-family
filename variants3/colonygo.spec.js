// COLONYGO — 植民碁: 盤を3x3区域に分割。終局時、各区域で石数多数の側が区域全域を領地とする
const K = require('../gen_kit.js');
module.exports = {
    file: 'colonygo.html',
    en: 'COLONYGO',
    jp: '植民碁',
    prefix: 'colonygo',
    desc: '盤は3x3の区域に分割。終局時、各区域で石数が多い側が区域全域を領地として得る。',
    kind: 'stone',
    icon: 'colonygo',
    spec: [
        ...K.rb('COLONYGO', '植民碁', 'colonygo'),
        K.params([
            { key: 'zone_div', label: '区域の分割数', min: 1, max: 5, def: 3, hint: '3=3x3の区域' },
            { key: 'cap_moves', label: '打ち切り手数', min: 40, max: 300, def: 140, unit: '手' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let colonyDetail = { 1: 0, 2: 0 }; // 直近の終局で領有した区域数`],
        // 終局スコアに区域ボーナスを加算
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 植民ルール: 各区域で石数多数を握った側が区域全域を領地とする
            colonyDetail = { 1: 0, 2: 0 };
            {
                const _zd = Math.max(1, P('zone_div') || 3);
                const zw = Math.ceil(BOARD_SIZE / _zd);
                for (let zy = 0; zy < _zd; zy++) {
                    for (let zx = 0; zx < _zd; zx++) {
                        let b = 0, w = 0, area = 0;
                        for (let y = zy * zw; y < Math.min(BOARD_SIZE, (zy + 1) * zw); y++) {
                            for (let x = zx * zw; x < Math.min(BOARD_SIZE, (zx + 1) * zw); x++) {
                                area++;
                                const v = board[y * BOARD_SIZE + x];
                                if (v === 1) b++; else if (v === 2) w++;
                            }
                        }
                        if (b > w) { territory.black += area; colonyDetail[1]++; }
                        else if (w > b) { territory.white += area; colonyDetail[2]++; }
                    }
                }
            }`],
        // スコア内訳に植民区域数を表示
        [K.ONE, `                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`,
`                    <div class="flex justify-between"><span>黒の植民区域:</span> <strong>\${colonyDetail[1]}</strong></div>
                    <div class="flex justify-between font-bold border-t pt-1"><span>黒合計:</span> <span>\${blackTotal}</span></div>`],
        // 区域境界の描画
        K.CUE_STARS(`            // 植民区域の境界線 (3x3マクロ区域)
            {
                const _zd = Math.max(1, P('zone_div') || 3);
                const zw = Math.ceil(BOARD_SIZE / _zd);
                ctx.save();
                ctx.strokeStyle = 'rgba(180,120,40,0.5)';
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.18, cellSize * 0.12]);
                for (let i = 1; i < _zd; i++) {
                    const p = padding + i * zw * cellSize - cellSize * 0.5;
                    ctx.beginPath(); ctx.moveTo(padding - cellSize * 0.5, p); ctx.lineTo(padding + (BOARD_SIZE - 0.5) * cellSize, p); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(p, padding - cellSize * 0.5); ctx.lineTo(p, padding + (BOARD_SIZE - 0.5) * cellSize); ctx.stroke();
                }
                ctx.setLineDash([]);
                ctx.restore();
            }`),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 長期戦防止: 既定の手数経過でその時点の地数判定
            if (history.length >= (P('cap_moves') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        [K.ONE, K.RV_BASE, K.rv([
            '盤は3x3の「区域」に分割。終局時、各区域で石が多い側が区域全域を領地として得る。',
            '通常の地とアゲハマも計上される。コミは白に+6.5。',
            '140手を超えた時点で即座に地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        // 左上区域に黒3石、右上区域に白2石を直接配置
        board[0] = 1; board[1] = 1; board[2] = 1;
        const zw = Math.ceil(BOARD_SIZE / 3);
        const zr = 2 * zw * BOARD_SIZE + (2 * zw); // 右下区域
        board[BOARD_SIZE - 1] = 2; board[2 * BOARD_SIZE - 1] = 2;
        endGameByScore();
        assert('終局', gameOver === true);
        assert('植民区域ボーナスが計上', !!gameResultData && gameResultData.details.includes('植民'));
        assert('黒が区域を領有', colonyDetail[1] >= 1);
    `,
};
