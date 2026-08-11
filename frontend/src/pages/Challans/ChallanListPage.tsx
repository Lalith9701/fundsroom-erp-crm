import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { challanService } from '../../services/challan.service';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../../components/Badge';
import { Pagination } from '../../components/Pagination';
import { Plus, Search, Eye, FileText } from 'lucide-react';

export const ChallanListPage: React.FC = () => {
  const { hasRole } = useAuth();
  const canCreateChallan = hasRole(['ADMIN', 'SALES']);

  const [challans, setChallans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchChallans();
  }, [page, search, statusFilter]);

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const res = await challanService.getAll({
        page,
        limit: 10,
        search,
        status: statusFilter || undefined,
      });
      if (res.success) {
        setChallans(res.data.items);
        setTotalPages(res.data.pagination.totalPages);
        setTotalItems(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'success';
      case 'DRAFT': return 'warning';
      case 'CANCELLED': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Challans Management</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Generate draft sales challans, review product stock snapshots, and confirm delivery orders
          </p>
        </div>

        {canCreateChallan && (
          <Link to="/challans/create" className="btn btn-primary">
            <Plus size={18} /> Create New Sales Challan
          </Link>
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
            placeholder="Search by Challan Number, Customer Name, Business..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">DRAFT</option>
          <option value="CONFIRMED">CONFIRMED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>
      </div>

      {/* Challans Table */}
      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading sales challans...</div>
      ) : challans.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          No sales challans recorded.
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Challan Number</th>
                  <th>Customer Account</th>
                  <th>Total Quantity</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {challans.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/challans/${c.id}`} style={{ fontWeight: 700, color: '#4f46e5' }}>
                        {c.challanNumber}
                      </Link>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.customer?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.customer?.businessName}</div>
                    </td>
                    <td style={{ fontWeight: 700 }}>{c.totalQuantity} items ({c._count?.items || 0} line items)</td>
                    <td>
                      <Badge variant={getStatusBadge(c.status)}>{c.status}</Badge>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 600 }}>{c.createdBy?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.createdBy?.role}</div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: '#64748b' }}>
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <Link to={`/challans/${c.id}`} className="btn btn-secondary btn-sm">
                        <Eye size={14} /> View
                      </Link>
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
    </div>
  );
};
