import { useState, useEffect } from 'react';
import { getFileProperties } from '../utils/fileOperations';
import { formatFileSize, formatDate } from '../utils/format';

interface FilePropertiesProps {
  filePath: string;
  onClose: () => void;
}

export function FileProperties({ filePath, onClose }: FilePropertiesProps) {
  const [properties, setProperties] = useState<Awaited<ReturnType<typeof getFileProperties>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProperties() {
      setLoading(true);
      setError(null);
      try {
        const props = await getFileProperties(filePath);
        setProperties(props);
      } catch (e) {
        setError(e instanceof Error ? e.message : '获取文件属性失败');
      }
      setLoading(false);
    }
    loadProperties();
  }, [filePath]);

  const formatDateTime = (isoString: string) => {
    return formatDate(new Date(isoString));
  };

  return (
    <div className="file-properties-overlay" onClick={onClose}>
      <div className="file-properties" onClick={e => e.stopPropagation()}>
        <div className="preview-header">
          <span className="preview-title">文件属性</span>
          <button className="preview-close" onClick={onClose}>✕</button>
        </div>
        <div className="preview-body">
          {loading && (
            <div className="loading-indicator">
              <span className="loading-text">正在加载属性...</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {properties && (
            <div className="properties-info">
              <div className="properties-row">
                <span className="properties-label">文件名</span>
                <span className="properties-value">{properties.name}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">路径</span>
                <span className="properties-value">{properties.path}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">类型</span>
                <span className="properties-value">{properties.isDirectory ? '文件夹' : '文件'}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">大小</span>
                <span className="properties-value">
                  {properties.isDirectory
                    ? `${properties.childCount} 个项目`
                    : formatFileSize(properties.size)}
                </span>
              </div>
              {properties.isDirectory && (
                <div className="properties-row">
                  <span className="properties-label">包含项目数</span>
                  <span className="properties-value">{properties.childCount} 个</span>
                </div>
              )}
              <div className="properties-row">
                <span className="properties-label">创建时间</span>
                <span className="properties-value">{formatDateTime(properties.createdAt)}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">修改时间</span>
                <span className="properties-value">{formatDateTime(properties.modifiedAt)}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">访问时间</span>
                <span className="properties-value">{formatDateTime(properties.accessedAt)}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">只读</span>
                <span className="properties-value">{properties.isReadOnly ? '是' : '否'}</span>
              </div>
              <div className="properties-row">
                <span className="properties-label">隐藏</span>
                <span className="properties-value">{properties.isHidden ? '是' : '否'}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
