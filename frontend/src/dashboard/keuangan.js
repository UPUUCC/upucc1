import Swal from 'sweetalert2';
import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, addDoc, doc, deleteDoc, query, orderBy, serverTimestamp } from "firebase/firestore";

let chartInstance = null;
let keuanganDataRaw = [];

// Periksa Auth
onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = '/dashboard/login.html';
    } else {
        fetchKeuangan();
    }
});

const form = document.getElementById('formKeuangan');
const btnSubmit = document.getElementById('btnSubmitForm');
const tableBody = document.getElementById('keuanganTableBody');
const nominalInput = document.getElementById('nominal');

if (nominalInput) {
    nominalInput.addEventListener('input', function(e) {
        let value = this.value.replace(/[^0-9]/g, '');
        if (value) {
            value = parseInt(value, 10).toLocaleString('id-ID');
        }
        this.value = value;
    });
}

// Format Rupiah
const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

// Format Date
const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

// Add Transaction
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const tipe = document.getElementById('tipe').value;
    const keterangan = document.getElementById('keterangan').value;
    const nominalRaw = document.getElementById('nominal').value;
    const nominal = parseInt(nominalRaw.replace(/[^0-9]/g, ''), 10) || 0;
    const tanggal = document.getElementById('tanggal').value;

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = 'Menyimpan...';

    try {
        await addDoc(collection(db, "keuangan"), {
            tipe: tipe,
            keterangan: keterangan,
            nominal: nominal,
            tanggal: tanggal,
            createdAt: serverTimestamp()
        });

        Swal.fire({ icon: 'success', title: 'Berhasil', text: 'Transaksi kas berhasil ditambahkan', timer: 1500 });
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('tambahModal'));
        modal.hide();
        form.reset();
        document.getElementById('tanggal').valueAsDate = new Date();
        
        fetchKeuangan();
    } catch (error) {
        console.error("Error adding doc: ", error);
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Gagal menambahkan data' });
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Simpan Transaksi';
    }
});

