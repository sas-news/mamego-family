module.exports = {
    icon: 'silkwormgo',
    body: `        // 養蚕: 桑の葉と白い繭
        c.fillStyle = '#4ade80'; c.strokeStyle = '#166534'; c.lineWidth = 1.4;
        c.beginPath(); c.ellipse(at(1.8,1.6).x, at(1.8,1.6).y, cell * 1, cell * 0.6, -0.6, 0, Math.PI * 2); c.fill(); c.stroke();
        c.fillStyle = '#fef3c7'; c.strokeStyle = '#b45309';
        c.beginPath(); c.ellipse(at(3.4,3.4).x, at(3.4,3.4).y, cell * 0.55, cell * 0.4, 0.4, 0, Math.PI * 2); c.fill(); c.stroke();
        c.beginPath(); c.ellipse(at(4.6,4.4).x, at(4.6,4.4).y, cell * 0.55, cell * 0.4, -0.3, 0, Math.PI * 2); c.fill(); c.stroke();
        dot(2.2, 4.6, P1, P1S, R * 0.7);`,
};
