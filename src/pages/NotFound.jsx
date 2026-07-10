/* ============================================================
   Page: NotFound.jsx
   Description: 404 page
   ============================================================ */

import { useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="kfpl-404">
      <div className="kfpl-404-code">404</div>
      <h2 className="kfpl-404-title">Page Not Found</h2>
      <p className="kfpl-404-text">The page you're looking for doesn't exist or has been moved.</p>
      <button className="kfpl-btn kfpl-btn--primary" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}

/* ============ END: NotFound.jsx ============ */
