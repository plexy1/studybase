const apiKey = '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'; 
const chatBox = document.getElementById('chat-box');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', sendMessage);

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

async function sendMessage() {
    const message = userInput.value;
    if (message.trim() === "") return; 

    displayMessage(message, 'user');
    userInput.value = ''; 

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "gpt-4-0314",
                messages: [{ role: "user", content: message }] 
            })
        });

        const data = await response.json();
        if (response.ok) {
            const botReply = data.choices[0].message.content;
            displayMessage(botReply, 'bot');
        } else {
            console.error("Error:", data);
            displayMessage("Error: Could not get a response.", 'bot');
        }


    } catch (error) {
        console.error("Error:", error);
        displayMessage("Error: Could not get a response.", 'bot');
    }
}

function displayMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.textContent = message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight; 
}