import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
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
  const courseSearchInput = document.getElementById('courseSearch'); // Get search input

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

  // Sample professor data (static)
  const professors = {
    'EECS2200': [
      { name: 'Dr. Smith', id: 'prof1' },
      { name: 'Professor Jones', id: 'prof2' }
    ],
    'EECS2311': [
      { name: 'Dr. Hadi Hemmati', id: 'prof3' },
      { name: 'Professor Brown', id: 'prof4' }
    ]
  };

  // Populate the dropdown with courses from courses.json, now with search term
  function populateCoursesDropdown(searchTerm = '') {
    fetch('courses.json')
      .then(response => response.json())
      .then(courses => {
        courseDropdown.innerHTML = '<option value="">-- Select Course --</option>';
        const filteredCourses = courses.filter(course => {
          const searchTextLower = searchTerm.toLowerCase();
          // Filter courses based on whether the course name or id includes the search term
          return course.name.toLowerCase().includes(searchTextLower) || course.id.toLowerCase().includes(searchTextLower);
        });
        filteredCourses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.name;
          option.textContent = `${course.name} (${course.id})`; // Display course name and code
          courseDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading courses:', error);
      });
  }

  // Add event listener to the search input
  courseSearchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value;
    populateCoursesDropdown(searchTerm); // Repopulate dropdown with search term
  });

  // When a course is selected, update the reviews box with reviews from Firebase
  courseDropdown.addEventListener('change', function(e) {
    const selectedCourse = e.target.value;
    if (selectedCourse) {
      updateCourseReviews(selectedCourse);
      // (Optionally, you could also update professors if needed)
    } else {
      document.getElementById("courseReviewBox").innerHTML = "<p class='text-muted'>Select a course to see reviews.</p>";
    }
  });

  // Fetch and update the "Course Reviews" box with reviews from Firebase
  async function updateCourseReviews(courseName) {
    const courseReviewBox = document.getElementById("courseReviewBox");
    courseReviewBox.innerHTML = "<p>Loading course reviews...</p>";
    try {
      const q = query(
        collection(db, "reviews"),
        where("course", "==", courseName)
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

  // (Optional) Display professors for a selected course using static data
  function displayProfessors(courseId) {
    const professorListUl = document.getElementById('professorList');
    professorListUl.innerHTML = '';
    const profsForCourse = professors[courseId];
    if (profsForCourse) {
      profsForCourse.forEach(professor => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'professor-item');
        li.textContent = professor.name;
        li.dataset.professorId = professor.id;
        li.addEventListener('click', function() {
          highlightSelectedProfessor(this);
          // Optionally: update a professor reviews box here if desired.
        });
        professorListUl.appendChild(li);
      });
    } else {
      const li = document.createElement('li');
      li.classList.add('list-group-item', 'disabled');
      li.textContent = 'No professors available for this course.';
      professorListUl.appendChild(li);
    }
  }

  // Optional: Clear professor reviews box (if used)
  function clearProfessorReviews() {
    const reviewListDiv = document.getElementById('reviewList');
    reviewListDiv.innerHTML = '<p class="text-muted">Select a professor to see reviews</p>' +
                                '<small class="text-muted rate-my-prof">from RateMyProf</small>';
  }

  // Optional: Highlighting functions (if you want to highlight selections)
  let selectedCourseItem = null;
  function highlightSelectedCourse(courseItem) {
    if (selectedCourseItem) {
      selectedCourseItem.classList.remove('active');
    }
    courseItem.classList.add('active');
    selectedCourseItem = courseItem;
    clearProfessorHighlight();
  }

  let selectedProfessorItem = null;
  function highlightSelectedProfessor(professorItem) {
    if (selectedProfessorItem) {
      selectedProfessorItem.classList.remove('active');
    }
    professorItem.classList.add('active');
    selectedProfessorItem = professorItem;
  }
  function clearProfessorHighlight() {
    if (selectedProfessorItem) {
      selectedProfessorItem.classList.remove('active');
      selectedProfessorItem = null;
    }
  }

  // Initial population of the courses dropdown (without search term initially)
  populateCoursesDropdown();
});