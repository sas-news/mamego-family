module.exports = {
    icon: 'fulcrumgo',
    body: `        // 梃子: 支点 + 竿 + 跳ね飛ぶ敵石
        tri(2.6, 4.2, cell * 0.55, '#57534e', P1S, -Math.PI / 2);
        seg(1.0, 3.4, 5.0, 2.0, '#92400e', 3.0);
        dot(1.0, 3.1, P1, P1S, cell * 0.4);
        dot(4.9, 1.5, P2, P2S, cell * 0.4);
        seg(4.6, 1.9, 5.2, 1.5, '#f97316', 1.8);`,
};
