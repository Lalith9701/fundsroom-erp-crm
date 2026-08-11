import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Package, Warehouse, FileText, Building2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
          }}
        >
          <Building2 size={22} />
        </div>
        <div>
          <div className="sidebar-brand-title">Fundsroom ERP</div>
          <div className="sidebar-brand-subtitle">CRM & Distribution Portal</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <NavLink
          to="/dashboard"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <LayoutDashboard size={18} />
          <span>Dashboard</span>
        </NavLink>

        <NavLink
          to="/customers"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Customers CRM</span>
        </NavLink>

        <NavLink
          to="/products"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Package size={18} />
          <span>Product Catalog</span>
        </NavLink>

        <NavLink
          to="/inventory"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <Warehouse size={18} />
          <span>Inventory & Stock</span>
        </NavLink>

        <NavLink
          to="/challans"
          className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
        >
          <FileText size={18} />
          <span>Sales Challans</span>
        </NavLink>
      </nav>

      <div
        style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid #1e293b',
          fontSize: '0.8rem',
          color: '#94a3b8',
        }}
      >
        <div>Signed in as:</div>
        <div style={{ color: '#ffffff', fontWeight: 600, marginTop: '2px' }}>{user?.name}</div>
        <div style={{ color: '#818cf8', fontWeight: 500, fontSize: '0.75rem' }}>Role: {user?.role}</div>
      </div>
    </aside>
  );
};
