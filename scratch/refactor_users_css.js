const fs = require('fs');

let css = fs.readFileSync('css/users.css', 'utf8');

// Replacement map
const replacements = [
  // Tree view
  { from: 'border-left: 2px solid var(--gray-300, #dee2e6);', to: 'border-left: 2px solid var(--border-color, #dee2e6);' },
  { from: 'background: var(--gray-50, #f8f9fa); padding: 10px; border-radius: 8px; border: 1px solid var(--gray-200, #e9ecef);', to: 'background: var(--surface-subtle, #f8f9fa); padding: 10px; border-radius: 8px; border: 1px solid var(--border-main, #e9ecef);' },
  
  // Roles
  { from: '.bg-gm { background-color: #1e293b !important; color: white !important; }', to: '.bg-gm { background-color: var(--role-gm, #1e293b) !important; color: var(--white, #ffffff) !important; }' },
  { from: '.bg-bu { background-color: #6f42c1 !important; color: white !important; }', to: '.bg-bu { background-color: var(--role-bu, #6f42c1) !important; color: var(--white, #ffffff) !important; }' },
  { from: '.bg-pm { background-color: #0891b2 !important; color: white !important; }', to: '.bg-pm { background-color: var(--role-pm, #0891b2) !important; color: var(--white, #ffffff) !important; }' },
  { from: '.bg-hr { background-color: #6f42c1 !important; color: white !important; }', to: '.bg-hr { background-color: var(--role-hr, #7e22ce) !important; color: var(--white, #ffffff) !important; }' },

  // Hierarchy pill
  { from: 'background-color: #e2e8f0 !important;', to: 'background-color: var(--border-main, #e2e8f0) !important;' },
  { from: 'color: #1e293b !important;\n  border: 1px solid #cbd5e1 !important;', to: 'color: var(--text-primary, #1e293b) !important;\n  border: 1px solid var(--border-color, #cbd5e1) !important;' },
  { from: 'color: #1e293b !important;\r\n  border: 1px solid #cbd5e1 !important;', to: 'color: var(--text-primary, #1e293b) !important;\r\n  border: 1px solid var(--border-color, #cbd5e1) !important;' },
  { from: 'background-color: #2e3542 !important;\n  color: #f1f3f5 !important;\n  border-color: #475569 !important;', to: 'background-color: var(--surface-hover, #2e3542) !important;\n  color: var(--text-primary, #f1f3f5) !important;\n  border-color: var(--border-subtle, #475569) !important;' },
  { from: 'background-color: #2e3542 !important;\r\n  color: #f1f3f5 !important;\r\n  border-color: #475569 !important;', to: 'background-color: var(--surface-hover, #2e3542) !important;\r\n  color: var(--text-primary, #f1f3f5) !important;\r\n  border-color: var(--border-subtle, #475569) !important;' },

  // Multi line badge
  { from: 'background: #f3e8ff;\n  color: #6b21a8;', to: 'background: var(--purple-subtle, #f3e8ff);\n  color: var(--purple-text, #6b21a8);' },
  { from: 'background: #f3e8ff;\r\n  color: #6b21a8;', to: 'background: var(--purple-subtle, #f3e8ff);\r\n  color: var(--purple-text, #6b21a8);' },

  // Modal content
  { from: 'background-color: var(--white, #ffffff);\n  color: var(--gray-800, #333333);', to: 'background-color: var(--surface-card, #ffffff);\n  color: var(--text-primary, #333333);' },
  { from: 'background-color: var(--white, #ffffff);\r\n  color: var(--gray-800, #333333);', to: 'background-color: var(--surface-card, #ffffff);\r\n  color: var(--text-primary, #333333);' },
  { from: '[data-theme="dark"] .form-label {\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .form-label {\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .form-label {\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .form-label {\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .modal-content {\n  background-color: #1e2229;\n  color: #f1f3f5;\n  border: 1px solid #3d4554;\n}', to: '[data-theme="dark"] .modal-content {\n  background-color: var(--surface-card, #1e2229);\n  color: var(--text-primary, #f1f3f5);\n  border: 1px solid var(--border-subtle, #3d4554);\n}' },
  { from: '[data-theme="dark"] .modal-content {\r\n  background-color: #1e2229;\r\n  color: #f1f3f5;\r\n  border: 1px solid #3d4554;\r\n}', to: '[data-theme="dark"] .modal-content {\r\n  background-color: var(--surface-card, #1e2229);\r\n  color: var(--text-primary, #f1f3f5);\r\n  border: 1px solid var(--border-subtle, #3d4554);\r\n}' },

  // Dark card
  { from: '[data-theme="dark"] .card {\n  background-color: #1e2229;\n  border-color: #2d3340;\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .card {\n  background-color: var(--surface-card, #1e2229);\n  border-color: var(--border-main, #2d3340);\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .card {\r\n  background-color: #1e2229;\r\n  border-color: #2d3340;\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .card {\r\n  background-color: var(--surface-card, #1e2229);\r\n  border-color: var(--border-main, #2d3340);\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },

  // Typography
  { from: 'color: #1a1d20;\n  font-weight: 700;', to: 'color: var(--text-primary, #1a1d20);\n  font-weight: 700;' },
  { from: 'color: #1a1d20;\r\n  font-weight: 700;', to: 'color: var(--text-primary, #1a1d20);\r\n  font-weight: 700;' },
  { from: 'color: var(--gray-600, #64748b);\n  letter-spacing: 0.5px;', to: 'color: var(--text-muted, #64748b);\n  letter-spacing: 0.5px;' },
  { from: 'color: var(--gray-600, #64748b);\r\n  letter-spacing: 0.5px;', to: 'color: var(--text-muted, #64748b);\r\n  letter-spacing: 0.5px;' },
  { from: '[data-theme="dark"] .card-body {\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .card-body {\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .card-body {\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .card-body {\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .user-name-text,\n[data-theme="dark"] .text-dark {\n  color: #ffffff;\n}', to: '[data-theme="dark"] .user-name-text,\n[data-theme="dark"] .text-dark {\n  color: var(--text-primary, #ffffff);\n}' },
  { from: '[data-theme="dark"] .user-name-text,\r\n[data-theme="dark"] .text-dark {\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .user-name-text,\r\n[data-theme="dark"] .text-dark {\r\n  color: var(--text-primary, #ffffff);\r\n}' },
  { from: '[data-theme="dark"] .badge.bg-light.text-dark {\n  background-color: #282d38;\n  color: #f1f3f5;\n  border-color: #3d4554;\n}', to: '[data-theme="dark"] .badge.bg-light.text-dark {\n  background-color: var(--surface-hover, #282d38);\n  color: var(--text-primary, #f1f3f5);\n  border-color: var(--border-subtle, #3d4554);\n}' },
  { from: '[data-theme="dark"] .badge.bg-light.text-dark {\r\n  background-color: #282d38;\r\n  color: #f1f3f5;\r\n  border-color: #3d4554;\r\n}', to: '[data-theme="dark"] .badge.bg-light.text-dark {\r\n  background-color: var(--surface-hover, #282d38);\r\n  color: var(--text-primary, #f1f3f5);\r\n  border-color: var(--border-subtle, #3d4554);\r\n}' },

  // Dark tree
  { from: '[data-theme="dark"] .tree-node {\n  border-left-color: #3d4554;\n}', to: '[data-theme="dark"] .tree-node {\n  border-left-color: var(--border-subtle, #3d4554);\n}' },
  { from: '[data-theme="dark"] .tree-node {\r\n  border-left-color: #3d4554;\r\n}', to: '[data-theme="dark"] .tree-node {\r\n  border-left-color: var(--border-subtle, #3d4554);\r\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content {\n  background: #232731;\n  border-color: #3d4554;\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .tree-node .node-content {\n  background: var(--surface-subtle, #232731);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content {\r\n  background: #232731;\r\n  border-color: #3d4554;\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .tree-node .node-content {\r\n  background: var(--surface-subtle, #232731);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content:hover {\n  background: #282d38;\n}', to: '[data-theme="dark"] .tree-node .node-content:hover {\n  background: var(--surface-hover, #282d38);\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content:hover {\r\n  background: #282d38;\r\n}', to: '[data-theme="dark"] .tree-node .node-content:hover {\r\n  background: var(--surface-hover, #282d38);\r\n}' },

  // Dark table
  { from: '[data-theme="dark"] .table {\n  color: #dee2e6;\n  border-color: #2d3340;\n}', to: '[data-theme="dark"] .table {\n  color: var(--text-secondary, #dee2e6);\n  border-color: var(--border-main, #2d3340);\n}' },
  { from: '[data-theme="dark"] .table {\r\n  color: #dee2e6;\r\n  border-color: #2d3340;\r\n}', to: '[data-theme="dark"] .table {\r\n  color: var(--text-secondary, #dee2e6);\r\n  border-color: var(--border-main, #2d3340);\r\n}' },
  { from: '[data-theme="dark"] .table thead,\n[data-theme="dark"] .table thead th,\n[data-theme="dark"] .table thead.table-light {\n  background-color: #232731;\n  color: #f1f3f5;\n  border-bottom-color: #2d3340;\n}', to: '[data-theme="dark"] .table thead,\n[data-theme="dark"] .table thead th,\n[data-theme="dark"] .table thead.table-light {\n  background-color: var(--surface-subtle, #232731);\n  color: var(--text-primary, #f1f3f5);\n  border-bottom-color: var(--border-main, #2d3340);\n}' },
  { from: '[data-theme="dark"] .table thead,\r\n[data-theme="dark"] .table thead th,\r\n[data-theme="dark"] .table thead.table-light {\r\n  background-color: #232731;\r\n  color: #f1f3f5;\r\n  border-bottom-color: #2d3340;\r\n}', to: '[data-theme="dark"] .table thead,\r\n[data-theme="dark"] .table thead th,\r\n[data-theme="dark"] .table thead.table-light {\r\n  background-color: var(--surface-subtle, #232731);\r\n  color: var(--text-primary, #f1f3f5);\r\n  border-bottom-color: var(--border-main, #2d3340);\r\n}' },
  { from: '[data-theme="dark"] .table tbody tr {\n  border-bottom-color: #2d3340;\n}', to: '[data-theme="dark"] .table tbody tr {\n  border-bottom-color: var(--border-main, #2d3340);\n}' },
  { from: '[data-theme="dark"] .table tbody tr {\r\n  border-bottom-color: #2d3340;\r\n}', to: '[data-theme="dark"] .table tbody tr {\r\n  border-bottom-color: var(--border-main, #2d3340);\r\n}' },
  { from: '[data-theme="dark"] .table-hover tbody tr:hover {\n  background-color: #282d38;\n  color: #ffffff;\n}', to: '[data-theme="dark"] .table-hover tbody tr:hover {\n  background-color: var(--surface-hover, #282d38);\n  color: var(--text-primary, #ffffff);\n}' },
  { from: '[data-theme="dark"] .table-hover tbody tr:hover {\r\n  background-color: #282d38;\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .table-hover tbody tr:hover {\r\n  background-color: var(--surface-hover, #282d38);\r\n  color: var(--text-primary, #ffffff);\r\n}' },
  { from: '[data-theme="dark"] .badge-multi-line {\n  background: rgba(168, 85, 247, 0.2);\n  color: #d8b4fe;\n}', to: '[data-theme="dark"] .badge-multi-line {\n  background: var(--purple-subtle, rgba(168, 85, 247, 0.2));\n  color: var(--purple-text, #d8b4fe);\n}' },
  { from: '[data-theme="dark"] .badge-multi-line {\r\n  background: rgba(168, 85, 247, 0.2);\r\n  color: #d8b4fe;\r\n}', to: '[data-theme="dark"] .badge-multi-line {\r\n  background: var(--purple-subtle, rgba(168, 85, 247, 0.2));\r\n  color: var(--purple-text, #d8b4fe);\r\n}' },
  { from: '[data-theme="dark"] #tableView .table th:first-child {\n  background-color: #232731;\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\n}', to: '[data-theme="dark"] #tableView .table th:first-child {\n  background-color: var(--surface-subtle, #232731);\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\n}' },
  { from: '[data-theme="dark"] #tableView .table th:first-child {\r\n  background-color: #232731;\r\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\r\n}', to: '[data-theme="dark"] #tableView .table th:first-child {\n  background-color: var(--surface-subtle, #232731);\r\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\r\n}' },
  { from: '[data-theme="dark"] #tableView .table td:first-child {\n  background-color: #1e2229;\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\n}', to: '[data-theme="dark"] #tableView .table td:first-child {\n  background-color: var(--surface-card, #1e2229);\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\n}' },
  { from: '[data-theme="dark"] #tableView .table td:first-child {\r\n  background-color: #1e2229;\r\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\r\n}', to: '[data-theme="dark"] #tableView .table td:first-child {\r\n  background-color: var(--surface-card, #1e2229);\r\n  box-shadow: 2px 0 5px rgba(0, 0, 0, 0.35);\r\n}' },
  { from: '[data-theme="dark"] #tableView .table-hover tbody tr:hover td:first-child {\n  background-color: #282d38;\n}', to: '[data-theme="dark"] #tableView .table-hover tbody tr:hover td:first-child {\n  background-color: var(--surface-hover, #282d38);\n}' },
  { from: '[data-theme="dark"] #tableView .table-hover tbody tr:hover td:first-child {\r\n  background-color: #282d38;\r\n}', to: '[data-theme="dark"] #tableView .table-hover tbody tr:hover td:first-child {\r\n  background-color: var(--surface-hover, #282d38);\r\n}' },

  // Dark inputs
  { from: '[data-theme="dark"] .input-group-text,\n[data-theme="dark"] .input-group-text.bg-light {\n  background-color: #232731;\n  border-color: #3d4554;\n  color: #9da5b1;\n}', to: '[data-theme="dark"] .input-group-text,\n[data-theme="dark"] .input-group-text.bg-light {\n  background-color: var(--surface-subtle, #232731);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-muted, #9da5b1);\n}' },
  { from: '[data-theme="dark"] .input-group-text,\r\n[data-theme="dark"] .input-group-text.bg-light {\r\n  background-color: #232731;\r\n  border-color: #3d4554;\r\n  color: #9da5b1;\r\n}', to: '[data-theme="dark"] .input-group-text,\r\n[data-theme="dark"] .input-group-text.bg-light {\r\n  background-color: var(--surface-subtle, #232731);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-muted, #9da5b1);\r\n}' },
  { from: 'background-color: #232731;\n  border-color: #3d4554;\n  color: #f1f3f5;\n  color-scheme: dark;', to: 'background-color: var(--surface-subtle, #232731);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-primary, #f1f3f5);\n  color-scheme: dark;' },
  { from: 'background-color: #232731;\r\n  border-color: #3d4554;\r\n  color: #f1f3f5;\r\n  color-scheme: dark;', to: 'background-color: var(--surface-subtle, #232731);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-primary, #f1f3f5);\r\n  color-scheme: dark;' },
  { from: '[data-theme="dark"] .form-select option,\n[data-theme="dark"] select option {\n  background-color: #232731;\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .form-select option,\n[data-theme="dark"] select option {\n  background-color: var(--surface-subtle, #232731);\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .form-select option,\r\n[data-theme="dark"] select option {\r\n  background-color: #232731;\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .form-select option,\r\n[data-theme="dark"] select option {\r\n  background-color: var(--surface-subtle, #232731);\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .form-control:focus,\n[data-theme="dark"] .form-select:focus,\n[data-theme="dark"] select:focus {\n  background-color: #232731;\n  border-color: #388bfd;\n  color: #ffffff;\n  box-shadow: 0 0 0 0.25rem rgba(56, 139, 253, 0.25);\n}', to: '[data-theme="dark"] .form-control:focus,\n[data-theme="dark"] .form-select:focus,\n[data-theme="dark"] select:focus {\n  background-color: var(--surface-subtle, #232731);\n  border-color: var(--primary, #388bfd);\n  color: var(--white, #ffffff);\n  box-shadow: 0 0 0 0.25rem rgba(56, 139, 253, 0.25);\n}' },
  { from: '[data-theme="dark"] .form-control:focus,\r\n[data-theme="dark"] .form-select:focus,\r\n[data-theme="dark"] select:focus {\r\n  background-color: #232731;\r\n  border-color: #388bfd;\r\n  color: #ffffff;\r\n  box-shadow: 0 0 0 0.25rem rgba(56, 139, 253, 0.25);\r\n}', to: '[data-theme="dark"] .form-control:focus,\r\n[data-theme="dark"] .form-select:focus,\r\n[data-theme="dark"] select:focus {\r\n  background-color: var(--surface-subtle, #232731);\r\n  border-color: var(--primary, #388bfd);\r\n  color: var(--white, #ffffff);\r\n  box-shadow: 0 0 0 0.25rem rgba(56, 139, 253, 0.25);\r\n}' },
  { from: '[data-theme="dark"] .form-control::placeholder {\n  color: #6c757d;\n}', to: '[data-theme="dark"] .form-control::placeholder {\n  color: var(--text-muted, #6c757d);\n}' },
  { from: '[data-theme="dark"] .form-control::placeholder {\r\n  color: #6c757d;\r\n}', to: '[data-theme="dark"] .form-control::placeholder {\r\n  color: var(--text-muted, #6c757d);\r\n}' },

  // Product lines box & neutral badges
  { from: '.u-product-lines-box {\n  background-color: #f8f9fa;\n  border-color: #dee2e6;\n}', to: '.u-product-lines-box {\n  background-color: var(--surface-subtle, #f8f9fa);\n  border-color: var(--border-color, #dee2e6);\n}' },
  { from: '.u-product-lines-box {\r\n  background-color: #f8f9fa;\r\n  border-color: #dee2e6;\r\n}', to: '.u-product-lines-box {\r\n  background-color: var(--surface-subtle, #f8f9fa);\r\n  border-color: var(--border-color, #dee2e6);\r\n}' },
  { from: '.user-line-label {\n  color: #212529;\n}', to: '.user-line-label {\n  color: var(--text-primary, #212529);\n}' },
  { from: '.user-line-label {\r\n  color: #212529;\r\n}', to: '.user-line-label {\r\n  color: var(--text-primary, #212529);\r\n}' },
  { from: '.badge-neutral {\n  background-color: #f8f9fa;\n  color: #212529;\n  border-color: #dee2e6;\n}', to: '.badge-neutral {\n  background-color: var(--surface-subtle, #f8f9fa);\n  color: var(--text-primary, #212529);\n  border-color: var(--border-color, #dee2e6);\n}' },
  { from: '.badge-neutral {\r\n  background-color: #f8f9fa;\r\n  color: #212529;\r\n  border-color: #dee2e6;\r\n}', to: '.badge-neutral {\r\n  background-color: var(--surface-subtle, #f8f9fa);\r\n  color: var(--text-primary, #212529);\r\n  border-color: var(--border-color, #dee2e6);\r\n}' },

  // Dark container
  { from: '[data-theme="dark"] #uProductLinesContainer,\n[data-theme="dark"] #uProductLinesContainer.bg-light,\n[data-theme="dark"] .u-product-lines-box {\n  background-color: #121418;\n  border-color: #3d4554;\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] #uProductLinesContainer,\n[data-theme="dark"] #uProductLinesContainer.bg-light,\n[data-theme="dark"] .u-product-lines-box {\n  background-color: var(--surface-body, #121418);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] #uProductLinesContainer,\r\n[data-theme="dark"] #uProductLinesContainer.bg-light,\r\n[data-theme="dark"] .u-product-lines-box {\r\n  background-color: #121418;\r\n  border-color: #3d4554;\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] #uProductLinesContainer,\r\n[data-theme="dark"] #uProductLinesContainer.bg-light,\r\n[data-theme="dark"] .u-product-lines-box {\r\n  background-color: var(--surface-body, #121418);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .user-line-label {\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .user-line-label {\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .user-line-label {\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .user-line-label {\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },
  { from: '[data-theme="dark"] .badge-neutral {\n  background-color: #21262d;\n  color: #c9d1d9;\n  border-color: #30363d;\n}', to: '[data-theme="dark"] .badge-neutral {\n  background-color: var(--surface-hover, #21262d);\n  color: var(--text-secondary, #c9d1d9);\n  border-color: var(--border-subtle, #30363d);\n}' },
  { from: '[data-theme="dark"] .badge-neutral {\r\n  background-color: #21262d;\r\n  color: #c9d1d9;\r\n  border-color: #30363d;\r\n}', to: '[data-theme="dark"] .badge-neutral {\r\n  background-color: var(--surface-hover, #21262d);\r\n  color: var(--text-secondary, #c9d1d9);\r\n  border-color: var(--border-subtle, #30363d);\r\n}' },
  { from: '[data-theme="dark"] .card.bg-light {\n  background-color: #232731;\n  border-color: #3d4554;\n  color: #f1f3f5;\n}', to: '[data-theme="dark"] .card.bg-light {\n  background-color: var(--surface-subtle, #232731);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-primary, #f1f3f5);\n}' },
  { from: '[data-theme="dark"] .card.bg-light {\r\n  background-color: #232731;\r\n  border-color: #3d4554;\r\n  color: #f1f3f5;\r\n}', to: '[data-theme="dark"] .card.bg-light {\r\n  background-color: var(--surface-subtle, #232731);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-primary, #f1f3f5);\r\n}' },

  // Dark modal
  { from: '[data-theme="dark"] .modal-content {\n  background-color: #1e2229;\n  color: #f1f3f5;\n  border: 1px solid #3d4554;\n  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);\n}', to: '[data-theme="dark"] .modal-content {\n  background-color: var(--surface-card, #1e2229);\n  color: var(--text-primary, #f1f3f5);\n  border: 1px solid var(--border-subtle, #3d4554);\n  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);\n}' },
  { from: '[data-theme="dark"] .modal-content {\r\n  background-color: #1e2229;\r\n  color: #f1f3f5;\r\n  border: 1px solid #3d4554;\r\n  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);\r\n}', to: '[data-theme="dark"] .modal-content {\r\n  background-color: var(--surface-card, #1e2229);\r\n  color: var(--text-primary, #f1f3f5);\r\n  border: 1px solid var(--border-subtle, #3d4554);\r\n  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.7);\r\n}' },
  { from: '[data-theme="dark"] .modal-header,\n[data-theme="dark"] .modal-footer {\n  border-color: #2d3340;\n}', to: '[data-theme="dark"] .modal-header,\n[data-theme="dark"] .modal-footer {\n  border-color: var(--border-main, #2d3340);\n}' },
  { from: '[data-theme="dark"] .modal-header,\r\n[data-theme="dark"] .modal-footer {\r\n  border-color: #2d3340;\r\n}', to: '[data-theme="dark"] .modal-header,\r\n[data-theme="dark"] .modal-footer {\r\n  border-color: var(--border-main, #2d3340);\r\n}' },
  { from: '[data-theme="dark"] .modal-title {\n  color: #ffffff;\n}', to: '[data-theme="dark"] .modal-title {\n  color: var(--white, #ffffff);\n}' },
  { from: '[data-theme="dark"] .modal-title {\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .modal-title {\r\n  color: var(--white, #ffffff);\r\n}' },

  // Buttons in dark
  { from: '[data-theme="dark"] .btn-light {\n  background-color: #2d3340;\n  border-color: #3d4554;\n  color: #dee2e6;\n}', to: '[data-theme="dark"] .btn-light {\n  background-color: var(--border-main, #2d3340);\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-secondary, #dee2e6);\n}' },
  { from: '[data-theme="dark"] .btn-light {\r\n  background-color: #2d3340;\r\n  border-color: #3d4554;\r\n  color: #dee2e6;\r\n}', to: '[data-theme="dark"] .btn-light {\r\n  background-color: var(--border-main, #2d3340);\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-secondary, #dee2e6);\r\n}' },
  { from: '[data-theme="dark"] .btn-light:hover {\n  background-color: #3d4554;\n  color: #ffffff;\n}', to: '[data-theme="dark"] .btn-light:hover {\n  background-color: var(--border-subtle, #3d4554);\n  color: var(--white, #ffffff);\n}' },
  { from: '[data-theme="dark"] .btn-light:hover {\r\n  background-color: #3d4554;\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .btn-light:hover {\r\n  background-color: var(--border-subtle, #3d4554);\r\n  color: var(--white, #ffffff);\r\n}' },
  { from: '[data-theme="dark"] .btn-outline-primary {\n  border-color: #388bfd;\n  color: #58a6ff;\n}', to: '[data-theme="dark"] .btn-outline-primary {\n  border-color: var(--primary, #388bfd);\n  color: #58a6ff;\n}' },
  { from: '[data-theme="dark"] .btn-outline-primary {\r\n  border-color: #388bfd;\r\n  color: #58a6ff;\r\n}', to: '[data-theme="dark"] .btn-outline-primary {\r\n  border-color: var(--primary, #388bfd);\r\n  color: #58a6ff;\r\n}' },
  { from: '[data-theme="dark"] .btn-outline-primary:hover,\n[data-theme="dark"] .btn-check:checked + .btn-outline-primary {\n  background-color: #388bfd;\n  border-color: #388bfd;\n  color: #ffffff;\n}', to: '[data-theme="dark"] .btn-outline-primary:hover,\n[data-theme="dark"] .btn-check:checked + .btn-outline-primary {\n  background-color: var(--primary, #388bfd);\n  border-color: var(--primary, #388bfd);\n  color: var(--white, #ffffff);\n}' },
  { from: '[data-theme="dark"] .btn-outline-primary:hover,\r\n[data-theme="dark"] .btn-check:checked + .btn-outline-primary {\r\n  background-color: #388bfd;\r\n  border-color: #388bfd;\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .btn-outline-primary:hover,\r\n[data-theme="dark"] .btn-check:checked + .btn-outline-primary {\r\n  background-color: var(--primary, #388bfd);\r\n  border-color: var(--primary, #388bfd);\r\n  color: var(--white, #ffffff);\r\n}' },
  { from: '[data-theme="dark"] .btn-outline-secondary {\n  border-color: #3d4554;\n  color: #9da5b1;\n}', to: '[data-theme="dark"] .btn-outline-secondary {\n  border-color: var(--border-subtle, #3d4554);\n  color: var(--text-muted, #9da5b1);\n}' },
  { from: '[data-theme="dark"] .btn-outline-secondary {\r\n  border-color: #3d4554;\r\n  color: #9da5b1;\r\n}', to: '[data-theme="dark"] .btn-outline-secondary {\r\n  border-color: var(--border-subtle, #3d4554);\r\n  color: var(--text-muted, #9da5b1);\r\n}' },
  { from: '[data-theme="dark"] .btn-outline-secondary:hover {\n  background-color: #3d4554;\n  color: #ffffff;\n}', to: '[data-theme="dark"] .btn-outline-secondary:hover {\n  background-color: var(--border-subtle, #3d4554);\n  color: var(--white, #ffffff);\n}' },
  { from: '[data-theme="dark"] .btn-outline-secondary:hover {\r\n  background-color: #3d4554;\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] .btn-outline-secondary:hover {\r\n  background-color: var(--border-subtle, #3d4554);\r\n  color: var(--white, #ffffff);\r\n}' },

  // Secondary text & subtle colors
  { from: '[data-theme="dark"] .stat-card-label {\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .stat-card-label {\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .stat-card-label {\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .stat-card-label {\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] .text-muted {\n  --bs-secondary-color: #cbd5e1;\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .text-muted {\n  --bs-secondary-color: var(--text-secondary, #cbd5e1);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .text-muted {\r\n  --bs-secondary-color: #cbd5e1;\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .text-muted {\r\n  --bs-secondary-color: var(--text-secondary, #cbd5e1);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] .bg-primary-subtle {\n  background-color: rgba(13, 110, 253, 0.2);\n  color: #6ea8fe;\n}', to: '[data-theme="dark"] .bg-primary-subtle {\n  background-color: var(--primary-subtle, rgba(13, 110, 253, 0.2));\n  color: #6ea8fe;\n}' },
  { from: '[data-theme="dark"] .bg-primary-subtle {\r\n  background-color: rgba(13, 110, 253, 0.2);\r\n  color: #6ea8fe;\r\n}', to: '[data-theme="dark"] .bg-primary-subtle {\r\n  background-color: var(--primary-subtle, rgba(13, 110, 253, 0.2));\r\n  color: #6ea8fe;\r\n}' },
  { from: '[data-theme="dark"] .bg-danger-subtle {\n  background-color: rgba(220, 53, 69, 0.2);\n  color: #ea868f;\n}', to: '[data-theme="dark"] .bg-danger-subtle {\n  background-color: var(--danger-subtle, rgba(220, 53, 69, 0.2));\n  color: #ea868f;\n}' },
  { from: '[data-theme="dark"] .bg-danger-subtle {\r\n  background-color: rgba(220, 53, 69, 0.2);\r\n  color: #ea868f;\r\n}', to: '[data-theme="dark"] .bg-danger-subtle {\r\n  background-color: var(--danger-subtle, rgba(220, 53, 69, 0.2));\r\n  color: #ea868f;\r\n}' },
  { from: '[data-theme="dark"] .bg-success-subtle {\n  background-color: rgba(25, 135, 84, 0.2);\n  color: #75b798;\n}', to: '[data-theme="dark"] .bg-success-subtle {\n  background-color: var(--success-subtle, rgba(25, 135, 84, 0.2));\n  color: #75b798;\n}' },
  { from: '[data-theme="dark"] .bg-success-subtle {\r\n  background-color: rgba(25, 135, 84, 0.2);\r\n  color: #75b798;\r\n}', to: '[data-theme="dark"] .bg-success-subtle {\r\n  background-color: var(--success-subtle, rgba(25, 135, 84, 0.2));\r\n  color: #75b798;\r\n}' },
  { from: '[data-theme="dark"] .bg-secondary-subtle {\n  background-color: rgba(148, 163, 184, 0.15);\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .bg-secondary-subtle {\n  background-color: rgba(148, 163, 184, 0.15);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .bg-secondary-subtle {\r\n  background-color: rgba(148, 163, 184, 0.15);\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .bg-secondary-subtle {\r\n  background-color: rgba(148, 163, 184, 0.15);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] .bg-secondary-subtle.text-secondary {\n  --bs-secondary-color: #cbd5e1;\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .bg-secondary-subtle.text-secondary {\n  --bs-secondary-color: var(--text-secondary, #cbd5e1);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .bg-secondary-subtle.text-secondary {\r\n  --bs-secondary-color: #cbd5e1;\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .bg-secondary-subtle.text-secondary {\r\n  --bs-secondary-color: var(--text-secondary, #cbd5e1);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },

  // Lines modal buttons
  { from: 'border: 1px solid var(--gray-200, #e2e8f0);\n  background: #ffffff;\n  color: var(--gray-700, #475569);', to: 'border: 1px solid var(--border-main, #e2e8f0);\n  background: var(--surface-card, #ffffff);\n  color: var(--text-secondary, #475569);' },
  { from: 'border: 1px solid var(--gray-200, #e2e8f0);\r\n  background: #ffffff;\r\n  color: var(--gray-700, #475569);', to: 'border: 1px solid var(--border-main, #e2e8f0);\r\n  background: var(--surface-card, #ffffff);\r\n  color: var(--text-secondary, #475569);' },
  { from: '#linesModal .action-btn.edit-line-btn:hover {\n  background: #eff6ff;\n  color: #0d6efd;\n  border-color: #bfdbfe;\n}', to: '#linesModal .action-btn.edit-line-btn:hover {\n  background: var(--info-subtle, #eff6ff);\n  color: var(--primary, #0d6efd);\n  border-color: #bfdbfe;\n}' },
  { from: '#linesModal .action-btn.edit-line-btn:hover {\r\n  background: #eff6ff;\r\n  color: #0d6efd;\r\n  border-color: #bfdbfe;\r\n}', to: '#linesModal .action-btn.edit-line-btn:hover {\n  background: var(--info-subtle, #eff6ff);\r\n  color: var(--primary, #0d6efd);\r\n  border-color: #bfdbfe;\r\n}' },
  { from: '#linesModal .action-btn.delete-line-btn:hover {\n  background: #fef2f2;\n  color: #dc3545;\n  border-color: #fecaca;\n}', to: '#linesModal .action-btn.delete-line-btn:hover {\n  background: var(--danger-subtle, #fef2f2);\n  color: var(--danger, #dc3545);\n  border-color: #fecaca;\n}' },
  { from: '#linesModal .action-btn.delete-line-btn:hover {\r\n  background: #fef2f2;\r\n  color: #dc3545;\r\n  border-color: #fecaca;\r\n}', to: '#linesModal .action-btn.delete-line-btn:hover {\r\n  background: var(--danger-subtle, #fef2f2);\r\n  color: var(--danger, #dc3545);\r\n  border-color: #fecaca;\r\n}' },
  { from: '[data-theme="dark"] #linesModal .action-btn {\n  background: #1e293b;\n  border-color: #334155;\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] #linesModal .action-btn {\n  background: var(--surface-card, #1e293b);\n  border-color: var(--border-subtle, #334155);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] #linesModal .action-btn {\r\n  background: #1e293b;\r\n  border-color: #334155;\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] #linesModal .action-btn {\r\n  background: var(--surface-card, #1e293b);\r\n  border-color: var(--border-subtle, #334155);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] #linesModal .action-btn:hover {\n  background: #334155;\n  color: #ffffff;\n}', to: '[data-theme="dark"] #linesModal .action-btn:hover {\n  background: var(--border-subtle, #334155);\n  color: var(--white, #ffffff);\n}' },
  { from: '[data-theme="dark"] #linesModal .action-btn:hover {\r\n  background: #334155;\r\n  color: #ffffff;\r\n}', to: '[data-theme="dark"] #linesModal .action-btn:hover {\r\n  background: var(--border-subtle, #334155);\r\n  color: var(--white, #ffffff);\r\n}' },

  // Badge nationwide & adapters
  { from: '.badge-nationwide {\n  background: #f3e8ff;\n  color: #7e22ce;\n  border: 1px solid #d8b4fe;\n}', to: '.badge-nationwide {\n  background: var(--purple-subtle, #f3e8ff);\n  color: var(--role-hr, #7e22ce);\n  border: 1px solid var(--purple-border, #d8b4fe);\n}' },
  { from: '.badge-nationwide {\r\n  background: #f3e8ff;\r\n  color: #7e22ce;\r\n  border: 1px solid #d8b4fe;\r\n}', to: '.badge-nationwide {\r\n  background: var(--purple-subtle, #f3e8ff);\r\n  color: var(--role-hr, #7e22ce);\r\n  border: 1px solid var(--purple-border, #d8b4fe);\r\n}' },
  { from: '[data-theme="dark"] .badge-nationwide {\n  background: rgba(168, 85, 247, 0.2) !important;\n  color: #d8b4fe !important;\n  border-color: rgba(168, 85, 247, 0.4) !important;\n}', to: '[data-theme="dark"] .badge-nationwide {\n  background: var(--purple-subtle, rgba(168, 85, 247, 0.2)) !important;\n  color: var(--purple-text, #d8b4fe) !important;\n  border-color: var(--purple-border, rgba(168, 85, 247, 0.4)) !important;\n}' },
  { from: '[data-theme="dark"] .badge-nationwide {\r\n  background: rgba(168, 85, 247, 0.2) !important;\r\n  color: #d8b4fe !important;\r\n  border-color: rgba(168, 85, 247, 0.4) !important;\r\n}', to: '[data-theme="dark"] .badge-nationwide {\r\n  background: var(--purple-subtle, rgba(168, 85, 247, 0.2)) !important;\r\n  color: var(--purple-text, #d8b4fe) !important;\r\n  border-color: var(--purple-border, rgba(168, 85, 247, 0.4)) !important;\r\n}' },

  // Impersonate button
  { from: 'color: #ffffff !important;', to: 'color: var(--white, #ffffff) !important;' },

  // Vacant node
  { from: 'background: #fffbeb !important;\n  border: 1px dashed #fcd34d !important;', to: 'background: var(--warning-subtle, #fffbeb) !important;\n  border: 1px dashed #fcd34d !important;' },
  { from: 'background: #fffbeb !important;\r\n  border: 1px dashed #fcd34d !important;', to: 'background: var(--warning-subtle, #fffbeb) !important;\r\n  border: 1px dashed #fcd34d !important;' },
  { from: '.tree-node-vacant-title {\n  color: #1e293b;\n}', to: '.tree-node-vacant-title {\n  color: var(--text-primary, #1e293b);\n}' },
  { from: '.tree-node-vacant-title {\r\n  color: #1e293b;\r\n}', to: '.tree-node-vacant-title {\r\n  color: var(--text-primary, #1e293b);\r\n}' },
  { from: '[data-theme="dark"] .tree-node-vacant-title {\n  color: #f8fafc !important;\n}', to: '[data-theme="dark"] .tree-node-vacant-title {\n  color: var(--text-primary, #f8fafc) !important;\n}' },
  { from: '[data-theme="dark"] .tree-node-vacant-title {\r\n  color: #f8fafc !important;\r\n}', to: '[data-theme="dark"] .tree-node-vacant-title {\r\n  color: var(--text-primary, #f8fafc) !important;\r\n}' },

  // Territories modal
  { from: 'background: var(--surface-bg, #f8fafc);\n  border: 1px solid var(--border-color, #e2e8f0);', to: 'background: var(--surface-subtle, #f8fafc);\n  border: 1px solid var(--border-main, #e2e8f0);' },
  { from: 'background: var(--surface-bg, #f8fafc);\r\n  border: 1px solid var(--border-color, #e2e8f0);', to: 'background: var(--surface-subtle, #f8fafc);\r\n  border: 1px solid var(--border-main, #e2e8f0);' },
  { from: 'background: #f1f5f9;\n  color: #475569;', to: 'background: var(--surface-hover, #f1f5f9);\n  color: var(--text-secondary, #475569);' },
  { from: 'background: #f1f5f9;\r\n  color: #475569;', to: 'background: var(--surface-hover, #f1f5f9);\r\n  color: var(--text-secondary, #475569);' },
  { from: 'border: 1px solid #cbd5e1;\n  background: #f8fafc;\n  color: #475569;', to: 'border: 1px solid var(--border-color, #cbd5e1);\n  background: var(--surface-subtle, #f8fafc);\n  color: var(--text-secondary, #475569);' },
  { from: 'border: 1px solid #cbd5e1;\r\n  background: #f8fafc;\r\n  color: #475569;', to: 'border: 1px solid var(--border-color, #cbd5e1);\n  background: var(--surface-subtle, #f8fafc);\r\n  color: var(--text-secondary, #475569);' },
  { from: '[data-theme="dark"] .territory-item-name {\n  color: #f1f5f9;\n}', to: '[data-theme="dark"] .territory-item-name {\n  color: var(--text-primary, #f1f5f9);\n}' },
  { from: '[data-theme="dark"] .territory-item-name {\r\n  color: #f1f5f9;\r\n}', to: '[data-theme="dark"] .territory-item-name {\r\n  color: var(--text-primary, #f1f5f9);\r\n}' },
  { from: '[data-theme="dark"] .territory-item-code {\n  background: rgba(255, 255, 255, 0.1);\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .territory-item-code {\n  background: rgba(255, 255, 255, 0.1);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .territory-item-code {\r\n  background: rgba(255, 255, 255, 0.1);\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .territory-item-code {\r\n  background: rgba(255, 255, 255, 0.1);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] .line-filter-pill {\n  background: rgba(255, 255, 255, 0.07);\n  border-color: rgba(255, 255, 255, 0.18);\n  color: #cbd5e1;\n}', to: '[data-theme="dark"] .line-filter-pill {\n  background: rgba(255, 255, 255, 0.07);\n  border-color: rgba(255, 255, 255, 0.18);\n  color: var(--text-secondary, #cbd5e1);\n}' },
  { from: '[data-theme="dark"] .line-filter-pill {\r\n  background: rgba(255, 255, 255, 0.07);\r\n  border-color: rgba(255, 255, 255, 0.18);\r\n  color: #cbd5e1;\r\n}', to: '[data-theme="dark"] .line-filter-pill {\r\n  background: rgba(255, 255, 255, 0.07);\r\n  border-color: rgba(255, 255, 255, 0.18);\r\n  color: var(--text-secondary, #cbd5e1);\r\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content {\n  background: #1e2229;\n  border-color: #2d3340;\n}', to: '[data-theme="dark"] .tree-node .node-content {\n  background: var(--surface-card, #1e2229);\n  border-color: var(--border-main, #2d3340);\n}' },
  { from: '[data-theme="dark"] .tree-node .node-content {\r\n  background: #1e2229;\r\n  border-color: #2d3340;\r\n}', to: '[data-theme="dark"] .tree-node .node-content {\r\n  background: var(--surface-card, #1e2229);\r\n  border-color: var(--border-main, #2d3340);\r\n}' }
];

let applied = 0;
for (const r of replacements) {
  if (css.includes(r.from)) {
    css = css.replace(r.from, r.to);
    applied++;
  }
}

fs.writeFileSync('css/users.css', css, 'utf8');
console.log(`Applied ${applied} batch replacements to css/users.css`);
