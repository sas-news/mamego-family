module.exports = {
    icon: 'washigo',
    body: `        // 和紙: 濡れて破れる紙の石と水滴
        blk(2.4, 2.6, '#f5f0e6', '#a8a29e');
        seg(2, 2.2, 2.8, 3, '#78716c', 1.6);
        seg(2.8, 3, 2.4, 3.4, '#78716c', 1.6);
        c.fillStyle = '#60a5fa';
        c.beginPath(); c.moveTo(at(4.2,1.4).x, at(4.2,1.4).y); c.quadraticCurveTo(at(4.7,2.4).x, at(4.7,2.4).y, at(4.2,2.6).x, at(4.2,2.6).y); c.quadraticCurveTo(at(3.7,2.4).x, at(3.7,2.4).y, at(4.2,1.4).x, at(4.2,1.4).y); c.fill();
        dot(4.4, 4.4, P1, P1S, R * 0.8);`,
};
