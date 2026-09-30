module.exports = {
    icon: 'lotusgo',
    body: `        // 蓮: 泥の中から咲く花
        c.fillStyle = 'rgba(120,113,108,0.7)';
        c.beginPath(); c.ellipse(at(3,4.4).x, at(3,4.4).y, cell * 1.9, cell * 0.6, 0, 0, Math.PI * 2); c.fill();
        dot(2.6, 3.2, '#f0abfc', '#d946ef', R * 0.6);
        dot(3.4, 3.2, '#f0abfc', '#d946ef', R * 0.6);
        dot(3, 2.4, '#f5d0fe', '#e879f9', R * 0.7);
        seg(3, 3.0, 3, 4.2, '#4ade80', 1.6);`,
};
