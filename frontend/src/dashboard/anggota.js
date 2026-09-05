import { app, auth, db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, addDoc, updateDoc, deleteDoc, setDoc } from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";

// Secondary App for creating users without logging out the admin
const secondaryApp = initializeApp(app.options, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// Konfigurasi Cloudinary (Silakan ganti dengan milik Anda)
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
        throw new Error("Gagal mengupload gambar ke Cloudinary. Pastikan Cloud Name dan Upload Preset sudah diatur dengan benar di kode.");
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const tableBody = document.getElementById('anggotaTableBody');
    const formAdd = document.getElementById('formAddAnggota');
    const addAlert = document.getElementById('addAlert');
    const btnAdd = document.getElementById('btnAdd');
    
    const formEdit = document.getElementById('formEditAnggota');
    const editAlert = document.getElementById('editAlert');
    const btnEditSave = document.getElementById('btnEditSave');

    // Populate divisions
    let divisions = [];
    try {
        const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
        let divOptions = '<option value="">-- Tidak ada / Pengurus Inti --</option>';
        if (divSnap.empty) {
            const defaultDivisions = [
                { id: "1_programming", nama: "Programming" },
                { id: "2_netsect", nama: "Network Security" },
                { id: "3_knowtech", nama: "Knowledge of Technology" },
                { id: "4_multimedia", nama: "Multimedia" }
            ];
            for (const d of defaultDivisions) {
                await setDoc(doc(db, "divisions", d.id), d);
                divisions.push(d);
                divOptions += `<option value="${d.id}">${d.nama}</option>`;
            }
        } else {
            divSnap.forEach(d => {
                divisions.push({ id: d.id, ...d.data() });
                divOptions += `<option value="${d.id}">${d.data().nama}</option>`;
            });
        }
        document.getElementById('addDivisi').innerHTML = divOptions;
        document.getElementById('editDivisi').innerHTML = divOptions;
    } catch (err) {
        console.error("Gagal memuat divisi", err);
    }

    const roleMap = {
        'ketum': 'Ketua Umum',
        'waketum': 'Wakil Ketua Umum',
        'bendahara': 'Bendahara',
        'sekretaris': 'Sekretaris',
        'kadiv': 'Kepala Divisi',
        'wakadiv': 'Wakil Kepala Divisi',
        'anggota': 'Anggota Divisi'
    };

    let membersData = [];

    // Load Members
    async function loadMembers() {
        tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Memuat data anggota...</td></tr>';
        try {
            const q = query(collection(db, "members"), orderBy("urutan", "asc"));
            const snapshot = await getDocs(q);
            membersData = [];
            
            if(snapshot.empty) {
                tableBody.innerHTML = '<tr><td colspan="8" class="text-center">Belum ada anggota.</td></tr>';
                return;
            }

            let html = '';
            snapshot.forEach(docSnap => {
                const m = { id: docSnap.id, ...docSnap.data() };
                membersData.push(m);
                
                let divNama = '-';
                if (m.divisi_id) {
                    const found = divisions.find(d => d.id === m.divisi_id);
                    if (found) divNama = found.nama;
                }

                const fotoUrl = m.fotoUrl || 'https://via.placeholder.com/50';
                const statusBadge = m.status === 'aktif' ? '<span class="badge bg-success">Aktif</span>' : '<span class="badge bg-danger">Nonaktif</span>';

                html += `
                <tr>
                  <td><img src="${fotoUrl}" style="width:50px;height:50px;object-fit:cover;border-radius:50%;"></td>
                  <td>${m.nama}</td>
                  <td>${m.email}</td>
                  <td><span class="badge bg-secondary">${roleMap[m.role] || m.role}</span></td>
                  <td>${divNama}</td>
                  <td>${m.jabatan_text || '-'}</td>
                  <td>${statusBadge}</td>
                  <td>
                    <button class="btn btn-sm btn-outline-primary btn-edit" data-id="${m.id}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-outline-danger btn-delete" data-id="${m.id}"><i class="bi bi-trash"></i></button>
                  </td>
                </tr>
                `;
            });
            tableBody.innerHTML = html;
        } catch (err) {
            console.error(err);
            tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-danger">Gagal memuat data.</td></tr>';
        }
    }

    await loadMembers();

    // Add Member
    formAdd.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnAdd.disabled = true;
        btnAdd.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Menyimpan...';
        addAlert.classList.add('d-none');

        const email = document.getElementById('addEmail').value;
        const password = document.getElementById('addPassword').value;

        try {
            // Upload Foto jika ada
            let fotoUrl = '';
            const fileInput = document.getElementById('addFotoFile');
            if (fileInput.files.length > 0) {
                fotoUrl = await uploadToCloudinary(fileInput.files[0]);
            }

            // 1. Create user in Firebase Auth using secondary app
            const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
            const uid = userCredential.user.uid;
            await signOut(secondaryAuth); // sign out from secondary app

            // 2. Save data to Firestore 'members' collection using UID as document ID
            await setDoc(doc(db, "members", uid), {
                nama: document.getElementById('addNama').value,
                email: email,
                fotoUrl: fotoUrl,
                role: document.getElementById('addRole').value,
                divisi_id: document.getElementById('addDivisi').value,
                jabatan_text: document.getElementById('addJabatanText').value,
                urutan: parseInt(document.getElementById('addUrutan').value) || 0,
                tampil_struktur: document.getElementById('addTampilStruktur').checked,
                status: 'aktif',
                createdAt: new Date()
            });

            formAdd.reset();
            addAlert.className = 'alert alert-success';
            addAlert.textContent = 'Berhasil menambahkan anggota!';
            addAlert.classList.remove('d-none');
            await loadMembers();
        } catch (err) {
            console.error(err);
            addAlert.className = 'alert alert-danger';
            addAlert.textContent = 'Gagal: ' + err.message;
            addAlert.classList.remove('d-none');
        } finally {
            btnAdd.disabled = false;
            btnAdd.innerHTML = '<i class="bi bi-plus"></i> Tambah Anggota';
        }
    });

    // Delete Member
    tableBody.addEventListener('click', async (e) => {
        const btnDelete = e.target.closest('.btn-delete');
        if (btnDelete) {
            const id = btnDelete.getAttribute('data-id');
            if (confirm('Yakin ingin menghapus anggota ini? Catatan: Akun Auth Firebase tidak akan terhapus otomatis dari sini, hanya profil datanya.')) {
                try {
                    await deleteDoc(doc(db, "members", id));
                    await loadMembers();
                } catch (err) {
                    alert('Gagal menghapus: ' + err.message);
                }
            }
        }

        // Edit Modal Trigger
        const btnEdit = e.target.closest('.btn-edit');
        if (btnEdit) {
            const id = btnEdit.getAttribute('data-id');
            const m = membersData.find(x => x.id === id);
            if (m) {
                document.getElementById('editAlert').classList.add('d-none');
                document.getElementById('editNama').value = m.nama || '';
                
                // Tampilkan foto saat ini (jika ada)
                const preview = document.getElementById('currentFotoPreview');
                if (m.fotoUrl) {
                    preview.innerHTML = `<img src="${m.fotoUrl}" style="height: 50px; border-radius: 5px;"> <span class="small text-muted d-block mt-1">Foto tersimpan</span>`;
                } else if (m.foto) {
                    const src = m.foto.startsWith('http') ? m.foto : `/uploads/anggota/${m.foto}`;
                    preview.innerHTML = `<img src="${src}" style="height: 50px; border-radius: 5px;"> <span class="small text-muted d-block mt-1">Foto tersimpan (lama)</span>`;
                } else {
                    preview.innerHTML = '<span class="small text-muted">Belum ada foto</span>';
                }

                document.getElementById('editFotoFile').value = ''; // Reset file input
                document.getElementById('editRole').value = m.role || 'anggota';
                document.getElementById('editDivisi').value = m.divisi_id || '';
                document.getElementById('editJabatanText').value = m.jabatan_text || '';
                document.getElementById('editUrutan').value = m.urutan || 0;
                document.getElementById('editStatus').value = m.status || 'aktif';
                document.getElementById('editTampilStruktur').checked = m.tampil_struktur !== false;
                
                formEdit.setAttribute('data-id', id);
                
                const modal = new bootstrap.Modal(document.getElementById('modalEditAnggota'));
                modal.show();
            }
        }
    });

    // Save Edit
    formEdit.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnEditSave.disabled = true;
        btnEditSave.textContent = 'Menyimpan...';
        
        const id = formEdit.getAttribute('data-id');
        try {
            const m = membersData.find(x => x.id === id);
            let fotoUrl = m.fotoUrl || ''; // Default ke URL yang sudah ada

            const fileInput = document.getElementById('editFotoFile');
            if (fileInput.files.length > 0) {
                fotoUrl = await uploadToCloudinary(fileInput.files[0]);
            }

            await updateDoc(doc(db, "members", id), {
                nama: document.getElementById('editNama').value,
                fotoUrl: fotoUrl,
                role: document.getElementById('editRole').value,
                divisi_id: document.getElementById('editDivisi').value,
                jabatan_text: document.getElementById('editJabatanText').value,
                urutan: parseInt(document.getElementById('editUrutan').value) || 0,
                status: document.getElementById('editStatus').value,
                tampil_struktur: document.getElementById('editTampilStruktur').checked,
                updatedAt: new Date()
            });

            editAlert.className = 'alert alert-success';
            editAlert.textContent = 'Berhasil memperbarui data!';
            editAlert.classList.remove('d-none');
            
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditAnggota'));
                modal.hide();
                loadMembers();
            }, 1000);

        } catch (err) {
            console.error(err);
            editAlert.className = 'alert alert-danger';
            editAlert.textContent = 'Gagal: ' + err.message;
            editAlert.classList.remove('d-none');
        } finally {
            btnEditSave.disabled = false;
            btnEditSave.textContent = 'Simpan Perubahan';
        }
    });
});
