// ==================== GAME CONSTANTS ====================
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;
const CANVAS_WIDTH = COLS * BLOCK_SIZE;
const CANVAS_HEIGHT = ROWS * BLOCK_SIZE;

// Tetromino Colors (matching CSS variables)
const COLORS = {
    I: '#00f5ff', // Cyan
    O: '#ffed00', // Yellow
    T: '#b000ff', // Purple
    S: '#00ff88', // Green
    Z: '#ff004d', // Red
    J: '#0080ff', // Blue
    L: '#ff8800'  // Orange
};

// Tetromino Shapes (rotation states)
const SHAPES = {
    I: [
        [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
        [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
        [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
        [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]]
    ],
    O: [
        [[1, 1], [1, 1]]
    ],
    T: [
        [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
        [[0, 1, 0], [1, 1, 0], [0, 1, 0]]
    ],
    S: [
        [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
        [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
        [[1, 0, 0], [1, 1, 0], [0, 1, 0]]
    ],
    Z: [
        [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
        [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
        [[0, 1, 0], [1, 1, 0], [1, 0, 0]]
    ],
    J: [
        [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
        [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
        [[0, 1, 0], [0, 1, 0], [1, 1, 0]]
    ],
    L: [
        [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
        [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
        [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
        [[1, 1, 0], [0, 1, 0], [0, 1, 0]]
    ]
};

const PIECE_TYPES = Object.keys(SHAPES);

// ==================== GAME STATE ====================
let canvas, ctx, nextCanvas, nextCtx;
let gameBoard = [];
let currentPiece = null;
let nextPiece = null;
let score = 0;
let level = 1;
let lines = 0;
let gameRunning = false;
let gamePaused = false;
let gameOver = false;
let dropCounter = 0;
let dropInterval = 1000; // milliseconds
let lastTime = 0;

// ==================== INITIALIZATION ====================
function init() {
    // Get canvas elements
    canvas = document.getElementById('gameBoard');
    ctx = canvas.getContext('2d');
    nextCanvas = document.getElementById('nextPieceCanvas');
    nextCtx = nextCanvas.getContext('2d');

    // Initialize game board
    initBoard();

    // Event listeners
    document.getElementById('startButton').addEventListener('click', startGame);
    document.getElementById('pauseButton').addEventListener('click', togglePause);
    document.getElementById('restartButton').addEventListener('click', restartGame);
    document.addEventListener('keydown', handleKeyPress);

    // Draw empty board
    drawBoard();

    console.log('游戏已初始化');
}

function initBoard() {
    gameBoard = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
}

// ==================== PIECE GENERATION ====================
function createPiece(type) {
    const shape = SHAPES[type];
    return {
        type: type,
        shape: shape[0],
        rotationIndex: 0,
        x: Math.floor((COLS - shape[0][0].length) / 2),
        y: 0,
        color: COLORS[type]
    };
}

function getRandomPiece() {
    const type = PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)];
    return createPiece(type);
}

function getNextPiece() {
    if (!nextPiece) {
        nextPiece = getRandomPiece();
    }
    currentPiece = nextPiece;
    nextPiece = getRandomPiece();
    drawNextPiece();
}

// ==================== COLLISION DETECTION ====================
function checkCollision(piece, offsetX = 0, offsetY = 0) {
    const shape = piece.shape;
    const newX = piece.x + offsetX;
    const newY = piece.y + offsetY;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardX = newX + col;
                const boardY = newY + row;

                // Check boundaries
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }

                // Check existing blocks
                if (boardY >= 0 && gameBoard[boardY][boardX]) {
                    return true;
                }
            }
        }
    }
    return false;
}

// ==================== PIECE MOVEMENT ====================
function movePiece(direction) {
    if (!currentPiece || !gameRunning || gamePaused) return;

    let offsetX = 0;
    let offsetY = 0;

    if (direction === 'left') offsetX = -1;
    if (direction === 'right') offsetX = 1;
    if (direction === 'down') offsetY = 1;

    if (!checkCollision(currentPiece, offsetX, offsetY)) {
        currentPiece.x += offsetX;
        currentPiece.y += offsetY;
        drawBoard();
        drawPiece();
        return true;
    } else if (direction === 'down') {
        // Lock piece and get new one
        lockPiece();
        return false;
    }
    return false;
}

function rotatePiece() {
    if (!currentPiece || !gameRunning || gamePaused) return;

    const shapes = SHAPES[currentPiece.type];
    const nextRotation = (currentPiece.rotationIndex + 1) % shapes.length;
    const oldShape = currentPiece.shape;

    currentPiece.shape = shapes[nextRotation];
    currentPiece.rotationIndex = nextRotation;

    // Check if rotation is valid
    if (checkCollision(currentPiece)) {
        // Try wall kicks
        const kicks = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 2, y: 0 },
            { x: -2, y: 0 },
            { x: 0, y: -1 }
        ];

        let kickWorked = false;
        for (let kick of kicks) {
            currentPiece.x += kick.x;
            currentPiece.y += kick.y;
            if (!checkCollision(currentPiece)) {
                kickWorked = true;
                break;
            }
            currentPiece.x -= kick.x;
            currentPiece.y -= kick.y;
        }

        if (!kickWorked) {
            // Rotation failed, revert
            currentPiece.shape = oldShape;
            currentPiece.rotationIndex = (nextRotation - 1 + shapes.length) % shapes.length;
            return;
        }
    }

    drawBoard();
    drawPiece();
}

function hardDrop() {
    if (!currentPiece || !gameRunning || gamePaused) return;

    while (movePiece('down')) {
        score += 2; // Bonus points for hard drop
    }
    updateScore();
}

// ==================== PIECE LOCKING ====================
function lockPiece() {
    const shape = currentPiece.shape;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const boardY = currentPiece.y + row;
                const boardX = currentPiece.x + col;

                if (boardY < 0) {
                    // Game over
                    endGame();
                    return;
                }

                gameBoard[boardY][boardX] = currentPiece.color;
            }
        }
    }

    // Check for completed lines
    clearLines();

    // Get next piece
    getNextPiece();

    // Check if new piece collides immediately (game over)
    if (checkCollision(currentPiece)) {
        endGame();
    }
}

// ==================== LINE CLEARING ====================
function clearLines() {
    let linesCleared = 0;

    for (let row = ROWS - 1; row >= 0; row--) {
        if (gameBoard[row].every(cell => cell !== 0)) {
            // Remove the line
            gameBoard.splice(row, 1);
            // Add empty line at top
            gameBoard.unshift(Array(COLS).fill(0));
            linesCleared++;
            row++; // Check same row again
        }
    }

    if (linesCleared > 0) {
        lines += linesCleared;

        // Scoring: 100 for 1 line, 300 for 2, 500 for 3, 800 for 4
        const points = [0, 100, 300, 500, 800];
        score += points[linesCleared] * level;

        // Level up every 10 lines
        level = Math.floor(lines / 10) + 1;
        dropInterval = Math.max(100, 1000 - (level - 1) * 100);

        updateScore();
    }
}

// ==================== RENDERING ====================
function drawBoard() {
    // Clear canvas
    ctx.fillStyle = 'rgba(10, 10, 15, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;

    for (let row = 0; row < ROWS; row++) {
        for (let col = 0; col < COLS; col++) {
            ctx.strokeRect(col * BLOCK_SIZE, row * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);

            // Draw locked blocks
            if (gameBoard[row][col]) {
                drawBlock(col, row, gameBoard[row][col]);
            }
        }
    }
}

function drawBlock(x, y, color) {
    const padding = 2;
    const size = BLOCK_SIZE - padding * 2;

    // Main block
    ctx.fillStyle = color;
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        size,
        size
    );

    // Glow effect
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        size,
        size
    );
    ctx.shadowBlur = 0;

    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(
        x * BLOCK_SIZE + padding,
        y * BLOCK_SIZE + padding,
        size / 3,
        size / 3
    );
}

