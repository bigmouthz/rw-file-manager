import { useState, useEffect, useCallback, useRef } from 'react';
import type { FileEntry } from '../types';
import { getDirectoryContents } from '../utils/fileSystem';

interface DirectoryTreeProps {
  entry: FileEntry;
  currentPath: string;
  depth?: number;
  onNavigate: (path: string) => void;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
  onContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void;
  onDropFile?: (sourcePath: string, targetPath: string, isCopy: boolean) => void;
  refreshKey?: number;
}

export function DirectoryTree({
  entry,
  currentPath,
  depth = 0,
  onNavigate,
  expandedPaths,
  onToggleExpand,
  onContextMenu,
  onDropFile,
  refreshKey,
}: DirectoryTreeProps) {
  const [children, setChildren] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const dragCounterRef = useRef(0);

  const isExpanded = expandedPaths.has(entry.path);
  const isSelected = currentPath === entry.path;

  // 加载子目录
  const loadChildren = useCallback(async () => {
    if (!entry.isDirectory) return;
    setLoading(true);
    try {
      const entries = await getDirectoryContents(entry.path);
      // 只显示子目录
      setChildren(entries.filter(e => e.isDirectory));
      setLoaded(true);
    } catch {
      setChildren([]);
      setLoaded(true);
    }
    setLoading(false);
  }, [entry.path, entry.isDirectory]);

  // 展开/折叠
  const handleToggle = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleExpand(entry.path);
    if (!loaded) {
      await loadChildren();
    }
  }, [entry.path, loaded, loadChildren, onToggleExpand]);

  // 点击选中
  const handleSelect = useCallback(() => {
    if (entry.isDirectory) {
      onNavigate(entry.path);
      // 如果还没加载子目录，自动加载
      if (!loaded) {
        loadChildren();
      }
    }
  }, [entry, onNavigate, loaded, loadChildren]);

  // 当展开时自动加载子目录
  useEffect(() => {
    if (isExpanded && !loaded && entry.isDirectory) {
      loadChildren();
    }
  }, [isExpanded, loaded, entry.isDirectory, loadChildren]);

  // 当 refreshKey 变化时重新加载已展开的子目录
  useEffect(() => {
    if (refreshKey !== undefined && refreshKey > 0 && isExpanded && entry.isDirectory) {
      setLoaded(false);
      loadChildren();
    }
  }, [refreshKey]);

  // 拖拽源
  const handleDragStart = useCallback((e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', entry.path);
    e.dataTransfer.effectAllowed = 'move';
  }, [entry.path]);

  // 拖拽经过（仅目录可接收）
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (entry.isDirectory) {
      dragCounterRef.current += 1;
      setDragOver(true);
    }
  }, [entry.isDirectory]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0;
      setDragOver(false);
    }
  }, []);

  // 拖拽放下
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    dragCounterRef.current = 0;
    if (!onDropFile || !entry.isDirectory) return;
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath && sourcePath !== entry.path) {
      onDropFile(sourcePath, entry.path, e.ctrlKey || e.metaKey);
    }
  }, [onDropFile, entry.path, entry.isDirectory]);

  return (
    <div className="tree-node">
      <div
        className={`tree-item ${isSelected ? 'selected' : ''} ${dragOver ? 'drag-over' : ''}`}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
        onClick={handleSelect}
        onContextMenu={(e) => onContextMenu?.(e, entry)}
        draggable={true}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 展开/折叠箭头 */}
        <span
          className={`tree-toggle ${entry.isDirectory ? 'has-children' : 'no-children'}`}
          onClick={handleToggle}
        >
          {entry.isDirectory ? (isExpanded ? '📂' : '📁') : '📄'}
        </span>
        {/* 展开/折叠指示器 */}
        {entry.isDirectory && (
          <span className="tree-arrow" onClick={handleToggle}>
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {/* 名称 */}
        <span className="tree-label">{entry.name}</span>
        {/* 加载指示 */}
        {loading && <span className="tree-loading">...</span>}
      </div>

      {/* 子目录递归渲染 */}
      {isExpanded && children.length > 0 && (
        <div className="tree-children">
          {children.map(child => (
            <DirectoryTree
              key={child.path}
              entry={child}
              currentPath={currentPath}
              depth={depth + 1}
              onNavigate={onNavigate}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
              onContextMenu={onContextMenu}
              onDropFile={onDropFile}
              refreshKey={refreshKey}
            />
          ))}
        </div>
      )}

      {/* 展开后无子目录 */}
      {isExpanded && loaded && children.length === 0 && (
        <div className="tree-children">
          <div
            className="tree-empty"
            style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}
          >
            （没有子文件夹）
          </div>
        </div>
      )}
    </div>
  );
}
