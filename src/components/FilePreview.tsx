import type { FileEntry } from '../types';
import { formatFileSize, formatDate, getFileExtension, getFileIcon } from '../utils/format';

interface FilePreviewProps {
  file: FileEntry;
  onClose: () => void;
}

export function FilePreview({ file, onClose }: FilePreviewProps) {
  const extension = getFileExtension(file.name);
  const icon = getFileIcon(extension, file.isDirectory);

  const isTextFile = ['txt', 'md', 'json', 'js', 'ts', 'jsx', 'tsx', 'html', 'css', 'xml', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'sh', 'bat', 'log', 'csv', 'env', 'gitignore'].includes(extension);

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div className="file-preview" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <span className="preview-icon">{icon}</span>
          <span className="preview-title">{file.name}</span>
          <button className="preview-close" onClick={onClose}>✕</button>
        </div>
        <div className="preview-body">
          <div className="preview-info">
            <div className="info-row">
              <span className="info-label">名称</span>
              <span className="info-value">{file.name}</span>
            </div>
            <div className="info-row">
              <span className="info-label">路径</span>
              <span className="info-value">{file.path}</span>
            </div>
            <div className="info-row">
              <span className="info-label">类型</span>
              <span className="info-value">
                {file.isDirectory ? '文件夹' : `${extension.toUpperCase()} 文件`}
              </span>
            </div>
            <div className="info-row">
              <span className="info-label">大小</span>
              <span className="info-value">{formatFileSize(file.size)}</span>
            </div>
            <div className="info-row">
              <span className="info-label">修改日期</span>
              <span className="info-value">{formatDate(file.modified)}</span>
            </div>
          </div>

          {isTextFile && (
            <div className="preview-content">
              <div className="preview-content-header">文件预览</div>
              <div className="preview-content-body">
                <p className="preview-placeholder">
                  这是 <strong>{file.name}</strong> 的预览。
                </p>
                <p className="preview-placeholder">
                  文件大小：{formatFileSize(file.size)}，共约 {Math.max(1, Math.floor(file.size / 80))} 行。
                </p>
                <p className="preview-placeholder">
                  在真实文件系统中，此处将显示文件的实际内容。
                </p>
              </div>
            </div>
          )}

          {!isTextFile && !file.isDirectory && (
            <div className="preview-content">
              <div className="preview-content-header">文件预览</div>
              <div className="preview-content-body">
                <p className="preview-placeholder">
                  此文件类型暂不支持预览。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
