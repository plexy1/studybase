async function genQuiz(query) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';

  const promptText = `Generate 5 very specific example test questions for the topic ${query}, for a university level student. Generate just the question without putting 1. infront of it`;
  
  const geminiResultDiv = document.getElementById('geminiResult');
  geminiResultDiv.innerHTML = '<p>Loading Questions...</p>';

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

      geminiResultDiv.innerHTML = formatQuestions(roadmap);

  } catch (error) {
      console.error('Gemini search error:', error);
      geminiResultDiv.innerHTML = '<p>Error Generating Questions.</p>';
  }
}

async function genAns(query) {
  const apiKey = 'AIzaSyAJJQLYD2wHZu49VgCIzbAuc2XBWFtCBJA';
  const promptText = `Generate a one-sentence answer or numerical solution to: ${query}`;

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

function formatQuestions(roadmapText) {
  const questions = roadmapText.split('\n').filter(Boolean);
  let formattedRoadmap = '<div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">';

  let questionCounter = 1;

  questions.forEach((question) => {
    if (question.trim()) {
      const answerBoxId = `answer-box-${questionCounter}`;
      const buttonId = `button-${questionCounter}`;

      formattedRoadmap += `
        <div style="width: 50%; border: 2px solid #ccc; padding: 15px; border-radius: 8px; background: #f0f0f0; min-width: 300px;">
            <b>QUESTION ${questionCounter}:</b><br><br> ${question}<br><br>
            <button id="${buttonId}" onclick="showAns('${question}', '${answerBoxId}', '${buttonId}')" style="margin-top: 5px;">
                Show Answer
            </button>
            <div id="${answerBoxId}" style="display: none; margin-top: 5px; padding: 10px; border: 1px solid #ddd; background: #e0e0e0; border-radius: 5px;">
            </div>
        </div>
      `;

      questionCounter++;
    }
  });

  formattedRoadmap += '</div>';
  return formattedRoadmap;
}

async function showAns(question, answerBoxId, buttonId) {
  const answerBox = document.getElementById(answerBoxId);
  const button = document.getElementById(buttonId);

  if (answerBox.style.display === 'none' || answerBox.innerHTML === '') {
    button.disabled = true;

    if (!storedAnswers[question]) {
      answerBox.innerHTML = '<p>Loading Answer...</p>';
      
      try {
        const answer = await genAns(question);
        storedAnswers[question] = `<i>${answer}</i>`;
      } catch (error) {
        console.error('Error displaying answer:', error);
        storedAnswers[question] = '<p>Error Generating Answer.</p>';
      }
    }

    answerBox.innerHTML = storedAnswers[question];
    answerBox.style.display = 'block';
    button.textContent = "Hide Answer";
    button.disabled = false;
  } 
  
  else {
    answerBox.style.display = 'none';
    button.textContent = "Show Answer";
  }
}