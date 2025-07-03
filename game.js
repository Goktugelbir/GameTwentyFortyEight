// Game state variables
let board = [];
let score = 0;
let bestScore = 0;
let gameWon = false;
let gameOver = false;
let canMove = true;

// Animation variables
let animatingTiles = [];
let animationDuration = 150;

// Visual constants
const BOARD_SIZE = 4;
const TILE_SIZE = 80;
const TILE_MARGIN = 10;
const CANVAS_SIZE = BOARD_SIZE * TILE_SIZE + (BOARD_SIZE + 1) * TILE_MARGIN;

// Tile colors
const TILE_COLORS = {
    0: '#cdc1b4',
    2: '#eee4da',
    4: '#ede0c8',
    8: '#f2b179',
    16: '#f59563',
    32: '#f67c5f',
    64: '#f65e3b',
    128: '#edcf72',
    256: '#edcc61',
    512: '#edc850',
    1024: '#edc53f',
    2048: '#edc22e'
};

const TILE_TEXT_COLORS = {
    2: '#776e65',
    4: '#776e65',
    default: '#f9f6f2'
};

// p5.js setup function
function setup() {
    let canvas = createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    canvas.parent('game-canvas');
    
    // Load best score from localStorage
    bestScore = parseInt(localStorage.getItem('2048-best-score') || '0');
    updateScoreDisplay();
    
    // Initialize game
    initGame();
    
    // Add event listeners
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('modal-restart-btn').addEventListener('click', restartGame);
}

// p5.js draw function
function draw() {
    background(187, 173, 160);
    
    // Draw grid background
    drawGrid();
    
    // Update animations
    updateAnimations();
    
    // Draw tiles
    drawTiles();
}

// Initialize the game
function initGame() {
    // Create empty board
    board = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
        board[i] = [];
        for (let j = 0; j < BOARD_SIZE; j++) {
            board[i][j] = 0;
        }
    }
    
    // Reset game state
    score = 0;
    gameWon = false;
    gameOver = false;
    canMove = true;
    animatingTiles = [];
    
    // Add initial tiles
    addRandomTile();
    addRandomTile();
    
    updateScoreDisplay();
    hideModal();
}

// Draw the grid background
function drawGrid() {
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            let x = j * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN;
            let y = i * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN;
            
            fill(TILE_COLORS[0]);
            noStroke();
            rect(x, y, TILE_SIZE, TILE_SIZE, 6);
        }
    }
}

// Draw all tiles
function drawTiles() {
    // Draw static tiles
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== 0) {
                let x = j * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN;
                let y = i * (TILE_SIZE + TILE_MARGIN) + TILE_MARGIN;
                drawTile(x, y, board[i][j]);
            }
        }
    }
    
    // Draw animating tiles
    for (let animTile of animatingTiles) {
        drawTile(animTile.x, animTile.y, animTile.value);
    }
}

// Draw a single tile
function drawTile(x, y, value) {
    // Tile background
    fill(TILE_COLORS[value] || TILE_COLORS[2048]);
    noStroke();
    rect(x, y, TILE_SIZE, TILE_SIZE, 6);
    
    // Tile text
    if (value > 0) {
        fill(TILE_TEXT_COLORS[value] || TILE_TEXT_COLORS.default);
        textAlign(CENTER, CENTER);
        
        // Adjust font size based on value
        let fontSize = 32;
        if (value >= 1000) fontSize = 24;
        if (value >= 10000) fontSize = 20;
        
        textSize(fontSize);
        textStyle(BOLD);
        text(value, x + TILE_SIZE / 2, y + TILE_SIZE / 2);
    }
}

// Add a random tile (2 or 4) to an empty cell
function addRandomTile() {
    let emptyCells = [];
    
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 0) {
                emptyCells.push({row: i, col: j});
            }
        }
    }
    
    if (emptyCells.length > 0) {
        let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        let value = Math.random() < 0.9 ? 2 : 4; // 90% chance for 2, 10% for 4
        board[randomCell.row][randomCell.col] = value;
    }
}

// Handle keyboard input
function keyPressed() {
    if (!canMove || gameOver) return;
    
    let moved = false;
    
    if (keyCode === UP_ARROW) {
        moved = move('up');
    } else if (keyCode === DOWN_ARROW) {
        moved = move('down');
    } else if (keyCode === LEFT_ARROW) {
        moved = move('left');
    } else if (keyCode === RIGHT_ARROW) {
        moved = move('right');
    }
    
    if (moved) {
        canMove = false;
        setTimeout(() => {
            addRandomTile();
            updateScoreDisplay();
            checkGameState();
            canMove = true;
        }, animationDuration);
    }
}

