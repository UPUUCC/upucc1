import { db, auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, orderBy } from "firebase/firestore";

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
        const qPusatAll = query(collection(db, "certificates"), where("divisi_id", "==", "upucc"), where("member_email", "==", "all"));
        const qPusatSpecific = userEmail ? query(collection(db, "certificates"), where("divisi_id", "==", "upucc"), where("member_email", "==", userEmail)) : null;
        
        const promises = [getDocs(qDivisi), getDocs(qPusatAll)];
        if(qPusatSpecific) promises.push(getDocs(qPusatSpecific));
        
        const results = await Promise.all(promises);
        
        let docsArray = [];
        results.forEach(snap => {
            snap.forEach(docSnap => {
                if(!docsArray.find(d => d.id === docSnap.id)) docsArray.push({ id: docSnap.id, ...docSnap.data() });
            });
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

