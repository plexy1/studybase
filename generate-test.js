async function genTest(query, difficulty = 'medium', educationLevel = 'university12', shortAnswerCount = 5, multipleChoiceCount = 5) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';

  const mcCount = parseInt(multipleChoiceCount);
  const SACount = parseInt(shortAnswerCount);
  const finalmCCount = isNaN(mcCount) || mcCount < 1 ? 1 : (mcCount > 20 ? 20 : mcCount);
  const finalSACount = isNaN(SACount) || SACount < 1 ? 1 : (SACount > 20 ? 20 : SACount);

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

  const promptMCText = `Generate ${finalmCCount} multiple choice questions about "${query}" at a ${difficultyLevel} appropriate for a ${levelText}. For each question, provide 4 options (A, B, C, D) with one correct answer and a brief explanation. Format each question EXACTLY as follows:
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

2. Problem-Solving Questions: These can include mathematical word problems, coding challenges, or scenario-based problems with specific solution strategies (more preferred).

For EACH question, provide:
- A clear, engaging question text
- 5 key scoring points that represent:
  - For analytical questions: Critical insights, nuanced understanding, or comprehensive analysis
  - For problem-solving questions: Specific solution steps, key mathematical/logical approaches, or essential components of the solution

Format EXACTLY as follows:
Question: [question text]
Expected Answer: [a quick 2-3 secntence answer that explains the question or the answer to a problem]

IMPORTANT: 
- For Problem-Solving questions, the key points should represent the EXACT steps or components needed to fully solve the problem
- For Analytical questions, focus on depth of insight and comprehensive understanding
- Ensure the scoring points are specific, measurable, and directly related to the question's core content.
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
    const mcResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptMCText
          }]
        }]
      })
    });

    // Generate Short Answer Questions
    const saResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: promptSAText
          }]
        }]
      })
    });

    if (!mcResponse.ok || !saResponse.ok) {
      const mcErrorText = await mcResponse.text();
      const saErrorText = await saResponse.text();
      console.error('API Error Response:', {
        mcErrorText,
        saErrorText
      });
      throw new Error(`API request failed`);
    }

    const mcData = await mcResponse.json();
    const saData = await saResponse.json();

    const multipleChoiceQuestions = mcData.candidates[0].content.parts[0].text;
    const shortAnswerQuestions = saData.candidates[0].content.parts[0].text;

    geminiResultDiv.innerHTML = formatTestQuestions(multipleChoiceQuestions, shortAnswerQuestions, difficulty, educationLevel);

  } catch (error) {
    console.error('Error generating test:', error);
    geminiResultDiv.innerHTML = `
      <div class="alert alert-danger">
        <h4>Error Generating Test Questions</h4>
        <p>${error.message}</p>
        <p>Please try again or try a different topic.</p>
        <button class="btn btn-outline-secondary mt-3" onclick="resetStudyTools()">
          <i class="fas fa-arrow-left"></i> Back to Study Tools
        </button>
      </div>
    `;
  }
}

function formatTestQuestions(multipleChoiceText, shortAnswerText, difficulty, educationLevel) {
  const mcQuestionBlocks = multipleChoiceText.split(/Question:/i).filter(block => block.trim());
  const formattedMCQuestions = [];

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

  // Parse Short Answer Questions
  const saQuestionBlocks = shortAnswerText.split(/Question:/i).filter(block => block.trim());
  const formattedSAQuestions = [];

  for (const block of saQuestionBlocks) {
    const lines = block.split('\n').filter(line => line.trim());
    if (lines.length >= 2) {
      const question = lines[0].trim();
      const keyPoints = lines[1].replace('Expected Answer Key Points:', '').trim().split('•').filter(point => point.trim());

      if (question && keyPoints.length > 0) {
        formattedSAQuestions.push({
          type: 'sa',
          question,
          keyPoints
        });
      }
    }
  }

  if (formattedMCQuestions.length === 0 && formattedSAQuestions.length === 0) {
    throw new Error('No valid questions could be parsed from the response');
  }

  // Start the timer when questions are formatted
  if (typeof startTimer === 'function') {
    startTimer();
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
    <div class="quiz-info mb-3">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <span class="badge bg-secondary">Level: ${levelDisplay}</span>
          <span class="badge bg-secondary ms-2">Difficulty: <span class="${difficultyClass}">${difficultyText}</span></span>
          <span class="badge bg-secondary ms-2">Multiple Choice: ${formattedMCQuestions.length}</span>
          <span class="badge bg-secondary ms-2">Short Answer: ${formattedSAQuestions.length}</span>
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
        <input type="hidden" name="saKeyPoints${index}" value="${q.keyPoints.join('|')}">
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

  // Multiple Choice Question Scoring (remains the same)
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
        <div class="alert alert-success">
          <strong>Correct!</strong>
          <p class="mb-0 mt-2">${explanation}</p>
        </div>`;
    } 
    else {
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

    qBox.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.disabled = true;
    });
  });

  // Enhanced Short Answer Scoring
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';

  for (const [index, qBox] of saQuestions.entries()) {
    const studentAnswer = form.querySelector(`textarea[name="saq${index}"]`).value;
    const keyPointsStr = form.querySelector(`input[name="saKeyPoints${index}"]`).value;
    const keyPoints = keyPointsStr.split('|');

    let feedbackContainer = qBox.querySelector('.feedback-container');
    if (!feedbackContainer) {
      feedbackContainer = document.createElement('div');
      feedbackContainer.className = 'feedback-container mt-3';
      qBox.appendChild(feedbackContainer);
    }

    // If no answer is provided
    if (studentAnswer.trim() === '') {
      feedbackContainer.innerHTML = `
        <div class="alert alert-warning">
          <strong>No answer provided</strong>
          <p class="mb-0 mt-2">Score: 0/5</p>
        </div>`;
      continue;
    }

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
              text: `Evaluate the student's short answer based on these criteria:
              - Student's answer: ${studentAnswer}

              Provide a detailed scoring:
              - First, MUST directly state the SPECIFIC numeric score out of 5. the score should be on IDEAS presented rather than grammar, length, or nitpickinhg. be generous even if every detail isnt stated.
              Next do the next points within 20-25 words MAX:                
              - Highlight any missing or incorrect information. If you dont have any, say "none"
              - If you dont have any, say "none"
              IMPORTANT: Your response MUST include a clear "Score: X/5" at the beginning of the evaluation.`
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      const aiEvaluation = data.candidates[0].content.parts[0].text;

      // More robust score extraction
      const scoreRegexes = [
        /Score:\s*(\d+)\s*\/\s*5/i,
        /Total\s*Score:\s*(\d+)\s*\/\s*5/i,
        /Numeric\s*Score:\s*(\d+)\s*\/\s*5/i
      ];

      let saScore = 0;
      for (const regex of scoreRegexes) {
        const scoreMatch = aiEvaluation.match(regex);
        if (scoreMatch) {
          saScore = parseInt(scoreMatch[1]);
          break;
        }
      }

      // Fallback if no score found
      if (saScore === 0) {
        const matchedPoints = keyPoints.filter(point =>
          studentAnswer.toLowerCase().includes(point.toLowerCase().trim())
        );

        switch (matchedPoints.length) {
          case 0: saScore = 0; break;
          case 1: saScore = 1; break;
          case 2: saScore = 2; break;
          case 3: saScore = 3; break;
          case 4: saScore = 4; break;
          default: saScore = 5; break;
        }
      }

      totalScore += saScore;

      // Determine alert color based on score
      let scoreColor = 'alert-danger';
      if (saScore === 3 || saScore === 4) {
        scoreColor = 'alert-warning';
      } else if (saScore === 5) {
        scoreColor = 'alert-success';
      }

      feedbackContainer.innerHTML = `
        <div class="alert ${scoreColor}">
          <strong>Short Answer Evaluation</strong>
          <p class="mb-0 mt-2">Score: ${saScore}/5</p>
          <p class="mb-0 mt-2"><strong>Answer Evaluation</strong></p>
          <p class="mb-0">${aiEvaluation}</p>

        </div>`;
    } catch (error) {
      console.error('Scoring error:', error);
      
      // Fallback scoring method
      let saScore = 0;
      const matchedPoints = keyPoints.filter(point =>
        studentAnswer.toLowerCase().includes(point.toLowerCase().trim())
      );

      switch (matchedPoints.length) {
        case 0: saScore = 0; break;
        case 1: saScore = 1; break;
        case 2: saScore = 2; break;
        case 3: saScore = 3; break;
        case 4: saScore = 4; break;
        default: saScore = 5; break;
      }

      totalScore += saScore;

      feedbackContainer.innerHTML = `
        <div class="alert alert-warning">
          <strong>Scoring Error</strong>
          <p class="mb-0 mt-2">Fallback Score: ${saScore}/5</p>
          <p class="mb-0 mt-2">Unable to get detailed AI evaluation due to API error.</p>
        </div>`;
    }

    qBox.querySelector('textarea').disabled = true;
  }

  const percentage = (totalScore / (totalMCQuestions + (saQuestions.length * 5))) * 100;
  const resultMessage = document.createElement('div');
  resultMessage.className = 'alert alert-info mt-4';
  resultMessage.innerHTML = `
    <h4>Test Results</h4>
    <p>Multiple Choice Score: ${mcScore}/${totalMCQuestions}</p>
    <p>Total Score: ${totalScore.toFixed(1)}/${totalMCQuestions + (saQuestions.length * 5)} (${percentage.toFixed(1)}%)</p>
  `;
  form.appendChild(resultMessage);
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
}

// Expose the function to the global scope
window.submitTest = submitTest;