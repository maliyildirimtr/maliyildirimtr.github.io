// ==========================================
// AKADEMİK DERSLER & OYNATMA LİSTELERİ SEED KODU (js/courses-seed.js)
// ==========================================

const SYSTEMVERILOG_COURSE_DATA = {
    id: "systemverilog-kursu",
    title: "Mantıksal Devre Tasarımı & SystemVerilog Kursu",
    code: "EEE-201 / SystemVerilog",
    icon: "⚡",
    description: "Mantıksal devre tasarımı, doğruluk tabloları, Karnaugh haritaları, kombinazyonel devreler, FPGA mimarisi ve SystemVerilog ile donanım tanımlama üzerine detaylı video eğitim serisi.",
    playlistUrl: "https://youtube.com/playlist?list=PLuh8YKWxA93nIPKqG_NuTB1-4Qd9McG-f&si=OqxyzoWktjxS31x3",
    createdAt: new Date().toISOString()
};

const SYSTEMVERILOG_TOPICS = [
    {
        id: "topic-0",
        title: "Ders 0: Giriş ve Yol Haritası | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=2Ybi9y55VKY",
        orderIndex: 0
    },
    {
        id: "topic-1",
        title: "Ders 1: Truth Table & Logic Gates | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=cw213WlYHg0",
        orderIndex: 1
    },
    {
        id: "topic-2",
        title: "Ders 2: Truth Table & Logic Gates | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=x56xcQoOJn8",
        orderIndex: 2
    },
    {
        id: "topic-3",
        title: "Ders 3: Sum of Products & Product of Sums | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=oTK5lkFwEq4",
        orderIndex: 3
    },
    {
        id: "topic-4",
        title: "Ders 4: Karnaugh Map & Don’t Care | Soru Çözümlü | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=DpkXaCgQZk4",
        orderIndex: 4
    },
    {
        id: "topic-5",
        title: "Ders 5: Introduction Boolean Function Soru Çözümü | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=1ojSBppnMUA",
        orderIndex: 5
    },
    {
        id: "topic-6",
        title: "Ders 6: SystemVerilog’a Giriş ve Quartus Programı | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=MuaYLJZQmj8",
        orderIndex: 6
    },
    {
        id: "topic-7",
        title: "Ders 7: Test Bench Mantığına Giriş | Örnek Soru Çözümü | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=3GkO4CwrqnE",
        orderIndex: 7
    },
    {
        id: "topic-8",
        title: "Ders 8: FPGA Teknolojisi ve Çalışma Mantığı | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=s8skVii1O58",
        orderIndex: 8
    },
    {
        id: "topic-9",
        title: "Ders 9: Örnek Soru | 3-Bit Gray-Binary Dönüştürücü | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=jPWvyX_b19k",
        orderIndex: 9
    },
    {
        id: "topic-10",
        title: "Ders 10: Combinational Circuits ve Modelleme Türleri | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=ajm-aLVBsu4",
        orderIndex: 10
    },
    {
        id: "topic-11",
        title: "Ders 11: Örnek Soru Çözümü | Çok Bitli Veriler | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=XP18WPwbBuc",
        orderIndex: 11
    },
    {
        id: "topic-12",
        title: "Ders 12: Half Adder | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=DdnJ98zu8yE",
        orderIndex: 12
    },
    {
        id: "topic-13",
        title: "Ders 13: Full Adder | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=UdjpSQscji4",
        orderIndex: 13
    },
    {
        id: "topic-14",
        title: "Ders 14: Half Adder Kullanarak Full Adder Tasarımı | Logic Circuit Design & SystemVerilog Kursu",
        videoUrl: "https://www.youtube.com/watch?v=4HKJpZngtgQ",
        orderIndex: 14
    }
];

// Firestore Veritabanına Otomatik Tohumlama (Seed)
function autoSeedSystemVerilogCourse() {
    if (typeof db === 'undefined') return;

    const courseRef = db.collection("courses").doc("systemverilog-kursu");
    
    courseRef.get().then((doc) => {
        if (!doc.exists) {
            console.log("🌱 SystemVerilog kursu veritabanına ekleniyor...");
            courseRef.set({
                title: SYSTEMVERILOG_COURSE_DATA.title,
                code: SYSTEMVERILOG_COURSE_DATA.code,
                icon: SYSTEMVERILOG_COURSE_DATA.icon,
                description: SYSTEMVERILOG_COURSE_DATA.description,
                playlistUrl: SYSTEMVERILOG_COURSE_DATA.playlistUrl,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                const batch = db.batch();
                SYSTEMVERILOG_TOPICS.forEach((t) => {
                    const topicRef = courseRef.collection("topics").doc(t.id);
                    batch.set(topicRef, {
                        title: t.title,
                        videoUrl: t.videoUrl,
                        orderIndex: t.orderIndex,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                return batch.commit();
            }).then(() => {
                console.log("✅ SystemVerilog kursu ve 15 adet konu videosu veritabanına başarıyla yüklendi!");
            }).catch(err => {
                console.warn("Otomatik seed hatası:", err.message);
            });
        }
    }).catch(err => {
        console.warn("Firestore ders kontrol hatası:", err.message);
    });
}

// Sayfa yüklendiğinde otomatik seed başlat
document.addEventListener('DOMContentLoaded', () => {
    autoSeedSystemVerilogCourse();
});
