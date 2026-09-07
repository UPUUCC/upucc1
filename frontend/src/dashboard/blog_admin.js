// src/dashboard/blog_admin.js
import { db } from "../firebase.js";
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

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
        if (data.secure_url) {
            return data.secure_url;
        } else {
            throw new Error(data.error?.message || 'Gagal upload foto');
        }
    } catch (err) {
        throw new Error('Gagal menghubungi server upload foto');
    }
}

const form = document.getElementById('formBlog');
const tableBody = document.getElementById('tableBody');
const btnCancel = document.getElementById('btnCancel');
const formTitle = document.getElementById('formTitle');

let editingId = null;

async function fetchBlogs() {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat data...</td></tr>';
    try {
        const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        tableBody.innerHTML = '';
        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada artikel.</td></tr>';
            return;
        }

        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            const date = data.createdAt ? data.createdAt.toDate().toLocaleDateString('id-ID') : 'Baru saja';
            
            tableBody.innerHTML += `
                <tr>
                    <td><img src="${data.gambar}" width="60" height="40" style="object-fit:cover; border-radius:4px;"></td>
                    <td class="fw-bold">${data.judul}</td>
                    <td><span class="badge bg-secondary">${data.kategori}</span></td>
                    <td>${date}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary me-1" onclick="editBlog('${id}', \`${data.judul}\`, '${data.kategori}', '${data.gambar}', \`${data.isi}\`)"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteBlog('${id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (error) {
        console.error("Error fetching blogs: ", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data.</td></tr>';
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';

    const blogData = {
        judul: document.getElementById('judul').value,
        kategori: document.getElementById('kategori').value,
        isi: document.getElementById('isi').value
    };

    const fileInput = document.getElementById('gambarFile');
    const file = fileInput.files[0];

    try {
        if (file) {
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Mengunggah Gambar...';
            blogData.gambar = await uploadToCloudinary(file);
        } else if (!editingId) {
            throw new Error("Gambar wajib diunggah untuk artikel baru.");
        }

        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan Data...';

        if (editingId) {
            await updateDoc(doc(db, "blogs", editingId), blogData);
        } else {
            blogData.createdAt = serverTimestamp();
            await addDoc(collection(db, "blogs"), blogData);
        }
        
        form.reset();
        resetForm();
        fetchBlogs();
    } catch (error) {
        console.error("Error saving blog: ", error);
        alert("Gagal menyimpan artikel: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Simpan Artikel';
    }
});

window.deleteBlog = async (id) => {
    if (confirm('Yakin ingin menghapus artikel ini?')) {
        await deleteDoc(doc(db, "blogs", id));
        fetchBlogs();
    }
};

window.editBlog = (id, judul, kategori, gambar, isi) => {
    editingId = id;
    document.getElementById('judul').value = judul;
    document.getElementById('kategori').value = kategori;
    document.getElementById('isi').value = isi;
    document.getElementById('gambarFile').removeAttribute('required'); // tidak wajib diisi saat edit
    
    formTitle.textContent = 'Edit Artikel';
    btnCancel.classList.remove('d-none');
    window.scrollTo(0, 0);
};

function resetForm() {
    editingId = null;
    formTitle.textContent = 'Tulis Artikel Baru';
    btnCancel.classList.add('d-none');
    document.getElementById('gambarFile').setAttribute('required', 'true');
    form.reset();
}

btnCancel.addEventListener('click', resetForm);

fetchBlogs();
