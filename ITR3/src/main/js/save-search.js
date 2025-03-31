import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

// Firebase configuration (Keep your Firebase config)
const firebaseConfig = {
    apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw",
    authDomain: "studybase-data.firebaseapp.com",
    projectId: "studybase-data",
    storageBucket: "studybase-data.firebasestorage.app",
    messagingSenderId: "471482464641",
    appId: "1:471482464641:web:46fe6cf41e17a24e785080"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    const saveSearchButton = document.getElementById('saveSearchBtn');
    const saveStatusMessage = document.getElementById('saveStatusMessage');

    saveSearchButton.addEventListener('click', async () => {
        const user = auth.currentUser;
        if (!user) {
            displaySaveStatus("Please log in to save searches.", false);
            return;
        }

        const searchQuery = document.getElementById('searchInput').value;
        const educationLevel = document.getElementById('educationLevel').value;
        const roadmapSteps = document.getElementById('questionSlider').value;
        const geminiResultElement = document.getElementById('geminiResult');
        const geminiResult = geminiResultElement ? geminiResultElement.innerHTML : 'No Gemini Result'; // Get innerHTML
        const googleResultsElement = document.getElementById('googleResults');
        const googleResults = googleResultsElement ? googleResultsElement.innerHTML : 'No Google Results'; // Get innerHTML
        const videoSliderElement = document.getElementById('videoSlider');
        const videoSlider = videoSliderElement ? videoSliderElement.innerHTML : 'No Video Results'; // Get innerHTML


        if (!searchQuery) {
            displaySaveStatus("Search query is empty, nothing to save.", false);
            return;
        }

        const searchData = {
            userId: user.uid,
            query: searchQuery,
            educationLevel: educationLevel,
            roadmapSteps: roadmapSteps,
            geminiResults: geminiResult,
            googleResults: googleResults,
            videoResults: videoSlider,
            timestamp: serverTimestamp() // Firestore server timestamp
        };

        try {
            await addDoc(collection(db, 'savedSearches'), searchData);
            displaySaveStatus("Search saved successfully!", true);
        } catch (error) {
            console.error("Error saving search:", error);
            displaySaveStatus("Failed to save search.", false);
        }
    });

    function displaySaveStatus(message, success) {
        saveStatusMessage.textContent = message;
        saveStatusMessage.style.display = 'block';
        saveStatusMessage.classList.remove(success ? 'error' : 'success');
        saveStatusMessage.classList.add(success ? 'success' : 'error');

        // Hide message after 3 seconds
        setTimeout(() => {
            saveStatusMessage.style.display = 'none';
        }, 3000);
    }
});