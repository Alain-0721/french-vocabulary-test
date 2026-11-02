import {useEffect, useRef} from 'react';

export function scrollToFirstQuizWord() {
  const list = document.querySelector('.dp-quiz .dp-word-list');
  const target = list?.querySelector('.study-word-row, .dp-word-row') || list;
  if (!target) return;
  target.scrollIntoView?.({block: 'start', behavior: 'smooth'});
}

export function useFollowQuizWords(key) {
  const previous = useRef(key);
  useEffect(() => {
    if (previous.current === key) return;
    previous.current = key;
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(scrollToFirstQuizWord);
    });
    return () => cancelAnimationFrame(frame);
  }, [key]);
}
