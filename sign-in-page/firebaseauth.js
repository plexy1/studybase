import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

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

document.addEventListener("DOMContentLoaded", function () {
  const signInForm = document.querySelector("form");
  const emailInput = document.getElementById("floatingInput");
  const passwordInput = document.getElementById("floatingPassword");
  const signInMessage = document.getElementById("signInMessage");

  signInForm.addEventListener("submit", (e) => {
    e.preventDefault(); // Prevent form from refreshing the page

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Login successful
        signInMessage.style.display = "block";
        signInMessage.style.color = "green";
        signInMessage.innerText = "Login successful! Redirecting...";

        setTimeout(() => {
          window.location.href = "dashboard.html"; // Redirect to dashboard
        }, 1500);
      })
      .catch((error) => {
        const errorCode = error.code;
        console.error(errorCode, error.message);

        signInMessage.style.display = "block";
        signInMessage.style.color = "red";

        if (errorCode === "auth/user-not-found") {
          signInMessage.innerText = "Account does not exist. Please create one.";
        } else if (errorCode === "auth/wrong-password") {
          signInMessage.innerText = "Incorrect password. Try again.";
        } else if (errorCode === "auth/invalid-email") {
          signInMessage.innerText = "Invalid email format.";
        } else {
          signInMessage.innerText = "Login failed. Please try again.";
        }
      });
  });
});
