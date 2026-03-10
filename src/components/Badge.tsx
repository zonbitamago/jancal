import React from 'react';

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = 'rgba(255,255,255,0.2)',
  textColor = '#fff',
}) => (
  <span style={{
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 12,
    background: color,
    color: textColor,
    fontSize: 12,
    fontWeight: 600,
    border: `1px solid ${textColor}4D`,
  }}>
    {label}
  </span>
);
