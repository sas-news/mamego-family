module.exports = {
    icon: 'brewgo',
    body: `        // 醸造: 仕込み樽と酒の滴
        blk(2.6, 3.6, '#92400e', '#451a03');
        seg(1.8, 3.2, 3.4, 3.2, '#451a03', 1.8);
        seg(1.8, 4, 3.4, 4, '#451a03', 1.8);
        c.fillStyle = '#fbbf24';
        c.beginPath(); c.moveTo(at(4.4,1.6).x, at(4.4,1.6).y); c.quadraticCurveTo(at(5,2.7).x, at(5,2.7).y, at(4.4,2.9).x, at(4.4,2.9).y); c.quadraticCurveTo(at(3.8,2.7).x, at(3.8,2.7).y, at(4.4,1.6).x, at(4.4,1.6).y); c.fill();
        dot(4.6, 4.8, P1, P1S, R * 0.75);`,
};
