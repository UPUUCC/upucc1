import Swal from 'sweetalert2';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

// Peta menu yang diperbolehkan untuk setiap role
const ROLE_PERMISSIONS = {
    'admin': ['*'], // Akses ke semua menu
    'bendahara': ['/dashboard/index.html', '/dashboard/keuangan.html', '/dashboard/logout.html'],
    'sekretaris': ['/dashboard/index.html', '/dashboard/pendaftaran.html', '/dashboard/anggota.html', '/dashboard/logout.html'],
    'kadiv': ['/dashboard/index.html', '/dashboard/anggota.html', '/dashboard/acara.html', '/dashboard/logout.html']
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const q = query(collection(db, "users"), where("email", "==", user.email), limit(1));
            const snap = await getDocs(q);

            if (snap.empty) {
                // Bukan admin/pengurus, kembalikan ke profil
                window.location.href = '/member/profil.html';
                return;
            }

            const userData = snap.docs[0].data();
            // Default role is admin jika field role tidak ada (untuk kompatibilitas)
            const role = (userData.role || 'admin').toLowerCase(); 
            const currentPath = window.location.pathname;

            // 1. Cek apakah role diizinkan membuka halaman ini
            const allowedPaths = ROLE_PERMISSIONS[role] || [];
            const isAllowed = allowedPaths.includes('*') || allowedPaths.some(path => currentPath.includes(path)) || currentPath === '/dashboard/' || currentPath === '/dashboard';

            if (!isAllowed) {
                Swal.fire({
                    icon: 'error',
                    title: 'Akses Ditolak',
                    text: 'Anda tidak memiliki hak akses ke halaman ini.'
                }).then(() => {
                    window.location.href = '/dashboard/index.html';
                });
                return;
            }

            // 2. Sembunyikan menu di sidebar yang tidak diperbolehkan
            if (!allowedPaths.includes('*')) {
                const navItems = document.querySelectorAll('.sidebar .nav-link');
                navItems.forEach(nav => {
                    const href = nav.getAttribute('href');
                    if (href === '/' || href === '/dashboard/logout.html') return; // selalu tampilkan Lihat Website & Logout
                    
                    const canAccess = allowedPaths.some(path => href.includes(path));
                    if (!canAccess) {
                        // Sembunyikan element parent (li.nav-item)
                        nav.closest('.nav-item').style.display = 'none';
                    }
                });
            }

            // 3. UI Kustom di Dashboard Utama
            if (currentPath.includes('/dashboard/index.html') || currentPath === '/dashboard/' || currentPath === '/dashboard') {
                const adminName = document.getElementById('adminName');
                if (adminName) {
                    const namaTampil = userData.nama || userData.nama_lengkap || user.email.split('@')[0];
                    // Uppercase huruf pertama role
                    const roleTitle = role.charAt(0).toUpperCase() + role.slice(1);
                    adminName.textContent = `${namaTampil} (${roleTitle})`;
                }

                // Sembunyikan kontrol Maintenance untuk selain admin
                if (role !== 'admin') {
                    const maintenanceCard = document.getElementById('maintenanceCard');
                    if (maintenanceCard) {
                        maintenanceCard.style.display = 'none';
                    }
                }
            }

        } catch (error) {
            console.error("Gagal memuat role:", error);
        }
    });
});
