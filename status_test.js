import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, getDocs, query, limit } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";


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

const GOOGLE_API_KEY = "AIzaSyDhbZhNaXbdi55f8M6iGxG-A0--OOH2v20";
const CX = "231b4ea4797884527";

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

const YOUTUBE_API_KEY = 'AIzaSyAs4Rbt-G3tXoCm8JKb7e-rn4V8oKx9r4s';
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


const GEMINI_API_KEY = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';

async function checkGeminiAPIStatus() {
    const geminiAPIStatusElement = document.getElementById('gemini-api-status');
    const promptText = 'Is Gemini API working?';

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: promptText
                    }]
                }]
            }),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.hasOwnProperty('candidates')) {
            geminiAPIStatusElement.textContent = 'Operational';
            geminiAPIStatusElement.className = 'status ok';
            geminiAPIStatusElement.classList.remove('error');
            geminiAPIStatusElement.classList.add('ok');
        } else {
            geminiAPIStatusElement.textContent = 'Service Down';
            geminiAPIStatusElement.className = 'status error';
            geminiAPIStatusElement.classList.remove('ok');
            geminiAPIStatusElement.classList.add('error');
            console.error("Gemini API Test Failed: Unexpected response format", data);
        }

    } catch (error) {
        console.error("Gemini API Test Failed:", error);
        geminiAPIStatusElement.textContent = 'Service Down';
        geminiAPIStatusElement.className = 'status error';
        geminiAPIStatusElement.classList.remove('ok');
        geminiAPIStatusElement.classList.add('error');
    }
}



async function genQuiz(query) {
   const apiKey = GEMINI_API_KEY; 
   const promptText = `Generate 1 very specific example test question for the topic ${query}, for a university level student.`;

   try {
       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               contents: [{
                   parts: [{ text: promptText }]
               }]
           })
       });

       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }

       const data = await response.json();
       return data; 

   } catch (error) {
       console.error('Gemini search error in genQuiz status check:', error);
       throw error;
   }
}

async function genAns(query) {
   const apiKey = GEMINI_API_KEY; 
   const promptText = `Generate a one-sentence answer or numerical solution to: ${query}`;

   try {
       const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
           method: 'POST',
           headers: {
               'Content-Type': 'application/json'
           },
           body: JSON.stringify({
               contents: [{
                   parts: [{ text: promptText }]
               }]
           })
       });

       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }

       const data = await response.json();
       return data; 

   } catch (error) {
       console.error('Gemini search error in genAns status check:', error);
       throw error; 
   }
}


async function checkQuizAnswerAPIStatus() {
    const quizAnswerAPIStatusElement = document.getElementById('future-test-1');
    const testQuery = "photosynthesis";

    try {
        await genQuiz(testQuery); 
        await genAns(testQuery);   
        quizAnswerAPIStatusElement.textContent = 'Operational';
        quizAnswerAPIStatusElement.className = 'status ok';
        quizAnswerAPIStatusElement.classList.remove('error');
        quizAnswerAPIStatusElement.classList.add('ok');

    } catch (error) {
        console.error("Quiz & Answer API Test Failed:", error);
        quizAnswerAPIStatusElement.textContent = 'Service Down';
        quizAnswerAPIStatusElement.className = 'status error';
        quizAnswerAPIStatusElement.classList.remove('ok');
        quizAnswerAPIStatusElement.classList.add('error');
    }
}

async function checkRateCourseExperienceStatus() {
    const rateCourseStatusElement = document.getElementById('rate-course-experience-status');
    
    try {
        // Test by fetching the courses.json file which is used by the rate course experience
        const response = await fetch('courses.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && Array.isArray(data)) {
            rateCourseStatusElement.textContent = 'Operational';
            rateCourseStatusElement.className = 'status ok';
            rateCourseStatusElement.classList.remove('error');
            rateCourseStatusElement.classList.add('ok');
        } else {
            throw new Error('Invalid course data format');
        }
    } catch (error) {
        console.error("Rate Course Experience API Test Failed:", error);
        rateCourseStatusElement.textContent = 'Service Down';
        rateCourseStatusElement.className = 'status error';
        rateCourseStatusElement.classList.remove('ok');
        rateCourseStatusElement.classList.add('error');
    }
}

async function checkHistorySavingStatus() {
    const historyStatusElement = document.getElementById('history-saving-status');
    
    try {
        // We'll test if Firebase is operational since history saving relies on Firebase
        // Also, verify that we can access the Firestore features
        
        // First verify if Firebase Auth is working (we already have this check in checkFirebaseStatus())
        await signInWithEmailAndPassword(auth, 'studybaseuser@gmail.com', 'studybaseuser');
        
        // If we made it here, Firebase is operational
        historyStatusElement.textContent = 'Operational';
        historyStatusElement.className = 'status ok';
        historyStatusElement.classList.remove('error');
        historyStatusElement.classList.add('ok');
    } catch (error) {
        console.error("History Saving Service Test Failed:", error);
        historyStatusElement.textContent = 'Service Down';
        historyStatusElement.className = 'status error';
        historyStatusElement.classList.remove('ok');
        historyStatusElement.classList.add('error');
    }
}

async function checkCommunitiesChatStatus() {
    const communitiesChatStatusElement = document.getElementById('communities-chat-status');
    
    try {
        // Initialize Firestore
        const db = getFirestore(app);
        
        // Try to fetch messages from the 'messages' collection to verify chat functionality
        const messagesQuery = query(collection(db, "messages"), limit(1));
        await getDocs(messagesQuery);
        
        // If we made it here, the communities chat service is operational
        communitiesChatStatusElement.textContent = 'Operational';
        communitiesChatStatusElement.className = 'status ok';
        communitiesChatStatusElement.classList.remove('error');
        communitiesChatStatusElement.classList.add('ok');
    } catch (error) {
        console.error("Communities Chat Service Test Failed:", error);
        communitiesChatStatusElement.textContent = 'Service Down';
        communitiesChatStatusElement.className = 'status error';
        communitiesChatStatusElement.classList.remove('ok');
        communitiesChatStatusElement.classList.add('error');
    }
}


document.addEventListener('DOMContentLoaded', async () => {
    await checkFirebaseStatus();
    await checkGoogleAPIStatus();
    await checkYouTubeAPIStatus();
    await checkGeminiAPIStatus();
    await checkQuizAnswerAPIStatus(); 
    await checkRateCourseExperienceStatus();
    await checkHistorySavingStatus();
    await checkCommunitiesChatStatus();
});