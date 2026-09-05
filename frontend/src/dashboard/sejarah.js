import { db } from '../firebase.js';
import { collection, getDocs, query, orderBy, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    const formUmum = document.getElementById('formSejarahUmum');
    const kontenUmum = document.getElementById('kontenUmum');
    const btnUmum = document.getElementById('btnUmum');
    const alertUmum = document.getElementById('alertUmum');
    const divContainer = document.getElementById('sejarahDivisiContainer');

    // 1. Fetch Sejarah Umum
    try {
        const docRef = doc(db, "sejarah", "umum");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            kontenUmum.value = docSnap.data().konten || '';
        } else {
            kontenUmum.value = '';
        }
    } catch (err) {
        console.error("Gagal load sejarah umum", err);
    }

    // 2. Fetch Divisions & Sejarah Divisi
    try {
        const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
        let html = '';
        const divisions = [];
        divSnap.forEach(d => {
            divisions.push({ id: d.id, nama: d.data().nama });
        });

        // For each division, fetch its sejarah
        for (const d of divisions) {
            let konten = '';
            const sdRef = doc(db, "sejarah", `divisi_${d.id}`);
            const sdSnap = await getDoc(sdRef);
            if (sdSnap.exists()) {
                konten = sdSnap.data().konten || '';
            }

            html += `
            <div class="card border-0 shadow-sm p-4 mb-3">
              <h5>Sejarah Divisi ${d.nama}</h5>
              <div id="alertDivisi_${d.id}" class="alert d-none"></div>
              <form class="formSejarahDivisi" data-id="${d.id}">
                <textarea class="form-control mb-3" rows="4" id="kontenDivisi_${d.id}">${konten}</textarea>
                <button type="submit" class="btn btn-primary btn-sm btnDivisi" data-id="${d.id}"><i class="bi bi-save"></i> Simpan</button>
              </form>
            </div>
            `;
        }

        if (divisions.length === 0) {
            html = '<div class="alert alert-warning">Belum ada divisi yang terdaftar.</div>';
        }
        divContainer.innerHTML = html;

        // Attach listeners to division forms
        document.querySelectorAll('.formSejarahDivisi').forEach(form => {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const divId = form.getAttribute('data-id');
                const btn = form.querySelector('.btnDivisi');
                const alert = document.getElementById(`alertDivisi_${divId}`);
                const kontenVal = document.getElementById(`kontenDivisi_${divId}`).value;

                btn.disabled = true;
                btn.textContent = 'Menyimpan...';
                alert.classList.add('d-none');

                try {
                    await setDoc(doc(db, "sejarah", `divisi_${divId}`), {
                        divisi_id: divId,
                        konten: kontenVal,
                        updatedAt: new Date()
                    }, { merge: true });

                    alert.className = 'alert alert-success mt-2';
                    alert.textContent = 'Berhasil disimpan!';
                    alert.classList.remove('d-none');
                } catch (err) {
                    console.error(err);
                    alert.className = 'alert alert-danger mt-2';
                    alert.textContent = 'Gagal menyimpan: ' + err.message;
                    alert.classList.remove('d-none');
                } finally {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="bi bi-save"></i> Simpan';
                    setTimeout(() => alert.classList.add('d-none'), 3000);
                }
            });
        });

    } catch (err) {
        console.error("Gagal load divisi", err);
        divContainer.innerHTML = '<div class="alert alert-danger">Gagal memuat data sejarah divisi.</div>';
    }

    // Save Sejarah Umum
    formUmum.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnUmum.disabled = true;
        btnUmum.textContent = 'Menyimpan...';
        alertUmum.classList.add('d-none');

        try {
            await setDoc(doc(db, "sejarah", "umum"), {
                judul: 'Sejarah UPUCC',
                konten: kontenUmum.value,
                updatedAt: new Date()
            }, { merge: true });

            alertUmum.className = 'alert alert-success mt-3';
            alertUmum.textContent = 'Berhasil menyimpan sejarah umum!';
            alertUmum.classList.remove('d-none');
        } catch (err) {
            console.error(err);
            alertUmum.className = 'alert alert-danger mt-3';
            alertUmum.textContent = 'Gagal menyimpan: ' + err.message;
            alertUmum.classList.remove('d-none');
        } finally {
            btnUmum.disabled = false;
            btnUmum.innerHTML = '<i class="bi bi-save"></i> Simpan';
            setTimeout(() => alertUmum.classList.add('d-none'), 3000);
        }
    });
});
