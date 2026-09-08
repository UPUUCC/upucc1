import { db, auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, orderBy, limit, addDoc, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

let currentMember = null;

document.addEventListener('DOMContentLoaded', () => {
    
    document.getElementById('btnLogout').addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/login.html';
        });
    });

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        try {
            let q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()));
            let snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                currentMember = snapshot.docs[0].data();
                const nama = currentMember.nama || user.displayName || 'Member UPUCC';
                document.getElementById('welcomeMsg').textContent = `Selamat datang, ${nama}!`;
                
                // Panggil fungsi load dengan mengirimkan divisi_id anggota tersebut
                loadMateri(currentMember.divisi_id);
                loadSertifikat(currentMember.divisi_id);
                loadJadwal(currentMember.divisi_id);
                checkAbsensiQR(currentMember.divisi_id);
                loadLeaderboard();
                renderKta();
                loadArtikelSaya();
            } else {
                document.getElementById('welcomeMsg').textContent = `Selamat datang, Member UPUCC!`;
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    });

});

async function loadMateri(divisiId) {
    const materiContainer = document.getElementById('materiList');
    if (!divisiId) {
        materiContainer.innerHTML = '<p class="text-muted">Divisi tidak ditemukan.</p>';
        return;
    }

    try {
        const qDivisi = query(collection(db, "materials"), where("divisi_id", "==", divisiId));
        const qPusat = query(collection(db, "materials"), where("divisi_id", "==", "upucc"));
        const [snapDivisi, snapPusat] = await Promise.all([getDocs(qDivisi), getDocs(qPusat)]);
        
        let docsArray = [];
        snapDivisi.forEach(docSnap => docsArray.push({ id: docSnap.id, ...docSnap.data() }));
        snapPusat.forEach(docSnap => {
            if(!docsArray.find(d => d.id === docSnap.id)) docsArray.push({ id: docSnap.id, ...docSnap.data() });
        });
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        materiContainer.innerHTML = '';
        if (docsArray.length === 0) {
            materiContainer.innerHTML = '<p class="text-muted">Belum ada materi belajar untuk divisi ini.</p>';
            return;
        }

        docsArray.forEach(item => {
            const icon = item.type === 'PDF' ? 'bi-file-earmark-pdf text-danger' : (item.type === 'Video' ? 'bi-play-circle text-primary' : 'bi-link-45deg text-success');
            const date = item.created_at ? new Date(item.created_at.toMillis()).toLocaleDateString('id-ID') : '-';
            
            materiContainer.innerHTML += `
                <div class="material-item p-3 mb-3 shadow-sm d-flex justify-content-between align-items-center rounded-3 bg-white border border-light">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi ${icon} fs-2"></i>
                        <div>
                            <h6 class="mb-1 fw-bold">${item.title}</h6>
                            <small class="text-muted"><i class="bi bi-clock me-1"></i> ${date} • ${item.type}</small>
                        </div>
                    </div>
                    <a href="${item.link}" target="_blank" class="btn btn-sm btn-outline-primary"><i class="bi bi-box-arrow-up-right"></i> Buka</a>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        materiContainer.innerHTML = '<p class="text-danger">Gagal memuat materi.</p>';
    }
}

async function loadSertifikat(divisiId) {
    const certContainer = document.getElementById('sertifikatList');
    if (!divisiId) {
        certContainer.innerHTML = '<p class="text-muted">Divisi tidak ditemukan.</p>';
        return;
    }

    try {
        const userEmail = currentMember ? currentMember.email : '';
        const qDivisi = query(collection(db, "certificates"), where("divisi_id", "==", divisiId));
        const qPusat = query(collection(db, "certificates"), where("divisi_id", "==", "upucc"));
        
        const [snapDivisi, snapPusat] = await Promise.all([getDocs(qDivisi), getDocs(qPusat)]);
        
        let docsArray = [];
        snapDivisi.forEach(docSnap => {
            const data = docSnap.data();
            const email = data.member_email;
            if (!email || email === 'all' || email === userEmail) {
                docsArray.push({ id: docSnap.id, ...data });
            }
        });
        snapPusat.forEach(docSnap => {
            const data = docSnap.data();
            const email = data.member_email;
            if (!email || email === 'all' || email === userEmail) {
                if(!docsArray.find(d => d.id === docSnap.id)) docsArray.push({ id: docSnap.id, ...data });
            }
        });
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        certContainer.innerHTML = '';
        if (docsArray.length === 0) {
            certContainer.innerHTML = '<p class="text-muted">Belum ada E-Certificate.</p>';
            return;
        }

        docsArray.forEach(item => {
            certContainer.innerHTML += `
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                        <img src="${item.imageUrl}" class="card-img-top" alt="Certificate" style="height: 150px; object-fit: cover;">
                        <div class="card-body">
                            <h6 class="fw-bold text-truncate" title="${item.title}">${item.title}</h6>
                            <p class="small text-muted mb-3">Diterbitkan: ${item.issueDate}</p>
                            <a href="${item.imageUrl}" target="_blank" class="btn btn-sm btn-primary w-100"><i class="bi bi-eye"></i> Lihat Sertifikat</a>
                        </div>
                    </div>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        certContainer.innerHTML = '<p class="text-danger">Gagal memuat e-certificate.</p>';
    }
}

async function loadJadwal(divisiId) {
    const jadwalContainer = document.getElementById('jadwalList');
    if (!divisiId) {
        jadwalContainer.innerHTML = '<p class="text-muted">Divisi tidak ditemukan.</p>';
        return;
    }

    try {
        const qDivisi = query(collection(db, "schedules"), where("divisi_id", "==", divisiId));
        const qPusat = query(collection(db, "schedules"), where("divisi_id", "==", "upucc"));
        const [snapDivisi, snapPusat] = await Promise.all([getDocs(qDivisi), getDocs(qPusat)]);
        
        let docsArray = [];
        snapDivisi.forEach(docSnap => docsArray.push({ id: docSnap.id, ...docSnap.data() }));
        snapPusat.forEach(docSnap => {
            if(!docsArray.find(d => d.id === docSnap.id)) docsArray.push({ id: docSnap.id, ...docSnap.data() });
        });
        docsArray.sort((a, b) => (b.created_at?.toMillis() || 0) - (a.created_at?.toMillis() || 0));

        jadwalContainer.innerHTML = '';
        if (docsArray.length === 0) {
            jadwalContainer.innerHTML = '<p class="text-muted">Belum ada jadwal kegiatan.</p>';
            return;
        }

        docsArray.forEach(item => {
            let statusBadge = item.status === 'Upcoming' ? 'bg-warning text-dark' : (item.status === 'Done' ? 'bg-success' : 'bg-danger');
            jadwalContainer.innerHTML += `
                <div class="d-flex p-3 mb-3 bg-light rounded-3 align-items-center justify-content-between border-start border-4 ${item.status === 'Upcoming' ? 'border-warning' : (item.status === 'Done' ? 'border-success' : 'border-danger')}">
                    <div>
                        <h6 class="fw-bold mb-1">${item.title}</h6>
                        <small class="text-muted d-block"><i class="bi bi-clock me-1"></i> ${item.time}</small>
                        <small class="text-muted"><i class="bi bi-geo-alt me-1"></i> ${item.location}</small>
                    </div>
                    <span class="badge ${statusBadge}">${item.status}</span>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        jadwalContainer.innerHTML = '<p class="text-danger">Gagal memuat jadwal.</p>';
    }
}

async function checkAbsensiQR(divisiId) {
    // Tombol absensi ada di halaman member dashboard atau di profil?
    // User ingin "absensi qr code" di dashboard member
    // Sebenarnya ada file /member/scan.html. Tapi karena kita di member/dashboard.html,
    // kita bisa menyimpan logic jika ada link absensi yang aktif, kita bisa tampilkan alert.
    
    // Tapi karena tidak ada kontainer khusus di dashboard.js (kecuali tombol di profil),
    // kita biarkan saja. Logika pembacaan akan diurus di scan.html jika ada.
}




// --- LEADERBOARD ---
async function loadLeaderboard() {
    const tbody = document.getElementById('leaderboardTableBody');
    if (!tbody) return;
    
    try {
        const q = query(collection(db, "members"), orderBy("points", "desc"), limit(5));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada data absensi.</td></tr>';
            return;
        }

        let html = '';
        let rank = 1;
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const points = data.points || 0;
            const rankBadge = rank === 1 ? '<span class="badge bg-warning text-dark"><i class="bi bi-trophy-fill"></i> 1</span>' :
                            (rank === 2 ? '<span class="badge bg-secondary"><i class="bi bi-award-fill"></i> 2</span>' :
                            (rank === 3 ? '<span class="badge" style="background:#cd7f32"><i class="bi bi-award"></i> 3</span>' : <span class="badge bg-light text-dark"></span>));
            
            html += 
                <tr>
                    <td class="fw-bold fs-5">+rankBadge+</td>
                    <td class="fw-bold">+(data.nama || 'Anggota')+</td>
                    <td><span class="badge bg-primary">+(data.divisi_name || data.divisi_id || 'Umum')+</span></td>
                    <td class="fw-bold text-success">+points+ Pts</td>
                </tr>
            ;
            rank++;
        });
        tbody.innerHTML = html;
    } catch (e) {
        console.error("Leaderboard Error:", e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat leaderboard.</td></tr>';
    }
}

// --- KTA DIGITAL ---
function renderKta() {
    if (!currentMember) return;
    
    const ktaNama = document.getElementById('ktaNama');
    const ktaDivisi = document.getElementById('ktaDivisi');
    const ktaEmail = document.getElementById('ktaEmail');
    const ktaQrCode = document.getElementById('ktaQrCode');
    
    if (ktaNama) ktaNama.textContent = currentMember.nama || currentMember.email.split('@')[0];
    if (ktaDivisi) ktaDivisi.textContent = "DIVISI " + (currentMember.divisi_name || currentMember.divisi_id || 'UMUM').toUpperCase();
    if (ktaEmail) ktaEmail.textContent = currentMember.email;
    
    // Generate QR
    if (ktaQrCode) {
        ktaQrCode.innerHTML = ''; // clear
        new QRCode(ktaQrCode, {
            text: currentMember.email,
            width: 80,
            height: 80
        });
    }

    const btnDownload = document.getElementById('btnDownloadKta');
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            const ktaCard = document.getElementById('ktaCard');
            const originalTransform = ktaCard.style.transform;
            ktaCard.style.transform = 'none'; // fix scaling issues in html2canvas
            
            try {
                const canvas = await html2canvas(ktaCard, {
                    scale: 2, 
                    useCORS: true, 
                    backgroundColor: null
                });
                ktaCard.style.transform = originalTransform;
                
                const link = document.createElement('a');
                link.download = 'KTA-UPUCC-' + (currentMember.nama || 'Anggota') + '.png';
                link.href = canvas.toDataURL('image/png');
                link.click();
            } catch (e) {
                console.error(e);
                Swal.fire('Gagal', 'Terjadi kesalahan saat mengunduh KTA', 'error');
            }
        });
    }
}

// --- ARTIKEL GUEST BLOG ---
const CLOUDINARY_CLOUD_NAME = "xg0djsvz";
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

async function uploadToCloudinary(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const res = await fetch(https://api.cloudinary.com/v1_1/+CLOUDINARY_CLOUD_NAME+/image/upload, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        return data.secure_url || '';
    } catch (err) {
        console.error(err);
        return '';
    }
}

async function loadArtikelSaya() {
    const tbody = document.getElementById('artikelTableBody');
    if (!tbody || !currentMember) return;
    
    try {
        const q = query(collection(db, "blogs"), where("author_email", "==", currentMember.email));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada artikel yang ditulis.</td></tr>';
            return;
        }

        let html = '';
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const dateStr = data.createdAt ? new Date(data.createdAt.toMillis()).toLocaleDateString('id-ID') : '-';
            const statusBadge = data.status === 'published' ? '<span class="badge bg-success">Published</span>' : '<span class="badge bg-warning text-dark">Pending</span>';
            
            html += 
                <tr>
                    <td class="fw-bold">+data.judul+</td>
                    <td><span class="badge bg-secondary">+data.kategori+</span></td>
                    <td>+dateStr+</td>
                    <td>+statusBadge+</td>
                </tr>
            ;
        });
        
        // sort html by date roughly by pushing to array if needed, but since it's personal blog, simple foreach is fine for now
        tbody.innerHTML = html;
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat artikel Anda. Pastikan Firestore Index tersedia.</td></tr>';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const formAddArtikel = document.getElementById('formAddArtikel');
    if (formAddArtikel) {
        formAddArtikel.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btnSaveArtikel');
            btn.disabled = true; btn.textContent = 'Mengirim...';

            try {
                const fileInput = document.getElementById('artGambar');
                if (fileInput.files.length === 0) throw new Error("Gambar thumbnail wajib diupload");
                
                const imageUrl = await uploadToCloudinary(fileInput.files[0]);
                if (!imageUrl) throw new Error("Gagal upload gambar");

                await addDoc(collection(db, "blogs"), {
                    judul: document.getElementById('artJudul').value,
                    kategori: document.getElementById('artKategori').value,
                    isi: document.getElementById('artKonten').value,
                    gambar: imageUrl,
                    author: currentMember.nama || 'Member UPUCC',
                    author_email: currentMember.email,
                    status: 'pending',
                    createdAt: serverTimestamp()
                });
                
                formAddArtikel.reset();
                Swal.fire('Berhasil!', 'Artikel Anda berhasil dikirim dan sedang menunggu review Kadiv/Admin.', 'success');
                loadArtikelSaya();
            } catch (err) {
                console.error(err);
                Swal.fire('Error', err.message || 'Terjadi kesalahan sistem', 'error');
            } finally {
                btn.disabled = false; btn.textContent = 'Kirim Artikel untuk Direview';
            }
        });
    }
});



