#!/usr/bin/env node
/**
 * Copies root "buffer" into every nested node_modules so Metro can resolve it
 * when building from any package (expo start vs expo run:android can hit different paths).
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const nmRoot = path.join(projectRoot, 'node_modules');
const bufferSrc = path.join(nmRoot, 'buffer');

function copyRecursive(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function findNestedNodeModules(dir, list) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory() && e.name === 'node_modules') {
      list.push(path.join(dir, e.name));
    }
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'buffer') {
      findNestedNodeModules(path.join(dir, e.name), list);
    }
  }
}

if (!fs.existsSync(bufferSrc)) {
  console.warn('link-buffer: root buffer not found, skipping');
  process.exit(0);
}

const nested = [];
findNestedNodeModules(nmRoot, nested);

for (const nodeModulesDir of nested) {
  const bufferDest = path.join(nodeModulesDir, 'buffer');
  if (fs.existsSync(path.join(bufferDest, 'package.json'))) continue;
  try {
    if (fs.existsSync(bufferDest)) fs.rmSync(bufferDest, { recursive: true });
    copyRecursive(bufferSrc, bufferDest);
    console.log('link-buffer: copied buffer into', path.relative(projectRoot, nodeModulesDir));
  } catch (e) {
    console.warn('link-buffer:', path.relative(projectRoot, nodeModulesDir), e.message);
  }
}
