// status_test.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw",
  authDomain: "studybase-data.firebaseapp.com",
  projectId: "studybase-data",
  storageBucket: "studybase-data.firebasestorage.app",
  messagingSenderId: "471482464641",
  appId: "1:471482464641:web:46fe6cf41e17a24e785080"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function checkFirebaseStatus() {
  const firebaseStatusElement = document.getElementById('firebase-status');
  try {
    await signInWithEmailAndPassword(auth, 'studybaseuser@gmail.com', 'studybaseuser');
    firebaseStatusElement.textContent = 'Operational';
    firebaseStatusElement.className = 'status ok';
    firebaseStatusElement.classList.remove('error');
    firebaseStatusElement.classList.add('ok');

  } catch (error) {
    console.error("Firebase Authentication Test Failed:", error);
    firebaseStatusElement.textContent = 'Service Down';
    firebaseStatusElement.className = 'status error';
    firebaseStatusElement.classList.remove('ok');
    firebaseStatusElement.classList.add('error');
  }
}

const GOOGLE_API_KEY = "AIzaSyBAvcoQFLKyNjHS_g-cbHW-3b5rRy89wjQ";
const CX = "247a328ab0e4c4db3";

async function checkGoogleAPIStatus() {
    const googleAPIStatusElement = document.getElementById('google-api-status');
    const query = 'test google api status check';

    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${CX}&q=${encodeURIComponent(query)}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.hasOwnProperty('kind') && data.kind === 'customsearch#search') {
            googleAPIStatusElement.textContent = 'Operational';
            googleAPIStatusElement.className = 'status ok';
            googleAPIStatusElement.classList.remove('error');
            googleAPIStatusElement.classList.add('ok');
        } else {
            googleAPIStatusElement.textContent = 'Service Down';
            googleAPIStatusElement.className = 'status error';
            googleAPIStatusElement.classList.remove('ok');
            googleAPIStatusElement.classList.add('error');
            console.error("Google API Test Failed: Unexpected response format", data);
        }

    } catch (error) {
        console.error("Google API Test Failed:", error);
        googleAPIStatusElement.textContent = 'Service Down';
        googleAPIStatusElement.className = 'status error';
        googleAPIStatusElement.classList.remove('ok');
        googleAPIStatusElement.classList.add('error');
    }
}

const YOUTUBE_API_KEY = 'AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw';
const YOUTUBE_SEARCH_URL = 'https://www.googleapis.com/youtube/v3/search';

async function checkYouTubeAPIStatus() {
    const youtubeAPIStatusElement = document.getElementById('youtube-api-status');
    const query = 'test youtube api status check';

    const url = `${YOUTUBE_SEARCH_URL}?part=snippet&q=${encodeURIComponent(query)}&key=${YOUTUBE_API_KEY}&maxResults=1&type=video`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.hasOwnProperty('kind') && data.kind === 'youtube#searchListResponse' && data.hasOwnProperty('items')) {
            youtubeAPIStatusElement.textContent = 'Operational';
            youtubeAPIStatusElement.className = 'status ok';
            youtubeAPIStatusElement.classList.remove('error');
            youtubeAPIStatusElement.classList.add('ok');
        } else {
            youtubeAPIStatusElement.textContent = 'Service Down';
            youtubeAPIStatusElement.className = 'status error';
            youtubeAPIStatusElement.classList.remove('ok');
            youtubeAPIStatusElement.classList.add('error');
            console.error("YouTube API Test Failed: Unexpected response format", data);
        }

    } catch (error) {
        console.error("YouTube API Test Failed:", error);
        youtubeAPIStatusElement.textContent = 'Service Down';
        youtubeAPIStatusElement.className = 'status error';
        youtubeAPIStatusElement.classList.remove('ok');
        youtubeAPIStatusElement.classList.add('error');
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await checkFirebaseStatus();
    await checkGoogleAPIStatus();
    await checkYouTubeAPIStatus();
});
