<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/includes/functions.php';
$pdo = getDB();

$slug = $_GET['slug'] ?? '';
$stmt = $pdo->prepare("SELECT * FROM divisions WHERE slug = ?");
$stmt->execute([$slug]);
$divisi = $stmt->fetch();

if (!$divisi) {
    $pageTitle = 'Divisi Tidak Ditemukan';
    $activeMenu = 'informasi';
    require_once __DIR__ . '/partials/header.php';
    echo '<div class="container my-5"><div class="alert alert-warning">Divisi tidak ditemukan.</div>
          <a href="informasi.php" class="btn btn-primary">Kembali</a></div>';
    require_once __DIR__ . '/partials/footer.php';
    exit;
}

$pageTitle = 'Divisi ' . $divisi['nama'];
$activeMenu = 'informasi';
require_once __DIR__ . '/partials/header.php';

$ketua = $pdo->prepare("SELECT * FROM members WHERE divisi_id = ? AND role IN ('kadiv','wakadiv') AND tampil_struktur=1 ORDER BY FIELD(role,'kadiv','wakadiv')");
$ketua->execute([$divisi['id']]);
$pengurusDivisi = $ketua->fetchAll();
?>
<div class="container my-5">
  <div class="d-flex align-items-center gap-3 mb-4">
    <img src="<?= $divisi['logo'] ? 'uploads/divisi/'.e($divisi['logo']) : 'https://via.placeholder.com/100?text='.e(substr($divisi['nama'],0,1)) ?>" style="width:100px;height:100px;object-fit:contain;" alt="">
    <h2 class="section-title mb-0">Divisi <?= e($divisi['nama']) ?></h2>
  </div>
  <p class="lead" style="white-space:pre-line;"><?= nl2br(e($divisi['deskripsi'] ?? 'Belum ada deskripsi.')) ?></p>

  <?php if ($pengurusDivisi): ?>
  <h4 class="mt-4">Pengurus Divisi</h4>
  <div class="row g-3">
    <?php foreach ($pengurusDivisi as $p): ?>
    <div class="col-md-3 col-6">
      <div class="struktur-card">
        <img src="<?= $p['foto'] ? 'uploads/anggota/'.e($p['foto']) : 'https://via.placeholder.com/110?text=Foto' ?>" alt="">
        <h6 class="mb-0"><?= e($p['nama']) ?></h6>
        <div class="jabatan"><?= e($p['jabatan_text'] ?: label_role($p['role'])) ?></div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>

  <a href="informasi.php" class="btn btn-outline-primary mt-4"><i class="bi bi-arrow-left"></i> Kembali ke Informasi</a>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
