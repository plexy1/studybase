import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, addDoc, collection } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
  // Firebase configuration
  const firebaseConfig = {
    apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw", 
    authDomain: "studybase-data.firebaseapp.com",
    projectId: "studybase-data",
    storageBucket: "studybase-data.firebasestorage.app",
    messagingSenderId: "471482464641",
    appId: "1:471482464641:web:46fe6cf41e17a24e785080"
  };

  // Initialize Firebase and Firestore
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  // Dark mode functionality
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  
  function enableDarkMode() {
    body.classList.add('dark-mode');
    darkModeToggle.checked = true;
    localStorage.setItem('darkMode', 'enabled');
  }
  
  function disableDarkMode() {
    body.classList.remove('dark-mode');
    darkModeToggle.checked = false;
    localStorage.setItem('darkMode', null);
  }
  
  function toggleDarkMode() {
    if (body.classList.contains('dark-mode')) {
      disableDarkMode();
    } else {
      enableDarkMode();
    }
  }
  
  darkModeToggle.addEventListener('change', toggleDarkMode);
  
  if (localStorage.getItem('darkMode') === 'enabled') {
    enableDarkMode();
  } else {
    disableDarkMode();
  }
  
  // Pre-populate professor if provided via query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const professorNameParam = urlParams.get('professorName');
  if (professorNameParam) {
    document.getElementById('professorName').value = professorNameParam;
  }
  
  // Populate the datalist for courses from courses.json
  fetch('courses.json')
    .then(response => response.json())
    .then(data => {
      const courseOptions = document.getElementById('courseOptions');
      // Clear any existing options
      courseOptions.innerHTML = '';
      data.forEach(course => {
        const option = document.createElement('option');
        // Here we set the value to course name; you may set it to course id if desired
        option.value = course.name; 
        courseOptions.appendChild(option);
      });
      
      // If a course name is passed via query parameter, pre-populate the input
      const courseNameParam = urlParams.get('courseName');
      if (courseNameParam) {
        document.getElementById('courseInput').value = courseNameParam;
      }
    })
    .catch(error => {
      console.error("Error loading courses:", error);
    });
  
  // Handle form submission
  const ratingForm = document.getElementById('ratingForm');
  const cancelButton = document.getElementById('cancelButton');
  
  ratingForm.addEventListener('submit', async function(e) {
    e.preventDefault();
  
    // Retrieve form values (course is taken from the datalist input)
    const course = document.getElementById('courseInput').value;
    const yourMajor = document.getElementById('yourMajor').value;
    const semester = document.getElementById('semester').value;
    const year = document.getElementById('year').value;
    const professorName = document.getElementById('professorName').value;
    const reviewText = document.getElementById('reviewText').value;
    const starRating = document.getElementById('starRating').value;
    const isAnonymous = document.getElementById('anonymousCheckbox').checked;
  
    const reviewData = {
      course,
      yourMajor,
      semester,
      year,
      professorName,
      reviewText,
      starRating,
      anonymous: isAnonymous,
      timestamp: new Date()
    };
  
    try {
      // Add review data to the "reviews" collection in Firestore
      await addDoc(collection(db, "reviews"), reviewData);
      alert("Review submitted successfully!");
      // Redirect to the courses page
      window.location.href = "courses.html";
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Error submitting review: " + error.message);
    }
  
    ratingForm.reset();
  });
  
  cancelButton.addEventListener('click', function() {
    window.location.href = 'courses.html';
  });
});
