async function genTest(query, questionCount = 10, difficulty = 'medium', educationLevel = 'university12') {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
  const count = parseInt(questionCount);
  const finalCount = isNaN(count) || count < 1 ? 1 : (count > 20 ? 20 : count);
  
  let levelText = '';
  switch(educationLevel) {
    case 'highSchool':
      levelText = 'High School';
      break;
    case 'university12':
      levelText = 'Year 1-2 University';
      break;
    case 'university34':
      levelText = 'Year 3-4 University';
      break;
    case 'masters':
      levelText = 'Masters/PhD';
      break;
    default:
      levelText = 'university level student';
  }
  
  let difficultyLevel = '';
  switch(difficulty) {
    case 'easy':
      difficultyLevel = 'basic, introductory level';
      break;
    case 'medium':
      difficultyLevel = 'intermediate level';
      break;
    case 'hard':
      difficultyLevel = 'advanced, challenging level';
      break;
    default:
      difficultyLevel = 'intermediate level';
  }

  const promptText = `Generate ${finalCount} multiple choice questions about "${query}" at a ${difficultyLevel} appropriate for a ${levelText}. For each question, provide 4 options (A, B, C, D) with one correct answer and a brief explanation. Format each question as follows:
Question: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [letter of correct answer]
Explanation: [brief explanation of why this is the correct answer]`;

  const geminiResultDiv = document.getElementById('geminiResult');
  const loadingText = "Loading Test Questions...";
  let loadingHTML = '<div class="loading-container">';
  for (let i = 0; i < loadingText.length; i++) {
    loadingHTML += `<span style="animation-delay: ${i * 0.1}s" class="loading-letter">${loadingText[i]}</span>`;
  }
  loadingHTML += '</div>';
  geminiResultDiv.innerHTML = loadingHTML;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: promptText }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    let questions = "No Questions Could Be Generated.";

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
      questions = data.candidates[0].content.parts.map(part => part.text).join('\n');
    }

    geminiResultDiv.innerHTML = formatTestQuestions(questions, difficulty, educationLevel);

  } catch (error) {
    console.error('Gemini search error:', error);
    geminiResultDiv.innerHTML = '<p>Error Generating Test Questions.</p>';
  }
}

function formatTestQuestions(questionsText, difficulty, educationLevel) {
  const questionBlocks = questionsText.split('\n\n').filter(block => block.trim());
  const formattedQuestions = [];
  
  for (const block of questionBlocks) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length >= 7) { // Question + 4 options + correct answer + explanation
      const question = lines[0].replace('Question:', '').trim();
      const options = lines.slice(1, 5).map(line => line.trim());
      const correctAnswer = lines[5].replace('Correct Answer:', '').trim();
      const explanation = lines[6].replace('Explanation:', '').trim();
      
      formattedQuestions.push({
        question,
        options,
        correctAnswer,
        explanation
      });
    }
  }

  // Start the timer when questions are formatted
  if (typeof startTimer === 'function') {
    startTimer();
  }

  let levelDisplay = '';
  switch(educationLevel) {
    case 'highSchool':
      levelDisplay = 'High School';
      break;
    case 'university12':
      levelDisplay = 'Year 1-2 University';
      break;
    case 'university34':
      levelDisplay = 'Year 3-4 University';
      break;
    case 'masters':
      levelDisplay = 'Masters+';
      break;
    default:
      levelDisplay = 'None Specified';
  }

  let difficultyClass = '';
  let difficultyText = '';
  
  switch(difficulty) {
    case 'easy':
      difficultyClass = 'text-success';
      difficultyText = 'Easy';
      break;
    case 'medium':
      difficultyClass = 'text-warning';
      difficultyText = 'Medium';
      break;
    case 'hard':
      difficultyClass = 'text-danger';
      difficultyText = 'Hard';
      break;
    default:
      difficultyClass = 'text-warning';
      difficultyText = 'Medium';
  }

  let formattedTest = `
  <div class="quiz-container">
    <div class="quiz-info mb-3">
      <span class="badge bg-secondary">Level: ${levelDisplay}</span>
      <span class="badge bg-secondary ms-2">Difficulty: <span class="${difficultyClass}">${difficultyText}</span></span>
      <span class="badge bg-secondary ms-2">Questions: ${formattedQuestions.length}</span>
    </div>
    <form id="testForm" onsubmit="submitTest(event)">
      <div class="question-grid">`;

  formattedQuestions.forEach((q, index) => {
    formattedTest += `
      <div class="question-box">
        <b>QUESTION ${index + 1}</b><br><br>
        ${q.question}<br><br>
        <div class="options-container">
          ${q.options.map((option, optIndex) => `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="q${index}" id="q${index}opt${optIndex}" value="${String.fromCharCode(65 + optIndex)}">
              <label class="form-check-label" for="q${index}opt${optIndex}">
                ${option}
              </label>
            </div>
          `).join('')}
        </div>
        <input type="hidden" name="correct${index}" value="${q.correctAnswer}">
        <input type="hidden" name="explanation${index}" value="${q.explanation}">
      </div>`;
  });

  formattedTest += `
      </div>
      <div class="text-center mt-4">
        <button type="submit" class="btn btn-primary btn-lg">
          <i class="fas fa-check-circle me-2"></i>Submit Test
        </button>
      </div>
    </form>
  </div>`;

  return formattedTest;
}

function submitTest(event) {
  event.preventDefault();
  const form = event.target;
  const questions = form.querySelectorAll('.question-box');
  let score = 0;
  let totalQuestions = questions.length;

  questions.forEach((qBox, index) => {
    const selectedAnswer = form.querySelector(`input[name="q${index}"]:checked`);
    const correctAnswer = form.querySelector(`input[name="correct${index}"]`).value;
    const explanation = form.querySelector(`input[name="explanation${index}"]`).value;
    
    // Create or get the feedback container
    let feedbackContainer = qBox.querySelector('.feedback-container');
    if (!feedbackContainer) {
      feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'feedback-container mt-3';
      qBox.appendChild(feedbackContainer);
    }

    if (selectedAnswer && selectedAnswer.value === correctAnswer) {
      score++;
      qBox.classList.add('correct');
      feedbackContainer.innerHTML = `
        <div class="alert alert-success">
          <strong>Correct!</strong>
          <p class="mb-0 mt-2">${explanation}</p>
        </div>`;
    } else {
      qBox.classList.add('incorrect');
      const selectedOption = selectedAnswer ? selectedAnswer.value : 'Not answered';
      feedbackContainer.innerHTML = `
        <div class="alert alert-danger">
          <strong>Incorrect</strong>
          <p class="mb-0 mt-2">Your answer: ${selectedOption}</p>
          <p class="mb-0 mt-2">Correct answer: ${correctAnswer}</p>
          <p class="mb-0 mt-2">${explanation}</p>
        </div>`;
    }

    // Disable all radio buttons for this question
    qBox.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.disabled = true;
    });
  });

  const percentage = (score / totalQuestions) * 100;
  const resultMessage = document.createElement('div');
  resultMessage.className = 'alert alert-info mt-4';
  resultMessage.innerHTML = `
    <h4>Test Results</h4>
    <p>Your score: ${score}/${totalQuestions} (${percentage}%)</p>
  `;
  form.appendChild(resultMessage);
  
  // Disable the submit button
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
} 