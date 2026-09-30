module.exports = {
    icon: 'bulletgo',
    body: `        // 弾丸: 発射する弾 + 貫通線 + 撃たれる敵石
        dot(1.2, 4.6, P1, P1S, cell * 0.4);
        seg(1.8, 4.2, 4.4, 2.2, '#fbbf24', 2.2);
        tri(4.7, 2.0, cell * 0.32, '#fbbf24', '#b45309', Math.PI / 3);
        dot(4.6, 1.2, P2, P2S, cell * 0.34, 0.55);
        dot(5.1, 0.9, P2, P2S, cell * 0.28, 0.35);`,
};
