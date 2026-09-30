module.exports = {
    icon: 'hurdlego',
    body: `        // 跳欄: 石を飛び越える軌跡
        dot(1.4, 3.8, P1, P1S); dot(4.8, 3.8, P2, P2S);
        // ハードル (中間の石)
        blk(3.1, 3.8, '#fca5a5', '#b91c1c');
        c.strokeStyle = '#38bdf8'; c.lineWidth = 2; c.lineCap = 'round';
        c.setLineDash([4, 3]);
        c.beginPath(); c.moveTo(at(1.4, 3.8).x, at(1.4, 3.8).y); c.quadraticCurveTo(at(3.1, 1.4).x, at(3.1, 1.4).y, at(4.8, 3.8).x, at(4.8, 3.8).y); c.stroke();
        c.setLineDash([]);
        tri(4.8, 3.4, cell * 0.3, '#38bdf8', '#0369a1', Math.PI / 2);
    `,
};
