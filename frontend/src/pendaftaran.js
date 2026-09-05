import Swal from "sweetalert2";
import { db } from './firebase.js';
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const CLOUDINARY_CLOUD_NAME = "mvhjuh83"; // The one user provided
const CLOUDINARY_UPLOAD_PRESET = "ml_default";

async function uploadToCloudinary(file) {
    if (!file) return '';
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    try {
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();
        if (data.secure_url) {
            return data.secure_url;
        } else {
            console.error("Cloudinary upload failed", data);
            throw new Error("Upload gagal");
        }
    } catch (err) {
        console.error("Cloudinary Error:", err);
        throw err;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('pendaftaranForm');
    const closedMsg = document.getElementById('closedMessage');
    
    // Check if form is open
    try {
        const docSnap = await getDoc(doc(db, "settings", "pendaftaran"));
        if (docSnap.exists() && docSnap.data().isOpen === false) {
            closedMsg.classList.remove('d-none');
            form.classList.add('d-none');
            return; // Stop execution, form is closed
        }
        
        // If open, show form
        form.classList.remove('d-none');
        closedMsg.classList.add('d-none');
    } catch (e) {
        console.error("Gagal cek status pendaftaran", e);
        form.classList.remove('d-none'); // default to open on error
    }

    const fileInput = document.getElementById('buktiFollow');
    const fileHelpBlock = document.getElementById('fileHelpBlock');
    const submitBtn = document.getElementById('submitBtn');
    
    // File validation
    fileInput.addEventListener('change', () => {
        let valid = true;
        if (fileInput.files.length > 5) {
            valid = false;
        }
        for (let i = 0; i < fileInput.files.length; i++) {
            if (fileInput.files[i].size > 10 * 1024 * 1024) { // 10 MB
                valid = false;
            }
        }
        
        if (!valid) {
            fileHelpBlock.classList.remove('d-none');
            submitBtn.disabled = true;
        } else {
            fileHelpBlock.classList.add('d-none');
            submitBtn.disabled = false;
        }
    });

    // Form clear button
    const clearBtn = form.querySelector('button[type="button"]');
    if(clearBtn) {
        clearBtn.addEventListener('click', () => {
            form.reset();
            fileHelpBlock.classList.add('d-none');
            submitBtn.disabled = false;
        });
    }

    // Submit handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const nama = document.getElementById('nama').value.trim();
        const nohp = document.getElementById('nohp').value.trim();
        const nim = document.getElementById('nim').value.trim();
        const prodi = document.getElementById('prodi').value.trim();
        
        const semester = document.querySelector('input[name="semester"]:checked')?.value;
        const divisi = document.querySelector('input[name="divisi"]:checked')?.value;
        const files = fileInput.files;

        if (!email || !nama || !nohp || !nim || !prodi || !semester || !divisi || files.length === 0) {
            Swal.fire({icon: 'info', title: 'Perhatian', text: "Harap lengkapi semua data wajib."})
            return;
        }

        if (files.length > 5) {
            Swal.fire({icon: 'info', title: 'Perhatian', text: "Maksimal 5 file upload."})
            return;
        }

        try {
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Mengirim...';
            submitBtn.disabled = true;

            const buktiUrls = [];
            for (let i = 0; i < files.length; i++) {
                const url = await uploadToCloudinary(files[i]);
                if (url) buktiUrls.push(url);
            }

            await addDoc(collection(db, "pendaftaran"), {
                email,
                nama,
                nohp,
                nim,
                prodi,
                semester: parseInt(semester),
                divisi,
                buktiFollow: buktiUrls,
                createdAt: serverTimestamp(),
                status: "Menunggu Review" // Default status for admin
            });

            // Show success
            form.classList.add('d-none');
            document.getElementById('successMessage').classList.remove('d-none');
            window.scrollTo(0, 0);

        } catch (error) {
            console.error("Error submitting form: ", error);
            Swal.fire({icon: 'info', title: 'Perhatian', text: "Terjadi kesalahan saat mengirim pendaftaran. Silakan coba lagi."})
            submitBtn.innerHTML = 'Kirim';
            submitBtn.disabled = false;
        }
    });
});
