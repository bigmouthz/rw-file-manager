# 📁 Modern File Manager

A beautiful desktop file manager built with Electron + React + TypeScript, inspired by Windows File Explorer but with a modern macOS design.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS-lightgray.svg)

## ✨ Features

- 📁 **Full featured file management** - browse, copy, cut, paste, delete, rename, duplicate
- 🌳 **Directory tree navigation** - collapsible sidebar with quick access
- 🎨 **Dual view modes** - list view & icon view
- 🔍 **Search files** - instant search by filename
- ✊ **Drag & drop** - move/copy files by dragging
- 📏 **Resizable sidebar** - drag to adjust sidebar width
- 📊 **Status bar** - always fixed at bottom showing item count and current path
- 🎯 **Right-click context menu** - full functionality everywhere
- 🛡️ **Safe executable handling** - double-click to preview, open via right-click to prevent accidental execution
- 📋 **Copy path to clipboard** - one-click copy file path
- 🧭 **Open in Terminal** - quickly open terminal at current directory
- 👥 **Multi-selection** - select multiple files for batch operations

## 🚀 Quick Install (macOS)

### One-click install
```bash
curl -fsSL https://raw.githubusercontent.com/river-wit/rw-file-manager/main/install.sh | bash
```

Or manually:

1. Download the latest release from [Releases](https://github.com/river-wit/rw-file-manager/releases)
2. Drag `RW File Manager.app` to your Applications folder
3. Open it!

## 🔨 Build from source

### Prerequisites
- Node.js 18+
- npm or yarn

### Steps
```bash
# Clone the repository
git clone https://github.com/bigmouthz/rw-file-manager.git
cd rw-file-manager

# Install dependencies
npm install

# Build
npm run build

# Package into macOS app
npm run package
```

The built app will be in `dist/FileManager.app`.

## 🎨 Screenshots

*(Add screenshots here)*

## 📁 Project Structure

```
rw-file-manager/
├── electron/            # Electron main process
│   ├── main.cjs        # Entry point
│   └── preload.cjs     # Preload script for security
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom hooks
│   ├── styles/         # Global styles
│   ├── types/          # TypeScript definitions
│   └── utils/          # Utility functions
├── dist/               # Build output
└── package.json
```

## 🔧 Features Details

### Context Menu Functions

Both sidebar directory tree and main file list support:

| Function | Description |
|----------|-------------|
| Open | Open file/folder |
| Copy | Copy to clipboard |
| Cut | Cut to clipboard |
| Make Duplicate | Create duplicate in same directory with auto-naming |
| Paste | Paste from clipboard |
| Delete | Delete selected items |
| Rename | Rename file/folder |
| Properties | Show file properties (size, modified date, path) |
| Copy Path | Copy full path to clipboard |
| Open in Terminal | Open system Terminal at this location |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + C` | Copy |
| `Cmd/Ctrl + X` | Cut |
| `Cmd/Ctrl + V` | Paste |
| `Cmd/Ctrl + A` | Select All |
| `Delete` | Delete |
| `F2` | Rename |
| `Cmd/Ctrl + I` | Properties |
| `Cmd/Ctrl + Shift + .` | Toggle show hidden files |
| `Cmd/Ctrl + R` | Refresh |

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

## 📄 License

MIT © [bigmouthz](https://github.com/bigmouthz) <bigmouthz@163.com>
