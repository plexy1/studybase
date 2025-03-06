document.addEventListener('DOMContentLoaded', function () {
  const darkModeToggle = document.getElementById('darkModeToggle');
  const body = document.body;
  const courseSearchInput = document.getElementById('courseSearch');

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

  // Sample professor and review data
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

  // Display courses based on search query
  function displayCourses(searchQuery = '') {
      const courseListUl = document.getElementById('courseList');
      courseListUl.innerHTML = '';

      fetch('courses.json')
          .then(response => response.json())
          .then(courses => {
              const filteredCourses = courses.filter(course => {
                  const searchText = searchQuery.toLowerCase();
                  return (
                      course.name.toLowerCase().includes(searchText) ||
                      course.id.toLowerCase().includes(searchText)
                  );
              });

              if (filteredCourses.length === 0 && searchQuery) {
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
                      li.addEventListener('click', function () {
                          displayProfessors(this.dataset.courseId);
                          clearReviews();
                          highlightSelectedCourse(this);
                      });
                      courseListUl.appendChild(li);
                  });
              }
          })
          .catch(error => {
              console.error('Error loading courses:', error);
              const li = document.createElement('li');
              li.classList.add('list-group-item', 'disabled', 'text-danger');
              li.textContent = 'Failed to load courses. Please check the console for errors.';
              courseListUl.appendChild(li);
          });
  }

  // Other functions (displayProfessors, displayReviews, etc.) remain unchanged...

  // Initial display of all courses
  displayCourses();

  // Event listener for the search input
  courseSearchInput.addEventListener('input', function (e) {
      const searchQuery = e.target.value;
      displayCourses(searchQuery);
  });
});