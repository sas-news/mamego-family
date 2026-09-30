module.exports = {
    icon: 'nucleationgo',
    body: `        // 結晶: 核から育つ結晶群
        dot(3, 3.4, P1, P1S);
        ring(3, 3.4, cell * 0.6, '#38bdf8', 1.5);
        tri(2.2, 2.2, cell * 0.4, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);
        tri(3.9, 2.4, cell * 0.35, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);
        tri(3.6, 4.6, cell * 0.3, 'rgba(125,211,252,0.8)', '#38bdf8', -Math.PI / 2);`,
};
