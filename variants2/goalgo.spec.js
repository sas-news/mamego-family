// GOALGO — 得点碁: 中央3×3のゴールに石を投入するたび1ゴール (取られても点は残る)
const K = require('../gen_kit.js');
module.exports = {
    file: 'goalgo.html',
    en: 'GOALGO',
    jp: '得点碁',
    prefix: 'goalgo',
    desc: '中央3×3のゴールに石を入れるたび+1ゴール。得点は取られても残る。',
    kind: 'goal',
    spec: [
        ...K.rb('GOALGO', '得点碁', 'goalgo'),
        K.params([
            { key: 'goal_radius', label: 'ゴールの広さ', min: 1, max: 4, def: 1, unit: 'マス' },
            { key: 'goal_pts', label: 'ゴール1回の得点', min: 1, max: 5, def: 1, unit: '目' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let goals = { 1: 0, 2: 0 }; // ゴールに投入した累計得点`],
        [K.ONE, K.RESET_HELD, `            heldPieces = { 1: null, 2: null };
            goals = { 1: 0, 2: 0 };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                holdUsed,
                goals: { ...goals }
            });`],
        [K.ONE, K.SNAP_POP, `            holdUsed = !!snap.holdUsed;
            if (snap.goals) goals = { ...snap.goals };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    holdUsed,
                    goals,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, `            holdUsed = !!s.holdUsed;
            if (s.goals) goals = s.goals;`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                holdUsed,
                goals,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, `            holdUsed = !!data.holdUsed;
            if (data.goals) goals = data.goals;`],
        // 着手時に中央3×3ゴール内なら+1
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 得点ルール: 中央3×3のゴールに石を入れたら即+1 (後で取られても得点は残る)
            {
                const c = Math.floor(BOARD_SIZE / 2);
                const p = move.cells[0];
                if (Math.abs(p.x - c) <= (P('goal_radius') || 1) && Math.abs(p.y - c) <= (P('goal_radius') || 1)) {
                    goals[player] += (P('goal_pts') || 1);
                    const gi = p.y * BOARD_SIZE + p.x;
                    fxGlow(gi, '#4ade80', 900);
                    fxBurst(gi, '#4ade80', 10, 1.5);
                    fxText(gi, 'GOAL!', '#4ade80', 1200);
                }
            }

            turn = opponent;`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + goals[1];
            const whiteTotal = territory.white + captures[2] + komi + goals[2];`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒のゴール:</span> <strong>\${goals[1]}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白のゴール:</span> <strong>\${goals[2]}</strong></div>`],
        // 中央ゴールの枠を描く
        K.CUE_GRID(`            // 中央3×3ゴール枠
            {
                const c = Math.floor(BOARD_SIZE / 2);
                ctx.save();
                ctx.strokeStyle = alphaColor('#16a34a', 0.8);
                ctx.lineWidth = Math.max(1.5, cellSize * 0.06);
                ctx.setLineDash([cellSize * 0.15, cellSize * 0.10]);
                const _gr = P('goal_radius') || 1;
                const gx = padding + (c - _gr) * cellSize - cellSize / 2;
                const gy = padding + (c - _gr) * cellSize - cellSize / 2;
                ctx.strokeRect(gx, gy, cellSize * (_gr * 2 + 1), cellSize * (_gr * 2 + 1));
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`'G 黒:' + goals[1] + ' 白:' + goals[2]`),
        [K.ONE, K.RV_BASE, K.rv([
            '中央3×3 (緑の点線枠) がゴール。そこに石を置くたび即座に1ゴール得点。',
            '投入石が後で取られてもゴール得点は残る。終局は 地+アゲハマ+ゴール の合計。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('ゴール投入で+1', goals[1] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        assert('枠外はゴールなし', goals[2] === 0);
        executeMove({ cells: [{ x: c - 1, y: c + 1 }] }, 1);
        assert('枠内2点目', goals[1] === 2);
        endGameByScore();
        assert('結果詳細にゴール', gameResultData.details.includes('ゴール'));
    `,
};
