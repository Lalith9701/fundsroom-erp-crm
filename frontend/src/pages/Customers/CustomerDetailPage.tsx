import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { customerService } from '../../services/customer.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Modal } from '../../components/Modal';
import { ArrowLeft, Phone, Mail, Building, MapPin, Calendar, FileText, Plus, MessageSquare, Shield } from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();

  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Follow-up modal
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const canAddFollowUp = hasRole(['ADMIN', 'SALES']);

  useEffect(() => {
    if (id) fetchCustomerDetails();
  }, [id]);

  const fetchCustomerDetails = async () => {
    try {
      setLoading(true);
      const res = await customerService.getById(id!);
      if (res.success) {
        setCustomer(res.data);
      }
    } catch (err: any) {
      setError('Failed to fetch customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpNotes.trim()) return;

    try {
      const res = await customerService.addFollowUp(id!, {
        notes: followUpNotes,
        followUpDate: followUpDate || undefined,
      });

      if (res.success) {
        setIsFollowUpModalOpen(false);
        setFollowUpNotes('');
        setFollowUpDate('');
        fetchCustomerDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error adding follow-up note');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading customer details...</div>;
  if (error || !customer) return <div className="card" style={{ color: '#ef4444' }}>{error || 'Customer not found'}</div>;

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/customers" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Customer List
        </Link>
      </div>

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{customer.name}</h1>
            <Badge variant={customer.status === 'ACTIVE' ? 'success' : customer.status === 'LEAD' ? 'warning' : 'danger'}>
              {customer.status}
            </Badge>
            <Badge variant="info">{customer.customerType}</Badge>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            {customer.businessName} • GST: {customer.gstNumber || 'N/A'}
          </p>
        </div>

        {canAddFollowUp && (
          <button className="btn btn-primary" onClick={() => setIsFollowUpModalOpen(true)}>
            <Plus size={18} /> Add Follow-up Note
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
        {/* Left Column: Customer Profile */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', color: '#0f172a' }}>
            Customer Profile
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Phone size={14} /> Mobile Phone
              </div>
              <div style={{ fontWeight: 600 }}>{customer.mobile}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Mail size={14} /> Email Address
              </div>
              <div style={{ fontWeight: 600 }}>{customer.email}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Building size={14} /> Business Entity
              </div>
              <div style={{ fontWeight: 600 }}>{customer.businessName}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Shield size={14} /> GSTIN
              </div>
              <div style={{ fontWeight: 600, fontFamily: 'monospace' }}>{customer.gstNumber || 'Not Registered'}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={14} /> Billing / Shipping Address
              </div>
              <div style={{ fontWeight: 500 }}>{customer.address}</div>
            </div>

            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} /> Scheduled Follow-up Date
              </div>
              <div style={{ fontWeight: 600, color: '#4f46e5' }}>
                {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'No follow-up set'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Follow-up Activity Timeline & Recent Challans */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Follow-up Notes Log */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
              <MessageSquare size={18} color="#4f46e5" />
              <span>CRM Follow-up History ({customer.followups?.length || 0})</span>
            </div>

            {(!customer.followups || customer.followups.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                No follow-up entries logged yet for this customer account.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {customer.followups.map((f: any) => (
                  <div
                    key={f.id}
                    style={{
                      padding: '1rem',
                      borderLeft: '4px solid #4f46e5',
                      backgroundColor: '#f8fafc',
                      borderRadius: '0 8px 8px 0',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: '#0f172a' }}>
                        Logged by {f.createdBy?.name} ({f.createdBy?.role})
                      </span>
                      <span style={{ color: '#64748b' }}>
                        {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#334155', whiteSpace: 'pre-wrap' }}>{f.notes}</div>
                    <div style={{ fontSize: '0.75rem', color: '#818cf8', marginTop: '0.4rem' }}>
                      Follow-up date: {new Date(f.followUpDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Sales Challans */}
          <div className="card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, marginBottom: '1rem' }}>
              <FileText size={18} color="#059669" />
              <span>Associated Sales Challans ({customer.challans?.length || 0})</span>
            </div>

            {(!customer.challans || customer.challans.length === 0) ? (
              <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b', background: '#f8fafc', borderRadius: '8px' }}>
                No sales challans recorded for this customer yet.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Challan No</th>
                      <th>Total Quantity</th>
                      <th>Status</th>
                      <th>Created Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customer.challans.map((ch: any) => (
                      <tr key={ch.id}>
                        <td>
                          <Link to={`/challans/${ch.id}`} style={{ fontWeight: 600, color: '#4f46e5' }}>
                            {ch.challanNumber}
                          </Link>
                        </td>
                        <td>{ch.totalQuantity} items</td>
                        <td>
                          <Badge variant={ch.status === 'CONFIRMED' ? 'success' : ch.status === 'DRAFT' ? 'warning' : 'danger'}>
                            {ch.status}
                          </Badge>
                        </td>
                        <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          {new Date(ch.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Followup Modal */}
      <Modal
        isOpen={isFollowUpModalOpen}
        title={`Log CRM Follow-up Note for ${customer.name}`}
        onClose={() => setIsFollowUpModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsFollowUpModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleAddFollowUp}>
              Save Follow-up Note
            </button>
          </>
        }
      >
        <form onSubmit={handleAddFollowUp}>
          <div className="form-group">
            <label className="form-label">Follow-up Notes / Discussion Details *</label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Record discussion details, next steps, order commitments, or meeting notes..."
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Next Scheduled Follow-up Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
