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

let currentFighterRef = null;

async function loadProfileData() {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');
    if (!profileId) {
        document.getElementById('profName').innerText = 'ID не указан';
        return;
    }
    try {
        currentFighterRef = doc(db, "fighters", profileId);
        const fighterSnap = await getDoc(currentFighterRef);
        if (!fighterSnap.exists()) {
            document.getElementById('profName').innerText = 'Боец не найден';
            return;
        }
        const fighter = fighterSnap.data();
        document.getElementById('profName').innerText = fighter.name || 'Без имени';
        document.getElementById('profSport').innerText = fighter.sport || '—';
        document.getElementById('profWeight').innerText = fighter.weight ? fighter.weight + " кг" : '—';
        document.getElementById('profCity').innerText = fighter.city || '—';
        document.getElementById('bioText').innerText = fighter.bio || "Тут пока пусто...";

        const editProfileBtn = document.getElementById('editProfileBtn');
        const editBioBtn = document.getElementById('editBtn');
        const saveBioBtn = document.getElementById('saveBtn');
        const bioText = document.getElementById('bioText');
        const bioInput = document.getElementById('bioInput');
        const modal = document.getElementById('editProfileModal');

        onAuthStateChanged(auth, (user) => {
            const isOwner = user && user.uid === profileId;
            if (isOwner) {
                if (editProfileBtn) editProfileBtn.classList.remove('hidden');
                if (editBioBtn) editBioBtn.classList.remove('hidden');
                document.getElementById('btnChallenge')?.classList.add('hidden');
                document.getElementById('btnMessage')?.classList.add('hidden');
            } else {
                if (editProfileBtn) editProfileBtn.classList.add('hidden');
                if (editBioBtn) editBioBtn.classList.add('hidden');
            }
        });

        // Редактирование био
        if (editBioBtn) {
            editBioBtn.onclick = () => {
                bioInput.value = bioText.innerText === "Тут пока пусто..." ? "" : bioText.innerText;
                bioText.classList.add('hidden');
                bioInput.classList.remove('hidden');
                editBioBtn.classList.add('hidden');
                saveBioBtn.classList.remove('hidden');
            };
        }
        if (saveBioBtn) {
            saveBioBtn.onclick = async () => {
                await updateDoc(currentFighterRef, { bio: bioInput.value });
                bioText.innerText = bioInput.value || "Тут пока пусто...";
                bioText.classList.remove('hidden');
                bioInput.classList.add('hidden');
                editBioBtn.classList.remove('hidden');
                saveBioBtn.classList.add('hidden');
            };
        }

        // Редактирование профиля (модальное окно)
        if (editProfileBtn) {
            editProfileBtn.onclick = () => {
                document.getElementById('editName').value = fighter.name || '';
                document.getElementById('editCity').value = fighter.city || '';
                document.getElementById('editWeight').value = fighter.weight || '';
                document.getElementById('editSport').value = fighter.sport || 'Бокс';
                modal.style.display = 'flex';
            };
        }
        document.getElementById('saveProfileBtn').onclick = async () => {
            const updatedData = {
                name: document.getElementById('editName').value,
                city: document.getElementById('editCity').value,
                weight: parseInt(document.getElementById('editWeight').value) || 0,
                sport: document.getElementById('editSport').value
            };
            await updateDoc(currentFighterRef, updatedData);
            alert("Профиль обновлён");
            modal.style.display = 'none';
            loadProfileData();
        };
        document.getElementById('cancelProfileBtn').onclick = () => {
            modal.style.display = 'none';
        };
        window.onclick = (event) => {
            if (event.target === modal) modal.style.display = 'none';
        };
    } catch (error) {
        console.error("Ошибка загрузки профиля:", error);
    }
}

document.addEventListener('DOMContentLoaded', loadProfileData);
window.loadProfileData = loadProfileData;