import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { challanService } from '../../services/challan.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Printer, FileText, User, Calendar, ShieldCheck } from 'lucide-react';

export const ChallanDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { hasRole } = useAuth();
  const canConfirm = hasRole(['ADMIN', 'SALES']);

  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (id) fetchChallanDetails();
  }, [id]);

  const fetchChallanDetails = async () => {
    try {
      setLoading(true);
      const res = await challanService.getById(id!);
      if (res.success) {
        setChallan(res.data);
      }
    } catch (err: any) {
      setError('Failed to load sales challan details');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmChallan = async () => {
    if (!window.confirm(`Are you sure you want to CONFIRM Sales Challan ${challan.challanNumber}? This will deduct inventory stock for all products.`)) {
      return;
    }

    setError(null);
    setSuccessMsg(null);
    setConfirming(true);

    try {
      const res = await challanService.confirm(id!);
      if (res.success) {
        setSuccessMsg(`Challan ${challan.challanNumber} confirmed successfully! Inventory stock deducted and OUT movements created.`);
        fetchChallanDetails();
      }
    } catch (err: any) {
      const message = err.response?.data?.message || 'Error confirming sales challan';
      setError(message);
    } finally {
      setConfirming(false);
    }
  };

  const handleCancelChallan = async () => {
    if (!window.confirm(`Cancel draft challan ${challan.challanNumber}?`)) return;

    try {
      const res = await challanService.cancel(id!);
      if (res.success) {
        fetchChallanDetails();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error cancelling challan');
    }
  };

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading challan data...</div>;
  if (error && !challan) return <div className="card" style={{ color: '#ef4444' }}>{error}</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'DRAFT': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  const calculateTotalVal = () => {
    if (!challan?.items) return 0;
    return challan.items.reduce((acc: number, item: any) => acc + item.unitPriceSnapshot * item.quantity, 0);
  };

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Sales Challans List
        </Link>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <AlertCircle size={22} color="#dc2626" />
          <div>
            <strong style={{ fontSize: '0.95rem' }}>Stock Confirmation Failed (HTTP 400 Bad Request)</strong>
            <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>{error}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div
          style={{
            backgroundColor: '#d1fae5',
            border: '1px solid #6ee7b7',
            color: '#065f46',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <CheckCircle2 size={22} color="#059669" />
          <div style={{ fontSize: '0.9rem' }}>{successMsg}</div>
        </div>
      )}

      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h1 className="page-title">{challan.challanNumber}</h1>
            <Badge variant={getStatusBadge(challan.status)}>{challan.status}</Badge>
          </div>
          <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sales Delivery Challan Document
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={16} /> Print Challan
          </button>

          {challan.status === 'DRAFT' && canConfirm && (
            <>
              <button className="btn btn-danger" onClick={handleCancelChallan}>
                <XCircle size={16} /> Cancel Draft
              </button>

              <button className="btn btn-success" onClick={handleConfirmChallan} disabled={confirming}>
                <ShieldCheck size={18} /> {confirming ? 'Checking Stock & Confirming...' : 'Confirm Challan & Deduct Stock'}
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Customer & Document Meta Card */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Customer Information
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Customer Name</div>
              <div style={{ fontWeight: 700, color: '#4f46e5' }}>{challan.customer?.name}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Business Name</div>
              <div style={{ fontWeight: 600 }}>{challan.customer?.businessName}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Contact</div>
              <div>{challan.customer?.mobile} • {challan.customer?.email}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>GSTIN</div>
              <div style={{ fontFamily: 'monospace' }}>{challan.customer?.gstNumber || 'N/A'}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Shipping Address</div>
              <div>{challan.customer?.address}</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.5rem' }}>
            Challan Details & Metadata
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', fontSize: '0.9rem' }}>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Challan Reference</div>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{challan.challanNumber}</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Challan Status</div>
              <div style={{ marginTop: '2px' }}>
                <Badge variant={getStatusBadge(challan.status)}>{challan.status}</Badge>
              </div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Created By User</div>
              <div style={{ fontWeight: 600 }}>{challan.createdBy?.name} ({challan.createdBy?.role})</div>
            </div>
            <div>
              <div style={{ color: '#64748b', fontSize: '0.8rem' }}>Creation Timestamp</div>
              <div>{new Date(challan.createdAt).toLocaleString()}</div>
            </div>
          </div>

          {challan.status === 'DRAFT' && (
            <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: '#fef3c7', borderRadius: '8px', color: '#92400e', fontSize: '0.85rem' }}>
              <strong>DRAFT Status Notice:</strong> Inventory stock is NOT deducted while in DRAFT status. Clicking 'Confirm Challan' will verify product stock levels and deduct items atomically.
            </div>
          )}
          {challan.status === 'CONFIRMED' && (
            <div style={{ marginTop: '1.25rem', padding: '0.85rem', backgroundColor: '#d1fae5', borderRadius: '8px', color: '#065f46', fontSize: '0.85rem' }}>
              <strong>CONFIRMED Status Notice:</strong> Stock deduction has been processed atomically and logged under Stock Movements.
            </div>
          )}
        </div>
      </div>

      {/* Snapshot Items Table */}
      <div className="card">
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>
          Product Snapshot Items ({challan.items?.length || 0} line items)
        </h3>

        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Product Snapshot</th>
                <th>SKU Snapshot</th>
                <th>Current Live Stock</th>
                <th>Unit Price Snapshot</th>
                <th>Quantity</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {challan.items?.map((item: any) => {
                const subtotal = item.unitPriceSnapshot * item.quantity;
                return (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.productNameSnapshot}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{item.skuSnapshot}</td>
                    <td>
                      {item.product ? (
                        <span style={{ fontWeight: 600, color: item.product.currentStock >= item.quantity ? '#059669' : '#dc2626' }}>
                          {item.product.currentStock} available
                        </span>
                      ) : (
                        <span style={{ color: '#94a3b8' }}>-</span>
                      )}
                    </td>
                    <td>₹{parseFloat(item.unitPriceSnapshot).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                    <td style={{ fontWeight: 700 }}>{item.quantity} units</td>
                    <td style={{ fontWeight: 700, color: '#0f172a' }}>
                      ₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            backgroundColor: '#f8fafc',
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.95rem', color: '#64748b' }}>
            Total Items Count: <strong>{challan.totalQuantity} items</strong>
          </div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a' }}>
            Total Challan Value: ₹{calculateTotalVal().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>
    </div>
  );
};
