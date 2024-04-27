
const conversationDict = {
    "what is your name?": "My name is FutureScribe AI.🤗",
    "ok, okay": "Roger that! Whenever you require a text summary, I'll be right here. Just give me the green light.",
    "who is your inventor?, who is your creator?, about your owner?": "I am an AI that has been created by ABNGroup. This is not a company or organization, but rather a group of B.Tech students who have developed me during their major project.",
    "what task do you do?": "I specialize in text summarization, performing both extractive and abstractive summarization.",
    "what is empowering you?": "I am powered by advanced algorithms and machine learning techniques to provide accurate summaries.",
    "what is an artificial intelligence?": "Artificial intelligence is a branch of computer science that emphasizes the creation of intelligent machines that work and react like humans.",
    "why do we need artificial intelligence?": "We need AI to solve complex problems, automate routine work, and improve efficiency in various tasks.",
    "can you summarize text?": "Yes, I can summarize text by extracting key points or condensing it into a shorter version while preserving the original meaning.",
    "what is extractive summarization?": "Extractive summarization involves selecting and compiling key phrases and sentences from the original text to form a summary.",
    "what abstractive summarization?": "Abstractive summarization generates new sentences that capture the essence of the original text, often using natural language generation techniques.",
    "how do you understand text?": "I use natural language processing techniques to analyze the structure and meaning of the text to understand it.",
    "are you capable of learning?": "As an AI, I can improve over time by learning from new data and experiences through machine learning algorithms.",
    "what languages can you understand?": "I can understand and process text in multiple languages, depending on my programming and the data I've been trained on.",
    "what is the definition of artificial intelligence?": "AI refers to systems that show intelligent behavior: by analyzing their environment they can perform various tasks with some degree of autonomy to achieve specific goals.",
    "who coined the term artificial intelligence?": "The term 'artificial intelligence' was first coined by John McCarthy in 1956.",
    "does artificial intelligence exist?": "Yes, artificial intelligence exists and is a rapidly growing field in technology.",
    "can artificial intelligence be dangerous?": "AI has the potential to be dangerous if not designed or used responsibly, but it also has the potential for great benefits.",
    "how will artificial intelligence change the future?": "AI is expected to revolutionize many aspects of our lives, from healthcare to transportation, by improving efficiency and enabling new capabilities.",
    "how can we apply artificial intelligence?": "AI can be applied in various fields such as healthcare, finance, education, and more, to analyze data, automate tasks, and solve complex problems.",
    "what are the typical jobs related to artificial intelligence?": "Typical jobs in AI include data scientists, machine learning engineers, AI researchers, and more.",
    "will china be the AI superpower?": "China is investing heavily in AI and aims to be a leader in the field, but it's a global race with many contributors.",
    "which are the most powerful artificial intelligence companies?": "Some of the most powerful AI companies include Google, IBM, Amazon, and Microsoft.",
    "what are some common benefits of artificial intelligence technology?": "Common benefits include increased efficiency, improved decision-making, and the ability to handle complex tasks that are beyond human capabilities.",
    "can the summarizer tool handle complex or technical language?": "Yes, the summarizer tool is designed to handle complex and technical language effectively.",
    "how fast can the summarizer tool generate a summary?": "The summarizer tool can generate a summary within seconds, thanks to AI.",
    "how much text can the summarizer tool handle at once?": "The summarizer tool can handle a large amount of text at once, making it suitable for summarizing lengthy documents. But for me if you provide text in the range of 500 to 4000 characters then I can provide a insightful summary.😎"
};

const tokenizeString = str => str.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);

const levenshteinDistance = (str1, str2) => {
    if (!str1.length) return str2.length;
    if (!str2.length) return str1.length;

    const matrix = Array.from({ length: str2.length + 1 }, () => new Array(str1.length + 1).fill(0));

    for (let row = 0; row <= str2.length; row++) matrix[row][0] = row;
    for (let col = 0; col <= str1.length; col++) matrix[0][col] = col;

    for (let row = 1; row <= str2.length; row++) {
        for (let col = 1; col <= str1.length; col++) {
            matrix[row][col] = str2[row - 1] === str1[col - 1]
                ? matrix[row - 1][col - 1]
                : Math.min(
                    matrix[row - 1][col - 1] + 1,
                    matrix[row][col - 1] + 1,
                    matrix[row - 1][col] + 1
                );
        }
    }

    return matrix[str2.length][str1.length];
};

const calculateSimilarity = (str1, str2) => {
    const distance = levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return (maxLength - distance) / maxLength;
};

const getDynamicThreshold = tokens => {
    if (tokens.length <= 3) return 0.3;
    if (tokens.length <= 5) return 0.3;
    return 0.5;
};

