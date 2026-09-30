module.exports = {
    icon: 'kagurago',
    body: `        // 神楽: 扇を翳す巫女の舞と神の光輪
        c.fillStyle = '#f43f5e'; c.strokeStyle = '#9f1239'; c.lineWidth = 1.2;
        c.beginPath(); c.moveTo(at(2.4,4.2).x, at(2.4,4.2).y);
        c.arc(at(2.4,4.2).x, at(2.4,4.2).y, cell * 1.15, -Math.PI * 0.85, -Math.PI * 0.15);
        c.closePath(); c.fill(); c.stroke(); // 扇
        seg(2.4, 4.2, 1.7, 3.3, '#9f1239', 1.2);
        seg(2.4, 4.2, 2.4, 3.05, '#9f1239', 1.2);
        seg(2.4, 4.2, 3.1, 3.3, '#9f1239', 1.2);
        dot(2.4, 4.6, P1, P1S, R * 0.5); // 舞手の石
        ring(4.4, 1.8, cell * 0.7, 'rgba(251,191,36,0.9)', 2); // 神の輪
        dot(4.4, 1.8, '#fde68a', '#d97706', R * 0.5, 0.9);`,
};
