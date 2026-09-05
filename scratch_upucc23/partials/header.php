<?php
require_once __DIR__ . '/../database.php';
require_once __DIR__ . '/../includes/functions.php';
$pdo = getDB();
$activeMenu = $activeMenu ?? '';
?>
<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title><?= isset($pageTitle) ? e($pageTitle) . ' - UPUCC' : 'UPUCC - Universitas Potensi Utama Computer Club' ?></title>
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet">
<link href="css/style.css" rel="stylesheet">
</head>
<body>

<nav class="navbar navbar-expand-lg navbar-dark sticky-top upucc-navbar">
  <div class="container">
    <a class="navbar-brand fw-bold" href="index.php">
      <i class="bi bi-cpu"></i> UPUCC
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#mainNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="mainNav">
      <ul class="navbar-nav ms-auto">
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='home'?'active':'' ?>" href="index.php">Beranda</a></li>
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle <?= $activeMenu==='informasi'?'active':'' ?>" href="#" data-bs-toggle="dropdown">Informasi</a>
          <ul class="dropdown-menu">
            <li><a class="dropdown-item" href="informasi.php">Informasi UPUCC</a></li>
            <li><hr class="dropdown-divider"></li>
            <?php
            $divs = $pdo->query("SELECT id, nama, slug FROM divisions ORDER BY id")->fetchAll();
            foreach ($divs as $d):
            ?>
            <li><a class="dropdown-item" href="informasi_divisi.php?slug=<?= e($d['slug']) ?>">Divisi <?= e($d['nama']) ?></a></li>
            <?php endforeach; ?>
          </ul>
        </li>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='prestasi'?'active':'' ?>" href="prestasi.php">Prestasi</a></li>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='struktur'?'active':'' ?>" href="struktur.php">Struktur Organisasi</a></li>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='sejarah'?'active':'' ?>" href="sejarah.php">Sejarah</a></li>
        <li class="nav-item"><a class="nav-link <?= $activeMenu==='acara'?'active':'' ?>" href="acara.php">Acara</a></li>
        <li class="nav-item"><a class="nav-link btn btn-sm btn-outline-light ms-lg-2 px-3 <?= $activeMenu==='login'?'active':'' ?>" href="login.php"><i class="bi bi-box-arrow-in-right"></i> Login</a></li>
      </ul>
    </div>
  </div>
</nav>
