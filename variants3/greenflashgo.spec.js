// Green Flash-Go — グリーン碁: 25手ごとにグリーンフラッシュ — 4手の間だけ自殺点にも置ける幻の点が現れる。期を過ぎると消える
const K = require('../gen_kit.js');
const PERSIST = (init) => [
    [K.ONE, K.BOARD_DECL, K.BOARD_DECL + `\n        let st = ${init};`],
    [K.ONE, K.RESET_BOARD, K.RESET_BOARD + `\n            st = ${init};`],
    [K.ONE, K.SNAP_PUSH, `                heldPieces: { ...heldPieces },
                st: JSON.parse(JSON.stringify(st)),
                holdUsed
            });`],
    [K.ONE, K.SNAP_POP, K.SNAP_POP + `\n            st = snap.st ? JSON.parse(JSON.stringify(snap.st)) : ${init};`],
    [K.ONE, K.SAVE_TAIL, `                    heldPieces,
                    st,
                    holdUsed,
                    gameMode,`],
    [K.ONE, K.LOAD_HOLD, K.LOAD_HOLD + `\n            st = s.st ? JSON.parse(JSON.stringify(s.st)) : ${init};`],
    [K.ONE, K.ONLINE_SEND, `                heldPieces,
                st,
                holdUsed,
                deadStones: [...deadStones],`],
    [K.ONE, K.ONLINE_RECV, K.ONLINE_RECV + `\n            st = data.st ? JSON.parse(JSON.stringify(data.st)) : ${init};`],
];

const GAME_OVER = [
    [K.ONE, `            if (consecutivePasses >= 2) {
                startDeadStoneSelectionPhase();`,
`            if (consecutivePasses >= 2) {
                // 簡略化: 連続パスはそのまま採点終局
                endGameByScore();`],
    [K.ONE, `        function executeMove(move, player) {`,
`        let moveCapFired = false;
        function executeMove(move, player) {
            // 打ち切り手数: 長期戦は強制採点 (終局不能の防止・1局1回のみ)
            if (moveCapFired && history.length === 0) moveCapFired = false;
            if (!moveCapFired && history.length >= Math.ceil(BOARD_SIZE * BOARD_SIZE * (P('cap_ratio') || 0.75))) {
                moveCapFired = true;
                endGameByScore();
                return;
            }`],
];

