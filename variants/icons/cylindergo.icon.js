module.exports = {
    icon: 'cylindergo',
    body: `        // 中空: 左右が繋がる筒 (両端の繋ぎ矢印)
        c.strokeStyle = '#0ea5e9'; c.lineWidth = 2;
        c.beginPath(); c.ellipse(at(3,1.1).x, at(3,1.1).y, cell * 2, cell * 0.55, 0, 0, Math.PI * 2); c.stroke();
        seg(1, 1.1, 1, 4.9, '#0ea5e9', 2);
        seg(5, 1.1, 5, 4.9, '#0ea5e9', 2);
        c.beginPath(); c.ellipse(at(3,4.9).x, at(3,4.9).y, cell * 2, cell * 0.55, 0, 0, Math.PI); c.stroke();
        dot(1, 3, P1, P1S, R * 0.8);
        dot(5, 3, P2, P2S, R * 0.8);
        dot(3, 3, P1, P1S, R * 0.8);`,
};
