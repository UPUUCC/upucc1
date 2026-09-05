<?php
$pageTitle = 'Sejarah';
$activeMenu = 'sejarah';
require_once __DIR__ . '/partials/header.php';

$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'save_umum') {
    $konten = trim($_POST['konten']);
    $exist = $pdo->query("SELECT id FROM sejarah WHERE divisi_id IS NULL ORDER BY id ASC LIMIT 1")->fetch();
    if ($exist) {
        $pdo->prepare("UPDATE sejarah SET konten=? WHERE id=?")->execute([$konten, $exist['id']]);
    } else {
        $pdo->prepare("INSERT INTO sejarah (divisi_id, judul, konten) VALUES (NULL, 'Sejarah UPUCC', ?)")->execute([$konten]);
    }
    set_flash('success', 'Sejarah umum berhasil diperbarui.');
    redirect('sejarah.php');
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'save_divisi') {
    $divisiId = (int)$_POST['divisi_id'];
    $konten = trim($_POST['konten']);
    $exist = $pdo->prepare("SELECT id FROM sejarah WHERE divisi_id=?");
    $exist->execute([$divisiId]);
    $row = $exist->fetch();
    if ($row) {
        $pdo->prepare("UPDATE sejarah SET konten=? WHERE id=?")->execute([$konten, $row['id']]);
    } else {
        $pdo->prepare("INSERT INTO sejarah (divisi_id, konten) VALUES (?, ?)")->execute([$divisiId, $konten]);
    }
    set_flash('success', 'Sejarah divisi berhasil diperbarui.');
    redirect('sejarah.php');
}

$umum = $pdo->query("SELECT * FROM sejarah WHERE divisi_id IS NULL ORDER BY id ASC LIMIT 1")->fetch();
$stmtDiv = $pdo->prepare("SELECT * FROM sejarah WHERE divisi_id=?");
?>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Sejarah Umum UPUCC</h5>
  <form method="POST">
    <input type="hidden" name="action" value="save_umum">
    <textarea name="konten" class="form-control mb-3" rows="6"><?= e($umum['konten'] ?? '') ?></textarea>
    <button class="btn btn-primary"><i class="bi bi-save"></i> Simpan</button>
  </form>
</div>

<?php foreach ($divisions as $d): $stmtDiv->execute([$d['id']]); $s = $stmtDiv->fetch(); ?>
<div class="card border-0 shadow-sm p-4 mb-3">
  <h5>Sejarah Divisi <?= e($d['nama']) ?></h5>
  <form method="POST">
    <input type="hidden" name="action" value="save_divisi">
    <input type="hidden" name="divisi_id" value="<?= $d['id'] ?>">
    <textarea name="konten" class="form-control mb-3" rows="4"><?= e($s['konten'] ?? '') ?></textarea>
    <button class="btn btn-primary btn-sm"><i class="bi bi-save"></i> Simpan</button>
  </form>
</div>
<?php endforeach; ?>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
