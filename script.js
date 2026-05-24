// DEFAULT WORDS DATABASE
const defaultWords = [
    { english: "hello", macedonian: "здраво" },
    { english: "goodbye", macedonian: "збогум" },
    { english: "thank you", macedonian: "благодарам" },
    { english: "please", macedonian: "молам те" },
    { english: "yes", macedonian: "да" },
    { english: "no", macedonian: "не" },
    { english: "sorry", macedonian: "извинете" },
    { english: "friend", macedonian: "пријател" },
    { english: "family", macedonian: "семејство" },
    { english: "water", macedonian: "вода" },
    { english: "food", macedonian: "храна" },
    { english: "book", macedonian: "книга" },
    { english: "dog", macedonian: "куче" },
    { english: "cat", macedonian: "мачка" },
    { english: "house", macedonian: "куќа" },
    { english: "school", macedonian: "училиште" },
    { english: "love", macedonian: "љубав" },
    { english: "happy", macedonian: "среќен" },
    { english: "beautiful", macedonian: "прекрасен" },
    { english: "morning", macedonian: "утро" },
    { english: "night", macedonian: "ноќ" },
    { english: "sun", macedonian: "сонце" },
    { english: "moon", macedonian: "месечина" },
    { english: "star", macedonian: "ѕвезда" },
    { english: "help", macedonian: "помош" },
    { english: "time", macedonian: "време" },
    { english: "money", macedonian: "пари" },
    { english: "music", macedonian: "музика" },
    { english: "dance", macedonian: "танец" },
    { english: "smile", macedonian: "насмевка" }
];

// Application State
let appState = {
    isStarted: false,
    currentWordIndex: -1,
    currentWord: null,
    shuffledWords: [],
    answeredWords: new Set(),
    correct: 0,
    incorrect: 0,
    lastAnswerChecked: false,
    uploadedFiles: {}, // { fileName: [words array] }
    currentFile: null // which file is being used
};

// DOM Elements
const elements = {
    startBtn: document.getElementById('startBtn'),
    repeatBtn: document.getElementById('repeatBtn'),
    checkBtn: document.getElementById('checkBtn'),
    nextBtn: document.getElementById('nextBtn'),
    resetBtn: document.getElementById('resetBtn'),
    answerInput: document.getElementById('answerInput'),
    wordDisplay: document.getElementById('wordDisplay'),
    translation: document.getElementById('translation'),
    feedback: document.getElementById('feedback'),
    totalCount: document.getElementById('totalCount'),
    correctCount: document.getElementById('correctCount'),
    incorrectCount: document.getElementById('incorrectCount'),
    percentCount: document.getElementById('percentCount'),
    progressFill: document.getElementById('progressFill'),
    progressText: document.getElementById('progressText'),
    excelUpload: document.getElementById('excelUpload'),
    wordListSelect: document.getElementById('wordListSelect'),
    wordListSection: document.getElementById('wordListSection'),
    currentListInfo: document.getElementById('currentListInfo'),
    clearFileBtn: document.getElementById('clearFileBtn')
};

// Initialize Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Game buttons
    elements.startBtn.addEventListener('click', startGame);
    elements.repeatBtn.addEventListener('click', repeatWord);
    elements.checkBtn.addEventListener('click', checkAnswer);
    elements.nextBtn.addEventListener('click', nextWord);
    elements.resetBtn.addEventListener('click', resetScore);
    
    // File upload
    elements.excelUpload.addEventListener('change', handleFileUpload);
    
    // Word list selector
    elements.wordListSelect.addEventListener('change', selectWordList);
    elements.clearFileBtn.addEventListener('click', clearUploadedFiles);
    
    // Enter key
    elements.answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !elements.checkBtn.disabled) {
            checkAnswer();
        }
    });
    
    // Load saved files from localStorage
    loadSavedFiles();
});

