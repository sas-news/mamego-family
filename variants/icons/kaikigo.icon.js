module.exports = {
    icon: 'kaikigo',
    body: `        // 回忌: 位牌と線香の煙
        blk(3, 3.4, '#164e63', '#0e7490'); // 位牌
        seg(2.5, 4.6, 3.5, 4.6, '#164e63', cell * 0.3); // 台
        txt('徳', 3, 3.35, '#a5f3fc', cell * 0.8);
        c.strokeStyle = 'rgba(148,163,184,0.8)'; c.lineWidth = 1.6; c.lineCap = 'round';
        c.beginPath(); c.moveTo(at(1.6,5).x, at(1.6,5).y);
        c.quadraticCurveTo(at(1.3,3.6).x, at(1.3,3.6).y, at(1.9,2.4).x, at(1.9,2.4).y); c.stroke(); // 煙
        c.beginPath(); c.moveTo(at(4.4,5).x, at(4.4,5).y);
        c.quadraticCurveTo(at(4.7,3.6).x, at(4.7,3.6).y, at(4.1,2.4).x, at(4.1,2.4).y); c.stroke();
        dot(1.6, 5.1, '#f97316', '#c2410c', R * 0.3); // 線香火`,
};
