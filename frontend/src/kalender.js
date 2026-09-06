import { db } from './firebase.js';
import { collection, getDocs, query, orderBy } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    const calendarEl = document.getElementById('calendar');
    const loadingEl = document.getElementById('calendarLoading');
    
    // Fetch events from Firestore
    let events = [];
    try {
        const q = query(collection(db, "acara"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        snapshot.forEach(docSnap => {
            const data = docSnap.data();
            
            // FullCalendar event format
            events.push({
                title: data.nama,
                start: data.tanggal,
                // Add custom properties for modal
                extendedProps: {
                    imageUrl: data.imageUrl,
                    deskripsi: data.deskripsi,
                    link: data.link
                }
            });
        });
    } catch (error) {
        console.error("Error fetching acara:", error);
    }

    // Hide loading, show calendar
    loadingEl.style.display = 'none';
    calendarEl.style.display = 'block';

    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    
    // Initialize FullCalendar
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        locale: 'id',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,listMonth'
        },
        buttonText: {
            today: 'Hari Ini',
            month: 'Bulan',
            list: 'Agenda'
        },
        events: events,
        eventClick: function(info) {
            // Populate modal
            document.getElementById('modalTitle').textContent = info.event.title;
            
            // Format date
            const dateStr = info.event.start.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            document.getElementById('modalDate').textContent = dateStr;
            
            const ext = info.event.extendedProps;
            document.getElementById('modalDesc').textContent = ext.deskripsi || '';
            
            const imgEl = document.getElementById('modalImg');
            if (ext.imageUrl) {
                imgEl.src = ext.imageUrl;
                imgEl.style.display = 'block';
            } else {
                imgEl.style.display = 'none';
            }
            
            const linkEl = document.getElementById('modalLink');
            if (ext.link && ext.link.trim() !== '') {
                linkEl.href = ext.link;
                linkEl.classList.remove('d-none');
            } else {
                linkEl.classList.add('d-none');
            }
            
            modal.show();
        }
    });
    
    calendar.render();
});
