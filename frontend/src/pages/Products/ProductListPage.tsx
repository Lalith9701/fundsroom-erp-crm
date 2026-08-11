import React, { useState, useEffect } from 'react';
import { productService } from '../../services/product.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { Modal } from '../../components/Modal';
import { Plus, Search, AlertTriangle, Edit2, Package, MapPin, Tag } from 'lucide-react';

export const ProductListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canManageProducts = hasRole(['ADMIN', 'WAREHOUSE']);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: '',
    currentStock: '0',
    minStockAlert: '5',
    warehouseLocation: '',
  });

  useEffect(() => {
    fetchProducts();
  }, [page, search, categoryFilter, lowStockOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await productService.getAll({
        page,
        limit: 10,
        search,
        category: categoryFilter || undefined,
        lowStockOnly,
      });
      if (res.success) {
        setProducts(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch (err: any) {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await productService.create(formData);
      if (res.success) {
        setIsAddModalOpen(false);
        resetForm();
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error creating product');
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    try {
      const res = await productService.update(selectedProduct.id, formData);
      if (res.success) {
        setIsEditModalOpen(false);
        setSelectedProduct(null);
        resetForm();
        fetchProducts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error updating product');
    }
  };

  const openEditModal = (p: any) => {
    setSelectedProduct(p);
    setFormData({
      name: p.name || '',
      sku: p.sku || '',
      category: p.category || '',
      unitPrice: p.unitPrice?.toString() || '0',
      currentStock: p.currentStock?.toString() || '0',
      minStockAlert: p.minStockAlert?.toString() || '5',
      warehouseLocation: p.warehouseLocation || '',
    });
    setIsEditModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      category: '',
      unitPrice: '',
      currentStock: '0',
      minStockAlert: '5',
      warehouseLocation: '',
    });
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Product Catalog</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Manage inventory items, prices, warehouse locations, and minimum alert thresholds
          </p>
        </div>

        {canManageProducts && (
          <button className="btn btn-primary" onClick={() => { resetForm(); setIsAddModalOpen(true); }}>
            <Plus size={18} /> Add New Product
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: 10, color: '#94a3b8' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search product name, SKU, category, rack location..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <button
          className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
          onClick={() => { setLowStockOnly(!lowStockOnly); setPage(1); }}
        >
          <AlertTriangle size={16} /> {lowStockOnly ? 'Showing Low-Stock Only' : 'Filter Low-Stock'}
        </button>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading products...</div>
      ) : products.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No products found.
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU Code</th>
                  <th>Category</th>
                  <th>Unit Price (INR)</th>
                  <th>Current Stock</th>
                  <th>Min Alert</th>
                  <th>Warehouse Location</th>
                  {canManageProducts && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const isLowStock = p.currentStock <= p.minStockAlert;
                  return (
                    <tr key={p.id} style={{ backgroundColor: isLowStock ? '#fffbeb' : undefined }}>
                      <td>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                        {isLowStock && (
                          <div style={{ fontSize: '0.75rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> Low Stock Warning
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.sku}</td>
                      <td>
                        <Badge variant="info">{p.category}</Badge>
                      </td>
                      <td style={{ fontWeight: 700, color: '#0f172a' }}>
                        ₹{parseFloat(p.unitPrice).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td>
                        <Badge variant={isLowStock ? 'danger' : 'success'}>
                          {p.currentStock} units
                        </Badge>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.minStockAlert} units</td>
                      <td style={{ fontSize: '0.85rem' }}>
                        <MapPin size={14} color="#64748b" style={{ verticalAlign: 'middle' }} /> {p.warehouseLocation}
                      </td>
                      {canManageProducts && (
                        <td>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(p)} title="Edit Product">
                            <Edit2 size={14} /> Edit
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
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

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        title="Add New Product"
        onClose={() => setIsAddModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateProduct}>
              Save Product
            </button>
          </>
        }
      >
        <form onSubmit={handleCreateProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Copper Cable 100m"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU / Item Code *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. CAB-COP-100"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Electrical, Hardware"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="0.00"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Initial Stock</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.currentStock}
                onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Min Stock Alert Qty</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse Location *</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Rack A-12"
                value={formData.warehouseLocation}
                onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                required
              />
            </div>
          </div>
        </form>
      </Modal>

      {/* Edit Product Modal */}
      <Modal
        isOpen={isEditModalOpen}
        title={`Edit Product - ${selectedProduct?.name}`}
        onClose={() => setIsEditModalOpen(false)}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleUpdateProduct}>
              Save Changes
            </button>
          </>
        }
      >
        <form onSubmit={handleUpdateProduct}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Product Name *</label>
              <input
                type="text"
                className="form-input"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">SKU / Item Code *</label>
              <input
                type="text"
                className="form-input"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (INR) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Min Stock Alert Threshold</label>
              <input
                type="number"
                min="0"
                className="form-input"
                value={formData.minStockAlert}
                onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Warehouse Rack Location *</label>
              <input
                type="text"
                className="form-input"
                value={formData.warehouseLocation}
                onChange={(e) => setFormData({ ...formData, warehouseLocation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px' }}>
            Note: Current stock level cannot be altered directly via product details. To add or adjust inventory stock, use the <strong>Inventory & Stock Movements</strong> module.
          </div>
        </form>
      </Modal>
    </div>
  );
};
