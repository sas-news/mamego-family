module.exports = {
    icon: 'yuzengo',
    body: `        // 友禅: 絵羽模様の斜め3連と花色
        dot(1.6, 4.4, P1, P1S); dot(3, 3, P1, P1S); dot(4.4, 1.6, P1, P1S);
        seg(1.6, 4.4, 4.4, 1.6, '#db2777', 1.6);
        dot(4.4, 1.6, '#f9a8d4', '#db2777', cell * 0.2);
        ring(4.4, 1.6, cell * 0.6, '#f472b6', 1.4);`,
};
