import type { FileEntry } from '../types';

function isElectron(): boolean {
  return typeof window !== 'undefined' && window.electronAPI !== undefined;
}

export async function copyFiles(
  items: FileEntry[],
  destDir: string,
): Promise<void> {
  if (!isElectron()) return;

  for (const item of items) {
    const dest = destDir.replace(/\/$/, '') + '/' + item.name;
    const result = await window.electronAPI!.copy(item.path, dest);
    if (!result.success) {
      throw new Error(result.error || `复制失败: ${item.name}`);
    }
  }
}

export async function moveFiles(
  items: FileEntry[],
  destDir: string,
): Promise<void> {
  if (!isElectron()) return;

  for (const item of items) {
    const dest = destDir.replace(/\/$/, '') + '/' + item.name;
    const result = await window.electronAPI!.move(item.path, dest);
    if (!result.success) {
      throw new Error(result.error || `移动失败: ${item.name}`);
    }
  }
}

export async function deleteFiles(
  items: FileEntry[],
  moveToTrash: boolean = true,
): Promise<void> {
  if (!isElectron()) return;

  for (const item of items) {
    const result = await window.electronAPI!.delete(item.path, moveToTrash);
    if (!result.success) {
      throw new Error(result.error || `删除失败: ${item.name}`);
    }
  }
}

export async function renameFile(
  filePath: string,
  newName: string,
): Promise<string> {
  if (!isElectron()) return filePath;

  const result = await window.electronAPI!.rename(filePath, newName);
  if (!result.success) {
    throw new Error(result.error || '重命名失败');
  }
  return result.data ?? filePath;
}

export async function createFolder(
  dirPath: string,
  name: string,
): Promise<string> {
  if (!isElectron()) return dirPath.replace(/\/$/, '') + '/' + name;

  const result = await window.electronAPI!.mkdir(dirPath, name);
  if (!result.success) {
    throw new Error(result.error || '新建文件夹失败');
  }
  return result.data ?? dirPath.replace(/\/$/, '') + '/' + name;
}

export async function openFile(filePath: string): Promise<void> {
  if (!isElectron()) return;

  const result = await window.electronAPI!.open(filePath);
  if (!result.success) {
    throw new Error(result.error || '打开文件失败');
  }
}

export async function createFile(
  dirPath: string,
  name: string,
): Promise<string> {
  if (!isElectron()) return dirPath.replace(/\/$/, '') + '/' + name;
  const result = await window.electronAPI!.createFile(dirPath, name);
  if (!result.success) {
    throw new Error(result.error || '新建文件失败');
  }
  return result.data ?? dirPath.replace(/\/$/, '') + '/' + name;
}

export async function getFileProperties(
  filePath: string,
): Promise<FileProperties> {
  if (!isElectron()) {
    return {
      name: filePath.split('/').pop() || filePath,
      path: filePath,
      isDirectory: false,
      size: 0,
      childCount: 0,
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
      accessedAt: new Date().toISOString(),
      isReadOnly: false,
      isHidden: filePath.split('/').pop()?.startsWith('.') || false,
    };
  }
  const result = await window.electronAPI!.getFileProperties(filePath);
  if (!result.success || !result.data) {
    throw new Error(result.error || '获取文件属性失败');
  }
  return result.data;
}
