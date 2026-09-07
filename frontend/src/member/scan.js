// src/member/scan.js
document.addEventListener('DOMContentLoaded', () => {
    const html5QrcodeScanner = new Html5QrcodeScanner("reader", { 
        fps: 10, 
        qrbox: {width: 250, height: 250},
        aspectRatio: 1.0
    });

    const scanResultDiv = document.getElementById('scanResult');
    const readerDiv = document.getElementById('reader');
    const btnScanAgain = document.getElementById('btnScanAgain');
    const eventNameLabel = document.getElementById('eventName');

    function onScanSuccess(decodedText, decodedResult) {
        // Stop scanning
        html5QrcodeScanner.clear();
        
        // Hide reader, show success
        readerDiv.style.display = 'none';
        scanResultDiv.style.display = 'block';

        // Fake processing the decodedText (URL or ID)
        eventNameLabel.textContent = `Kode Acara: ${decodedText.substring(0, 15)}...`;

        // Here you would normally send an API request to record the attendance:
        // fetch('/api/attendance', { method: 'POST', body: JSON.stringify({ qrCode: decodedText }) })
    }

    function onScanFailure(error) {
        // handle scan failure, usually better to ignore and keep scanning.
    }

    html5QrcodeScanner.render(onScanSuccess, onScanFailure);

    btnScanAgain.addEventListener('click', () => {
        scanResultDiv.style.display = 'none';
        readerDiv.style.display = 'block';
        html5QrcodeScanner.render(onScanSuccess, onScanFailure);
    });
});
