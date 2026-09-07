// src/dashboard/showcase_admin.js
import { db } from "../firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

const form = document.getElementById('formShowcase');
const tableBody = document.getElementById('tableBody');
const btnCancel = document.getElementById('btnCancel');
const formTitle = document.getElementById('formTitle');

let editingId = null;

async function fetchShowcases() {
    tableBody.innerHTML = '<tr><td colspan="4" class="text-center">Memuat data...</td></tr>';
    try {
        const q = query(collection(db, "showcases"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-muted">Belum ada karya ditambahkan.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            tableBody.innerHTML += `
                <tr>
                    <td><img src="${data.gambar}" width="60" height="40" style="object-fit:cover; border-radius:4px;"></td>
                    <td class="fw-bold">${data.judul}</td>
                    <td><span class="badge bg-secondary">${data.kategori}</span></td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editShowcase('${id}', \`${data.judul}\`, '${data.kategori}', '${data.gambar}', \`${data.deskripsi}\`, '${data.link || ''}')"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteShowcase('${id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching showcases: ", error);
        tableBody.innerHTML = '<tr><td colspan="4" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';

    const showcaseData = {
        judul: document.getElementById('judul').value,
        kategori: document.getElementById('kategori').value,
        gambar: document.getElementById('gambar').value,
        deskripsi: document.getElementById('deskripsi').value,
        link: document.getElementById('link').value
    };

    try {
        if (editingId) {
            await updateDoc(doc(db, "showcases", editingId), showcaseData);
        } else {
            showcaseData.createdAt = serverTimestamp();
            await addDoc(collection(db, "showcases"), showcaseData);
        }
        
        form.reset();
        resetForm();
        fetchShowcases();
    } catch (error) {
        console.error("Error saving showcase: ", error);
        alert("Gagal menyimpan karya.");
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Karya';
    }
});

window.deleteShowcase = async (id) => {
    if (confirm('Yakin ingin menghapus karya ini?')) {
        await deleteDoc(doc(db, "showcases", id));
        fetchShowcases();
    }
};

window.editShowcase = (id, judul, kategori, gambar, deskripsi, link) => {
    editingId = id;
    document.getElementById('judul').value = judul;
    document.getElementById('kategori').value = kategori;
    document.getElementById('gambar').value = gambar;
    document.getElementById('deskripsi').value = deskripsi;
    document.getElementById('link').value = link;
    
    formTitle.textContent = 'Edit Karya';
    btnCancel.classList.remove('d-none');
    window.scrollTo(0, 0);
};

function resetForm() {
    editingId = null;
    formTitle.textContent = 'Tambah Karya Baru';
    btnCancel.classList.add('d-none');
    form.reset();
}

btnCancel.addEventListener('click', resetForm);

fetchShowcases();
