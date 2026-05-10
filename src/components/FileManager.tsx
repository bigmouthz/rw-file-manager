import { useEffect, useState, useCallback } from 'react';
import type { FileEntry, ViewMode } from '../types';
import { useFileSystem } from '../hooks/useFileSystem';
import { useNavigation } from '../hooks/useNavigation';
import { useClipboard } from '../hooks/useClipboard';
import type { ClipboardItem } from '../hooks/useClipboard';
import type { ContextMenuItem } from '../components/ContextMenu';
import { searchFiles, getRoots } from '../utils/fileSystem';
import { getPathName } from '../utils/fileSystem';
import {
  copyFiles,
  moveFiles,
  deleteFiles,
  renameFile,
  createFolder,
  createFile,
  openFile,
} from '../utils/fileOperations';
import { Sidebar } from './Sidebar';
import { Toolbar } from './Toolbar';
import { AddressBar } from './AddressBar';
import { SearchBox } from './SearchBox';
import { FileList } from './FileList';
import { FilePreview } from './FilePreview';
import { FileProperties } from './FileProperties';
import { ContextMenu } from './ContextMenu';

interface ContextMenuState {
  x: number;
  y: number;
  items: ContextMenuItem[];
}

export function FileManager() {
  const {
    currentPath,
    entries,
    loading,
    error,
    loadDirectory,
    navigateTo,
    navigateUp,
    refresh,
  } = useFileSystem();

  const {
    canGoBack,
    canGoForward,
    navigate: navHistory,
    goBack,
    goForward,
  } = useNavigation();

  const {
    clipboard,
    operation,
    copyFiles: clipboardCopy,
    cutFiles: clipboardCut,
    clearClipboard,
    canPaste,
  } = useClipboard();

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchResults, setSearchResults] = useState<FileEntry[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileEntry | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileEntry | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<FileEntry[]>([]);
  const [propertiesPath, setPropertiesPath] = useState<string | null>(null);
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const roots = await getRoots();
        if (roots.length > 0) {
          await loadDirectory(roots[0].path);
        }
      } catch {
        await loadDirectory('/');
      }
    }
    init();
  }, [loadDirectory]);

  const handleNavigate = useCallback(async (path: string) => {
    await navigateTo(path);
    navHistory(path);
    setSearchResults(null);
  }, [navigateTo, navHistory]);

  const handleBack = useCallback(async () => {
    const path = goBack();
    if (path) {
      await navigateTo(path);
      setSearchResults(null);
    }
  }, [goBack, navigateTo]);

  const handleForward = useCallback(async () => {
    const path = goForward();
    if (path) {
      await navigateTo(path);
      setSearchResults(null);
    }
  }, [goForward, navigateTo]);

  const handleUp = useCallback(async () => {
    await navigateUp();
    setSearchResults(null);
  }, [navigateUp]);

  const handleRefresh = useCallback(async () => {
    await refresh();
    setSearchResults(null);
  }, [refresh]);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults(null);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const results = await searchFiles(query, currentPath);
    setSearchResults(results);
    setIsSearching(false);
  }, [currentPath]);

  const handleFileSelect = useCallback((entry: FileEntry | null) => {
    if (entry && !entry.isDirectory) {
      setPreviewFile(entry);
    }
  }, []);

  // 过滤隐藏文件
  const displayEntries = (searchResults !== null ? searchResults : entries).filter(
    (entry) => {
      if (showHiddenFiles) return true;
      // 保留 '.' 和 '..'，过滤其他以 '.' 开头的文件
      if (entry.name === '.' || entry.name === '..') return true;
      return !entry.name.startsWith('.');
    }
  );

  const handleMinimize = () => window.electronAPI?.minimize();
  const handleMaximize = () => window.electronAPI?.maximize();
  const handleClose = () => window.electronAPI?.close();

  // --- 拖拽操作 ---

  const handleDropFile = useCallback(async (sourcePath: string, targetPath: string, isCopy: boolean) => {
    try {
      // 获取源文件名
      const sourceName = sourcePath.split('/').pop() || '';
      const destPath = targetPath.replace(/\/$/, '') + '/' + sourceName;

      if (isCopy) {
        await window.electronAPI?.copy(sourcePath, destPath);
      } else {
        await window.electronAPI?.move(sourcePath, destPath);
      }
      await refresh();
      setTreeRefreshKey(k => k + 1);
    } catch (err) {
      console.error('拖拽操作失败:', err);
    }
  }, [refresh]);

  // --- File operation handlers ---

  const handleCopyAction = useCallback((files: FileEntry[]) => {
    if (files.length === 0) return;
    const items: ClipboardItem[] = files.map(f => ({
      path: f.path,
      name: f.name,
      isDirectory: f.isDirectory,
    }));
    clipboardCopy(items);
  }, [clipboardCopy]);

  const handleCutAction = useCallback((files: FileEntry[]) => {
    if (files.length === 0) return;
    const items: ClipboardItem[] = files.map(f => ({
      path: f.path,
      name: f.name,
      isDirectory: f.isDirectory,
    }));
    clipboardCut(items);
  }, [clipboardCut]);

  const handleDeleteAction = useCallback(async (files: FileEntry[]) => {
    if (files.length === 0) return;
    try {
      await deleteFiles(files, true);
      setSelectedFile(null);
      setSelectedFiles([]);
      await refresh();
      setTreeRefreshKey(k => k + 1);
    } catch (err) {
      console.error('删除失败:', err);
    }
  }, [refresh]);

  const handlePasteAction = useCallback(async () => {
    if (!canPaste || operation === null) return;
    try {
      if (operation === 'copy') {
        await copyFiles(clipboard.map(c => ({ ...c, size: 0, modified: new Date() } as unknown as FileEntry)), currentPath);
      } else {
        await moveFiles(clipboard.map(c => ({ ...c, size: 0, modified: new Date() } as unknown as FileEntry)), currentPath);
      }
      clearClipboard();
      await refresh();
      setTreeRefreshKey(k => k + 1);
    } catch (err) {
      console.error('粘贴失败:', err);
    }
  }, [canPaste, operation, clipboard, currentPath, copyFiles, moveFiles, clearClipboard, refresh]);

  const handleRenameAction = useCallback(async (entry: FileEntry) => {
    const newName = window.prompt('输入新名称:', entry.name);
    if (newName && newName !== entry.name) {
      try {
        await renameFile(entry.path, newName);
        await refresh();
        setTreeRefreshKey(k => k + 1);
      } catch (err) {
        console.error('重命名失败:', err);
      }
    }
  }, [refresh]);

  const handleCreateFolder = useCallback(async () => {
    const name = window.prompt('新建文件夹名称:', '新建文件夹');
    if (name) {
      try {
        await createFolder(currentPath, name);
        await refresh();
        setTreeRefreshKey(k => k + 1);
      } catch (err) {
        console.error('新建文件夹失败:', err);
      }
    }
  }, [currentPath, refresh]);

  const handleCreateNewFile = async () => {
    const name = window.prompt('新建文件', '未命名.txt');
    if (name) {
      try {
        await createFile(currentPath, name);
        await refresh();
        setTreeRefreshKey(k => k + 1);
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  // --- Selection change handler ---

  const handleSelectionChange = useCallback((files: FileEntry[]) => {
    setSelectedFiles(files);
  }, []);

  // --- Context menu handlers ---

  // 制作副本（重复）
  const handleDuplicateAction = useCallback(async (entry: FileEntry) => {
    const dir = entry.path.substring(0, entry.path.lastIndexOf('/'));
    const ext = entry.name.includes('.') ? entry.name.substring(entry.name.lastIndexOf('.')) : '';
    const baseName = ext ? entry.name.substring(0, entry.name.lastIndexOf('.')) : entry.name;
    let newName = `${baseName} 副本${ext}`;
    let counter = 1;
    
    // 检查是否存在同名文件
    const result = await window.electronAPI?.readdir(dir);
    let existingEntries: FileEntry[] = [];
    if (result) {
      if ('entries' in result && Array.isArray(result.entries)) {
        existingEntries = result.entries;
      } else if ('data' in result && Array.isArray(result.data)) {
        existingEntries = result.data as FileEntry[];
      }
    }
    
    while (existingEntries.some?.((e: FileEntry) => e.name === newName)) {
      counter++;
      newName = `${baseName} 副本 ${counter}${ext}`;
    }
    
    const destPath = `${dir}/${newName}`;
    try {
      await window.electronAPI?.copy(entry.path, destPath);
      await refresh();
      setTreeRefreshKey(k => k + 1);
    } catch (err) {
      console.error('制作副本失败:', err);
    }
  }, [refresh]);

  const handleFileContextMenu = useCallback((e: React.MouseEvent, entry: FileEntry) => {
    e.preventDefault();
    e.stopPropagation();
    // 如果右键的文件不在已选中列表中，先选中它
    const isInSelection = selectedFiles.some(f => f.path === entry.path);
    if (!isInSelection) {
      setSelectedFiles([entry]);
    }

    // 使用同步计算的目标文件（避免 setState 异步导致的 stale state）
    const targetFiles = isInSelection && selectedFiles.length > 0 ? selectedFiles : [entry];
    
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '打开', action: () => { openFile(entry.path); }, shortcut: 'Enter' },
        { label: 'divider', action: () => {}, divider: true },
        { label: '复制', action: () => { handleCopyAction(targetFiles); }, shortcut: '\u2318C' },
        { label: '剪切', action: () => { handleCutAction(targetFiles); }, shortcut: '\u2318X' },
        { label: '制作副本', action: () => { handleDuplicateAction(entry); }, shortcut: '\u2318D' },
        { label: 'divider', action: () => {}, divider: true },
        { label: '粘贴', action: () => { handlePasteAction(); }, shortcut: '\u2318V', disabled: !canPaste },
        { label: 'divider', action: () => {}, divider: true },
        { label: '删除', action: () => { handleDeleteAction(targetFiles); }, shortcut: '\u2318Delete' },
        { label: '重命名', action: () => { handleRenameAction(entry); }, shortcut: 'F2', disabled: targetFiles.length > 1 },
        { label: '属性', action: () => { setPropertiesPath(entry.path); }, shortcut: '\u2318I' },
        { label: 'divider', action: () => {}, divider: true },
        { label: '拷贝路径', action: () => { navigator.clipboard.writeText(entry.path); } },
        { label: '在终端打开', action: () => { window.electronAPI?.openInTerminal(entry.path); } },
      ],
    });
  }, [selectedFiles, openFile, handleCopyAction, handleCutAction, handleDuplicateAction, handlePasteAction, canPaste, handleDeleteAction, handleRenameAction]);

  const handleBackgroundContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      items: [
        { label: '新建文件夹', action: () => { handleCreateFolder(); }, icon: '\uD83D\uDCC1' },
        { label: '新建文件', action: () => { handleCreateNewFile(); }, icon: '\uD83D\uDCC4' },
        { label: 'divider', action: () => {}, divider: true },
        { label: '粘贴', action: () => { handlePasteAction(); }, shortcut: '\u2318V', disabled: !canPaste },
        { label: 'divider', action: () => {}, divider: true },
        { label: showHiddenFiles ? '隐藏隐藏文件' : '显示隐藏文件', action: () => { setShowHiddenFiles(prev => !prev); } },
        { label: '刷新', action: () => { refresh(); }, shortcut: '\u2318R' },
        { label: 'divider', action: () => {}, divider: true },
        { label: '拷贝路径', action: () => { navigator.clipboard.writeText(currentPath); } },
        { label: '在终端打开', action: () => { window.electronAPI?.openInTerminal(currentPath); } },
      ],
    });
  }, [handleCreateFolder, handleCreateNewFile, handlePasteAction, canPaste, showHiddenFiles, refresh, currentPath]);

  const closeContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  // --- Keyboard shortcuts ---

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if user is typing in an input
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'c') {
          e.preventDefault();
          if (selectedFiles.length > 0) {
            handleCopyAction(selectedFiles);
          } else if (selectedFile) {
            handleCopyAction([selectedFile]);
          }
        } else if (e.key === 'x') {
          e.preventDefault();
          if (selectedFiles.length > 0) {
            handleCutAction(selectedFiles);
          } else if (selectedFile) {
            handleCutAction([selectedFile]);
          }
        } else if (e.key === 'v') {
          e.preventDefault();
          handlePasteAction();
        } else if (e.key === 'i') {
          // Ctrl/Cmd + I: 打开属性
          e.preventDefault();
          const target = selectedFiles.length > 0 ? selectedFiles[0] : selectedFile;
          if (target) {
            setPropertiesPath(target.path);
          }
        } else if (e.key === '.') {
          // Ctrl/Cmd + Shift + .: 切换隐藏文件显示
          if (e.shiftKey) {
            e.preventDefault();
            setShowHiddenFiles(prev => !prev);
          }
        }
      } else {
        if (e.key === 'Delete') {
          e.preventDefault();
          if (selectedFiles.length > 0) {
            handleDeleteAction(selectedFiles);
          } else if (selectedFile) {
            handleDeleteAction([selectedFile]);
          }
        } else if (e.key === 'F2') {
          e.preventDefault();
          const target = selectedFiles.length > 0 ? selectedFiles[0] : selectedFile;
          if (target) {
            handleRenameAction(target);
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedFile, selectedFiles, handleCopyAction, handleCutAction, handlePasteAction, handleDeleteAction, handleRenameAction]);

  // --- 拖拽调整侧边栏宽度 ---

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = Math.max(150, Math.min(500, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // --- Double click handler ---

  const handleDoubleClick = useCallback(async (entry: FileEntry) => {
    if (entry.isDirectory) {
      await handleNavigate(entry.path);
    } else {
      // 双击文件只显示预览，不直接打开（防止误操作可执行文件）
      setPreviewFile(entry);
    }
  }, [handleNavigate]);

  return (
    <div className="window">
      {/* 标题栏 - macOS 风格红绿灯按钮 */}
      <div className="window-title-bar">
        <div className="title-bar-controls">
          <button className="title-btn close" onClick={handleClose} title="关闭">
            <svg width="6" height="6" viewBox="0 0 6 6"><line x1="0" y1="0" x2="6" y2="6" stroke="#4d0000" strokeWidth="1.2"/><line x1="6" y1="0" x2="0" y2="6" stroke="#4d0000" strokeWidth="1.2"/></svg>
          </button>
          <button className="title-btn minimize" onClick={handleMinimize} title="最小化">
            <svg width="8" height="8" viewBox="0 0 8 8"><line x1="0" y1="4" x2="8" y2="4" stroke="#5a3500" strokeWidth="1.2"/></svg>
          </button>
          <button className="title-btn maximize" onClick={handleMaximize} title="最大化">
            <svg width="8" height="8" viewBox="0 0 8 8"><rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="#006500" strokeWidth="1.2"/></svg>
          </button>
        </div>
        <div className="title-bar-text">
          <span className="title-icon">📁</span>
          <span>{getPathName(currentPath)}</span>
        </div>
        <div style={{ width: 60 }} />
      </div>

      {/* 工具栏 */}
      <div className="window-toolbar">
        <Toolbar
          canGoBack={canGoBack}
          canGoForward={canGoForward}
          onBack={handleBack}
          onForward={handleForward}
          onUp={handleUp}
          onRefresh={handleRefresh}
          currentPath={currentPath}
        />
        <AddressBar currentPath={currentPath} onNavigate={handleNavigate} />
        <SearchBox onSearch={handleSearch} />
      </div>

      {/* 主体 */}
      <div className="window-body">
        <Sidebar currentPath={currentPath} onNavigate={handleNavigate} onTreeContextMenu={handleFileContextMenu} onDropFile={handleDropFile} treeRefreshKey={treeRefreshKey} style={{ width: sidebarWidth }} />
        <div
          className="sidebar-resizer"
          onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        />
        <div className="main-content">
          {isSearching ? (
            <div className="file-list-container">
              <div className="file-list-status">
                <div className="loading-indicator">
                  <span className="loading-text">正在搜索...</span>
                </div>
              </div>
            </div>
          ) : (
            <FileList
              entries={displayEntries}
              loading={loading}
              error={error}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
              onNavigate={handleNavigate}
              onFileSelect={(entry) => {
                setSelectedFile(entry);
                handleFileSelect(entry);
              }}
              onDoubleClick={handleDoubleClick}
              onSelectionChange={handleSelectionChange}
              onFileContextMenu={handleFileContextMenu}
              onBackgroundContextMenu={handleBackgroundContextMenu}
              onDropFile={handleDropFile}
            />
          )}
        </div>
      </div>

      {/* 状态栏 */}
      <div className="window-status-bar">
        <span className="status-text">
          {searchResults !== null
            ? `找到 ${searchResults.length} 个结果`
            : `${entries.length} 个项目`}
        </span>
        <span className="status-text">{currentPath}</span>
      </div>

      {/* 文件预览 */}
      {previewFile && (
        <FilePreview
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      {/* 文件属性弹窗 */}
      {propertiesPath && (
        <FileProperties filePath={propertiesPath} onClose={() => setPropertiesPath(null)} />
      )}

      {/* 右键菜单 */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={contextMenu.items}
          onClose={closeContextMenu}
        />
      )}
    </div>
  );
}
