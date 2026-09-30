module.exports = {
    icon: 'lodestonego',
    body: `        // 磁針: 羅針盤と北を指す針
        ring(3.0, 3.0, cell * 2.0, '#57534e', 2);
        tri(3.0, 2.0, cell * 0.5, '#dc2626', '#991b1b', -Math.PI / 2);
        tri(3.0, 4.0, cell * 0.5, '#e7e5e4', '#a8a29e', Math.PI / 2);
        dot(3.0, 3.0, P1, P1S, cell * 0.18);`,
};
