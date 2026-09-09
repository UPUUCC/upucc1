import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    const formInfo = document.getElementById('formInfo');
    const kontenInfo = document.getElementById('kontenInfo');
    const btnSave = document.getElementById('btnSave');
    const alertInfo = document.getElementById('alertInfo');

    const formSocial = document.getElementById('formSocial');
    const linkInstagram = document.getElementById('linkInstagram');
    const linkYoutube = document.getElementById('linkYoutube');
    const linkGithub = document.getElementById('linkGithub');
    const btnSaveSocial = document.getElementById('btnSaveSocial');
    const alertSocial = document.getElementById('alertSocial');

    const docRef = doc(db, "settings", "informasi");
    const socialRef = doc(db, "settings", "social_links");

    // Load Data
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            kontenInfo.value = docSnap.data().konten || '';
        } else {
            kontenInfo.value = '';
        }
        
        const socialSnap = await getDoc(socialRef);
        if (socialSnap.exists()) {
            const d = socialSnap.data();
            linkInstagram.value = d.instagram || '';
            linkYoutube.value = d.youtube || '';
            linkGithub.value = d.github || '';
        }
    } catch (err) {
        console.error("Gagal load informasi", err);
        kontenInfo.value = "Gagal memuat informasi.";
    }

    // Save Data
    formInfo.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSave.disabled = true;
        btnSave.textContent = 'Menyimpan...';
        alertInfo.classList.add('d-none');

        try {
            await setDoc(docRef, {
                konten: kontenInfo.value,
                updatedAt: new Date()
            }, { merge: true });

            alertInfo.className = 'alert alert-success mt-3';
            alertInfo.textContent = 'Berhasil menyimpan informasi!';
            alertInfo.classList.remove('d-none');
        } catch (err) {
            console.error(err);
            alertInfo.className = 'alert alert-danger mt-3';
            alertInfo.textContent = 'Gagal menyimpan: ' + err.message;
            alertInfo.classList.remove('d-none');
        } finally {
            btnSave.disabled = false;
            btnSave.innerHTML = '<i class="bi bi-save"></i> Simpan';
            setTimeout(() => alertInfo.classList.add('d-none'), 3000);
        }
    });

    // Save Social Links
    formSocial.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSaveSocial.disabled = true;
        btnSaveSocial.innerHTML = '<i class="spinner-border spinner-border-sm me-2"></i>Menyimpan...';
        alertSocial.classList.add('d-none');

        try {
            await setDoc(socialRef, {
                instagram: linkInstagram.value,
                youtube: linkYoutube.value,
                github: linkGithub.value,
                updatedAt: new Date()
            }, { merge: true });

            alertSocial.className = 'alert alert-success mt-3';
            alertSocial.textContent = 'Berhasil menyimpan link sosial media!';
            alertSocial.classList.remove('d-none');
        } catch (err) {
            console.error(err);
            alertSocial.className = 'alert alert-danger mt-3';
            alertSocial.textContent = 'Gagal menyimpan: ' + err.message;
            alertSocial.classList.remove('d-none');
        } finally {
            btnSaveSocial.disabled = false;
            btnSaveSocial.innerHTML = '<i class="bi bi-save"></i> Simpan Link';
            setTimeout(() => alertSocial.classList.add('d-none'), 3000);
        }
    });
});
