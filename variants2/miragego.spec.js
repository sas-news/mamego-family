// MIRAGEGO — 蜃気楼碁: 着手は3手の間「蜃気楼」。隣に敵石を置かれると掻き消える
const K = require('../gen_kit.js');
module.exports = {
    file: 'miragego.html',
    en: 'MIRAGEGO',
    jp: '蜃気楼碁',
    prefix: 'miragego',
    desc: '石は3手の間だけ幻影。隣に置かれると蜃気楼は消える。',
    kind: 'mirage',
    spec: [
        ...K.rb('MIRAGEGO', '蜃気楼碁', 'miragego'),
        [K.ONE, '        function executeMove(move, player) {',
`        // 蜃気楼碁: 置いてから3手未満の石は蜃気楼 (未確定)
        function isMirage(pc) { return pc.at !== undefined && (history.length - pc.at) < 3; }

        let moveCapFired = false;
        function executeMove(move, player) {
            // 新規対局 (履歴空) で打ち切りを再武装
            if (moveCapFired && history.length === 0) moveCapFired = false;
            // 打ち切り手数: 交点数の1.4倍を超える長期戦は死に石選択へ移行して自動終局
            // (1局につき1回のみ発火。死に石選択を取り消して続行する場合は再発火しない)
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4)) {
                moveCapFired = true;
                startDeadStoneSelectionPhase();
                if (gameMode === 'online' && onlineRoomId) syncOnlineState();
                saveState();
                return;
            }`],
        [K.ONE, K.PIECES_PUSH, `            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length
            });`],
        // 蜃気楼石は敵石が直交隣接に置かれた瞬間に消える
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 蜃気楼碁: 未確定の敵石に隣接着手すると蜃気楼は掻き消える
            {
                const adj = new Set();
                move.cells.forEach(p => getNeighbors(p.y * BOARD_SIZE + p.x).forEach(n => adj.add(n)));
                let gone = false;
                pieces.forEach(pc => {
                    if (pc.player === player || !isMirage(pc)) return;
                    if (!pc.cells.some(p => adj.has(p.y * BOARD_SIZE + p.x))) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === pc.player) board[p.y * BOARD_SIZE + p.x] = 0;
                    });
                    gone = true;
                });
                if (gone) cleanUpPieces();
            }

            turn = opponent;`],
        [K.ONE, '                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : 1);',
`                drawPieceShape(alive, padding, cellSize, fill, stroke, isDead ? 0.35 : (isMirage(pc) ? 0.45 : 1));`],
        ...K.STONE_MARKS_SPEC(`            // 蜃気楼石に揺らぐ二重輪郭
            {
                ctx.save();
                ctx.setLineDash([cellSize * 0.10, cellSize * 0.08]);
                ctx.lineWidth = Math.max(1.2, cellSize * 0.05);
                pieces.forEach(pc => {
                    if (!isMirage(pc)) return;
                    pc.cells.forEach(p => {
                        if (board[p.y * BOARD_SIZE + p.x] === 0) return;
                        const cx = padding + p.x * cellSize, cy = padding + p.y * cellSize;
                        ctx.strokeStyle = 'rgba(103, 232, 249, 0.8)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
                        ctx.stroke();
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.34, 0, Math.PI * 2);
                        ctx.stroke();
                    });
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`(function(){ const m = pieces.filter(pc => isMirage(pc) && pc.cells.some(p => board[p.y * BOARD_SIZE + p.x] === pc.player)).length; return m > 0 ? '蜃気楼 ' + m + '石' : ''; })()`),
        [K.ONE, K.INFO_ALGO, `            蜃気楼碁: 置いた石は3手の間だけ蜃気楼。敵石を隣に置かれると消えてしまう<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_ALGO, K.rv([
            '置いたばかりの石は3手の間「蜃気楼」(点線の輪郭)。3手経てば実体化する。',
            '蜃気楼の敵石の直交隣に着手すると、その石は幻だったと判明して消える。',
            '呼吸や取りは蜃気楼の間も普通に働く — 消される前に囲み切れるかが勝負。',
            '打ち切り: 交点数の1.4倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1);
        assert('直後は蜃気楼', isMirage(pieces[pieces.length - 1]) === true);
        assert('盤上にはある', board[4 * BOARD_SIZE + 4] === 1);
        executeMove({ cells: [{ x: 4, y: 5 }] }, 2); // 隣に敵石 → 蜃気楼消滅
        assert('隣に置かれると消える', board[4 * BOARD_SIZE + 4] === 0);
        board.fill(0); pieces = []; history.length = 0;
        executeMove({ cells: [{ x: 2, y: 2 }] }, 1);
        executeMove({ cells: [{ x: 8, y: 8 }] }, 2);
        executeMove({ cells: [{ x: 8, y: 0 }] }, 1);
        executeMove({ cells: [{ x: 0, y: 8 }] }, 2);
        assert('3手後に実体化', isMirage(pieces[0]) === false);
        assert('実体化後は消えない', board[2 * BOARD_SIZE + 2] === 1);
        // 打ち切り手数
        history.length = Math.ceil(BOARD_SIZE * BOARD_SIZE * 1.4);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('上限手数で死に石選択へ', gamePhase === 'dead_stone_selection');
    `,
};
