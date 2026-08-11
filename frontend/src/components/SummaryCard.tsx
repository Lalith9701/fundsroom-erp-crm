import React from 'react';

interface SummaryCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  bgColor?: string;
  iconColor?: string;
  subtitle?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  icon,
  bgColor = '#eeef2a15',
  iconColor = '#4f46e5',
  subtitle,
}) => {
  return (
    <div className="metric-card">
      <div className="metric-icon-wrapper" style={{ backgroundColor: bgColor, color: iconColor }}>
        {icon}
      </div>
      <div>
        <div className="metric-value">{value}</div>
        <div className="metric-label">{title}</div>
        {subtitle && <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '2px' }}>{subtitle}</div>}
      </div>
    </div>
  );
};
