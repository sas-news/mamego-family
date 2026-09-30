module.exports = {
    icon: 'stonekickgo',
    body: `        // 石蹴: 蹴った石が端へ転がる
        dot(1.4, 3.8, P1, P1S, cell * 0.42);
        seg(2.2, 3.4, 4.6, 2.4, '#f59e0b', 2.2);
        tri(4.8, 2.3, cell * 0.3, '#f59e0b', '#b45309', Math.PI / 3);
        seg(1.0, 4.6, 5.2, 4.6, '#94a3b8', 1.4);
        dot(4.8, 4.2, P2, P2S, cell * 0.3);`,
};
