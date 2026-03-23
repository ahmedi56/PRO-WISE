const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Verifying Sprint 1 Setup...');

const checks = [
    'web/package.json',
    'web/src/App.jsx',
    'web/src/pages/LoginPage.jsx',
    'web/src/pages/RegisterPage.jsx',
    'web/src/pages/ProfilePage.jsx',
    'backend/api/policies/has-permission.js',
    'mobile/src/context/AuthContext.jsx'
];

let missing = false;
checks.forEach(f => {
    if (fs.existsSync(path.join(__dirname, f))) {
        console.log(`[OK] Found ${f}`);
    } else {
        console.log(`[MISSING] ${f}`);
        missing = true;
    }
});

if (missing) {
    console.error('\nSome files are missing! Please contact the developer.');
    process.exit(1);
}

console.log('\nAll files present. You must run "npm install" to update dependencies.');
console.log('Then restart your servers to see the changes.');
