import { db, auth } from '../firebase.js';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, addDoc, query, where, limit, serverTimestamp } from "firebase/firestore";
import Swal from "sweetalert2";

let currentMember = null;
let isProcessing = false;

document.addEventListener('DOMContentLoaded', () => {
    
    // Auth Check
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            window.location.href = '/login.html';
            return;
        }

        try {
            const q = query(collection(db, "members"), where("email", "==", user.email.toLowerCase().trim()), limit(1));
            const snapshot = await getDocs(q);
            if (!snapshot.empty) {
                currentMember = snapshot.docs[0].data();
                currentMember.uid = user.uid; // save auth uid
                startScanner();
            } else {
                Swal.fire('Error', 'Akun member tidak ditemukan.', 'error').then(() => {
                    window.location.href = '/member/dashboard.html';
                });
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    });

    const scanResultDiv = document.getElementById('scanResult');
    const readerDiv = document.getElementById('reader');
    const btnScanAgain = document.getElementById('btnScanAgain');
    const eventNameLabel = document.getElementById('eventName');
    let html5QrcodeScanner = null;

    function startScanner() {
        if (!html5QrcodeScanner) {
            html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
                fps: 10, 
                qrbox: {width: 250, height: 250},
                aspectRatio: 1.0
            });
        }
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    }

    async function onScanSuccess(decodedText, decodedResult) {
        if (isProcessing) return;
        isProcessing = true;
        
        // Stop scanning
        html5QrcodeScanner.clear();
        
        const sessionId = decodedText.trim();
        
        // Validate if sessionId looks like a valid firestore ID
        if (sessionId.length < 10) {
             Swal.fire('Error', 'QR Code tidak valid!', 'error');
             showError('Format QR Salah');
             return;
        }

        try {
            // Check if session exists and active
            const sessionRef = doc(db, "attendance_sessions", sessionId);
            const sessionSnap = await getDoc(sessionRef);
            
            if (!sessionSnap.exists()) {
                Swal.fire('Error', 'Sesi absensi tidak ditemukan.', 'error');
                showError('Sesi Tidak Valid');
                return;
            }

            const sessionData = sessionSnap.data();
            
            if (!sessionData.isActive) {
                Swal.fire('Tutup', 'Sesi absensi ini sudah ditutup oleh Kadiv.', 'warning');
                showError('Sesi Ditutup');
                return;
            }

            // Check double attendance
            const qAtt = query(collection(db, "attendance_records"), 
                where("session_id", "==", sessionId),
                where("member_uid", "==", currentMember.uid),
                limit(1)
            );
            const attSnap = await getDocs(qAtt);
            
            if (!attSnap.empty) {
                Swal.fire('Sudah Absen', 'Anda sudah melakukan absensi untuk sesi ini.', 'info');
                showSuccess(sessionData.title + ' (Sudah Absen)');
                return;
            }

            // Save Attendance
            await addDoc(collection(db, "attendance_records"), {
                session_id: sessionId,
                member_uid: currentMember.uid,
                member_name: currentMember.nama || auth.currentUser?.displayName || 'Unknown',
                timestamp: serverTimestamp()
            });

            Swal.fire('Berhasil!', `Absensi ${sessionData.title} berhasil dicatat.`, 'success');
            showSuccess(sessionData.title);

        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Terjadi kesalahan sistem.', 'error');
            showError('Gagal Sistem');
        }
    }

    function onScanFailure(error) {
        // ignore
    }

    function showSuccess(title) {
        readerDiv.style.display = 'none';
        scanResultDiv.style.display = 'block';
        scanResultDiv.querySelector('.alert').className = 'alert alert-success d-flex align-items-center';
        scanResultDiv.querySelector('.bi').className = 'bi bi-check-circle-fill flex-shrink-0 me-2 fs-4';
        scanResultDiv.querySelector('h6').textContent = 'Absensi Berhasil!';
        eventNameLabel.textContent = title;
        isProcessing = false;
    }

    function showError(msg) {
        readerDiv.style.display = 'none';
        scanResultDiv.style.display = 'block';
        scanResultDiv.querySelector('.alert').className = 'alert alert-danger d-flex align-items-center';
        scanResultDiv.querySelector('.bi').className = 'bi bi-x-circle-fill flex-shrink-0 me-2 fs-4';
        scanResultDiv.querySelector('h6').textContent = 'Absensi Gagal';
        eventNameLabel.textContent = msg;
        isProcessing = false;
    }

    btnScanAgain.addEventListener('click', () => {
        scanResultDiv.style.display = 'none';
        readerDiv.style.display = 'block';
        startScanner();
    });
});
