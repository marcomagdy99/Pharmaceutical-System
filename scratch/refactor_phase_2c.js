const fs = require('fs');

function refactorFile(filePath) {
  let css = fs.readFileSync(filePath, 'utf8');
  const initialMatches = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;

  // 1. Common Fallback Cleanups
  css = css
    // Surfaces
    .replace(/var\(--surface,\s*#ffffff\)/g, 'var(--surface-card)')
    .replace(/var\(--surface,\s*#fff\)/g, 'var(--surface-card)')
    .replace(/var\(--card-bg,\s*#fff\)/g, 'var(--surface-card)')
    .replace(/var\(--card-bg,\s*#ffffff\)/g, 'var(--surface-card)')
    .replace(/var\(--surface-dim,\s*#f8fafc\)/g, 'var(--surface-subtle)')
    .replace(/var\(--surface-dim,\s*#f8f9fa\)/g, 'var(--surface-subtle)')
    .replace(/var\(--surface-dim,\s*#f1f5f9\)/g, 'var(--surface-hover)')
    .replace(/var\(--gray-50,\s*#f8fafc\)/g, 'var(--surface-subtle)')
    .replace(/var\(--gray-50,\s*#f8f9fa\)/g, 'var(--surface-subtle)')
    .replace(/var\(--gray-100,\s*#f1f5f9\)/g, 'var(--surface-hover)')
    .replace(/var\(--gray-100,\s*#f1f3f5\)/g, 'var(--surface-hover)')
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
    .replace(/var\(--gray-300,\s*#3d4554\)/g, 'var(--border-subtle)')

    // Typography
    .replace(/var\(--gray-800,\s*#1e293b\)/g, 'var(--text-primary)')
    .replace(/var\(--gray-800,\s*#212529\)/g, 'var(--text-primary)')
    .replace(/var\(--text-color,\s*#1e293b\)/g, 'var(--text-primary)')
    .replace(/var\(--text-color,\s*#334155\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-700,\s*#334155\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#475569\)/g, 'var(--text-secondary)')
    .replace(/var\(--gray-600,\s*#64748b\)/g, 'var(--text-muted)')
    .replace(/var\(--gray-500,\s*#64748b\)/g, 'var(--text-muted)')
    .replace(/var\(--gray-500,\s*#6c757d\)/g, 'var(--text-muted)')
    .replace(/var\(--text-muted,\s*#64748b\)/g, 'var(--text-muted)')

    // Brand & Status
    .replace(/var\(--primary-light,\s*#e7f1ff\)/g, 'var(--primary-light)')
    .replace(/var\(--primary-dark,\s*#0a58ca\)/g, 'var(--primary-dark)')
    .replace(/var\(--primary,\s*#0d6efd\)/g, 'var(--primary)')
    .replace(/var\(--primary,\s*#2563eb\)/g, 'var(--primary)')
    .replace(/var\(--success,\s*#198754\)/g, 'var(--success)')
    .replace(/var\(--success,\s*#10b981\)/g, 'var(--success)')
    .replace(/var\(--danger,\s*#dc3545\)/g, 'var(--danger)')
    .replace(/var\(--danger,\s*#ef4444\)/g, 'var(--danger)')
    .replace(/var\(--warning,\s*#fd7e14\)/g, 'var(--warning)')
    .replace(/var\(--warning,\s*#f59e0b\)/g, 'var(--warning)')

    // Gradients
    .replace(/linear-gradient\(135deg,\s*#0d6efd,\s*#0b5ed7\)/g, 'var(--gradient-primary)')
    .replace(/linear-gradient\(135deg,\s*#0d6efd,\s*#0a58ca\)/g, 'var(--gradient-primary)');

  // 2. Line by line processing
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

      // Dark backgrounds
      l = l.replace(/background:\s*#1e2229;/g, 'background: var(--surface-card);');
      l = l.replace(/background-color:\s*#1e2229;/g, 'background-color: var(--surface-card);');
      l = l.replace(/background:\s*#181b22;/g, 'background: var(--surface-card);');
      l = l.replace(/background-color:\s*#181b22;/g, 'background-color: var(--surface-card);');
      l = l.replace(/background:\s*#232731;/g, 'background: var(--surface-subtle);');
      l = l.replace(/background-color:\s*#232731;/g, 'background-color: var(--surface-subtle);');
      l = l.replace(/background:\s*#21252d;/g, 'background: var(--surface-subtle);');
      l = l.replace(/background-color:\s*#21252d;/g, 'background-color: var(--surface-subtle);');
      l = l.replace(/background:\s*#1a1d24;/g, 'background: var(--surface-subtle);');
      l = l.replace(/background-color:\s*#1a1d24;/g, 'background-color: var(--surface-subtle);');
      l = l.replace(/background:\s*#282d38;/g, 'background: var(--surface-hover);');
      l = l.replace(/background-color:\s*#282d38;/g, 'background-color: var(--surface-hover);');
      l = l.replace(/background:\s*#16191f;/g, 'background: var(--surface-body);');
      l = l.replace(/background-color:\s*#16191f;/g, 'background-color: var(--surface-body);');

      // Dark borders
      l = l.replace(/border-color:\s*#2d3340;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-bottom-color:\s*#2d3340;/g, 'border-bottom-color: var(--border-main);');
      l = l.replace(/border-top-color:\s*#2d3340;/g, 'border-top-color: var(--border-main);');
      l = l.replace(/border-bottom:\s*1px solid #2d3340;/g, 'border-bottom: 1px solid var(--border-main);');
      l = l.replace(/border-top:\s*1px solid #2d3340;/g, 'border-top: 1px solid var(--border-main);');
      l = l.replace(/border-color:\s*#2b313d;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-color:\s*#2f3643;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-color:\s*#3d4554;/g, 'border-color: var(--border-subtle);');

      // Dark texts
      l = l.replace(/color:\s*#f1f3f5;/g, 'color: var(--text-primary);');
      l = l.replace(/color:\s*#f1f5f9;/g, 'color: var(--text-primary);');
      l = l.replace(/color:\s*#f8fafc;/g, 'color: var(--text-primary);');
      l = l.replace(/color:\s*#cbd5e1;/g, 'color: var(--text-secondary);');
      l = l.replace(/color:\s*#c9d1d9;/g, 'color: var(--text-secondary);');
      l = l.replace(/color:\s*#dee2e6;/g, 'color: var(--text-secondary);');
      l = l.replace(/--bs-table-color:\s*#dee2e6;/g, '--bs-table-color: var(--text-secondary);');
      l = l.replace(/--bs-table-hover-color:\s*#ffffff;/g, '--bs-table-hover-color: var(--white);');
      l = l.replace(/--bs-table-hover-bg:\s*#282d38;/g, '--bs-table-hover-bg: var(--surface-hover);');
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
    l = l.replace(/background:\s*#f8fafc;/g, 'background: var(--surface-subtle);');
    l = l.replace(/background-color:\s*#f8fafc;/g, 'background-color: var(--surface-subtle);');
    l = l.replace(/background:\s*#f1f5f9;/g, 'background: var(--surface-hover);');
    l = l.replace(/background-color:\s*#f1f5f9;/g, 'background-color: var(--surface-hover);');
    l = l.replace(/color:\s*#ffffff;/g, 'color: var(--white);');
    l = l.replace(/color:\s*#1e293b;/g, 'color: var(--text-primary);');
    l = l.replace(/border:\s*1px solid #e2e8f0;/g, 'border: 1px solid var(--border-main);');
    l = l.replace(/border-color:\s*#e5e7eb;/g, 'border-color: var(--border-main);');
    l = l.replace(/border:\s*1px solid #e5e7eb;/g, 'border: 1px solid var(--border-main);');

    // Status badges
    l = l.replace(/background-color:\s*#d1e7dd;/g, 'background-color: var(--success-subtle);');
    l = l.replace(/background-color:\s*#fef2f2;/g, 'background-color: var(--danger-subtle);');
    l = l.replace(/color:\s*#dc2626;/g, 'color: var(--danger);');

    return l;
  });

  const finalCss = processed.join(nl);
  fs.writeFileSync(filePath, finalCss, 'utf8');

  const finalMatches = (finalCss.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
  console.log(`${filePath}: Initial hex ${initialMatches} -> Final hex ${finalMatches} (Reduction: ${initialMatches - finalMatches} codes, ${Math.round((initialMatches - finalMatches) / initialMatches * 100)}%)`);
}

console.log('--- REFACTORING PHASE 2-C ---');
refactorFile('css/leaves.css');
refactorFile('css/products.css');
