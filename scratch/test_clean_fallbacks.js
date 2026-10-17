const fs = require('fs');

let usersCss = fs.readFileSync('css/users.css', 'utf8');
let activitiesCss = fs.readFileSync('css/activities.css', 'utf8');

const cleanupFallbacks = (css) => {
  return css
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
};

const cleanUsers = cleanupFallbacks(usersCss);
const cleanActivities = cleanupFallbacks(activitiesCss);

const uHex = (cleanUsers.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;
const aHex = (cleanActivities.match(/#[0-9a-fA-F]{3,8}\b/g) || []).length;

console.log('Hex count after cleaning in users.css:', uHex, '(was 174)');
console.log('Hex count after cleaning in activities.css:', aHex, '(was 392)');
