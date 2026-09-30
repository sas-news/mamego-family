// CROWNGO — 王冠碁: 終局時に天元を持つ側に3点の王冠ボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'crowngo.html',
    en: 'CROWNGO',
    jp: '王冠碁',
    prefix: 'crowngo',
    desc: '天元は王座。終局時に天元の石を持つ側が+3点の王冠ボーナスを得る。',
    kind: 'crown',
    spec: [
        ...K.rb('CROWNGO', '王冠碁', 'crowngo'),
        [K.ONE, `        function endGameByScore() {`, `
        // 王冠ボーナス: 天元の石を持つ側に+3
        function crownBonus(player) {
            const c = Math.floor(BOARD_SIZE / 2);
            return board[c * BOARD_SIZE + c] === player ? 3 : 0;
        }

        function endGameByScore() {`],
        [K.ONE, `            const blackTotal = territory.black + captures[1];
            const whiteTotal = territory.white + captures[2] + komi;`,
`            const blackTotal = territory.black + captures[1] + crownBonus(1);
            const whiteTotal = territory.white + captures[2] + komi + crownBonus(2);`],
        [K.ONE, `                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>`,
`                    <div class="flex justify-between"><span>黒のアゲハマ:</span> <strong>\${captures[1]}</strong></div>
                    <div class="flex justify-between"><span>黒の王冠:</span> <strong>\${crownBonus(1)}</strong></div>`],
        [K.ONE, `                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>`,
`                    <div class="flex justify-between"><span>白のアゲハマ:</span> <strong>\${captures[2]}</strong></div>
                    <div class="flex justify-between"><span>白の王冠:</span> <strong>\${crownBonus(2)}</strong></div>`],
        // 天元に王冠マーク
        K.CUE_STARS(`            {
                const cc = Math.floor(BOARD_SIZE / 2);
                const cx = padding + cc * cellSize, cy = padding + cc * cellSize;
                ctx.save();
                ctx.fillStyle = '#b8860b';
                const w = cellSize * 0.30, h = cellSize * 0.22;
                ctx.beginPath();
                ctx.moveTo(cx - w, cy + h * 0.5);
                ctx.lineTo(cx - w, cy - h * 0.3);
                ctx.lineTo(cx - w * 0.45, cy);
                ctx.lineTo(cx, cy - h);
                ctx.lineTo(cx + w * 0.45, cy);
                ctx.lineTo(cx + w, cy - h * 0.3);
                ctx.lineTo(cx + w, cy + h * 0.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_ALGO, K.rv([
            '天元は王座 (金色の王冠マーク)。終局時に天元の石を持つ側が+3点のボーナス。',
            '通常の地取り勝負に王座争奪戦が載る。取っても取り返される激戦区。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0);
        const c = Math.floor(BOARD_SIZE / 2);
        board[c * BOARD_SIZE + c] = 1;
        assert('黒の王冠ボーナス3', crownBonus(1) === 3);
        assert('白は0', crownBonus(2) === 0);
        board[c * BOARD_SIZE + c] = 2;
        assert('白に渡れば白の冠', crownBonus(2) === 3 && crownBonus(1) === 0);
        board.fill(0);
        assert('空の天元は0', crownBonus(1) === 0);
        assert('起動着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
