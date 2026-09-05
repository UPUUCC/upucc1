import { auth } from './firebase.js';
import { signInWithEmailAndPassword } from "firebase/auth";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const loginAlert = document.getElementById('loginAlert');
    const btnLogin = document.getElementById('btnLogin');

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
                
                setTimeout(() => {
                    window.location.href = "/";
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
