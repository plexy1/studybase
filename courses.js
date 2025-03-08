import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function () {
  // Initialize Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyAjvShhWqOBIrgero2ODtQQtSzWuafmGJw",
    authDomain: "studybase-data.firebaseapp.com",
    projectId: "studybase-data",
    storageBucket: "studybase-data.firebasestorage.app",
    messagingSenderId: "471482464641",
    appId: "1:471482464641:web:46fe6cf41e17a24e785080"
  };
  const appFirebase = initializeApp(firebaseConfig);
  const db = getFirestore(appFirebase);

  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const courseDropdown = document.getElementById('courseDropdown');
  const professorListUl = document.getElementById('professorList');

  let courseProfData = []; // To store data from courseProf.json

  // Dark mode functions
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

  // Load courseProf.json
  async function loadCourseProfData() {
    try {
      const response = await fetch('courseProf.json');
      courseProfData = await response.json();
      console.log('courseProf data loaded:', courseProfData); // Debugging
    } catch (error) {
      console.error('Error loading courseProf.json:', error);
    }
  }

  // Populate the dropdown with courses from courses.json
  function populateCoursesDropdown() {
    fetch('courses.json')
      .then(response => response.json())
      .then(courses => {
        courseDropdown.innerHTML = '<option value="">-- Select Course --</option>';
        courses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.id; // Use course ID for matching with courseProf.json
          option.textContent = course.name;
          courseDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading courses:', error);
      });
  }

  // When a course is selected, update the professors list and reviews box
  courseDropdown.addEventListener('change', function (e) {
    const selectedCourseId = e.target.value;
    if (selectedCourseId) {
      updateProfessors(selectedCourseId);
      updateCourseReviews(selectedCourseId);
    } else {
      professorListUl.innerHTML = '<li class="list-group-item disabled">Select a course to see professors</li>';
      document.getElementById("courseReviewBox").innerHTML = "<p class='text-muted'>Select a course to see reviews.</p>";
    }
  });

  // Update the professors list based on the selected course
  function updateProfessors(courseId) {
    professorListUl.innerHTML = '';
    const filteredProfessors = courseProfData.filter(entry => entry.id === courseId);

    if (filteredProfessors.length === 0) {
      professorListUl.innerHTML = '<li class="list-group-item disabled">No professors found for this course.</li>';
    } else {
      filteredProfessors.forEach(professor => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'professor-item');
        li.textContent = professor.prof; // Use professor.prof for the professor's name
        li.dataset.professorId = professor.id;
        li.addEventListener('click', function () {
          highlightSelectedProfessor(this);
          // Optionally: update a professor reviews box here if desired.
        });
        professorListUl.appendChild(li);
      });
    }
  }

  // Fetch and update the "Course Reviews" box with reviews from Firebase
  async function updateCourseReviews(courseId) {
    const courseReviewBox = document.getElementById("courseReviewBox");
    courseReviewBox.innerHTML = "<p>Loading course reviews...</p>";
    try {
      const q = query(
        collection(db, "reviews"),
        where("course", "==", courseId)
      );
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        courseReviewBox.innerHTML = "<p>No reviews found for this course.</p>";
      } else {
        let html = "";
        querySnapshot.forEach(doc => {
          const review = doc.data();
          html += `
            <div class="review-item mb-3">
              <h6>${review.professorName} - ${review.starRating} Stars</h6>
              <p>${review.reviewText}</p>
              <small>${review.anonymous ? "Anonymous" : review.yourMajor}</small>
              <hr/>
            </div>
          `;
        });
        courseReviewBox.innerHTML = html;
      }
    } catch (err) {
      console.error("Error fetching course reviews:", err);
      courseReviewBox.innerHTML = "<p>Error loading reviews.</p>";
    }
  }

  // Optional: Highlighting functions (if you want to highlight selections)
  let selectedProfessorItem = null;
  function highlightSelectedProfessor(professorItem) {
    if (selectedProfessorItem) {
      selectedProfessorItem.classList.remove('active');
    }
    professorItem.classList.add('active');
    selectedProfessorItem = professorItem;
  }

  // Initial setup
  loadCourseProfData(); // Load courseProf.json
  populateCoursesDropdown(); // Populate the courses dropdown
});