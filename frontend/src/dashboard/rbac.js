import Swal from 'sweetalert2';
import { auth, db } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, limit, getDocs } from 'firebase/firestore';

// Peta menu yang diperbolehkan untuk setiap role
const ROLE_PERMISSIONS = {
    'admin': ['*'], // Akses ke semua menu
    'bendahara': ['/dashboard/keuangan.html', '/dashboard/logout.html'],
    'sekretaris': ['/dashboard/pendaftaran.html', '/dashboard/logout.html'],
    'kadiv': ['/dashboard/kadiv_panel.html', '/dashboard/logout.html'],
    'wakadiv': ['/dashboard/kadiv_panel.html', '/dashboard/logout.html']
};

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()), limit(1));
            const snap = await getDocs(q);

            // Jika email tidak ada di members → akun admin langsung (dibuat via Firebase Console)
            // Beri akses penuh sebagai admin
            let role = 'admin';
            let userData = {};

            if (!snap.empty) {
                userData = snap.docs[0].data();
                role = (userData.role || 'admin').toLowerCase();
                
                // Jika role 'anggota', lempar ke member area
                if (role === 'anggota') {
                    window.location.href = '/member/profil.html';
                    return;
                }
            }

            const currentPath = window.location.pathname;

            // 1. Cek apakah role diizinkan membuka halaman ini
            const allowedPaths = ROLE_PERMISSIONS[role] || [];
            const isAllowed = allowedPaths.includes('*') || allowedPaths.some(path => {
                const cleanPath = path.replace('.html', '');
                return currentPath.includes(cleanPath);
            });

            if (!isAllowed) {
                // Jangan tampilkan pesan error jika user hanya mencoba ke index.html (langsung redirect saja)
                const isTryingIndex = currentPath === '/dashboard/index.html' || currentPath === '/dashboard/' || currentPath === '/dashboard';
                
                let fallbackUrl = '/dashboard/index.html';
                if (role === 'kadiv' || role === 'wakadiv') fallbackUrl = '/dashboard/kadiv_panel.html';
                else if (role === 'sekretaris') fallbackUrl = '/dashboard/pendaftaran.html';
                else if (role === 'bendahara') fallbackUrl = '/dashboard/keuangan.html';

                if (isTryingIndex) {
                    window.location.href = fallbackUrl;
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Akses Ditolak',
                        text: 'Anda tidak memiliki hak akses ke halaman ini.'
                    }).then(() => {
                        window.location.href = fallbackUrl;
                    });
                }
                return;
            }

            // 2. Sembunyikan menu di sidebar yang tidak diperbolehkan
            if (!allowedPaths.includes('*')) {
                const navItems = document.querySelectorAll('.sidebar .nav-link');
                navItems.forEach(nav => {
                    const href = nav.getAttribute('href');
                    if (href === '/' || href === '/dashboard/logout.html' || href === '/member/profil.html') return; // selalu tampilkan Lihat Website, Profil, & Logout
                    
                    const canAccess = allowedPaths.some(path => href.includes(path));
                    if (!canAccess) {
                        // Sembunyikan element parent (li.nav-item)
                        nav.closest('.nav-item').style.display = 'none';
                    }
                });
            }

            // Hapus pelindung anti-bocor sidebar
            const rbacHide = document.getElementById('rbac-hide');
            if (rbacHide) rbacHide.remove();

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
