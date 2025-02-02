import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAxZAi4bKJxNSO7paLae8rUDz6DxYbFc7o",
  authDomain: "studybase-data.firebaseapp.com",
  projectId: "studybase-data",
  storageBucket: "studybase-data.firebasestorage.app",
  messagingSenderId: "471482464641",
  appId: "1:471482464641:web:46fe6cf41e17a24e785080"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("floatingInput").value;
    const password = document.getElementById("floatingPassword").value;
    const signInMessage = document.getElementById("signInMessage");

    try {
      // Sign in the user
      await signInWithEmailAndPassword(auth, email, password);

      // Redirect to home page or dashboard upon successful login
      window.location.href = "dashboard.html"; // Modify this to your desired page

    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;

      signInMessage.style.display = "block";
      signInMessage.textContent = `Error: ${errorMessage}`;
    }
  });
});
