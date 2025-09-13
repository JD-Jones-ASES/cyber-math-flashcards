// Math Flashcards Game - Main Script
// Handles both index.html and game.html functionality

// Global game state management
const MathGame = {
    // Configuration state for main page
    config: {
        operations: [],
        range: null,
        type: null
    },
    
    // Game state for game page
    gameState: {
        currentQuestion: null,
        stats: {
            startTime: null,
            correct: 0,
            total: 0,
            streak: 0,
            maxStreak: 0
        },
        timerInterval: null,
        statsVisible: true,
        config: null
    },
    
    // Initialize based on current page
    init() {
        if (document.getElementById('previewCard')) {
            this.initMainPage();
        } else if (document.querySelector('.game-mode')) {
            this.initGamePage();
        }
    },
    
    // Main page initialization
    initMainPage() {
        this.setupOperationSelection();
        this.setupRangeSelection();
        this.setupTypeSelection();
        this.setupLaunchButton();
        this.updatePreview();
        this.createBackgroundEffects();
    },
    
    // Game page initialization
    initGamePage() {
        this.loadGameConfig();
        this.setupGameControls();
        this.generateQuestion();
        this.startTimer();
        this.createGameBackground();
    },
    
    // === MAIN PAGE METHODS ===
    
    setupOperationSelection() {
        document.querySelectorAll('[data-operation]').forEach(box => {
            box.addEventListener('click', (e) => {
                const operation = e.currentTarget.dataset.operation;
                
                if (this.config.operations.includes(operation)) {
                    this.config.operations = this.config.operations.filter(op => op !== operation);
                    e.currentTarget.classList.remove('selected');
                } else {
                    this.config.operations.push(operation);
                    e.currentTarget.classList.add('selected');
                }
                
                this.updatePreview();
            });
        });
    },
    
    setupRangeSelection() {
        document.querySelectorAll('[data-range]').forEach(box => {
            box.addEventListener('click', (e) => {
                document.querySelectorAll('[data-range]').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.config.range = e.currentTarget.dataset.range;
                this.updatePreview();
            });
        });
    },
    
    setupTypeSelection() {
        document.querySelectorAll('[data-type]').forEach(box => {
            box.addEventListener('click', (e) => {
                document.querySelectorAll('[data-type]').forEach(b => b.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                this.config.type = e.currentTarget.dataset.type;
                this.updatePreview();
            });
        });
    },
    
    setupLaunchButton() {
        document.getElementById('launchBtn').addEventListener('click', () => {
            if (this.canLaunch()) {
                this.launchGame();
            }
        });
    },
    
    updatePreview() {
        const opsDisplay = this.config.operations.length > 0 
            ? this.config.operations.map(op => this.capitalizeFirst(op)).join(', ')
            : 'Select operations';
        document.getElementById('previewOps').textContent = opsDisplay;

        document.getElementById('previewRange').textContent = this.config.range || 'Select range';

        const typeNames = {
            'missing-result': 'Missing Result',
            'missing-operand': 'Missing Operand',
            'both': 'Random Mix'
        };
        document.getElementById('previewType').textContent = 
            this.config.type ? typeNames[this.config.type] : 'Select mode';

        const launchBtn = document.getElementById('launchBtn');
        const canLaunch = this.canLaunch();
        
        launchBtn.classList.toggle('ready', canLaunch);
        launchBtn.style.pointerEvents = canLaunch ? 'auto' : 'none';
    },
    
    canLaunch() {
        return this.config.operations.length > 0 && this.config.range && this.config.type;
    },
    
    launchGame() {
        sessionStorage.setItem('mathConfig', JSON.stringify(this.config));
        window.location.href = 'game.html';
    },
    
    createBackgroundEffects() {
        // Create floating particles
        const particleContainer = document.querySelector('.bg-particles');
        if (particleContainer) {
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 10 + 's';
                particle.style.animationDuration = (8 + Math.random() * 4) + 's';
                particleContainer.appendChild(particle);
            }
        }
    },
    
    // === GAME PAGE METHODS ===
    
    loadGameConfig() {
        const configData = sessionStorage.getItem('mathConfig');
        if (!configData) {
            alert('No configuration found. Redirecting to main menu.');
            window.location.href = 'index.html';
            return;
        }
        
        this.gameState.config = JSON.parse(configData);
        this.updateMissionInfo();
        this.gameState.stats.startTime = Date.now();
    },
    
    setupGameControls() {
        const answerInput = document.getElementById('answerInput');
        const submitBtn = document.getElementById('submitBtn');
        
        // Answer input handling
        answerInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && answerInput.value.trim() !== '') {
                this.checkAnswer();
            }
        });
        
        answerInput.addEventListener('input', () => {
            const hasValue = answerInput.value.trim() !== '';
            submitBtn.classList.toggle('active', hasValue);
        });
        
        // Submit button
        submitBtn.addEventListener('click', () => {
            if (answerInput.value.trim() !== '') {
                this.checkAnswer();
            }
        });
        
        // Return button
        document.getElementById('returnBtn').addEventListener('click', () => {
            if (confirm('Return to main menu? Your progress will be lost.')) {
                this.cleanup();
                window.location.href = 'index.html';
            }
        });
        
        // Stats toggle
        document.getElementById('toggleStats').addEventListener('click', () => {
            this.toggleStats();
        });
        
        // Focus input
        answerInput.focus();
    },
    
    generateQuestion() {
        const config = this.gameState.config;
        const operations = config.operations;
        const [min, max] = config.range.split('-').map(Number);
        
        // Choose random operation
        const operation = operations[Math.floor(Math.random() * operations.length)];
        
        // Generate operands based on operation
        let operand1, operand2, result;
        
        switch (operation) {
            case 'addition':
                operand1 = this.randomInRange(min, max);
                operand2 = this.randomInRange(min, max);
                result = operand1 + operand2;
                break;
                
            case 'subtraction':
                // Ensure positive result
                const maxVal = this.randomInRange(min, max);
                const minVal = this.randomInRange(min, Math.min(maxVal, max));
                operand1 = Math.max(maxVal, minVal);
                operand2 = Math.min(maxVal, minVal);
                result = operand1 - operand2;
                break;
                
            case 'multiplication':
                operand1 = this.randomInRange(min, max);
                operand2 = this.randomInRange(min, max);
                result = operand1 * operand2;
                break;
                
            case 'division':
                // Generate factors to ensure whole number result
                result = this.randomInRange(min, max);
                operand2 = this.randomInRange(min, max);
                operand1 = result * operand2;
                break;
        }
        
        // Determine what to hide
        let questionType = config.type;
        if (questionType === 'both') {
            questionType = Math.random() < 0.5 ? 'missing-result' : 'missing-operand';
        }
        
        let hiddenValue, expectedAnswer;
        
        if (questionType === 'missing-result') {
            hiddenValue = 'result';
            expectedAnswer = result;
        } else {
            // Randomly choose which operand to hide
            if (Math.random() < 0.5) {
                hiddenValue = 'operand1';
                expectedAnswer = operand1;
            } else {
                hiddenValue = 'operand2';
                expectedAnswer = operand2;
            }
        }
        
        this.gameState.currentQuestion = {
            operand1,
            operand2,
            result,
            operation,
            hiddenValue,
            expectedAnswer
        };
        
        this.displayQuestion();
    },
    
    displayQuestion() {
        const q = this.gameState.currentQuestion;
        const operatorSymbols = {
            addition: '+',
            subtraction: '−',
            multiplication: '×',
            division: '÷'
        };
        
        // Update operator display
        document.getElementById('operator').textContent = operatorSymbols[q.operation];
        
        // Update operands and result
        const operand1El = document.getElementById('operand1').querySelector('.operand-value');
        const operand2El = document.getElementById('operand2').querySelector('.operand-value');
        const resultEl = document.getElementById('result').querySelector('.result-value');
        
        operand1El.textContent = q.hiddenValue === 'operand1' ? '?' : q.operand1;
        operand2El.textContent = q.hiddenValue === 'operand2' ? '?' : q.operand2;
        resultEl.textContent = q.hiddenValue === 'result' ? '?' : q.result;
        
        // Highlight missing element
        document.querySelectorAll('.operand-box, .result-box').forEach(box => {
            box.classList.remove('missing');
        });
        
        if (q.hiddenValue === 'operand1') {
            document.getElementById('operand1').classList.add('missing');
        } else if (q.hiddenValue === 'operand2') {
            document.getElementById('operand2').classList.add('missing');
        } else {
            document.getElementById('result').classList.add('missing');
        }
        
        // Reset UI
        const answerInput = document.getElementById('answerInput');
        answerInput.value = '';
        answerInput.focus();
        document.getElementById('submitBtn').classList.remove('active');
        this.hideFeedback();
    },
    
    checkAnswer() {
        const userInput = document.getElementById('answerInput').value.trim();
        const userAnswer = parseInt(userInput);
        const correctAnswer = this.gameState.currentQuestion.expectedAnswer;
        
        if (isNaN(userAnswer) || userInput === '') {
            this.showFeedback('Enter a valid number', 'error');
            return;
        }
        
        this.gameState.stats.total++;
        
        if (userAnswer === correctAnswer) {
            this.gameState.stats.correct++;
            this.gameState.stats.streak++;
            this.gameState.stats.maxStreak = Math.max(
                this.gameState.stats.maxStreak, 
                this.gameState.stats.streak
            );
            
            this.showFeedback('CORRECT!', 'success');
            this.animateSuccess();
            
            setTimeout(() => {
                this.generateQuestion();
            }, 1500);
            
        } else {
            this.gameState.stats.streak = 0;
            this.showFeedback(`INCORRECT. Answer: ${correctAnswer}`, 'error');
            this.animateError();
        }
        
        this.updateStats();
    },
    
    showFeedback(message, type) {
        const feedbackContainer = document.getElementById('feedbackContainer');
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        feedbackMessage.textContent = message;
        feedbackContainer.className = `feedback-container ${type} visible`;
        
        // Auto-hide error feedback after 3 seconds
        if (type === 'error') {
            setTimeout(() => {
                this.hideFeedback();
            }, 3000);
        }
    },
    
    hideFeedback() {
        const feedbackContainer = document.getElementById('feedbackContainer');
        feedbackContainer.classList.remove('visible');
    },
    
    animateSuccess() {
        const equationContainer = document.querySelector('.equation-container');
        equationContainer.classList.add('success-pulse');
        setTimeout(() => {
            equationContainer.classList.remove('success-pulse');
        }, 600);
    },
    
    animateError() {
        const equationContainer = document.querySelector('.equation-container');
        equationContainer.classList.add('error-shake');
        setTimeout(() => {
            equationContainer.classList.remove('error-shake');
        }, 600);
    },
    
    updateStats() {
        const stats = this.gameState.stats;
        const accuracy = stats.total > 0 
            ? Math.round((stats.correct / stats.total) * 100)
            : 100;
        
        document.getElementById('streakValue').textContent = stats.streak;
        document.getElementById('accuracyValue').textContent = accuracy + '%';
    },
    
    startTimer() {
        this.gameState.timerInterval = setInterval(() => {
            const elapsed = Date.now() - this.gameState.stats.startTime;
            const minutes = Math.floor(elapsed / 60000);
            const seconds = Math.floor((elapsed % 60000) / 1000);
            
            document.getElementById('timerValue').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
    },
    
    toggleStats() {
        this.gameState.statsVisible = !this.gameState.statsVisible;
        const statsHeader = document.querySelector('.game-stats');
        
        statsHeader.classList.toggle('hidden', !this.gameState.statsVisible);
        
        // Update toggle icon
        const toggleIcon = document.querySelector('.toggle-icon');
        toggleIcon.textContent = this.gameState.statsVisible ? '◐' : '◑';
    },
    
    updateMissionInfo() {
        const config = this.gameState.config;
        const operations = config.operations.map(op => this.capitalizeFirst(op)).join(', ');
        const typeDisplay = {
            'missing-result': 'MISSING RESULT',
            'missing-operand': 'MISSING OPERAND',
            'both': 'RANDOM MIX'
        };
        
        const missionText = `${operations.toUpperCase()} | Range: ${config.range} | Mode: ${typeDisplay[config.type]}`;
        document.getElementById('missionInfo').querySelector('.mission-text').textContent = missionText;
    },
    
    createGameBackground() {
        // Add subtle background animations for game mode
        const gameContainer = document.querySelector('.game-container');
        if (gameContainer) {
            // Create ambient particles
            this.createAmbientParticles();
        }
    },
    
    createAmbientParticles() {
        const particleContainer = document.querySelector('.bg-particles');
        if (particleContainer) {
            // Clear existing particles
            particleContainer.innerHTML = '';
            
            // Create fewer, more subtle particles for game mode
            for (let i = 0; i < 20; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                particle.style.left = Math.random() * 100 + '%';
                particle.style.top = Math.random() * 100 + '%';
                particle.style.animationDelay = Math.random() * 15 + 's';
                particle.style.animationDuration = (12 + Math.random() * 8) + 's';
                particle.style.opacity = '0.3';
                particleContainer.appendChild(particle);
            }
        }
    },
    
    cleanup() {
        if (this.gameState.timerInterval) {
            clearInterval(this.gameState.timerInterval);
        }
    },
    
    // === UTILITY METHODS ===
    
    randomInRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    
    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },
    
    // Advanced question generation for better variety
    generateAdvancedQuestion() {
        const config = this.gameState.config;
        const operations = config.operations;
        const [min, max] = config.range.split('-').map(Number);
        
        // Choose operation with weighted randomness based on difficulty
        const operation = this.chooseWeightedOperation(operations);
        
        let operand1, operand2, result;
        
        // Generate more interesting number combinations
        switch (operation) {
            case 'addition':
                // Sometimes use friendly numbers (ending in 0 or 5)
                if (Math.random() < 0.3) {
                    operand1 = this.generateFriendlyNumber(min, max);
                    operand2 = this.randomInRange(min, max);
                } else {
                    operand1 = this.randomInRange(min, max);
                    operand2 = this.randomInRange(min, max);
                }
                result = operand1 + operand2;
                break;
                
            case 'subtraction':
                // Ensure positive result with varied difficulty
                if (Math.random() < 0.4) {
                    // Easier: smaller differences
                    operand1 = this.randomInRange(min + 2, max);
                    operand2 = this.randomInRange(min, Math.min(operand1 - 1, max - 2));
                } else {
                    // Standard difficulty
                    operand1 = this.randomInRange(min, max);
                    operand2 = this.randomInRange(min, operand1);
                }
                result = operand1 - operand2;
                break;
                
            case 'multiplication':
                // Balance easy and challenging multiplications
                if (max <= 5) {
                    operand1 = this.randomInRange(min, max);
                    operand2 = this.randomInRange(min, max);
                } else if (Math.random() < 0.5) {
                    // One smaller operand for easier calculation
                    operand1 = this.randomInRange(min, Math.min(5, max));
                    operand2 = this.randomInRange(min, max);
                } else {
                    operand1 = this.randomInRange(min, max);
                    operand2 = this.randomInRange(min, max);
                }
                result = operand1 * operand2;
                break;
                
            case 'division':
                // Generate clean divisions
                operand2 = this.randomInRange(Math.max(2, min), max);
                result = this.randomInRange(min, Math.min(max, Math.floor(100 / operand2)));
                operand1 = result * operand2;
                break;
        }
        
        return { operand1, operand2, result, operation };
    },
    
    generateFriendlyNumber(min, max) {
        const friendlyEndings = [0, 5];
        const base = Math.floor(this.randomInRange(min, max) / 10) * 10;
        const ending = friendlyEndings[Math.floor(Math.random() * friendlyEndings.length)];
        const friendlyNum = base + ending;
        
        // Ensure it's within range
        return Math.max(min, Math.min(max, friendlyNum));
    },
    
    chooseWeightedOperation(operations) {
        // Simple equal weighting for now, but could be enhanced
        return operations[Math.floor(Math.random() * operations.length)];
    },
    
    // Performance tracking and adaptive difficulty
    trackPerformance() {
        const stats = this.gameState.stats;
        const recentPerformance = {
            accuracy: stats.total > 0 ? (stats.correct / stats.total) : 1,
            averageTime: stats.averageTime || 0,
            streak: stats.streak
        };
        
        return recentPerformance;
    },
    
    // Enhanced visual feedback
    showEnhancedFeedback(isCorrect, answer = null) {
        const feedbackContainer = document.getElementById('feedbackContainer');
        const feedbackMessage = document.getElementById('feedbackMessage');
        
        if (isCorrect) {
            const encouragements = [
                'EXCELLENT!', 'PERFECT!', 'OUTSTANDING!', 'BRILLIANT!', 
                'CORRECT!', 'WELL DONE!', 'AMAZING!', 'SUPERB!'
            ];
            const message = encouragements[Math.floor(Math.random() * encouragements.length)];
            
            if (this.gameState.stats.streak > 1) {
                feedbackMessage.textContent = `${message} (${this.gameState.stats.streak} in a row!)`;
            } else {
                feedbackMessage.textContent = message;
            }
            
            feedbackContainer.className = 'feedback-container success visible';
            this.createSuccessParticles();
            
        } else {
            const supportive = [
                'Keep trying!', 'Almost there!', 'You can do it!', 'Try again!'
            ];
            const support = supportive[Math.floor(Math.random() * supportive.length)];
            
            feedbackMessage.textContent = `INCORRECT. Answer: ${answer}. ${support}`;
            feedbackContainer.className = 'feedback-container error visible';
        }
    },
    
    createSuccessParticles() {
        // Create celebration particles on correct answers
        const container = document.querySelector('.equation-container');
        if (!container) return;
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.style.position = 'absolute';
            particle.style.width = '4px';
            particle.style.height = '4px';
            particle.style.background = '#00ff00';
            particle.style.borderRadius = '50%';
            particle.style.pointerEvents = 'none';
            particle.style.zIndex = '1000';
            
            const rect = container.getBoundingClientRect();
            particle.style.left = (rect.left + rect.width / 2) + 'px';
            particle.style.top = (rect.top + rect.height / 2) + 'px';
            
            document.body.appendChild(particle);
            
            // Animate particle
            const angle = (i / 5) * Math.PI * 2;
            const distance = 50 + Math.random() * 30;
            const endX = Math.cos(angle) * distance;
            const endY = Math.sin(angle) * distance;
            
            particle.animate([
                { transform: 'translate(0, 0) scale(1)', opacity: 1 },
                { transform: `translate(${endX}px, ${endY}px) scale(0)`, opacity: 0 }
            ], {
                duration: 800,
                easing: 'ease-out'
            }).onfinish = () => {
                particle.remove();
            };
        }
    },
    
    // Keyboard shortcuts and accessibility
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only in game mode
            if (!document.querySelector('.game-mode')) return;
            
            switch (e.key) {
                case 'Escape':
                    e.preventDefault();
                    if (confirm('Return to main menu? Your progress will be lost.')) {
                        this.cleanup();
                        window.location.href = 'index.html';
                    }
                    break;
                    
                case 'Tab':
                    e.preventDefault();
                    this.toggleStats();
                    break;
                    
                case ' ':
                    e.preventDefault();
                    const answerInput = document.getElementById('answerInput');
                    answerInput.focus();
                    break;
            }
        });
    },
    
    // Save game statistics
    saveGameSession() {
        const sessionData = {
            timestamp: Date.now(),
            stats: this.gameState.stats,
            config: this.gameState.config,
            duration: Date.now() - this.gameState.stats.startTime
        };
        
        // Store in localStorage for potential future features
        const savedSessions = JSON.parse(localStorage.getItem('mathGameSessions') || '[]');
        savedSessions.push(sessionData);
        
        // Keep only last 10 sessions
        if (savedSessions.length > 10) {
            savedSessions.shift();
        }
        
        localStorage.setItem('mathGameSessions', JSON.stringify(savedSessions));
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MathGame.init();
    MathGame.setupKeyboardShortcuts();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    MathGame.cleanup();
    if (MathGame.gameState.stats.total > 0) {
        MathGame.saveGameSession();
    }
});

// Handle visibility changes (pause/resume timer when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (MathGame.gameState.timerInterval) {
        if (document.hidden) {
            // Pause timer
            clearInterval(MathGame.gameState.timerInterval);
            MathGame.gameState.pausedTime = Date.now();
        } else {
            // Resume timer
            if (MathGame.gameState.pausedTime) {
                const pauseDuration = Date.now() - MathGame.gameState.pausedTime;
                MathGame.gameState.stats.startTime += pauseDuration;
                MathGame.startTimer();
            }
        }
    }
});

// Export for potential testing or extension
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MathGame;
}