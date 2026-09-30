module.exports = {
    icon: 'ehogo',
    body: `        // 恵方: 恵方巻きと恵方の方角矢印
        c.fillStyle = '#1c1917'; // 海苔巻き
        c.save(); c.translate(at(3.4,3.6).x, at(3.4,3.6).y); c.rotate(-0.5);
        c.beginPath(); c.ellipse(0, 0, cell * 0.6, cell * 1.5, 0, 0, Math.PI * 2); c.fill(); c.restore();
        c.fillStyle = '#fef3c7'; // 断面
        c.save(); c.translate(at(2.7,4.3).x, at(2.7,4.3).y); c.rotate(-0.5);
        c.beginPath(); c.ellipse(0, 0, cell * 0.55, cell * 0.34, 0, 0, Math.PI * 2); c.fill(); c.restore();
        dot(2.62, 4.25, '#f43f5e', '#9f1239', R * 0.22); // 具
        dot(2.82, 4.38, '#4ade80', '#15803d', R * 0.22);
        seg(3.6, 2.6, 4.9, 1.3, '#fb923c', cell * 0.3); // 恵方矢印
        tri(5.05, 1.15, cell * 0.42, '#fb923c', '#c2410c', Math.PI / 4.6);`,
};
