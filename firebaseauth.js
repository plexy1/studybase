import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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

// Handle form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("registerForm");
  const successMessageDiv = document.getElementById("successMessage"); // Get the success message div

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get user input
    const username = document.getElementById("floatingUsername").value;
    const email = document.getElementById("floatingEmail").value;
    const university = document.getElementById("floatingUniversity").value;
    const password = document.getElementById("floatingPassword").value;

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save user details in Firestore
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        university: university,
      });

      // Display success message
      successMessageDiv.textContent = "Account created successfully! Redirecting...";
      successMessageDiv.style.display = "block"; // Make the message visible
      successMessageDiv.style.color = "green";   // Set text color to green


      setTimeout(() => {
        window.location.href = "index.html"; // Redirect to login page after 1 second
      }, 1000);


    } catch (error) {
      console.error("Error signing up:", error);
      successMessageDiv.textContent = "Error creating account: " + error.message; // Display error in successMessageDiv
      successMessageDiv.style.display = "block";
      successMessageDiv.style.color = "red"; // Change color to red for error
    }
  });
});