// Move tiles in the specified direction
function move(direction) {
    let newBoard = JSON.parse(JSON.stringify(board));
    let moved = false;
    
    if (direction === 'left') {
        for (let i = 0; i < BOARD_SIZE; i++) {
            let row = newBoard[i].filter(val => val !== 0);
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    score += row[j];
                    row[j + 1] = 0;
                    if (row[j] === 2048 && !gameWon) {
                        gameWon = true;
                        showWinModal();
                    }
                }
            }
            row = row.filter(val => val !== 0);
            while (row.length < BOARD_SIZE) {
                row.push(0);
            }
            newBoard[i] = row;
        }
    } else if (direction === 'right') {
        for (let i = 0; i < BOARD_SIZE; i++) {
            let row = newBoard[i].filter(val => val !== 0).reverse();
            for (let j = 0; j < row.length - 1; j++) {
                if (row[j] === row[j + 1]) {
                    row[j] *= 2;
                    score += row[j];
                    row[j + 1] = 0;
                    if (row[j] === 2048 && !gameWon) {
                        gameWon = true;
                        showWinModal();
                    }
                }
            }
            row = row.filter(val => val !== 0);
            while (row.length < BOARD_SIZE) {
                row.push(0);
            }
            newBoard[i] = row.reverse();
        }
    } else if (direction === 'up') {
        for (let j = 0; j < BOARD_SIZE; j++) {
            let col = [];
            for (let i = 0; i < BOARD_SIZE; i++) {
                if (newBoard[i][j] !== 0) {
                    col.push(newBoard[i][j]);
                }
            }
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    col[i + 1] = 0;
                    if (col[i] === 2048 && !gameWon) {
                        gameWon = true;
                        showWinModal();
                    }
                }
            }
            col = col.filter(val => val !== 0);
            while (col.length < BOARD_SIZE) {
                col.push(0);
            }
            for (let i = 0; i < BOARD_SIZE; i++) {
                newBoard[i][j] = col[i];
            }
        }
    } else if (direction === 'down') {
        for (let j = 0; j < BOARD_SIZE; j++) {
            let col = [];
            for (let i = BOARD_SIZE - 1; i >= 0; i--) {
                if (newBoard[i][j] !== 0) {
                    col.push(newBoard[i][j]);
                }
            }
            for (let i = 0; i < col.length - 1; i++) {
                if (col[i] === col[i + 1]) {
                    col[i] *= 2;
                    score += col[i];
                    col[i + 1] = 0;
                    if (col[i] === 2048 && !gameWon) {
                        gameWon = true;
                        showWinModal();
                    }
                }
            }
            col = col.filter(val => val !== 0);
            while (col.length < BOARD_SIZE) {
                col.push(0);
            }
            for (let i = 0; i < BOARD_SIZE; i++) {
                newBoard[BOARD_SIZE - 1 - i][j] = col[i];
            }
        }
    }
    
    // Check if board changed
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] !== newBoard[i][j]) {
                moved = true;
                break;
            }
        }
        if (moved) break;
    }
    
    if (moved) {
        board = newBoard;
    }
    
    return moved;
}

// Check if any moves are possible
function canMoveTiles() {
    // Check for empty cells
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            if (board[i][j] === 0) {
                return true;
            }
        }
    }
    
    // Check for possible merges
    for (let i = 0; i < BOARD_SIZE; i++) {
        for (let j = 0; j < BOARD_SIZE; j++) {
            let current = board[i][j];
            
            // Check right
            if (j < BOARD_SIZE - 1 && board[i][j + 1] === current) {
                return true;
            }
            
            // Check down
            if (i < BOARD_SIZE - 1 && board[i + 1][j] === current) {
                return true;
            }
        }
    }
    
    return false;
}

// Check game state (win/lose)
function checkGameState() {
    if (!canMoveTiles()) {
        gameOver = true;
        showGameOverModal();
    }
}

// Update score display
function updateScoreDisplay() {
    document.getElementById('current-score').textContent = score;
    
    if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('2048-best-score', bestScore.toString());
    }
    
    document.getElementById('best-score').textContent = bestScore;
}

// Show win modal
function showWinModal() {
    document.getElementById('game-result').textContent = 'You Win!';
    document.getElementById('final-score').textContent = `Your Score: ${score}`;
    document.getElementById('game-over-modal').classList.remove('hidden');
}

// Show game over modal
function showGameOverModal() {
    document.getElementById('game-result').textContent = 'Game Over!';
    document.getElementById('final-score').textContent = `Your Score: ${score}`;
    document.getElementById('game-over-modal').classList.remove('hidden');
}

// Hide modal
function hideModal() {
    document.getElementById('game-over-modal').classList.add('hidden');
}

// Restart game
function restartGame() {
    initGame();
}

// Animation system (placeholder for smooth animations)
function updateAnimations() {
    // Remove completed animations
    animatingTiles = animatingTiles.filter(tile => {
        tile.progress += 1 / (animationDuration / 16); // Assuming 60fps
        return tile.progress < 1;
    });
}

// Prevent arrow keys from scrolling the page
window.addEventListener('keydown', function(e) {
    if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].indexOf(e.code) > -1) {
        e.preventDefault();
    }
}, false);
