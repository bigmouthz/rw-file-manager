import { useState, useCallback } from 'react';

export function useNavigation() {
  const [history, setHistory] = useState<string[]>(['/']);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canGoBack = currentIndex > 0;
  const canGoForward = currentIndex < history.length - 1;

  const navigate = useCallback((path: string) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(path);
      return newHistory;
    });
    setCurrentIndex(prev => prev + 1);
  }, [currentIndex]);

  const goBack = useCallback(() => {
    if (canGoBack) {
      setCurrentIndex(prev => prev - 1);
      return history[currentIndex - 1];
    }
    return null;
  }, [canGoBack, history, currentIndex]);

  const goForward = useCallback(() => {
    if (canGoForward) {
      setCurrentIndex(prev => prev + 1);
      return history[currentIndex + 1];
    }
    return null;
  }, [canGoForward, history, currentIndex]);

  const reset = useCallback((path: string = '/') => {
    setHistory([path]);
    setCurrentIndex(0);
  }, []);

  return {
    history,
    currentIndex,
    canGoBack,
    canGoForward,
    navigate,
    goBack,
    goForward,
    reset,
  };
}
