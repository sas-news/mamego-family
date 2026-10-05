module.exports = {
    icon: 'embroiderygo',
    body: `        // 刺繍: 図案枠 (点線) と縫い取った石
        seg(1, 1, 5, 1, '#a21caf', 1.2);
        seg(5, 1, 5, 5, '#a21caf', 1.2);
        seg(5, 5, 1, 5, '#a21caf', 1.2);
        seg(1, 5, 1, 1, '#a21caf', 1.2);
        dot(3, 3, P1, P1S);
        seg(3.6, 2.4, 4.8, 1.2, '#dc2626', 1.8);`,
};
