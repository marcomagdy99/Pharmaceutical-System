const fs = require('fs');
const path = require('path');

const jsDir = path.join(__dirname, '..', 'js');
const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));

console.log('=== Deep Code Audit Script ===');

// Check 1: Audit all export functions for header vs row cell length mismatch
console.log('\n--- 1. Export Functions (Headers vs Rows) ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  if (content.includes('export') || content.includes('XLSX') || content.includes('csv')) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('const headers =') || line.includes('let headers =') || line.includes('headers:')) {
        console.log(`[${f}:${idx + 1}] Found headers declaration`);
      }
    });
  }
});

// Check 2: Audit filter variables that might be declared and not used
console.log('\n--- 2. Filter Variables Audit (select / filter inputs) ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const matches = content.matchAll(/const\s+(selected[A-Za-z0-9_]+)\s*=\s*([a-zA-Z0-9_]+Select|document\.getElementById\([^)]+\))\s*\??\s*\.?\s*value/g);
  for (const m of matches) {
    const varName = m[1];
    // Count occurrences of varName in file
    const regex = new RegExp(`\\b${varName}\\b`, 'g');
    const count = (content.match(regex) || []).length;
    if (count <= 1) {
      console.log(`[${f}] POTENTIAL DEAD FILTER: ${varName} defined but used only ${count} time(s)!`);
    } else {
      // Check if it's used in any .filter(
      console.log(`[${f}] Filter var: ${varName} (count: ${count})`);
    }
  }
});

// Check 3: Audit all Bootstrap modal listeners for potential mismatch
console.log('\n--- 3. Modal Hidden Listeners Audit ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  if (content.includes('hidden.bs.modal')) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.includes('hidden.bs.modal')) {
        console.log(`[${f}:${idx + 1}] ${line.trim()}`);
      }
    });
  }
});

// Check 4: Audit approval workflows across files
console.log('\n--- 4. Approval Workflows & Multi-Tier Role Checks ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  if (content.includes('approvalWorkflows') || content.includes('requireBu') || content.includes('requireLm')) {
    console.log(`[${f}] References approvalWorkflows / requireBu / requireLm`);
  }
});

// Check 5: Role normalization audit
console.log('\n--- 5. Direct Role Comparisons (potential missed normalizeRole) ---');
files.forEach(f => {
  const content = fs.readFileSync(path.join(jsDir, f), 'utf8');
  const matches = content.matchAll(/(?:role|userRole|currentUser\.role)\s*===\s*["']([^"']+)["']/g);
  for (const m of matches) {
    const r = m[1];
    if (r === 'medical_rep' || r === 'rep' || r === 'district_manager' || r === 'dm' || r === 'line_manager' || r === 'lm' || r === 'business_unit' || r === 'bu') {
      // check if normalizeRole is used in file
      if (!content.includes('normalizeRole') && !content.includes('toLowerCase')) {
        console.log(`[${f}] Direct role comparison to "${r}" without normalizeRole / toLowerCase`);
      }
    }
  }
});
