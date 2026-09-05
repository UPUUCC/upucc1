<?php
require_once __DIR__ . '/../includes/auth_portal.php';
unset($_SESSION['member_id'], $_SESSION['member_nama'], $_SESSION['member_role'], $_SESSION['member_divisi_id']);
session_destroy();
header('Location: ../login.php');
exit;
