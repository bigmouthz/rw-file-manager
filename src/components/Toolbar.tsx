interface ToolbarProps {
  canGoBack: boolean;
  canGoForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onUp: () => void;
  onRefresh: () => void;
  currentPath: string;
}

export function Toolbar({
  canGoBack,
  canGoForward,
  onBack,
  onForward,
  onUp,
  onRefresh,
  currentPath,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-buttons">
        <button
          className="toolbar-btn"
          onClick={onBack}
          disabled={!canGoBack}
          title="后退"
        >
          <span className="btn-icon">◀</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onForward}
          disabled={!canGoForward}
          title="前进"
        >
          <span className="btn-icon">▶</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onUp}
          disabled={currentPath === '/'}
          title="向上一级"
        >
          <span className="btn-icon">⬆</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onRefresh}
          title="刷新"
        >
          <span className="btn-icon">🔄</span>
        </button>
      </div>
    </div>
  );
}
