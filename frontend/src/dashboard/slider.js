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
            throw new Error(data.error?.message || 'Gagal upload gambar');
        }
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw new Error("Gagal mengupload gambar ke Cloudinary.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const container = document.getElementById('sliderContainer');
    
    const formAdd = document.getElementById('formAddSlider');
    const btnAdd = document.getElementById('btnAdd');
    const addAlert = document.getElementById('addAlert');

    const formEdit = document.getElementById('formEditSlider');
    const btnEditSave = document.getElementById('btnEditSave');
    const editAlert = document.getElementById('editAlert');

    let sliderData = [];

    async function loadSlider() {
        try {
            const snap = await getDocs(query(collection(db, "sliders"), orderBy("urutan", "asc")));
            sliderData = [];
            let html = '';

            if (snap.empty) {
                container.innerHTML = '<div class="col-12"><div class="alert alert-info">Belum ada data slider.</div></div>';
                return;
            }

            snap.forEach(d => {
                const s = { id: d.id, ...d.data() };
                sliderData.push(s);

                let imgSrc = s.gambarUrl || (s.gambar ? (s.gambar.startsWith('http') ? s.gambar : `/uploads/slider/${s.gambar}`) : 'https://via.placeholder.com/300x160');

                html += `
                <div class="col-md-4">
                  <div class="card border-0 shadow-sm">
                    <img src="${imgSrc}" class="card-img-top" style="height:160px;object-fit:cover;">
                    <div class="card-body">
                      <h6>${s.judul || '(tanpa judul)'}</h6>
                      <p class="small text-muted">${s.deskripsi || ''}</p>
                      <button class="btn btn-sm btn-outline-primary btnEdit" data-id="${s.id}"><i class="bi bi-pencil"></i> Edit</button>
                      <button class="btn btn-sm btn-outline-danger btnDelete" data-id="${s.id}"><i class="bi bi-trash"></i> Hapus</button>
                    </div>
                  </div>
                </div>
                `;
            });
            container.innerHTML = html;
        } catch (err) {
            console.error(err);
            container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Gagal memuat data slider.</div></div>';
        }
    }

    await loadSlider();

    // Add Slider
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

            await addDoc(collection(db, "sliders"), {
                judul: document.getElementById('addJudul').value,
                deskripsi: document.getElementById('addDeskripsi').value,
                urutan: parseInt(document.getElementById('addUrutan').value) || 0,
                gambarUrl: gambarUrl,
                created_at: new Date()
            });

            formAdd.reset();
            addAlert.className = 'alert alert-success mt-2 mb-3';
            addAlert.textContent = 'Berhasil menambah slider!';
            addAlert.classList.remove('d-none');

            await loadSlider();
        } catch (err) {
            console.error(err);
            addAlert.className = 'alert alert-danger mt-2 mb-3';
            addAlert.textContent = 'Gagal: ' + err.message;
            addAlert.classList.remove('d-none');
        } finally {
            btnAdd.disabled = false;
            btnAdd.innerHTML = '<i class="bi bi-plus"></i> Tambah Slider';
            setTimeout(() => addAlert.classList.add('d-none'), 3000);
        }
    });

    // Edit & Delete
    container.addEventListener('click', async (e) => {
        const btnDel = e.target.closest('.btnDelete');
        if (btnDel) {
            if (confirm('Yakin ingin menghapus slider ini?')) {
                try {
                    await deleteDoc(doc(db, "sliders", btnDel.getAttribute('data-id')));
                    await loadSlider();
                } catch (err) {
                    alert('Gagal menghapus: ' + err.message);
                }
            }
        }

        const btnEdit = e.target.closest('.btnEdit');
        if (btnEdit) {
            const id = btnEdit.getAttribute('data-id');
            const s = sliderData.find(x => x.id === id);
            if (s) {
                editAlert.classList.add('d-none');
                document.getElementById('editJudul').value = s.judul || '';
                document.getElementById('editDeskripsi').value = s.deskripsi || '';
                document.getElementById('editUrutan').value = s.urutan || 0;
                document.getElementById('editGambarFile').value = '';
                formEdit.setAttribute('data-id', id);
                new bootstrap.Modal(document.getElementById('modalEditSlider')).show();
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
                deskripsi: document.getElementById('editDeskripsi').value,
                urutan: parseInt(document.getElementById('editUrutan').value) || 0,
            };

            if (fileInput.files.length > 0) {
                updateData.gambarUrl = await uploadToCloudinary(fileInput.files[0]);
            }

            await updateDoc(doc(db, "sliders", id), updateData);
            
            bootstrap.Modal.getInstance(document.getElementById('modalEditSlider')).hide();
            await loadSlider();
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
