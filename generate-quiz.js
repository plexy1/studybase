async function genQuiz(query, questionCount = 5, difficulty = 'medium', educationLevel = 'university12') {
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
      levelText = 'Graduate Student';
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

  const promptText = `Generate ${finalCount} specific numerical problems if its a math related subject or other questions if not about "${query}" at a ${difficultyLevel} appropriate for a ${levelText}. Each question should be tailored to this education level and difficulty. Generate just the question without putting any numbers in front of it.`;

  const geminiResultDiv = document.getElementById('geminiResult');
  const loadingText = "Loading Questions...";
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
    let roadmap = "No Questions Could Be Generated.";

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
      roadmap = data.candidates[0].content.parts.map(part => part.text).join('\n');
    }

    geminiResultDiv.innerHTML = formatQuestions(roadmap, difficulty, educationLevel);

  }catch (error) {
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

async function genAns(query, difficulty, educationLevel) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
  
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
      levelText = 'Graduate Student';
      break;
    default:
      levelText = 'university level student';
  }
  
  let detailLevel = '';
  switch(difficulty) {
    case 'easy':
      detailLevel = 'simple and straightforward';
      break;
    case 'medium':
      detailLevel = 'moderately detailed';
      break;
    case 'hard':
      detailLevel = 'comprehensive and detailed';
      break;
    default:
      detailLevel = 'moderately detailed';
  }
  
  const promptText = `Generate a one sentence answer to this question that would be appropriate for a ${levelText}: ${query}`;

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
    let answer = "No Answer Could Be Generated.";

    if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts) {
      answer = data.candidates[0].content.parts.map(part => part.text).join('\n');
    }

    return answer;
  } catch (error) {
    console.error('Gemini search error:', error);
    return 'Error Generating Answer.';
  }
}

const storedAnswers = {};

function formatQuestions(roadmapText, difficulty, educationLevel) {
  const questionMatches = roadmapText.match(/[^\n]+(\n|$)/g);
  const questions = [];
  
  if (questionMatches) {
    let currentQuestion = "";
    
    for (let i = 0; i < questionMatches.length; i++) {
      const line = questionMatches[i].trim();
      
      if (!line) continue;
      const startsWithNumber = /^\d+[\.\)]/.test(line);
      
      if (startsWithNumber && currentQuestion) {
        questions.push(currentQuestion);
        currentQuestion = line;
      } 
      
      else {
        if (currentQuestion) {
          currentQuestion += " " + line;
        } else {
          currentQuestion = line;
        }
      }
    }
    
    if (currentQuestion) {
      questions.push(currentQuestion);
    }
  }

    if (questions.length === 0) {
    questions.push(...roadmapText.split('\n').filter(Boolean));
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
  
  let formattedRoadmap = `
  <div class="quiz-container">
    <div class="quiz-info mb-3">
      <span class="badge bg-secondary">Level: ${levelDisplay}</span>
      <span class="badge bg-secondary ms-2">Difficulty: <span class="${difficultyClass}">${difficultyText}</span></span>
      <span class="badge bg-secondary ms-2">Questions: ${Math.min(questions.length, 20)}</span>
    </div>
    <div class="question-grid">`;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    if (question.trim()) {
      const answerBoxId = `answer-box-${i+1}`;
      const buttonId = `button-${i+1}`;
      const questionId = `question-${Date.now()}-${i+1}`;
      const cleanQuestion = question.replace(/^\d+[\.\)]\s*/, '');

      formattedRoadmap += `
        <div class="question-box">
            <b>QUESTION ${i+1}</b><br><br> ${cleanQuestion}<br><br>
            <button id="${buttonId}" class="show-answer-button" onclick="showAns('${questionId}', '${answerBoxId}', '${buttonId}', '${difficulty}', '${educationLevel}')">
                Show Answer
            </button>
            <div id="${answerBoxId}" class="answer-box" style="display: none;">
            </div>
        </div>
      `;
      storedAnswers[questionId] = { question: cleanQuestion, answer: null };
    }
  }

  formattedRoadmap += '</div></div>';
  formattedRoadmap += `
    </div>
    <div class="text-center mt-4">
      <button type="button" class="btn btn-outline-secondary btn-lg ms-2" onclick="resetStudyTools()">
        <i class="fas fa-arrow-left me-2"></i>Back To Study Page
      </button>
    </div>
  </form>
  </div>`;

  return formattedRoadmap;
}

async function showAns(questionId, answerBoxId, buttonId, difficulty, educationLevel) {
  const answerBox = document.getElementById(answerBoxId);
  const button = document.getElementById(buttonId);

  if (answerBox.style.display === 'none' || answerBox.innerHTML === '') {
    button.disabled = true;

    if (!storedAnswers[questionId].answer) {
      answerBox.innerHTML = '<p>Loading Answer...</p>';

      try {
        const answer = await genAns(storedAnswers[questionId].question, difficulty, educationLevel);
        storedAnswers[questionId].answer = `<i>${answer}</i>`;
      } catch (error) {
        console.error('Error displaying answer:', error);
        storedAnswers[questionId].answer = '<p>Error Generating Answer.</p>';
      }
    }

    answerBox.innerHTML = storedAnswers[questionId].answer;
    answerBox.style.display = 'block';
    button.textContent = "Hide Answer";
    button.disabled = false;
  }
  else {
    answerBox.style.display = 'none';
    button.textContent = "Show Answer";
  }
}