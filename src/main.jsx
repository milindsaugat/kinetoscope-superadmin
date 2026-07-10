/* ============================================================
   Entry: main.jsx
   Description: React app entry point
   ============================================================ */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

/* ============ END: main.jsx ============ */
