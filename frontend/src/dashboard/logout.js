import { auth } from '../firebase.js';
import { signOut } from "firebase/auth";

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await signOut(auth);
        window.location.href = '/login.html';
    } catch (error) {
        console.error("Logout error:", error);
        alert("Gagal logout: " + error.message);
        window.location.href = '/';
    }
});
