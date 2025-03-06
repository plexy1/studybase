document.addEventListener('DOMContentLoaded', function() {

  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const courseSearchInput = document.getElementById('courseSearch'); // Get the search input

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

  // Sample course, professor, and review data (replace with actual data fetching later)
  const courses = [
    { name: 'Electrical Circuits', id: 'EECS2200' },
    { name: 'Software Development Project', id: 'EECS2311' },
    { name: 'Experimental Electromagnetism', id: 'PHYS2211' },
    { name: 'Calculus I', id: 'MATH1013' },
    { name: 'Linear Algebra', id: 'MATH1025' }
  ];

  const professors = {
    'EECS2200': [
      { name: 'Dr. Smith', id: 'prof1' },
      { name: 'Professor Jones', id: 'prof2' }
    ],
    'EECS2311': [
      { name: 'Dr. Hadi Hemmati', id: 'prof3' },
      { name: 'Professor Brown', id: 'prof4' }
    ],

  };

  const reviews = {
    'prof1': [
      { text: 'Dr. Smith is a great lecturer. Very clear and engaging.' },
      { text: 'Highly recommend Dr. Smith for EECS2200. He explains concepts well.' }
    ],
    'prof2': [
      { text: 'Professor Jones is knowledgeable but sometimes hard to follow.' },
      { text: 'Good professor, but could improve communication.' }
    ],
    'prof3': [
      { text: 'Dr. Hadi Hemmati is excellent at explaining complex topics.' },
      { text: 'Best professor for EECS2311! Very helpful and approachable.' }
    ],
    'prof4': [
      { text: 'Professor Brown is decent, but the course material is challenging.' },
      { text: 'Average professor, nothing special.' }
    ],

  };


  function displayCourses(searchQuery = '') { // Added searchQuery parameter with default empty string
    const courseListUl = document.getElementById('courseList');
    courseListUl.innerHTML = '';
    const filteredCourses = courses.filter(course => {
      const searchText = searchQuery.toLowerCase();
      return course.name.toLowerCase().includes(searchText) || course.id.toLowerCase().includes(searchText);
    });

    if (filteredCourses.length === 0 && searchQuery) { // If no courses found and search query is not empty
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'disabled');
        li.textContent = 'No courses found matching your search.';
        courseListUl.appendChild(li);
    } else {
        filteredCourses.forEach(course => {
            const li = document.createElement('li');
            li.classList.add('list-group-item', 'course-item');
            li.textContent = course.name;
            li.dataset.courseId = course.id;
            li.addEventListener('click', function() {
                displayProfessors(this.dataset.courseId);
                clearReviews();
                highlightSelectedCourse(this);
            });
            courseListUl.appendChild(li);
        });
    }
  }

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
          displayReviews(this.dataset.professorId);
          highlightSelectedProfessor(this);
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

  function displayReviews(professorId) {
    const reviewListDiv = document.getElementById('reviewList');
    reviewListDiv.innerHTML = '';

    // Re-create and append "from RateMyProf" text
    const rateMyProfSmall = document.createElement('small');
    rateMyProfSmall.classList.add('rate-my-prof'); // Removed 'text-muted' class here
    rateMyProfSmall.textContent = 'from RateMyProf';
    reviewListDiv.appendChild(rateMyProfSmall);

    const profReviews = reviews[professorId];
    if (profReviews) {
      profReviews.forEach(review => {
        const p = document.createElement('p');
        p.textContent = review.text;
        reviewListDiv.appendChild(p);
      });
    } else {
      const p = document.createElement('p');
      p.classList.add('text-muted');
      p.textContent = 'No reviews available for this professor.';
      reviewListDiv.appendChild(p);
    }
  }

  function clearReviews() {
    const reviewListDiv = document.getElementById('reviewList');
    reviewListDiv.innerHTML = '<p class="text-muted">Select a professor to see reviews</p>';
    // We should also re-add the "from RateMyProf" text here to keep it consistent if reviews are cleared without selecting a professor again.
    const rateMyProfSmall = document.createElement('small');
    rateMyProfSmall.classList.add('rate-my-prof'); // Removed 'text-muted' class here
    rateMyProfSmall.textContent = 'from RateMyProf';
    reviewListDiv.appendChild(rateMyProfSmall);
  }

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


  displayCourses(); // Initial display of all courses

  // Event listener for the search input
  courseSearchInput.addEventListener('input', function(e) {
    const searchQuery = e.target.value;
    displayCourses(searchQuery); // Call displayCourses with the search query
  });
});