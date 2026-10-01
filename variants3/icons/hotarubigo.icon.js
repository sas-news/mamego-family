module.exports = {
    icon: 'hotarubigo',
    body: `        // 蛍火: 暗がりに瞬く小光点
        c.fillStyle = '#1e293b'; c.fillRect(0, 0, W, W);
        dot(2.0, 2.4, '#d9f99d', '#65a30d', cell * 0.2);
        dot(3.6, 3.2, '#d9f99d', '#65a30d', cell * 0.24);
        dot(4.4, 1.8, '#d9f99d', '#65a30d', cell * 0.16);
        dot(2.6, 4.4, '#d9f99d', '#65a30d', cell * 0.18);
        ring(3.6, 3.2, cell * 0.5, 'rgba(217,249,157,0.5)', 1.2);`,
};
