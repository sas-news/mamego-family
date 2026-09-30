module.exports = {
    icon: 'limestonego',
    body: `        // 石灰: 泉に溶けて垂れる鍾乳石
        dot(3, 1.6, '#7dd3fc', '#38bdf8', R * 0.7);
        tri(2.4, 3.4, cell * 0.6, '#d6d3d1', '#a8a29e', Math.PI / 2);
        tri(3.6, 3.6, cell * 0.5, '#e7e5e4', '#a8a29e', Math.PI / 2);
        seg(2.4, 4.2, 2.4, 4.8, '#7dd3fc', 1.4);
        dot(3.6, 4.6, '#7dd3fc', '#38bdf8', R * 0.3);`,
};
