module.exports = {
    icon: 'mutatego',
    body: `                    // 変異体ブロブとDNAらしき渦
                    c.fillStyle = '#a855f7'; c.strokeStyle = '#6b21a8'; c.lineWidth = 1.3;
                    c.beginPath();
                    for (let k = 0; k < 9; k++) {
                        const a = (k / 9) * Math.PI * 2;
                        const rr = cell * 1.5 * (1 + 0.16 * Math.sin(k * 3.1));
                        const px = at(3, 3).x + Math.cos(a) * rr, py = at(3, 3).y + Math.sin(a) * rr;
                        if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
                    }
                    c.closePath(); c.fill(); c.stroke();
                    dot(2.6, 2.7, '#e9d5ff', '#6b21a8', cell * 0.22); dot(3.4, 3.3, '#e9d5ff', '#6b21a8', cell * 0.18);`,
};
