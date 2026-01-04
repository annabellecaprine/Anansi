const fs = require('fs');
const path = require('path');

const srcDir = __dirname;
const destDir = path.join(__dirname, 'www');

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

console.log('Building for mobile...');

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

console.log('Build complete. Assets copied to ./www');
