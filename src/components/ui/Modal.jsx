/* ============================================================
   Component: Modal.jsx
   Description: Accessible modal with backdrop blur
   ============================================================ */

import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidth = size === 'xl' ? '880px' : size === 'lg' ? '720px' : size === 'sm' ? '400px' : '560px';

  return createPortal(
    <div className="kfpl-modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="kfpl-modal" style={{ maxWidth }}>
        <div className="kfpl-modal-header">
          <h3 className="kfpl-modal-title">{title}</h3>
          <button className="kfpl-modal-close" onClick={onClose} aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div className="kfpl-modal-body">{children}</div>
        {footer && <div className="kfpl-modal-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ============ END: Modal.jsx ============ */
