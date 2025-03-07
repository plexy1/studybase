import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, addDoc, collection } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

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
const db = getFirestore(app);

// Handle review form submission
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("reviewForm");
  const successMessageDiv = document.getElementById("successMessage"); // A div in your HTML to show success/error messages

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Retrieve review form input values
    const course = document.getElementById("courseInput").value;
    const yourMajor = document.getElementById("yourMajor").value;
    const semester = document.getElementById("semester").value;
    const year = document.getElementById("year").value;
    const professorName = document.getElementById("professorName").value;
    const reviewText = document.getElementById("reviewText").value;
    const starRating = document.getElementById("starRating").value;
    const anonymous = document.getElementById("anonymousCheckbox").checked;

    try {
      // Save review details in the "reviews" collection
      await addDoc(collection(db, "reviews"), {
        course,
        yourMajor,
        semester,
        year,
        professorName,
        reviewText,
        starRating,
        anonymous,
        timestamp: new Date()  // Optional: add a timestamp
      });

      // Display success message
      successMessageDiv.textContent = "Review submitted successfully! Redirecting...";
      successMessageDiv.style.display = "block";
      successMessageDiv.style.color = "green";

      setTimeout(() => {
        window.location.href = "courses.html"; // Redirect or clear the form as needed
      }, 1000);
    } catch (error) {
      console.error("Error submitting review:", error);
      successMessageDiv.textContent = "Error submitting review: " + error.message;
      successMessageDiv.style.display = "block";
      successMessageDiv.style.color = "red";
    }
  });
});