// Fetch & Display
async function fetchKeuangan() {
    tableBody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat data...</td></tr>';
    
    try {
        const q = query(collection(db, "keuangan"), orderBy("tanggal", "desc"));
        const snapshot = await getDocs(q);
        
        let totalPemasukan = 0;
        let totalPengeluaran = 0;
        
        let chartLabels = [];
        let dataPemasukan = [];
        let dataPengeluaran = [];

        // Simple aggregation by month for chart
        let aggData = {};

        if (snapshot.empty) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">Belum ada transaksi</td></tr>';
            updateStats(0, 0);
            updateChart([], [], []);
            keuanganDataRaw = [];
            return;
        }

        let html = '';
        keuanganDataRaw = [];
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const id = docSnap.id;
            
            keuanganDataRaw.push(data);

            // Format for table
            const typeBadge = data.tipe === 'pemasukan' 
                ? '<span class="badge bg-success bg-opacity-10 text-success px-2 py-1"><i class="bi bi-arrow-down-left"></i> Pemasukan</span>'
                : '<span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1"><i class="bi bi-arrow-up-right"></i> Pengeluaran</span>';
                
            const nominalColor = data.tipe === 'pemasukan' ? 'text-success' : 'text-danger';
            const nominalPrefix = data.tipe === 'pemasukan' ? '+' : '-';

            html += `
                <tr>
                    <td>${formatDate(data.tanggal)}</td>
                    <td class="fw-medium">${data.keterangan}</td>
                    <td>${typeBadge}</td>
                    <td class="fw-bold ${nominalColor}">${nominalPrefix} ${formatRupiah(data.nominal)}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteKeuangan('${id}')"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;

            // Calculate totals
            if (data.tipe === 'pemasukan') totalPemasukan += data.nominal;
            else if (data.tipe === 'pengeluaran') totalPengeluaran += data.nominal;

            // Chart aggregation (by YYYY-MM)
            const monthYear = data.tanggal.substring(0, 7); // "2024-08"
            if(!aggData[monthYear]) aggData[monthYear] = { p: 0, k: 0 };
            
            if(data.tipe === 'pemasukan') aggData[monthYear].p += data.nominal;
            else aggData[monthYear].k += data.nominal;
        });

        tableBody.innerHTML = html;
        updateStats(totalPemasukan, totalPengeluaran);

        // Prepare chart data (sort chronologically)
        const sortedMonths = Object.keys(aggData).sort();
        sortedMonths.forEach(m => {
            chartLabels.push(m);
            dataPemasukan.push(aggData[m].p);
            dataPengeluaran.push(aggData[m].k);
        });
        updateChart(chartLabels, dataPemasukan, dataPengeluaran);

    } catch (error) {
        console.error("Error fetching data:", error);
        tableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Gagal memuat data</td></tr>';
    }
}

function updateStats(pemasukan, pengeluaran) {
    const saldo = pemasukan - pengeluaran;
    
    document.getElementById('totalPemasukan').textContent = formatRupiah(pemasukan);
    document.getElementById('totalPengeluaran').textContent = formatRupiah(pengeluaran);
    document.getElementById('totalSaldo').textContent = formatRupiah(saldo);
}

function updateChart(labels, pemasukan, pengeluaran) {
    const ctx = document.getElementById('keuanganChart').getContext('2d');
    
    if (chartInstance) {
        chartInstance.destroy();
    }

    chartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Pemasukan',
                    data: pemasukan,
                    backgroundColor: 'rgba(16, 185, 129, 0.8)',
                    borderRadius: 4
                },
                {
                    label: 'Pengeluaran',
                    data: pengeluaran,
                    backgroundColor: 'rgba(239, 68, 68, 0.8)',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true }
            },
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

window.deleteKeuangan = async (id) => {
    const res = await Swal.fire({
        title: 'Hapus data ini?',
        text: "Data tidak bisa dikembalikan!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Ya, Hapus'
    });

    if (res.isConfirmed) {
        try {
            await deleteDoc(doc(db, "keuangan", id));
            Swal.fire('Terhapus!', 'Data berhasil dihapus.', 'success');
            fetchKeuangan();
        } catch (error) {
            Swal.fire('Error!', 'Gagal menghapus data.', 'error');
            console.error(error);
        }
    }
};

// Export to Excel
document.getElementById('btnExportExcel').addEventListener('click', () => {
    if (keuanganDataRaw.length === 0) {
        Swal.fire({ icon: 'warning', title: 'Data Kosong', text: 'Tidak ada data keuangan untuk diexport.' });
        return;
    }

    const excelData = [
        ['LAPORAN KEUANGAN & KAS ORGANISASI UPUCC'],
        [],
        ['Diunduh pada:', new Date().toLocaleString('id-ID')],
        [],
        ['No', 'Tanggal', 'Keterangan Transaksi', 'Tipe', 'Pemasukan (Rp)', 'Pengeluaran (Rp)']
    ];

    let totalPemasukan = 0;
    let totalPengeluaran = 0;
    let no = 1;

    // Use a copy and reverse so oldest is first
    const sortedData = [...keuanganDataRaw].reverse();

    sortedData.forEach(item => {
        let inRp = item.tipe === 'pemasukan' ? item.nominal : 0;
        let outRp = item.tipe === 'pengeluaran' ? item.nominal : 0;

        excelData.push([
            no++,
            item.tanggal,
            item.keterangan,
            item.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
            inRp,
            outRp
        ]);
        totalPemasukan += inRp;
        totalPengeluaran += outRp;
    });

    excelData.push([]);
    excelData.push(['', '', '', 'TOTAL', totalPemasukan, totalPengeluaran]);
    excelData.push(['', '', '', 'SALDO AKHIR TERSISA', '', totalPemasukan - totalPengeluaran]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(excelData);

    ws['!cols'] = [
        { wch: 5 },   // No
        { wch: 15 },  // Tanggal
        { wch: 50 },  // Keterangan
        { wch: 15 },  // Tipe
        { wch: 20 },  // Pemasukan
        { wch: 20 }   // Pengeluaran
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Laporan Kas");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `Laporan_Kas_UPUCC_${dateStr}.xlsx`);
});
