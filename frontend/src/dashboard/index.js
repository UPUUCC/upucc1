import { db } from '../firebase.js';
import { collection, getDocs } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const sliderSnap = await getDocs(collection(db, "sliders"));
        document.getElementById('countSlider').textContent = sliderSnap.size;

        const prestasiSnap = await getDocs(collection(db, "prestasi"));
        document.getElementById('countPrestasi').textContent = prestasiSnap.size;

        const membersSnap = await getDocs(collection(db, "members"));
        document.getElementById('countAnggota').textContent = membersSnap.size;

        const acaraSnap = await getDocs(collection(db, "acara"));
        document.getElementById('countAcara').textContent = acaraSnap.size;
    } catch (err) {
        console.error("Gagal memuat jumlah data", err);
    }
});
