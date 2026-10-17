const fs = require('fs');

function pass2(filePath) {
  let css = fs.readFileSync(filePath, 'utf8');
  const initialMatches = (css.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;

  // 1. Semantic Status & Badges
  css = css
    .replace(/background:\s*#fef3c7;/g, 'background: var(--warning-subtle);')
    .replace(/background-color:\s*#fef3c7;/g, 'background-color: var(--warning-subtle);')
    .replace(/background:\s*#d1fae5;/g, 'background: var(--success-subtle);')
    .replace(/background-color:\s*#d1fae5;/g, 'background-color: var(--success-subtle);')
    .replace(/background:\s*#dcfce7;/g, 'background: var(--success-subtle);')
    .replace(/background-color:\s*#dcfce7;/g, 'background-color: var(--success-subtle);')
    .replace(/background:\s*#fee2e2;/g, 'background: var(--danger-subtle);')
    .replace(/background-color:\s*#fee2e2;/g, 'background-color: var(--danger-subtle);')
    .replace(/background:\s*#e0f2fe;/g, 'background: var(--info-subtle);')
    .replace(/background-color:\s*#e0f2fe;/g, 'background-color: var(--info-subtle);')
    .replace(/background:\s*#eff6ff;/g, 'background: var(--info-subtle);')
    .replace(/background-color:\s*#eff6ff;/g, 'background-color: var(--info-subtle);')
    .replace(/background:\s*#f1f5f9;/g, 'background: var(--surface-hover);')
    .replace(/background-color:\s*#f1f5f9;/g, 'background-color: var(--surface-hover);')
    .replace(/background:\s*#f8fafc;/g, 'background: var(--surface-subtle);')
    .replace(/background-color:\s*#f8fafc;/g, 'background-color: var(--surface-subtle);')
    .replace(/border-color:\s*#dee2e6;/g, 'border-color: var(--border-main);')
    .replace(/border-color:\s*#e5e7eb;/g, 'border-color: var(--border-main);')
    .replace(/border:\s*1px solid #dee2e6;/g, 'border: 1px solid var(--border-main);')
    .replace(/border:\s*1px solid #e5e7eb;/g, 'border: 1px solid var(--border-main);')
    .replace(/border:\s*1px solid #e2e8f0;/g, 'border: 1px solid var(--border-main);');

  // 2. Line by line dark mode tokens
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

      l = l.replace(/color:\s*#60a5fa;/g, 'color: var(--primary-light);');
      l = l.replace(/color:\s*#34d399;/g, 'color: var(--success);');
      l = l.replace(/color:\s*#4ade80;/g, 'color: var(--success);');
      l = l.replace(/color:\s*#f87171;/g, 'color: var(--danger);');
      l = l.replace(/color:\s*#ef4444;/g, 'color: var(--danger);');
      l = l.replace(/color:\s*#fbbf24;/g, 'color: var(--warning);');
      l = l.replace(/color:\s*#f59e0b;/g, 'color: var(--warning);');
      l = l.replace(/color:\s*#c084fc;/g, 'color: var(--purple-text);');
      l = l.replace(/color:\s*#9da5b1;/g, 'color: var(--text-muted);');
      l = l.replace(/color:\s*#cbd5e1;/g, 'color: var(--text-secondary);');
      l = l.replace(/border-color:\s*#2d3340;/g, 'border-color: var(--border-main);');
      l = l.replace(/border-color:\s*#3d4554;/g, 'border-color: var(--border-subtle);');

      return l;
    }

    // Light lines colors
    l = l.replace(/color:\s*#6f42c1;/g, 'color: var(--role-bu);');
    l = l.replace(/color:\s*#0d6efd;/g, 'color: var(--primary);');
    l = l.replace(/color:\s*#2563eb;/g, 'color: var(--primary);');
    l = l.replace(/color:\s*#dc3545;/g, 'color: var(--danger);');
    l = l.replace(/color:\s*#dc2626;/g, 'color: var(--danger);');
    l = l.replace(/color:\s*#198754;/g, 'color: var(--success);');
    l = l.replace(/color:\s*#059669;/g, 'color: var(--success);');
    l = l.replace(/color:\s*#fd7e14;/g, 'color: var(--warning);');
    l = l.replace(/color:\s*#f59e0b;/g, 'color: var(--warning);');

    return l;
  });

  const finalCss = processed.join(nl);
  fs.writeFileSync(filePath, finalCss, 'utf8');

  const finalMatches = (finalCss.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
  console.log(`${filePath}: Pass 2 -> Final hex ${finalMatches} (Total reduction from original: ${initialMatches - finalMatches} codes)`);
}

pass2('css/dashboard.css');
pass2('css/reports.css');
