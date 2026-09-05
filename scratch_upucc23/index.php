<?php
$pageTitle = 'Beranda';
$activeMenu = 'home';
require_once __DIR__ . '/partials/header.php';

$sliders = $pdo->query("SELECT * FROM sliders ORDER BY urutan ASC, id ASC")->fetchAll();
$info = $pdo->query("SELECT konten FROM informasi_umum WHERE id=1")->fetch();
$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
$prestasiTerbaru = $pdo->query("SELECT * FROM prestasi ORDER BY tanggal DESC, id DESC LIMIT 3")->fetchAll();
?>

<!-- SLIDER -->
<div id="heroCarousel" class="carousel slide hero-slider" data-bs-ride="carousel">
  <?php if ($sliders): ?>
    <div class="carousel-indicators">
      <?php foreach ($sliders as $i => $s): ?>
        <button type="button" data-bs-target="#heroCarousel" data-bs-slide-to="<?= $i ?>" class="<?= $i===0?'active':'' ?>"></button>
      <?php endforeach; ?>
    </div>
    <div class="carousel-inner">
      <?php foreach ($sliders as $i => $s): ?>
        <div class="carousel-item <?= $i===0?'active':'' ?>">
          <img src="uploads/slider/<?= e($s['gambar']) ?>" alt="<?= e($s['judul']) ?>">
          <?php if ($s['judul']): ?>
          <div class="carousel-caption text-white">
            <h3><?= e($s['judul']) ?></h3>
            <?php if ($s['deskripsi']): ?><p class="mb-0"><?= e($s['deskripsi']) ?></p><?php endif; ?>
          </div>
          <?php endif; ?>
        </div>
      <?php endforeach; ?>
    </div>
    <button class="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
      <span class="carousel-control-prev-icon"></span>
    </button>
    <button class="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
      <span class="carousel-control-next-icon"></span>
    </button>
  <?php else: ?>
    <div class="d-flex align-items-center justify-content-center text-white" style="height:480px; background:linear-gradient(120deg,#0d2b4e,#1e6fd9);">
      <div class="text-center">
        <h1 class="fw-bold">Selamat Datang di UPUCC</h1>
        <p>Tambahkan gambar slider melalui Dashboard untuk mengisi bagian ini.</p>
      </div>
    </div>
  <?php endif; ?>
</div>

<div class="container my-5">
  <h2 class="section-title">Tentang UPUCC</h2>
  <p class="lead"><?= nl2br(e($info['konten'] ?? '')) ?></p>
  <a href="informasi.php" class="btn btn-primary">Selengkapnya <i class="bi bi-arrow-right"></i></a>
</div>

<div class="container my-5">
  <h2 class="section-title">4 Divisi UPUCC</h2>
  <div class="row g-4">
    <?php foreach ($divisions as $d): ?>
    <div class="col-md-3 col-6">
      <a href="informasi_divisi.php?slug=<?= e($d['slug']) ?>" class="text-decoration-none text-dark">
        <div class="card card-divisi h-100 text-center">
          <img src="<?= $d['logo'] ? 'uploads/divisi/'.e($d['logo']) : 'https://via.placeholder.com/90?text='.e(substr($d['nama'],0,1)) ?>" class="logo-divisi" alt="<?= e($d['nama']) ?>">
          <div class="card-body">
            <h5 class="card-title"><?= e($d['nama']) ?></h5>
          </div>
        </div>
      </a>
    </div>
    <?php endforeach; ?>
  </div>
</div>

<?php if ($prestasiTerbaru): ?>
<div class="container my-5">
  <h2 class="section-title">Prestasi Terbaru</h2>
  <div class="row g-4">
    <?php foreach ($prestasiTerbaru as $p): ?>
    <div class="col-md-4">
      <div class="card prestasi-card h-100">
        <img src="<?= $p['gambar'] ? 'uploads/prestasi/'.e($p['gambar']) : 'https://via.placeholder.com/400x180?text=UPUCC' ?>" class="card-img-top" alt="">
        <div class="card-body">
          <h5 class="card-title"><?= e($p['judul']) ?></h5>
          <p class="card-text small text-muted"><?= tgl_indo($p['tanggal']) ?></p>
          <p class="card-text"><?= e(mb_substr($p['deskripsi'],0,100)) ?>...</p>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <div class="text-center mt-3"><a href="prestasi.php" class="btn btn-outline-primary">Lihat Semua Prestasi</a></div>
</div>
<?php endif; ?>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
