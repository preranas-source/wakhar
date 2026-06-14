import { useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';

export default function RoleGuard({ allowedRoles, fallback = null, children }) {
  const { currentUser } = useContext(AuthContext);
  if (!currentUser || !allowedRoles.includes(currentUser.role)) {
    return fallback;
  }
  return <>{children}</>;
}
