import { db } from '../firebase.js';
import { doc, getDoc, setDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    const formInfo = document.getElementById('formInfo');
    const kontenInfo = document.getElementById('kontenInfo');
    const btnSave = document.getElementById('btnSave');
    const alertInfo = document.getElementById('alertInfo');

    const docRef = doc(db, "settings", "informasi");

    // Load Data
    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            kontenInfo.value = docSnap.data().konten || '';
        } else {
            kontenInfo.value = '';
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
});
