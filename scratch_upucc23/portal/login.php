<?php
// Form login portal sesungguhnya berada di login.php (halaman publik,
// di root project) agar sesuai dengan menu "Login" pada halaman publik.
// File ini hanya redirect supaya link internal (portal_login_required)
// tetap valid.
header('Location: ../login.php');
exit;
