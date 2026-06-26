import { useState, useEffect } from 'react';
import rbacService from '../services/rbacService';
import toast from 'react-hot-toast';

export default function RBAC({ language = 'en', onAddActivity }) {
  // Tabs
  const [activeSubTab, setActiveSubTab] = useState('matrix'); // 'matrix' or 'users'

  // Data state
  const [roles, setRoles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [permissionMatrix, setPermissionMatrix] = useState([]);
  const [modules, setModules] = useState([]);
  
  // UI Loading/Saving state
  const [loading, setLoading] = useState(true);
  const [savingMatrix, setSavingMatrix] = useState(false);
  const [savingRole, setSavingRole] = useState(false);
  const [assigningUserId, setAssigningUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Form fields
  const [newRole, setNewRole] = useState({ name: '', description: '', is_superadmin: false });
  const [editRole, setEditRole] = useState({ name: '', description: '', is_superadmin: false });
  
  // Toast notifications
  const [toast, setToast] = useState(null);

  // Module translation helper
  const moduleLabels = {
    dashboard: { en: 'Dashboard & Analytics', mr: 'डॅशबोर्ड आणि विश्लेषण', hi: 'डैशबोर्ड और विश्लेषण' },
    intake: { en: 'Commodity Intake', mr: 'धान्य आवक (Intake)', hi: 'अनाज आवक (Intake)' },
    inventory: { en: 'Inventory Ledger', mr: 'साठा नोंदवही (Inventory)', hi: 'स्टॉक बही (Inventory)' },
    warehouse_receipts: { en: 'e-Warehouse Receipts', mr: 'गोदाम पावती (e-WR)', hi: 'गोदाम रसीद (e-WR)' },
    dispatch: { en: 'Dispatch & Fulfillment', mr: 'माल प्रेषण (Dispatch)', hi: 'माल निकासी (Dispatch)' },
    market: { en: 'Market Linkage', mr: 'बाजार जोडणी', hi: 'बाजार विपणन' },
    farmers: { en: 'Farmer Registry', mr: 'शेतकरी नोंदणी', hi: 'किसान पंजीकरण' },
    users: { en: 'User Management', mr: 'वापरकर्ता व्यवस्थापन', hi: 'उपयोगकर्ता प्रबंधन' },
    warehouses: { en: 'Warehouse Registry', mr: 'गोदाम व्यवस्थापन', hi: 'गोदाम प्रबंधन' },
    reports: { en: 'Reports & Insights', mr: 'अहवाल आणि विश्लेषण', hi: 'रिपोर्ट और विश्लेषण' },
    settings: { en: 'System Settings', mr: 'सिस्टम सेटिंग्ज', hi: 'सिस्टम सेटिंग्स' },
  };

  const getModuleLabel = (slug) => {
    return moduleLabels[slug]?.[language] || moduleLabels[slug]?.en || slug;
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [fetchedRoles, fetchedUsers, fetchedModules] = await Promise.all([
        rbacService.getRoles(),
        rbacService.getUsers(),
        rbacService.getModules()
      ]);
      
      setRoles(fetchedRoles);
      setUsers(fetchedUsers);
      setModules(fetchedModules);

      // Auto-select first role if available
      if (fetchedRoles.length > 0) {
        setSelectedRoleId(fetchedRoles[0].id);
        setPermissionMatrix(fetchedRoles[0].permissions || []);
      }
    } catch (err) {
      console.error('Error fetching RBAC data:', err);
      showToast('Failed to load RBAC configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update permissions state when selected role changes
  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const roleObj = roles.find(r => r.id === selectedRoleId);
      if (roleObj) {
        setPermissionMatrix(roleObj.permissions || []);
      }
    }
  }, [selectedRoleId, roles]);

  const selectedRole = roles.find(r => r.id === selectedRoleId);

  // Permission Matrix changes
  const handleTogglePermission = (moduleSlug, field) => {
    if (selectedRole?.is_superadmin) {
      showToast('Superadmin permissions are set to full access by default', 'warning');
      return;
    }
    
    setPermissionMatrix(prev => {
      const exists = prev.find(p => p.module_slug === moduleSlug);
      if (exists) {
        return prev.map(p => 
          p.module_slug === moduleSlug 
            ? { ...p, [field]: !p[field] } 
            : p
        );
      } else {
        // Build fresh record
        return [...prev, {
          module_slug: moduleSlug,
          can_view: field === 'can_view',
          can_add: field === 'can_add',
          can_edit: field === 'can_edit',
          can_delete: field === 'can_delete'
        }];
      }
    });
  };

  const handleSavePermissions = async () => {
    if (!selectedRoleId) return;
    setSavingMatrix(true);
    try {
      const updatedPerms = await rbacService.updatePermissions(selectedRoleId, permissionMatrix);
      
      // Update role permissions in state
      setRoles(prev => prev.map(r => 
        r.id === selectedRoleId 
          ? { ...r, permissions: updatedPerms } 
          : r
      ));
      
      showToast('Permission matrix saved successfully');
      if (onAddActivity) onAddActivity(); // Reload activity log
    } catch (err) {
      console.error('Save permissions failed:', err);
      showToast('Failed to save permissions', 'error');
    } finally {
      setSavingMatrix(false);
    }
  };

  // Role CRUD Actions
  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!newRole.name.trim()) return;
    setSavingRole(true);
    try {
      const created = await rbacService.createRole({
        name: newRole.name.trim().toLowerCase(),
        description: newRole.description.trim(),
        is_superadmin: newRole.is_superadmin
      });
      setRoles(prev => [...prev, created]);
      setSelectedRoleId(created.id);
      setNewRole({ name: '', description: '', is_superadmin: false });
      setShowCreateModal(false);
      showToast('Role created successfully');
      if (onAddActivity) onAddActivity();
    } catch (err) {
      console.error('Create role failed:', err);
      showToast(err.response?.data?.detail || 'Failed to create role', 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!selectedRole) return;
    setEditRole({
      name: selectedRole.name,
      description: selectedRole.description || '',
      is_superadmin: selectedRole.is_superadmin
    });
    setShowEditModal(true);
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    if (!selectedRoleId || !editRole.name.trim()) return;
    setSavingRole(true);
    try {
      const updated = await rbacService.updateRole(selectedRoleId, {
        name: editRole.name.trim().toLowerCase(),
        description: editRole.description.trim(),
        is_superadmin: editRole.is_superadmin
      });
      setRoles(prev => prev.map(r => r.id === selectedRoleId ? { ...r, ...updated } : r));
      setShowEditModal(false);
      showToast('Role updated successfully');
      if (onAddActivity) onAddActivity();
    } catch (err) {
      console.error('Update role failed:', err);
      showToast(err.response?.data?.detail || 'Failed to update role', 'error');
    } finally {
      setSavingRole(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!selectedRoleId) return;
    
    // Safety check
    const assignedUsers = users.filter(u => u.role_id === selectedRoleId || u.role === selectedRole.name);
    if (assignedUsers.length > 0) {
      toast.success(`Cannot delete role. There are ${assignedUsers.length} user(s) currently assigned to this role. Reassign them first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the role "${selectedRole.name}"?`)) return;

    try {
      await rbacService.deleteRole(selectedRoleId);
      const remainingRoles = roles.filter(r => r.id !== selectedRoleId);
      setRoles(remainingRoles);
      
      // Auto select next role
      if (remainingRoles.length > 0) {
        setSelectedRoleId(remainingRoles[0].id);
      } else {
        setSelectedRoleId(null);
      }
      showToast('Role deleted successfully');
      if (onAddActivity) onAddActivity();
    } catch (err) {
      console.error('Delete role failed:', err);
      showToast(err.response?.data?.detail || 'Failed to delete role', 'error');
    }
  };

  // User role assignment
  const handleAssignUserRole = async (userId, roleId) => {
    setAssigningUserId(userId);
    try {
      await rbacService.assignRole(userId, roleId);
      
      // Update local state
      const targetRole = roles.find(r => r.id === roleId);
      setUsers(prev => prev.map(u => 
        u.id === userId 
          ? { ...u, role_id: roleId, role: targetRole ? targetRole.name : u.role } 
          : u
      ));
      
      showToast('User role updated successfully');
      if (onAddActivity) onAddActivity();
    } catch (err) {
      console.error('Assign user role failed:', err);
      showToast('Failed to update user role', 'error');
    } finally {
      setAssigningUserId(null);
    }
  };

  // User search filtering
  const filteredUsers = users.filter(usr => {
    const q = searchQuery.toLowerCase();
    return (
      usr.full_name?.toLowerCase().includes(q) ||
      usr.phone?.includes(q) ||
      usr.email?.toLowerCase().includes(q) ||
      (usr.role || '').toLowerCase().includes(q)
    );
  });

  if (loading) {
    return (
      <div style={{ padding: '40px', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner">
          <div className="double-bounce1"></div>
          <div className="double-bounce2"></div>
        </div>
        <div style={{ marginLeft: '12px', color: 'var(--text3)' }}>Loading security database...</div>
      </div>
    );
  }

  return (
    <div className="rbac-page" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Alert overlay */}
      {toast && (
        <div className={`toast-alert toast-${toast.type}`}>
          <span style={{ marginRight: '8px' }}>
            {toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : '✅'}
          </span>
          {toast.message}
        </div>
      )}

      {/* Styled styles injection */}
      <style>{`
        .rbac-container {
          display: flex;
          gap: 24px;
          min-height: 500px;
        }
        
        .rbac-sidebar {
          width: 280px;
          flex-shrink: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          box-shadow: var(--shadow);
        }
        
        .role-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .role-item {
          padding: 12px 14px;
          border-radius: 8px;
          border: 1px solid transparent;
          background: var(--bg);
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: left;
          position: relative;
        }

        .role-item:hover {
          background: var(--surface2);
          border-color: var(--border2);
        }

        .role-item.active {
          background: var(--green-light);
          border-color: var(--green);
          color: var(--green);
          font-weight: 500;
        }

        .role-item-name {
          font-size: 14px;
          font-weight: 600;
          text-transform: capitalize;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .role-item-desc {
          font-size: 11px;
          color: var(--text3);
          margin-top: 4px;
          line-height: 1.3;
        }

        .rbac-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 24px;
          box-shadow: var(--shadow);
        }

        .tab-nav {
          display: flex;
          border-bottom: 1px solid var(--border);
          gap: 24px;
          margin-bottom: 10px;
        }

        .tab-btn {
          padding: 10px 0;
          font-size: 14px;
          font-weight: 500;
          background: none;
          border: none;
          color: var(--text3);
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }

        .tab-btn:hover {
          color: var(--text);
        }

        .tab-btn.active {
          color: var(--green);
          font-weight: 600;
        }

        .tab-btn.active::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--green);
        }

        /* Switched slider toggle styling */
        .switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 18px;
        }

        .switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--border2);
          transition: .25s ease;
          border-radius: 18px;
        }

        .slider:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .25s ease;
          border-radius: 50%;
        }

        input:checked + .slider {
          background-color: var(--green);
        }

        input:checked + .slider:before {
          transform: translateX(18px);
        }

        /* Modals */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(2px);
        }

        .modal-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          width: 440px;
          box-shadow: var(--shadow-lg);
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          color: var(--text);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 18px;
          font-weight: bold;
        }

        .modal-close {
          background: none;
          border: none;
          font-size: 20px;
          cursor: pointer;
          color: var(--text3);
        }

        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 8px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-control {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 8px 12px;
          font-family: inherit;
          font-size: 13.5px;
          color: var(--text);
          outline: none;
        }

        .form-control:focus {
          border-color: var(--green);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-size: 13.5px;
        }

        .toast-alert {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 20px;
          border-radius: 8px;
          color: white;
          font-weight: 500;
          z-index: 1100;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          animation: slideIn 0.3s ease;
        }

        .toast-success {
          background: var(--green);
        }
        
        .toast-error {
          background: var(--red);
        }

        .toast-warning {
          background: var(--amber);
        }

        @keyframes slideIn {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .spinner {
          width: 40px;
          height: 40px;
          position: relative;
        }

        .double-bounce1, .double-bounce2 {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: var(--green);
          opacity: 0.6;
          position: absolute;
          top: 0;
          left: 0;
          animation: sk-bounce 2.0s infinite ease-in-out;
        }

        .double-bounce2 {
          animation-delay: -1.0s;
        }

        @keyframes sk-bounce {
          0%, 100% { transform: scale(0.0) }
          50% { transform: scale(1.0) }
        }
      `}</style>

      {/* Header Info */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Role & Permission Management</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '4px' }}>
            Configure access modules and assign functional roles to FPO managers, buyers, and admin accounts.
          </p>
        </div>
      </div>

      {/* Main layout */}
      <div className="rbac-container">
        
        {/* Left sidebar: Roles List */}
        <div className="rbac-sidebar">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--text)', margin: 0 }}>Roles</h3>
            <button 
              className="btn btn-outline" 
              style={{ padding: '4px 8px', fontSize: '11px' }}
              onClick={() => setShowCreateModal(true)}
            >
              + Add Role
            </button>
          </div>

          <div className="role-list">
            {roles.map(r => (
              <div 
                key={r.id} 
                className={`role-item ${selectedRoleId === r.id ? 'active' : ''}`}
                onClick={() => setSelectedRoleId(r.id)}
              >
                <div className="role-item-name">
                  <span>{r.name}</span>
                  {r.is_superadmin && (
                    <span 
                      style={{ 
                        fontSize: '9px', 
                        background: 'var(--green)', 
                        color: 'white', 
                        padding: '1px 4px', 
                        borderRadius: '3px', 
                        fontWeight: 'normal',
                        textTransform: 'uppercase'
                      }}
                    >
                      Super
                    </span>
                  )}
                </div>
                <div className="role-item-desc">
                  {r.description || 'No description provided.'}
                </div>
              </div>
            ))}
          </div>

          {selectedRole && (
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', display: 'flex', gap: '8px' }}>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '6px', fontSize: '12px' }}
                onClick={handleOpenEditModal}
              >
                Edit Details
              </button>
              <button 
                className="btn btn-outline" 
                style={{ flex: 1, padding: '6px', fontSize: '12px', color: 'var(--red)', borderColor: 'rgba(155, 35, 53, 0.2)' }}
                onClick={handleDeleteRole}
              >
                Delete Role
              </button>
            </div>
          )}
        </div>

        {/* Right workspace: Matrix or Users tabs */}
        <div className="rbac-content">
          <div className="tab-nav">
            <button 
              className={`tab-btn ${activeSubTab === 'matrix' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('matrix')}
            >
              Permissions Matrix
            </button>
            <button 
              className={`tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveSubTab('users')}
            >
              Users Assignment ({users.length})
            </button>
          </div>

          {/* TAB 1: PERMISSION MATRIX */}
          {activeSubTab === 'matrix' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedRole ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                        Configure Permissions for <span style={{ color: 'var(--green)' }}>{selectedRole.name}</span>
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
                        Define modular read, write, update, and delete access. Change values below and save.
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button 
                        className="btn btn-outline" 
                        onClick={() => {
                          const refreshed = roles.find(r => r.id === selectedRoleId);
                          if (refreshed) setPermissionMatrix(refreshed.permissions || []);
                          showToast('Reset modifications');
                        }}
                      >
                        Reset
                      </button>
                      <button 
                        className="btn btn-primary" 
                        disabled={savingMatrix}
                        onClick={handleSavePermissions}
                      >
                        {savingMatrix ? 'Saving...' : 'Save Permissions'}
                      </button>
                    </div>
                  </div>

                  {selectedRole.is_superadmin && (
                    <div 
                      style={{ 
                        background: 'var(--green-light)', 
                        border: '1px solid var(--green)', 
                        padding: '12px', 
                        borderRadius: '6px', 
                        color: 'var(--green)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <span>🛡️</span>
                      <strong>Superadmin Bypass Active:</strong> This role has unlimited access override on all endpoints. Modifying grid permissions here has no restriction on Superadmins.
                    </div>
                  )}

                  <div className="table-responsive">
                    <table>
                      <thead>
                        <tr>
                          <th>Module Segment</th>
                          <th style={{ textAlign: 'center' }}>View</th>
                          <th style={{ textAlign: 'center' }}>Add</th>
                          <th style={{ textAlign: 'center' }}>Edit</th>
                          <th style={{ textAlign: 'center' }}>Delete</th>
                        </tr>
                      </thead>
                      <tbody>
                        {modules.map(moduleSlug => {
                          const permObj = permissionMatrix.find(p => p.module_slug === moduleSlug) || {
                            can_view: false,
                            can_add: false,
                            can_edit: false,
                            can_delete: false
                          };
                          
                          return (
                            <tr key={moduleSlug}>
                              <td>
                                <strong style={{ color: 'var(--text)' }}>
                                  {getModuleLabel(moduleSlug)}
                                </strong>
                                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                  slug: {moduleSlug}
                                </div>
                              </td>
                              
                              <td style={{ textAlign: 'center' }}>
                                <label className="switch">
                                  <input 
                                    type="checkbox"
                                    checked={selectedRole.is_superadmin ? true : !!permObj.can_view}
                                    disabled={selectedRole.is_superadmin}
                                    onChange={() => handleTogglePermission(moduleSlug, 'can_view')}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </td>

                              <td style={{ textAlign: 'center' }}>
                                <label className="switch">
                                  <input 
                                    type="checkbox"
                                    checked={selectedRole.is_superadmin ? true : !!permObj.can_add}
                                    disabled={selectedRole.is_superadmin}
                                    onChange={() => handleTogglePermission(moduleSlug, 'can_add')}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </td>

                              <td style={{ textAlign: 'center' }}>
                                <label className="switch">
                                  <input 
                                    type="checkbox"
                                    checked={selectedRole.is_superadmin ? true : !!permObj.can_edit}
                                    disabled={selectedRole.is_superadmin}
                                    onChange={() => handleTogglePermission(moduleSlug, 'can_edit')}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </td>

                              <td style={{ textAlign: 'center' }}>
                                <label className="switch">
                                  <input 
                                    type="checkbox"
                                    checked={selectedRole.is_superadmin ? true : !!permObj.can_delete}
                                    disabled={selectedRole.is_superadmin}
                                    onChange={() => handleTogglePermission(moduleSlug, 'can_delete')}
                                  />
                                  <span className="slider"></span>
                                </label>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
                  👈 Please select a role from the left list or create a new one to edit its permissions.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: USER ASSIGNMENT */}
          {activeSubTab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
                <h4 style={{ fontSize: '16px', margin: 0 }}>Assign User Access Roles</h4>
                
                {/* Search box */}
                <div style={{ position: 'relative', width: '260px' }}>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search users by name, role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ width: '100%', paddingLeft: '32px' }}
                  />
                  <span style={{ position: 'absolute', left: '10px', top: '9px', color: 'var(--text3)' }}>🔍</span>
                </div>
              </div>

              <div className="table-responsive">
                <table>
                  <thead>
                    <tr>
                      <th>User Info</th>
                      <th>Phone</th>
                      <th>Current Role</th>
                      <th style={{ width: '220px' }}>Modify Role Assignment</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" style={{ textAlign: 'center', color: 'var(--text3)', padding: '24px 0' }}>
                          No users found matching query.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(usr => {
                        const userInitials = usr.full_name
                          ? usr.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                          : 'U';
                        
                        return (
                          <tr key={usr.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div 
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'var(--surface2)',
                                    color: 'var(--text2)',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1px solid var(--border)'
                                  }}
                                >
                                  {userInitials}
                                </div>
                                <div>
                                  <div style={{ fontWeight: '600', color: 'var(--text)' }}>
                                    {usr.full_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                                    {usr.email || 'No email registered'}
                                  </div>
                                </div>
                              </div>
                            </td>
                            
                            <td>{usr.phone}</td>
                            
                            <td>
                              <span className={`badge ${
                                usr.role === 'admin' ? 'badge-red' : 
                                usr.role === 'fpo_manager' ? 'badge-green' :
                                usr.role === 'fpo_staff' ? 'badge-teal' :
                                usr.role === 'farmer' ? 'badge-amber' : 
                                'badge-gray'
                              }`} style={{ textTransform: 'capitalize' }}>
                                {usr.role || 'Unassigned'}
                              </span>
                            </td>

                            <td>
                              {assigningUserId === usr.id ? (
                                <div style={{ fontSize: '12px', color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <span className="spinner" style={{ width: '14px', height: '14px' }}>
                                    <span className="double-bounce1" style={{ backgroundColor: 'var(--green)' }}></span>
                                  </span>
                                  Saving...
                                </div>
                              ) : (
                                <select
                                  className="form-control"
                                  style={{ width: '100%', padding: '6px 8px', fontSize: '12px' }}
                                  value={usr.role_id || roles.find(r => r.name === usr.role)?.id || ''}
                                  onChange={(e) => handleAssignUserRole(usr.id, parseInt(e.target.value))}
                                >
                                  <option value="" disabled>-- Select Role --</option>
                                  {roles.map(r => (
                                    <option key={r.id} value={r.id}>
                                      {r.name} {r.is_superadmin ? '(Superadmin)' : ''}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Create Custom Access Role</span>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    placeholder="e.g. logistics_officer, senior_auditor"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  />
                  <small style={{ color: 'var(--text3)', fontSize: '10px' }}>Should be alphanumeric with underscores only.</small>
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    placeholder="Describe the scope of access and users for this role..."
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '6px' }}>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={newRole.is_superadmin}
                      onChange={(e) => setNewRole({ ...newRole, is_superadmin: e.target.checked })}
                    />
                    <span>Flag as Superadmin Role (Unlimited access)</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingRole}>
                  {savingRole ? 'Creating...' : 'Create Role'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <span className="modal-title">Edit Role Details</span>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditRole}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Role Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    required 
                    value={editRole.name}
                    onChange={(e) => setEditRole({ ...editRole, name: e.target.value })}
                  />
                </div>
                
                <div className="form-group">
                  <label>Description</label>
                  <textarea 
                    className="form-control" 
                    rows="3" 
                    value={editRole.description}
                    onChange={(e) => setEditRole({ ...editRole, description: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '6px' }}>
                  <label className="checkbox-label">
                    <input 
                      type="checkbox"
                      checked={editRole.is_superadmin}
                      onChange={(e) => setEditRole({ ...editRole, is_superadmin: e.target.checked })}
                    />
                    <span>Flag as Superadmin Role (Unlimited access)</span>
                  </label>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={savingRole}>
                  {savingRole ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
