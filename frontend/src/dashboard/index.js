import { db } from '../firebase.js';
import { collection, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

async function loadMaintenanceStatus() {
    try {
        const toggleBtn = document.getElementById('toggleMaintenance');
        const textStatus = document.getElementById('maintenanceStatusText');
        
        const docRef = doc(db, "settings", "maintenance");
        const docSnap = await getDoc(docRef);
        
        let isMaintenance = false; 
        if (docSnap.exists()) {
            isMaintenance = docSnap.data().isMaintenance;
        } else {
            await setDoc(docRef, { isMaintenance: false });
        }
        
        toggleBtn.checked = isMaintenance;
        toggleBtn.disabled = false;
        textStatus.innerText = isMaintenance ? "Aktif: Website Sedang Maintenance" : "Mati: Website Berjalan Normal";
        textStatus.className = isMaintenance ? "mb-0 fw-bold small text-warning" : "mb-0 fw-bold small text-info opacity-75";
        
        toggleBtn.addEventListener('change', async (e) => {
            const newState = e.target.checked;
            toggleBtn.disabled = true;
            textStatus.innerText = "Menyimpan...";
            textStatus.className = "mb-0 fw-bold small text-light opacity-50";
            
            try {
                await updateDoc(docRef, { isMaintenance: newState });
                textStatus.innerText = newState ? "Aktif: Website Sedang Maintenance" : "Mati: Website Berjalan Normal";
                textStatus.className = newState ? "mb-0 fw-bold small text-warning" : "mb-0 fw-bold small text-info opacity-75";
            } catch (err) {
                console.error(err);
                alert("Gagal mengubah status maintenance");
                e.target.checked = !newState; // revert
            } finally {
                toggleBtn.disabled = false;
            }
        });
        
    } catch (err) {
        console.error("Gagal memuat status maintenance", err);
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    loadMaintenanceStatus();
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
