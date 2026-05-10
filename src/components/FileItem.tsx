import type { FileEntry } from '../types';
import { formatFileSize, formatDate, getFileExtension, getFileIcon } from '../utils/format';

interface FileItemProps {
  entry: FileEntry;
  viewMode: 'list' | 'icons';
  onDoubleClick: (entry: FileEntry) => void;
  onClick: (e: React.MouseEvent) => void;
  isSelected: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  draggable?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
}

export function FileItem({ entry, viewMode, onDoubleClick, onClick, isSelected, onContextMenu, draggable, onDragStart, onDragOver, onDrop }: FileItemProps) {
  const extension = entry.isDirectory ? '' : getFileExtension(entry.name);
  const icon = getFileIcon(extension, entry.isDirectory);

  if (viewMode === 'icons') {
    return (
      <div
        className={`file-icon-item ${isSelected ? 'selected' : ''}`}
        onDoubleClick={() => onDoubleClick(entry)}
        onClick={onClick}
        onContextMenu={onContextMenu}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
      >
        <div className="file-icon-large">{icon}</div>
        <div className="file-icon-name">{entry.name}</div>
      </div>
    );
  }

  return (
    <tr
      className={`file-list-item ${isSelected ? 'selected' : ''}`}
      onDoubleClick={() => onDoubleClick(entry)}
      onClick={onClick}
      onContextMenu={onContextMenu}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <td className="file-cell file-cell-name">
        <span className="file-icon">{icon}</span>
        <span className="file-name">{entry.name}</span>
      </td>
      <td className="file-cell file-cell-size">
        {entry.isDirectory ? '-' : formatFileSize(entry.size)}
      </td>
      <td className="file-cell file-cell-type">
        {entry.isDirectory ? '文件夹' : `${extension.toUpperCase()} 文件`}
      </td>
      <td className="file-cell file-cell-date">
        {formatDate(entry.modified)}
      </td>
    </tr>
  );
}