const matchQuestionAndGetAnswer = inputText => {
    const inputTokens = tokenizeString(inputText);
    let closestMatch = { question: null, similarity: 0 };
    const dynamicThreshold = getDynamicThreshold(inputTokens);

    for (const [question, answer] of Object.entries(conversationDict)) {
        const questionTokens = tokenizeString(question);
        let totalSimilarity = 0;

        for (const inputToken of inputTokens) {
            const similarities = questionTokens.map(questionToken =>
                calculateSimilarity(inputToken, questionToken)
            );
            totalSimilarity += Math.max(...similarities);
        }

        const averageSimilarity = totalSimilarity / inputTokens.length;
        if (averageSimilarity > closestMatch.similarity) {
            closestMatch = { question, similarity: averageSimilarity };
        }
    }

    return closestMatch.similarity >= dynamicThreshold
        ? conversationDict[closestMatch.question]
        : null;
};

const showAlert = (message, duration = 5000) => {
    const alertMessage = document.getElementById('alert-message');
    alertMessage.textContent = message;
    alertMessage.style.display = 'block';
    setTimeout(() => (alertMessage.style.display = 'none'), duration);
};

const startNewChat = () => {
    const chatHistory = document.querySelector('.chat-container .chat-history');
    const textInput = document.querySelector('#text-input');

    chatHistory.innerHTML = '';
    textInput.value = '';
};

const displayChatContainer = () => {
    const header = document.querySelector('.header');
    const chatContainer = document.querySelector('.chat-container');

    header.style.display = 'none';
    chatContainer.style.display = 'flex';
};

const adjustInputHeight = textInput => {
    textInput.style.height = 'auto';
    textInput.style.height = `${textInput.scrollHeight}px`;
};

const uiElements = {
    chatContainer: document.querySelector('.chat-container'),
    textInput: document.querySelector('#text-input'),
    sendIcon: document.querySelector('.send-icon'),
    chatHistory: document.querySelector('.chat-container .chat-history'),
    header: document.querySelector('.header'),
    settingsBtn: document.querySelector('.settings-btn'),
    alertMessage: document.getElementById('alert-message')
};

let summarizationMode = 'abstractive';
let settingsOptions = null;
let isSidebarOpen = false;

const newChatBtn = document.querySelector('.btn.btn-primary.new-chat-btn');
newChatBtn.addEventListener('click', startNewChat);

// Function to add event listeners to text input
function addTextInputEventListeners() {
    // Handle 'Enter' key press
    uiElements.textInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' || event.keyCode === 13) {
            event.preventDefault(); // Prevents the default action of the Enter key in a form (which is to submit the form)
            handleEnterKeyPress();
        }
    });

    // Handle 'Shift + Enter' key press for newline
    uiElements.textInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && event.shiftKey) {
            event.preventDefault(); // Prevents the default action of the Enter key in a form (which is to submit the form)
            uiElements.textInput.value += '\n'; // Insert a newline character into the text input
        }
    });
}

// Call the function to add event listeners to text input
addTextInputEventListeners();

// Function to handle 'Enter' key press in the text input
function handleEnterKeyPress() {
    const text = uiElements.textInput.value.trim();
    const answer = matchQuestionAndGetAnswer(text);
    handleTextSubmission(text, answer);
}

// Existing code for handling click on the send icon
uiElements.sendIcon.addEventListener('click', () => {
    const text = uiElements.textInput.value.trim();
    const answer = matchQuestionAndGetAnswer(text);
    handleTextSubmission(text, answer);
});

// New function to handle text submission logic
function handleTextSubmission(text, answer) {
    displayChatContainer();

    if (answer) {
        appendMessage(text, 'user');
        appendMessage(answer, 'ai');
        uiElements.textInput.value = '';
    } else {
        if (text.length >= 500 && text.length <= 4000) {
            sendText(text, summarizationMode);
            uiElements.textInput.value = '';
            adjustInputHeight(uiElements.textInput);
        } else {
            showAlert(`Please ensure your text is between 500 and 4000 characters. Current length: ${text.length}`);
        }
    }
}

const sendText = async (text, mode) => {
    displayChatContainer();
    appendMessage(text, 'user');

    try {
        const response = await fetch('/api/v1/summarize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, task: mode })
        });
        const data = await response.json();
        appendMessage(data.summary || 'Unable to generate a summary. Try again.', 'ai');
    } catch (error) {
        console.error('Error:', error);
        appendMessage('An error occurred. Please try again later.', 'ai');
    }
};

uiElements.settingsBtn.addEventListener('click', () => {
    const settingsContainer = uiElements.settingsBtn.parentNode;
    if (settingsOptions) {
        settingsContainer.removeChild(settingsOptions);
        settingsOptions = null;
    } else {
        settingsOptions = createSettingsOptions();
        settingsContainer.appendChild(settingsOptions);
        settingsOptions.style.display = "block";
    }
});