// ============= FILE UPLOAD HANDLING =============

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = e.target.result;
            
            // Check if it's Excel or CSV
            if (file.name.endsWith('.csv')) {
                parseCSV(file.name, data);
            } else {
                parseExcel(file.name, data);
            }
            
            event.target.value = ''; // Reset input
        } catch (error) {
            alert('❌ Грешка при вчитување на фајлот: ' + error.message);
            console.error('File parsing error:', error);
        }
    };
    
    reader.readAsArrayBuffer(file);
}

function parseExcel(fileName, data) {
    // Use XLSX library to parse Excel
    const workbook = XLSX.read(data, { type: 'array' });
    const words = [];
    
    // Get all sheets
    for (let sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csvData = XLSX.utils.sheet_to_csv(worksheet);
        const rows = csvData.trim().split('\n');
        
        // Parse rows (skip header if present)
        for (let i = 1; i < rows.length; i++) {
            const [english, macedonian] = rows[i].split(',').map(cell => cell.trim());
            
            if (english && macedonian) {
                words.push({
                    english: english.toLowerCase(),
                    macedonian: macedonian
                });
            }
        }
    }
    
    if (words.length === 0) {
        alert('❌ Нема зборови во фајлот. Провери дека има две колони: English | Macedonian');
        return;
    }
    
    // Save to state and localStorage
    appState.uploadedFiles[fileName] = words;
    saveFilesToLocalStorage();
    updateFileList();
    
    alert(`✅ Вчитани ${words.length} зборови од "${fileName}"`);
    
    // Auto-select the new file
    elements.wordListSelect.value = fileName;
    selectWordList();
}

function parseCSV(fileName, data) {
    try {
        const text = new TextDecoder().decode(data);
        const rows = text.trim().split('\n');
        const words = [];
        
        // Parse rows (skip header if present)
        for (let i = 1; i < rows.length; i++) {
            const [english, macedonian] = rows[i].split(',').map(cell => cell.trim());
            
            if (english && macedonian) {
                words.push({
                    english: english.toLowerCase(),
                    macedonian: macedonian
                });
            }
        }
        
        if (words.length === 0) {
            alert('❌ Нема зборови во фајлот. Провери дека има две колони: English | Macedonian');
            return;
        }
        
        appState.uploadedFiles[fileName] = words;
        saveFilesToLocalStorage();
        updateFileList();
        
        alert(`✅ Вчитани ${words.length} зборови од "${fileName}"`);
        
        elements.wordListSelect.value = fileName;
        selectWordList();
    } catch (error) {
        throw new Error('Не може да го парсира CSV: ' + error.message);
    }
}

function updateFileList() {
    const select = elements.wordListSelect;
    
    // Clear existing options (except first)
    while (select.options.length > 1) {
        select.remove(1);
    }
    
    // Add uploaded files
    for (let fileName in appState.uploadedFiles) {
        const option = document.createElement('option');
        option.value = fileName;
        option.textContent = `📄 ${fileName} (${appState.uploadedFiles[fileName].length})`;
        select.appendChild(option);
    }
    
    // Show/hide selector
    if (Object.keys(appState.uploadedFiles).length > 0) {
        elements.wordListSection.style.display = 'flex';
    }
}

function selectWordList() {
    const selectedFile = elements.wordListSelect.value;
    
    if (selectedFile === '') {
        // Use default words
        appState.currentFile = null;
        elements.currentListInfo.textContent = '📚 Користи ја вградена листа (30 зборови)';
        elements.currentListInfo.classList.remove('active');
    } else {
        // Use uploaded file
        appState.currentFile = selectedFile;
        const wordCount = appState.uploadedFiles[selectedFile].length;
        elements.currentListInfo.textContent = `📄 Користи ја листа: ${selectedFile} (${wordCount} зборови)`;
        elements.currentListInfo.classList.add('active');
    }
}

