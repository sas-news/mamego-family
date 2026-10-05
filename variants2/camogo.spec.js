// CAMOGO — 迷彩碁: 置いた石は5手の間、敵色に見える
const K = require('../gen_kit.js');
module.exports = {
    file: 'camogo.html',
    en: 'CAMOGO',
    jp: '迷彩碁',
    prefix: 'camogo',
    desc: '置いた石は5手の間だけ敵色に化ける。見た目を信じるな。',
    kind: 'camo',
    spec: [
        ...K.rb('CAMOGO', '迷彩碁', 'camogo'),
        K.params([
            { key: 'camo_duration', label: '迷彩期間', min: 2, max: 10, def: 5, unit: '手' },
        ]),
        [K.ONE, '        function drawBoardElements(padding, cellSize) {',
`        // 迷彩碁: 配置から5手未満の石は敵色に見える
        function isCamo(pc) { return pc.at !== undefined && (history.length - pc.at) < (P('camo_duration') || 5); }

        function drawBoardElements(padding, cellSize) {`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length
            });`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                const camo = isCamo(pc);
                const cf = camo ? (pc.player === 1 ? currentTheme.p2Fill : currentTheme.p1Fill) : fill;
                const cs = camo ? (pc.player === 1 ? currentTheme.p2Stroke : currentTheme.p1Stroke) : stroke;
                drawPieceShape(alive, padding, cellSize, cf, cs, isDead ? 0.35 : 1);`],
        ...K.STONE_MARKS_SPEC(`            // 迷彩中の石にはごく薄い破線の輪 (よく見ると迷彩と分かる)
            {
                ctx.save();
                ctx.setLineDash([cellSize * 0.09, cellSize * 0.09]);
                ctx.strokeStyle = 'rgba(34, 197, 94, 0.55)';
                ctx.lineWidth = Math.max(1.2, cellSize * 0.045);
                pieces.forEach(pc => {
                    if (!isCamo(pc)) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        ctx.beginPath();
                        ctx.arc(padding + p.x * cellSize, padding + p.y * cellSize, cellSize * 0.44, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const c = pieces.filter(pc => isCamo(pc)).length; return c > 0 ? '迷彩 ' + c + '石' : ''; })()`),
        [K.ONE, K.INFO_BASE, `            迷彩碁: 置いた石は5手の間だけ敵色に見える (盤面ロジックは正しい色のまま)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '置いてから5手の間、その石は敵色に見える (緑の破線が迷彩の目印)。',
            '取り・呼吸・地は実際の色で判定される — 見た目と裏腹な連ができて混乱する。',
        ])],
        // 迷彩が解けた瞬間に「正体」フラッシュ — 化けていた石が一目で分かる
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 迷彩碁: 迷彩が解けた石は本来の色で発光し「正体」と表示
            pieces.forEach(pc => {
                if (pc.at === undefined || history.length - pc.at !== (P('camo_duration') || 5)) return;
                pc.cells.forEach(p => {
                    const i = p.y * BOARD_SIZE + p.x;
                    if (board[i] !== pc.player) return;
                    fxGlow(i, pc.player === 1 ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.95)', 800);
                    fxText(i, '正体', '#4ade80', 1000);
                });
            });

            turn = opponent;`],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 3, y: 3 }] }, 1);
        assert('直後は迷彩', isCamo(pieces[pieces.length - 1]) === true);
        assert('盤上の値は実際の色', board[3 * BOARD_SIZE + 3] === 1);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 1, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 2, y: 0 }] }, 2);
        executeMove({ cells: [{ x: 0, y: 1 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 2 }] }, 2);
        assert('5手後に迷彩解除', isCamo(pieces[0]) === false);
    `,
};
