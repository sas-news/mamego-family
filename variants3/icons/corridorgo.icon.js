module.exports = {
    icon: 'corridorgo',
    body: `        // 渡廊: 二つの庭を結ぶ細い廊下
        c.fillStyle = 'rgba(74, 160, 80, 0.45)';
        c.fillRect(cell * 0.3, cell * 0.3, cell * 2, cell * 4.4);
        c.fillRect(cell * 3.7, cell * 0.3, cell * 2, cell * 4.4);
        seg(2.3, 3, 3.7, 3, '#b45309', 3);
        dot(1.3, 1.6, P1, P1S, R * 0.8);
        dot(4.7, 4.4, P2, P2S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.7);`,
};
