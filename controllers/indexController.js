const { db } = require('../config/firebase');

exports.getHomePage = async (req, res) => {
  try {
    // In Firebase, we can fetch all these concurrently
    const [slidersSnapshot, infoSnapshot, divisionsSnapshot, prestasiSnapshot] = await Promise.all([
      db.collection('sliders').orderBy('urutan', 'asc').get(),
      db.collection('informasi_umum').doc('1').get(), // assuming doc ID is '1'
      db.collection('divisions').orderBy('id', 'asc').get(),
      db.collection('prestasi').orderBy('tanggal', 'desc').limit(3).get()
    ]);

    const sliders = [];
    slidersSnapshot.forEach(doc => sliders.push({ id: doc.id, ...doc.data() }));

    const info = infoSnapshot.exists ? infoSnapshot.data() : { konten: 'Informasi UPUCC belum ditambahkan.' };

    const divisions = [];
    divisionsSnapshot.forEach(doc => divisions.push({ id: doc.id, ...doc.data() }));

    const prestasiTerbaru = [];
    prestasiSnapshot.forEach(doc => prestasiTerbaru.push({ id: doc.id, ...doc.data() }));

    res.render('index', {
      pageTitle: 'Beranda',
      activeMenu: 'home',
      sliders,
      info,
      divisions,
      prestasiTerbaru
    });
  } catch (error) {
    console.error("Error fetching home page data:", error);
    // Render with empty data if firebase is not connected yet
    res.render('index', {
      pageTitle: 'Beranda',
      activeMenu: 'home',
      sliders: [],
      info: { konten: 'Firebase belum terkonfigurasi atau error saat mengambil data.' },
      divisions: [],
      prestasiTerbaru: []
    });
  }
};
