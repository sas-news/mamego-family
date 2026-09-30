module.exports = {
    icon: 'rubberjumpgo',
    body: `        // ゴム跳び: 両端の支点+ゴム+跳ぶ矢印
        dot(1.2, 4.2, P1, P1S, cell * 0.3);
        dot(4.6, 4.2, P1, P1S, cell * 0.3);
        seg(1.2, 4.2, 4.6, 4.2, '#f59e0b', 2.2);
        seg(2.2, 3.0, 2.9, 1.8, '#22c55e', 2);
        tri(2.9, 1.7, cell * 0.2, '#22c55e', '#15803d');`,
};
