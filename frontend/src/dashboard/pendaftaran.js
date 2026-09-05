import Swal from "sweetalert2";
import { db } from '../firebase.js';
import { collection, getDocs, getDoc, setDoc, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";

let allData = [];
let currentId = null;

async function loadData() {
    const tbody = document.getElementById('pendaftaranTableBody');
    try {
        const q = query(collection(db, "pendaftaran"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        allData = [];
        let html = '';
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="10" class="text-center text-muted">Belum ada pendaftar baru.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            data.id = docSnap.id;
            allData.push(data);
            
            // Format date
            let dateStr = '-';
            if (data.createdAt) {
                const d = data.createdAt.toDate();
                dateStr = d.toLocaleDateString('id-ID', {day: 'numeric', month: 'short', year:'numeric'});
            }

            // Status badge
            let badgeClass = 'bg-secondary';
            if (data.status === 'Diterima') badgeClass = 'bg-success';
            if (data.status === 'Ditolak') badgeClass = 'bg-danger';
            if (data.status === 'Menunggu Review') badgeClass = 'bg-warning text-dark';

            // Bukti link
            let buktiHtml = '-';
            if (data.buktiFollow && data.buktiFollow.length > 0) {
                buktiHtml = `<a href="${data.buktiFollow[0]}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-image"></i> Lihat Bukti</a>`;
                if (data.buktiFollow.length > 1) {
                    buktiHtml += `<br><span class="text-muted" style="font-size:0.7rem;">(+${data.buktiFollow.length - 1} file)</span>`;
                }
            } else if (data.buktiUrl) { // Fallback to old property just in case
                buktiHtml = `<a href="${data.buktiUrl}" target="_blank" class="text-primary text-decoration-none small"><i class="bi bi-image"></i> Lihat Bukti</a>`;
                if (!data.buktiFollow) data.buktiFollow = [data.buktiUrl]; // patch for modal
            }

            html += `
                <tr>
                    <td>${dateStr}</td>
                    <td class="fw-bold">${data.nama}</td>
                    <td>${data.nim}</td>
                    <td>${data.email || '-'}</td>
                    <td>${data.nohp || '-'}</td>
                    <td>${data.prodi || '-'} (Smt ${data.semester || '-'})</td>
                    <td><span class="badge bg-primary">${data.divisi}</span></td>
                    <td>${buktiHtml}</td>
                    <td><span class="badge ${badgeClass}">${data.status || 'Menunggu Review'}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1 mb-1" onclick="viewDetail('${data.id}')"><i class="bi bi-eye"></i> Detail</button>
                        <button class="btn btn-sm btn-outline-danger mb-1" onclick="deleteData('${data.id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = html;
        
    } catch (error) {
        console.error("Error loading pendaftaran:", error);
        tbody.innerHTML = '<tr><td colspan="11" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

async function loadStatus() {
    try {
        const toggleBtn = document.getElementById('togglePendaftaran');
        const textStatus = document.getElementById('statusPendaftaranText');
        
        const docRef = doc(db, "settings", "pendaftaran");
        const docSnap = await getDoc(docRef);
        
        let isOpen = true; // Default to true if not set
        let thumbnailUrl = '';
        if (docSnap.exists()) {
            isOpen = docSnap.data().isOpen;
            thumbnailUrl = docSnap.data().thumbnailUrl || '';
        } else {
            await setDoc(docRef, { isOpen: true, thumbnailUrl: '' });
        }
        
        toggleBtn.checked = isOpen;
        toggleBtn.disabled = false;
        textStatus.innerText = isOpen ? "Status: DIBUKA" : "Status: DITUTUP";
        textStatus.className = isOpen ? "me-3 fw-bold small text-success" : "me-3 fw-bold small text-danger";
        
        // Popup Settings Logic
        const btnPopupSettings = document.getElementById('btnPopupSettings');
        if(btnPopupSettings) btnPopupSettings.disabled = false;
        
        const previewImg = document.getElementById('popupThumbnailPreview');
        const urlInput = document.getElementById('popupThumbnailUrl');
        
        if (thumbnailUrl) {
            previewImg.src = thumbnailUrl;
            urlInput.value = thumbnailUrl;
        }
        
        urlInput.addEventListener('input', (e) => {
            if(e.target.value) previewImg.src = e.target.value;
        });
        
        const CLOUDINARY_CLOUD_NAME = "xg0djsvz";
        const CLOUDINARY_UPLOAD_PRESET = "ml_default";
        
        async function uploadToCloudinary(file) {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            try {
                const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`, {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (res.ok) {
                    return data.secure_url;
                } else {
                    throw new Error(data.error.message);
                }
            } catch (err) {
                console.error("Cloudinary Error:", err);
                throw new Error("Gagal mengupload gambar ke Cloudinary.");
            }
        }
        
        document.getElementById('btnUploadThumbnail').addEventListener('click', () => {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async (e) => {
                if (e.target.files && e.target.files[0]) {
                    const btn = document.getElementById('btnUploadThumbnail');
                    const originalText = btn.innerHTML;
                    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mengunggah...';
                    btn.disabled = true;
                    
                    try {
                        const url = await uploadToCloudinary(e.target.files[0]);
                        urlInput.value = url;
                        previewImg.src = url;
                        Swal.fire({icon: 'success', title: 'Berhasil', text: 'Thumbnail berhasil diunggah! Jangan lupa klik Simpan Pengaturan.', timer: 2000, showConfirmButton: false});
                    } catch(err) {
                        Swal.fire({icon: 'error', title: 'Gagal', text: err.message});
                    } finally {
                        btn.innerHTML = originalText;
                        btn.disabled = false;
                    }
                }
            };
            fileInput.click();
        });
        
        document.getElementById('btnSavePopupSettings').addEventListener('click', async () => {
            const btn = document.getElementById('btnSavePopupSettings');
            btn.innerHTML = 'Menyimpan...';
            btn.disabled = true;
            try {
                await updateDoc(docRef, { thumbnailUrl: urlInput.value });
                Swal.fire({icon: 'success', title: 'Tersimpan', text: 'Pengaturan Pop-up berhasil disimpan!', timer: 1500, showConfirmButton: false});
                bootstrap.Modal.getInstance(document.getElementById('popupSettingsModal')).hide();
            } catch(err) {
                console.error(err);
                Swal.fire({icon: 'error', title: 'Gagal', text: 'Gagal menyimpan pengaturan.'});
            } finally {
                btn.innerHTML = 'Simpan Pengaturan';
                btn.disabled = false;
            }
        });
        
        toggleBtn.addEventListener('change', async (e) => {
            const newState = e.target.checked;
            toggleBtn.disabled = true;
            textStatus.innerText = "Menyimpan...";
            textStatus.className = "me-3 fw-bold small text-muted";
            
            try {
                await updateDoc(docRef, { isOpen: newState });
                textStatus.innerText = newState ? "Status: DIBUKA" : "Status: DITUTUP";
                textStatus.className = newState ? "me-3 fw-bold small text-success" : "me-3 fw-bold small text-danger";
            } catch (err) {
                console.error(err);
                Swal.fire({icon: 'info', title: 'Perhatian', text: "Gagal mengubah status pendaftaran"})
                e.target.checked = !newState; // revert
            } finally {
                toggleBtn.disabled = false;
            }
        });
        
    } catch (err) {
        console.error("Gagal memuat status pendaftaran", err);
    }
}

window.viewDetail = (id) => {
    const data = allData.find(d => d.id === id);
    if(!data) return;
    
    currentId = id;
    
    document.getElementById('detailNama').innerText = data.nama;
    document.getElementById('detailNim').innerText = data.nim;
    document.getElementById('detailEmail').innerText = data.email;
    document.getElementById('detailHp').innerText = data.nohp;
    document.getElementById('detailProdi').innerText = `${data.prodi} (Semester ${data.semester})`;
    document.getElementById('detailDivisi').innerText = data.divisi;
    
    const buktiDiv = document.getElementById('detailBukti');
    buktiDiv.innerHTML = '';
    if(data.buktiFollow && data.buktiFollow.length > 0) {
        data.buktiFollow.forEach(url => {
            const isPdf = url.toLowerCase().endsWith('.pdf');
            if(isPdf) {
                buktiDiv.innerHTML += `<a href="${url}" target="_blank" class="btn btn-sm btn-outline-secondary"><i class="bi bi-file-earmark-pdf"></i> Lihat PDF</a>`;
            } else {
                buktiDiv.innerHTML += `<a href="${url}" target="_blank"><img src="${url}" class="rounded border" style="height:80px; width:80px; object-fit:cover;"></a>`;
            }
        });
    } else {
        buktiDiv.innerHTML = '<span class="text-muted small">Tidak ada bukti upload</span>';
    }
    
    const modal = new bootstrap.Modal(document.getElementById('detailModal'));
    modal.show();
};

window.deleteData = async (id) => {
    const confirmResult = await Swal.fire({title: "Yakin ingin menghapus data pendaftaran ini?", icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'});
            if (confirmResult.isConfirmed) {
        try {
            await deleteDoc(doc(db, "pendaftaran", id));
            loadData();
        } catch (error) {
            console.error("Error deleting:", error);
            Swal.fire({icon: 'info', title: 'Perhatian', text: "Gagal menghapus data."})
        }
    }
};

document.getElementById('btnTerima').addEventListener('click', async () => {
    if(!currentId) return;
    try {
        await updateDoc(doc(db, "pendaftaran", currentId), { status: "Diterima" });
        bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
        loadData();
    } catch (err) {
        console.error(err);
        Swal.fire({icon: 'info', title: 'Perhatian', text: "Gagal mengupdate status."})
    }
});

document.getElementById('btnTolak').addEventListener('click', async () => {
    if(!currentId) return;
    const confirmResult = await Swal.fire({title: "Yakin ingin menolak pendaftaran ini?", icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'});
            if (confirmResult.isConfirmed) {
        try {
            await updateDoc(doc(db, "pendaftaran", currentId), { status: "Ditolak" });
            bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
            loadData();
        } catch (err) {
            console.error(err);
            Swal.fire({icon: 'info', title: 'Perhatian', text: "Gagal mengupdate status."})
        }
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    loadStatus();
});
