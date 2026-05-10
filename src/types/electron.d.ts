// Electron API 类型声明
interface FileProperties {
  name: string;
  path: string;
  isDirectory: boolean;
  size: number;
  childCount: number;
  createdAt: string;
  modifiedAt: string;
  accessedAt: string;
  isReadOnly: boolean;
  isHidden: boolean;
}

interface ElectronAPI {
  // 只读操作
  readdir(dirPath: string): Promise<{ success: boolean; data?: FileEntry[]; error?: string }>;
  stat(filePath: string): Promise<{ success: boolean; data?: FileEntry; error?: string }>;
  readFile(filePath: string): Promise<{ success: boolean; data?: string; error?: string }>;
  getRoots(): Promise<{ success: boolean; data?: FileEntry[]; error?: string }>;
  search(query: string, rootPath: string): Promise<{ success: boolean; data?: FileEntry[]; error?: string }>;

  // 文件操作
  copy(src: string, dest: string): Promise<{ success: boolean; error?: string }>;
  move(src: string, dest: string): Promise<{ success: boolean; error?: string }>;
  delete(targetPath: string, moveToTrash?: boolean): Promise<{ success: boolean; error?: string }>;
  rename(targetPath: string, newName: string): Promise<{ success: boolean; data?: string; error?: string }>;
  mkdir(dirPath: string, name: string): Promise<{ success: boolean; data?: string; error?: string }>;
  createFile(dirPath: string, name: string): Promise<{ success: boolean; data?: string; error?: string }>;
  getFileProperties(targetPath: string): Promise<{ success: boolean; data?: FileProperties; error?: string }>;
  open(targetPath: string): Promise<{ success: boolean; error?: string }>;
  openInTerminal(targetPath: string): Promise<{ success: boolean; error?: string }>;

  // 窗口控制
  minimize(): void;
  maximize(): void;
  close(): void;
}

interface Window {
  electronAPI?: ElectronAPI;
}
