import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', () => {
    const btnLogout = document.getElementById('btnLogout');
    const btnAdminPanel = document.getElementById('btnAdminPanel');
    const formProfil = document.getElementById('formProfil');
    const btnSaveProfil = document.getElementById('btnSaveProfil');
    let currentUserDocId = null;

    btnLogout.addEventListener('click', () => {
        Swal.fire({
            title: 'Logout?',
            text: "Anda akan keluar dari sesi ini.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Logout',
            cancelButtonText: 'Batal'
        }).then((result) => {
            if (result.isConfirmed) {
                signOut(auth).then(() => {
                    window.location.href = '/login.html';
                });
            }
        });
    });

    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        // Fetch User Data from Firestore 'users' or 'anggota'
        // Since we don't know exact collection, we'll try 'users' then 'anggota'
        let userData = null;
        let isPengurus = false;
        
        try {
            // Data anggota disimpan di koleksi 'members' dengan email sebagai query
            let q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()));
            let snapshot = await getDocs(q);
            
            if (!snapshot.empty) {
                userData = snapshot.docs[0].data();
                currentUserDocId = snapshot.docs[0].id;
                // Jika bukan role anggota biasa, tampilkan tombol Panel Admin
                const role = (userData.role || '').toLowerCase();
                if (role && role !== 'anggota') {
                    btnAdminPanel.classList.remove('d-none');
                }
            }

            if (userData) {
                // Populate Profile
                const nama = userData.nama || userData.nama_lengkap || user.displayName || 'Anggota UPU-CC';
                const nim = userData.nim || 'Tidak ada NIM';
                const divisi = userData.jabatan_text || userData.divisi || userData.role || 'Anggota';
                const bio = userData.bio || '';
                const skills = userData.skills || '';
                const github = userData.github || '';
                const linkedin = userData.linkedin || '';

                document.getElementById('displayNama').textContent = nama;
                document.getElementById('cardNama').textContent = nama;
                
                document.getElementById('displayDivisi').textContent = divisi;
                document.getElementById('cardJabatan').textContent = divisi;
                
                document.getElementById('displayNim').textContent = nim;
                
                document.getElementById('inputBio').value = bio;
                document.getElementById('inputSkills').value = skills;
                document.getElementById('inputGithub').value = github;
                document.getElementById('inputLinkedin').value = linkedin;

                // Skills UI
                updateSkillsUI(skills);

                // Social Links UI
                if (github) {
                    document.getElementById('linkGithub').href = github;
                    document.getElementById('linkGithub').style.display = 'block';
                }
                if (linkedin) {
                    document.getElementById('linkLinkedin').href = linkedin;
                    document.getElementById('linkLinkedin').style.display = 'block';
                }
                if (github || linkedin) {
                    document.getElementById('noLinksMsg').style.display = 'none';
                }
                
                document.getElementById('displayAvatar').src = userData.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(nama)}&background=0f172a&color=fff&size=150`;
            } else {
                Swal.fire('Error', 'Data profil tidak ditemukan di database.', 'error');
            }
            
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    });

    function updateSkillsUI(skillsStr) {
        const container = document.getElementById('skillsContainer');
        container.innerHTML = '';
        if (!skillsStr) return;
        
        const arr = skillsStr.split(',').map(s => s.trim()).filter(s => s);
        arr.forEach(s => {
            const span = document.createElement('span');
            span.className = 'skill-badge';
            span.textContent = s;
            container.appendChild(span);
        });
    }

    document.getElementById('inputSkills').addEventListener('input', (e) => {
        updateSkillsUI(e.target.value);
    });

    formProfil.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!currentUserDocId) return;

        btnSaveProfil.disabled = true;
        btnSaveProfil.innerHTML = 'Menyimpan...';

        const updates = {
            bio: document.getElementById('inputBio').value,
            skills: document.getElementById('inputSkills').value,
            github: document.getElementById('inputGithub').value,
            linkedin: document.getElementById('inputLinkedin').value
        };

        try {
            // Selalu update ke koleksi 'members'
            await updateDoc(doc(db, 'members', currentUserDocId), updates);
            Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Profil berhasil diperbarui', timer: 1500 });
            
            if (updates.github) {
                document.getElementById('linkGithub').href = updates.github;
                document.getElementById('linkGithub').style.display = 'block';
            } else {
                document.getElementById('linkGithub').style.display = 'none';
            }

            if (updates.linkedin) {
                document.getElementById('linkLinkedin').href = updates.linkedin;
                document.getElementById('linkLinkedin').style.display = 'block';
            } else {
                document.getElementById('linkLinkedin').style.display = 'none';
            }

            if (updates.github || updates.linkedin) {
                document.getElementById('noLinksMsg').style.display = 'none';
            } else {
                document.getElementById('noLinksMsg').style.display = 'block';
            }

        } catch (err) {
            console.error(err);
            Swal.fire('Error', 'Gagal memperbarui profil.', 'error');
        } finally {
            btnSaveProfil.disabled = false;
            btnSaveProfil.innerHTML = 'Simpan Perubahan';
        }
    });
});
