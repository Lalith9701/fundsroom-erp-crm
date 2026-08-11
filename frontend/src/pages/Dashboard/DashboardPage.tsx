import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../../services/dashboard.service';
import { SummaryCard } from '../../components/SummaryCard';
import { Badge } from '../../components/Badge';
import { Users, Package, AlertTriangle, FileText, ArrowRight, CheckCircle, Clock } from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getStats();
      if (res.success) {
        setStats(res.data);
      }
    } catch (err: any) {
      setError('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>Loading dashboard metrics...</div>;
  }

  if (error || !stats) {
    return (
      <div className="card" style={{ textAlign: 'center', color: '#ef4444' }}>
        <p>{error || 'Unable to connect to ERP server'}</p>
        <button className="btn btn-secondary btn-sm" style={{ marginTop: '1rem' }} onClick={fetchStats}>
          Retry
        </button>
      </div>
    );
  }

  const { metrics, lowStockProducts, recentChallans } = stats;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Real-time overview of CRM, Products, Inventory levels, and Sales Challans
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="metrics-grid">
        <SummaryCard
          title="Total CRM Customers"
          value={metrics.totalCustomers}
          icon={<Users size={24} />}
          bgColor="#e0e7ff"
          iconColor="#4f46e5"
        />

        <SummaryCard
          title="Total Products"
          value={metrics.totalProducts}
          icon={<Package size={24} />}
          bgColor="#dbeafe"
          iconColor="#2563eb"
        />

        <SummaryCard
          title="Low-Stock Alerts"
          value={metrics.lowStockProductsCount}
          icon={<AlertTriangle size={24} />}
          bgColor="#fef3c7"
          iconColor="#d97706"
          subtitle={metrics.lowStockProductsCount > 0 ? 'Requires stock replenishment' : 'All stocks healthy'}
        />

        <SummaryCard
          title="Total Sales Challans"
          value={metrics.totalChallans}
          icon={<FileText size={24} />}
          bgColor="#d1fae5"
          iconColor="#059669"
          subtitle={`${metrics.draftChallans} Draft | ${metrics.confirmedChallans} Confirmed`}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        {/* Low Stock Alerts */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <AlertTriangle size={20} color="#d97706" />
              <span>Low-Stock Inventory Alerts</span>
            </div>
            <Link to="/products?lowStockOnly=true" className="btn btn-secondary btn-sm">
              View Products <ArrowRight size={14} />
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#10b981', background: '#f0fdf4', borderRadius: '8px' }}>
              <CheckCircle size={28} style={{ marginBottom: '0.5rem' }} />
              <div>No low-stock items detected! All product stocks are above minimum alert thresholds.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Product / SKU</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Alert</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p: any) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.sku}</div>
                      </td>
                      <td>{p.category}</td>
                      <td>
                        <Badge variant="danger">{p.currentStock} units</Badge>
                      </td>
                      <td style={{ color: '#64748b' }}>{p.minStockAlert} units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Challans */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <Clock size={20} color="#4f46e5" />
              <span>Recent Sales Challans</span>
            </div>
            <Link to="/challans" className="btn btn-secondary btn-sm">
              All Challans <ArrowRight size={14} />
            </Link>
          </div>

          {recentChallans.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              No sales challans generated yet.
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Challan No</th>
                    <th>Customer</th>
                    <th>Total Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentChallans.map((c: any) => (
                    <tr key={c.id}>
                      <td>
                        <Link to={`/challans/${c.id}`} style={{ color: '#4f46e5', fontWeight: 600 }}>
                          {c.challanNumber}
                        </Link>
                      </td>
                      <td>
                        <div>{c.customer?.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{c.customer?.businessName}</div>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.totalQuantity} items</td>
                      <td>
                        <Badge
                          variant={
                            c.status === 'CONFIRMED'
                              ? 'success'
                              : c.status === 'DRAFT'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {c.status}
                        </Badge>
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
  );
};
