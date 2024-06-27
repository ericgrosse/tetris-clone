import React, { useEffect, useState, useRef } from 'react';
import './App.css';

const canvasWidth = 300;
const canvasHeight = 450;
const cols = 10;
const rows = 15;
const blockSize = 30;
const tetrominoes = [
  // I
  [
    [1, 1, 1, 1]
  ],
  // J
  [
    [1, 0, 0],
    [1, 1, 1]
  ],
  // L
  [
    [0, 0, 1],
    [1, 1, 1]
  ],
  // O
  [
    [1, 1],
    [1, 1]
  ],
  // S
  [
    [0, 1, 1],
    [1, 1, 0]
  ],
  // T
  [
    [0, 1, 0],
    [1, 1, 1]
  ],
  // Z
  [
    [1, 1, 0],
    [0, 1, 1]
  ]
];
const colors = ['cyan', 'blue', 'orange', 'yellow', 'green', 'purple', 'red'];

function randomTetromino() {
  const index = Math.floor(Math.random() * tetrominoes.length);
  return {
    shape: tetrominoes[index],
    color: colors[index],
    x: Math.floor(cols / 2) - 1,
    y: 0
  };
}

function GameComponent() {
  const [gamepadIndex, setGamepadIndex] = useState(null);
  const [pressedButtons, setPressedButtons] = useState([]);
  const canvasRef = useRef(null);
  const [board, setBoard] = useState(Array.from({ length: rows }, () => Array(cols).fill(null)));
  const [currentPiece, setCurrentPiece] = useState(randomTetromino);
  const [dropInterval, setDropInterval] = useState(1000);
  const [lastDropTime, setLastDropTime] = useState(Date.now());

  const rotate = (shape) => {
    const newShape = shape[0].map((_, index) => shape.map(row => row[index])).reverse();
    return newShape;
  };

  const isValidMove = (shape, x, y) => {
    return shape.every((row, dy) =>
      row.every((cell, dx) => {
        const newX = x + dx;
        const newY = y + dy;
        return (
          cell === 0 ||
          (newX >= 0 && newX < cols && newY < rows && (newY < 0 || board[newY][newX] === null))
        );
      })
    );
  };

  const mergePiece = (piece) => {
    const newBoard = board.map(row => [...row]);
    piece.shape.forEach((row, y) => {
      row.forEach((cell, x) => {
        if (cell !== 0) {
          newBoard[piece.y + y][piece.x + x] = piece.color;
        }
      });
    });
    return newBoard;
  };

  const handleGamepadInput = () => {
    const gamepads = navigator.getGamepads();
    const gamepad = gamepads[gamepadIndex];

    if (gamepad) {
      // Capture button inputs
      const newPressedButtons = [];
      gamepad.buttons.forEach((button, index) => {
        if (button.pressed) {
          newPressedButtons.push(index);
        }
      });
      setPressedButtons(newPressedButtons);

      // Handle movements and rotations
      let newPiece = { ...currentPiece };

      if (newPressedButtons.includes(14)) {
        // Left d-pad
        const newX = newPiece.x - 1;
        if (isValidMove(newPiece.shape, newX, newPiece.y)) {
          newPiece.x = newX;
        }
      } else if (newPressedButtons.includes(15)) {
        // Right d-pad
        const newX = newPiece.x + 1;
        if (isValidMove(newPiece.shape, newX, newPiece.y)) {
          newPiece.x = newX;
        }
      }

      if (newPressedButtons.includes(13)) {
        // Down d-pad
        setDropInterval(100);
      } else {
        setDropInterval(1000);
      }

      if (newPressedButtons.includes(2) || newPressedButtons.includes(6)) {
        // Rotate left
        const newShape = rotate(newPiece.shape);
        if (isValidMove(newShape, newPiece.x, newPiece.y)) {
          newPiece.shape = newShape;
        }
      }

      if (newPressedButtons.includes(1) || newPressedButtons.includes(7)) {
        // Rotate right
        const newShape = rotate(rotate(rotate(newPiece.shape)));
        if (isValidMove(newShape, newPiece.x, newPiece.y)) {
          newPiece.shape = newShape;
        }
      }

      setCurrentPiece(newPiece);
    }

    requestAnimationFrame(handleGamepadInput);
  };

  const handleKeyDown = (event) => {
    let newPiece = { ...currentPiece };

    switch (event.key) {
      case 'ArrowLeft':
        // Move left
        const newXLeft = newPiece.x - 1;
        if (isValidMove(newPiece.shape, newXLeft, newPiece.y)) {
          newPiece.x = newXLeft;
        }
        break;
      case 'ArrowRight':
        // Move right
        const newXRight = newPiece.x + 1;
        if (isValidMove(newPiece.shape, newXRight, newPiece.y)) {
          newPiece.x = newXRight;
        }
        break;
      case 'ArrowDown':
        // Move down faster
        setDropInterval(100);
        break;
      case 'a':
        // Rotate left
        const newShapeLeft = rotate(newPiece.shape);
        if (isValidMove(newShapeLeft, newPiece.x, newPiece.y)) {
          newPiece.shape = newShapeLeft;
        }
        break;
      case 'z':
        // Rotate right
        const newShapeRight = rotate(rotate(rotate(newPiece.shape)));
        if (isValidMove(newShapeRight, newPiece.x, newPiece.y)) {
          newPiece.shape = newShapeRight;
        }
        break;
      default:
        break;
    }

    setCurrentPiece(newPiece);
  };

  const handleKeyUp = (event) => {
    if (event.key === 'ArrowDown') {
      setDropInterval(1000);
    }
  };

  const dropPiece = () => {
    let newPiece = { ...currentPiece };
    newPiece.y += 1;

    if (!isValidMove(newPiece.shape, newPiece.x, newPiece.y)) {
      // Merge piece into board and spawn a new piece
      const newBoard = mergePiece(currentPiece);
      newPiece = randomTetromino();

      // Check for completed lines
      for (let y = rows - 1; y >= 0; y--) {
        if (newBoard[y].every(cell => cell !== null)) {
          newBoard.splice(y, 1);
          newBoard.unshift(Array(cols).fill(null));
        }
      }

      setBoard(newBoard);

      if (!isValidMove(newPiece.shape, newPiece.x, newPiece.y)) {
        // Game over
        setBoard(Array.from({ length: rows }, () => Array(cols).fill(null)));
        alert('Game Over');
        newPiece = randomTetromino();
      }
    }

    setCurrentPiece(newPiece);
  };

  useEffect(() => {
    const handleGamepadConnected = (event) => {
      console.log('Gamepad connected:', event.gamepad);
      setGamepadIndex(event.gamepad.index);
    };

    const handleGamepadDisconnected = (event) => {
      console.log('Gamepad disconnected:', event.gamepad);
      setGamepadIndex(null);
    };

    window.addEventListener('gamepadconnected', handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', handleGamepadDisconnected);

    return () => {
      window.removeEventListener('gamepadconnected', handleGamepadConnected);
      window.removeEventListener('gamepaddisconnected', handleGamepadDisconnected);
    };
  }, []);

  useEffect(() => {
    if (gamepadIndex !== null) {
      handleGamepadInput();
    }
  }, [gamepadIndex, currentPiece]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      const now = Date.now();
      if (now - lastDropTime >= dropInterval) {
        dropPiece();
        setLastDropTime(now);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [lastDropTime, dropInterval, currentPiece]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    const render = () => {
      context.clearRect(0, 0, canvasWidth, canvasHeight);

      // Draw board
      board.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== null) {
            context.fillStyle = cell;
            context.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);
            context.strokeRect(x * blockSize, y * blockSize, blockSize, blockSize);
          }
        });
      });

      // Draw current piece
      currentPiece.shape.forEach((row, y) => {
        row.forEach((cell, x) => {
          if (cell !== 0) {
            context.fillStyle = currentPiece.color;
            context.fillRect((currentPiece.x + x) * blockSize, (currentPiece.y + y) * blockSize, blockSize, blockSize);
            context.strokeRect((currentPiece.x + x) * blockSize, (currentPiece.y + y) * blockSize, blockSize, blockSize);
          }
        });
      });

      requestAnimationFrame(render);
    };

    render();
  }, [board, currentPiece]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentPiece]);

  return (
    <div>
      <h1>Tetris Game</h1>
      <canvas ref={canvasRef} width={canvasWidth} height={canvasHeight} />
    </div>
  );
}

function App() {
  return (
    <div className="App">
      <GameComponent />
    </div>
  );
}

export default App;
