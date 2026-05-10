import type { FileEntry } from '../types';

/**
 * 判断是否在 Electron 环境中运行
 */
function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

/**
 * 获取系统根目录/卷列表
 */
export async function getRoots(): Promise<FileEntry[]> {
  if (isElectron()) {
    const result = await window.electronAPI!.getRoots();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || '获取根目录失败');
  }

  // 浏览器环境：返回模拟根目录
  return [
    { name: '此电脑', path: '/', isDirectory: true, size: 0, modified: new Date() },
  ];
}

/**
 * 获取指定路径下的文件列表
 */
export async function getDirectoryContents(path: string): Promise<FileEntry[]> {
  if (isElectron()) {
    const result = await window.electronAPI!.readdir(path);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || '读取目录失败');
  }

  // 浏览器环境：使用模拟数据
  const mockData = getMockFileSystem();
  const entries = mockData[path];
  if (!entries) {
    throw new Error(`路径不存在: ${path}`);
  }

  return [...entries].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1;
    }
    return a.name.localeCompare(b.name, 'zh-CN');
  });
}

/**
 * 获取父目录路径
 */
export function getParentPath(path: string): string {
  if (path === '/' || path === '') return '/';
  const normalized = path.replace(/\/$/, '');
  const parent = normalized.substring(0, normalized.lastIndexOf('/'));
  return parent || '/';
}

/**
 * 获取路径的最后一段名称
 */
export function getPathName(path: string): string {
  if (path === '/' || path === '') return '此电脑';
  const normalized = path.replace(/\/$/, '');
  return normalized.split('/').pop() || '此电脑';
}

/**
 * 检查路径是否存在
 */
export async function pathExists(path: string): Promise<boolean> {
  if (isElectron()) {
    const result = await window.electronAPI!.stat(path);
    return result.success;
  }
  return path in getMockFileSystem();
}

/**
 * 搜索文件
 */
export async function searchFiles(query: string, rootPath: string): Promise<FileEntry[]> {
  if (!query.trim()) return [];

  if (isElectron()) {
    const result = await window.electronAPI!.search(query, rootPath);
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  }

  // 浏览器环境：模拟搜索
  const lowerQuery = query.toLowerCase();
  const results: FileEntry[] = [];
  const visited = new Set<string>();
  const mockData = getMockFileSystem();

  async function searchRecursive(path: string) {
    if (visited.has(path)) return;
    visited.add(path);

    const entries = mockData[path];
    if (!entries) return;

    for (const entry of entries) {
      if (entry.name.toLowerCase().includes(lowerQuery)) {
        results.push(entry);
      }
      if (entry.isDirectory) {
        await searchRecursive(entry.path);
      }
    }
  }

  await searchRecursive(rootPath);
  return results;
}

/**
 * 读取文件内容（文本文件预览）
 */
export async function readFileContent(filePath: string): Promise<string> {
  if (isElectron()) {
    const result = await window.electronAPI!.readFile(filePath);
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.error || '读取文件失败');
  }
  throw new Error('浏览器环境不支持文件内容读取');
}

// ============================================
// 浏览器环境模拟数据
// ============================================

