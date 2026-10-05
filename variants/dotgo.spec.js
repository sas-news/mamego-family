// DOTGO — 双点碁: 1手で離れた2点に同時着手。2クリックで確定。
const K = require('../gen_kit.js');
module.exports = {
    file: 'dotgo.html',
    en: 'DOTGO',
    jp: '双点碁',
    prefix: 'dotgo',
    desc: '1手で離れた2点に同時着手。2クリックで確定。',
    catalog: false, // index.html に手書きカードがあるため自動カタログ生成しない
    kind: 'stone',
    spec: [
        ...K.rb('DOTGO', '双点碁', 'dotgo'),
        K.params([
            { key: 'dot_min_dist', label: '2点間の最小距離', min: 0, max: 8, def: 0, hint: 'マンハッタン距離。0=制限なし' },
        ]),
        [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `
        let pendingDot = null; // 双点碁: 1点目の仮置き {x,y}`],
        // 2点間の最小距離チェック (0=制限なし)
        [K.ONE, K.VALID_BOUNDS, K.VALID_BOUNDS + `
            // 双点碁: 2点間の最小距離 (設定で調整、0=制限なし)
            if (cells.length === 2) {
                const md = P('dot_min_dist') ?? 0;
                if (md > 0) {
                    const d = Math.abs(cells[0].x - cells[1].x) + Math.abs(cells[0].y - cells[1].y);
                    if (d < md) return false;
                }
            }`],
        [K.ONE, K.RESET_HELD, K.RESET_HELD + `
            pendingDot = null;`],
        [K.ONE, `            currentRot = (currentRot + 1) % list.length;`, `            pendingDot = null; // Rキー/右クリック/ホイール: 仮置きを取消`],
        [K.ONE, `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            const isTouch = lastPointerType === 'touch';

            if (!isTouch) {
                // マウス: クリックで即配置
                const pl = getPlacementAt(anchor.u, anchor.v);
                if (isValidPlacement(pl.cells, turn)) {
                    executeMove({ cells: pl.cells, type: currentPieceType, rot: currentRot }, turn);
                    previewPos = null;
                }
                return;
            }

            // タッチ: 1回目のタップ=プレビュー、プレビュー上の2回目のタップ=確定
            if (previewPos && isTapOnPreview(e, previewPos)) {
                if (previewPos.valid) {
                    executeMove({ cells: previewPos.cells, type: previewPos.type, rot: previewPos.rot }, turn);
                    previewPos = null;
                    render();
                }
                // 置けない場所(赤)の場合はプレビューのまま維持
            } else {
                previewPos = computePreview(anchor.u, anchor.v);
                render();
            }`, `            if (!isMyTurn()) return;

            const anchor = getAnchorFromEvent(e);
            if (!anchor) return;

            const pl = getPlacementAt(anchor.u, anchor.v);
            const cell = pl.cells[0];
            if (!cell) return;

            // 双点碁: 1手=任意の2点。1点目クリックで仮置き(黄印)、2点目クリックで確定。
            if (!pendingDot) {
                if (isValidPlacement([cell], turn)) {
                    pendingDot = { x: cell.x, y: cell.y };
                    render();
                }
                return;
            }
            if (pendingDot.x === cell.x && pendingDot.y === cell.y) {
                pendingDot = null; // 同じ点を再クリックで取消
                render();
                return;
            }
            const cells = [{ x: pendingDot.x, y: pendingDot.y }, { x: cell.x, y: cell.y }];
            if (isValidPlacement(cells, turn)) {
                executeMove({ cells, type: currentPieceType, rot: 0 }, turn);
                fxGlow(cells[1].y * BOARD_SIZE + cells[1].x, '#facc15', 650);
            }
            pendingDot = null;
            previewPos = null;
            render();`],
        ...K.STONE_MARKS_SPEC(`            // 仮置きの1点目を金色の点で表示
            if (pendingDot) {
                const px = padding + pendingDot.x * cellSize;
                const py = padding + pendingDot.y * cellSize;
                ctx.save();
                ctx.fillStyle = 'rgba(230,180,0,0.95)';
                ctx.beginPath();
                ctx.arc(px, py, Math.max(3, cellSize * 0.2), 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }`),
        [K.ONE, K.RV_BASE, K.rv(['1手=盤上の任意の2点に1石ずつ置く。1点目をクリックすると金色の点で仮置き、2点目で確定。','仮置きは同じ点の再クリックか ⟳ボタン・Rキー・右クリック・ホイールで取消。2石は別々の連。'])],
        // 双点: 仮置き点に脈動リング (着手待ちを示す)
        [K.ONE, `        let obstaclePainter = null;`, `        let obstaclePainter = null;
        fxAmbient((ctx2, now, pad, cs) => {
            if (!pendingDot) return;
            const ph = (Math.sin(now / 350) + 1) / 2;
            const px = pad + pendingDot.x * cs, py = pad + pendingDot.y * cs;
            ctx2.save();
            ctx2.strokeStyle = 'rgba(255,210,60,' + (0.45 + ph * 0.5).toFixed(3) + ')';
            ctx2.lineWidth = Math.max(1.4, cs * 0.06);
            ctx2.beginPath();
            ctx2.arc(px, py, cs * (0.3 + ph * 0.12), 0, Math.PI * 2);
            ctx2.stroke();
            ctx2.restore();
        });`],
        ...K.STONE_SPEC,
    ],
    test: `

        assert('起動', typeof executeMove === 'function');
        board.fill(0);
        assert('pendingDotは空', pendingDot === null);
        assert('離れた2点は有効', isValidPlacement([{ x: 1, y: 1 }, { x: 7, y: 7 }], 1) === true);
        executeMove({ cells: [{ x: 1, y: 1 }, { x: 7, y: 7 }] }, 1);
        assert('2石置かれた', board[1 * BOARD_SIZE + 1] === 1 && board[7 * BOARD_SIZE + 7] === 1);
        assert('占有点を含む2点は無効', isValidPlacement([{ x: 1, y: 1 }, { x: 2, y: 2 }], 2) === false);
        
    `,
};
