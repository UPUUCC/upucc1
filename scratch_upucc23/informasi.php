<?php
$pageTitle = 'Informasi UPUCC';
$activeMenu = 'informasi';
require_once __DIR__ . '/partials/header.php';
$info = $pdo->query("SELECT konten FROM informasi_umum WHERE id=1")->fetch();
$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
?>
<div class="container my-5">
  <h2 class="section-title">Informasi UPUCC</h2>
  <p class="lead" style="white-space:pre-line;"><?= nl2br(e($info['konten'] ?? 'Belum ada informasi.')) ?></p>

  <h3 class="section-title mt-5">Informasi Masing-Masing Divisi</h3>
  <div class="row g-4">
    <?php foreach ($divisions as $d): ?>
    <div class="col-md-6">
      <div class="card card-divisi h-100">
        <div class="card-body d-flex gap-3">
          <img src="<?= $d['logo'] ? 'uploads/divisi/'.e($d['logo']) : 'https://via.placeholder.com/90?text='.e(substr($d['nama'],0,1)) ?>" class="logo-divisi flex-shrink-0" style="margin:0;" alt="">
          <div>
            <h5 class="card-title"><?= e($d['nama']) ?></h5>
            <p class="card-text"><?= e(mb_substr($d['deskripsi'] ?? '',0,150)) ?></p>
            <a href="informasi_divisi.php?slug=<?= e($d['slug']) ?>" class="btn btn-sm btn-primary">Selengkapnya</a>
          </div>
        </div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
