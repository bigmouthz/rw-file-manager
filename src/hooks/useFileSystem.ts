import { useState, useCallback } from 'react';
import type { FileEntry } from '../types';
import { getDirectoryContents, getParentPath, pathExists } from '../utils/fileSystem';

export function useFileSystem() {
  const [currentPath, setCurrentPath] = useState('/');
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDirectory = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    try {
      const contents = await getDirectoryContents(path);
      setEntries(contents);
      setCurrentPath(path);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const navigateTo = useCallback(async (path: string) => {
    const exists = await pathExists(path);
    if (exists) {
      await loadDirectory(path);
    } else {
      setError(`路径不存在: ${path}`);
    }
  }, [loadDirectory]);

  const navigateUp = useCallback(async () => {
    const parent = getParentPath(currentPath);
    await loadDirectory(parent);
  }, [currentPath, loadDirectory]);

  const refresh = useCallback(async () => {
    await loadDirectory(currentPath);
  }, [currentPath, loadDirectory]);

  return {
    currentPath,
    entries,
    loading,
    error,
    loadDirectory,
    navigateTo,
    navigateUp,
    refresh,
  };
}
