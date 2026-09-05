<?php
$pageTitle = 'Dashboard';
$activeMenu = 'index';
require_once __DIR__ . '/partials/header.php';

$countSlider = $pdo->query("SELECT COUNT(*) c FROM sliders")->fetch()['c'];
$countPrestasi = $pdo->query("SELECT COUNT(*) c FROM prestasi")->fetch()['c'];
$countAnggota = $pdo->query("SELECT COUNT(*) c FROM members")->fetch()['c'];
$countAcara = $pdo->query("SELECT COUNT(*) c FROM acara")->fetch()['c'];
?>
<div class="row g-3">
  <div class="col-md-3 col-6">
    <div class="card border-0 shadow-sm p-3 text-center"><i class="bi bi-images fs-2 text-primary"></i><h3><?= $countSlider ?></h3><p class="mb-0 text-muted">Slider</p></div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card border-0 shadow-sm p-3 text-center"><i class="bi bi-trophy fs-2 text-warning"></i><h3><?= $countPrestasi ?></h3><p class="mb-0 text-muted">Prestasi</p></div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card border-0 shadow-sm p-3 text-center"><i class="bi bi-people fs-2 text-success"></i><h3><?= $countAnggota ?></h3><p class="mb-0 text-muted">Anggota</p></div>
  </div>
  <div class="col-md-3 col-6">
    <div class="card border-0 shadow-sm p-3 text-center"><i class="bi bi-calendar-event fs-2 text-danger"></i><h3><?= $countAcara ?></h3><p class="mb-0 text-muted">Postingan Acara</p></div>
  </div>
</div>

<div class="alert alert-info mt-4">
  <i class="bi bi-info-circle"></i> Gunakan menu di samping untuk mengelola seluruh isi halaman publik (index), mulai dari slider, informasi, divisi, prestasi, struktur organisasi/anggota, sejarah, hingga acara. Menu pendaftaran anggota sudah tidak digunakan -- akun anggota baru dibuat langsung lewat menu <b>Anggota / Struktur</b> di Dashboard ini (tidak ada lagi di Portal).
</div>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
