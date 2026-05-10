import { useState, useMemo, useCallback, useEffect } from 'react';
import type { FileEntry, ViewMode } from '../types';
import { FileItem } from './FileItem';

type SortField = 'name' | 'size' | 'type' | 'date';
type SortDirection = 'asc' | 'desc';

interface FileListProps {
  entries: FileEntry[];
  loading: boolean;
  error: string | null;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onNavigate: (path: string) => void;
  onFileSelect: (entry: FileEntry | null) => void;
  onDoubleClick?: (entry: FileEntry) => void;
  onSelectionChange?: (entries: FileEntry[]) => void;
  onFileContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void;
  onBackgroundContextMenu?: (e: React.MouseEvent) => void;
  onDropFile?: (sourcePath: string, targetPath: string, isCopy: boolean) => void;
}

export function FileList({
  entries,
  loading,
  error,
  viewMode,
  onViewModeChange,
  onNavigate,
  onFileSelect,
  onDoubleClick: externalDoubleClick,
  onSelectionChange,
  onFileContextMenu,
  onBackgroundContextMenu,
  onDropFile,
}: FileListProps) {
  const [selectedPaths, setSelectedPaths] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // 排序后的 entries
  const sortedEntries = useMemo(() => {
    const sorted = [...entries];
    const dir = sortDirection === 'asc' ? 1 : -1;

    sorted.sort((a, b) => {
      // 文件夹优先（仅 name 排序时）
      if (sortField === 'name') {
        if (a.isDirectory !== b.isDirectory) {
          return a.isDirectory ? -1 : 1;
        }
        return dir * a.name.localeCompare(b.name, 'zh-CN');
      }

      // 其他排序字段：文件夹始终在前
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }

      switch (sortField) {
        case 'size':
          return dir * (a.size - b.size);
        case 'type': {
          const extA = a.name.includes('.') ? a.name.slice(a.name.lastIndexOf('.')).toLowerCase() : '';
          const extB = b.name.includes('.') ? b.name.slice(b.name.lastIndexOf('.')).toLowerCase() : '';
          return dir * extA.localeCompare(extB);
        }
        case 'date':
          return dir * (a.modified.getTime() - b.modified.getTime());
        default:
          return 0;
      }
    });

    return sorted;
  }, [entries, sortField, sortDirection]);

  // 通知父组件选中变化
  const notifySelectionChange = useCallback((paths: Set<string>) => {
    if (onSelectionChange) {
      const selected = sortedEntries.filter(e => paths.has(e.path));
      onSelectionChange(selected);
    }
  }, [onSelectionChange, sortedEntries]);

  // Ctrl+A 全选
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allPaths = new Set(sortedEntries.map(e => e.path));
        setSelectedPaths(allPaths);
        setLastSelectedIndex(sortedEntries.length - 1);
        notifySelectionChange(allPaths);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sortedEntries, notifySelectionChange]);

  const handleDoubleClick = (entry: FileEntry) => {
    if (externalDoubleClick) {
      externalDoubleClick(entry);
    } else if (entry.isDirectory) {
      onNavigate(entry.path);
    } else {
      onFileSelect(entry);
    }
  };

  const handleClick = (entry: FileEntry, e: React.MouseEvent) => {
    const currentIndex = sortedEntries.findIndex(en => en.path === entry.path);
    if (currentIndex === -1) return;

    let newSelected: Set<string>;

    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + 点击：切换选中
      newSelected = new Set(selectedPaths);
      if (newSelected.has(entry.path)) {
        newSelected.delete(entry.path);
      } else {
        newSelected.add(entry.path);
      }
      setLastSelectedIndex(currentIndex);
    } else if (e.shiftKey && lastSelectedIndex >= 0) {
      // Shift + 点击：范围选择
      const start = Math.min(lastSelectedIndex, currentIndex);
      const end = Math.max(lastSelectedIndex, currentIndex);
      newSelected = new Set(selectedPaths);
      for (let i = start; i <= end; i++) {
        newSelected.add(sortedEntries[i].path);
      }
    } else {
      // 无修饰键：单击选中一个
      newSelected = new Set([entry.path]);
      setLastSelectedIndex(currentIndex);
    }

    setSelectedPaths(newSelected);
    notifySelectionChange(newSelected);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortArrow = (field: SortField) => {
    if (sortField !== field) return '';
    return sortDirection === 'asc' ? ' \u25B2' : ' \u25BC';
  };

  const handleFileContextMenu = (e: React.MouseEvent, entry: FileEntry) => {
    if (onFileContextMenu) {
      onFileContextMenu(e, entry);
    }
  };

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    if (onBackgroundContextMenu) {
      onBackgroundContextMenu(e);
    }
  };

  // 文件项拖拽开始
  const handleItemDragStart = useCallback((entry: FileEntry) => (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', entry.path);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  // 目录项拖拽经过
  const handleItemDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  // 目录项拖拽放下
  const handleItemDrop = useCallback((entry: FileEntry) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!onDropFile) return;
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (sourcePath && sourcePath !== entry.path) {
      onDropFile(sourcePath, entry.path, e.ctrlKey || e.metaKey);
    }
  }, [onDropFile]);

  if (loading) {
    return (
      <div className="file-list-container">
        <div className="file-list-status">
          <div className="loading-indicator">
            <span className="loading-text">正在加载...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="file-list-container">
        <div className="file-list-status">
          <div className="error-message">
            <span className="error-icon">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="file-list-container">
        <div className="file-list-status">
          <div className="empty-message">
            <span className="empty-icon">📂</span>
            <span>此文件夹为空</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list-container">
      <div className="file-list-header">
        <div className="view-mode-buttons">
          <button
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            onClick={() => onViewModeChange('list')}
            title="列表视图"
          >
            ☰
          </button>
          <button
            className={`view-btn ${viewMode === 'icons' ? 'active' : ''}`}
            onClick={() => onViewModeChange('icons')}
            title="图标视图"
          >
            ⊞
          </button>
        </div>
        <span className="file-count">{entries.length} 个项目</span>
      </div>

      {viewMode === 'list' ? (
        <div className="file-table-wrapper" onContextMenu={handleBackgroundContextMenu}>
          <table className="file-table">
            <thead>
              <tr>
                <th className="file-cell file-cell-name" onClick={() => handleSort('name')}>
                  名称{getSortArrow('name')}
                </th>
                <th className="file-cell file-cell-size" onClick={() => handleSort('size')}>
                  大小{getSortArrow('size')}
                </th>
                <th className="file-cell file-cell-type" onClick={() => handleSort('type')}>
                  类型{getSortArrow('type')}
                </th>
                <th className="file-cell file-cell-date" onClick={() => handleSort('date')}>
                  修改日期{getSortArrow('date')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedEntries.map(entry => (
                <FileItem
                  key={entry.path}
                  entry={entry}
                  viewMode={viewMode}
                  onDoubleClick={handleDoubleClick}
                  onClick={(e) => handleClick(entry, e)}
                  isSelected={selectedPaths.has(entry.path)}
                  onContextMenu={(e) => handleFileContextMenu(e, entry)}
                  draggable={true}
                  onDragStart={handleItemDragStart(entry)}
                  onDragOver={entry.isDirectory ? handleItemDragOver : undefined}
                  onDrop={entry.isDirectory ? handleItemDrop(entry) : undefined}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="file-icon-grid" onContextMenu={handleBackgroundContextMenu}>
          {sortedEntries.map(entry => (
            <FileItem
              key={entry.path}
              entry={entry}
              viewMode={viewMode}
              onDoubleClick={handleDoubleClick}
              onClick={(e) => handleClick(entry, e)}
              isSelected={selectedPaths.has(entry.path)}
              onContextMenu={(e) => handleFileContextMenu(e, entry)}
              draggable={true}
              onDragStart={handleItemDragStart(entry)}
              onDragOver={entry.isDirectory ? handleItemDragOver : undefined}
              onDrop={entry.isDirectory ? handleItemDrop(entry) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  );
}
