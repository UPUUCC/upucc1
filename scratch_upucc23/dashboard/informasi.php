<?php
$pageTitle = 'Informasi Umum';
$activeMenu = 'informasi';
require_once __DIR__ . '/partials/header.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $konten = trim($_POST['konten'] ?? '');
    $exist = $pdo->query("SELECT id FROM informasi_umum WHERE id=1")->fetch();
    if ($exist) {
        $pdo->prepare("UPDATE informasi_umum SET konten=? WHERE id=1")->execute([$konten]);
    } else {
        $pdo->prepare("INSERT INTO informasi_umum (id, konten) VALUES (1, ?)")->execute([$konten]);
    }
    set_flash('success', 'Informasi umum berhasil diperbarui.');
    redirect('informasi.php');
}

$info = $pdo->query("SELECT * FROM informasi_umum WHERE id=1")->fetch();
?>
<div class="card border-0 shadow-sm p-4">
  <h5>Edit Informasi Umum UPUCC</h5>
  <p class="text-muted small">Konten ini akan tampil di halaman Beranda dan halaman Informasi.</p>
  <form method="POST">
    <div class="mb-3">
      <textarea name="konten" class="form-control" rows="10"><?= e($info['konten'] ?? '') ?></textarea>
    </div>
    <button class="btn btn-primary"><i class="bi bi-save"></i> Simpan</button>
  </form>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
