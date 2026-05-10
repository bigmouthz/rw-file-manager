import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CSSProperties } from 'react';
import type { FileEntry } from '../types';
import { getRoots } from '../utils/fileSystem';
import { DirectoryTree } from './DirectoryTree';

interface SidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onTreeContextMenu?: (e: React.MouseEvent, entry: FileEntry) => void;
  onDropFile?: (sourcePath: string, targetPath: string, isCopy: boolean) => void;
  treeRefreshKey?: number;
  style?: CSSProperties;
}

export function Sidebar({ currentPath, onNavigate, onTreeContextMenu, onDropFile, treeRefreshKey, style }: SidebarProps) {
  const [roots, setRoots] = useState<FileEntry[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

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
