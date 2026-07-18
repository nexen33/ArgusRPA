import React, { useState, useEffect } from 'react';

const WORDS = ['Browser', 'Desktop'];
const TYPE_SPEED = 120;
const DELETE_SPEED = 60;
const PAUSE_TIME = 2000;

export const TypewriterTitle: React.FC = () => {
  const [text, setText] = useState('');
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const currentWord = WORDS[wordIndex];

    if (isDeleting) {
      if (text === '') {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % WORDS.length);
        timer = setTimeout(() => { }, 200); // small pause before typing next
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length - 1));
        }, DELETE_SPEED);
      }
    } else {
      if (text === currentWord) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, PAUSE_TIME);
      } else {
        timer = setTimeout(() => {
          setText(currentWord.substring(0, text.length + 1));
        }, TYPE_SPEED);
      }
    }

    return () => clearTimeout(timer);
  }, [text, isDeleting, wordIndex]);

  return (
    <div className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tighter flex items-center text-[var(--text-primary)] drop-shadow-sm">
      <span className="whitespace-pre">Argus RPA for </span>
      <span className="text-[var(--accent)] tracking-tight">{text}</span>
      <span className="animate-pulse text-[var(--accent)] ml-1 opacity-70 font-light">|</span>
    </div>
  );
};
