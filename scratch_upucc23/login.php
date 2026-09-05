<?php
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/includes/functions.php';
require_once __DIR__ . '/includes/auth_portal.php';
$pdo = getDB();

if (portal_is_logged_in()) {
    redirect('portal/dashboard.php');
}

/**
 * ======================================================================
 * PROSES LOGIN -- LOGIKA TIDAK DIUBAH SAMA SEKALI.
 * Menu pilihan role di bawah HANYA tampilan/navigasi (mempermudah anggota
 * menemukan form login sesuai jabatannya), field & pengecekan
 * username/password ke tabel members tetap persis seperti sebelumnya.
 * ======================================================================
 */
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM members WHERE username = ? AND status = 'aktif'");
    $stmt->execute([$username]);
    $member = $stmt->fetch();

    if ($member && password_verify($password, $member['password'])) {
        session_regenerate_id(true);
        $_SESSION['member_id'] = $member['id'];
        $_SESSION['member_nama'] = $member['nama'];
        $_SESSION['member_role'] = $member['role'];
        $_SESSION['member_divisi_id'] = $member['divisi_id'];
        redirect('portal/dashboard.php');
    } else {
        $error = 'Username atau password salah.';
    }
}

$divisions = $pdo->query("SELECT id, nama, slug FROM divisions ORDER BY id ASC")->fetchAll();

