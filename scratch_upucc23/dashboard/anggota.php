<?php
$pageTitle = 'Anggota / Struktur Organisasi';
$activeMenu = 'anggota';
require_once __DIR__ . '/partials/header.php';

$uploadDir = __DIR__ . '/../uploads/anggota';
$divisions = $pdo->query("SELECT * FROM divisions ORDER BY id ASC")->fetchAll();
$roleOptions = ['ketum'=>'Ketua Umum','waketum'=>'Wakil Ketua Umum','bendahara'=>'Bendahara','sekretaris'=>'Sekretaris','kadiv'=>'Ketua Divisi','wakadiv'=>'Wakil Ketua Divisi','anggota'=>'Anggota'];

// TAMBAH
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'add') {
    try {
        $username = trim($_POST['username']);
        $password = $_POST['password'];
        if ($username === '' || $password === '') throw new Exception('Username dan password wajib diisi.');

        $cek = $pdo->prepare("SELECT id FROM members WHERE username=?");
        $cek->execute([$username]);
        if ($cek->fetch()) throw new Exception('Username sudah digunakan.');

        $foto = upload_gambar('foto', $uploadDir, 'anggota');
        $divisiId = $_POST['divisi_id'] !== '' ? (int)$_POST['divisi_id'] : null;

        $stmt = $pdo->prepare("INSERT INTO members (username, password, nama, foto, role, divisi_id, jabatan_text, tampil_struktur, urutan) VALUES (?,?,?,?,?,?,?,?,?)");
        $stmt->execute([
            $username,
            password_hash($password, PASSWORD_DEFAULT),
            trim($_POST['nama']),
            $foto,
            $_POST['role'],
            $divisiId,
            trim($_POST['jabatan_text']),
            isset($_POST['tampil_struktur']) ? 1 : 0,
            (int)$_POST['urutan'],
        ]);
        set_flash('success', 'Anggota berhasil ditambahkan.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('anggota.php');
}

// EDIT
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($_POST['action'] ?? '') === 'edit') {
    try {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("SELECT * FROM members WHERE id=?");
        $stmt->execute([$id]);
        $old = $stmt->fetch();
        if (!$old) throw new Exception('Anggota tidak ditemukan.');

        $foto = upload_gambar('foto', $uploadDir, 'anggota');
        if ($foto) { hapus_gambar($uploadDir, $old['foto']); } else { $foto = $old['foto']; }
        $divisiId = $_POST['divisi_id'] !== '' ? (int)$_POST['divisi_id'] : null;

        if (!empty($_POST['password'])) {
            $stmt = $pdo->prepare("UPDATE members SET nama=?, foto=?, role=?, divisi_id=?, jabatan_text=?, tampil_struktur=?, urutan=?, status=?, password=? WHERE id=?");
            $stmt->execute([
                trim($_POST['nama']), $foto, $_POST['role'], $divisiId, trim($_POST['jabatan_text']),
                isset($_POST['tampil_struktur']) ? 1 : 0, (int)$_POST['urutan'], $_POST['status'],
                password_hash($_POST['password'], PASSWORD_DEFAULT), $id
            ]);
        } else {
            $stmt = $pdo->prepare("UPDATE members SET nama=?, foto=?, role=?, divisi_id=?, jabatan_text=?, tampil_struktur=?, urutan=?, status=? WHERE id=?");
            $stmt->execute([
                trim($_POST['nama']), $foto, $_POST['role'], $divisiId, trim($_POST['jabatan_text']),
                isset($_POST['tampil_struktur']) ? 1 : 0, (int)$_POST['urutan'], $_POST['status'], $id
            ]);
        }
        set_flash('success', 'Data anggota berhasil diperbarui.');
    } catch (Exception $e) {
        set_flash('danger', $e->getMessage());
    }
    redirect('anggota.php');
}

// HAPUS
if (isset($_GET['hapus'])) {
    $id = (int)$_GET['hapus'];
    $stmt = $pdo->prepare("SELECT * FROM members WHERE id=?");
    $stmt->execute([$id]);
    $old = $stmt->fetch();
    if ($old) {
        hapus_gambar($uploadDir, $old['foto']);
        $pdo->prepare("DELETE FROM members WHERE id=?")->execute([$id]);
        set_flash('success', 'Anggota berhasil dihapus.');
    }
    redirect('anggota.php');
}

$list = $pdo->query("SELECT m.*, d.nama AS divisi_nama FROM members m LEFT JOIN divisions d ON d.id=m.divisi_id ORDER BY m.urutan ASC, m.id ASC")->fetchAll();
?>
<p class="text-muted">Halaman ini adalah <b>satu-satunya tempat</b> untuk mendaftarkan/membuat akun anggota baru. Data di sini digunakan untuk menampilkan <b>Struktur Organisasi</b> di halaman publik, sekaligus menjadi <b>akun login Portal Anggota</b> (absensi &amp; kas) -- namun akun hanya bisa dibuat/diubah/dihapus <b>di sini</b>, tidak lagi bisa lewat Portal (termasuk oleh Ketua Umum/Wakil Ketua Umum). Username/password di sini terpisah dari akun login Dashboard CMS itu sendiri.</p>

<div class="card border-0 shadow-sm p-4 mb-4">
  <h5>Tambah Anggota Baru</h5>
  <form method="POST" enctype="multipart/form-data" class="row g-3">
    <input type="hidden" name="action" value="add">
    <div class="col-md-3"><label class="form-label">Nama Lengkap *</label><input type="text" name="nama" class="form-control" required></div>
    <div class="col-md-3"><label class="form-label">Username *</label><input type="text" name="username" class="form-control" required></div>
    <div class="col-md-3"><label class="form-label">Password *</label><input type="password" name="password" class="form-control" required></div>
    <div class="col-md-3"><label class="form-label">Foto</label><input type="file" name="foto" class="form-control" accept="image/*"></div>

    <div class="col-md-3">
      <label class="form-label">Role / Jabatan Akses *</label>
      <select name="role" class="form-select" required>
        <?php foreach ($roleOptions as $val => $label): ?><option value="<?= $val ?>"><?= $label ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="col-md-3">
      <label class="form-label">Divisi (jika Kadiv/Wakadiv/Anggota)</label>
      <select name="divisi_id" class="form-select">
        <option value="">-- Tidak ada / Pengurus Inti --</option>
        <?php foreach ($divisions as $d): ?><option value="<?= $d['id'] ?>"><?= e($d['nama']) ?></option><?php endforeach; ?>
      </select>
    </div>
    <div class="col-md-3"><label class="form-label">Jabatan Tampil (teks)</label><input type="text" name="jabatan_text" class="form-control" placeholder="Ketua Divisi Programming"></div>
    <div class="col-md-3"><label class="form-label">Urutan Tampil</label><input type="number" name="urutan" class="form-control" value="0"></div>

    <div class="col-md-4">
      <div class="form-check mt-4">
        <input type="checkbox" name="tampil_struktur" class="form-check-input" id="tampiladd" checked>
        <label class="form-check-label" for="tampiladd">Tampilkan di halaman Struktur Organisasi</label>
      </div>
    </div>
    <div class="col-12"><button class="btn btn-primary"><i class="bi bi-plus"></i> Tambah Anggota</button></div>
  </form>
</div>

<div class="table-responsive">
<table class="table table-bordered bg-white align-middle">
<thead class="table-light"><tr><th>Foto</th><th>Nama</th><th>Username</th><th>Role</th><th>Divisi</th><th>Jabatan</th><th>Status</th><th>Aksi</th></tr></thead>
<tbody>
<?php foreach ($list as $m): ?>
<tr>
  <td><img src="<?= $m['foto'] ? '../uploads/anggota/'.e($m['foto']) : 'https://via.placeholder.com/50' ?>" style="width:50px;height:50px;object-fit:cover;border-radius:50%;"></td>
  <td><?= e($m['nama']) ?></td>
  <td><?= e($m['username']) ?></td>
  <td><span class="badge bg-secondary"><?= $roleOptions[$m['role']] ?? $m['role'] ?></span></td>
  <td><?= e($m['divisi_nama'] ?? '-') ?></td>
  <td><?= e($m['jabatan_text']) ?></td>
  <td><?= $m['status']==='aktif' ? '<span class="badge bg-success">Aktif</span>' : '<span class="badge bg-danger">Nonaktif</span>' ?></td>
  <td>
    <button class="btn btn-sm btn-outline-primary" data-bs-toggle="modal" data-bs-target="#edit<?= $m['id'] ?>"><i class="bi bi-pencil"></i></button>
    <a href="?hapus=<?= $m['id'] ?>" class="btn btn-sm btn-outline-danger" onclick="return confirm('Hapus anggota ini? Data absensi terkait juga akan terhapus.')"><i class="bi bi-trash"></i></a>
  </td>
</tr>

<div class="modal fade" id="edit<?= $m['id'] ?>">
  <div class="modal-dialog">
    <div class="modal-content">
      <form method="POST" enctype="multipart/form-data">
        <input type="hidden" name="action" value="edit">
        <input type="hidden" name="id" value="<?= $m['id'] ?>">
        <div class="modal-header"><h5 class="modal-title">Edit Anggota</h5><button class="btn-close" data-bs-dismiss="modal"></button></div>
        <div class="modal-body">
          <div class="mb-2"><label class="form-label">Nama</label><input type="text" name="nama" class="form-control" value="<?= e($m['nama']) ?>" required></div>
          <div class="mb-2"><label class="form-label">Password Baru (kosongkan jika tidak diubah)</label><input type="password" name="password" class="form-control"></div>
          <div class="mb-2"><label class="form-label">Foto (kosongkan jika tidak ganti)</label><input type="file" name="foto" class="form-control" accept="image/*"></div>
          <div class="mb-2"><label class="form-label">Role</label>
            <select name="role" class="form-select">
              <?php foreach ($roleOptions as $val => $label): ?><option value="<?= $val ?>" <?= $m['role']===$val?'selected':'' ?>><?= $label ?></option><?php endforeach; ?>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Divisi</label>
            <select name="divisi_id" class="form-select">
              <option value="">-- Tidak ada / Pengurus Inti --</option>
              <?php foreach ($divisions as $d): ?><option value="<?= $d['id'] ?>" <?= $m['divisi_id']==$d['id']?'selected':'' ?>><?= e($d['nama']) ?></option><?php endforeach; ?>
            </select>
          </div>
          <div class="mb-2"><label class="form-label">Jabatan Tampil</label><input type="text" name="jabatan_text" class="form-control" value="<?= e($m['jabatan_text']) ?>"></div>
          <div class="mb-2"><label class="form-label">Urutan</label><input type="number" name="urutan" class="form-control" value="<?= $m['urutan'] ?>"></div>
          <div class="mb-2"><label class="form-label">Status Akun</label>
            <select name="status" class="form-select">
              <option value="aktif" <?= $m['status']==='aktif'?'selected':'' ?>>Aktif</option>
              <option value="nonaktif" <?= $m['status']==='nonaktif'?'selected':'' ?>>Nonaktif</option>
            </select>
          </div>
          <div class="form-check">
            <input type="checkbox" name="tampil_struktur" class="form-check-input" id="tampil<?= $m['id'] ?>" <?= $m['tampil_struktur']?'checked':'' ?>>
            <label class="form-check-label" for="tampil<?= $m['id'] ?>">Tampilkan di Struktur Organisasi</label>
          </div>
        </div>
        <div class="modal-footer"><button class="btn btn-primary">Simpan</button></div>
      </form>
    </div>
  </div>
</div>
<?php endforeach; ?>
</tbody>
</table>
</div>
<?php require_once __DIR__ . '/partials/footer.php'; ?>
