async function generateFlashcards(topic, cardCount = 10, educationLevel = 'university12') {
  console.log('Starting flashcard generation with:', { topic, cardCount, educationLevel });
  
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
  const count = Math.min(Math.max(parseInt(cardCount) || 10, 1), 20);
  
  // Map education level to descriptive text
  const levelMap = {
    'highSchool': 'high school',
    'university12': 'first or second year university',
    'university34': 'third or fourth year university',
    'masters': 'graduate/masters level'
  };
  
  const level = levelMap[educationLevel] || 'university level';
  
  // Show loading state
  const resultDiv = document.getElementById('geminiResult');
  if (!resultDiv) {
    console.error('Could not find geminiResult div');
    return;
  }

  resultDiv.innerHTML = `
    <div class="loading-container">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Generating flashcards...</p>
    </div>
  `;

  try {
    // Construct the prompt for flashcard generation
    const prompt = `Generate ${count} flashcards about "${topic}" suitable for ${level} students. 
    For each flashcard, provide:
    1. A clear, concise question or term on the front
    2. A comprehensive answer or explanation on the back
    
    Format each flashcard as:
    CARD #[number]
    FRONT: [question/term]
    BACK: [answer/explanation]
    
    Make the content educational and accurate.`;

    console.log('Sending request to API with prompt:', prompt);

    // Make API request with the same endpoint and model as generate-test.js
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    console.log('API Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`API request failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response data:', data);

    if (!data.candidates || !data.candidates[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid API response format:', data);
      throw new Error('Invalid API response format');
    }

    const flashcardsText = data.candidates[0].content.parts[0].text;
    console.log('Raw flashcards text:', flashcardsText);

    const flashcards = parseFlashcards(flashcardsText);
    console.log('Parsed flashcards:', flashcards);
    
    if (flashcards.length === 0) {
      console.error('No flashcards parsed from text:', flashcardsText);
      throw new Error('No valid flashcards could be parsed from the response');
    }

    // Create a test card if no cards were parsed
    if (!flashcards[0]?.front || !flashcards[0]?.back) {
      console.error('Invalid first flashcard:', flashcards[0]);
      throw new Error('Invalid flashcard format');
    }

    displayFlashcards(flashcards);

  } catch (error) {
    console.error('Error generating flashcards:', error);
    resultDiv.innerHTML = `
      <div class="alert alert-danger">
        <h4>Error Generating Flashcards</h4>
        <p>${error.message}</p>
        <p>Please check the console for more details.</p>
        <button class="btn btn-outline-secondary mt-3" onclick="resetStudyTools()">
          <i class="fas fa-arrow-left"></i> Back to Study Tools
        </button>
      </div>
    `;
  }
}

function parseFlashcards(text) {
  console.log('Parsing flashcards from text:', text);
  
  // Split text into individual cards using a more robust regex
  const cardBlocks = text.split(/CARD\s*#\s*\d+/i).filter(block => block.trim());
  console.log('Card blocks:', cardBlocks);
  
  const flashcards = cardBlocks.map(block => {
    const frontMatch = block.match(/FRONT\s*:\s*(.+?)(?=BACK\s*:|$)/is);
    const backMatch = block.match(/BACK\s*:\s*(.+?)(?=CARD\s*#\s*\d+|$)/is);
    
    console.log('Processing block:', {
      block,
      frontMatch: frontMatch ? frontMatch[1] : null,
      backMatch: backMatch ? backMatch[1] : null
    });
    
    if (frontMatch && backMatch) {
      return {
        front: frontMatch[1].trim(),
        back: backMatch[1].trim()
      };
    }
    return null;
  }).filter(card => card !== null);
  
  console.log('Parsed flashcards:', flashcards);
  return flashcards;
}

function displayFlashcards(flashcards) {
  console.log('Displaying flashcards:', flashcards);
  
  let currentIndex = 0;
  const resultDiv = document.getElementById('geminiResult');
  
  if (!resultDiv) {
    console.error('Could not find geminiResult div');
    return;
  }
  
  const html = `
    <div class="container">
      <div class="flashcard-container" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div class="flashcard-controls mb-4">
          <div class="d-flex justify-content-between align-items-center">
            <button class="btn btn-primary" id="prevCard" disabled>
              <i class="fas fa-chevron-left"></i> Previous
            </button>
            <span class="card-counter" style="font-size: 1.1rem; font-weight: 500;">Card 1 of ${flashcards.length}</span>
            <button class="btn btn-primary" id="nextCard">
              Next <i class="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <div class="card flashcard mb-4" style="
          min-height: 300px;
          cursor: pointer;
          background-color: white;
          border: 1px solid #dee2e6;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          perspective: 1000px;
          position: relative;
          transform-style: preserve-3d;
          transition: transform 0.6s;
        ">
          <div class="card-body flashcard-content" style="
            padding: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 300px;
            text-align: center;
          ">
            <div class="flashcard-front" style="
              width: 100%;
              position: absolute;
              backface-visibility: hidden;
              transform: rotateY(0deg);
              background-color: white;
              padding: 2rem;
              border-radius: 12px;
            ">
              <h4 class="mb-0" style="font-size: 1.5rem; color: #333;">${flashcards[0].front}</h4>
            </div>
            <div class="flashcard-back" style="
              width: 100%;
              position: absolute;
              backface-visibility: hidden;
              transform: rotateY(180deg);
              background-color: #f8f9fa;
              padding: 2rem;
              border-radius: 12px;
              display: none;
            ">
              <p class="mb-0" style="font-size: 1.25rem; color: #333;">${flashcards[0].back}</p>
            </div>
          </div>
        </div>

        <div class="text-center mb-4">
          <p class="text-muted">Click the card to flip it</p>
          <p class="text-muted">Use arrow keys to navigate, space/enter to flip</p>
        </div>

        <div class="progress mb-4" style="height: 8px; background-color: #e9ecef; border-radius: 4px;">
          <div class="progress-bar" role="progressbar" style="width: ${(1/flashcards.length) * 100}%; background-color: #0d6efd;"></div>
        </div>

        <div class="text-center mt-4">
          <button class="btn btn-outline-secondary" onclick="resetStudyTools()">
            <i class="fas fa-arrow-left"></i> Back to Study Tools
          </button>
        </div>
      </div>
    </div>
  `;

  resultDiv.innerHTML = html;

  // Add event listeners
  const flashcard = resultDiv.querySelector('.flashcard');
  const prevButton = resultDiv.querySelector('#prevCard');
  const nextButton = resultDiv.querySelector('#nextCard');
  const cardCounter = resultDiv.querySelector('.card-counter');
  const progressBar = resultDiv.querySelector('.progress-bar');
  const frontContent = resultDiv.querySelector('.flashcard-front');
  const backContent = resultDiv.querySelector('.flashcard-back');

  if (!flashcard || !prevButton || !nextButton || !cardCounter || !progressBar || !frontContent || !backContent) {
    console.error('Could not find required elements:', {
      flashcard,
      prevButton,
      nextButton,
      cardCounter,
      progressBar,
      frontContent,
      backContent
    });
    return;
  }

  // Flip card on click
  flashcard.addEventListener('click', () => {
    console.log('Card clicked, flipping...');
    if (!flashcard.classList.contains('flipped')) {
      flashcard.style.transform = 'rotateY(180deg)';
      frontContent.style.display = 'none';
      backContent.style.display = 'block';
      flashcard.classList.add('flipped');
    } else {
      flashcard.style.transform = 'rotateY(0deg)';
      frontContent.style.display = 'block';
      backContent.style.display = 'none';
      flashcard.classList.remove('flipped');
    }
  });

  // Navigation functions
  function updateCard() {
    console.log('Updating card to index:', currentIndex);
    flashcard.style.transform = 'rotateY(0deg)';
    frontContent.style.display = 'block';
    backContent.style.display = 'none';
    flashcard.classList.remove('flipped');
    frontContent.querySelector('h4').textContent = flashcards[currentIndex].front;
    backContent.querySelector('p').textContent = flashcards[currentIndex].back;
    cardCounter.textContent = `Card ${currentIndex + 1} of ${flashcards.length}`;
    progressBar.style.width = `${((currentIndex + 1) / flashcards.length) * 100}%`;
    prevButton.disabled = currentIndex === 0;
    nextButton.disabled = currentIndex === flashcards.length - 1;
  }

  prevButton.addEventListener('click', () => {
    if (currentIndex > 0) {
      currentIndex--;
      updateCard();
    }
  });

  nextButton.addEventListener('click', () => {
    if (currentIndex < flashcards.length - 1) {
      currentIndex++;
      updateCard();
    }
  });

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && currentIndex > 0) {
      currentIndex--;
      updateCard();
    } else if (e.key === 'ArrowRight' && currentIndex < flashcards.length - 1) {
      currentIndex++;
      updateCard();
    } else if (e.key === ' ' || e.key === 'Enter') {
      flashcard.click();
    }
  });
}

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
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`, {
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
    geminiResultDiv.innerHTML = `
      <div class="alert alert-danger">
        <h4>Error Generating Test Questions</h4>
        <p>${error.message}</p>
        <button class="btn btn-outline-secondary mt-3" onclick="resetStudyTools()">
          <i class="fas fa-arrow-left"></i> Back to Study Tools
        </button>
      </div>
    `;
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

// Expose the function to the global scope
window.generateFlashcards = generateFlashcards; 