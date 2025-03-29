async function genTest(query, difficulty = 'medium', educationLevel = 'university12', shortAnswerCount = 5, multipleChoiceCount = 5, timeLimit = 10) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
  const mcCount = parseInt(multipleChoiceCount);
  const SACount = parseInt(shortAnswerCount);
  const finalmCCount = mcCount < 0 ? 0 : (mcCount > 20 ? 20 : mcCount);
  const finalSACount = SACount < 0 ? 0 : (SACount > 20 ? 20 : SACount);

  let levelText = '';
  switch (educationLevel) {
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
      levelText = 'Graduate Student';
      break;
    default:
      levelText = 'university level student';
  }

  let difficultyLevel = '';
  switch (difficulty) {
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

  const promptMCText = `Generate ${finalmCCount} unique multiple choice questions about "${query}" at a ${difficultyLevel} appropriate for a ${levelText}. For each question, provide 4 options (A, B, C, D) with one correct answer and a brief explanation. Format each question EXACTLY as follows:
Question: [question text]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct Answer: [letter of correct answer]
Explanation: [brief explanation of why this is the correct answer]

Make sure each question follows this exact format with no additional text or formatting.`;

  const promptSAText = `Generate ${finalSACount} short answer questions about "${query}" at a ${difficultyLevel} appropriate for a ${levelText}. These questions can be of two types:

1. Open-Ended Analytical Questions: Requiring a detailed, thoughtful response of 3-5 sentences that demonstrates comprehensive understanding.

2. Problem-Solving Questions: These can include mathematical word problems, coding challenges, or scenario-based problems where there could be multiple valid approaches to the solution.

For EACH question, provide:
- A clear, engaging question text
- A model answer that represents what a correct answer would contain, but emphasize that any valid approach that reaches the correct conclusion should be accepted

Format EXACTLY as follows:
Question: [question text]
Expected Answer: [a concise explanation of what constitutes a correct answer, including possible alternative approaches]

IMPORTANT: 
- For Problem-Solving questions, focus on the correctness of the final result rather than requiring a specific method
- For Analytical questions, focus on depth of insight and comprehensive understanding
- DO NOT list specific key points for grading
- DO NOT ADD ANY BOLDS OR ANYTHING ELSE!`;

  const geminiResultDiv = document.getElementById('geminiResult');
  if (!geminiResultDiv) {
    console.error('Could not find geminiResult div');
    return;
  }

  const loadingText = "Loading Test Questions...";
  let loadingHTML = `
    <div class="loading-container">
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
      <div class="loading-message">${loadingText}</div>
    </div>
  `;
  geminiResultDiv.innerHTML = loadingHTML;

  try {
    let multipleChoiceQuestions = '';
    let shortAnswerQuestions = '';
    const apiCalls = [];

    if (finalmCCount > 0) {
      apiCalls.push(
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptMCText }] }]
          })
        }).then(response => {
          if (!response.ok) throw new Error('API request for MC questions failed');
          return response.json();
        }).then(data => {
          multipleChoiceQuestions = data.candidates[0].content.parts[0].text;
        })
      );
    }

    if (finalSACount > 0) {
      apiCalls.push(
        fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptSAText }] }]
          })
        }).then(response => {
          if (!response.ok) throw new Error('API request for SA questions failed');
          return response.json();
        }).then(data => {
          shortAnswerQuestions = data.candidates[0].content.parts[0].text;
        })
      );
    }
    await Promise.all(apiCalls);

    geminiResultDiv.innerHTML = formatTestQuestions(multipleChoiceQuestions, shortAnswerQuestions, difficulty, educationLevel, timeLimit);

  } catch (error) {
    console.error('Error generating test:', error);
    geminiResultDiv.innerHTML = `
      <div class="card border-danger mb-3">
        <div class="card-header bg-danger text-white">
          <h4 class="m-0">Error Generating Test Questions</h4>
        </div>
        <div class="card-body">
          <p>${error.message}</p>
          <p>Please try again or try a different topic.</p>
          <button class="btn btn-outline-secondary mt-3" onclick="resetStudyTools()">
            <i class="fas fa-arrow-left"></i> Back to Study Tools
          </button>
        </div>
      </div>
    `;
  }
}

