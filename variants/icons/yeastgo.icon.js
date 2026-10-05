module.exports = {
    icon: 'yeastgo',
    body: `        // 酵母: 出芽する丸い酵母と糖蜜
        dot(2.4, 3.4, '#fde68a', '#b45309', R * 1.1);
        dot(3.4, 2.6, '#fef3c7', '#b45309', R * 0.6);
        dot(4.6, 4.2, '#fde68a', '#b45309', R * 0.9);
        dot(5.2, 3.6, '#fef3c7', '#b45309', R * 0.5);
        c.fillStyle = 'rgba(217, 119, 6, 0.4)';
        c.beginPath(); c.ellipse(at(3,5).x, at(3,5).y, cell * 1.8, cell * 0.5, 0, 0, Math.PI * 2); c.fill();`,
};
