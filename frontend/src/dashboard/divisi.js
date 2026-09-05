import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";

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
            throw new Error(data.error?.message || 'Gagal upload logo');
        }
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw new Error("Gagal mengupload logo ke Cloudinary.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const divContainer = document.getElementById('divisiContainer');
    
    let divisions = [];

    async function loadDivisi() {
        try {
            const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
            divisions = [];
            divSnap.forEach(d => {
                divisions.push({ id: d.id, ...d.data() });
            });

            let html = '';
            divisions.forEach(d => {
                const logoSrc = d.logoUrl || (d.logo ? (d.logo.startsWith('http') ? d.logo : `/uploads/divisi/${d.logo}`) : `https://via.placeholder.com/70?text=${d.nama.charAt(0)}`);
                
                html += `
                <div class="col-md-6">
                  <div class="card border-0 shadow-sm p-4">
                    <div id="alertDivisi_${d.id}" class="alert d-none"></div>
                    <div class="d-flex gap-3 align-items-center mb-3">
                      <img src="${logoSrc}" style="width:70px;height:70px;object-fit:contain;background:#f8f9fa;border-radius:10px;padding:5px;">
                      <h5 class="mb-0">${d.nama}</h5>
                    </div>
                    <form class="formEditDivisi" data-id="${d.id}">
                      <div class="mb-2">
                        <label class="form-label small">Nama Divisi</label>
                        <input type="text" id="nama_${d.id}" class="form-control" value="${d.nama}" required>
                      </div>
                      <div class="mb-2">
                        <label class="form-label small">Logo Divisi (Upload via Cloudinary)</label>
                        <input type="file" id="logoFile_${d.id}" class="form-control" accept="image/*">
                      </div>
                      <div class="mb-2">
                        <label class="form-label small">Deskripsi / Informasi Divisi</label>
                        <textarea id="deskripsi_${d.id}" class="form-control" rows="3">${d.deskripsi || ''}</textarea>
                      </div>
                      <div class="mb-2">
                        <label class="form-label small">Sejarah Singkat Divisi</label>
                        <textarea id="sejarah_${d.id}" class="form-control" rows="3">${d.sejarah || ''}</textarea>
                      </div>
                      <button type="submit" class="btn btn-sm btn-primary btnSaveDivisi" data-id="${d.id}"><i class="bi bi-save"></i> Simpan</button>
                    </form>
                  </div>
                </div>
                `;
            });
            divContainer.innerHTML = html;

            document.querySelectorAll('.formEditDivisi').forEach(form => {
                form.addEventListener('submit', async (e) => {
                    e.preventDefault();
                    const id = form.getAttribute('data-id');
                    const btn = form.querySelector('.btnSaveDivisi');
                    const alert = document.getElementById(`alertDivisi_${id}`);
                    
                    btn.disabled = true;
                    btn.textContent = 'Menyimpan...';
                    alert.classList.add('d-none');

                    try {
                        const fileInput = document.getElementById(`logoFile_${id}`);
                        let newLogoUrl = '';
                        if (fileInput.files.length > 0) {
                            newLogoUrl = await uploadToCloudinary(fileInput.files[0]);
                        }

                        const updateData = {
                            nama: document.getElementById(`nama_${id}`).value,
                            deskripsi: document.getElementById(`deskripsi_${id}`).value,
                            sejarah: document.getElementById(`sejarah_${id}`).value,
                            updatedAt: new Date()
                        };

                        if (newLogoUrl) {
                            updateData.logoUrl = newLogoUrl;
                        }

                        await updateDoc(doc(db, "divisions", id), updateData);

                        alert.className = 'alert alert-success mt-2 mb-3';
                        alert.textContent = 'Berhasil memperbarui divisi!';
                        alert.classList.remove('d-none');

                        setTimeout(() => {
                            loadDivisi();
                        }, 1000);

                    } catch (err) {
                        console.error(err);
                        alert.className = 'alert alert-danger mt-2 mb-3';
                        alert.textContent = 'Gagal: ' + err.message;
                        alert.classList.remove('d-none');
                    } finally {
                        btn.disabled = false;
                        btn.innerHTML = '<i class="bi bi-save"></i> Simpan';
                    }
                });
            });

        } catch (err) {
            console.error("Gagal load divisi", err);
            divContainer.innerHTML = '<div class="alert alert-danger">Gagal memuat data divisi.</div>';
        }
    }

    await loadDivisi();
});
