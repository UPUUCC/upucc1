import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, updateDoc, deleteDoc } from "firebase/firestore";

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
    if(confirm("Yakin ingin menghapus data pendaftaran ini?")) {
        try {
            await deleteDoc(doc(db, "pendaftaran", id));
            loadData();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Gagal menghapus data.");
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
        alert("Gagal mengupdate status.");
    }
});

document.getElementById('btnTolak').addEventListener('click', async () => {
    if(!currentId) return;
    if(confirm("Yakin ingin menolak pendaftaran ini?")) {
        try {
            await updateDoc(doc(db, "pendaftaran", currentId), { status: "Ditolak" });
            bootstrap.Modal.getInstance(document.getElementById('detailModal')).hide();
            loadData();
        } catch (err) {
            console.error(err);
            alert("Gagal mengupdate status.");
        }
    }
});

document.addEventListener('DOMContentLoaded', loadData);
