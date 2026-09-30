module.exports = {
    icon: 'yorakugo',
    body: `        // 瓔珞: 首飾りの弧と連なる珠
        c.beginPath(); c.arc(at(3, 2.4).x, at(3, 2.4).y, cell * 1.5, Math.PI * 0.15, Math.PI * 0.85); c.strokeStyle = '#d4af37'; c.lineWidth = 1.8; c.stroke();
        dot(1.7, 3.7, '#dc2626', '#991b1b', cell * 0.28);
        dot(2.4, 4.4, '#0ea5e9', '#0369a1', cell * 0.3);
        dot(3, 4.7, '#d4af37', '#92600e', cell * 0.34);
        dot(3.7, 4.4, '#0ea5e9', '#0369a1', cell * 0.3);
        dot(4.3, 3.7, '#dc2626', '#991b1b', cell * 0.28);`,
};
