const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const loginHtmlPath = path.resolve('login.html');
let content = fs.readFileSync(loginHtmlPath, 'utf8');

// Hide departmentView and loginFormView, display forcePasswordBox
content = content.replace('<div class="department-view" id="departmentView">', '<div class="department-view" id="departmentView" style="display: none !important;">');
content = content.replace('<div class="login-box" id="forcePasswordBox" style="display: none;">', '<div class="login-box" id="forcePasswordBox" style="display: block !important;">');

// Personalize message for preview
content = content.replace(
  'Welcome! For security, you must choose a new personal password before accessing the system.',
  'Welcome, Ahmed Mahmoud! For security, you must choose a new personal password before accessing the system.'
);

// Disable script loading that might reset state
content = content.replace(/<script src="js\/login\.js[^"]*"><\/script>/, '<!-- static preview -->');

const previewHtmlPath = path.resolve('preview_force_login.html');
fs.writeFileSync(previewHtmlPath, content, 'utf8');

const screenshotOutPath = 'C:\\Users\\DeLL\\.gemini\\antigravity\\brain\\b53c222b-c0d3-476a-b520-5a9e86e62746\\force_password_screen.png';
const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const fileUrl = 'file:///' + previewHtmlPath.replace(/\\/g, '/');

console.log('Capturing screenshot with Edge from root...');
const cmd = `"${edgePath}" --headless=new --disable-gpu --window-size=1280,850 --screenshot="${screenshotOutPath}" "${fileUrl}"`;
execSync(cmd);

console.log('Screenshot successfully saved to:', screenshotOutPath);
fs.unlinkSync(previewHtmlPath);
const stats = fs.statSync(screenshotOutPath);
console.log('File size:', stats.size, 'bytes');
