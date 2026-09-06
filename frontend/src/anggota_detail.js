import { db } from './firebase.js';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const memberId = params.get('id');

    const loading = document.getElementById('pageLoading');
    const content = document.getElementById('profileContent');
    const notFound = document.getElementById('notFound');

    if (!memberId) {
        loading.style.display = 'none';
        notFound.style.display = 'block';
        return;
    }

    try {
        // Fetch member dan semua divisi sekaligus
        const [docSnap, divSnap] = await Promise.all([
            getDoc(doc(db, 'members', memberId)),
            getDocs(collection(db, 'divisions'))
        ]);

        // Buat map divisi_id → nama divisi
        const divisionMap = {};
        divSnap.forEach(d => {
            divisionMap[d.id] = d.data().nama || d.id;
        });

        loading.style.display = 'none';

        if (!docSnap.exists()) {
            notFound.style.display = 'block';
            return;
        }

        const m = docSnap.data();

        // Update page title
        document.title = `${m.nama || 'Anggota'} - UPU-CC`;

        // Avatar
        const avatar = document.getElementById('profileAvatar');
        avatar.src = m.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nama || 'A')}&background=002A54&color=fff&size=300`;

        // Name
        document.getElementById('profileNama').textContent = m.nama || '-';

        // Role badge
        const roleMap = {
            'ketum': 'Ketua Umum',
            'waketum': 'Wakil Ketua Umum',
            'bendahara': 'Bendahara',
            'sekretaris': 'Sekretaris',
            'kadiv': 'Kepala Divisi',
            'wakadiv': 'Wakil Kepala Divisi',
            'anggota': 'Anggota Divisi'
        };
        const roleLower = (m.role || '').toLowerCase();
        const roleLabel = roleMap[roleLower] || m.role || 'Anggota';
        document.getElementById('profileRoleBadge').textContent = roleLabel;

        // Division name — ambil dari map, fallback ke field divisi atau divisi_id
        const divisiNama = divisionMap[m.divisi_id] || m.divisi || m.divisi_id || 'Pengurus Inti';
        document.getElementById('profileDivisi').textContent = divisiNama;

        // Jabatan
        document.getElementById('profileJabatan').textContent = m.jabatan_text || roleLabel;

        // NIM
        if (m.nim) {
            document.getElementById('nimContainer').style.display = 'flex';
            document.getElementById('profileNim').textContent = m.nim;
        }

        // Bio
        if (m.bio) {
            document.getElementById('bioSection').style.display = 'block';
            document.getElementById('profileBio').textContent = m.bio;
        }

        // Skills
        if (m.skills) {
            document.getElementById('skillsSection').style.display = 'block';
            const skillsEl = document.getElementById('profileSkills');
            m.skills.split(',').map(s => s.trim()).filter(s => s).forEach(s => {
                const badge = document.createElement('span');
                badge.className = 'skill-chip';
                badge.textContent = s;
                skillsEl.appendChild(badge);
            });
        }

        // Social links
        const github = document.getElementById('profileGithub');
        const linkedin = document.getElementById('profileLinkedin');
        const instagram = document.getElementById('profileInstagram');
        let hasLinks = false;
        if (m.github) {
            github.href = m.github;
            github.style.display = 'inline-flex';
            hasLinks = true;
        }
        if (m.linkedin) {
            linkedin.href = m.linkedin;
            linkedin.style.display = 'inline-flex';
            hasLinks = true;
        }
        if (m.instagram) {
            instagram.href = m.instagram;
            instagram.style.display = 'inline-flex';
            hasLinks = true;
        }
        if (hasLinks) {
            document.getElementById('socialSection').style.display = 'block';
        }

        content.style.display = 'block';

    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        notFound.style.display = 'block';
    }
});
