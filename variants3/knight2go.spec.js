// KNIGHT2GO — 跳馬碁: 石は自石から桂馬跳びの位置にしか置けない (盤上に自石がない/合法手なし時は自由)
const K = require('../gen_kit.js');
module.exports = {
    file: 'knight2go.html',
    en: 'KNIGHT2GO',
    jp: '跳馬碁',
    prefix: 'knight2go',
    desc: '着手は自石の桂馬跳びの位置のみ。自石がない/跳べる場所がない時はどこでも置ける。',
    kind: 'stone',
    icon: 'knight2go',
    spec: [
        ...K.rb('KNIGHT2GO', '跳馬碁', 'knight2go'),
        K.params([
            { key: 'jump_a', label: '跳びの短辺', min: 0, max: 4, def: 1 },
            { key: 'jump_b', label: '跳びの長辺', min: 1, max: 5, def: 2, hint: '桂馬は1×2' },
            { key: 'cap_factor', label: '打ち切り手数係数', min: 0.4, max: 2.5, def: 0.75, step: 0.05, hint: '交点数×この係数で強制終局' },
        ]),
        [K.ONE, '        function executeMove(move, player) {',
`        // 跳馬: 桂馬跳びの位置か (盤上に自石がなければ自由)
        function knightOffsets() {
            const a = Math.max(0, P('jump_a') ?? 1), b = Math.max(1, P('jump_b') || 2);
            return [[a, b], [b, a], [-a, b], [-b, a], [a, -b], [b, -a], [-a, -b], [-b, -a]];
        }
        function knightFree(player) {
            // 自石が1つもなければ自由、あれば桂馬跳びのみ
            let has = false;
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) if (board[i] === player) { has = true; break; }
            if (!has) return null;
            const ok = new Set();
            for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
                if (board[i] !== player) continue;
                const x = i % BOARD_SIZE, y = Math.floor(i / BOARD_SIZE);
                knightOffsets().forEach(([dx, dy]) => {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < BOARD_SIZE && ny >= 0 && ny < BOARD_SIZE && board[ny * BOARD_SIZE + nx] === 0) {
                        ok.add(ny * BOARD_SIZE + nx);
                    }
                });
            }
            if (ok.size === 0) return null; // 跳べる場所がないなら自由 (行き詰まり防止)
            return ok;
        }

        function executeMove(move, player) {`],
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `

            // 跳馬ルール: 自石がある限り桂馬跳びの位置にしか置けない
            {
                const ok = knightFree(player);
                if (ok !== null) {
                    for (const p of cells) {
                        if (!ok.has(p.y * BOARD_SIZE + p.x)) return false;
                    }
                }
            }`],
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 打ち切り終局: 交点数の0.75倍の手数を超えたら強制終局して採点
            if (history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_factor') || 0.75))) {
                endGameByScore();
                return;
            }

            turn = opponent;`],
        [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
        // 跳べる位置を淡く示す
        ...K.STONE_MARKS_SPEC(`            {
                const ok = knightFree(turn);
                if (ok) {
                    ctx.save();
                    ctx.fillStyle = 'rgba(52, 211, 153, 0.25)';
                    ok.forEach(i => {
                        const cx = padding + (i % BOARD_SIZE) * cellSize;
                        const cy = padding + Math.floor(i / BOARD_SIZE) * cellSize;
                        ctx.beginPath();
                        ctx.arc(cx, cy, cellSize * 0.2, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    ctx.restore();
                }
            }`),
        [K.ONE, K.INFO_BASE, `            跳馬碁: 着手は自石の桂馬跳びの位置のみ。跳べる場所は緑の点で表示<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '着手は自分の石から桂馬跳び (将棋の桂馬と同じ 1×2 の跳び) の位置に限られる。',
            '自石がない初手、および跳べる場所が1つもない行き詰まり時はどこでも置ける。',
            '打ち切り: 交点数の0.75倍の手数を超えると自動的に終局・採点される。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        assert('起動', typeof knightFree === 'function');
        // 自石なし → 自由
        assert('初手はどこでも', isValidPlacement([{ x: 5, y: 5 }], 1) === true);
        board[5 * BOARD_SIZE + 5] = 1;
        const ok = knightFree(1);
        assert('跳び先が列挙される', ok !== null && ok.size > 0);
        assert('桂馬跳びは合法', isValidPlacement([{ x: 7, y: 6 }], 1) === true);
        assert('隣接は違法', isValidPlacement([{ x: 6, y: 5 }], 1) === false);
        assert('遠隔も違法', isValidPlacement([{ x: 0, y: 0 }], 1) === false);
    `,
};
