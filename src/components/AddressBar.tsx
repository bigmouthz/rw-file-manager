import { useState, useRef, useEffect } from 'react';
import { getPathName } from '../utils/fileSystem';

interface AddressBarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AddressBar({ currentPath, onNavigate }: AddressBarProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(currentPath);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!editing) {
      setValue(currentPath);
    }
  }, [currentPath, editing]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleSubmit = () => {
    const path = value.trim() || '/';
    onNavigate(path);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    } else if (e.key === 'Escape') {
      setValue(currentPath);
      setEditing(false);
    }
  };

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <div className="address-bar">
      <span className="address-label">地址</span>
      {editing ? (
        <input
          ref={inputRef}
          className="address-input"
          value={value}
          onChange={e => setValue(e.target.value)}
          onBlur={handleSubmit}
          onKeyDown={handleKeyDown}
        />
      ) : (
        <div className="address-display" onClick={() => setEditing(true)}>
          <span className="address-root" onClick={(e) => { e.stopPropagation(); onNavigate('/'); }}>
            {getPathName('/')}
          </span>
          {pathParts.map((part, index) => {
            const fullPath = '/' + pathParts.slice(0, index + 1).join('/');
            return (
              <span key={fullPath} className="address-part">
                <span className="address-separator">›</span>
                <span
                  className="address-link"
                  onClick={(e) => { e.stopPropagation(); onNavigate(fullPath); }}
                >
                  {part}
                </span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
