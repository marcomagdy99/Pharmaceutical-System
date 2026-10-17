const fs = require('fs');

function refactorFile(filePath) {
  let css = fs.readFileSync(filePath, 'utf8');
  const initialMatches = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;

  // 1. Common Fallback Cleanups
  css = css
    // Surfaces
    .replace(/var\(--surface,\s*#ffffff\)/g, 'var(--surface-card)')
    .replace(/var\(--surface,\s*#fff\)/g, 'var(--surface-card)')
    .replace(/var\(--surface-dim,\s*#f8fafc\)/g, 'var(--surface-subtle)')
    .replace(/var\(--surface-dim,\s*#f8f9fa\)/g, 'var(--surface-subtle)')
    .replace(/var\(--surface-dim,\s*#f1f5f9\)/g, 'var(--surface-hover)')
    .replace(/var\(--gray-50,\s*#f8fafc\)/g, 'var(--surface-subtle)')
    .replace(/var\(--gray-50,\s*#f8f9fa\)/g, 'var(--surface-subtle)')
    .replace(/var\(--gray-100,\s*#f1f3f5\)/g, 'var(--surface-hover)')
    .replace(/var\(--gray-100,\s*#f1f5f9\)/g, 'var(--surface-hover)')
    .replace(/var\(--gray-100,\s*#f3f4f6\)/g, 'var(--surface-hover)')
    .replace(/var\(--white,\s*#ffffff\)/g, 'var(--white)')
    .replace(/var\(--white,\s*#fff\)/g, 'var(--white)')
    .replace(/var\(--white,\s*#1e2229\)/g, 'var(--surface-card)')
    
    // Borders
    .replace(/var\(--border-color,\s*#dee2e6\)/g, 'var(--border-main)')
    .replace(/var\(--border-color,\s*#e2e8f0\)/g, 'var(--border-main)')
    .replace(/var\(--border-color,\s*#cbd5e1\)/g, 'var(--border-color)')
    .replace(/var\(--gray-200,\s*#e9ecef\)/g, 'var(--border-main)')
    .replace(/var\(--gray-200,\s*#e2e8f0\)/g, 'var(--border-main)')
    .replace(/var\(--gray-200,\s*#2d3340\)/g, 'var(--border-main)')
    .replace(/var\(--gray-300,\s*#dee2e6\)/g, 'var(--border-main)')
    .replace(/var\(--gray-300,\s*#cbd5e1\)/g, 'var(--border-color)')
    .replace(/var\(--gray-300,\s*#d1d5db\)/g, 'var(--border-color)')
    .replace(/var\(--gray-300,\s*#3d4554\)/g, 'var(--border-subtle)')

    // Typography
    .replace(/var\(--gray-800,\s*#1e293b\)/g, 'var(--text-primary)')
    .replace(/var\(--gray-800,\s*#212529\)/g, 'var(--text-primary)')
    .replace(/var\(--gray-800,\s*#111827\)/g, 'var(--text-primary)')
    .replace(/var\(--text-color,\s*#1e293b\)/g, 'var(--text-primary)')
    .replace(/var\(--text-color,\s*#111827\)/g, 'var(--text-primary)')
    .replace(/var\(--text-color,\s*#334155\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-700,\s*#334155\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-700,\s*#343a40\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-700,\s*#374151\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#475569\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#495057\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#4b5563\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#64748b\)/g, 'var(--text-muted)')
    .replace(/var\(--gray-500,\s*#64748b\)/g, 'var(--text-muted)')
    .replace(/var\(--gray-500,\s*#6c757d\)/g, 'var(--text-muted)')
    .replace(/var\(--text-muted,\s*#64748b\)/g, 'var(--text-muted)')
    .replace(/var\(--text-muted,\s*#475569\)/g, 'var(--text-secondary)')

    // Brand & Status
    .replace(/var\(--primary,\s*#0d6efd\)/g, 'var(--primary)')
    .replace(/var\(--primary,\s*#2563eb\)/g, 'var(--primary)')
    .replace(/var\(--success,\s*#198754\)/g, 'var(--success)')
    .replace(/var\(--success,\s*#10b981\)/g, 'var(--success)')
    .replace(/var\(--danger,\s*#dc3545\)/g, 'var(--danger)')
    .replace(/var\(--danger,\s*#ef4444\)/g, 'var(--danger)')
    .replace(/var\(--warning,\s*#fd7e14\)/g, 'var(--warning)')
    .replace(/var\(--warning,\s*#f59e0b\)/g, 'var(--warning)')
    .replace(/var\(--purple,\s*#6f42c1\)/g, 'var(--role-bu)');

  // 2. Line by line processing for dark-mode and common patterns
  const lines = css.split(/\r?\n/);
  const isCRLF = css.includes('\r\n');
  const nl = isCRLF ? '\r\n' : '\n';

  let inDark = false;
  let braceDepth = 0;

  const processed = lines.map(line => {
    let l = line;
    if (l.includes('[data-theme="dark"]')) {
      inDark = true;
    }

    if (inDark) {
      if (l.includes('{')) braceDepth++;
      if (l.includes('}')) {
        braceDepth--;
        if (braceDepth <= 0) {
          inDark = false;
          braceDepth = 0;
        }
      }

      // Dark theme background tokens
      l = l.replace(/background:\s*#1e2229;/g, 'background: var(--surface-card);');
      l = l.replace(/background-color:\s*#1e2229;/g, 'background-color: var(--surface-card);');
      l = l.replace(/background:\s*#1e242e;/g, 'background: var(--surface-card);');
      l = l.replace(/background-color:\s*#1e242e;/g, 'background-color: var(--surface-card);');
      l = l.replace(/background:\s*#1a1e27;/g, 'background: var(--surface-card);');
      l = l.replace(/background-color:\s*#1a1e27;/g, 'background-color: var(--surface-card);');
      l = l.replace(/background:\s*#232731;/g, 'background: var(--surface-subtle);');
      l = l.replace(/background-color:\s*#232731;/g, 'background-color: var(--surface-subtle);');
      l = l.replace(/background:\s*#282d38;/g, 'background: var(--surface-hover);');
      l = l.replace(/background-color:\s*#282d38;/g, 'background-color: var(--surface-hover);');
      l = l.replace(/background:\s*#161922;/g, 'background: var(--surface-body);');
      l = l.replace(/background-color:\s*#161922;/g, 'background-color: var(--surface-body);');
      l = l.replace(/background:\s*#121418;/g, 'background: var(--surface-body);');
      l = l.replace(/background-color:\s*#121418;/g, 'background-color: var(--surface-body);');

      // Dark theme borders
      l = l.replace(/border-color:\s*#2d3340;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-bottom-color:\s*#2d3340;/g, 'border-bottom-color: var(--border-main);');
      l = l.replace(/border-top-color:\s*#2d3340;/g, 'border-top-color: var(--border-main);');
      l = l.replace(/border-left-color:\s*#2d3340;/g, 'border-left-color: var(--border-main);');
      l = l.replace(/border-right-color:\s*#2d3340;/g, 'border-right-color: var(--border-main);');
      l = l.replace(/border-color:\s*#2e3646;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-bottom-color:\s*#2e3646;/g, 'border-bottom-color: var(--border-main);');
      l = l.replace(/border-color:\s*#3d4554;/g, 'border-color: var(--border-subtle);');
      l = l.replace(/border-bottom-color:\s*#3d4554;/g, 'border-bottom-color: var(--border-subtle);');
      l = l.replace(/border-top-color:\s*#3d4554;/g, 'border-top-color: var(--border-subtle);');

      // Dark theme texts
      l = l.replace(/color:\s*#f1f3f5;/g, 'color: var(--text-primary);');
      l = l.replace(/color:\s*#f8fafc;/g, 'color: var(--text-primary);');
      l = l.replace(/color:\s*#cbd5e1;/g, 'color: var(--text-secondary);');
      l = l.replace(/color:\s*#e2e8f0;/g, 'color: var(--text-secondary);');
      l = l.replace(/color:\s*#94a3b8;/g, 'color: var(--text-muted);');
      l = l.replace(/color:\s*#9da5b1;/g, 'color: var(--text-muted);');
      l = l.replace(/color:\s*#ffffff;/g, 'color: var(--white);');

      return l;
    }

    // Light / Global lines
    l = l.replace(/background:\s*#ffffff;/g, 'background: var(--surface-card);');
    l = l.replace(/background-color:\s*#ffffff;/g, 'background-color: var(--surface-card);');
    l = l.replace(/background:\s*#fff;/g, 'background: var(--surface-card);');
    l = l.replace(/background-color:\s*#fff;/g, 'background-color: var(--surface-card);');
    l = l.replace(/color:\s*#ffffff;/g, 'color: var(--white);');

    // Subtle alert & status backgrounds
    l = l.replace(/background:\s*#d1e7dd;/g, 'background: var(--success-light);');
    l = l.replace(/background-color:\s*#d1e7dd;/g, 'background-color: var(--success-light);');
    l = l.replace(/background:\s*#fff3cd;/g, 'background: var(--warning-light);');
    l = l.replace(/background-color:\s*#fff3cd;/g, 'background-color: var(--warning-light);');
    l = l.replace(/background:\s*#e7f1ff;/g, 'background: var(--primary-light);');
    l = l.replace(/background-color:\s*#e7f1ff;/g, 'background-color: var(--primary-light);');
    l = l.replace(/background:\s*#f8d7da;/g, 'background: var(--danger-light);');
    l = l.replace(/background-color:\s*#f8d7da;/g, 'background-color: var(--danger-light);');

    return l;
  });

  const finalCss = processed.join(nl);
  fs.writeFileSync(filePath, finalCss, 'utf8');

  const finalMatches = (finalCss.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
  console.log(`${filePath}: Initial hex ${initialMatches} -> Final hex ${finalMatches} (Reduction: ${initialMatches - finalMatches} codes, ${Math.round((initialMatches - finalMatches) / initialMatches * 100)}%)`);
}

console.log('--- REFACTORING PHASE 2-A ---');
refactorFile('css/dashboard.css');
refactorFile('css/reports.css');
