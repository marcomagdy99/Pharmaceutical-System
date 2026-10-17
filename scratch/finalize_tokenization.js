const fs = require('fs');

// 1. Process users.css
let usersCss = fs.readFileSync('css/users.css', 'utf8');

// Replace standard tokens to clean var(--name)
usersCss = usersCss
  .replace(/var\(--surface-card,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-card)')
  .replace(/var\(--surface-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-subtle)')
  .replace(/var\(--surface-hover,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-hover)')
  .replace(/var\(--surface-body,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-body)')
  .replace(/var\(--border-main,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-main)')
  .replace(/var\(--border-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-subtle)')
  .replace(/var\(--border-color,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-color)')
  .replace(/var\(--text-primary,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-primary)')
  .replace(/var\(--text-secondary,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-secondary)')
  .replace(/var\(--text-muted,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-muted)')
  .replace(/var\(--white,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--white)')
  .replace(/var\(--primary,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--primary)')
  .replace(/var\(--success,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--success)')
  .replace(/var\(--danger,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--danger)')
  .replace(/var\(--role-gm,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--role-gm)')
  .replace(/var\(--role-bu,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--role-bu)')
  .replace(/var\(--role-pm,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--role-pm)')
  .replace(/var\(--role-hr,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--role-hr)')
  .replace(/var\(--purple-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--purple-subtle)')
  .replace(/var\(--purple-text,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--purple-text)')
  .replace(/var\(--purple-border,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--purple-border)')
  .replace(/var\(--primary-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--primary-subtle)')
  .replace(/var\(--danger-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--danger-subtle)')
  .replace(/var\(--warning-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--warning-subtle)')
  .replace(/var\(--info-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--info-subtle)');

fs.writeFileSync('css/users.css', usersCss, 'utf8');

// 2. Process activities.css
let actCss = fs.readFileSync('css/activities.css', 'utf8');

// Status pill tokens
actCss = actCss
  .replace(/background:\s*#fef3c7;/g, 'background: var(--warning-subtle);')
  .replace(/background:\s*#fee2e2;/g, 'background: var(--danger-subtle);')
  .replace(/background:\s*#e0e7ff;/g, 'background: var(--primary-subtle);')
  .replace(/background:\s*#dcfce7;/g, 'background: var(--success-subtle);')
  .replace(/background:\s*#d1fae5;/g, 'background: var(--success-subtle);');

// Common buttons / colors
actCss = actCss
  .replace(/var\(--primary,\s*#2563eb\)/g, 'var(--primary)')
  .replace(/var\(--success,\s*#10b981\)/g, 'var(--success)')
  .replace(/var\(--danger,\s*#ef4444\)/g, 'var(--danger)')
  .replace(/var\(--border-color,\s*#e2e8f0\)/g, 'var(--border-main)')
  .replace(/var\(--border-color,\s*#cbd5e1\)/g, 'var(--border-color)')
  .replace(/var\(--gray-300,\s*#cbd5e1\)/g, 'var(--border-color)')
  .replace(/var\(--surface,\s*#ffffff\)/g, 'var(--surface-card)')
  .replace(/var\(--surface-dim,\s*#f8fafc\)/g, 'var(--surface-subtle)')
  .replace(/var\(--surface-dim,\s*#f1f5f9\)/g, 'var(--surface-hover)')
  .replace(/var\(--gray-50,\s*#f8fafc\)/g, 'var(--surface-subtle)')
  .replace(/var\(--gray-100,\s*#f1f5f9\)/g, 'var(--surface-hover)')
  .replace(/var\(--gray-800,\s*#1e293b\)/g, 'var(--text-primary)')
  .replace(/var\(--text-color,\s*#1e293b\)/g, 'var(--text-primary)')
  .replace(/var\(--gray-500,\s*#64748b\)/g, 'var(--text-muted)')
  .replace(/var\(--gray-600,\s*#64748b\)/g, 'var(--text-muted)')
  .replace(/var\(--text-muted,\s*#64748b\)/g, 'var(--text-muted)')
  .replace(/var\(--gray-700,\s*#334155\)/g, 'var(--text-secondary)')
  .replace(/var\(--text-color,\s*#334155\)/g, 'var(--text-secondary)')
  .replace(/var\(--gray-600,\s*#475569\)/g, 'var(--text-secondary)')
  .replace(/var\(--text-muted,\s*#475569\)/g, 'var(--text-secondary)');

// Strip existing token fallbacks
actCss = actCss
  .replace(/var\(--surface-card,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-card)')
  .replace(/var\(--surface-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-subtle)')
  .replace(/var\(--surface-hover,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-hover)')
  .replace(/var\(--surface-body,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--surface-body)')
  .replace(/var\(--border-main,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-main)')
  .replace(/var\(--border-subtle,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-subtle)')
  .replace(/var\(--border-color,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--border-color)')
  .replace(/var\(--text-primary,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-primary)')
  .replace(/var\(--text-secondary,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-secondary)')
  .replace(/var\(--text-muted,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--text-muted)')
  .replace(/var\(--white,\s*#[0-9a-fA-F]{3,8}\)/g, 'var(--white)');

fs.writeFileSync('css/activities.css', actCss, 'utf8');

console.log('Finalized tokenization in users.css and activities.css');
