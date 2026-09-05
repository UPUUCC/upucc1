import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy } from "firebase/firestore";

let saranData = [];

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = '/login.html';
        } else {
            loadSaran();
        }
    });
});

async function loadSaran() {
    const tableBody = document.getElementById('saranTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    
    try {
        const q = query(collection(db, "saran"), orderBy("tanggal", "desc"));
        const snap = await getDocs(q);
        saranData = [];
        let html = '';
        
        if (snap.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada saran/masukan.</td></tr>';
            return;
        }

        snap.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            saranData.push({ id, ...data });
            
            let dateStr = '-';
            if (data.tanggal) {
                const d = data.tanggal.toDate ? data.tanggal.toDate() : new Date(data.tanggal);
                dateStr = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            }

            const shortPesan = data.pesan.length > 50 ? data.pesan.substring(0, 50) + '...' : data.pesan;

            html += `
                <tr>
                    <td class="ps-4 text-muted small">${dateStr}</td>
                    <td class="fw-medium">${data.nama || 'Anonim'}</td>
                    <td class="text-muted">${shortPesan}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-light btn-action btn-read me-1 text-primary" data-id="${id}" title="Baca"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-light btn-action btn-delete text-danger" data-id="${id}" title="Hapus"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        attachEvents();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Gagal memuat data.</td></tr>';
    }
}

function attachEvents() {
    document.querySelectorAll('.btn-read').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const data = saranData.find(x => x.id === id);
            if (data) {
                document.getElementById('bacaNama').textContent = data.nama || 'Anonim';
                document.getElementById('bacaPesan').textContent = data.pesan;
                
                let dateStr = '-';
                if (data.tanggal) {
                    const d = data.tanggal.toDate ? data.tanggal.toDate() : new Date(data.tanggal);
                    dateStr = d.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                }
                document.getElementById('bacaTanggal').textContent = dateStr;
                
                // eslint-disable-next-line no-undef
                new bootstrap.Modal(document.getElementById('modalBaca')).show();
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const result = await Swal.fire({
                title: 'Yakin ingin menghapus?',
                text: "Pesan yang dihapus tidak bisa dikembalikan.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Ya, hapus!',
                cancelButtonText: 'Batal'
            });

            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "saran", id));
                    Swal.fire('Terhapus!', 'Saran telah dihapus.', 'success');
                    loadSaran();
                } catch (err) {
                    console.error(err);
                    Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
                }
            }
        });
    });
}