function getMockFileSystem(): Record<string, FileEntry[]> {
  return {
    '/': [
      { name: '用户文档', path: '/用户文档', isDirectory: true, size: 0, modified: new Date('2026-05-01') },
      { name: '项目源码', path: '/项目源码', isDirectory: true, size: 0, modified: new Date('2026-05-08') },
      { name: '图片素材', path: '/图片素材', isDirectory: true, size: 0, modified: new Date('2026-04-20') },
      { name: '下载文件', path: '/下载文件', isDirectory: true, size: 0, modified: new Date('2026-05-09') },
      { name: '系统工具', path: '/系统工具', isDirectory: true, size: 0, modified: new Date('2026-03-15') },
      { name: 'readme.txt', path: '/readme.txt', isDirectory: false, size: 2048, modified: new Date('2026-01-01') },
      { name: '笔记.md', path: '/笔记.md', isDirectory: false, size: 15360, modified: new Date('2026-05-05') },
      { name: 'config.json', path: '/config.json', isDirectory: false, size: 4096, modified: new Date('2026-04-10') },
    ],
    '/用户文档': [
      { name: '工作报告', path: '/用户文档/工作报告', isDirectory: true, size: 0, modified: new Date('2026-05-09') },
      { name: '学习笔记', path: '/用户文档/学习笔记', isDirectory: true, size: 0, modified: new Date('2026-05-03') },
      { name: '个人简历', path: '/用户文档/个人简历', isDirectory: true, size: 0, modified: new Date('2026-04-28') },
      { name: '项目计划书.docx', path: '/用户文档/项目计划书.docx', isDirectory: false, size: 245760, modified: new Date('2026-05-08') },
      { name: '会议纪要.docx', path: '/用户文档/会议纪要.docx', isDirectory: false, size: 184320, modified: new Date('2026-05-06') },
      { name: '年度总结.pptx', path: '/用户文档/年度总结.pptx', isDirectory: false, size: 5242880, modified: new Date('2026-04-30') },
      { name: '预算表.xlsx', path: '/用户文档/预算表.xlsx', isDirectory: false, size: 98304, modified: new Date('2026-04-25') },
      { name: '通讯录.xlsx', path: '/用户文档/通讯录.xlsx', isDirectory: false, size: 65536, modified: new Date('2026-03-20') },
      { name: '需求文档.pdf', path: '/用户文档/需求文档.pdf', isDirectory: false, size: 1048576, modified: new Date('2026-05-01') },
      { name: '合同模板.pdf', path: '/用户文档/合同模板.pdf', isDirectory: false, size: 524288, modified: new Date('2026-02-15') },
      { name: 'README.md', path: '/用户文档/README.md', isDirectory: false, size: 3072, modified: new Date('2026-05-09') },
      { name: '待办事项.txt', path: '/用户文档/待办事项.txt', isDirectory: false, size: 1024, modified: new Date('2026-05-10') },
    ],
    '/用户文档/工作报告': [
      { name: 'Q1季度报告.docx', path: '/用户文档/工作报告/Q1季度报告.docx', isDirectory: false, size: 524288, modified: new Date('2026-04-05') },
      { name: 'Q2季度计划.docx', path: '/用户文档/工作报告/Q2季度计划.docx', isDirectory: false, size: 458752, modified: new Date('2026-04-10') },
      { name: '月度总结-4月.docx', path: '/用户文档/工作报告/月度总结-4月.docx', isDirectory: false, size: 262144, modified: new Date('2026-05-01') },
      { name: '周报汇总.xlsx', path: '/用户文档/工作报告/周报汇总.xlsx', isDirectory: false, size: 196608, modified: new Date('2026-05-08') },
      { name: '项目进度.pptx', path: '/用户文档/工作报告/项目进度.pptx', isDirectory: false, size: 3145728, modified: new Date('2026-05-07') },
      { name: '数据统计.csv', path: '/用户文档/工作报告/数据统计.csv', isDirectory: false, size: 81920, modified: new Date('2026-05-06') },
    ],
    '/用户文档/学习笔记': [
      { name: 'React学习笔记.md', path: '/用户文档/学习笔记/React学习笔记.md', isDirectory: false, size: 15360, modified: new Date('2026-05-03') },
      { name: 'TypeScript高级用法.md', path: '/用户文档/学习笔记/TypeScript高级用法.md', isDirectory: false, size: 12288, modified: new Date('2026-04-28') },
      { name: 'Node.js入门.md', path: '/用户文档/学习笔记/Node.js入门.md', isDirectory: false, size: 8192, modified: new Date('2026-04-20') },
      { name: '设计模式总结.md', path: '/用户文档/学习笔记/设计模式总结.md', isDirectory: false, size: 20480, modified: new Date('2026-04-15') },
      { name: '算法笔记.md', path: '/用户文档/学习笔记/算法笔记.md', isDirectory: false, size: 25600, modified: new Date('2026-04-10') },
      { name: 'Linux命令速查.md', path: '/用户文档/学习笔记/Linux命令速查.md', isDirectory: false, size: 6144, modified: new Date('2026-03-25') },
    ],
    '/用户文档/个人简历': [
      { name: '简历-中文版.docx', path: '/用户文档/个人简历/简历-中文版.docx', isDirectory: false, size: 196608, modified: new Date('2026-04-28') },
      { name: '简历-英文版.docx', path: '/用户文档/个人简历/简历-英文版.docx', isDirectory: false, size: 204800, modified: new Date('2026-04-28') },
      { name: '作品集.pdf', path: '/用户文档/个人简历/作品集.pdf', isDirectory: false, size: 5242880, modified: new Date('2026-04-25') },
      { name: '证书扫描件', path: '/用户文档/个人简历/证书扫描件', isDirectory: true, size: 0, modified: new Date('2026-04-20') },
    ],
    '/用户文档/个人简历/证书扫描件': [
      { name: '学位证书.jpg', path: '/用户文档/个人简历/证书扫描件/学位证书.jpg', isDirectory: false, size: 2097152, modified: new Date('2026-04-20') },
      { name: '英语六级证书.jpg', path: '/用户文档/个人简历/证书扫描件/英语六级证书.jpg', isDirectory: false, size: 1572864, modified: new Date('2026-04-20') },
      { name: '专业资格证书.pdf', path: '/用户文档/个人简历/证书扫描件/专业资格证书.pdf', isDirectory: false, size: 1048576, modified: new Date('2026-04-20') },
    ],
    '/项目源码': [
      { name: 'frontend-app', path: '/项目源码/frontend-app', isDirectory: true, size: 0, modified: new Date('2026-05-08') },
      { name: 'backend-api', path: '/项目源码/backend-api', isDirectory: true, size: 0, modified: new Date('2026-05-07') },
      { name: 'mobile-app', path: '/项目源码/mobile-app', isDirectory: true, size: 0, modified: new Date('2026-05-05') },
      { name: 'package.json', path: '/项目源码/package.json', isDirectory: false, size: 2048, modified: new Date('2026-05-08') },
      { name: 'tsconfig.json', path: '/项目源码/tsconfig.json', isDirectory: false, size: 1024, modified: new Date('2026-05-08') },
      { name: '.gitignore', path: '/项目源码/.gitignore', isDirectory: false, size: 512, modified: new Date('2026-05-01') },
      { name: 'Dockerfile', path: '/项目源码/Dockerfile', isDirectory: false, size: 768, modified: new Date('2026-04-20') },
      { name: 'docker-compose.yml', path: '/项目源码/docker-compose.yml', isDirectory: false, size: 1536, modified: new Date('2026-04-20') },
      { name: 'README.md', path: '/项目源码/README.md', isDirectory: false, size: 4096, modified: new Date('2026-05-08') },
    ],
    '/项目源码/frontend-app': [
      { name: 'src', path: '/项目源码/frontend-app/src', isDirectory: true, size: 0, modified: new Date('2026-05-08') },
      { name: 'public', path: '/项目源码/frontend-app/public', isDirectory: true, size: 0, modified: new Date('2026-05-08') },
      { name: 'package.json', path: '/项目源码/frontend-app/package.json', isDirectory: false, size: 1536, modified: new Date('2026-05-08') },
      { name: 'vite.config.ts', path: '/项目源码/frontend-app/vite.config.ts', isDirectory: false, size: 512, modified: new Date('2026-05-08') },
      { name: 'index.html', path: '/项目源码/frontend-app/index.html', isDirectory: false, size: 768, modified: new Date('2026-05-08') },
      { name: 'tsconfig.json', path: '/项目源码/frontend-app/tsconfig.json', isDirectory: false, size: 1024, modified: new Date('2026-05-08') },
      { name: '.eslintrc.cjs', path: '/项目源码/frontend-app/.eslintrc.cjs', isDirectory: false, size: 256, modified: new Date('2026-05-08') },
    ],
    '/图片素材': [
      { name: '壁纸', path: '/图片素材/壁纸', isDirectory: true, size: 0, modified: new Date('2026-04-20') },
      { name: '截图', path: '/图片素材/截图', isDirectory: true, size: 0, modified: new Date('2026-05-09') },
      { name: '设计素材', path: '/图片素材/设计素材', isDirectory: true, size: 0, modified: new Date('2026-04-15') },
      { name: 'logo.png', path: '/图片素材/logo.png', isDirectory: false, size: 65536, modified: new Date('2026-04-10') },
      { name: 'banner.jpg', path: '/图片素材/banner.jpg', isDirectory: false, size: 524288, modified: new Date('2026-04-05') },
      { name: 'icon.svg', path: '/图片素材/icon.svg', isDirectory: false, size: 8192, modified: new Date('2026-03-20') },
      { name: 'background.webp', path: '/图片素材/background.webp', isDirectory: false, size: 262144, modified: new Date('2026-03-15') },
    ],
    '/下载文件': [
      { name: '软件安装包', path: '/下载文件/软件安装包', isDirectory: true, size: 0, modified: new Date('2026-05-09') },
      { name: '电子书', path: '/下载文件/电子书', isDirectory: true, size: 0, modified: new Date('2026-05-05') },
      { name: 'node-v20.11.0.pkg', path: '/下载文件/node-v20.11.0.pkg', isDirectory: false, size: 52428800, modified: new Date('2026-05-09') },
      { name: 'VSCode-darwin.zip', path: '/下载文件/VSCode-darwin.zip', isDirectory: false, size: 157286400, modified: new Date('2026-05-08') },
      { name: 'Docker.dmg', path: '/下载文件/Docker.dmg', isDirectory: false, size: 734003200, modified: new Date('2026-05-07') },
      { name: 'python-3.12.2-amd64.exe', path: '/下载文件/python-3.12.2-amd64.exe', isDirectory: false, size: 31457280, modified: new Date('2026-05-06') },
      { name: 'ubuntu-24.04-desktop.iso', path: '/下载文件/ubuntu-24.04-desktop.iso', isDirectory: false, size: 4831838208, modified: new Date('2026-05-05') },
      { name: '资料.zip', path: '/下载文件/资料.zip', isDirectory: false, size: 104857600, modified: new Date('2026-05-04') },
    ],
    '/系统工具': [
      { name: '计算器.exe', path: '/系统工具/计算器.exe', isDirectory: false, size: 524288, modified: new Date('2026-03-15') },
      { name: '记事本.exe', path: '/系统工具/记事本.exe', isDirectory: false, size: 262144, modified: new Date('2026-03-15') },
      { name: '任务管理器.exe', path: '/系统工具/任务管理器.exe', isDirectory: false, size: 1048576, modified: new Date('2026-03-15') },
      { name: '注册表编辑器.exe', path: '/系统工具/注册表编辑器.exe', isDirectory: false, size: 786432, modified: new Date('2026-03-15') },
      { name: '命令提示符.exe', path: '/系统工具/命令提示符.exe', isDirectory: false, size: 393216, modified: new Date('2026-03-15') },
      { name: '磁盘清理.exe', path: '/系统工具/磁盘清理.exe', isDirectory: false, size: 655360, modified: new Date('2026-03-15') },
    ],
  };
}