$pageTitle = 'Login Anggota';
$activeMenu = 'login';
require_once __DIR__ . '/partials/header.php';
?>
<style>
.login-menu-card{border:none;box-shadow:0 2px 10px rgba(0,0,0,.08);border-radius:14px;padding:26px 20px;text-align:center;cursor:pointer;height:100%;transition:.2s;background:#fff;}
.login-menu-card:hover{transform:translateY(-4px);box-shadow:0 8px 20px rgba(0,0,0,.15);}
.login-menu-card i{font-size:2rem;color:var(--upucc-secondary);margin-bottom:10px;display:block;}
.login-menu-card .lbl{font-weight:600;color:var(--upucc-primary);}
.login-menu-card .sub{font-size:.8rem;color:#777;}
.login-step{display:none;}
.login-step.active{display:block;}
.login-back{cursor:pointer;color:var(--upucc-secondary);font-weight:500;}
.login-back:hover{text-decoration:underline;}
</style>

<div class="container my-5" style="max-width:700px;">

  <!-- STEP 0: PILIHAN LOGIN -->
  <div id="loginStep0" class="login-step active">
    <h3 class="text-center mb-1"><i class="bi bi-person-badge"></i> Login Anggota</h3>
    <p class="text-center text-muted small mb-4">
      Silakan pilih jenis akun Anda untuk masuk ke Absensi Online &amp; Kas Organisasi.<br>
      Login ini terpisah dari Dashboard CMS.
    </p>

    <div class="row g-3">
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('formKetum')">
          <i class="bi bi-award"></i>
          <div class="lbl">Ketum / Waketum</div>
          <div class="sub">Ketua &amp; Wakil Ketua Umum</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('formBendahara')">
          <i class="bi bi-cash-coin"></i>
          <div class="lbl">Bendahara</div>
          <div class="sub">Pejabat Umum</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('formSekretaris')">
          <i class="bi bi-journal-text"></i>
          <div class="lbl">Sekretaris</div>
          <div class="sub">Pejabat Umum</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('stepDivisiKadiv')">
          <i class="bi bi-diagram-3"></i>
          <div class="lbl">Kadiv / Wakadiv</div>
          <div class="sub">Pilih divisi Anda</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('stepDivisiAnggota')">
          <i class="bi bi-people"></i>
          <div class="lbl">Anggota Divisi</div>
          <div class="sub">Termasuk Multimedia, dll.</div>
        </div>
      </div>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('stepDaftar')">
          <i class="bi bi-person-plus"></i>
          <div class="lbl">Pendaftaran</div>
          <div class="sub">Belum punya akun?</div>
        </div>
      </div>
    </div>
  </div>

  <!-- STEP: PILIH DIVISI UNTUK KADIV/WAKADIV -->
  <div id="stepDivisiKadiv" class="login-step">
    <span class="login-back" onclick="showStep('loginStep0')"><i class="bi bi-arrow-left"></i> Kembali ke pilihan login</span>
    <h5 class="mt-3 mb-3 text-center">Pilih Divisi -- Kadiv / Wakadiv</h5>
    <div class="row g-3 justify-content-center">
      <?php foreach ($divisions as $d): ?>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('form_kadiv_<?= (int)$d['id'] ?>')">
          <i class="bi bi-diagram-3"></i>
          <div class="lbl">Kadiv / Wakadiv</div>
          <div class="sub"><?= e($d['nama']) ?></div>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- STEP: PILIH DIVISI UNTUK ANGGOTA -->
  <div id="stepDivisiAnggota" class="login-step">
    <span class="login-back" onclick="showStep('loginStep0')"><i class="bi bi-arrow-left"></i> Kembali ke pilihan login</span>
    <h5 class="mt-3 mb-3 text-center">Pilih Divisi -- Anggota</h5>
    <div class="row g-3 justify-content-center">
      <?php foreach ($divisions as $d): ?>
      <div class="col-6 col-md-4">
        <div class="login-menu-card" onclick="showStep('form_anggota_<?= (int)$d['id'] ?>')">
          <i class="bi bi-person"></i>
          <div class="lbl">Anggota</div>
          <div class="sub">Divisi <?= e($d['nama']) ?></div>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>

  <!-- STEP: PENDAFTARAN (BELUM PUNYA AKUN) -->
  <div id="stepDaftar" class="login-step">
    <span class="login-back" onclick="showStep('loginStep0')"><i class="bi bi-arrow-left"></i> Kembali ke pilihan login</span>
    <div class="card border-0 shadow-sm p-4 mt-3 text-center">
      <i class="bi bi-person-plus" style="font-size:2.5rem;color:var(--upucc-secondary);"></i>
      <h4 class="mt-3">Silahkan Buat Akun Terlebih Dahulu</h4>
      <p class="text-muted mb-0">
        Pendaftaran anggota baru saat ini tidak lagi dilakukan secara mandiri lewat website.
        Silakan hubungi <b>Ketua Umum</b>, <b>Wakil Ketua Umum</b>, atau <b>Sekretaris</b> UPUCC
        untuk dibuatkan akun keanggotaan Anda terlebih dahulu. Setelah akun dibuatkan, Anda bisa
        login lewat pilihan sesuai jabatan/divisi Anda di halaman ini.
      </p>
    </div>
  </div>

  <?php
  // Definisikan seluruh "pilihan login" (role tetap + role per divisi).
  // Ini murni untuk keperluan tampilan judul form; validasi username/password
  // TETAP memakai proses POST di atas yang sama sekali tidak diubah.
  $roleForms = [
      ['id' => 'formKetum',      'title' => 'Login Ketua Umum / Wakil Ketua Umum', 'icon' => 'bi-award'],
      ['id' => 'formBendahara',  'title' => 'Login Bendahara',                     'icon' => 'bi-cash-coin'],
      ['id' => 'formSekretaris', 'title' => 'Login Sekretaris',                    'icon' => 'bi-journal-text'],
  ];
  foreach ($divisions as $d) {
      $roleForms[] = ['id' => 'form_kadiv_' . (int)$d['id'], 'title' => 'Login Ketua/Wakil Ketua Divisi ' . $d['nama'], 'icon' => 'bi-diagram-3'];
  }
  foreach ($divisions as $d) {
      $roleForms[] = ['id' => 'form_anggota_' . (int)$d['id'], 'title' => 'Login Anggota Divisi ' . $d['nama'], 'icon' => 'bi-person'];
  }
  ?>

  <?php foreach ($roleForms as $rf): ?>
  <div id="<?= $rf['id'] ?>" class="login-step">
    <span class="login-back" onclick="showStep('loginStep0')"><i class="bi bi-arrow-left"></i> Kembali ke pilihan login</span>
    <div class="card shadow-sm border-0 p-4 mt-3">
      <h5 class="text-center mb-3"><i class="bi <?= $rf['icon'] ?>"></i> <?= e($rf['title']) ?></h5>

      <?php if ($error): ?><div class="alert alert-danger"><?= e($error) ?></div><?php endif; ?>

      <form method="POST">
        <div class="mb-3">
          <label class="form-label">Username</label>
          <input type="text" name="username" class="form-control" required>
        </div>
        <div class="mb-3">
          <label class="form-label">Password</label>
          <input type="password" name="password" class="form-control" required>
        </div>
        <button type="submit" class="btn btn-primary w-100">Login</button>
      </form>
    </div>
  </div>
  <?php endforeach; ?>

  <p class="text-center small text-muted mt-3">
    Pengelola website (CMS)? <a href="dashboard/login.php">Login Dashboard di sini</a>
  </p>
</div>

<script>
function showStep(id) {
  document.querySelectorAll('.login-step').forEach(function (el) {
    el.classList.remove('active');
  });
  var target = document.getElementById(id);
  if (target) target.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

<?php if ($error): ?>
// Jika login gagal, tetap tampilkan step form terakhir yang dipakai (dari sessionStorage)
document.addEventListener('DOMContentLoaded', function () {
  var last = sessionStorage.getItem('upucc_login_step');
  if (last) showStep(last);
});
<?php endif; ?>

// Simpan step form terakhir dipilih supaya tetap terbuka jika terjadi error validasi
document.querySelectorAll('.login-step form').forEach(function (form) {
  form.addEventListener('submit', function () {
    var step = form.closest('.login-step');
    if (step) sessionStorage.setItem('upucc_login_step', step.id);
  });
});

<?php if (isset($_GET['daftar'])): ?>
document.addEventListener('DOMContentLoaded', function () { showStep('stepDaftar'); });
<?php endif; ?>
</script>

<?php require_once __DIR__ . '/partials/footer.php'; ?>
