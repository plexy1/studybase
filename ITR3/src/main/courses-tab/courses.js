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
  const professorListUl = document.getElementById('professorList'); // Get professor list
  const reviewListDiv = document.getElementById('reviewList'); // Get the review list div

  // API endpoint for RateMyProfessor
  const RMP_API_URL = 'http://localhost:3000';

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

  let courseProfessorsMap = {}; // Store professors data here

  // Function to process courseProf.json and create a map
  function initializeProfessorData() {
    fetch('courseProf.json')
      .then(response => response.json())
      .then(courseProfData => {
        courseProfData.forEach(item => {
          const courseId = item.id;
          const professorName = item.prof;
          if (!courseProfessorsMap[courseId]) {
            courseProfessorsMap[courseId] = [];
          }
          courseProfessorsMap[courseId].push(professorName);
        });
      })
      .catch(error => {
        console.error('Error loading course professors:', error);
      });
  }

  // Populate the dropdown with courses from courses.json
  function populateCoursesDropdown(searchTerm = '') {
    fetch('courses.json')
      .then(response => response.json())
      .then(courses => {
        courseDropdown.innerHTML = '<option value="">-- Select Course --</option>';
        const filteredCourses = courses.filter(course => {
          const searchTextLower = searchTerm.toLowerCase();
          return course.name.toLowerCase().includes(searchTextLower) || course.id.toLowerCase().includes(searchTextLower);
        });
        filteredCourses.forEach(course => {
          const option = document.createElement('option');
          option.value = course.id; // Use course ID as value
          option.textContent = `${course.name} (${course.id})`;
          courseDropdown.appendChild(option);
        });
      })
      .catch(error => {
        console.error('Error loading courses:', error);
      });
  }

  // Display professors for a selected course from courseProf.json data
  function displayProfessors(courseId) {
    professorListUl.innerHTML = ''; // Clear previous professors
    const profNames = courseProfessorsMap[courseId];
    if (profNames && profNames.length > 0) {
      profNames.forEach(professorName => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'professor-item');
        li.textContent = professorName;
        li.dataset.professorName = professorName;
        li.addEventListener('click', function() {
          highlightSelectedProfessor(this);
          fetchProfessorRating(professorName);
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

  // Fetch professor rating from RateMyProfessor
  async function fetchProfessorRating(professorName) {
    showLoadingInReviewList();
    
    try {
      console.log(`Fetching rating for professor: ${professorName}`);
      
      // Check if window.rmp is available
      if (!window.rmp) {
        console.error('RateMyProfessor API not loaded');
        showErrorInReviewList('RateMyProfessor API not loaded');
        return;
      }
      
      // Get school data
      let school;
      try {
        school = await window.rmp.searchSchool("University of California Berkeley");
        console.log('School search result:', school);
      } catch (schoolError) {
        console.error('Error searching for school:', schoolError);
        showErrorInReviewList('Could not find school data');
        return;
      }
      
      if (!school || school.length === 0) {
        console.error('School not found');
        showErrorInReviewList('School not found');
        return;
      }
      
      const schoolId = school[0].node.id;
      console.log(`Using school ID: ${schoolId}`);
      
      // Get professor rating
      let professorRating;
      try {
        professorRating = await window.rmp.getProfessorRatingAtSchoolId(professorName, schoolId);
        console.log('Professor rating result:', professorRating);
      } catch (ratingError) {
        console.error('Error getting professor rating:', ratingError);
        showErrorInReviewList('Could not retrieve professor rating');
        return;
      }
      
      if (!professorRating) {
        console.log(`No ratings found for professor: ${professorName}`);
        showNotFoundInReviewList(professorName);
        return;
      }
      
      // Display the rating
      displayProfessorRating(professorRating);
    } catch (error) {
      console.error('Error in fetchProfessorRating:', error);
      showErrorInReviewList('Failed to fetch professor rating');
    }
  }

  // Display professor rating in the review list
  function displayProfessorRating(professorRating) {
    const {
      avgRating,
      avgDifficulty,
      wouldTakeAgainPercent,
      numRatings,
      formattedName,
      department,
      link
    } = professorRating;

    const wouldTakeAgainText = wouldTakeAgainPercent === -1 
      ? 'N/A' 
      : `${wouldTakeAgainPercent}%`;

    const html = `
      <div class="professor-rating">
        <div class="rating-header">
          <h4>${formattedName}</h4>
          <p class="department">${department}</p>
        </div>
        
        <div class="rating-stats">
          <div class="rating-stat">
            <div class="rating-value ${getRatingClass(avgRating)}">${avgRating.toFixed(1)}</div>
            <div class="rating-label">Overall Quality</div>
          </div>
          
          <div class="rating-stat">
            <div class="rating-value ${getDifficultyClass(avgDifficulty)}">${avgDifficulty.toFixed(1)}</div>
            <div class="rating-label">Level of Difficulty</div>
          </div>
          
          <div class="rating-stat">
            <div class="rating-value">${wouldTakeAgainText}</div>
            <div class="rating-label">Would Take Again</div>
          </div>
        </div>
        
        <div class="rating-footer">
          <p class="num-ratings">${numRatings} ${numRatings === 1 ? 'rating' : 'ratings'}</p>
          <a href="${link}" target="_blank" class="rmp-link">View on RateMyProfessor</a>
        </div>
      </div>
    `;
    
    reviewListDiv.innerHTML = html;
  }

  // Helper function to get rating class based on score
  function getRatingClass(rating) {
    if (rating >= 4.0) return 'excellent';
    if (rating >= 3.0) return 'good';
    if (rating >= 2.0) return 'average';
    return 'poor';
  }

  // Helper function to get difficulty class based on score
  function getDifficultyClass(difficulty) {
    if (difficulty >= 4.0) return 'hard';
    if (difficulty >= 3.0) return 'medium';
    if (difficulty >= 2.0) return 'easy';
    return 'very-easy';
  }

  // Show loading message in review list
  function showLoadingInReviewList() {
    reviewListDiv.innerHTML = `
      <div class="loading-state">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p>Loading professor rating...</p>
      </div>
    `;
  }

  // Show error message in review list
  function showErrorInReviewList(errorMessage) {
    reviewListDiv.innerHTML = `
      <div class="error-state">
        <i class="fas fa-exclamation-circle text-danger"></i>
        <p>${errorMessage}</p>
      </div>
    `;
  }

  // Show not found message in review list
  function showNotFoundInReviewList(professorName) {
    reviewListDiv.innerHTML = `
      <div class="not-found-state">
        <i class="fas fa-search text-warning"></i>
        <p>No ratings found for professor "${professorName}"</p>
        <small>This professor may not have any ratings on RateMyProfessor.</small>
      </div>
    `;
  }

  // When a course is selected, update professors and course reviews
  courseDropdown.addEventListener('change', function(e) {
    const selectedCourseId = e.target.value; // Value is now course ID
    if (selectedCourseId) {
      displayProfessors(selectedCourseId); // Display professors for the selected course
      // Extract course name from the selected option's text
      const selectedCourseText = courseDropdown.options[courseDropdown.selectedIndex].text;
      const courseName = selectedCourseText.split(' (')[0]; // Split by ' (' and take the first part
      updateCourseReviews(courseName); // Pass just the course name for reviews
      clearProfessorReviews(); // Clear professor reviews when a new course is selected
    } else {
      professorListUl.innerHTML = '<li class="list-group-item disabled">Select a course to see professors</li>';
      document.getElementById("courseReviewBox").innerHTML = "<p class='text-muted'>Select a course to see reviews.</p>";
      clearProfessorReviews();
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

  // Clear professor reviews box
  function clearProfessorReviews() {
    reviewListDiv.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-user-tie empty-icon"></i>
        <p>Select a professor to see reviews</p>
        <small class="rate-my-prof">from RateMyProf</small>
      </div>
    `;
  }

  // Highlighting functions
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

  // Initialize professor data and then populate courses dropdown
  initializeProfessorData();
  populateCoursesDropdown();

  // Add event listener to course search input
  courseSearchInput.addEventListener('input', function(e) {
    const searchTerm = e.target.value;
    populateCoursesDropdown(searchTerm); // Repopulate dropdown with search term
  });

  // Initialize RateMyProfessor API
  function initializeRMP() {
    // Check if the script is already loaded
    if (document.querySelector('script[src="rmp-client.js"]')) {
      console.log('RateMyProfessor API script already loaded');
      return;
    }
    
    console.log('Loading RateMyProfessor API script...');
    
    // Create a script element to load the RateMyProfessor API
    const script = document.createElement('script');
    script.src = 'rmp-client.js';
    script.async = true;
    
    script.onload = function() {
      console.log('RateMyProfessor API script loaded successfully');
      
      // Verify that the RMP object is available
      if (window.rmp) {
        console.log('RateMyProfessor API initialized successfully');
      } else {
        console.error('RateMyProfessor API failed to initialize properly');
      }
    };
    
    script.onerror = function(error) {
      console.error('Failed to load RateMyProfessor API script', error);
    };
    
    // Append the script to the document
    document.body.appendChild(script);
  }

  // Initialize the RMP API
  initializeRMP();
});