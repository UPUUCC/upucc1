import { db } from './firebase.js';
import { doc, getDoc } from "firebase/firestore";

function initPendaftaran() {
    const formContainer = document.getElementById('pendaftaranForm');
    const closedMsg = document.getElementById('closedMessage');
    const gformBtn = document.getElementById('gformRedirectBtn');
    
    async function loadStatus() {
        try {
            const docSnap = await getDoc(doc(db, "settings", "pendaftaran"));
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.isOpen === false) {
                    closedMsg.classList.remove('d-none');
                    formContainer.classList.add('d-none');
                } else {
                    formContainer.classList.remove('d-none');
                    closedMsg.classList.add('d-none');
                    
                    if (data.gformLink) {
                        gformBtn.href = data.gformLink;
                    } else {
                        // Fallback if admin forgot to set link
                        gformBtn.href = "#";
                        gformBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            alert("Link Google Form belum diatur oleh Admin.");
                        });
                    }
                }
            } else {
                // If doc doesn't exist, default to open but no link
                formContainer.classList.remove('d-none');
                closedMsg.classList.add('d-none');
                gformBtn.href = "#";
                gformBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    alert("Link Google Form belum diatur oleh Admin.");
                });
            }
        } catch (e) {
            console.error("Gagal cek status pendaftaran", e);
            // Default to closed on error
            closedMsg.classList.remove('d-none');
            formContainer.classList.add('d-none');
        }
    }

    loadStatus();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPendaftaran);
} else {
    initPendaftaran();
}
