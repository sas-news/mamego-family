module.exports = {
    icon: 'orbit2go',
    body: `                    // 軌道リングと周回する2石
                    c.strokeStyle = '#60a5fa'; c.lineWidth = 1.3; c.setLineDash([3, 2]);
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.9, 0, Math.PI * 2); c.stroke();
                    c.setLineDash([]);
                    dot(3, 3, '#fde68a', '#d97706', cell * 0.34);
                    dot(4.9, 3, P1, P1S); dot(1.1, 3, P2, P2S);
                    // 周回矢印
                    c.strokeStyle = '#3b82f6'; c.lineWidth = 1.6;
                    c.beginPath(); c.arc(at(3, 3).x, at(3, 3).y, cell * 1.9, -Math.PI * 0.28, Math.PI * 0.08); c.stroke();
                    tri(4.78, 2.28, cell * 0.2, '#3b82f6', '#1d4ed8', Math.PI * 0.35);`,
};
