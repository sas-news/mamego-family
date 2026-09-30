module.exports = {
    icon: 'keisugo',
    body: `        // 磬子: 吊るされた磬(曲玉形の鉦)と撞木
        seg(2, 1.6, 4, 1.6, '#57534e', 1.6);       // 吊り紐横
        seg(3, 1.6, 3, 2.3, '#57534e', 1.6);       // 吊り紐
        c.beginPath(); c.arc(at(3, 3.7).x, at(3, 3.7).y, cell * 1.15, Math.PI * 1.05, Math.PI * 1.95); c.strokeStyle = '#a16207'; c.lineWidth = 2.4; c.stroke(); // 磬の湾曲
        seg(2.1, 3.5, 3.9, 3.5, '#a16207', 2.4);   // 磬の弦
        seg(4.5, 3.9, 5, 4.4, '#44403c', 1.8);     // 撞木
        dot(3, 4.4, '#d4af37', '#92600e', cell * 0.28); // 撞座`,
};
