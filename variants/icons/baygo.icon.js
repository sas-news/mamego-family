module.exports = {
    icon: 'baygo',
    body: `        // 湾岸: 海と斜めの海岸線、船着き場の石
        c.fillStyle = '#0ea5e9'; c.globalAlpha = 0.5;
        c.beginPath(); c.moveTo(0, 0); c.lineTo(cell * 3.6, 0); c.lineTo(0, cell * 3.6); c.closePath(); c.fill();
        c.globalAlpha = 1;
        seg(0.4, 3.6, 3.6, 0.4, '#fde68a', 2.6);
        blk(4.6, 4.6, '#b45309', '#78350f');
        dot(3.4, 3.4, P1, P1S, R * 0.85);
        dot(4.8, 2.2, P2, P2S, R * 0.85);`,
};
