async function genQuiz(query) {
  const apiKey = 'AIzaSyCovPBpJ9ZcuPKxSvp-nUACQ7e2odcEbxk';

  const promptText = `Generate 5 very specific example test questions for the topic ${query}, for a university level student. Do this in the format of just the question do not put the number`;
  
  const geminiResultDiv = document.getElementById('geminiResult');
  geminiResultDiv.innerHTML = '<p>Loading Questions...</p>';

  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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
  const apiKey = 'AIzaSyCovPBpJ9ZcuPKxSvp-nUACQ7e2odcEbxk';
  const promptText = `Generate a one-sentence answer or numerical solution to: ${query}`;

  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
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

function formatQuestions(roadmapText) {
  const questions = roadmapText.split('\n').filter(Boolean);
  let formattedRoadmap = '<div style="text-align: left;">';
  let questionCounter = 1;

  questions.forEach((question) => {
      if (question.trim()) {
          const answerBoxId = `answer-box-${questionCounter}`;
          formattedRoadmap += `
              <div style="margin-bottom: 15px;">
                  <b>QUESTION ${questionCounter}:</b> ${question}<br>
                  <button onclick="showAnswer('${question}', '${answerBoxId}')" style="margin-top: 5px;">
                      Show Answer
                  </button>
                  <div id="${answerBoxId}" style="display: none; margin-top: 5px;" class="answer-box"></div>
              </div>
          `;
          questionCounter++;
      }
  });

  formattedRoadmap += '</div>';
  return formattedRoadmap;
}

async function showAnswer(question, answerBoxId) {
  const answerBox = document.getElementById(answerBoxId);
  answerBox.innerHTML = '<p>Loading Answer...</p>';
  answerBox.style.display = 'block';

  try {
      const answer = await genAns(question);
      answerBox.innerHTML = `<i>${answer}</i>`;
  } 
  
  catch (error) {
      console.error('Error displaying answer:', error);
      answerBox.innerHTML = '<p>Error Generating Answer.</p>';
  }
}