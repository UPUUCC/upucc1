// src/member/dashboard.js
document.addEventListener('DOMContentLoaded', () => {
    // Check authentication logic here (Mock for now)
    const user = JSON.parse(sessionStorage.getItem('user')) || { nama: 'Member UPUCC', divisi: 'Programming' };
    document.getElementById('welcomeMsg').textContent = `Selamat datang, ${user.nama}!`;

    loadMateri();
    loadSertifikat();
    loadJadwal();

    document.getElementById('btnLogout').addEventListener('click', () => {
        sessionStorage.removeItem('user');
        window.location.href = '/login.html';
    });
});

function loadMateri() {
    const materiContainer = document.getElementById('materiList');
    // Mock Data
    const materiData = [
        { title: 'Pengenalan HTML & CSS', type: 'PDF', date: '10 Sep 2026', link: '#' },
        { title: 'Dasar-dasar JavaScript', type: 'Video', date: '12 Sep 2026', link: '#' },
        { title: 'Membuat REST API dengan Node.js', type: 'PDF', date: '15 Sep 2026', link: '#' }
    ];

    setTimeout(() => {
        materiContainer.innerHTML = '';
        materiData.forEach(item => {
            const icon = item.type === 'PDF' ? 'bi-file-earmark-pdf text-danger' : 'bi-play-circle text-primary';
            materiContainer.innerHTML += `
                <div class="material-item p-3 mb-3 shadow-sm d-flex justify-content-between align-items-center">
                    <div class="d-flex align-items-center gap-3">
                        <i class="bi ${icon} fs-2"></i>
                        <div>
                            <h6 class="mb-1 fw-bold">${item.title}</h6>
                            <small class="text-muted"><i class="bi bi-clock me-1"></i> ${item.date} • ${item.type}</small>
                        </div>
                    </div>
                    <a href="${item.link}" class="btn btn-sm btn-outline-primary"><i class="bi bi-download"></i> Unduh</a>
                </div>
            `;
        });
    }, 1000);
}

function loadSertifikat() {
    const certContainer = document.getElementById('sertifikatList');
    // Mock Data
    const certData = [
        { title: 'Peserta Workshop Web Development 2026', issueDate: 'Agustus 2026', image: 'https://images.unsplash.com/photo-1596496181848-3091d4878b24?auto=format&fit=crop&w=400&q=80' },
        { title: 'Panitia LDK UPU-CC 2025', issueDate: 'Desember 2025', image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?auto=format&fit=crop&w=400&q=80' }
    ];

    setTimeout(() => {
        certContainer.innerHTML = '';
        certData.forEach(item => {
            certContainer.innerHTML += `
                <div class="col-md-6">
                    <div class="card h-100 border-0 shadow-sm rounded-4 overflow-hidden">
                        <img src="${item.image}" class="card-img-top" alt="Certificate" style="height: 150px; object-fit: cover;">
                        <div class="card-body">
                            <h6 class="fw-bold text-truncate" title="${item.title}">${item.title}</h6>
                            <p class="small text-muted mb-3">Diterbitkan: ${item.issueDate}</p>
                            <a href="#" class="btn btn-sm btn-primary w-100"><i class="bi bi-eye"></i> Lihat Sertifikat</a>
                        </div>
                    </div>
                </div>
            `;
        });
    }, 1200);
}

function loadJadwal() {
    const jadwalContainer = document.getElementById('jadwalList');
    // Mock Data
    const jadwalData = [
        { title: 'Pertemuan Rutin Programming', time: 'Sabtu, 15:00 WIB', location: 'Lab Komputer 1', status: 'Upcoming' },
        { title: 'Sharing Session UI/UX', time: 'Minggu, 10:00 WIB', location: 'Google Meet', status: 'Upcoming' }
    ];

    setTimeout(() => {
        jadwalContainer.innerHTML = '';
        jadwalData.forEach(item => {
            jadwalContainer.innerHTML += `
                <div class="d-flex p-3 mb-3 bg-light rounded-3 align-items-center justify-content-between border-start border-4 border-warning">
                    <div>
                        <h6 class="fw-bold mb-1">${item.title}</h6>
                        <small class="text-muted d-block"><i class="bi bi-clock me-1"></i> ${item.time}</small>
                        <small class="text-muted"><i class="bi bi-geo-alt me-1"></i> ${item.location}</small>
                    </div>
                    <span class="badge bg-warning text-dark">${item.status}</span>
                </div>
            `;
        });
    }, 1500);
}