module.exports = {
    file: 'greenflashgo.html',
    en: "Green Flash-Go",
    jp: "グリーン碁",
    prefix: "greenflashgo",
    desc: "25手ごとに幻の点が4手だけ開き、そこには自殺手でも置ける。期終了でその石は消える。",
    kind: 'stone',
    icon: "greenflashgo",
    spec: [
        ...K.rb("Green Flash-Go", "グリーン碁", "greenflashgo"),
        K.params([
            { key: 'flash_interval', label: '閃光の間隔', min: 5, max: 60, def: 25, step: 5, unit: '手' },
            { key: 'flash_duration', label: '幻の点の開放期間', min: 1, max: 12, def: 4, unit: '手' },
            { key: 'cap_ratio', label: '打ち切り手数 (交点比)', min: 0.3, max: 1.5, def: 0.75, step: 0.05 },
        ]),
        ...PERSIST("{ flash: -1, fown: 0, until: 0, fidx: 0 }"),
        [K.ONE, "            if (getCapturedStones(after, player).length > 0) return false;", "            if (getCapturedStones(after, player).length > 0 && !(typeof st !== 'undefined' && st.until > history.length && cells.length === 1 && cells[0].y * BOARD_SIZE + cells[0].x === st.flash)) return false;"],
        [K.ONE, K.CAPTURE_BLOCK, "            // グリーン碁: 幻影の点への着手は通常通り。期間内の幻石は後で消える\n            const captured = getCapturedStones(board, opponent);\n            if (captured.length > 0) {\n                captured.forEach(idx => board[idx] = 0);\n                captures[player] += captured.length;\n                soundManager.playCapture();\n                cleanUpPieces();\n            } else {\n                soundManager.playPlace();\n            }\n            const mi = move.cells[0].y * BOARD_SIZE + move.cells[0].x;\n            if (mi === st.flash && st.until > history.length) {\n                st.fown = player;\n                fxGlow(mi, '#4ade80', 900);\n                fxText(mi, '幻影', '#4ade80', 1100);\n            }"],
        [K.ONE, K.TURN_FLIP, "            consecutivePasses = 0;\n            holdUsed = false; // 着手でホールド権利が戻る\n\n            // グリーンフラッシュ: 25手ごとに幻の点が4手の間だけ開く\n            if (history.length % Math.max(1, P('flash_interval') || 25) === 0) {\n                const PF = [[2, 2], [BOARD_SIZE - 3, 2], [BOARD_SIZE - 3, BOARD_SIZE - 3], [2, BOARD_SIZE - 3], [Math.floor(BOARD_SIZE / 2), Math.floor(BOARD_SIZE / 2)]];\n                const p = PF[st.fidx % PF.length];\n                st.fidx++;\n                st.flash = p[1] * BOARD_SIZE + p[0];\n                st.until = history.length + Math.max(1, P('flash_duration') || 4);\n                st.fown = 0;\n                fxGlow(st.flash, '#4ade80', 1200);\n                fxText(st.flash, 'FLASH!', '#22c55e', 1300);\n            }\n            // 開放期が過ぎた幻の石は消える\n            if (st.flash >= 0 && history.length >= st.until) {\n                if (st.fown && board[st.flash] === st.fown) {\n                    board[st.flash] = 0;\n                    fxBurst(st.flash, '#4ade80', 8, 1.2);\n                    cleanUpPieces();\n                }\n                st.fown = 0;\n            }\n\n            turn = opponent;"],
        K.CUE_STARS("            // 幻の点の緑の閃光\n            if (typeof st !== 'undefined' && st.flash >= 0 && st.until > history.length) {\n                const fx = st.flash % BOARD_SIZE, fy = Math.floor(st.flash / BOARD_SIZE);\n                const px = padding + fx * cellSize, py = padding + fy * cellSize;\n                const a = 0.5 + 0.4 * Math.sin(fxNow() / 120);\n                ctx.save();\n                ctx.strokeStyle = 'rgba(74,222,128,' + a.toFixed(2) + ')';\n                ctx.lineWidth = 2;\n                ctx.beginPath(); ctx.arc(px, py, cellSize * 0.42, 0, Math.PI * 2); ctx.stroke();\n                ctx.restore();\n            }"),
        ...K.EVENT_CHIP_SPEC("st.until > history.length ? 'FLASH 残' + (st.until - history.length) + '手' : '閃光まで' + ((Math.max(1, P('flash_interval') || 25) - history.length % Math.max(1, P('flash_interval') || 25)) % Math.max(1, P('flash_interval') || 25)) + '手'"),
        ...GAME_OVER,
        [K.ONE, K.INFO_BASE, "25手ごとにグリーンフラッシュ。盤上のどこか一点が4手の間だけ幻の点となり、自殺点でも敵地のど真ん中でも置ける。ただし期が過ぎるとその石は消える。刹那の侵入を決めろ。"],
        [K.ONE, K.RV_BASE, K.rv(["25手ごとに幻の点が4手だけ開く",
            "幻の点には自殺手でも置けるが期終了で消える",
            "瞬間の隙に敵陣深くへ侵入せよ — 跡は残らない"])],
        ...K.STONE_SPEC,
    ],
    test: "board.fill(0); pieces=[]; history.length=0; turn=1; captures={1:0,2:0};\nst.flash=-1; st.fown=0; st.until=0; st.fidx=0;\nconst B=BOARD_SIZE;\nboard[4*B+3]=2; board[4*B+5]=2; board[3*B+4]=2; board[5*B+4]=2; // (4,4)は白で全包囲\nassert('自殺点は通常置けない', isValidPlacement([{x:4,y:4}],1)===false);\nhistory.length=24;\nexecuteMove({cells:[{x:0,y:0}]},2); // 25手目 → フラッシュ開放\nassert('幻の点が開く', st.flash>=0 && st.until===29);\nst.flash=4*B+4; st.until=history.length+3; // テスト用に幻点を(4,4)へ移す\nassert('幻の点には自殺でも置ける', isValidPlacement([{x:4,y:4}],1)===true);\nexecuteMove({cells:[{x:4,y:4}]},1);\nassert('幻影石が置かれる', board[4*B+4]===1 && st.fown===1);\nhistory.length=st.until;\nexecuteMove({cells:[{x:1,y:1}]},2); // 期終了 → 幻影消滅 (包囲されているので取られてもよい)\nassert('期間終了で幻影は消える', board[4*B+4]===0);",
};
