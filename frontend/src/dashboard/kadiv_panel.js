import Swal from "sweetalert2";
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, setDoc, query, where, orderBy, limit } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "xg0djsvz";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

async function uploadToCloudinary(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.secure_url) return data.secure_url;
        throw new Error(data.error?.message || 'Gagal upload gambar');
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw new Error("Gagal mengupload gambar ke Cloudinary.");
    }
}

let activeDivisiId = '';
let divisions = [];
let isAdmin = false;

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cek User dan Role
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()), limit(1));
            const snap = await getDocs(q);
            
            let role = 'admin';
            let divisiId = '';
            
            if (!snap.empty) {
                const data = snap.docs[0].data();
                role = (data.role || 'admin').toLowerCase();
                divisiId = data.divisi_id || '';
            }

            if (role === 'admin') {
                isAdmin = true;
                activeDivisiId = ''; // default semua divisi
                document.getElementById('divisiFilterContainer').classList.remove('d-none');
                await loadDivisionsFilter();
            } else if (role === 'kadiv' || role === 'wakadiv') {
                isAdmin = false;
                activeDivisiId = divisiId;
                if (!activeDivisiId) {
                    Swal.fire('Error', 'Akun Anda belum dipetakan ke divisi tertentu!', 'error');
                }
            } else {
                window.location.href = '/dashboard/index.html';
                return;
            }

            await loadAllData();

        } catch (error) {
            console.error(error);
        }
    });

    const filterSelect = document.getElementById('adminDivisiFilter');
    filterSelect.addEventListener('change', (e) => {
        activeDivisiId = e.target.value;
        loadAllData();
    });

    // Form Event Listeners
    document.getElementById('formAddMateri').addEventListener('submit', addMateri);
    document.getElementById('formAddSertifikat').addEventListener('submit', addSertifikat);
    document.getElementById('formAddJadwal').addEventListener('submit', addJadwal);
    document.getElementById('formAbsensi').addEventListener('submit', saveAbsensi);
});

async function loadDivisionsFilter() {
    try {
        const snap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
        const select = document.getElementById('adminDivisiFilter');
        snap.forEach(d => {
            divisions.push({ id: d.id, ...d.data() });
            select.innerHTML += `<option value="${d.id}">${d.data().nama}</option>`;
        });
    } catch (e) { console.error(e); }
}

function getDivisiName(id) {
    const d = divisions.find(x => x.id === id);
    return d ? d.nama : (id || 'Semua Divisi');
}

async function loadAllData() {
    // Jika tidak ada divisi yang dipilih (Super Admin memilih "Semua Divisi"), kita bisa sembunyikan atau tampilkan pesan.
    // Tapi untuk materi/sertifikat, lebih baik harus milih divisi dulu untuk upload.
    const namaDiv = !activeDivisiId ? "Semua Divisi (Pilih Divisi Dulu Untuk Upload)" : getDivisiName(activeDivisiId);
    document.getElementById('displayNamaDivisi').textContent = namaDiv;

    await loadMateri();
    await loadSertifikat();
    await loadJadwal();
    await loadAbsensi();
}

