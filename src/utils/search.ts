import type { FileEntry } from '../types';
import { getDirectoryContents } from './fileSystem';

/**
 * 在文件系统中搜索文件
 */
export async function searchFiles(
  query: string,
  currentPath: string
): Promise<FileEntry[]> {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();
  const results: FileEntry[] = [];
  const visited = new Set<string>();

  async function searchRecursive(path: string) {
    if (visited.has(path)) return;
    visited.add(path);

    try {
      const entries = await getDirectoryContents(path);
      for (const entry of entries) {
        // 检查文件名是否匹配
        if (entry.name.toLowerCase().includes(lowerQuery)) {
          results.push(entry);
        }
        // 递归搜索子目录
        if (entry.isDirectory) {
          await searchRecursive(entry.path);
        }
      }
    } catch {
      // 忽略无法访问的目录
    }
  }

  await searchRecursive(currentPath);
  return results;
}

/**
 * 高亮搜索匹配文本
 */
export function highlightMatch(text: string, query: string): string {
  if (!query.trim()) return text;
  
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
