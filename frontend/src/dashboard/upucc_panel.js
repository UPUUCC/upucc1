import Swal from "sweetalert2";
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, addDoc, deleteDoc, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp } from "firebase/firestore";

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

            const allowedRoles = ['admin', 'ketum', 'waketum', 'sekretaris', 'wakil_sekretaris', 'bendahara', 'wakil_bendahara'];
            if (!allowedRoles.includes(role)) {
                window.location.href = '/dashboard/index.html';
                return;
            }
            isAdmin = false; // kita tidak perlu filter dinamis di panel ini
            activeDivisiId = 'upucc';
            const filterDiv = document.getElementById('divisiFilterContainer');
            if(filterDiv) filterDiv.classList.add('d-none');

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
    
    const formAddSession = document.getElementById('formAddSession');
    if (formAddSession) formAddSession.addEventListener('submit', startAbsensiSession);
    const btnCloseSession = document.getElementById('btnCloseSession');
    if (btnCloseSession) btnCloseSession.addEventListener('click', closeAbsensiSession);
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
            q = query(collection(db, "materials"), where("divisi_id", "==", activeDivisiId));
        } else {
            q = query(collection(db, "materials"));
        }
        
        const snap = await getDocs(q);
        
        // Sort client-side to avoid Firestore composite index requirement
        let docsArray = [];
        snap.forEach(docSnap => docsArray.push({ id: docSnap.id, ...docSnap.data() }));
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        if (docsArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada materi.</td></tr>';
            return;
        }

        let html = '';
        docsArray.forEach(d => {
            const date = d.created_at ? new Date(d.created_at.toMillis()).toLocaleDateString('id-ID') : '-';
            html += `
            <tr>
                <td class="fw-bold">${d.title}</td>
                <td><span class="badge bg-secondary">${d.type}</span></td>
                <td><a href="${d.link}" target="_blank" class="btn btn-sm btn-outline-info">Buka Link</a></td>
                <td>${date}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('materials', '${d.id}', loadMateri)"><i class="bi bi-trash"></i></button></td>
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
            ? query(collection(db, "certificates"), where("divisi_id", "==", activeDivisiId))
            : query(collection(db, "certificates"));
            
        const snap = await getDocs(q);
        
        // Sort client-side to avoid Firestore composite index requirement
        let docsArray = [];
        snap.forEach(docSnap => docsArray.push({ id: docSnap.id, ...docSnap.data() }));
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        if (docsArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada E-Certificate.</td></tr>';
            return;
        }

        let html = '';
        docsArray.forEach(d => {
            const date = d.created_at ? new Date(d.created_at.toMillis()).toLocaleDateString('id-ID') : '-';
            html += `
            <tr>
                <td><img src="${d.imageUrl}" style="width:80px;height:50px;object-fit:cover;border-radius:5px;"></td>
                <td class="fw-bold">${d.title}</td>
                <td>${d.issueDate}</td>
                <td>${date}</td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('certificates', '${d.id}', loadSertifikat)"><i class="bi bi-trash"></i></button></td>
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
            ? query(collection(db, "schedules"), where("divisi_id", "==", activeDivisiId))
            : query(collection(db, "schedules"));
            
        const snap = await getDocs(q);
        
        // Sort client-side to avoid Firestore composite index requirement
        let docsArray = [];
        snap.forEach(docSnap => docsArray.push({ id: docSnap.id, ...docSnap.data() }));
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        if (docsArray.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada Jadwal.</td></tr>';
            return;
        }

        let html = '';
        docsArray.forEach(d => {
            let statusBadge = d.status === 'Upcoming' ? 'bg-warning text-dark' : (d.status === 'Done' ? 'bg-success' : 'bg-danger');
            html += `
            <tr>
                <td class="fw-bold">${d.title}</td>
                <td>${d.time}</td>
                <td>${d.location}</td>
                <td><span class="badge ${statusBadge}">${d.status}</span></td>
                <td><button class="btn btn-sm btn-danger" onclick="deleteDocItem('schedules', '${d.id}', loadJadwal)"><i class="bi bi-trash"></i></button></td>
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
let currentSessionUnsubscribe = null;
let currentAttendanceUnsubscribe = null;
let qrcodeInstance = null;
let activeSessionId = null;

async function loadAbsensi() {
    if (!activeDivisiId) {
        document.getElementById('noSessionContainer').style.display = 'block';
        document.getElementById('activeSessionContainer').style.display = 'none';
        document.getElementById('btnOpenSession').disabled = true;
        return;
    }
    document.getElementById('btnOpenSession').disabled = false;

    // Listen to active session for this division
    if (currentSessionUnsubscribe) currentSessionUnsubscribe();
    
    const qSession = query(collection(db, "attendance_sessions"), 
        where("divisi_id", "==", activeDivisiId),
        where("isActive", "==", true),
        limit(1)
    );

    currentSessionUnsubscribe = onSnapshot(qSession, (snapshot) => {
        if (!snapshot.empty) {
            const sessionData = snapshot.docs[0].data();
            activeSessionId = snapshot.docs[0].id;
            
            document.getElementById('noSessionContainer').style.display = 'none';
            document.getElementById('activeSessionContainer').style.display = 'block';
            document.getElementById('btnOpenSession').style.display = 'none';
            document.getElementById('activeSessionTitle').textContent = sessionData.title || "Sesi Kehadiran";
            
            // Generate QR Code
            const qrContainer = document.getElementById('qrcodeDisplay');
            qrContainer.innerHTML = ''; // clear old
            if (!qrcodeInstance) {
                qrcodeInstance = new QRCode(qrContainer, {
                    text: activeSessionId,
                    width: 200,
                    height: 200,
                    colorDark : "#0f172a",
                    colorLight : "#ffffff",
                    correctLevel : QRCode.CorrectLevel.H
                });
            } else {
                qrcodeInstance.clear();
                qrcodeInstance.makeCode(activeSessionId);
            }

            // Start listening to attendees
            listenToAttendees(activeSessionId);
            
        } else {
            activeSessionId = null;
            document.getElementById('noSessionContainer').style.display = 'block';
            document.getElementById('activeSessionContainer').style.display = 'none';
            document.getElementById('btnOpenSession').style.display = 'block';
            
            if (currentAttendanceUnsubscribe) {
                currentAttendanceUnsubscribe();
                currentAttendanceUnsubscribe = null;
            }
        }
    });
}

function listenToAttendees(sessionId) {
    if (currentAttendanceUnsubscribe) currentAttendanceUnsubscribe();
    
    const qAtt = query(collection(db, "attendance_records"), 
        where("session_id", "==", sessionId),
        orderBy("timestamp", "desc")
    );

    currentAttendanceUnsubscribe = onSnapshot(qAtt, (snapshot) => {
        const tbody = document.getElementById('attendanceTableBody');
        tbody.innerHTML = '';
        document.getElementById('totalHadir').textContent = snapshot.size;

        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">Belum ada anggota yang absen.</td></tr>';
            return;
        }

        let index = 1;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const time = data.timestamp ? new Date(data.timestamp.toMillis()).toLocaleTimeString('id-ID') : '-';
            tbody.innerHTML += `
                <tr>
                    <td class="text-muted fw-bold">${index++}</td>
                    <td class="fw-bold">${data.member_name}</td>
                    <td><span class="badge bg-light text-dark"><i class="bi bi-clock me-1"></i> ${time}</span></td>
                </tr>
            `;
        });
    });
}

async function startAbsensiSession(e) {
    e.preventDefault();
    if (!activeDivisiId) return Swal.fire('Gagal', 'Pilih divisi terlebih dahulu.', 'error');
    
    const btn = document.getElementById('btnStartSession');
    btn.disabled = true; btn.innerHTML = 'Memulai...';

    try {
        const title = document.getElementById('sessionTitle').value;
        await addDoc(collection(db, "attendance_sessions"), {
            divisi_id: activeDivisiId,
            title: title,
            isActive: true,
            created_at: serverTimestamp(),
            created_by: auth.currentUser?.uid || 'admin'
        });
        
        bootstrap.Modal.getInstance(document.getElementById('modalAddSession')).hide();
        document.getElementById('formAddSession').reset();
        Swal.fire('Berhasil', 'Sesi absensi dimulai!', 'success');
    } catch (e) { 
        console.error(e);
        Swal.fire('Gagal', e.message, 'error'); 
    }
    finally { btn.disabled = false; btn.innerHTML = '<i class="bi bi-play-circle me-1"></i> Mulai Sesi'; }
}

async function closeAbsensiSession() {
    if (!activeSessionId) return;
    
    const res = await Swal.fire({
        title: 'Tutup Sesi Absensi?',
        text: "Anggota tidak akan bisa scan QR lagi setelah sesi ditutup.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Ya, Tutup Sesi'
    });

    if (res.isConfirmed) {
        try {
            await updateDoc(doc(db, "attendance_sessions", activeSessionId), {
                isActive: false,
                closed_at: serverTimestamp()
            });
            Swal.fire('Berhasil', 'Sesi absensi telah ditutup.', 'success');
        } catch (e) {
            Swal.fire('Gagal', 'Gagal menutup sesi.', 'error');
        }
    }
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


