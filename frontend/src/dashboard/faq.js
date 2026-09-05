import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, deleteDoc, doc, query, orderBy, addDoc, updateDoc } from "firebase/firestore";

let faqData = [];

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, (user) => {
        if (!user) {
            window.location.href = '/login.html';
        } else {
            loadFaq();
        }
    });

    document.getElementById('formFaq').addEventListener('submit', handleSaveFaq);
});

async function loadFaq() {
    const tableBody = document.getElementById('faqTableBody');
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>';
    
    try {
        const q = query(collection(db, "faq"), orderBy("order", "asc"));
        const snap = await getDocs(q);
        faqData = [];
        let html = '';
        
        if (snap.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-muted">Belum ada FAQ.</td></tr>';
            return;
        }

        let i = 1;
        snap.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            faqData.push({ id, ...data });
            
            const shortJawaban = data.jawaban.length > 80 ? data.jawaban.substring(0, 80) + '...' : data.jawaban;

            html += `
                <tr>
                    <td class="ps-4 text-muted">${i++}</td>
                    <td class="fw-medium">${data.pertanyaan}</td>
                    <td class="text-muted small">${shortJawaban}</td>
                    <td class="text-end pe-4">
                        <button class="btn btn-light btn-action btn-edit me-1 text-primary" data-id="${id}" title="Edit"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-light btn-action btn-delete text-danger" data-id="${id}" title="Hapus"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
        
        tableBody.innerHTML = html;
        attachEvents();
    } catch (err) {
        console.error(err);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center py-4 text-danger">Gagal memuat data FAQ.</td></tr>';
    }
}

function attachEvents() {
    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const data = faqData.find(x => x.id === id);
            if (data) {
                // defined globally in HTML
                window.openFaqModal(id, data.pertanyaan, data.jawaban, data.order || 0);
            }
        });
    });

    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = e.currentTarget.getAttribute('data-id');
            const result = await Swal.fire({
                title: 'Hapus FAQ?',
                text: "FAQ ini akan dihapus permanen.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#d33',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Hapus'
            });

            if (result.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "faq", id));
                    Swal.fire('Terhapus!', 'FAQ berhasil dihapus.', 'success');
                    loadFaq();
                } catch (err) {
                    console.error(err);
                    Swal.fire('Gagal', 'Terjadi kesalahan saat menghapus.', 'error');
                }
            }
        });
    });
}

async function handleSaveFaq(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSaveFaq');
    const id = document.getElementById('faqId').value;
    const pertanyaan = document.getElementById('faqPertanyaan').value.trim();
    const jawaban = document.getElementById('faqJawaban').value.trim();
    const order = parseInt(document.getElementById('faqOrder').value) || 0;
    
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
    
    try {
        if (id) {
            // Update
            await updateDoc(doc(db, "faq", id), { pertanyaan, jawaban, order });
            Swal.fire('Berhasil', 'FAQ berhasil diperbarui.', 'success');
        } else {
            // Create
            await addDoc(collection(db, "faq"), { pertanyaan, jawaban, order });
            Swal.fire('Berhasil', 'FAQ baru ditambahkan.', 'success');
        }
        window.closeFaqModal();
        e.target.reset();
        loadFaq();
    } catch (err) {
        console.error(err);
        Swal.fire('Gagal', 'Gagal menyimpan FAQ.', 'error');
    } finally {
        btn.disabled = false;
        btn.innerText = 'Simpan FAQ';
    }
}
