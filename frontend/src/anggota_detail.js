import { db } from './firebase.js';
import { doc, getDoc } from 'firebase/firestore';

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
        const docRef = doc(db, 'members', memberId);
        const docSnap = await getDoc(docRef);

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
        avatar.src = m.fotoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.nama || 'A')}&background=002A54&color=fff&size=200`;

        // Name
        document.getElementById('profileNama').textContent = m.nama || '-';

        // Role badge
        const roleBadge = document.getElementById('profileRoleBadge');
        const roleMap = {
            'ketum': 'Ketua Umum',
            'waketum': 'Wakil Ketua Umum',
            'bendahara': 'Bendahara',
            'sekretaris': 'Sekretaris',
            'kadiv': 'Kepala Divisi',
            'wakadiv': 'Wakil Kepala Divisi',
            'anggota': 'Anggota Divisi'
        };
        roleBadge.textContent = roleMap[m.role?.toLowerCase()] || m.role || 'Anggota';

        // Division
        document.getElementById('profileDivisi').textContent = m.divisi || m.divisi_id || 'Pengurus Inti';

        // Jabatan
        document.getElementById('profileJabatan').textContent = m.jabatan_text || roleMap[m.role?.toLowerCase()] || '-';

        // NIM
        if (m.nim) {
            document.getElementById('nimContainer').style.display = 'block';
            document.getElementById('profileNim').textContent = m.nim;
        }

        // Bio
        if (m.bio) {
            document.getElementById('bioContainer').style.display = 'block';
            document.getElementById('profileBio').textContent = m.bio;
        }

        // Skills
        if (m.skills) {
            document.getElementById('skillsContainer').style.display = 'block';
            const skillsEl = document.getElementById('profileSkills');
            m.skills.split(',').map(s => s.trim()).filter(s => s).forEach(s => {
                const badge = document.createElement('span');
                badge.className = 'badge rounded-pill fw-normal px-3 py-2';
                badge.style.background = '#e0f2fe';
                badge.style.color = '#0369a1';
                badge.textContent = s;
                skillsEl.appendChild(badge);
            });
        }

        // Social links
        const github = document.getElementById('profileGithub');
        const linkedin = document.getElementById('profileLinkedin');
        if (m.github) {
            github.href = m.github;
            github.classList.remove('d-none');
            document.getElementById('socialContainer').style.display = 'block';
        }
        if (m.linkedin) {
            linkedin.href = m.linkedin;
            linkedin.classList.remove('d-none');
            document.getElementById('socialContainer').style.display = 'block';
        }

        content.style.display = 'block';

    } catch (err) {
        console.error(err);
        loading.style.display = 'none';
        notFound.style.display = 'block';
    }
});
