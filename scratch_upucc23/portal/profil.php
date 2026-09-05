<?php
$pageTitle = 'Profil Saya';
$activeMenu = 'profil';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/anggota';
$stmt = $pdo->prepare("SELECT * FROM members WHERE id=?");
$stmt->execute([$_SESSION['member_id']]);
$me = $stmt->fetch();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        $foto = upload_gambar('foto', $uploadDir, 'anggota');
        if ($foto) { hapus_gambar($uploadDir, $me['foto']); } else { $foto = $me['foto']; }

        if (!empty($_POST['password'])) {
            $pdo->prepare("UPDATE members SET nama=?, foto=?, password=? WHERE id=?")
                ->execute([trim($_POST['nama']), $foto, password_hash($_POST['password'], PASSWORD_DEFAULT), $me['id']]);
        } else {
            $pdo->prepare("UPDATE members SET nama=?, foto=? WHERE id=?")
                ->execute([trim($_POST['nama']), $foto, $me['id']]);
        }
        $_SESSION['member_nama'] = trim($_POST['nama']);
        set_flash('success', 'Profil berhasil diperbarui.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('profil.php');
}
?>
<div class="card border-0 shadow-sm p-4" style="max-width:500px;">
  <div class="text-center mb-3">
    <img src="<?= $me['foto'] ? '../uploads/anggota/'.e($me['foto']) : 'https://via.placeholder.com/120?text=Foto' ?>" style="width:120px;height:120px;object-fit:cover;border-radius:50%;">
  </div>
  <form method="POST" enctype="multipart/form-data">
    <div class="mb-3"><label class="form-label">Nama</label><input type="text" name="nama" class="form-control" value="<?= e($me['nama']) ?>" required></div>
    <div class="mb-3"><label class="form-label">Username</label><input type="text" class="form-control" value="<?= e($me['username']) ?>" disabled></div>
    <div class="mb-3"><label class="form-label">Foto Baru</label><input type="file" name="foto" class="form-control" accept="image/*"></div>
    <div class="mb-3"><label class="form-label">Password Baru (kosongkan jika tidak diubah)</label><input type="password" name="password" class="form-control"></div>
    <button class="btn btn-primary"><i class="bi bi-save"></i> Simpan</button>
  </form>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
