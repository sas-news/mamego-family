module.exports = {
    icon: 'zazengo',
    body: `        // 座禅: 円相の中で坐る石
        c.beginPath(); c.arc(at(3, 3.2).x, at(3, 3.2).y, cell * 1.6, Math.PI * 0.2, Math.PI * 1.75); c.strokeStyle = '#57534e'; c.lineWidth = 2.2; c.stroke(); // 円相
        dot(3, 3.4, '#292524', '#000', cell * 0.7);    // 坐る石
        dot(3, 2.3, '#44403c', '#292524', cell * 0.32); // 頭
        seg(1.8, 4.6, 4.2, 4.6, '#78716c', 2);         // 座布団
        seg(2.4, 4.2, 3.6, 4.2, '#a16207', 1.6);       // 結跏の線`,
};
