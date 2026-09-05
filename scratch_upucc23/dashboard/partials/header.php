<?php
require_once __DIR__ . '/../../database.php';
require_once __DIR__ . '/../../includes/functions.php';
require_once __DIR__ . '/../../includes/auth_dashboard.php';
admin_login_required();
$pdo = getDB();
$activeMenu = $activeMenu ?? '';
$menus = [
  'index'       => ['Dashboard', 'bi-speedometer2'],
  'slider'      => ['Slider Beranda', 'bi-images'],
  'informasi'   => ['Informasi Umum', 'bi-info-circle'],
  'divisi'      => ['Data Divisi', 'bi-diagram-3'],
  'prestasi'    => ['Prestasi', 'bi-trophy'],
  'anggota'     => ['Anggota / Struktur', 'bi-people'],
  'sejarah'     => ['Sejarah', 'bi-clock-history'],
  'acara'       => ['Acara', 'bi-calendar-event'],
];
// Menu "Pendaftaran Anggota" sudah dihapus dari sidebar CMS -- pendaftaran
// anggota baru secara publik sudah ditiadakan. Akun anggota kini dibuatkan
// langsung oleh pengurus (Ketum/Waketum/Sekretaris) lewat menu Kelola
// Anggota di Portal, bukan lewat form pendaftaran publik.
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= isset($pageTitle) ? e($pageTitle) . ' - Dashboard UPUCC' : 'Dashboard UPUCC' ?></title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<style>
body{background:#f1f4f8;}
.sb{min-height:100vh;background:#0d2b4e;width:250px;position:fixed;top:0;left:0;}
.sb a{color:#cfe0f5;display:block;padding:12px 20px;text-decoration:none;border-left:4px solid transparent;}
.sb a:hover,.sb a.active{background:#1e6fd9;color:#fff;border-left-color:#f2a900;}
.sb .brand{color:#fff;font-weight:700;padding:20px;border-bottom:1px solid rgba(255,255,255,.1);}
.main{margin-left:250px;padding:25px;}
@media(max-width:768px){.sb{width:100%;position:static;min-height:auto;}.main{margin-left:0;}}
</style>
</head>
<body>
<div class="sb">
  <div class="brand"><i class="bi bi-cpu"></i> UPUCC CMS</div>
  <?php foreach ($menus as $key => $m): ?>
    <a href="<?= $key ?>.php" class="<?= $activeMenu===$key?'active':'' ?>"><i class="bi <?= $m[1] ?>"></i> <?= $m[0] ?></a>
  <?php endforeach; ?>
  <a href="logout.php" class="text-danger mt-3"><i class="bi bi-box-arrow-left"></i> Logout</a>
</div>
<div class="main">
  <div class="d-flex justify-content-between align-items-center mb-4">
    <h4 class="mb-0"><?= isset($pageTitle) ? e($pageTitle) : 'Dashboard' ?></h4>
    <span class="text-muted">Halo, <b><?= e($_SESSION['admin_nama'] ?? '') ?></b></span>
  </div>
  <?php render_flash(); ?>