document.addEventListener('click', e => {
    if (settingsOptions && !uiElements.settingsBtn.contains(e.target) && !settingsOptions.contains(e.target)) {
        const settingsContainer = uiElements.settingsBtn.parentNode;
        settingsContainer.removeChild(settingsOptions);
        settingsOptions = null;
        settingsOptions.style.display = "none";
    }
});

const createSettingsOptions = () => {
    const container = document.createElement('div');
    container.classList.add('settings-options');
    container.innerHTML = `
        <div class="task-buttons">
            <h5>Modes</h5>
            <button type="button" class="mode-abstractive" id="abstractive-btn">Abstractive</button>
            <button type="button" class="mode-extractive" id="extractive-btn">Extractive</button>
        </div>

        <div class="theme-buttons">
            <h5>Theme</h5>
            <button type="button" class="light-mode" id="light-theme-btn">Light</button>
            <button type="button" class="dark-mode" id="dark-theme-btn">Dark</button>
        </div>`;
    positionSettings(container);
    addSettingsEventListeners(container);
    return container;
};

const positionSettings = container => {
    const settingsBtn = uiElements.settingsBtn;
    container.style.position = 'absolute';
    container.style.top = `${settingsBtn.offsetTop - container.offsetHeight}px`;
};

const addSettingsEventListeners = container => {
    const abstractiveBtn = container.querySelector('#abstractive-btn');
    const extractiveBtn = container.querySelector('#extractive-btn');
    const lightThemeBtn = container.querySelector('#light-theme-btn');
    const darkThemeBtn = container.querySelector('#dark-theme-btn');

    abstractiveBtn.addEventListener('click', () => changeMode('abstractive'));
    extractiveBtn.addEventListener('click', () => changeMode('extractive'));
    lightThemeBtn.addEventListener('click', () => changeTheme('light'));
    darkThemeBtn.addEventListener('click', () => changeTheme('dark'));
};

const changeMode = mode => {
    summarizationMode = mode;
    showAlert(`${mode.charAt(0).toUpperCase() + mode.slice(1)} summarization mode selected.`);
};

const changeTheme = theme => {
    const themeClass = `${theme}-theme`;
    document.body.classList.add(themeClass);
    document.body.classList.remove(theme === 'light' ? 'dark-theme' : 'light-theme');
    showAlert(`${theme.charAt(0).toUpperCase() + theme.slice(1)} theme applied.`);
};

uiElements.textInput.addEventListener('input', () => adjustInputHeight(uiElements.textInput));
adjustInputHeight(uiElements.textInput);

const sidebarToggle = document.querySelector('.sidebar-toggle');
const sidebar = document.querySelector('.sidebar');
const toggleIcon = document.querySelector('.toggle-icon');

sidebarToggle.addEventListener('click', () => {
    isSidebarOpen = !isSidebarOpen;
    sidebar.classList.toggle('open', isSidebarOpen);
    sidebar.classList.toggle('closed', !isSidebarOpen);
    toggleIcon.style.transform = isSidebarOpen ? 'rotate(180deg)' : 'rotate(0deg)';
});

const typewriterEffect = (element, markdownText) => {
    const htmlContent = marked.parse(markdownText);
    let index = 0;
    const textLength = htmlContent.length;
    element.innerHTML = '';

    const typing = () => {
        if (index < textLength) {
            const prevScrollHeight = element.scrollHeight;
            element.innerHTML = htmlContent.slice(0, index + 1);
            const newScrollHeight = element.scrollHeight;

            if (newScrollHeight > prevScrollHeight) {
                element.scrollIntoView({ behavior: 'smooth', block: 'end' });
            }

            index++;
            requestAnimationFrame(typing);
        } else {
            element.scrollIntoView({ behavior: 'smooth', block: 'end' });
        }
    };
    typing();
};

const appendMessage = (content, sender = 'user') => {
    const chatHistory = document.querySelector('.chat-history');
    const messageElement = document.createElement('div');
    messageElement.classList.add('chat-message', `${sender}-message`);

    const labelElement = document.createElement('span');
    labelElement.classList.add('message-label');
    labelElement.textContent = sender === 'ai' ? 'FutureScribeAI: ' : 'You: ';

    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content', 'markdown-body');

    // Loading animation for AI response
    const loadingElement = document.createElement('div');
    loadingElement.classList.add('loading-animation');

    if (sender === 'ai') {
        messageElement.appendChild(loadingElement);
        setTimeout(() => {
            loadingElement.remove();
            messageElement.appendChild(labelElement);
            messageElement.appendChild(contentElement);
            typewriterEffect(contentElement, content, 0);
        }, 1000);
    } else {
        messageElement.appendChild(labelElement);
        messageElement.appendChild(contentElement);
        contentElement.innerHTML = marked.parse(content);
    }
    chatHistory.appendChild(messageElement);
    messageElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};

sidebar.classList.add('closed');