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
  const courseDropdownRate = document.getElementById('courseInput'); // Course dropdown in rate page
  const courseSearchInputRate = document.getElementById('courseSearchRate'); // Search input in rate page


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

  // Populate the dropdown with courses from courses.json, now with search term
  function populateCoursesDropdownRate(searchTerm = '') {
    fetch('courses.json')
      .then(response => response.json())
      .then(courses => {
        courseDropdownRate.innerHTML = '<option value="">-- Select Course --</option>';
        const filteredCourses = courses.filter(course => {
          const searchTextLower = searchTerm.toLowerCase();
          // Filter courses based on whether the course name or id includes the search term
          return course.name.toLowerCase().includes(searchTextLower) || course.id.toLowerCase().includes(searchTextLower);
        });
        filteredCourses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.name;
          option.textContent = `${course.name} (${course.id})`; // Display course name and code
          courseDropdownRate.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading courses:', error);
      });
  }

  // Add event listener to the search input
  courseSearchInputRate.addEventListener('input', function(e) {
    const searchTerm = e.target.value;
    populateCoursesDropdownRate(searchTerm); // Repopulate dropdown with search term
  });


  // If a course name is passed via query parameter, pre-populate the input
  const urlParams = new URLSearchParams(window.location.search);
  const courseNameParam = urlParams.get('courseName');
  if (courseNameParam) {
    // Directly setting value might not select the option if dropdown is used.
    // Instead, try to set the dropdown to the course if it exists after population.
    populateCoursesDropdownRate('', courseNameParam); // Initial population, then try to select
  }


  // Handle form submission
  const ratingForm = document.getElementById('ratingForm');
  const cancelButton = document.getElementById('cancelButton');

  ratingForm.addEventListener('submit', async function(e) {
    e.preventDefault();

    // Retrieve form values (course is taken from the dropdown now)
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

  // Initial population of the courses dropdown (without search term initially)
  populateCoursesDropdownRate();
});