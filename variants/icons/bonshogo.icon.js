module.exports = {
    icon: 'bonshogo',
    body: `        // 鐘撞: 梵鐘と撞木、音波
        c.fillStyle = '#a16207'; c.strokeStyle = '#713f12'; c.lineWidth = 1.2;
        c.beginPath(); c.arc(at(3.4,2.6).x, at(3.4,2.6).y, cell * 1.1, Math.PI, 0);
        c.rect(at(3.4,2.6).x - cell * 1.1, at(3.4,2.6).y, cell * 2.2, cell * 1.1); c.fill(); c.stroke(); // 鐘
        seg(0.9, 2.6, 2.1, 2.6, '#78350f', cell * 0.34); // 撞木
        ring(3.4, 3.2, cell * 1.7, 'rgba(161,98,7,0.5)', 1.4); // 音波
        ring(3.4, 3.2, cell * 2.2, 'rgba(161,98,7,0.3)', 1.2);
        dot(3.4, 2.1, '#fde047', '#eab308', R * 0.3); // 撞座`,
};
