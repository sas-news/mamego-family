module.exports = {
    icon: 'mitatego',
    body: `        // 見立て: L字の曲がり角と見る目
        bond(2, 4.4, 2, 2.4, 3);
        bond(2, 2.4, 4, 2.4, 3);
        dot(2, 4.4, P1, P1S, cell * 0.3);
        dot(2, 2.4, P1, P1S, cell * 0.3);
        dot(4, 2.4, P1, P1S, cell * 0.3);
        ring(4.4, 4.4, cell * 0.5, '#0ea5e9', 1.8);
        dot(4.4, 4.4, '#0ea5e9', '#0369a1', cell * 0.2);`,
};
