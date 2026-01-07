const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

// Read version from package.json (single source of truth)
const pkg = JSON.parse(fs.readFileSync(path.join(srcDir, 'package.json'), 'utf8'));
const VERSION = pkg.version;

const itemsToCopy = [
    'assets',
    'css',
    'js',
    'index.html',
    'FEATURES.md',
    'README.md'
];

// Clean content of www
if (fs.existsSync(destDir)) {
    fs.rmSync(destDir, { recursive: true, force: true });
}
fs.mkdirSync(destDir);

console.log(`Building for mobile... (v${VERSION})`);

itemsToCopy.forEach(item => {
    const src = path.join(srcDir, item);
    const dest = path.join(destDir, item);

    if (fs.existsSync(src)) {
        console.log(`Copying ${item}...`);
        fs.cpSync(src, dest, { recursive: true });
    } else {
        console.warn(`Warning: ${item} not found.`);
    }
});

// --- Version Injection ---
console.log(`Injecting version ${VERSION}...`);

// 1. Patch index.html
const indexPath = path.join(destDir, 'index.html');
if (fs.existsSync(indexPath)) {
    let html = fs.readFileSync(indexPath, 'utf8');
    // Update title
    html = html.replace(/<title>Anansi - v[\d.]+<\/title>/g, `<title>Anansi - v${VERSION}</title>`);
    // Update comment
    html = html.replace(/<!-- Release Workflow Test [\d.]+ -->/g, `<!-- Release Workflow Test ${VERSION} -->`);
    fs.writeFileSync(indexPath, html, 'utf8');
    console.log('  → index.html patched');
}

// 2. Patch state.js
const statePath = path.join(destDir, 'js', 'core', 'state.js');
if (fs.existsSync(statePath)) {
    let js = fs.readFileSync(statePath, 'utf8');
    js = js.replace(/A\.VERSION = '[\d.]+';/g, `A.VERSION = '${VERSION}';`);
    fs.writeFileSync(statePath, js, 'utf8');
    console.log('  → state.js patched');
}

console.log('Build complete. Assets copied to ./www');
