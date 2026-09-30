// ZONEGO — 区域碁: 3×3の9区域のうち5区域以上を制圧した側が即勝ち
const K = require('../gen_kit.js');
module.exports = {
    file: 'zonego.html',
    en: 'ZONEGO',
    jp: '区域碁',
    prefix: 'zonego',
    desc: '盤は9区域。自分の石が相手より2個以上多い区域を「制圧」。5区域制圧で即勝ち。',
    kind: 'zone',
    spec: [
        ...K.rb('ZONEGO', '区域碁', 'zonego'),
        [K.ONE, `        function endGameByScore() {`, K.WIN_BY_RULE_FN + `
        // 区域制圧数: 自石が相手より2個以上多い区域の数
        function controlledZones(player) {
            const opponent = player === 1 ? 2 : 1;
            const zw = Math.ceil(BOARD_SIZE / 3), zh = Math.ceil(BOARD_SIZE / 3);
            const own = Array(9).fill(0), opp = Array(9).fill(0);
            for (let y = 0; y < BOARD_SIZE; y++) for (let x = 0; x < BOARD_SIZE; x++) {
                const v = board[y * BOARD_SIZE + x];
                const z = Math.min(2, Math.floor(y / zh)) * 3 + Math.min(2, Math.floor(x / zw));
                if (v === player) own[z]++;
                else if (v === opponent) opp[z]++;
            }
            let n = 0;
            for (let z = 0; z < 9; z++) if (own[z] >= opp[z] + 2) n++;
            return n;
        }

        function endGameByScore() {`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 区域ルール: 5区域以上を制圧したら即勝ち
            if (controlledZones(player) >= 5) {
                winByRule(player, '区域制圧勝ち', '9区域のうち5区域以上を制圧しました'); return;
            }

            turn = opponent;`],
        // 区域境界を太線で描く
        K.CUE_STARS(`            {
                const zw = Math.ceil(BOARD_SIZE / 3);
                ctx.save();
                ctx.strokeStyle = alphaColor(currentTheme.lineColor, 0.7);
                ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                for (let k = 1; k <= 2; k++) {
                    const p2 = padding + k * zw * cellSize;
                    ctx.beginPath(); ctx.moveTo(p2, padding); ctx.lineTo(p2, width - padding); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(padding, p2); ctx.lineTo(width - padding, p2); ctx.stroke();
                }
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'制圧 黒:' + controlledZones(1) + ' 白:' + controlledZones(2)`),
        [K.ONE, K.RV_ALGO, K.rv([
            '盤は太線で区切られた9区域。自分の石が相手より2個以上多い区域を「制圧」したことになる。',
            '5区域以上を制圧した時点で即勝ち。制圧数はヘッダのチップで確認できる。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        assert('初期は0区域', controlledZones(1) === 0);
        // 5つの区域に黒2個ずつ (区域幅をまたいで配置)
        const zw = Math.ceil(BOARD_SIZE / 3);
        const centers = [[1,1],[zw+1,1],[2*zw+1,1],[1,zw+1],[zw+1,zw+1]];
        centers.forEach(([x,y]) => { board[y * BOARD_SIZE + x] = 1; board[y * BOARD_SIZE + x + 1] = 1; });
        assert('5区域制圧', controlledZones(1) === 5);
        board.fill(0);
        assert('空盤は0', controlledZones(1) === 0);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('石1個では制圧なし', controlledZones(1) === 0);
    `,
};
