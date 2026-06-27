import { useState } from 'react';
import { createPortal } from 'react-dom';
import { getTranslation } from '@wakhar/shared';
import toast from 'react-hot-toast';
import farmerService from '../services/farmerService';

export default function FarmerManagement({
  language = 'en',
  dbFarmers = [],
  currentUser,
  onRefreshData
}) {
  const t = (key) => getTranslation(key, language);

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmer, setEditingFarmer] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [village, setVillage] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Scoped farmers (Staff only sees their FPO farmers, Admin sees all)
  const isStaffOrManager = currentUser?.role === 'fpo_staff' || currentUser?.role === 'fpo_manager';
  const myFpoId = currentUser?.fpo_id;

  const filteredFarmers = dbFarmers
    .filter(f => !isStaffOrManager || f.fpo_id === myFpoId)
    .filter(f => {
      const q = searchQuery.toLowerCase();
      return (
        f.name.toLowerCase().includes(q) ||
        f.farmer_code.toLowerCase().includes(q) ||
        (f.phone && f.phone.includes(q)) ||
        (f.village && f.village.toLowerCase().includes(q))
      );
    });

  const handleOpenRegister = () => {
    setEditingFarmer(null);
    setName('');
    setPhone('+91 ');
    setAadhaar('');
    setVillage('');
    setBankAccount('');
    setBankIfsc('');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (farmer) => {
    setEditingFarmer(farmer);
    setName(farmer.name);
    setPhone(farmer.phone || '');
    setAadhaar(farmer.aadhaar || '');
    setVillage(farmer.village || '');
    setBankAccount(farmer.bank_account || '');
    setBankIfsc(farmer.bank_ifsc || '');
    setPassword('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      toast.error('Name and Phone Number are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        phone: phone.trim(),
        aadhaar: aadhaar.trim() || null,
        village: village.trim() || null,
        bank_account: bankAccount.trim() || null,
        bank_ifsc: bankIfsc.trim() || null,
        fpo_id: myFpoId || 1, // Fallback to 1 if admin creates
        farmer_code: editingFarmer?.farmer_code || `FM-${Math.floor(10000 + Math.random() * 90000)}`,
        total_deposit_kg: editingFarmer?.total_deposit_kg || 0,
        password: password.trim() || null
      };

      if (editingFarmer) {
        await farmerService.updateFarmer(editingFarmer.id, payload);
        toast.success(`Farmer "${name}" updated successfully!`);
      } else {
        await farmerService.createFarmer(payload);
        toast.success(`Farmer "${name}" registered successfully!`);
      }

      if (onRefreshData) await onRefreshData();
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to save farmer:', err);
      toast.error(err.response?.data?.detail || 'Failed to save farmer details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (farmer) => {
    if (!window.confirm(`Are you sure you want to delete farmer "${farmer.name}"?`)) return;

    try {
      await farmerService.deleteFarmer(farmer.id);
      toast.success(`Farmer "${farmer.name}" deleted.`);
      if (onRefreshData) await onRefreshData();
    } catch (err) {
      console.error('Failed to delete farmer:', err);
      toast.error('Failed to delete farmer from database.');
    }
  };

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 className="section-title" style={{ margin: 0 }}>Farmer Co-operative Registry</h2>
          <p style={{ color: 'var(--text3)', fontSize: '13px', marginTop: '4px' }}>
            Register new farmers, update bank accounts for direct payout, and track lifetime crop deposits.
          </p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenRegister}>
          + Register Farmer
        </button>
      </div>

      {/* Filter and Search */}
      <div className="card" style={{ padding: '12px 20px', background: '#fff', border: '1px solid rgba(0, 0, 0, 0.08)' }}>
        <input
          type="text"
          placeholder="Search by name, farmer code, village, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '14px',
            border: '1px solid rgba(0, 0, 0, 0.15)',
            borderRadius: '6px',
            outline: 'none'
          }}
        />
      </div>

      {/* Data Table */}
      <div className="card">
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Farmer Code</th>
                <th>Full Name</th>
                <th>Phone Number</th>
                <th>Village</th>
                <th>Aadhaar</th>
                <th>Bank Account</th>
                <th>Lifetime Deposits</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '30px', color: 'var(--text3)' }}>
                    No matching farmer records found.
                  </td>
                </tr>
              ) : (
                filteredFarmers.map(farmer => (
                  <tr key={farmer.id}>
                    <td><strong>{farmer.farmer_code}</strong></td>
                    <td><strong>{farmer.name}</strong></td>
                    <td>{farmer.phone}</td>
                    <td>{farmer.village || 'N/A'}</td>
                    <td>{farmer.aadhaar ? `XXXX-XXXX-${farmer.aadhaar.slice(-4)}` : 'N/A'}</td>
                    <td>
                      {farmer.bank_account ? (
                        <span title={`IFSC: ${farmer.bank_ifsc}`}>
                          💳 ...{farmer.bank_account.slice(-4)}
                        </span>
                      ) : 'Not Linked'}
                    </td>
                    <td>
                      <span className="badge badge-teal">
                        {farmer.total_deposit_kg ? farmer.total_deposit_kg.toLocaleString() : 0} kg
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '12px' }}
                          onClick={() => handleOpenEdit(farmer)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '4px 8px', fontSize: '12px', color: 'var(--red)', borderColor: 'rgba(155,35,53,0.2)' }}
                          onClick={() => handleDelete(farmer)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register/Edit Modal Overlay */}
      {isModalOpen && createPortal(
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title">
                {editingFarmer ? 'Modify Farmer Record' : 'Register New Farmer'}
              </div>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '20px 24px' }}>
                <div className="form-group">
                  <label className="form-label">Farmer Full Name *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ramesh Shankar Patil"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Phone Number *</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Village / Location</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Wai"
                      value={village}
                      onChange={(e) => setVillage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">{editingFarmer ? 'Change Password / PIN' : 'Password / PIN *'}</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder={editingFarmer ? 'Leave blank to keep existing' : 'e.g. 123456'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingFarmer}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Aadhaar National ID Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 1234-5678-9012"
                    value={aadhaar}
                    onChange={(e) => setAadhaar(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 340987127712"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SBIN0004512"
                      value={bankIfsc}
                      onChange={(e) => setBankIfsc(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="form-footer" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading} style={{ background: 'var(--green)', borderColor: 'var(--green)' }}>
                  {loading ? 'Saving...' : editingFarmer ? 'Update Farmer' : 'Register Farmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      , document.body)}
    </div>
  );
}
