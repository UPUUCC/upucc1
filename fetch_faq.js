async function fetchFaq() {
    try {
        const q = query(collection(db, 'faq'), orderBy('order', 'asc'));
        const querySnapshot = await getDocs(q);
        
        const faqSection = document.getElementById('faqSection');
        const accordionFaq = document.getElementById('accordionFaq');
        
        if (querySnapshot.empty) {
            faqSection.style.display = 'none';
            return;
        }
        
        faqSection.style.display = 'block';
        let html = '';
        let i = 0;
        
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const collapseId = 'faqCollapse' + i;
            const headingId = 'faqHeading' + i;
            const isExpanded = i === 0;
            const showClass = i === 0 ? 'show' : '';
            const collapsedClass = i === 0 ? '' : 'collapsed';
            
            html += `
              <div class="accordion-item border-0 mb-3 rounded-4 shadow-sm overflow-hidden">
                <h2 class="accordion-header" id="${headingId}">
                  <button class="accordion-button ${collapsedClass} fw-bold" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="${isExpanded}" aria-controls="${collapseId}">
                    ${data.pertanyaan}
                  </button>
                </h2>
                <div id="${collapseId}" class="accordion-collapse collapse ${showClass}" aria-labelledby="${headingId}" data-bs-parent="#accordionFaq">
                  <div class="accordion-body text-muted">
                    ${data.jawaban}
                  </div>
                </div>
              </div>
            `;
            i++;
        });
        
        accordionFaq.innerHTML = html;
        
    } catch (error) {
        console.error('Error fetching FAQ:', error);
    }
}
