import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
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
let currentFighterId = null;

async function loadProfileData() {
    const params = new URLSearchParams(window.location.search);
    const profileId = params.get('id');
    if (!profileId) {
        document.getElementById('profName').innerText = 'ID не указан';
        return;
    }
    currentFighterId = profileId;
    currentFighterRef = doc(db, "fighters", profileId);
    
    try {
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

        // Загружаем количество лайков
        await loadLikesCount();
        
        const editProfileBtn = document.getElementById('editProfileBtn');
        const editBioBtn = document.getElementById('editBtn');
        const saveBioBtn = document.getElementById('saveBtn');
        const bioText = document.getElementById('bioText');
        const bioInput = document.getElementById('bioInput');
        const modal = document.getElementById('editProfileModal');

        onAuthStateChanged(auth, async (user) => {
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
            
            // Если пользователь залогинен и это не его профиль — проверяем, ставил ли он лайк
            if (user && !isOwner) {
                await checkIfUserLiked(user.uid);
            } else if (!user) {
                // Не залогинен — кнопка лайка неактивна
                const likeBtn = document.getElementById('likeBtn');
                if (likeBtn) {
                    likeBtn.disabled = true;
                    likeBtn.title = "Войдите, чтобы поставить лайк";
                }
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

        // Редактирование профиля
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

async function loadLikesCount() {
    const likesRef = collection(db, "likes");
    const q = query(likesRef, where("fighterId", "==", currentFighterId));
    const snapshot = await getDocs(q);
    const count = snapshot.size;
    document.getElementById('likesCount').innerText = count;
}

async function checkIfUserLiked(userId) {
    const likeDocRef = doc(db, "likes", `${userId}_${currentFighterId}`);
    const likeSnap = await getDoc(likeDocRef);
    const likeBtn = document.getElementById('likeBtn');
    
    if (likeSnap.exists()) {
        likeBtn.classList.add('liked');
        likeBtn.innerText = '❤️ Лайкнут';
        likeBtn.disabled = true;
    } else {
        likeBtn.classList.remove('liked');
        likeBtn.innerText = '👍 Лайк';
        likeBtn.disabled = false;
        likeBtn.onclick = async () => {
            await setDoc(doc(db, "likes", `${userId}_${currentFighterId}`), {
                fighterId: currentFighterId,
                userId: userId,
                createdAt: new Date()
            });
            likeBtn.classList.add('liked');
            likeBtn.innerText = '❤️ Лайкнут';
            likeBtn.disabled = true;
            loadLikesCount();
        };
    }
}

document.addEventListener('DOMContentLoaded', loadProfileData);
window.loadProfileData = loadProfileData;