import Swal from "sweetalert2";
import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, addDoc, updateDoc, deleteDoc } from "firebase/firestore";

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
        console.error("Cloudinary Error:", err);
        throw new Error("Gagal mengupload foto ke Cloudinary.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('acaraContainer');
    const formAdd = document.getElementById('formAddAcara');
    const btnAdd = document.getElementById('btnAdd');
    const addAlert = document.getElementById('addAlert');

    const formEdit = document.getElementById('formEditAcara');
    const btnEditSave = document.getElementById('btnEditSave');
    const editAlert = document.getElementById('editAlert');

    const formAddFoto = document.getElementById('formAddFoto');
    const btnAddFotoSave = document.getElementById('btnAddFotoSave');
    const addFotoAlert = document.getElementById('addFotoAlert');

    let acaraData = [];

    async function loadAcara() {
        try {
            const snap = await getDocs(query(collection(db, "acara"), orderBy("created_at", "desc")));
            acaraData = [];
            let html = '';
            
            if (snap.empty) {
                container.innerHTML = '<div class="alert alert-info">Belum ada postingan acara.</div>';
                return;
            }

            snap.forEach(d => {
                const a = { id: d.id, ...d.data() };
                acaraData.push(a);

                let dateStr = a.created_at;
                if (a.created_at && typeof a.created_at.toDate === 'function') {
                    dateStr = a.created_at.toDate().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
                }

                let photosHtml = '';
                if (a.fotos && a.fotos.length > 0) {
                    a.fotos.forEach((foto, idx) => {
                        const src = foto.startsWith('http') ? foto : `/uploads/acara/${foto}`;
                        photosHtml += `
                        <div style="position:relative; display:inline-block; margin-right: 10px; margin-bottom: 10px;">
                          <img src="${src}" style="width:100px;height:100px;object-fit:cover;border-radius:8px;">
                          <button class="btn btn-sm btn-danger btnDeleteFoto" data-id="${a.id}" data-index="${idx}" style="position:absolute;top:2px;right:2px;padding:0 6px;">&times;</button>
                        </div>
                        `;
                    });
                } else {
                    photosHtml = '<p class="text-muted small">Belum ada foto.</p>';
                }

                html += `
                <div class="card border-0 shadow-sm p-4 mb-3">
                  <div class="d-flex justify-content-between">
                    <h5>${a.judul}</h5>
                    <div>
                      <button class="btn btn-sm btn-outline-primary btnEdit" data-id="${a.id}"><i class="bi bi-pencil"></i> Edit Teks</button>
                      <button class="btn btn-sm btn-outline-success btnAddFoto" data-id="${a.id}"><i class="bi bi-image"></i> Tambah Foto</button>
                      <button class="btn btn-sm btn-outline-danger btnDelete" data-id="${a.id}"><i class="bi bi-trash"></i> Hapus</button>
                    </div>
                  </div>
                  <p class="text-muted small">${dateStr}</p>
                  <p style="white-space: pre-wrap;">${a.deskripsi}</p>
                  <div class="d-flex flex-wrap gap-2 mt-3">
                    ${photosHtml}
                  </div>
                </div>
                `;
            });
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="alert alert-danger">Gagal memuat acara.</div>';
        }
    }

    await loadAcara();

    // Add Acara
    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnAdd.disabled = true;
        btnAdd.textContent = 'Menyimpan...';
        addAlert.classList.add('d-none');

        try {
            const files = document.getElementById('addFotos').files;
            const fotoUrls = [];
            
            for (let i = 0; i < files.length; i++) {
                const url = await uploadToCloudinary(files[i]);
                if (url) fotoUrls.push(url);
            }

            await addDoc(collection(db, "acara"), {
                judul: document.getElementById('addJudul').value,
                deskripsi: document.getElementById('addDeskripsi').value,
                fotos: fotoUrls,
                created_at: new Date()
            });

            formAdd.reset();
            addAlert.className = 'alert alert-success mt-2 mb-3';
            addAlert.textContent = 'Berhasil memposting acara!';
            addAlert.classList.remove('d-none');
            
            await loadAcara();
        } catch (err) {
            console.error(err);
            addAlert.className = 'alert alert-danger mt-2 mb-3';
            addAlert.textContent = 'Gagal: ' + err.message;
            addAlert.classList.remove('d-none');
        } finally {
            btnAdd.disabled = false;
            btnAdd.innerHTML = '<i class="bi bi-plus"></i> Posting';
        }
    });

    // Delegated events
    container.addEventListener('click', async (e) => {
        const btnDel = e.target.closest('.btnDelete');
        if (btnDel) {
            const confirmResult = await Swal.fire({title: 'Yakin ingin menghapus seluruh postingan acara ini?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'});
            if (confirmResult.isConfirmed) {
                try {
                    await deleteDoc(doc(db, "acara", btnDel.getAttribute('data-id')));
                    await loadAcara();
                } catch (err) {
                    Swal.fire({icon: 'info', title: 'Perhatian', text: 'Gagal menghapus: ' + err.message})
                }
            }
        }

        const btnEdit = e.target.closest('.btnEdit');
        if (btnEdit) {
            const id = btnEdit.getAttribute('data-id');
            const a = acaraData.find(x => x.id === id);
            if (a) {
                editAlert.classList.add('d-none');
                document.getElementById('editJudul').value = a.judul;
                document.getElementById('editDeskripsi').value = a.deskripsi;
                formEdit.setAttribute('data-id', id);
                new bootstrap.Modal(document.getElementById('modalEditAcara')).show();
            }
        }

        const btnAddFoto = e.target.closest('.btnAddFoto');
        if (btnAddFoto) {
            const id = btnAddFoto.getAttribute('data-id');
            addFotoAlert.classList.add('d-none');
            formAddFoto.reset();
            formAddFoto.setAttribute('data-id', id);
            new bootstrap.Modal(document.getElementById('modalAddFoto')).show();
        }

        const btnDelFoto = e.target.closest('.btnDeleteFoto');
        if (btnDelFoto) {
            const confirmResult = await Swal.fire({title: 'Yakin ingin menghapus foto ini?', icon: 'warning', showCancelButton: true, confirmButtonText: 'Ya', cancelButtonText: 'Batal'});
            if (confirmResult.isConfirmed) {
                try {
                    const id = btnDelFoto.getAttribute('data-id');
                    const idx = parseInt(btnDelFoto.getAttribute('data-index'));
                    const a = acaraData.find(x => x.id === id);
                    if (a) {
                        const newFotos = [...a.fotos];
                        newFotos.splice(idx, 1);
                        await updateDoc(doc(db, "acara", id), { fotos: newFotos });
                        await loadAcara();
                    }
                } catch (err) {
                    Swal.fire({icon: 'info', title: 'Perhatian', text: 'Gagal menghapus foto: ' + err.message})
                }
            }
        }
    });

    // Save Edit Teks
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnEditSave.disabled = true;
        btnEditSave.textContent = 'Menyimpan...';
        
        try {
            const id = formEdit.getAttribute('data-id');
            await updateDoc(doc(db, "acara", id), {
                judul: document.getElementById('editJudul').value,
                deskripsi: document.getElementById('editDeskripsi').value
            });
            
            bootstrap.Modal.getInstance(document.getElementById('modalEditAcara')).hide();
            await loadAcara();
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

    // Save Tambah Foto
    formAddFoto.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnAddFotoSave.disabled = true;
        btnAddFotoSave.textContent = 'Uploading...';
        
        try {
            const id = formAddFoto.getAttribute('data-id');
            const files = document.getElementById('newFotos').files;
            const newUrls = [];
            
            for (let i = 0; i < files.length; i++) {
                const url = await uploadToCloudinary(files[i]);
                if (url) newUrls.push(url);
            }

            const a = acaraData.find(x => x.id === id);
            const currentFotos = a.fotos || [];
            
            await updateDoc(doc(db, "acara", id), {
                fotos: [...currentFotos, ...newUrls]
            });
            
            bootstrap.Modal.getInstance(document.getElementById('modalAddFoto')).hide();
            await loadAcara();
        } catch (err) {
            console.error(err);
            addFotoAlert.className = 'alert alert-danger mt-2 mb-3';
            addFotoAlert.textContent = 'Gagal upload: ' + err.message;
            addFotoAlert.classList.remove('d-none');
        } finally {
            btnAddFotoSave.disabled = false;
            btnAddFotoSave.textContent = 'Upload';
        }
    });
});
