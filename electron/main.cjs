const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: '文件资源管理器',
    icon: path.join(__dirname, '../public/favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false, // 无边框窗口，使用自定义标题栏
    backgroundColor: '#008080',
  });

  // 开发模式加载 Vite 开发服务器
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    // 生产模式加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // 禁用系统默认右键菜单，使用自定义右键菜单
  mainWindow.webContents.on('context-menu', (event) => {
    event.preventDefault();
  });
}

// ============================================
// IPC 处理 - 文件系统操作
// ============================================

/**
 * 读取目录内容
 */
ipcMain.handle('fs:readdir', async (event, dirPath) => {
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const result = entries
      .map(entry => {
        const fullPath = path.join(dirPath, entry.name);
        let stats;
        try {
          stats = fs.statSync(fullPath);
        } catch {
          stats = { size: 0, mtime: new Date(), isDirectory: () => entry.isDirectory() };
        }
        return {
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stats.size || 0,
          modified: stats.mtime || new Date(),
        };
      });

    // 排序：文件夹在前，文件在后，按名称排序
    result.sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) {
        return a.isDirectory ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 获取文件/文件夹信息
 */
ipcMain.handle('fs:stat', async (event, filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      success: true,
      data: {
        name: path.basename(filePath),
        path: filePath,
        isDirectory: stats.isDirectory(),
        size: stats.size,
        modified: stats.mtime,
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 读取文件内容（文本文件预览）
 */
ipcMain.handle('fs:readFile', async (event, filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, data: content };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 获取系统根目录/卷列表
 */
ipcMain.handle('fs:getRoots', async () => {
  if (process.platform === 'win32') {
    // Windows: 返回所有驱动器
    const drives = [];
    for (let i = 65; i <= 90; i++) {
      const drive = String.fromCharCode(i) + ':\\';
      try {
        fs.accessSync(drive);
        drives.push({
          name: `${String.fromCharCode(i)}:`,
          path: drive,
          isDirectory: true,
          size: 0,
          modified: new Date(),
        });
      } catch {}
    }
    return { success: true, data: drives };
  } else {
    // macOS/Linux: 返回 /
    return {
      success: true,
      data: [
        { name: '/ (根目录)', path: '/', isDirectory: true, size: 0, modified: new Date() },
        { name: 'Home', path: require('os').homedir(), isDirectory: true, size: 0, modified: new Date() },
      ],
    };
  }
});

/**
 * 搜索文件
 */
ipcMain.handle('fs:search', async (event, { query, rootPath }) => {
  const results = [];
  const maxResults = 200;

  function searchDir(dirPath) {
    if (results.length >= maxResults) return;
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const entry of entries) {
        if (results.length >= maxResults) return;
        if (entry.name.startsWith('.')) continue;

        const fullPath = path.join(dirPath, entry.name);
        if (entry.name.toLowerCase().includes(query.toLowerCase())) {
          try {
            const stats = fs.statSync(fullPath);
            results.push({
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              size: stats.size,
              modified: stats.mtime,
            });
          } catch {}
        }

        if (entry.isDirectory()) {
          searchDir(fullPath);
        }
      }
    } catch {}
  }

  searchDir(rootPath);
  return { success: true, data: results };
});

// ============================================
// 窗口控制 IPC
// ============================================

ipcMain.on('window:minimize', () => {
  mainWindow?.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow?.maximize();
  }
});

ipcMain.on('window:close', () => {
  mainWindow?.close();
});

// ============================================
// IPC 处理 - 文件操作（复制/剪切/粘贴/删除/重命名/打开）
// ============================================

/**
 * 复制文件或文件夹
 */
ipcMain.handle('fs:copy', async (event, { src, dest }) => {
  try {
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
      copyDirSync(src, dest);
    } else {
      fs.copyFileSync(src, dest);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 移动文件或文件夹
 */
ipcMain.handle('fs:move', async (event, { src, dest }) => {
  try {
    fs.renameSync(src, dest);
    return { success: true };
  } catch (error) {
    // 跨卷移动时 rename 会失败，尝试 copy + delete
    try {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        copyDirSync(src, dest);
        fs.rmSync(src, { recursive: true, force: true });
      } else {
        fs.copyFileSync(src, dest);
        fs.unlinkSync(src);
      }
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }
});

/**
 * 删除文件或文件夹
 */
ipcMain.handle('fs:delete', async (event, { targetPath, moveToTrash }) => {
  try {
    if (moveToTrash && shell) {
      await shell.trashItem(targetPath);
    } else {
      const stat = fs.statSync(targetPath);
      if (stat.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(targetPath);
      }
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 重命名文件或文件夹
 */
ipcMain.handle('fs:rename', async (event, { targetPath, newName }) => {
  try {
    const dir = path.dirname(targetPath);
    const newPath = path.join(dir, newName);
    fs.renameSync(targetPath, newPath);
    return { success: true, data: newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 创建新文件夹
 */
ipcMain.handle('fs:mkdir', async (event, { dirPath, name }) => {
  try {
    const newPath = path.join(dirPath, name);
    fs.mkdirSync(newPath, { recursive: true });
    return { success: true, data: newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 用系统默认程序打开文件/文件夹
 */
ipcMain.handle('fs:open', async (event, { targetPath }) => {
  try {
    const stat = fs.statSync(targetPath);
    if (stat.isDirectory()) {
      shell.openPath(targetPath);
    } else {
      await shell.openPath(targetPath);
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 在终端中打开目录
 */
ipcMain.handle('fs:openInTerminal', async (event, { targetPath }) => {
  try {
    const stat = fs.statSync(targetPath);
    const dir = stat.isDirectory() ? targetPath : path.dirname(targetPath);
    // macOS: 打开 Terminal 并激活到最前
    const { exec } = require('child_process');
    exec(`osascript -e 'tell application "Terminal" to activate' -e 'tell application "Terminal" to do script "cd \\"${dir}\\" && clear"'`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 创建空文件
 */
ipcMain.handle('fs:createFile', async (event, { dirPath, name }) => {
  try {
    const newPath = path.join(dirPath, name);
    fs.writeFileSync(newPath, '');
    return { success: true, data: newPath };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 获取文件详细属性
 */
ipcMain.handle('fs:getFileProperties', async (event, { targetPath }) => {
  try {
    const stat = fs.statSync(targetPath);
    const isDir = stat.isDirectory();
    let childCount = 0;
    let totalSize = 0;
    if (isDir) {
      try {
        const children = fs.readdirSync(targetPath);
        childCount = children.length;
      } catch (e) { /* ignore permission errors */ }
    }
    return {
      success: true,
      data: {
        name: path.basename(targetPath),
        path: targetPath,
        isDirectory: isDir,
        size: isDir ? 0 : stat.size,
        childCount: childCount,
        createdAt: stat.birthtime.toISOString(),
        modifiedAt: stat.mtime.toISOString(),
        accessedAt: stat.atime.toISOString(),
        isReadOnly: !(stat.mode & 0o200),
        isHidden: path.basename(targetPath).startsWith('.'),
      },
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

/**
 * 递归复制文件夹
 */
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ============================================
// 应用生命周期
// ============================================

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
