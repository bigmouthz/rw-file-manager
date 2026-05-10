const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // 文件系统只读操作
  readdir: (dirPath) => ipcRenderer.invoke('fs:readdir', dirPath),
  stat: (filePath) => ipcRenderer.invoke('fs:stat', filePath),
  readFile: (filePath) => ipcRenderer.invoke('fs:readFile', filePath),
  getRoots: () => ipcRenderer.invoke('fs:getRoots'),
  search: (query, rootPath) => ipcRenderer.invoke('fs:search', { query, rootPath }),

  // 文件操作
  copy: (src, dest) => ipcRenderer.invoke('fs:copy', { src, dest }),
  move: (src, dest) => ipcRenderer.invoke('fs:move', { src, dest }),
  delete: (targetPath, moveToTrash) => ipcRenderer.invoke('fs:delete', { targetPath, moveToTrash }),
  rename: (targetPath, newName) => ipcRenderer.invoke('fs:rename', { targetPath, newName }),
  mkdir: (dirPath, name) => ipcRenderer.invoke('fs:mkdir', { dirPath, name }),
  createFile: (dirPath, name) => ipcRenderer.invoke('fs:createFile', { dirPath, name }),
  getFileProperties: (targetPath) => ipcRenderer.invoke('fs:getFileProperties', { targetPath }),
  open: (targetPath) => ipcRenderer.invoke('fs:open', { targetPath }),
  openInTerminal: (targetPath) => ipcRenderer.invoke('fs:openInTerminal', { targetPath }),

  // 窗口控制
  minimize: () => ipcRenderer.send('window:minimize'),
  maximize: () => ipcRenderer.send('window:maximize'),
  close: () => ipcRenderer.send('window:close'),
});
