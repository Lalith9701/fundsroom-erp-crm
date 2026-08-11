import React, { useState, useEffect } from 'react';
import { inventoryService } from '../../services/inventory.service';
import { productService } from '../../services/product.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { ArrowDownRight, ArrowUpRight, Plus, Warehouse, History } from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canAdjustStock = hasRole(['ADMIN', 'WAREHOUSE']);

  const [movements, setMovements] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [typeFilter, setTypeFilter] = useState<'IN' | 'OUT' | ''>('');
  const [productFilter, setProductFilter] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '1',
    movementType: 'IN' as 'IN' | 'OUT',
    reason: '',
  });

  useEffect(() => {
    fetchMovements();
    fetchProductList();
  }, [page, typeFilter, productFilter]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      const res = await inventoryService.getMovements({
        page,
        limit: 10,
        movementType: typeFilter || undefined,
        productId: productFilter || undefined,
      });
      if (res.success) {
        setMovements(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Error loading stock movements:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductList = async () => {
    try {
      const res = await productService.getAll({ limit: 100 });
      if (res.success) {
        setProducts(res.data.items);
      }
    } catch (err) {
      console.error('Error fetching product dropdown:', err);
    }
  };

  const handleStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productId || !formData.reason) return;

    try {
      const res = await inventoryService.createMovement({
        productId: formData.productId,
        quantity: parseInt(formData.quantity, 10),
        movementType: formData.movementType,
        reason: formData.reason,
      });

      if (res.success) {
        setIsModalOpen(false);
        setFormData({ productId: '', quantity: '1', movementType: 'IN', reason: '' });
        fetchMovements();
        fetchProductList();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error executing stock adjustment');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory & Stock Movement Logs</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Audit trail of all inventory IN (Receive) and OUT (Dispatch) operations
          </p>
        </div>

        {canAdjustStock && (
          <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={18} /> Record Stock Movement
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <select
          className="form-select"
          style={{ width: '220px' }}
          value={productFilter}
          onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.sku})
            </option>
          ))}
        </select>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value as any); setPage(1); }}
        >
          <option value="">All Movement Types</option>
          <option value="IN">IN (Stock Added)</option>
          <option value="OUT">OUT (Stock Dispatched)</option>
        </select>
      </div>

      {/* Movements Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading inventory audit trail...</div>
      ) : movements.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No stock movement logs recorded.
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Product / SKU</th>
                  <th>Type</th>
                  <th>Quantity Changed</th>
                  <th>Reason / Ref</th>
                  <th>Logged By</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td style={{ fontSize: '0.85rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(m.createdAt).toLocaleString()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{m.product?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.product?.sku}</div>
                    </td>
                    <td>
                      <Badge variant={m.movementType === 'IN' ? 'success' : 'danger'}>
                        {m.movementType === 'IN' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />} {m.movementType}
                      </Badge>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '1rem' }}>
                      <span style={{ color: m.movementType === 'IN' ? '#059669' : '#dc2626' }}>
                        {m.movementType === 'IN' ? '+' : '-'}{m.quantity} units
                      </span>
                    </td>
                    <td style={{ fontSize: '0.9rem', color: '#334155' }}>{m.reason}</td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{m.createdBy?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.createdBy?.role}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={(newPage) => setPage(newPage)}
          />
        </>
      )}

      {/* Record Movement Modal */}
      <Modal
        isOpen={isModalOpen}
        title="Record Manual Stock Movement"
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleStockAdjustment}>
              Post Movement
            </button>
          </>
        }
      >
        <form onSubmit={handleStockAdjustment}>
          <div className="form-group">
            <label className="form-label">Select Product *</label>
            <select
              className="form-select"
              value={formData.productId}
              onChange={(e) => setFormData({ ...formData, productId: e.target.value })}
              required
            >
              <option value="">-- Choose Product --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku} | Available Stock: {p.currentStock})
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Movement Type *</label>
              <select
                className="form-select"
                value={formData.movementType}
                onChange={(e) => setFormData({ ...formData, movementType: e.target.value as any })}
              >
                <option value="IN">IN (Receive / Purchase)</option>
                <option value="OUT">OUT (Dispatch / Adjustment)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quantity *</label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reason / Reference Note *</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="e.g. PO-8941 Received from vendor, Damaged stock write-off, Warehouse transfer..."
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
