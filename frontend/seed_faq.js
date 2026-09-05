import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjUlMOntVrvq9bJ2lSfKhWZWk8owDzuJA",
  authDomain: "upuccofficialid.firebaseapp.com",
  projectId: "upuccofficialid",
  storageBucket: "upuccofficialid.firebasestorage.app",
  messagingSenderId: "158283728994",
  appId: "1:158283728994:web:fd59daa88e00bc275a293b",
  measurementId: "G-MZJDW6WHCE"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const faqs = [
    {
        pertanyaan: "Apa itu UPU-CC?",
        jawaban: "UPU-CC (Universitas Potensi Utama Computer Club) adalah organisasi mahasiswa yang mewadahi minat, bakat, dan pengembangan keahlian di bidang teknologi informasi dan komunikasi bagi seluruh mahasiswa Universitas Potensi Utama.",
        order: 1
    },
    {
        pertanyaan: "Siapa saja yang bisa bergabung dengan UPU-CC?",
        jawaban: "Seluruh mahasiswa aktif Universitas Potensi Utama dari berbagai program studi diperbolehkan untuk bergabung, selama memiliki komitmen dan semangat belajar yang tinggi di bidang teknologi.",
        order: 2
    },
    {
        pertanyaan: "Apa saja divisi yang tersedia di UPU-CC?",
        jawaban: "Saat ini UPU-CC berfokus pada 4 divisi utama: Programming (pengembangan perangkat lunak dan web), Network Security (infrastruktur dan keamanan jaringan), Multimedia (desain grafis dan konten kreatif), serta Knowledge of Technology (eksplorasi inovasi teknologi terkini).",
        order: 3
    },
    {
        pertanyaan: "Apakah saya harus memiliki dasar IT/komputer untuk bergabung?",
        jawaban: "Sama sekali tidak wajib. UPU-CC didirikan sebagai wadah pembelajaran bersama. Kami menyambut mahasiswa dari tingkat pemula hingga tingkat lanjut. Yang terpenting adalah kemauan keras untuk belajar dan berkolaborasi.",
        order: 4
    },
    {
        pertanyaan: "Bagaimana cara mendaftar menjadi anggota baru?",
        jawaban: "Pendaftaran dapat dilakukan melalui menu Pendaftaran di website ini saat periode Open Recruitment (Oprec) sedang dibuka. Untuk mengetahui jadwal Oprec, silakan pantau terus informasi terbaru melalui Instagram resmi kami di @upucc.official.",
        order: 5
    }
];

async function seed() {
    try {
        console.log("Checking existing FAQs...");
        const snapshot = await getDocs(collection(db, "faq"));
        if (!snapshot.empty) {
            console.log(`Found ${snapshot.size} existing FAQs. Skipping seed to prevent duplicates.`);
            process.exit(0);
        }

        console.log("Inserting professional FAQs...");
        for (const faq of faqs) {
            await addDoc(collection(db, "faq"), faq);
            console.log(`Inserted: ${faq.pertanyaan}`);
        }
        console.log("Seed complete!");
        process.exit(0);
    } catch (error) {
        console.error("Error seeding FAQs:", error);
        process.exit(1);
    }
}

seed();