function drawPiece() {
    if (!currentPiece) return;

    const shape = currentPiece.shape;
    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                drawBlock(currentPiece.x + col, currentPiece.y + row, currentPiece.color);
            }
        }
    }
}

function drawNextPiece() {
    if (!nextPiece) return;

    // Clear canvas
    nextCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);

    const shape = nextPiece.shape;
    const blockSize = 25;
    const offsetX = (nextCanvas.width - shape[0].length * blockSize) / 2;
    const offsetY = (nextCanvas.height - shape.length * blockSize) / 2;

    for (let row = 0; row < shape.length; row++) {
        for (let col = 0; col < shape[row].length; col++) {
            if (shape[row][col]) {
                const x = offsetX + col * blockSize;
                const y = offsetY + row * blockSize;

                // Main block
                nextCtx.fillStyle = nextPiece.color;
                nextCtx.fillRect(x + 2, y + 2, blockSize - 4, blockSize - 4);

                // Glow
                nextCtx.shadowColor = nextPiece.color;
                nextCtx.shadowBlur = 10;
                nextCtx.fillRect(x + 2, y + 2, blockSize - 4, blockSize - 4);
                nextCtx.shadowBlur = 0;
            }
        }
    }
}

// ==================== GAME LOOP ====================
function gameLoop(time = 0) {
    if (!gameRunning || gamePaused) {
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;

    if (dropCounter > dropInterval) {
        movePiece('down');
        dropCounter = 0;
    }

    requestAnimationFrame(gameLoop);
}

// ==================== GAME CONTROL ====================
function startGame() {
    initBoard();
    score = 0;
    level = 1;
    lines = 0;
    dropInterval = 1000;
    gameRunning = true;
    gamePaused = false;
    gameOver = false;

    updateScore();
    getNextPiece();
    getNextPiece(); // Get first piece

    hideOverlay();

    lastTime = 0;
    dropCounter = 0;
    requestAnimationFrame(gameLoop);
}

function togglePause() {
    if (!gameRunning || gameOver) return;

    gamePaused = !gamePaused;

    const pauseButton = document.getElementById('pauseButton');
    if (gamePaused) {
        pauseButton.textContent = '继续';
        showOverlay('游戏暂停', '按继续键或P键继续游戏');
    } else {
        pauseButton.textContent = '暂停';
        hideOverlay();
    }
}

function restartGame() {
    startGame();
}

function endGame() {
    gameRunning = false;
    gameOver = true;

    showOverlay('游戏结束!', `最终得分: ${score} | 等级: ${level}`);

    const startButton = document.getElementById('startButton');
    startButton.textContent = '重新开始';
}

// ==================== UI UPDATES ====================
function updateScore() {
    document.getElementById('score').textContent = score;
    document.getElementById('level').textContent = level;
    document.getElementById('lines').textContent = lines;
}

function showOverlay(title, message) {
    const overlay = document.getElementById('gameOverlay');
    document.getElementById('overlayTitle').textContent = title;
    document.getElementById('overlayMessage').textContent = message;
    overlay.classList.remove('hidden');
}

function hideOverlay() {
    const overlay = document.getElementById('gameOverlay');
    overlay.classList.add('hidden');
}

// ==================== INPUT HANDLING ====================
function handleKeyPress(e) {
    if (!gameRunning) return;

    switch (e.key) {
        case 'ArrowLeft':
            e.preventDefault();
            movePiece('left');
            break;
        case 'ArrowRight':
            e.preventDefault();
            movePiece('right');
            break;
        case 'ArrowDown':
            e.preventDefault();
            movePiece('down');
            break;
        case 'ArrowUp':
            e.preventDefault();
            rotatePiece();
            break;
        case ' ':
            e.preventDefault();
            hardDrop();
            break;
        case 'p':
        case 'P':
            e.preventDefault();
            togglePause();
            break;
    }
}

// ==================== START ====================
window.addEventListener('load', init);
