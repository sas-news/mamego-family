// WAVE2GO — 波動碁: 着手の衝撃が波となり、距離2リングの石が外側へ1マス押される
const K = require('../gen_kit.js');
module.exports = {
    file: 'wave2go.html',
    en: 'WAVE2GO',
    jp: '波動碁',
    prefix: 'wave2go',
    desc: '着手の衝撃が波として伝播。距離2リングにある全ての石が外側へ1マス押し出される。',
    kind: 'stone',
    icon: 'wave2go',
    spec: [
        ...K.rb('WAVE2GO', '波動碁', 'wave2go'),
        K.params([
            { key: 'ring', label: '波の距離', min: 1, max: 4, def: 2, hint: '押される石のリング距離' },
            { key: 'cap', label: '打ち切り手数', min: 40, max: 400, def: 140, unit: '手' },
        ]),
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 波動ルール: 距離Rリングの石が外側へ1マス押される (押し先が空の時のみ)
            {
                const ring = Math.max(1, P('ring') || 2);
                const px = move.cells[0].x, py = move.cells[0].y;
                const pushes = [];
                for (let dy = -ring; dy <= ring; dy++) {
                    for (let dx = -ring; dx <= ring; dx++) {
                        if (Math.max(Math.abs(dx), Math.abs(dy)) !== ring) continue;
                        const sx = Math.sign(dx), sy = Math.sign(dy);
                        const fx = px + dx, fy = py + dy;
                        const tx = fx + sx, ty = fy + sy;
                        if (fx < 0 || fy < 0 || fx >= BOARD_SIZE || fy >= BOARD_SIZE) continue;
                        if (tx < 0 || ty < 0 || tx >= BOARD_SIZE || ty >= BOARD_SIZE) continue;
                        const fi = fy * BOARD_SIZE + fx, ti = ty * BOARD_SIZE + tx;
                        if (board[fi] !== 0 && board[ti] === 0) pushes.push([fi, ti]);
                    }
                }
                if (pushes.length) {
                    pushes.forEach(([f, t]) => {
                        board[t] = board[f]; board[f] = 0;
                        fxSlide(f, t, 300);
                    });
                    fxGlow(py * BOARD_SIZE + px, '#7dd3fc', 700);
                    cleanUpPieces();
                }
            }
            // 長期戦防止: 一定手数経過でその時点の地数判定
            if (history.length >= (P('cap') || 140)) { endGameByScore(); return; }

            turn = opponent;`],
        // 波紋の描画
        K.CUE_STARS(`            // 着手で波が出ることを示す波紋ガイド (中央に例示)
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(56,189,248,0.18)';
                ctx.lineWidth = Math.max(1, cellSize * 0.03);
                const cc = Math.floor(BOARD_SIZE / 2);
                const cx0 = padding + cc * cellSize, cy0 = padding + cc * cellSize;
                [1, 2].forEach(r => {
                    ctx.beginPath();
                    ctx.arc(cx0, cy0, cellSize * r * 0.9, 0, Math.PI * 2);
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '着手の衝撃が波となり、距離2リングにある全ての石 (敵味方) が外側へ1マス押し出される。',
            '押し先が空いていない石は動かない。140手を超えた時点で地数判定する。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + (c - 2)] = 2; // (c-2,c) に白
        executeMove({ cells: [{ x: c, y: c }] }, 1); // 波で左へ押される
        assert('距離2の石が外へ押される', board[c * BOARD_SIZE + (c - 3)] === 2 && board[c * BOARD_SIZE + (c - 2)] === 0);
        // 距離1の石は動かない
        board.fill(0); pieces = [];
        board[c * BOARD_SIZE + (c - 1)] = 2;
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('距離1の石は動かない', board[c * BOARD_SIZE + (c - 1)] === 2);
        // 自分の石も押される (対称)
        board.fill(0); pieces = [];
        board[c * BOARD_SIZE + (c + 2)] = 1;
        executeMove({ cells: [{ x: c, y: c }] }, 1);
        assert('自分の石も押される', board[c * BOARD_SIZE + (c + 3)] === 1);
    `,
};
