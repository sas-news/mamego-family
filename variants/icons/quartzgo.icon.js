module.exports = {
    icon: 'quartzgo',
    body: `        // 水晶: 六角の結晶と屈折光
        tri(3, 3.4, cell * 0.7, 'rgba(165,243,252,0.75)', '#22d3ee', -Math.PI / 2);
        tri(3, 3.4, cell * 0.7, 'rgba(165,243,252,0.4)', '#67e8f9', Math.PI / 2);
        seg(3, 3.4, 4.6, 2.0, '#a5f3fc', 1.4);
        seg(3, 3.4, 1.4, 2.0, '#a5f3fc', 1.4);
        dot(3, 3.4, '#e0f2fe', '#38bdf8', R * 0.5);`,
};
