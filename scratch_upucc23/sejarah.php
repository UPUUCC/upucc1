<?php
$pageTitle = 'Sejarah';
$activeMenu = 'sejarah';
require_once __DIR__ . '/partials/header.php';

$umum = $pdo->query("SELECT * FROM sejarah WHERE divisi_id IS NULL ORDER BY id DESC LIMIT 1")->fetch();
$divSejarah = $pdo->query("SELECT s.*, d.nama AS divisi_nama FROM sejarah s JOIN divisions d ON d.id = s.divisi_id ORDER BY d.id ASC")->fetchAll();
?>
<div class="container my-5">
  <h2 class="section-title">Sejarah UPUCC</h2>
  <p class="lead" style="white-space:pre-line;"><?= nl2br(e($umum['konten'] ?? 'Sejarah UPUCC belum diisi.')) ?></p>

  <?php if ($divSejarah): ?>
  <h3 class="section-title mt-5">Sejarah Masing-Masing Divisi</h3>
  <div class="accordion" id="accSejarah">
    <?php foreach ($divSejarah as $i => $s): ?>
    <div class="accordion-item">
      <h2 class="accordion-header">
        <button class="accordion-button <?= $i>0?'collapsed':'' ?>" type="button" data-bs-toggle="collapse" data-bs-target="#coll<?= $s['id'] ?>">
          Divisi <?= e($s['divisi_nama']) ?>
        </button>
      </h2>
      <div id="coll<?= $s['id'] ?>" class="accordion-collapse collapse <?= $i===0?'show':'' ?>" data-bs-parent="#accSejarah">
        <div class="accordion-body" style="white-space:pre-line;"><?= nl2br(e($s['konten'])) ?></div>
      </div>
    </div>
    <?php endforeach; ?>
  </div>
  <?php endif; ?>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
