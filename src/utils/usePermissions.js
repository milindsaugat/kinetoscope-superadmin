/* ============================================================
   Utility: usePermissions.js
   Description: Custom hook to check granular sub-admin permissions
                (view, create, edit, delete) for any module.
   ============================================================ */

import { useMemo } from 'react';
import { getAuthUser } from './authStorage';

export { getAuthUser };

export function usePermissions() {
  const user = useMemo(() => getAuthUser(), []);
  const role = user?.role || 'super-admin';
  const isSuperAdmin = role === 'super-admin';
  const permissions = user?.permissions || {};

  // View is allowed if view === true OR if create/edit/delete is true (implicit access to see the page to act on it)
  const canView = (moduleKey) => {
    if (isSuperAdmin) return true;
    if (!moduleKey) return true;
    const mod = permissions[moduleKey];
    if (!mod) return false;
    return !!(mod.view || mod.create || mod.edit || mod.delete);
  };

  const canCreate = (moduleKey) => {
    if (isSuperAdmin) return true;
    if (!moduleKey) return false;
    return !!permissions[moduleKey]?.create;
  };

  const canEdit = (moduleKey) => {
    if (isSuperAdmin) return true;
    if (!moduleKey) return false;
    return !!permissions[moduleKey]?.edit;
  };

  const canDelete = (moduleKey) => {
    if (isSuperAdmin) return true;
    if (!moduleKey) return false;
    return !!permissions[moduleKey]?.delete;
  };

  return {
    isSuperAdmin,
    role,
    permissions,
    canView,
    canCreate,
    canEdit,
    canDelete,
  };
}
