<?php
$pageTitle = 'Acara';
$activeMenu = 'acara';
require_once __DIR__ . '/partials/header.php';

$acaraList = $pdo->query("SELECT * FROM acara ORDER BY created_at DESC, id DESC")->fetchAll();
$stmtFoto = $pdo->prepare("SELECT * FROM acara_foto WHERE acara_id = ? ORDER BY urutan ASC, id ASC");
?>
<div class="container my-5" style="max-width:650px;">
  <h2 class="section-title">Acara UPUCC</h2>

  <?php if (!$acaraList): ?>
    <p class="text-muted">Belum ada postingan acara.</p>
  <?php endif; ?>

  <?php foreach ($acaraList as $a):
      $stmtFoto->execute([$a['id']]);
      $fotos = $stmtFoto->fetchAll();
      $carId = 'car' . $a['id'];
  ?>
  <div class="acara-card">
    <div class="acara-header">
      <div class="icon"><i class="bi bi-cpu"></i></div>
      <div>
        <div class="fw-bold">UPUCC</div>
        <div class="small text-muted"><?= tgl_indo(date('Y-m-d', strtotime($a['created_at']))) ?></div>
      </div>
    </div>

    <?php if ($fotos): ?>
    <div id="<?= $carId ?>" class="carousel slide" data-bs-ride="false">
      <div class="carousel-inner">
        <?php foreach ($fotos as $i => $f): ?>
        <div class="carousel-item <?= $i===0?'active':'' ?>">
          <img src="uploads/acara/<?= e($f['foto']) ?>" alt="">
        </div>
        <?php endforeach; ?>
      </div>
      <?php if (count($fotos) > 1): ?>
      <button class="carousel-control-prev" type="button" data-bs-target="#<?= $carId ?>" data-bs-slide="prev">
        <span class="carousel-control-prev-icon"></span>
      </button>
      <button class="carousel-control-next" type="button" data-bs-target="#<?= $carId ?>" data-bs-slide="next">
        <span class="carousel-control-next-icon"></span>
      </button>
      <?php endif; ?>
    </div>
    <?php endif; ?>

    <div class="acara-body">
      <h5 class="fw-bold"><?= e($a['judul']) ?></h5>
      <p style="white-space:pre-line;"><?= nl2br(e($a['deskripsi'])) ?></p>
    </div>
  </div>
  <?php endforeach; ?>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
