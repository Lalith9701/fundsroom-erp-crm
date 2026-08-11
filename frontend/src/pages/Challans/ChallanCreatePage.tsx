import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { challanService } from '../../services/challan.service';
import { customerService } from '../../services/customer.service';
import { productService } from '../../services/product.service';
import { ArrowLeft, Plus, Trash2, Save, AlertCircle } from 'lucide-react';

interface ChallanRow {
  productId: string;
  quantity: number;
}

export const ChallanCreatePage: React.FC = () => {
  const navigate = useNavigate();

  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [rows, setRows] = useState<ChallanRow[]>([{ productId: '', quantity: 1 }]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [custRes, prodRes] = await Promise.all([
        customerService.getAll({ limit: 100 }),
        productService.getAll({ limit: 100 }),
      ]);
      if (custRes.success) setCustomers(custRes.data.items);
      if (prodRes.success) setProducts(prodRes.data.items);
    } catch (err) {
      console.error('Error fetching customers/products for challan:', err);
    }
  };

  const productMap = new Map(products.map((p) => [p.id, p]));

  const addRow = () => {
    setRows([...rows, { productId: '', quantity: 1 }]);
  };

  const removeRow = (index: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const updateRow = (index: number, field: keyof ChallanRow, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    setRows(newRows);
  };

  const calculateGrandTotal = () => {
    let totalQty = 0;
    let totalPrice = 0;

    for (const r of rows) {
      const prod = productMap.get(r.productId);
      const qty = Number(r.quantity) || 0;
      totalQty += qty;
      if (prod) {
        totalPrice += prod.unitPrice * qty;
      }
    }

    return { totalQty, totalPrice };
  };

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCustomerId) {
      setError('Please select a customer account');
      return;
    }

    const validRows = rows.filter((r) => r.productId && r.quantity > 0);
    if (validRows.length === 0) {
      setError('Please add at least one valid product line item with quantity > 0');
      return;
    }

    try {
      setLoading(true);
      const res = await challanService.create({
        customerId: selectedCustomerId,
        items: validRows.map((r) => ({
          productId: r.productId,
          quantity: Number(r.quantity),
        })),
      });

      if (res.success) {
        navigate(`/challans/${res.data.id}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create sales challan');
    } finally {
      setLoading(false);
    }
  };

  const { totalQty, totalPrice } = calculateGrandTotal();

  return (
    <div>
      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/challans" className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Sales Challans
        </Link>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">Generate New Sales Challan</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Draft a new sales delivery challan with real-time product price snapshots
          </p>
        </div>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #fca5a5',
            color: '#991b1b',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveDraft}>
        {/* Customer Select Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem' }}>1. Select Customer</h3>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Customer Account *</label>
            <select
              className="form-select"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.businessName}) • {c.customerType} • GST: {c.gstNumber || 'N/A'}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Items Table Card */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>2. Add Product Line Items</h3>
            <button type="button" className="btn btn-secondary btn-sm" onClick={addRow}>
              <Plus size={16} /> Add Product Line
            </button>
          </div>

          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product Item</th>
                  <th>Available Stock</th>
                  <th>Unit Price (INR)</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th>Line Total</th>
                  <th style={{ width: '60px' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const product = productMap.get(row.productId);
                  const lineTotal = product ? product.unitPrice * row.quantity : 0;
                  return (
                    <tr key={idx}>
                      <td>
                        <select
                          className="form-select"
                          value={row.productId}
                          onChange={(e) => updateRow(idx, 'productId', e.target.value)}
                          required
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.sku})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {product ? (
                          <span style={{ fontWeight: 600, color: product.currentStock > 0 ? '#059669' : '#dc2626' }}>
                            {product.currentStock} units
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        {product ? (
                          <span>₹{parseFloat(product.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          className="form-input"
                          value={row.quantity}
                          onChange={(e) => updateRow(idx, 'quantity', Math.max(1, parseInt(e.target.value, 10) || 1))}
                          required
                        />
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={rows.length === 1}
                          onClick={() => removeRow(idx)}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
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
            <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
              Total Quantity: <strong>{totalQty} items</strong> across {rows.length} line items
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Estimated Total Value: ₹{totalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Link to="/challans" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Saving Draft...' : 'Save Draft Challan'}
          </button>
        </div>
      </form>
    </div>
  );
};