function clearUploadedFiles() {
    if (confirm('Дали си сигурен дека сакаш да ги обришеш сите вчитани фајлови?')) {
        appState.uploadedFiles = {};
        appState.currentFile = null;
        saveFilesToLocalStorage();
        updateFileList();
        elements.wordListSection.style.display = 'none';
        elements.wordListSelect.value = '';
        selectWordList();
        
        // Reset game if running
        if (appState.isStarted) {
            resetScore();
        }
        
        alert('✅ Фајловите се обришани');
    }
}

function saveFilesToLocalStorage() {
    localStorage.setItem('uploadedWordFiles', JSON.stringify(appState.uploadedFiles));
}

function loadSavedFiles() {
    const saved = localStorage.getItem('uploadedWordFiles');
    if (saved) {
        try {
            appState.uploadedFiles = JSON.parse(saved);
            updateFileList();
        } catch (error) {
            console.error('Error loading saved files:', error);
        }
    }
}

// ============= GAME LOGIC =============

function getCurrentWords() {
    if (appState.currentFile && appState.uploadedFiles[appState.currentFile]) {
        return appState.uploadedFiles[appState.currentFile];
    }
    return defaultWords;
}

// Start Game
function startGame() {
    appState.isStarted = true;
    const currentWords = getCurrentWords();
    appState.shuffledWords = shuffle([...currentWords]);
    appState.currentWordIndex = 0;
    appState.answeredWords.clear();

    elements.startBtn.disabled = true;
    elements.answerInput.disabled = false;
    elements.repeatBtn.disabled = false;
    elements.checkBtn.disabled = false;
    elements.excelUpload.disabled = true;
    elements.wordListSelect.disabled = true;

    loadNextWord();
}

// Load Next Word
function loadNextWord() {
    if (appState.currentWordIndex < appState.shuffledWords.length) {
        appState.currentWord = appState.shuffledWords[appState.currentWordIndex];
        appState.lastAnswerChecked = false;

        elements.answerInput.value = '';
        elements.answerInput.disabled = false;
        elements.answerInput.focus();
        elements.feedback.textContent = '';
        elements.feedback.className = 'feedback';
        elements.translation.textContent = '';
        elements.wordDisplay.querySelector('.word-instruction').textContent = '🎧 Слушни го зборот...';

        // Speak the word immediately
        setTimeout(() => {
            speakWord(appState.currentWord.english);
        }, 300);

        updateProgress();
        updateButtons();
    } else {
        endGame();
    }
}

// Speak Word Using Text-to-Speech
function speakWord(word) {
    if ('speechSynthesis' in window) {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Small delay to ensure clean start
        setTimeout(() => {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = 'en-US'; // English pronunciation
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;

            window.speechSynthesis.speak(utterance);
        }, 100);
    } else {
        alert('Your browser does not support Text-to-Speech');
    }
}

// Repeat Word
function repeatWord() {
    if (appState.currentWord) {
        speakWord(appState.currentWord.english);
    }
}

// Check Answer
function checkAnswer() {
    const userAnswer = elements.answerInput.value.trim().toLowerCase();

    if (!userAnswer) {
        alert('Внеси одговор');
        return;
    }

    const isCorrect = userAnswer === appState.currentWord.english.toLowerCase();

    if (isCorrect) {
        appState.correct++;
        elements.feedback.className = 'feedback correct';
        elements.feedback.innerHTML = `
            <span>✅ Точно!</span>
            <span class="feedback-word">${appState.currentWord.english}</span>
            <span class="feedback-translation">${appState.currentWord.macedonian}</span>
        `;
    } else {
        appState.incorrect++;
        elements.feedback.className = 'feedback incorrect';
        elements.feedback.innerHTML = `
            <span>❌ Погрешно</span>
            <span class="feedback-word">Точното е: ${appState.currentWord.english}</span>
            <span class="feedback-translation">${appState.currentWord.macedonian}</span>
        `;
    }

    appState.answeredWords.add(appState.currentWordIndex);
    appState.lastAnswerChecked = true;

    // Update stats
    updateStats();
    updateButtons();

    // Disable input after answer is checked
    elements.answerInput.disabled = true;
    elements.checkBtn.disabled = true;
}

