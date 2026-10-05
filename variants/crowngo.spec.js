// CROWNGO — 王冠碁: 終局時に天元を持つ側に3点の王冠ボーナス
const K = require('../gen_kit.js');
module.exports = {
    file: 'crowngo.html',
    en: 'CROWNGO',
    jp: '王冠碁',
    prefix: 'crowngo',
    desc: '天元は王座。終局時に天元の石を持つ側が+3点の王冠ボーナスを得る。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'crown',
    spec: [
        ...K.rb('CROWNGO', '王冠碁', 'crowngo'),
        K.params([
            { key: 'crown_pts', label: '王冠ボーナス', min: 0, max: 10, def: 3, unit: '点' },
        ]),
        [K.ONE, `        function endGameByScore() {`, `
        // 王冠ボーナス: 天元の石を持つ側に+3
        function crownBonus(player) {
            const c = Math.floor(BOARD_SIZE / 2);
            return board[c * BOARD_SIZE + c] === player ? (P('crown_pts') ?? 3) : 0;
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
        [K.ONE, K.RV_BASE, K.rv([
            '天元は王座 (金色の王冠マーク)。終局時に天元の石を持つ側が+3点のボーナス。',
            '通常の地取り勝負に王座争奪戦が載る。取っても取り返される激戦区。',
        ])],
        // 王座: 天元の脈動リング + 占める石に王冠
        ...K.STONE_MARKS_SPEC(`            {
                const c = Math.floor(BOARD_SIZE / 2);
                const ci = c * BOARD_SIZE + c;
                if (board[ci] === 1 || board[ci] === 2) {
                    const cx = padding + c * cellSize, cy = padding + c * cellSize;
                    ctx.save();
                    ctx.fillStyle = '#f5c518';
                    ctx.strokeStyle = '#8a6a00';
                    ctx.lineWidth = Math.max(1, cellSize * 0.04);
                    const w = cellSize * 0.26, h = cellSize * 0.2;
                    ctx.beginPath();
                    ctx.moveTo(cx - w, cy - h * 0.2);
                    ctx.lineTo(cx - w, cy - h);
                    ctx.lineTo(cx - w * 0.4, cy - h * 0.4);
                    ctx.lineTo(cx, cy - h * 1.15);
                    ctx.lineTo(cx + w * 0.4, cy - h * 0.4);
                    ctx.lineTo(cx + w, cy - h);
                    ctx.lineTo(cx + w, cy - h * 0.2);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                    ctx.restore();
                }
            }`),
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            const c = Math.floor(BOARD_SIZE / 2);
            const cx = pad + c * cs, cy = pad + c * cs;
            const ph = (Math.sin(now / 650) + 1) / 2;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(255,215,110,' + (0.20 + ph * 0.30).toFixed(3) + ')';
            ctx2.lineWidth = Math.max(1.2, cs * 0.05);
            ctx2.beginPath();
            ctx2.arc(cx, cy, cs * (0.5 + ph * 0.12), 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        });`],
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
