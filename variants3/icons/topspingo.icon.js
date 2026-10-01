module.exports = {
    icon: 'topspingo',
    body: `        // 独楽: 回転するコマと残像の弧
        tri(3.0, 3.0, cell * 0.85, '#dc2626', '#7f1d1d', Math.PI / 2);
        seg(3.0, 1.6, 3.0, 2.3, '#7f1d1d', 2.0);
        c.beginPath(); c.strokeStyle = '#94a3b8'; c.lineWidth = 1.6;
        c.arc(3.0 * cell + cell, 3.0 * cell + cell, cell * 1.5, Math.PI * 0.9, Math.PI * 1.5); c.stroke();
        c.beginPath(); c.arc(3.0 * cell + cell, 3.0 * cell + cell, cell * 1.5, Math.PI * 1.9, Math.PI * 2.5); c.stroke();`,
};