// Next Word
function nextWord() {
    appState.currentWordIndex++;
    loadNextWord();
}

// Reset Score
function resetScore() {
    if (confirm('Дали си сигурен дека сакаш да го ресетираш скоерот?')) {
        appState.isStarted = false;
        appState.currentWordIndex = -1;
        appState.currentWord = null;
        appState.shuffledWords = [];
        appState.answeredWords.clear();
        appState.correct = 0;
        appState.incorrect = 0;
        appState.lastAnswerChecked = false;

        // Reset DOM
        elements.answerInput.value = '';
        elements.answerInput.disabled = true;
        elements.feedback.textContent = '';
        elements.feedback.className = 'feedback';
        elements.translation.textContent = '';
        elements.wordDisplay.querySelector('.word-instruction').textContent = 'Притисни Start за да почнеш';

        // Reset buttons
        elements.startBtn.disabled = false;
        elements.repeatBtn.disabled = true;
        elements.checkBtn.disabled = true;
        elements.nextBtn.disabled = true;
        elements.excelUpload.disabled = false;
        elements.wordListSelect.disabled = false;

        // Reset stats
        updateStats();
        updateProgress();

        // Cancel speech
        speechSynthesis.cancel();
    }
}

// End Game
function endGame() {
    speechSynthesis.cancel();

    elements.startBtn.disabled = false;
    elements.repeatBtn.disabled = true;
    elements.checkBtn.disabled = true;
    elements.nextBtn.disabled = true;
    elements.answerInput.disabled = true;
    elements.excelUpload.disabled = false;
    elements.wordListSelect.disabled = false;

    const total = appState.correct + appState.incorrect;
    const percentage = total > 0 ? Math.round((appState.correct / total) * 100) : 0;

    elements.wordDisplay.querySelector('.word-instruction').textContent = '🎉 Ја завршим играта!';
    elements.feedback.className = 'feedback';
    elements.feedback.innerHTML = `
        <span>Резултат:</span>
        <span class="feedback-word">${appState.correct} од ${total} точни</span>
        <span class="feedback-translation">${percentage}% успешност</span>
    `;
    elements.translation.textContent = 'Притисни Start за нова игра';
}

// Update Stats
function updateStats() {
    const total = appState.correct + appState.incorrect;
    const percentage = total > 0 ? Math.round((appState.correct / total) * 100) : 0;

    elements.totalCount.textContent = total;
    elements.correctCount.textContent = appState.correct;
    elements.incorrectCount.textContent = appState.incorrect;
    elements.percentCount.textContent = percentage + '%';
}

// Update Progress
function updateProgress() {
    if (appState.isStarted && appState.shuffledWords.length > 0) {
        const progress = (appState.answeredWords.size / appState.shuffledWords.length) * 100;
        elements.progressFill.style.width = progress + '%';
        elements.progressText.textContent = `Напредок: ${appState.answeredWords.size} од ${appState.shuffledWords.length} зборови`;
    } else {
        elements.progressFill.style.width = '0%';
        elements.progressText.textContent = '';
    }
}

// Update Button States
function updateButtons() {
    if (appState.lastAnswerChecked) {
        elements.nextBtn.disabled = false;
        elements.checkBtn.disabled = true;
    } else {
        elements.nextBtn.disabled = true;
        if (appState.isStarted && elements.answerInput.value.trim()) {
            elements.checkBtn.disabled = false;
        }
    }

    // Monitor input for enabling check button
    elements.answerInput.addEventListener('input', () => {
        if (appState.isStarted && !appState.lastAnswerChecked) {
            elements.checkBtn.disabled = !elements.answerInput.value.trim();
        }
    });
}

// Shuffle Array (Fisher-Yates Algorithm)
function shuffle(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// Initial state
updateStats();
updateProgress();
