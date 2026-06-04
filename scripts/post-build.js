#!/usr/bin/env node
/**
 * Cross-platform post-build script to copy .next/static and public
 * directories to .next/standalone for production deployment.
 * Works on Windows, macOS, and Linux.
 */

const fs = require('fs');
const path = require('path');

function copyDirRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

try {
  console.log('Copying .next/static to .next/standalone/.next/...');
  copyDirRecursive(
    path.join(__dirname, '..', '.next', 'static'),
    path.join(__dirname, '..', '.next', 'standalone', '.next', 'static')
  );

  console.log('Copying public to .next/standalone/...');
  copyDirRecursive(
    path.join(__dirname, '..', 'public'),
    path.join(__dirname, '..', '.next', 'standalone', 'public')
  );

  console.log('✓ Post-build copy completed successfully');
  process.exit(0);
} catch (error) {
  console.error('✗ Post-build copy failed:', error.message);
  process.exit(1);
}
