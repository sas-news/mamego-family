module.exports = {
    icon: 'ambergo',
    body: `        // 琥珀: 金色の樹脂に封じられた石
        c.fillStyle = '#f59e0b'; c.strokeStyle = '#b45309'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(at(3,3.4).x, at(3,3.4).y, cell * 1.7, cell * 1.3, -0.2, 0, Math.PI * 2); c.fill(); c.stroke();
        dot(3, 3.4, P1, P1S, R * 0.8);
        c.fillStyle = 'rgba(255, 240, 180, 0.7)';
        c.beginPath(); c.ellipse(at(2.2,2.6).x, at(2.2,2.6).y, cell * 0.5, cell * 0.22, -0.5, 0, Math.PI * 2); c.fill();
        dot(4.8, 1.2, P2, P2S, R * 0.7);`,
};
