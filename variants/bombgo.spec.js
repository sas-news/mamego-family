// BOMBGO — 爆弾碁: 各側4手目の着手は爆弾。着地点の3x3を爆破し敵石をアゲハマにする (各1回)
const K = require('../gen_kit.js');
module.exports = {
    file: 'bombgo.html',
    en: 'BOMBGO',
    jp: '爆弾碁',
    prefix: 'bombgo',
    desc: '各側4手目は爆弾石。着地点の3x3を爆破する (1回だけ)。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'bomb',
    spec: [
        ...K.rb('BOMBGO', '爆弾碁', 'bombgo'),
        K.params([
            { key: 'bomb_move', label: '爆弾になる手数', min: 2, max: 10, def: 4, unit: '手目' },
            { key: 'blast_radius', label: '爆破半径', min: 1, max: 3, def: 1, hint: '1=3x3範囲' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let st = { pcnt: { 1: 0, 2: 0 }, used: { 1: false, 2: false }, blasts: [] }; // 爆弾碁: 着手数・使用済・爆跡`],
        [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `
            st = { pcnt: { 1: 0, 2: 0 }, used: { 1: false, 2: false }, blasts: [] };`],
        [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
        [K.ONE, K.SNAP_POP, K.SNAP_POP + `
            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : { pcnt: { 1: 0, 2: 0 }, used: { 1: false, 2: false }, blasts: [] };`],
        [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
        [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `
            st = s.st ? JSON.parse(JSON.stringify(s.st)) : { pcnt: { 1: 0, 2: 0 }, used: { 1: false, 2: false }, blasts: [] };`],
        [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
        [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `
            st = data.st ? JSON.parse(JSON.stringify(data.st)) : { pcnt: { 1: 0, 2: 0 }, used: { 1: false, 2: false }, blasts: [] };`],
        [K.ONE, K.PIECES_PUSH, `            st.pcnt[player] = (st.pcnt[player] || 0) + 1;
            pieces.push({
                id: Date.now() + Math.random(),
                player: player,
                type: move.type,
                rot: move.rot,
                cells: move.cells,
                at: history.length,
                bomb: !st.used[player] && st.pcnt[player] === (P('bomb_move') || 4)
            });`],
        // 各側4手目の着手は爆弾: 着地点の3x3の石を全て消し飛ばす (敵石はアゲハマ)
        [K.ONE, K.TURN_FLIP, `            consecutivePasses = 0;
            holdUsed = false; // 着手でホールド権利が戻る

            // 爆弾碁: 設定手数目の着手が爆弾石 — 周囲を爆破 (1回のみ)
            if (!st.used[player] && st.pcnt[player] >= (P('bomb_move') || 4)) {
                st.used[player] = true;
                const bc = move.cells[0];
                const ci = bc.y * BOARD_SIZE + bc.x;
                // 爆発演出: 衝撃波リング + 全セルで火花 + 画面揺れ
                fxGlow(ci, '#fbbf24', 700);
                fxShake(8, 380);
                fxText(ci, 'BOOM!', '#fb923c', 900);
                const br = Math.max(1, P('blast_radius') || 1);
                for (let dy = -br; dy <= br; dy++) {
                    for (let dx = -br; dx <= br; dx++) {
                        const nx = bc.x + dx, ny = bc.y + dy;
                        if (nx < 0 || ny < 0 || nx >= BOARD_SIZE || ny >= BOARD_SIZE) continue;
                        const i0 = ny * BOARD_SIZE + nx;
                        fxBurst(i0, '#f97316', 10, 1.8);
                        fxBurst(i0, '#fbbf24', 5, 1.2);
                        if (board[i0] === opponent) captures[player]++;
                        board[i0] = 0;
                    }
                }
                st.blasts.push({ x: bc.x, y: bc.y });
                cleanUpPieces();
            } else if (!st.used[player] && st.pcnt[player] === (P('bomb_move') || 4) - 1) {
                // 次の一手が爆弾 — 警告の点滅
                fxGlow(move.cells[0].y * BOARD_SIZE + move.cells[0].x, '#ef4444', 800);
            }

            turn = opponent;`],
        ...K.STONE_MARKS_SPEC(`            // 爆跡: 黒い焦げ跡と火花マークが残る
            {
                ctx.save();
                (st.blasts || []).forEach(b => {
                    const cx = padding + b.x * cellSize, cy = padding + b.y * cellSize;
                    ctx.fillStyle = 'rgba(41, 37, 36, 0.35)';
                    ctx.fillRect(cx - cellSize * 1.5, cy - cellSize * 1.5, cellSize * 3, cellSize * 3);
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
                    ctx.lineWidth = Math.max(1.6, cellSize * 0.06);
                    ctx.beginPath();
                    for (let k = 0; k < 8; k++) {
                        const a = k * Math.PI / 4;
                        ctx.moveTo(cx + Math.cos(a) * cellSize * 0.15, cy + Math.sin(a) * cellSize * 0.15);
                        ctx.lineTo(cx + Math.cos(a) * cellSize * 0.38, cy + Math.sin(a) * cellSize * 0.38);
                    }
                    ctx.stroke();
                });
                ctx.restore();
            }`),
        ...K.EVENT_CHIP_SPEC(`st.used[turn] ? '爆弾使用済' : '爆弾まで ' + Math.max(0, (P('bomb_move') || 4) - (st.pcnt[turn] || 0)) + '手'`),
        [K.ONE, K.INFO_BASE, `            爆弾碁: 各側4手目の着手は爆弾石。着地点の3x3の石を全て吹き飛ばす (1回のみ)<br>
            PC: クリックで配置<br>
            スマホ: 1タップ目プレビュー、2タップ目確定`],
        [K.ONE, K.RV_BASE, K.rv([
            '各プレイヤーの4手目の着手は「爆弾石」— 置くと3x3範囲の石を全て消し飛ばす。',
            '消えた敵石はアゲハマになる (自分の石や爆弾石自身も巻き込む)。各側1回切り。',
        ])],
        ...K.STONE_SPEC,
    ],
    test: `
        board.fill(0); pieces = []; history.length = 0; turn = 1;
        st.pcnt = { 1: 0, 2: 0 }; st.used = { 1: false, 2: false }; st.blasts = []; captures = { 1: 0, 2: 0 };
        board[3 * BOARD_SIZE + 4] = 2; board[4 * BOARD_SIZE + 3] = 2; // 爆破圏に白石2個
        for (let i = 0; i < 6; i++) executeMove({ cells: [{ x: 8, y: i }] }, i % 2 === 0 ? 1 : 2);
        executeMove({ cells: [{ x: 4, y: 4 }] }, 1); // 黒の4手目 → 爆弾
        assert('爆弾を使用済', st.used[1] === true);
        assert('爆破圏の敵石は消滅', board[3 * BOARD_SIZE + 4] === 0 && board[4 * BOARD_SIZE + 3] === 0);
        assert('爆弾石自身も吹き飛ぶ', board[4 * BOARD_SIZE + 4] === 0);
        assert('敵石はアゲハマに', captures[1] === 2);
        executeMove({ cells: [{ x: 0, y: 0 }] }, 1);
        assert('爆弾は1回のみ', st.blasts.length === 1);
    `,
};
