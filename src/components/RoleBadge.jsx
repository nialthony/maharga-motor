import React from 'react';
import ownerLogo from '../assets/Owner.png';
import adminLogo from '../assets/Admin.png';
import salesLogo from '../assets/Sales.png';
import mekanikLogo from '../assets/Mekanik.png';

const ROLE_LOGOS = {
  owner: ownerLogo,
  admin: adminLogo,
  sales: salesLogo,
  mechanic: mekanikLogo,
  mekanik: mekanikLogo
};

const getRoleLogoUrl = (role) => {
  const normalized = (role || '').toLowerCase().trim();
  return ROLE_LOGOS[normalized] || ROLE_LOGOS.sales;
};

export default function RoleBadge({ role, className = 'h-5 sm:h-6', alt }) {
  const logoSrc = getRoleLogoUrl(role);
  const roleName = (role || 'Staf').toUpperCase();

  return (
    <img 
      src={logoSrc} 
      alt={alt || `Role: ${roleName}`} 
      title={`Role: ${roleName}`}
      className={`inline-block object-contain select-none transition-transform hover:scale-105 ${className}`}
      loading="lazy"
    />
  );
}
