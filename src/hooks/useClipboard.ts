import { useState, useCallback } from 'react';

export interface ClipboardItem {
  path: string;
  name: string;
  isDirectory: boolean;
}

export function useClipboard() {
  const [clipboard, setClipboard] = useState<ClipboardItem[]>([]);
  const [operation, setOperation] = useState<'copy' | 'cut' | null>(null);

  const copyFiles = useCallback((items: ClipboardItem[]) => {
    setClipboard(items);
    setOperation('copy');
  }, []);

  const cutFiles = useCallback((items: ClipboardItem[]) => {
    setClipboard(items);
    setOperation('cut');
  }, []);

  const clearClipboard = useCallback(() => {
    setClipboard([]);
    setOperation(null);
  }, []);

  const canPaste = clipboard.length > 0 && operation !== null;

  return {
    clipboard,
    operation,
    copyFiles,
    cutFiles,
    clearClipboard,
    canPaste,
  } as const;
}
