import { db } from './firebase.js';
import { collection, getDocs, addDoc, serverTimestamp, query, orderBy } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('formPendaftaran');
  const btnSubmit = document.getElementById('btnSubmit');
  const spinnerSubmit = document.getElementById('spinnerSubmit');
  const selectDivisi = document.getElementById('divisi');
  const alertPlaceholder = document.getElementById('alertPlaceholder');

  // Fungsi untuk menampilkan alert pesan
  const showAlert = (message, type) => {
    const wrapper = document.createElement('div');
    wrapper.innerHTML = [
      `<div class="alert alert-${type} alert-dismissible shadow-sm fade show" role="alert">`,
      `   <div>${message}</div>`,
      '   <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>',
      '</div>'
    ].join('');
    alertPlaceholder.innerHTML = ''; // bersihkan alert sebelumnya
    alertPlaceholder.append(wrapper);
  };

  // Memuat pilihan Divisi dari Firebase
  try {
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    if (!divSnap.empty) {
      let optionsHTML = '<option value="" selected disabled>-- Pilih Divisi --</option>';
      divSnap.forEach((docSnap) => {
        const d = docSnap.data();
        optionsHTML += `<option value="${d.nama}">${d.nama}</option>`;
      });
      selectDivisi.innerHTML = optionsHTML;
    } else {
      selectDivisi.innerHTML = '<option value="" selected disabled>-- Tidak ada divisi yang tersedia --</option>';
    }
  } catch (error) {
    console.error("Gagal memuat divisi:", error);
    selectDivisi.innerHTML = '<option value="" selected disabled>-- Gagal memuat divisi --</option>';
  }

  // Menangani pengiriman form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Tampilkan loading state
    btnSubmit.disabled = true;
    spinnerSubmit.classList.remove('d-none');
    alertPlaceholder.innerHTML = '';

    // Ambil data form
    const formData = new FormData(form);
    const data = {
      nama: formData.get('nama').trim(),
      email: formData.get('email').trim(),
      whatsapp: formData.get('whatsapp').trim(),
      nim: formData.get('nim').trim(),
      prodi: formData.get('prodi').trim(),
      semester: formData.get('semester'),
      divisi: formData.get('divisi'),
      alasan: formData.get('alasan').trim(),
      tanggal_daftar: serverTimestamp(),
      status: "Menunggu" // Status default untuk admin
    };

    try {
      // Simpan ke Firestore koleksi "pendaftar"
      await addDoc(collection(db, "pendaftar"), data);
      
      // Sukses
      showAlert('<strong>Berhasil!</strong> Pendaftaran Anda telah terkirim. Tunggu informasi selanjutnya dari kami.', 'success');
      form.reset(); // Kosongkan form
    } catch (error) {
      console.error("Gagal mengirim pendaftaran:", error);
      // Cek apakah error karena permissions
      if (error.code === 'permission-denied') {
        showAlert('<strong>Gagal!</strong> Anda tidak memiliki izin untuk mengirim data. Admin belum membuka akses pendaftaran (Aturan Firebase).', 'danger');
      } else {
        showAlert('<strong>Terjadi Kesalahan!</strong> Gagal mengirim pendaftaran. Coba beberapa saat lagi.', 'danger');
      }
    } finally {
      // Kembalikan tombol ke state normal
      btnSubmit.disabled = false;
      spinnerSubmit.classList.add('d-none');
    }
  });
});
