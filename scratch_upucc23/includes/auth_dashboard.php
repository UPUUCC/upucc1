<?php
/**
 * Auth khusus DASHBOARD (CMS pengelola konten index).
 * Session key: admin_id / admin_nama  -- terpisah total dari portal.
 */
if (session_status() === PHP_SESSION_NONE) session_start();

function admin_login_required() {
    if (empty($_SESSION['admin_id'])) {
        redirect(BASE_URL . '/dashboard/login.php');
    }
}

function admin_is_logged_in() {
    return !empty($_SESSION['admin_id']);
}
