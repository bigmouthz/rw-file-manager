import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { FileEntry } from '../types';
import { getRoots } from '../utils/fileSystem';
import { DirectoryTree } from './DirectoryTree';

interface Bookmark {
  path: string;
  name: string;
}

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onTreeContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void;
  onDropFile?: (sourcePath: string, targetPath: string, isCopy: boolean) => void;
  treeRefreshKey?: number;
  style?: CSSProperties;
}

const STORAGE_KEY = 'filemanager-favorites';

export function Sidebar({ currentPath, onNavigate, onTreeContextMenu, onDropFile, treeRefreshKey, style }: SidebarProps) {
  const [roots, setRoots] = useState<FileEntry[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Bookmark[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(true);

  // 从 localStorage 加载收藏
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setFavorites(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  // 保存收藏到 localStorage
  const saveFavorites = useCallback((newFavorites: Bookmark[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
    } catch (err) {
      console.error('Failed to save favorites:', err);
    }
  }, []);

  // 加载根目录
  useEffect(() => {
    async function loadRoots() {
      setLoading(true);
      try {
        const rootEntries = await getRoots();
        setRoots(rootEntries);
        // 默认展开第一个根目录
        if (rootEntries.length > 0) {
          setExpandedPaths(new Set([rootEntries[0].path]));
        }
      } catch {
        setRoots([]);
      }
      setLoading(false);
    }
    loadRoots();
  }, []);

  // 切换展开/折叠
  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // 添加收藏
  const addFavorite = useCallback((path: string, name: string) => {
    setFavorites(prev => {
      // 检查是否已存在
      if (prev.some(f => f.path === path)) {
        return prev;
      }
      const newFavorites = [...prev, { path, name }];
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // 移除收藏
  const removeFavorite = useCallback((path: string) => {
    setFavorites(prev => {
      const newFavorites = prev.filter(f => f.path !== path);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, [saveFavorites]);

  // 处理拖拽放下
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    
    const sourcePath = e.dataTransfer.getData('text/plain');
    if (!sourcePath) return;
    
    // 获取文件夹名称（从路径提取）
    const name = sourcePath.split('/').filter(Boolean).pop() || sourcePath;
    addFavorite(sourcePath, name);
  }, [addFavorite]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  // 从 roots 中查找 home 路径
  const homePath = useMemo(() => {
    const homeRoot = roots.find(
      r => r.name === 'Home' || r.name === '主目录' || r.path.startsWith('/Users/')
    );
    return homeRoot?.path || '';
  }, [roots]);

  // 快速访问列表
  const quickAccess = useMemo(() => {
    if (!homePath) return [];
    return [
      { name: '主目录', path: homePath, icon: '🏠' },
      { name: '桌面', path: `${homePath}/Desktop`, icon: '🖥️' },
      { name: '文档', path: `${homePath}/Documents`, icon: '📄' },
      { name: '下载', path: `${homePath}/Downloads`, icon: '⬇️' },
      { name: '图片', path: `${homePath}/Pictures`, icon: '🖼️' },
    ];
  }, [homePath]);

  return (
    <div className="sidebar" style={style}>
      {quickAccess.length > 0 && (
        <div className="quick-access">
          <div className="sidebar-title">快速访问</div>
          {quickAccess.map(item => (
            <div
              key={item.path}
              className={`quick-access-item ${currentPath === item.path ? 'selected' : ''}`}
              onClick={() => onNavigate(item.path)}
            >
              <span className="quick-access-icon">{item.icon}</span>
              <span className="quick-access-name">{item.name}</span>
            </div>
          ))}
        </div>
      )}
      
      {/* 个人收藏 */}
      <div className="favorites">
        <div className="sidebar-title">个人收藏</div>
        <div
          className={`favorites-drop-area ${dragOver ? 'drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          {favorites.length === 0 ? (
            <div className="favorites-empty">拖拽目录到这里添加收藏</div>
          ) : (
            favorites.map(item => (
              <div
                key={item.path}
                className={`favorite-item ${currentPath === item.path ? 'selected' : ''}`}
                onClick={() => onNavigate(item.path)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm(`移除收藏 "${item.name}"?`)) {
                    removeFavorite(item.path);
                  }
                }}
              >
                <span className="favorite-icon">⭐</span>
                <span className="favorite-name">{item.name}</span>
                <span className="favorite-remove" title="右键点击移除">✕</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="sidebar-title">目录树</div>
      <div className="sidebar-tree">
        {loading ? (
          <div className="tree-loading-root">正在加载...</div>
        ) : (
          roots.map(root => (
            <DirectoryTree
              key={root.path}
              entry={root}
              currentPath={currentPath}
              depth={0}
              onNavigate={onNavigate}
              expandedPaths={expandedPaths}
              onToggleExpand={handleToggleExpand}
              onContextMenu={onTreeContextMenu}
              onDropFile={onDropFile}
              refreshKey={treeRefreshKey}
            />
          ))
        )}
      </div>
    </div>
  );
}
