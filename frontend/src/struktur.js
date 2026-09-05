import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

function renderPerson(person, roleClass, defaultLabel) {
  if (!person) {
    return `
    <div class="oc-person role-${roleClass} oc-kosong">
      <div class="oc-avatar-ring"><div class="oc-avatar-placeholder"><i class="bi bi-person"></i></div></div>
      <div class="oc-label">
        <div class="oc-label-name">${defaultLabel}</div>
        <div class="oc-label-jabatan">Belum diisi</div>
      </div>
    </div>`;
  }
  
  let fotoUrl = '';
  if (person.foto) {
    fotoUrl = person.foto.startsWith('http') ? person.foto : `uploads/anggota/${person.foto}`;
  }

  const fotoHTML = fotoUrl 
    ? `<img src="${fotoUrl}" alt="${person.nama}">` 
    : `<div class="oc-avatar-placeholder"><i class="bi bi-person-fill"></i></div>`;
  
  return `
    <div class="oc-person role-${roleClass}">
      <div class="oc-avatar-ring">
        ${fotoHTML}
      </div>
      <div class="oc-label">
        <div class="oc-label-name">${person.nama}</div>
        <div class="oc-label-jabatan">${person.jabatan || person.role || roleClass}</div>
      </div>
    </div>`;
}

document.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('strukturContainer');
  const treeContainer = document.getElementById('strukturTree');
  const loading = document.getElementById('strukturLoading');

  try {
    // 1. Fetch data struktur
    const strukSnap = await getDocs(collection(db, "struktur"));
    const members = [];
    strukSnap.forEach(doc => {
      members.push({ id: doc.id, ...doc.data() });
    });

    // 2. Fetch data divisi
    const divSnap = await getDocs(query(collection(db, "divisions"), orderBy("id", "asc")));
    const divisions = [];
    divSnap.forEach(doc => {
      divisions.push({ id: doc.id, ...doc.data() });
    });

    loading.style.display = 'none';
    container.style.display = 'block';

    if (members.length === 0 && divisions.length === 0) {
      treeContainer.innerHTML = '<p class="text-muted text-center mt-4">Data struktur organisasi belum diisi.</p>';
      return;
    }

    // Grouping
    const getByRole = (role) => members.find(m => m.role && m.role.toLowerCase() === role);
    
    const ketum = getByRole('ketum') || getByRole('ketua umum');
    const waketum = getByRole('waketum') || getByRole('wakil ketua umum');
    const sekre = getByRole('sekretaris');
    const benda = getByRole('bendahara');

    // Build Divisions HTML
    let divisiNodesHTML = '';
    divisions.forEach(d => {
      const divMembers = members.filter(m => m.divisi_id === d.id || m.divisi === d.nama);
      
      const kadiv = divMembers.find(m => m.role && m.role.toLowerCase() === 'kadiv');
      const wakadiv = divMembers.find(m => m.role && m.role.toLowerCase() === 'wakadiv');
      const anggota = divMembers.filter(m => m.role && m.role.toLowerCase() === 'anggota');

      let pairHTML = '';
      if (kadiv || wakadiv) {
        if (kadiv) pairHTML += renderPerson(kadiv, 'kadiv', 'KADIV');
        if (wakadiv) pairHTML += renderPerson(wakadiv, 'wakadiv', 'WAKADIV');
      }

      let anggotaHTML = '';
      if (anggota.length > 0) {
        anggota.forEach(a => {
          anggotaHTML += renderPerson(a, 'anggota', 'Anggota');
        });
      } else {
        anggotaHTML = '<div class="text-muted small w-100 mt-2">Belum ada anggota</div>';
      }

      divisiNodesHTML += `
      <li>
        <div class="oc-division">
          <div class="oc-division-title">${d.nama}</div>
          
          <div class="oc-division-pair">
            ${pairHTML}
          </div>
          ${(!kadiv && !wakadiv) ? `<div class="oc-division-empty">Kadiv & Wakadiv belum diisi</div>` : ''}
          
          <div class="oc-division-connector"></div>
          <div class="oc-anggota-group">
            <div class="oc-anggota-title">Anggota (${anggota.length})</div>
            <div class="oc-anggota-list">
              ${anggotaHTML}
            </div>
          </div>
        </div>
      </li>
      `;
    });

    const treeHTML = `
      <ul>
        <li>
          ${renderPerson(ketum, 'ketum', 'KETUA UMUM')}
          <ul class="oc-row-single">
            <li>
              ${renderPerson(waketum, 'waketum', 'WAKIL KETUA UMUM')}
              <ul>
                <!-- Kiri: Sekretaris -->
                <li>
                  ${renderPerson(sekre, 'sekretaris', 'SEKRETARIS')}
                </li>

                <!-- Tengah: Node tak-terlihat untuk garis lurus turun -->
                <li>
                  <div class="oc-person oc-trunk"></div>
                  <ul>
                    ${divisiNodesHTML}
                  </ul>
                </li>

                <!-- Kanan: Bendahara -->
                <li>
                  ${renderPerson(benda, 'bendahara', 'BENDAHARA')}
                </li>
              </ul>
            </li>
          </ul>
        </li>
      </ul>
    `;

    treeContainer.innerHTML = treeHTML;

    // Scroll to center for better view on mobile
    setTimeout(() => {
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
    }, 100);

  } catch (error) {
    console.error("Error fetching struktur:", error);
    loading.style.display = 'none';
    treeContainer.innerHTML = '<p class="text-danger text-center mt-4">Gagal memuat struktur organisasi.</p>';
  }
});
