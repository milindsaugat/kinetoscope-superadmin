/* ============================================================
   Entry: main.jsx
   Description: React app entry point
   ============================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';

// ── CSS Imports (order matters) ───────────────────────
import './index.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/tables.css';
import './styles/charts.css';
import './styles/forms.css';
import './styles/pages.css';
import './styles/responsive.css';


if (import.meta.env.PROD) {
  console.log = () => {};
  console.debug = () => {};
  console.warn = () => {};
}

// Prevent mouse wheel from changing values on focused number inputs globally
document.addEventListener('wheel', function(e) {
  if (document.activeElement && document.activeElement.tagName === 'INPUT' && document.activeElement.type === 'number') {
    e.preventDefault();
  }
}, { passive: false });

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

/* ============ END: main.jsx ============ */
