// BRANCHGO — 枝分碁: 石は枝。3方向以上に自石が伸びる「分岐点」は終局時+1目
const K = require('../gen_kit.js');
module.exports = {
    file: 'branchgo.html',
    en: 'BRANCHGO',
    jp: '枝分碁',
    prefix: 'branchgo',
    desc: '石は枝。3方向以上に自分の石が伸びる分岐点を作ると終局時+1目。',
    kind: 'stone',
    icon: 'branchgo',
    spec: [
        ...K.rb('BRANCHGO', '枝分碁', 'branchgo'),
        K.params([
            { key: 'branch_deg', label: '分岐とみなす次数', min: 3, max: 4, def: 3 },
            { key: 'branch_bonus', label: '分岐点ボーナス', min: 1, max: 3, def: 1, unit: '目' },
            { key: 'cap_ratio', label: '打ち切り手数係数', min: 0.4, max: 1.5, def: 0.8, step: 0.05, hint: '交点数×この値で強制採点' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let branchDetail = { 1: 0, 2: 0 }; // 直近終局で計上した分岐点の数`],
        [K.ONE, `            const territory = calculateTerritory();`,
`            const territory = calculateTerritory();
            // 枝分ルール: 3方向以上に自石が伸びる点は「分岐点」として+1目
            branchDetail = { 1: 0, 2: 0 };
            for (let i = 0; i < board.length; i++) {
                const p = board[i];
                if (p !== 1 && p !== 2) continue;
                const deg = getNeighbors(i).filter(n => board[n] === p).length;
                if (deg >= (P('branch_deg') || 3)) {
                    branchDetail[p]++;
                    if (p === 1) territory.black += (P('branch_bonus') || 1); else territory.white += (P('branch_bonus') || 1);
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 満局打ち切り: 交点数の8割を超える長期戦は即採点終局
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.8))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `                startDeadStoneSelectionPhase();`,
`                endGameByScore(); // 連続パスで即採点終局`],
        ...K.STONE_MARKS_SPEC(`            // 分岐点: 石から伸びる枝を茶色の筋で描く
            {
                ctx.save();
                ctx.strokeStyle = 'rgba(120, 72, 20, 0.75)';
                board.forEach((v, i) => {
                    if (v !== 1 && v !== 2) return;
                    const own = getNeighbors(i).filter(n => board[n] === v);
                    if (own.length < (P('branch_deg') || 3)) return;
                    const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                    const cx = padding + x * cellSize, cy = padding + y * cellSize;
                    ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                    own.slice(0, 3).forEach(n => {
                        const nx = n % BOARD_SIZE, ny = Math.floor(n / BOARD_SIZE);
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.lineTo(padding + nx * cellSize, padding + ny * cellSize);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv([
            '石は枝。1つの石から3方向以上に自分の石が伸びている点は「分岐点」となり終局時+1目。',
            '分岐は両者同じ条件。枝を広げるか、相手の分岐点を取り崩すか。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1; captures = { 1: 0, 2: 0 };
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 3, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 5, y: 4 }] }, 1);
        executeMove({ cells: [{ x: 4, y: 3 }] }, 1); // (4,4) が3方向の分岐点に
        endGameByScore();
        assert('分岐点が計上される', branchDetail[1] === 1);
        assert('白には分岐なし', branchDetail[2] === 0);
        assert('終局する', gameOver === true);
        assert('起動して通常着手可', isValidPlacement([{ x: 0, y: 0 }], 1) === true);
    `,
};
