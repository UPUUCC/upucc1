import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "mvhjuh83";
const CLOUDINARY_UPLOAD_PRESET = "ganti_dengan_upload_preset_anda";

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
            throw new Error(data.error?.message || 'Gagal upload gambar');
        }
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw new Error("Gagal mengupload gambar ke Cloudinary.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('prestasiTableBody');
    const selAddDiv = document.getElementById('addDivisi');
    const selEditDiv = document.getElementById('editDivisi');
    
    const formAdd = document.getElementById('formAddPrestasi');
    const btnAdd = document.getElementById('btnAdd');
    const addAlert = document.getElementById('addAlert');

    const formEdit = document.getElementById('formEditPrestasi');
    const btnEditSave = document.getElementById('btnEditSave');
    const editAlert = document.getElementById('editAlert');

    let divisions = [];
    let prestasiData = [];

    async function loadDivisi() {
        try {
            const snap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
            snap.forEach(d => {
                divisions.push({ id: d.id, nama: d.data().nama });
                const opt1 = document.createElement('option');
                opt1.value = d.id;
                opt1.textContent = d.data().nama;
                selAddDiv.appendChild(opt1);

                const opt2 = document.createElement('option');
                opt2.value = d.id;
                opt2.textContent = d.data().nama;
                selEditDiv.appendChild(opt2);
            });
        } catch (err) {
            console.error("Gagal load divisi", err);
        }
    }

    async function loadPrestasi() {
        try {
            const snap = await getDocs(query(collection(db, "prestasi"), orderBy("tanggal", "desc")));
            prestasiData = [];
            let html = '';

            if (snap.empty) {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada data prestasi.</td></tr>';
                return;
            }

            snap.forEach(d => {
                const p = { id: d.id, ...d.data() };
                prestasiData.push(p);

                let divName = 'Umum';
                if (p.divisi_id) {
                    const divObj = divisions.find(x => x.id === p.divisi_id);
                    if (divObj) divName = divObj.nama;
                }

                let imgSrc = p.gambarUrl || (p.gambar ? (p.gambar.startsWith('http') ? p.gambar : `/uploads/prestasi/${p.gambar}`) : 'https://via.placeholder.com/60');
                
                let tglIndo = p.tanggal;
                if (p.tanggal) {
                    const dObj = new Date(p.tanggal);
                    if (!isNaN(dObj)) {
                        tglIndo = dObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                    }
                }

                html += `
                <tr>
                  <td><img src="${imgSrc}" style="width:60px;height:60px;object-fit:cover;border-radius:5px;"></td>
                  <td>${p.judul}</td>
                  <td>${divName}</td>
                  <td>${tglIndo || '-'}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary btnEdit" data-id="${p.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger btnDelete" data-id="${p.id}"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
                `;
            });
            tableBody.innerHTML = html;
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data prestasi.</td></tr>';
        }
    }

    await loadDivisi();
    await loadPrestasi();

    // Add Prestasi
    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnAdd.disabled = true;
        btnAdd.textContent = 'Menyimpan...';
        addAlert.classList.add('d-none');

        try {
            const fileInput = document.getElementById('addGambarFile');
            let gambarUrl = '';
            if (fileInput.files.length > 0) {
                gambarUrl = await uploadToCloudinary(fileInput.files[0]);
            }

            await addDoc(collection(db, "prestasi"), {
                judul: document.getElementById('addJudul').value,
                divisi_id: document.getElementById('addDivisi').value,
                tanggal: document.getElementById('addTanggal').value,
                deskripsi: document.getElementById('addDeskripsi').value,
                gambarUrl: gambarUrl,
                created_at: new Date()
            });

            formAdd.reset();
            addAlert.className = 'alert alert-success mt-2 mb-3';
            addAlert.textContent = 'Berhasil menambah prestasi!';
            addAlert.classList.remove('d-none');

            await loadPrestasi();
        } catch (err) {
            console.error(err);
            addAlert.className = 'alert alert-danger mt-2 mb-3';
            addAlert.textContent = 'Gagal: ' + err.message;
            addAlert.classList.remove('d-none');
        } finally {
            btnAdd.disabled = false;
            btnAdd.innerHTML = '<i class="bi bi-plus"></i> Tambah';
            setTimeout(() => addAlert.classList.add('d-none'), 3000);
        }
    });

    // Edit & Delete
    tableBody.addEventListener('click', async (e) => {
        const btnDel = e.target.closest('.btnDelete');
        if (btnDel) {
            if (confirm('Yakin ingin menghapus prestasi ini?')) {
                try {
                    await deleteDoc(doc(db, "prestasi", btnDel.getAttribute('data-id')));
                    await loadPrestasi();
                } catch (err) {
                    alert('Gagal menghapus: ' + err.message);
                }
            }
        }

        const btnEdit = e.target.closest('.btnEdit');
        if (btnEdit) {
            const id = btnEdit.getAttribute('data-id');
            const p = prestasiData.find(x => x.id === id);
            if (p) {
                editAlert.classList.add('d-none');
                document.getElementById('editJudul').value = p.judul || '';
                document.getElementById('editDivisi').value = p.divisi_id || '';
                document.getElementById('editTanggal').value = p.tanggal || '';
                document.getElementById('editDeskripsi').value = p.deskripsi || '';
                document.getElementById('editGambarFile').value = '';
                formEdit.setAttribute('data-id', id);
                new bootstrap.Modal(document.getElementById('modalEditPrestasi')).show();
            }
        }
    });

    // Save Edit
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnEditSave.disabled = true;
        btnEditSave.textContent = 'Menyimpan...';
        editAlert.classList.add('d-none');

        try {
            const id = formEdit.getAttribute('data-id');
            const fileInput = document.getElementById('editGambarFile');
            
            const updateData = {
                judul: document.getElementById('editJudul').value,
                divisi_id: document.getElementById('editDivisi').value,
                tanggal: document.getElementById('editTanggal').value,
                deskripsi: document.getElementById('editDeskripsi').value,
            };

            if (fileInput.files.length > 0) {
                updateData.gambarUrl = await uploadToCloudinary(fileInput.files[0]);
            }

            await updateDoc(doc(db, "prestasi", id), updateData);
            
            bootstrap.Modal.getInstance(document.getElementById('modalEditPrestasi')).hide();
            await loadPrestasi();
        } catch (err) {
            console.error(err);
            editAlert.className = 'alert alert-danger';
            editAlert.textContent = 'Gagal: ' + err.message;
            editAlert.classList.remove('d-none');
        } finally {
            btnEditSave.disabled = false;
            btnEditSave.textContent = 'Simpan';
        }
    });
});
