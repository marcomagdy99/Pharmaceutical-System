const fs = require('fs');

let app = fs.readFileSync('js/app.js', 'utf8');

const targetRequireAuth = `function requireAuth() {
  const user = checkAuth();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.replace("login.html");
    return null;
  }
  enforcePageRoleSecurity();
  return user;
}`;

const enhancedRequireAuth = `function requireAuth() {
  const user = checkAuth();
  if (!user && !window.location.href.includes("login.html")) {
    window.location.replace("login.html");
    return null;
  }
  // Defense-in-depth: if user must change password, deny access and redirect to login
  if (user && user.mustChangePassword && !window.location.href.includes("login.html")) {
    sessionStorage.removeItem("pharmaUser");
    localStorage.removeItem("pharmaUser");
    window.location.replace("login.html");
    return null;
  }
  enforcePageRoleSecurity();
  return user;
}`;

if (app.includes(targetRequireAuth)) {
  app = app.replace(targetRequireAuth, enhancedRequireAuth);
  fs.writeFileSync('js/app.js', app, 'utf8');
  console.log('✅ Updated requireAuth in js/app.js with password change enforcement');
} else {
  console.error('❌ Could not find targetRequireAuth in js/app.js');
}
