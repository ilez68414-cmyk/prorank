import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDUGYJY7pX7q02MS5SACMIIQXpjpQ97mPw",
  authDomain: "proranklive.firebaseapp.com",
  projectId: "proranklive",
  storageBucket: "proranklive.firebasestorage.app",
  messagingSenderId: "716836144015",
  appId: "1:716836144015:web:f1575147750608d0f881fa"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function loadProfile() {
    // Получаем ID из URL
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');
    
    console.log("ID из URL:", profileId);
    
    if (!profileId) {
        document.getElementById('profName').innerText = 'ID не указан';
        return;
    }
    
    // Загружаем данные бойца
    const fighterRef = doc(db, "fighters", profileId);
    const fighterSnap = await getDoc(fighterRef);
    
    if (!fighterSnap.exists()) {
        document.getElementById('profName').innerText = 'Боец не найден';
        return;
    }
    
    const fighter = fighterSnap.data();
    
    // Заполняем страницу
    document.getElementById('profName').innerText = fighter.name || 'Без имени';
    document.getElementById('profSport').innerText = fighter.sport || '—';
    document.getElementById('profWeight').innerText = fighter.weight ? fighter.weight + " кг" : '—';
    document.getElementById('profCity').innerText = fighter.city || '—';
    document.getElementById('bioText').innerText = fighter.bio || "Тут пока пусто...";
    
    // Получаем кнопки
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const challengeBtn = document.getElementById('btnChallenge');
    const messageBtn = document.getElementById('btnMessage');
    const bioText = document.getElementById('bioText');
    const bioInput = document.getElementById('bioInput');
    
    // Ждём, когда Firebase Auth загрузит текущего пользователя
    onAuthStateChanged(auth, (user) => {
        const isOwner = user && user.uid === profileId;
        console.log("Текущий UID:", user?.uid);
        console.log("Profile ID:", profileId);
        console.log("Является владельцем?", isOwner);
        
        if (isOwner) {
            // Свой профиль
            if (editBtn) editBtn.classList.remove('hidden');
            if (saveBtn) saveBtn.classList.add('hidden');
            if (challengeBtn) challengeBtn.classList.add('hidden');
            if (messageBtn) messageBtn.classList.add('hidden');
        } else {
            // Чужой профиль
            if (editBtn) editBtn.classList.add('hidden');
            if (saveBtn) saveBtn.classList.add('hidden');
            if (challengeBtn) challengeBtn.classList.remove('hidden');
            if (messageBtn) messageBtn.classList.remove('hidden');
        }
    });
    
    // Редактирование био
    if (editBtn) {
        editBtn.onclick = () => {
            bioInput.value = bioText.innerText === "Тут пока пусто..." ? "" : bioText.innerText;
            bioText.classList.add('hidden');
            bioInput.classList.remove('hidden');
            editBtn.classList.add('hidden');
            saveBtn.classList.remove('hidden');
        };
    }
    
    if (saveBtn) {
        saveBtn.onclick = async () => {
            await updateDoc(fighterRef, { bio: bioInput.value });
            bioText.innerText = bioInput.value || "Тут пока пусто...";
            bioText.classList.remove('hidden');
            bioInput.classList.add('hidden');
            editBtn.classList.remove('hidden');
            saveBtn.classList.add('hidden');
        };
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', loadProfile);
window.loadProfile = loadProfile;