/* ================== MATERI ================== */
async function loadMateri() {
    const tbody = document.getElementById('materiTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat...</td></tr>';
    
    if (!activeDivisiId && !isAdmin) return;
    
    try {
        let q;
        if (activeDivisiId) {
            q = query(collection(db, "materials"), where("divisi_id", "==", activeDivisiId), orderBy("created_at", "desc"));
        } else {
            q = query(collection(db, "materials"), orderBy("created_at", "desc"));
        }
        
        const snap = await getDocs(q);
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada materi.</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const date = d.created_at ? new Date(d.created_at.toMillis()).toLocaleDateString('id-ID') : '-';
            html += `
            <tr>
                <td class="fw-bold">${d.title}</td>
                <td><span class="badge bg-secondary">${d.type}</span></td>
                <td><a href="${d.link}" target="_blank" class="btn btn-sm btn-outline-info">Buka Link</a></td>
                <td>${date}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('materials', '${docSnap.id}', loadMateri)"><i class="bi bi-trash"></i></button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat materi. Pastikan Index Firestore sudah dibuat.</td></tr>';
    }
}

async function addMateri(e) {
    e.preventDefault();
    if (!activeDivisiId) return Swal.fire('Gagal', 'Pilih divisi terlebih dahulu.', 'error');
    
    const btn = document.getElementById('btnSaveMateri');
    btn.disabled = true; btn.textContent = 'Menyimpan...';

    try {
        await addDoc(collection(db, "materials"), {
            title: document.getElementById('materiJudul').value,
            type: document.getElementById('materiJenis').value,
            link: document.getElementById('materiLink').value,
            divisi_id: activeDivisiId,
            created_at: new Date()
        });
        bootstrap.Modal.getInstance(document.getElementById('modalAddMateri')).hide();
        document.getElementById('formAddMateri').reset();
        Swal.fire('Berhasil', 'Materi ditambahkan.', 'success');
        loadMateri();
    } catch (e) { Swal.fire('Gagal', e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Simpan'; }
}

/* ================== SERTIFIKAT ================== */
async function loadSertifikat() {
    const tbody = document.getElementById('sertifikatTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat...</td></tr>';
    if (!activeDivisiId && !isAdmin) return;
    
    try {
        let q = activeDivisiId 
            ? query(collection(db, "certificates"), where("divisi_id", "==", activeDivisiId), orderBy("created_at", "desc"))
            : query(collection(db, "certificates"), orderBy("created_at", "desc"));
            
        const snap = await getDocs(q);
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada E-Certificate.</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(docSnap => {
            const d = docSnap.data();
            const date = d.created_at ? new Date(d.created_at.toMillis()).toLocaleDateString('id-ID') : '-';
            html += `
            <tr>
                <td><img src="${d.imageUrl}" style="width:80px;height:50px;object-fit:cover;border-radius:5px;"></td>
                <td class="fw-bold">${d.title}</td>
                <td>${d.issueDate}</td>
                <td>${date}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('certificates', '${docSnap.id}', loadSertifikat)"><i class="bi bi-trash"></i></button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat sertifikat. Pastikan Index Firestore sudah dibuat.</td></tr>';
    }
}

async function addSertifikat(e) {
    e.preventDefault();
    if (!activeDivisiId) return Swal.fire('Gagal', 'Pilih divisi terlebih dahulu.', 'error');
    
    const btn = document.getElementById('btnSaveSertifikat');
    btn.disabled = true; btn.textContent = 'Upload...';

    try {
        const fileInput = document.getElementById('certFile');
        let imageUrl = '';
        if (fileInput.files.length > 0) {
            imageUrl = await uploadToCloudinary(fileInput.files[0]);
        } else {
            throw new Error("File gambar wajib diupload.");
        }

        await addDoc(collection(db, "certificates"), {
            title: document.getElementById('certJudul').value,
            issueDate: document.getElementById('certBulan').value,
            imageUrl: imageUrl,
            divisi_id: activeDivisiId,
            created_at: new Date()
        });
        bootstrap.Modal.getInstance(document.getElementById('modalAddSertifikat')).hide();
        document.getElementById('formAddSertifikat').reset();
        Swal.fire('Berhasil', 'Sertifikat ditambahkan.', 'success');
        loadSertifikat();
    } catch (e) { Swal.fire('Gagal', e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Upload'; }
}

/* ================== JADWAL ================== */
async function loadJadwal() {
    const tbody = document.getElementById('jadwalTableBody');
    tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat...</td></tr>';
    if (!activeDivisiId && !isAdmin) return;
    
    try {
        let q = activeDivisiId 
            ? query(collection(db, "schedules"), where("divisi_id", "==", activeDivisiId), orderBy("created_at", "desc"))
            : query(collection(db, "schedules"), orderBy("created_at", "desc"));
            
        const snap = await getDocs(q);
        if (snap.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada Jadwal.</td></tr>';
            return;
        }

        let html = '';
        snap.forEach(docSnap => {
            const d = docSnap.data();
            let statusBadge = d.status === 'Upcoming' ? 'bg-warning text-dark' : (d.status === 'Done' ? 'bg-success' : 'bg-danger');
            html += `
            <tr>
                <td class="fw-bold">${d.title}</td>
                <td>${d.time}</td>
                <td>${d.location}</td>
                <td><span class="badge ${statusBadge}">${d.status}</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('schedules', '${docSnap.id}', loadJadwal)"><i class="bi bi-trash"></i></button></td>
            </tr>`;
        });
        tbody.innerHTML = html;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat jadwal. Pastikan Index Firestore sudah dibuat.</td></tr>';
    }
}

async function addJadwal(e) {
    e.preventDefault();
    if (!activeDivisiId) return Swal.fire('Gagal', 'Pilih divisi terlebih dahulu.', 'error');
    
    const btn = document.getElementById('btnSaveJadwal');
    btn.disabled = true; btn.textContent = 'Menyimpan...';

    try {
        await addDoc(collection(db, "schedules"), {
            title: document.getElementById('jadwalNama').value,
            time: document.getElementById('jadwalWaktu').value,
            location: document.getElementById('jadwalLokasi').value,
            status: document.getElementById('jadwalStatus').value,
            divisi_id: activeDivisiId,
            created_at: new Date()
        });
        bootstrap.Modal.getInstance(document.getElementById('modalAddJadwal')).hide();
        document.getElementById('formAddJadwal').reset();
        Swal.fire('Berhasil', 'Jadwal ditambahkan.', 'success');
        loadJadwal();
    } catch (e) { Swal.fire('Gagal', e.message, 'error'); }
    finally { btn.disabled = false; btn.textContent = 'Simpan'; }
}

/* ================== ABSENSI ================== */
async function loadAbsensi() {
    const linkInput = document.getElementById('linkAbsensi');
    const statusCheckbox = document.getElementById('statusAbsensi');
    const lblStatus = document.getElementById('lblStatusAbsensi');
    
    if (!activeDivisiId) {
        linkInput.value = '';
        statusCheckbox.checked = false;
        lblStatus.textContent = 'Ditutup';
        lblStatus.className = 'form-check-label fs-6 ms-2 mt-1 fw-bold text-danger';
        return;
    }

    try {
        const docRef = doc(db, "attendance_links", activeDivisiId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            linkInput.value = data.link || '';
            statusCheckbox.checked = data.active || false;
        } else {
            linkInput.value = '';
            statusCheckbox.checked = false;
        }
        
        lblStatus.textContent = statusCheckbox.checked ? 'Dibuka (Aktif)' : 'Ditutup';
        lblStatus.className = statusCheckbox.checked ? 'form-check-label fs-6 ms-2 mt-1 fw-bold text-success' : 'form-check-label fs-6 ms-2 mt-1 fw-bold text-danger';

    } catch (e) { console.error(e); }
}

document.getElementById('statusAbsensi').addEventListener('change', (e) => {
    const lbl = document.getElementById('lblStatusAbsensi');
    lbl.textContent = e.target.checked ? 'Dibuka (Aktif)' : 'Ditutup';
    lbl.className = e.target.checked ? 'form-check-label fs-6 ms-2 mt-1 fw-bold text-success' : 'form-check-label fs-6 ms-2 mt-1 fw-bold text-danger';
});

async function saveAbsensi(e) {
    e.preventDefault();
    if (!activeDivisiId) return Swal.fire('Gagal', 'Pilih divisi terlebih dahulu.', 'error');
    
    const btn = document.getElementById('btnSaveAbsensi');
    btn.disabled = true; btn.textContent = 'Menyimpan...';

    try {
        await setDoc(doc(db, "attendance_links", activeDivisiId), {
            link: document.getElementById('linkAbsensi').value,
            active: document.getElementById('statusAbsensi').checked,
            updatedAt: new Date()
        }, { merge: true });
        
        Swal.fire('Berhasil', 'Pengaturan absensi disimpan.', 'success');
    } catch (e) { Swal.fire('Gagal', e.message, 'error'); }
    finally { btn.disabled = false; btn.innerHTML = '<i class="bi bi-save"></i> Simpan Pengaturan Absensi'; }
}

/* ================== GLOBAL UTILS ================== */
window.deleteDocItem = async (collectionName, id, reloadCallback) => {
    const res = await Swal.fire({
        title: 'Hapus data ini?', icon: 'warning',
        showCancelButton: true, confirmButtonColor: '#ef4444', confirmButtonText: 'Ya, Hapus'
    });
    if (res.isConfirmed) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
            reloadCallback();
        } catch (e) { Swal.fire('Gagal', 'Terjadi kesalahan.', 'error'); }
    }
};
