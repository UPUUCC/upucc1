<?php
require_once __DIR__ . '/../includes/auth_dashboard.php';
unset($_SESSION['admin_id'], $_SESSION['admin_nama']);
session_destroy();
header('Location: login.php');
exit;
