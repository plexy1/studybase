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
      <div class="loading-dots">
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
        <div class="loading-dot"></div>
      </div>
      <div class="loading-message">Generating flashcards...</div>
    </div>
  `;

  try {
    // Construct the prompt for flashcard generation
    const prompt = `Generate ${count} flashcards about "${topic}" suitable for ${level} students. 
    For each flashcard, provide:
    1. A clear, concise question or term on the front
    2. A max of 2 sentences answer that matches the complexity of the flashcard
    
    Format each flashcard as:
    CARD #[number]
    FRONT: [question/term]
    BACK: [answer/explanation]
    
    Make the content educational and accurate.`;

    console.log('Sending request to API with prompt:', prompt);

    // Make API request
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
    <style>
      .flashcard-container {
        perspective: 1000px;
        width: 100%;
        max-width: 600px;
        margin: 0 auto;
      }
      .flashcard {
        width: 100%;
        height: 400px;
        position: relative;
        transition: transform 0.8s;
        transform-style: preserve-3d;
      }
      .flashcard.flipped {
        transform: rotateY(180deg);
      }
      .flashcard-front, 
      .flashcard-back {
        position: absolute;
        width: 100%;
        height: 100%;
        backface-visibility: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid #dee2e6;
        border-radius: 12px;
        padding: 2rem;
        text-align: center;
        background-color: white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      }
      [data-bs-theme="dark"] .flashcard-front,
      [data-bs-theme="dark"] .flashcard-back {
        background-color: #1e293b;
        color: #fff;
        border-color: #334155;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      }
      .flashcard-back {
        transform: rotateY(180deg);
        background-color: #f8f9fa;
      }
      [data-bs-theme="dark"] .flashcard-back {
        background-color: #1a2234;
        border-left: 4px solid var(--primary-color);
      }
      [data-bs-theme="dark"] .card-counter {
        color: var(--text-primary-dark);
      }
      [data-bs-theme="dark"] .text-muted {
        color: rgba(255, 255, 255, 0.7) !important;
      }
      [data-bs-theme="dark"] .progress {
        background-color: #334155;
      }
      [data-bs-theme="dark"] .progress-bar {
        background-color: var(--primary-color);
      }
    </style>
    <div class="container">
      <div class="flashcard-container">
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

        <div class="flashcard">
          <div class="flashcard-front">
            <h4 class="mb-0" style="font-size: 1.5rem;">${flashcards[0].front}</h4>
          </div>
          <div class="flashcard-back">
            <p class="mb-0" style="font-size: 1.25rem;">${flashcards[0].back}</p>
          </div>
        </div>

        <div class="text-center mb-4">
          <p class="text-muted">Click the card to flip it</p>
          <p class="text-muted">Use arrow keys to navigate, space/enter to flip</p>
        </div>

        <div class="progress mb-4" style="height: 8px; background-color: #e9ecef; border-radius: 4px;">
          <div class="progress-bar" role="progressbar" style="width: ${(1/flashcards.length) * 100}%; background-color: var(--primary-color);"></div>
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
  const frontContent = resultDiv.querySelector('.flashcard-front h4');
  const backContent = resultDiv.querySelector('.flashcard-back p');

  if (!flashcard || !prevButton || !nextButton || !cardCounter || !progressBar || !frontContent || !backContent) {
    console.error('Could not find required elements');
    return;
  }

  // Flip card on click
  flashcard.addEventListener('click', (e) => {
    console.log('Card clicked, flipping...');
    flashcard.classList.toggle('flipped');
  });

  // Navigation functions
  function updateCard() {
    console.log('Updating card to index:', currentIndex);
    
    // Reset card to front side
    flashcard.classList.remove('flipped');
    
    // Update card content
    frontContent.textContent = flashcards[currentIndex].front;
    backContent.textContent = flashcards[currentIndex].back;
    
    // Update navigation and progress
    cardCounter.textContent = `Card ${currentIndex + 1} of ${flashcards.length}`;
    progressBar.style.width = `${((currentIndex + 1) / flashcards.length) * 100}%`;
    
    // Enable/disable navigation buttons
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

// Expose the function to the global scope
window.generateFlashcards = generateFlashcards;