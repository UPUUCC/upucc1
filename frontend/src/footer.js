import { db } from './firebase.js';
import { doc, getDoc } from "firebase/firestore";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const socialRef = doc(db, "settings", "social_links");
        const docSnap = await getDoc(socialRef);
        
        if (docSnap.exists()) {
            const data = docSnap.data();
            
            const igIcon = document.querySelector('.social-icons a[aria-label="Instagram"]');
            const ytIcon = document.querySelector('.social-icons a[aria-label="YouTube"]');
            const ghIcon = document.querySelector('.social-icons a[aria-label="Github"]');
            
            if (igIcon && data.instagram) igIcon.href = data.instagram;
            if (ytIcon && data.youtube) ytIcon.href = data.youtube;
            if (ghIcon && data.github) ghIcon.href = data.github;
        }
    } catch (error) {
        console.error("Gagal memuat link sosial media footer: ", error);
    }
});
