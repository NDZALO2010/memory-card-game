/**
 * Memory Card Game - refactored for readability and maintainability
 * - Separates concerns: utilities, hooks, small components
 * - Clear naming and comments for easier reading
 * Note: This file is intended to be loaded with Babel (`type="text/babel"`).
 */

const { useState, useEffect, useRef } = React;

// --- Constants -----------------------------------------------------------------
const EMOJI_LIST = [
  { id: 1, emoji: '🐶', name: 'Dog' },
  { id: 2, emoji: '🐱', name: 'Cat' },
  { id: 3, emoji: '🐭', name: 'Mouse' },
  { id: 4, emoji: '🐹', name: 'Hamster' },
  { id: 5, emoji: '🐰', name: 'Rabbit' },
  { id: 6, emoji: '🦊', name: 'Fox' },
  { id: 7, emoji: '🐻', name: 'Bear' },
  { id: 8, emoji: '🐼', name: 'Panda' }
];

const MATCH_CHECK_DELAY_MS = 800;

// --- Utilities -----------------------------------------------------------------
function shuffle(array) {
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function createDeck(items) {
  // Create two copies of each item and assign unique ids
  const doubled = items.flatMap(item => [ { ...item }, { ...item } ]);
  return shuffle(doubled).map((card, index) => ({ ...card, uniqueId: index }));
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
}

// --- Hooks ---------------------------------------------------------------------
function useTimer(isRunning) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => setSeconds(s => s + 1), 1000);
    return () => clearInterval(id);
  }, [isRunning]);
  return [seconds, setSeconds];
}

// --- Presentational components -------------------------------------------------
function Card({ card, size = 'size-sm', isFlipped, isMatched, onClick }) {
  const rootClass = `card ${size} ${isFlipped || isMatched ? 'flipped' : ''} ${isMatched ? 'matched' : ''} ${isFlipped && isMatched ? 'celebrate' : ''}`;
  return (
    <div className={rootClass} onClick={() => onClick(card.uniqueId)} role="button" tabIndex={0} aria-pressed={isFlipped}>
      <div className="card-back rounded-md shadow-md flex items-center justify-center">
        <span className="text-2xl md:text-4xl">?</span>
      </div>
      <div className="card-front rounded-md shadow-md">
        <span className="text-2xl md:text-4xl">{card.emoji}</span>
      </div>
    </div>
  );
}

// --- Main game component ------------------------------------------------------
function MemoryGameApp() {
  const [deck, setDeck] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]); // uniqueIds of currently flipped cards
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [seconds, setSeconds] = useTimer(gameStarted && !gameOver);
  const boardLockedRef = useRef(false);

  // Initialize or reset the game
  function resetGame() {
    setDeck(createDeck(EMOJI_LIST));
    setFlippedIds([]);
    setMatchedIds(new Set());
    setMoves(0);
    setGameOver(false);
    setSeconds(0);
    setGameStarted(false);
    boardLockedRef.current = false;
  }

  useEffect(() => {
    resetGame();
  }, []);

  // Called when a card is clicked
  function handleCardClick(uniqueId) {
    if (boardLockedRef.current) return;
    if (matchedIds.has(uniqueId)) return;
    if (flippedIds.includes(uniqueId)) return;

    if (!gameStarted) setGameStarted(true);

    const nextFlipped = [...flippedIds, uniqueId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(m => m + 1);
      boardLockedRef.current = true;
      const [firstId, secondId] = nextFlipped;
      const firstCard = deck.find(c => c.uniqueId === firstId);
      const secondCard = deck.find(c => c.uniqueId === secondId);

      if (firstCard.id === secondCard.id) {
        // It's a match
        setTimeout(() => {
          setMatchedIds(prev => new Set([...prev, firstId, secondId]));
          setFlippedIds([]);
          boardLockedRef.current = false;
        }, MATCH_CHECK_DELAY_MS);
      } else {
        // Not a match -- flip back
        setTimeout(() => {
          setFlippedIds([]);
          boardLockedRef.current = false;
        }, MATCH_CHECK_DELAY_MS);
      }
    }
  }

  // Detect game over when matched count reaches deck size
  useEffect(() => {
    if (deck.length > 0 && matchedIds.size === deck.length) {
      setGameOver(true);
      boardLockedRef.current = false;
    }
  }, [matchedIds, deck]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <h1 className="text-4xl font-bold text-blue-800 mb-8">Memory Card Game</h1>

      <div className="flex justify-between w-full max-w-md mb-6">
        <div className="text-lg font-semibold">Moves: {moves}</div>
        <div className="text-lg font-semibold">Time: {formatTime(seconds)}</div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {deck.map(card => {
          const isFlipped = flippedIds.includes(card.uniqueId);
          const isMatched = matchedIds.has(card.uniqueId);
          return (
            <Card
              key={card.uniqueId}
              card={card}
              size="size-md"
              isFlipped={isFlipped}
              isMatched={isMatched}
              onClick={handleCardClick}
            />
          );
        })}
      </div>

      {gameOver && (
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-green-600 mb-4">Congratulations!</h2>
          <p className="text-lg mb-2">You completed the game in {moves} moves and {formatTime(seconds)}!</p>
          <button onClick={resetGame} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Play Again</button>
        </div>
      )}

      <div className="flex gap-4">
        <button onClick={resetGame} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Reset Game</button>
      </div>

      <div className="mt-8 text-center max-w-md">
        <h3 className="text-xl font-semibold mb-2">How to Play</h3>
        <p className="mb-4">Click on cards to flip them. Find matching pairs of animal emojis to win the game.</p>

        <div className="bg-blue-100 p-4 rounded-lg">
          <h4 className="font-semibold mb-2">Tips:</h4>
          <ul className="list-disc pl-5 text-left">
            <li>Remember the positions of cards you've seen</li>
            <li>Try to complete the game with as few moves as possible</li>
            <li>The timer starts when you flip your first card</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<MemoryGameApp />);
