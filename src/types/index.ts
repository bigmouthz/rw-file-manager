// 文件/文件夹信息
export interface FileEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  modified: Date;
  extension?: string;
}

// 文件系统状态
export interface FileSystemState {
  currentPath: string;
  entries: FileEntry[];
  loading: boolean;
  error: string | null;
}

// 导航历史
export interface NavigationHistory {
  history: string[];
  currentIndex: number;
}

// 视图模式
export type ViewMode = 'list' | 'icons';

// 侧边栏项目
export interface SidebarItem {
  label: string;
  path: string;
  icon: string;
}
