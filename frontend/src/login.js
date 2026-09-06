import { auth, db } from './firebase.js';
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, getDocs, query, orderBy, where, limit } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');
    const formTitle = document.getElementById('formTitle');
    const backFromForm = document.getElementById('backFromForm');
    
    // UI Navigation Logic
    function showStep(targetId) {
        document.querySelectorAll('.login-step').forEach(el => el.classList.remove('active'));
        const target = document.getElementById(targetId);
        if (target) target.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Save current step so it persists if user clicks back or refreshes (optional)
        sessionStorage.setItem('upucc_login_step', targetId);
    }

    // Attach click events to cards and back buttons
    document.body.addEventListener('click', (e) => {
        const trigger = e.target.closest('[data-action]');
        if (!trigger) return;

        const action = trigger.getAttribute('data-action');
        
        if (action === 'step') {
            const targetId = trigger.getAttribute('data-target');
            showStep(targetId);
        } else if (action === 'form') {
            const title = trigger.getAttribute('data-title');
            const icon = trigger.getAttribute('data-icon');
            const backTarget = trigger.getAttribute('data-back') || 'loginStep0';
            
            formTitle.innerHTML = `<i class="bi ${icon}"></i> ${title}`;
            backFromForm.setAttribute('data-target', backTarget);
            showStep('stepForm');
        }
    });

    // Check if ?daftar=1 is in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('daftar')) {
        showStep('stepDaftar');
    } else {
        const lastStep = sessionStorage.getItem('upucc_login_step');
        if (lastStep && document.getElementById(lastStep)) {
            showStep(lastStep);
        }
    }

    // Fetch Divisions for Kadiv & Anggota steps
    try {
        const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
        let kadivHTML = '';
        let anggotaHTML = '';

        divSnap.forEach(docSnap => {
            const d = docSnap.data();
            kadivHTML += `
            <div class="col-6 col-md-4">
              <div class="login-menu-card" data-action="form" data-title="Login Kadiv/Wakadiv ${d.nama}" data-icon="bi-diagram-3" data-back="stepDivisiKadiv">
                <i class="bi bi-diagram-3"></i>
                <div class="lbl">Kadiv / Wakadiv</div>
                <div class="sub">${d.nama}</div>
              </div>
            </div>`;
            
            anggotaHTML += `
            <div class="col-6 col-md-4">
              <div class="login-menu-card" data-action="form" data-title="Login Anggota ${d.nama}" data-icon="bi-person" data-back="stepDivisiAnggota">
                <i class="bi bi-person"></i>
                <div class="lbl">Anggota</div>
                <div class="sub">Divisi ${d.nama}</div>
              </div>
            </div>`;
        });

        document.getElementById('listDivisiKadiv').innerHTML = kadivHTML;
        document.getElementById('listDivisiAnggota').innerHTML = anggotaHTML;

        // Hide loading, show container
        document.getElementById('loginLoading').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'block';

    } catch (err) {
        console.error("Gagal memuat divisi: ", err);
        document.getElementById('loginLoading').innerHTML = '<div class="alert alert-danger">Gagal memuat data menu. Silakan refresh halaman.</div>';
    }


    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            loginAlert.classList.add('d-none');
            btnLogin.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Memproses...';
            btnLogin.disabled = true;

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                
                btnLogin.innerHTML = '<i class="bi bi-check-circle"></i> Berhasil Login';
                btnLogin.classList.replace('btn-primary', 'btn-success');
                
                let targetUrl = "/member/profil.html";
                try {
                    const q = query(collection(db, "members"), where("email", "==", email.toLowerCase().trim()), limit(1));
                    const snap = await getDocs(q);
                    if (!snap.empty) {
                        const role = snap.docs[0].data().role;
                        if (role !== 'anggota') {
                            targetUrl = "/dashboard/index.html"; // Admin/Pengurus
                        }
                    }
                } catch(e) {
                    console.error("Gagal mengecek role:", e);
                }

                setTimeout(() => {
                    window.location.href = targetUrl;
                }, 1000);
            } catch (error) {
                const errorCode = error.code;
                let errorMessage = "Terjadi kesalahan saat login. Silakan coba lagi.";
                
                if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password' || errorCode === 'auth/invalid-credential') {
                    errorMessage = "Email atau password yang Anda masukkan salah.";
                } else if (errorCode === 'auth/too-many-requests') {
                    errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
                } else if (errorCode === 'auth/invalid-email') {
                    errorMessage = "Format email tidak valid.";
                }
                
                loginAlert.textContent = errorMessage;
                loginAlert.classList.remove('d-none');
                
                btnLogin.innerHTML = 'Login';
                btnLogin.disabled = false;
            }
        });
    }
});
