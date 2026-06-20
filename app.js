const { useState, useEffect, useRef } = React;
const createElement = React.createElement;

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

function shuffle(array) {
  const copy = array.slice();
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function createDeck(items) {
  const doubled = items.flatMap(item => [{ ...item }, { ...item }]);
  return shuffle(doubled).map((card, index) => ({ ...card, uniqueId: index }));
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainingSeconds = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainingSeconds}`;
}

function useTimer(isRunning) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!isRunning) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      setSeconds(currentSeconds => currentSeconds + 1);
    }, 1000);

    return () => clearInterval(intervalId);
  }, [isRunning]);

  return [seconds, setSeconds];
}

function joinClasses(...classes) {
  return classes.filter(Boolean).join(' ');
}

function Card({ card, size = 'card-size-md', isFlipped, isMatched, onClick }) {
  const cardClassName = joinClasses(
    'card',
    size,
    isFlipped || isMatched ? 'flipped' : '',
    isMatched ? 'matched' : '',
    isFlipped && isMatched ? 'celebrate' : ''
  );

  return createElement(
    'button',
    {
      type: 'button',
      className: cardClassName,
      onClick: () => onClick(card.uniqueId),
      disabled: isMatched,
      'aria-pressed': isFlipped,
      'aria-label': `${card.name} card`
    },
    createElement(
      'span',
      { className: 'card-inner' },
      createElement(
        'span',
        { className: 'card-face card-back' },
        createElement('span', { className: 'card-question' }, '?')
      ),
      createElement(
        'span',
        { className: 'card-face card-front' },
        createElement('span', { className: 'card-emoji' }, card.emoji)
      )
    )
  );
}

function MemoryGameApp() {
  const [deck, setDeck] = useState([]);
  const [flippedIds, setFlippedIds] = useState([]);
  const [matchedIds, setMatchedIds] = useState(new Set());
  const [moves, setMoves] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [seconds, setSeconds] = useTimer(gameStarted && !gameOver);
  const boardLockedRef = useRef(false);
  const pendingTimeoutsRef = useRef([]);

  function clearPendingTimeouts() {
    pendingTimeoutsRef.current.forEach(timeoutId => clearTimeout(timeoutId));
    pendingTimeoutsRef.current = [];
  }

  function resetGame() {
    clearPendingTimeouts();
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

    return () => {
      clearPendingTimeouts();
    };
  }, []);

  function handleCardClick(uniqueId) {
    if (boardLockedRef.current) return;
    if (matchedIds.has(uniqueId)) return;
    if (flippedIds.includes(uniqueId)) return;

    if (!gameStarted) {
      setGameStarted(true);
    }

    const nextFlipped = [...flippedIds, uniqueId];
    setFlippedIds(nextFlipped);

    if (nextFlipped.length === 2) {
      setMoves(currentMoves => currentMoves + 1);
      boardLockedRef.current = true;

      const [firstId, secondId] = nextFlipped;
      const firstCard = deck.find(card => card.uniqueId === firstId);
      const secondCard = deck.find(card => card.uniqueId === secondId);

      const timeoutId = setTimeout(() => {
        if (firstCard && secondCard && firstCard.id === secondCard.id) {
          setMatchedIds(previousMatchedIds => new Set([...previousMatchedIds, firstId, secondId]));
        }

        setFlippedIds([]);
        boardLockedRef.current = false;
        pendingTimeoutsRef.current = pendingTimeoutsRef.current.filter(id => id !== timeoutId);
      }, MATCH_CHECK_DELAY_MS);

      pendingTimeoutsRef.current.push(timeoutId);
    }
  }

  useEffect(() => {
    if (deck.length > 0 && matchedIds.size === deck.length) {
      setGameOver(true);
      boardLockedRef.current = false;
    }
  }, [matchedIds, deck]);

  return createElement(
    'div',
    { className: 'app-shell' },
    createElement(
      'main',
      { className: 'game-card' },
      createElement(
        'header',
        { className: 'hero' },
        createElement('p', { className: 'eyebrow' }, 'Memory challenge'),
        createElement('h1', { className: 'title' }, 'Memory Card Game'),
        createElement(
          'p',
          { className: 'subtitle' },
          'Flip cards, find the pairs, and finish with the fewest moves possible.'
        )
      ),
      createElement(
        'section',
        { className: 'stats', 'aria-label': 'Game stats' },
        createElement(
          'div',
          { className: 'stat' },
          createElement('span', { className: 'stat-label' }, 'Moves'),
          createElement('strong', { className: 'stat-value' }, moves)
        ),
        createElement(
          'div',
          { className: 'stat' },
          createElement('span', { className: 'stat-label' }, 'Time'),
          createElement('strong', { className: 'stat-value' }, formatTime(seconds))
        )
      ),
      createElement(
        'section',
        { className: 'board-shell' },
        createElement(
          'div',
          { className: 'game-board', 'aria-label': 'Memory card board' },
          deck.map(card => {
            const isFlipped = flippedIds.includes(card.uniqueId);
            const isMatched = matchedIds.has(card.uniqueId);

            return createElement(Card, {
              key: card.uniqueId,
              card,
              size: 'card-size-md',
              isFlipped,
              isMatched,
              onClick: handleCardClick
            });
          })
        )
      ),
      gameOver && createElement(
        'section',
        { className: 'result-card', 'aria-live': 'polite' },
        createElement('h2', { className: 'result-title' }, 'Congratulations!'),
        createElement(
          'p',
          { className: 'result-copy' },
          `You completed the game in ${moves} moves and ${formatTime(seconds)}.`
        ),
        createElement(
          'button',
          {
            type: 'button',
            className: 'button button-primary',
            onClick: resetGame
          },
          'Play Again'
        )
      ),
      createElement(
        'footer',
        { className: 'controls' },
        createElement(
          'button',
          {
            type: 'button',
            className: 'button button-secondary',
            onClick: resetGame
          },
          'Reset Game'
        )
      ),
      createElement(
        'section',
        { className: 'instructions' },
        createElement('h3', { className: 'instructions-title' }, 'How to Play'),
        createElement(
          'p',
          { className: 'instructions-copy' },
          'Click cards to reveal their emojis. Match every pair to finish the game.'
        ),
        createElement(
          'div',
          { className: 'tips' },
          createElement('h4', { className: 'tips-title' }, 'Tips'),
          createElement(
            'ul',
            { className: 'tips-list' },
            createElement('li', null, 'Remember the positions of cards you have already seen.'),
            createElement('li', null, 'Try to complete the board in as few moves as possible.'),
            createElement('li', null, 'The timer starts on your first card flip.')
          )
        )
      )
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(createElement(MemoryGameApp));