function formatTestQuestions(multipleChoiceText, shortAnswerText, difficulty, educationLevel, timeLimit) {
  const timeCount = parseInt(timeLimit);
  const finaltime = isNaN(timeCount) || timeCount < 1 ? 1 : (timeCount > 60 ? 60 : timeCount);

  const formattedMCQuestions = [];
  if (multipleChoiceText && multipleChoiceText.trim() !== '') {
    const mcQuestionBlocks = multipleChoiceText.split(/Question:/i).filter(block => block.trim());
    
    for (const block of mcQuestionBlocks) {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length >= 7) {
        const question = lines[0].trim();
        const options = lines.slice(1, 5).map(line => line.trim());
        const correctAnswer = lines[5].replace('Correct Answer:', '').trim();
        const explanation = lines[6].replace('Explanation:', '').trim();

        if (question && options.length === 4 && correctAnswer && explanation) {
          formattedMCQuestions.push({
            type: 'mc',
            question,
            options,
            correctAnswer,
            explanation
          });
        }
      }
    }
  }

  const formattedSAQuestions = [];
  if (shortAnswerText && shortAnswerText.trim() !== '') {
    const saQuestionBlocks = shortAnswerText.split(/Question:/i).filter(block => block.trim());
    
    for (const block of saQuestionBlocks) {
      const lines = block.split('\n').filter(line => line.trim());
      if (lines.length >= 2) {
        const question = lines[0].trim();
        const answerLine = lines.find(line => line.includes('Expected Answer'));
        if (question && answerLine) {
          const expectedAnswer = answerLine.replace('Expected Answer:', '').trim();
          
          formattedSAQuestions.push({
            type: 'sa',
            question,
            expectedAnswer
          });
        }
      }
    }
  }

  let levelDisplay = '';
  switch (educationLevel) {
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

  switch (difficulty) {
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
    <!-- Timer display -->
    <div id="timerDisplay" style="display: none;" class="mb-4">
      <div class="d-flex justify-content-between align-items-center">
        <h5 class="mb-0">Time Remaining: <span id="timeRemaining">--:--</span></h5>
      </div>
    </div>

    <!-- Centered test info -->
    <div class="quiz-info mb-4">
      <div class="d-flex justify-content-center align-items-center text-center">
        <div>
          <span class="badge bg-secondary mx-1">Level: ${levelDisplay}</span>
          <span class="badge bg-secondary mx-1">Difficulty: <span class="${difficultyClass}">${difficultyText}</span></span>
          <span class="badge bg-secondary mx-1">Multiple Choice: ${formattedMCQuestions.length}</span>
          <span class="badge bg-secondary mx-1">Short Answer: ${formattedSAQuestions.length}</span>
          <span class="badge bg-secondary mx-1">Time Limit: ${finaltime} min</span>
        </div>
      </div>
    </div>
    
    <form id="testForm" onsubmit="submitTest(event)">
      <div class="question-grid">`;

  // Add Multiple Choice Questions
  formattedMCQuestions.forEach((q, index) => {
    formattedTest += `
      <div class="question-box multiple-choice">
        <b>MULTIPLE CHOICE QUESTION ${index + 1}</b><br><br>
        ${q.question}<br><br>
        <div class="options-container">
          ${q.options.map((option, optIndex) => `
            <div class="form-check">
              <input class="form-check-input" type="radio" name="mcq${index}" id="mcq${index}opt${optIndex}" value="${String.fromCharCode(65 + optIndex)}">
              <label class="form-check-label" for="mcq${index}opt${optIndex}">
                ${option}
              </label>
            </div>
          `).join('')}
        </div>
        <input type="hidden" name="mcCorrect${index}" value="${q.correctAnswer}">
        <input type="hidden" name="mcExplanation${index}" value="${q.explanation}">
      </div>`;
  });

  // Add Short Answer Questions
  formattedSAQuestions.forEach((q, index) => {
    formattedTest += `
      <div class="question-box short-answer">
        <b>SHORT ANSWER QUESTION ${index + 1}</b><br><br>
        ${q.question}<br><br>
        <div class="short-answer-container">
          <textarea class="form-control" name="saq${index}" rows="5" placeholder="Type your answer here..."></textarea>
        </div>
        <input type="hidden" name="saExpectedAnswer${index}" value="${q.expectedAnswer}">
      </div>`;
  });

  formattedTest += `
      </div>
      <div class="text-center mt-4">
        <button type="submit" class="btn btn-primary btn-lg">
          <i class="fas fa-check-circle me-2"></i>Submit Test
        </button>
        <button type="button" class="btn btn-outline-secondary btn-lg ms-2" onclick="resetStudyTools()">
          <i class="fas fa-arrow-left me-2"></i>Back To Study Page
        </button>
      </div>
    </form>
  </div>`;

  // Start the timer when the test is displayed
  setTimeout(() => {
    startTimer(finaltime);
  }, 500);

  return formattedTest;
}

async function submitTest(event) {
  event.preventDefault();
  const form = event.target;
  const mcQuestions = form.querySelectorAll('.multiple-choice');
  const saQuestions = form.querySelectorAll('.short-answer');
  let mcScore = 0;
  let totalMCQuestions = mcQuestions.length;
  let totalScore = 0;

  // Stop the timer when test is submitted
  if (window.quizTimer) {
    clearInterval(window.quizTimer);
    document.getElementById('timeRemaining').textContent = "Test Submitted";
  }

  mcQuestions.forEach((qBox, index) => {
    const selectedAnswer = form.querySelector(`input[name="mcq${index}"]:checked`);
    const correctAnswer = form.querySelector(`input[name="mcCorrect${index}"]`).value;
    const explanation = form.querySelector(`input[name="mcExplanation${index}"]`).value;

    let feedbackContainer = qBox.querySelector('.feedback-container');
    if (!feedbackContainer) {
      feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'feedback-container mt-3';
      qBox.appendChild(feedbackContainer);
    }

    if (selectedAnswer && selectedAnswer.value === correctAnswer) {
      mcScore++;
      totalScore++;
      qBox.classList.add('correct');
      feedbackContainer.innerHTML = `
        <div class="card border-success mb-3">
          <div class="card-header bg-success text-white">
            <strong>Correct!</strong>
          </div>
          <div class="card-body">
            <p class="mb-0">${explanation}</p>
          </div>
        </div>`;
    }
    else {
      qBox.classList.add('incorrect');
      const selectedOption = selectedAnswer ? selectedAnswer.value : 'Not answered';
      feedbackContainer.innerHTML = `
        <div class="card border-danger mb-3">
          <div class="card-header bg-danger text-white">
            <strong>Incorrect</strong>
          </div>
          <div class="card-body">
            <p class="mb-0">Your answer: ${selectedOption}</p>
            <p class="mb-0">Correct answer: ${correctAnswer}</p>
            <p class="mb-0">${explanation}</p>
          </div>
        </div>`;
    }

    qBox.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.disabled = true;
    });
  });

  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';

  for (const [index, qBox] of saQuestions.entries()) {
    const studentAnswer = form.querySelector(`textarea[name="saq${index}"]`).value;
    const expectedAnswer = form.querySelector(`input[name="saExpectedAnswer${index}"]`).value;
    const questionText = qBox.querySelector('b').nextSibling.nextSibling.nextSibling.textContent.trim();

    let feedbackContainer = qBox.querySelector('.feedback-container');
    if (!feedbackContainer) {
      feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'feedback-container mt-3';
      qBox.appendChild(feedbackContainer);
    }

    // If no answer is provided
    if (studentAnswer.trim() === '') {
      feedbackContainer.innerHTML = `
        <div class="card shadow border-0 mb-3">
          <div class="card-header bg-warning text-white">
            <strong>No answer provided</strong>
          </div>
          <div class="card-body">
            <div class="d-flex align-items-center">
              <div class="display-4 me-3 text-warning">0</div>
              <div class="flex-grow-1">
                <div class="progress" style="height: 10px;">
                  <div class="progress-bar bg-warning" role="progressbar" style="width: 0%"></div>
                </div>
                <div class="text-muted small mt-1">of 5 points</div>
              </div>
            </div>
          </div>
        </div>`;
      continue;
    }
    feedbackContainer.innerHTML = `
      <div class="card shadow border-0 mb-3">
        <div class="card-header bg-info text-white">
          <strong>Evaluating your answer...</strong>
        </div>
        <div class="card-body text-center py-4">
          <div class="spinner-border text-info" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="text-muted mt-3 mb-0">Analyzing your response...</p>
        </div>
      </div>`;

    // Use Gemini API to compare and score the answer
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Grade this student's answer to the following question:

Question: ${questionText}

Student's answer: ${studentAnswer}

Expected answer (for reference): ${expectedAnswer}

Your task:
1. Be generous in grading based on CORRECTNESS of the solution rather than matching a specific approach or methodology.
2. ANY valid method that reaches the correct conclusion should receive a 5/5.
3. Focus on whether the student understands the core concepts and can solve the problem correctly, not on whether they used a specific approach.
4. For mathematical or technical problems, if the student uses a different but valid approach (e.g., L'Hôpital's rule instead of factoring, or a different algorithm that produces the same result), they should receive full credit.
5. Give a 5/5 if the student demonstrates understanding and arrives at the correct solution, even if their approach differs.
6. Give a 4/5 for mostly correct answers with minor errors or omissions.
7. Give a 3/5 for partially correct answers with some understanding but significant gaps.
8. Give a 2/5 only for answers that show minimal understanding.
9. Give a 1/5 if student shows incorrect answers and poor understanding.
10. Give a 0/5 only for blank answers or completely irrelevant responses.

Format your response EXACTLY like this:
Score: [number 0-5]
Missing: [ONLY include this field if score is LESS than 5, otherwise omit completely]

If the score is 5/5, your response should ONLY contain "Score: 5" with no "Missing:" field.
DO NOT add ANY other commentary, explanation or feedback.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiEvaluation = data.candidates[0].content.parts[0].text;
      const scoreMatch = aiEvaluation.match(/Score:\s*(\d+)/i);
      const missingMatch = aiEvaluation.match(/Missing:\s*(.*?)(?:\n|$)/i);
      
      let saScore = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      let missingInfo = missingMatch ? missingMatch[1].trim() : "";
      
      saScore = Math.min(saScore, 5);
      totalScore += saScore;
      let scoreClass = 'danger';
      let progressWidth = (saScore / 5) * 100;
      
      if (saScore === 3) {
        scoreClass = 'warning';
      } else if (saScore === 4) {
        scoreClass = 'info';
      } else if (saScore === 5) {
        scoreClass = 'success';
      }

      feedbackContainer.innerHTML = `
      <div class="card shadow border-0 mb-3">
        <div class="card-header bg-${scoreClass} text-white d-flex justify-content-between align-items-center">
          <strong>Answer Assessment</strong>
          <span class="badge bg-white text-${scoreClass} px-2 py-1 rounded-pill">${saScore}/5</span>
        </div>
        <div class="card-body">
          <div class="d-flex align-items-center mb-3">
            <div class="display-4 me-3 text-${scoreClass}">${saScore}</div>
            <div class="flex-grow-1">
              <div class="progress" style="height: 10px;">
                <div class="progress-bar bg-${scoreClass}" role="progressbar" style="width: ${progressWidth}%"></div>
              </div>
              <div class="text-muted small mt-1">of 5 points</div>
            </div>
          </div>
          ${
            studentAnswer.trim() === '' ? 
              '' : 
              saScore === 5 ? 
                `<div class="alert alert-success mb-0">
                  <i class="fas fa-check-circle me-1"></i> Your solution is correct. Well done!
                </div>` : 
              saScore === 4 ? 
                `<div class="alert alert-info mb-0">
                  <i class="fas fa-info-circle me-1"></i> Your solution is mostly correct, but ${missingInfo}
                </div>` : 
              saScore === 3 ? 
                `<div class="alert alert-warning mb-0">
                  <i class="fas fa-exclamation-circle me-1"></i> Your solution shows partial understanding, but ${missingInfo}
                </div>` : 
              saScore === 2 ? 
                `<div class="alert alert-danger mb-0">
                  <i class="fas fa-times-circle me-1"></i> Your solution shows minimal understanding. ${missingInfo}
                </div>` : 
              saScore === 1 ? 
                `<div class="alert alert-danger mb-0">
                  <i class="fas fa-times-circle me-1"></i> Your solution is incorrect. ${missingInfo}
                </div>` : 
                `<div class="alert alert-danger mb-0">
                  <i class="fas fa-times-circle me-1"></i> No relevant answer provided.
                </div>`
          }
        </div>
      </div>`;
    } 
    
    catch (error) {
      console.error('Scoring error:', error);
      
      feedbackContainer.innerHTML = `
        <div class="card shadow border-0 mb-3">
          <div class="card-header bg-danger text-white">
            <strong>Scoring Error</strong>
          </div>
          <div class="card-body">
            <p>There was an error evaluating your answer. Please try resubmitting or contact support.</p>
            <p class="text-muted small mb-0">Error: ${error.message}</p>
          </div>
        </div>`;
    }

    qBox.querySelector('textarea').disabled = true;
  }

  const percentage = (totalScore / (totalMCQuestions + (saQuestions.length * 5))) * 100;
  const resultMessage = document.createElement('div');
  resultMessage.className = 'card shadow border-0 mb-4 mt-4';
  
  let gradeClass = 'danger';
  if (percentage >= 70 && percentage < 80) {
    gradeClass = 'warning';
  } else if (percentage >= 80 && percentage < 90) {
    gradeClass = 'info';
  } else if (percentage >= 90) {
    gradeClass = 'success';
  }
  
  resultMessage.innerHTML = `
    <div class="card-header bg-primary text-white">
      <h4 class="m-0">Test Results</h4>
    </div>
    <div class="card-body">
      <div class="row align-items-center">
        <div class="col-md-4 text-center mb-3 mb-md-0">
          <div class="display-1 text-${gradeClass}">${percentage.toFixed(0)}%</div>
          <div class="progress mt-2" style="height: 8px;">
            <div class="progress-bar bg-${gradeClass}" role="progressbar" style="width: ${percentage}%"></div>
          </div>
        </div>
        <div class="col-md-8">
          <div class="d-flex justify-content-between mb-2">
            <span>Multiple Choice</span>
            <span class="fw-bold">${mcScore}/${totalMCQuestions}</span>
          </div>
          <div class="progress mb-3" style="height: 6px;">
            <div class="progress-bar bg-primary" role="progressbar" 
                 style="width: ${(mcScore/totalMCQuestions)*100}%"></div>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span>Short Answer</span>
            <span class="fw-bold">${(totalScore - mcScore).toFixed(1)}/${(saQuestions.length * 5)}</span>
          </div>
          <div class="progress mb-3" style="height: 6px;">
            <div class="progress-bar bg-info" role="progressbar" 
                 style="width: ${((totalScore - mcScore)/(saQuestions.length * 5))*100}%"></div>
          </div>
          
          <div class="d-flex justify-content-between fw-bold">
            <span>Total Score</span>
            <span>${totalScore.toFixed(1)}/${totalMCQuestions + (saQuestions.length * 5)}</span>
          </div>
        </div>
      </div>
    </div>
  `;
  form.insertBefore(resultMessage, form.querySelector('.text-center.mt-4'));
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
}

function startTimer(minutes) {
  if (typeof window.quizTimer === 'undefined') {
    window.quizTimer = null;
  }
  
  if (window.quizTimer) {
    clearInterval(window.quizTimer);
  }

  const timerDisplay = document.getElementById('timerDisplay');
  const timeRemaining = document.getElementById('timeRemaining');

  if (!timerDisplay || !timeRemaining) {
    console.error('Timer elements not found');
    return;
  }

  timerDisplay.style.display = 'block';

  const totalSeconds = minutes * 60;
  let secondsLeft = totalSeconds;

  function updateTimerDisplay() {
    const minutesLeft = Math.floor(secondsLeft / 60);
    const secondsDisplay = secondsLeft % 60;
    timeRemaining.textContent = `${minutesLeft}:${secondsDisplay < 10 ? '0' : ''}${secondsDisplay}`;
  }

  // Initial display
  updateTimerDisplay();

  window.quizTimer = setInterval(() => {
    secondsLeft--;
    updateTimerDisplay();

    if (secondsLeft <= 0) {
      clearInterval(window.quizTimer);
      timeRemaining.textContent = "Time's up!";

      const timeUpNotification = document.createElement('div');
      timeUpNotification.className = 'card border-warning mb-3';
      timeUpNotification.innerHTML = `
        <div class="card-header bg-warning text-white">
          <strong>Time's up!</strong>
        </div>
        <div class="card-body">
          <p class="mb-0">Your test has been automatically submitted.</p>
        </div>
      `;
      
      const quizContainer = document.querySelector('.quiz-container');
      if (quizContainer && quizContainer.firstChild) {
        quizContainer.insertBefore(timeUpNotification, quizContainer.firstChild);
      }

      const testForm = document.getElementById('testForm');
      if (testForm) {
        testForm.dispatchEvent(new Event('submit'));
      }
    }
  }, 1000);
}

// Expose the function to the global scope
window.submitTest = submitTest;