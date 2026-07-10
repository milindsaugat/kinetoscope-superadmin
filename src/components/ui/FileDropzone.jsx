/* ============================================================
   Component: FileDropzone.jsx
   Description: Reusable drag-and-drop + click-to-browse file upload
   ============================================================ */

import { useState, useRef } from 'react';

const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const MAX_SIZE_MB = 10;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function getFileIcon(type) {
  if (type === 'application/pdf') return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
    </svg>
  );
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
    </svg>
  );
}

export default function FileDropzone({ onFilesChange, multiple = true, label = 'Agreement Document' }) {
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const validateAndAdd = (newFiles) => {
    setError('');
    const validFiles = [];

    for (const file of newFiles) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`"${file.name}" — Invalid file type. Only PDF, JPG, PNG allowed.`);
        continue;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`"${file.name}" — File too large. Max ${MAX_SIZE_MB}MB allowed.`);
        continue;
      }
      // Avoid duplicates
      if (files.some(f => f.name === file.name && f.size === file.size)) continue;
      validFiles.push(file);
    }

    if (validFiles.length > 0) {
      const updated = multiple ? [...files, ...validFiles] : validFiles.slice(0, 1);
      setFiles(updated);
      onFilesChange?.(updated);
    }
  };

  const removeFile = (index) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesChange?.(updated);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) validateAndAdd(droppedFiles);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleInputChange = (e) => {
    const selected = Array.from(e.target.files);
    if (selected.length > 0) validateAndAdd(selected);
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  return (
    <div className="kfpl-form-section">
      <div className="kfpl-form-section-title">{label}</div>

      <div
        className={`kfpl-dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          multiple={multiple}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />

        <div className="kfpl-dropzone-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" width="40" height="40">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        </div>
        <div className="kfpl-dropzone-text">
          {isDragging ? 'Drop files here…' : 'Drag & drop files here, or click to browse'}
        </div>
        <div className="kfpl-dropzone-hint">PDF, JPG, PNG up to 10MB</div>
      </div>

      {error && (
        <div style={{
          fontSize: '0.8125rem',
          color: '#EF4444',
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.08)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {files.map((file, i) => (
            <div key={`${file.name}-${i}`} className="kfpl-dropzone-file">
              {getFileIcon(file.type)}
              <span className="kfpl-dropzone-file-name">{file.name}</span>
              <span className="kfpl-dropzone-file-size">{formatFileSize(file.size)}</span>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--color-text-muted)',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.15s, background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#EF4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--color-text-muted)'; e.currentTarget.style.background = 'none'; }}
                title="Remove file"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" width="16" height="16">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ============ END: FileDropzone.jsx ============ */
