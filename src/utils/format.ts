/**
 * 文件大小格式化
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const size = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${size} ${units[i]}`;
}

/**
 * 日期格式化
 */
export function formatDate(date: Date): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  const dotIndex = filename.lastIndexOf('.');
  if (dotIndex === -1 || dotIndex === 0) return '';
  return filename.slice(dotIndex + 1).toLowerCase();
}

/**
 * 根据扩展名获取文件类型图标
 */
export function getFileIcon(extension: string, isDirectory: boolean): string {
  if (isDirectory) return '📁';
  
  const iconMap: Record<string, string> = {
    txt: '📄',
    md: '📝',
    json: '📋',
    js: '📜',
    jsx: '⚛️',
    ts: '📘',
    tsx: '⚛️',
    html: '🌐',
    css: '🎨',
    scss: '🎨',
    less: '🎨',
    py: '🐍',
    java: '☕',
    cpp: '⚙️',
    c: '⚙️',
    h: '⚙️',
    go: '🔵',
    rs: '🦀',
    rb: '💎',
    php: '🐘',
    swift: '🍎',
    kt: '🟣',
    dart: '🎯',
    vue: '💚',
    svelte: '🧡',
    xml: '📰',
    yaml: '📰',
    yml: '📰',
    toml: '📰',
    ini: '⚙️',
    cfg: '⚙️',
    sh: '💻',
    bat: '💻',
    ps1: '💻',
    sql: '🗄️',
    db: '🗄️',
    sqlite: '🗄️',
    png: '🖼️',
    jpg: '🖼️',
    jpeg: '🖼️',
    gif: '🖼️',
    svg: '🖼️',
    webp: '🖼️',
    ico: '🖼️',
    bmp: '🖼️',
    mp3: '🎵',
    wav: '🎵',
    flac: '🎵',
    ogg: '🎵',
    mp4: '🎬',
    avi: '🎬',
    mkv: '🎬',
    mov: '🎬',
    wmv: '🎬',
    pdf: '📕',
    doc: '📘',
    docx: '📘',
    xls: '📗',
    xlsx: '📗',
    ppt: '📙',
    pptx: '📙',
    zip: '📦',
    rar: '📦',
    '7z': '📦',
    tar: '📦',
    gz: '📦',
    bz2: '📦',
    exe: '⚡',
    dmg: '💿',
    iso: '💿',
    apk: '🤖',
    deb: '🐧',
    rpm: '🐧',
    log: '📋',
    csv: '📊',
    lock: '🔒',
    gitignore: '🔧',
    dockerfile: '🐳',
    env: '🔐',
  };

  return iconMap[extension] || '📄';
}
