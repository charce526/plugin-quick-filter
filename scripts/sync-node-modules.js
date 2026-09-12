/**
 * 将构建产物同步到 node_modules，供 NocoBase 运行时按包名加载插件。
 *
 * 正常情况下 NocoBase 启动时会用 junction / 符号链接把 packages/plugins 下的插件链接到
 * node_modules。当前机器（Windows）无法遍历这类链接（scandir 报 UNKNOWN: unknown error），
 * 因此这里改为把构建产物真实复制一份到 node_modules，效果等价。
 */
const fs = require('fs');
const path = require('path');

const pkgDir = path.resolve(__dirname, '..');
const pkg = require(path.join(pkgDir, 'package.json'));
const targetDir = path.resolve(pkgDir, '..', '..', '..', '..', 'node_modules', pkg.name);

try {
  // 已存在的链接（junction/lstat 为符号链接）先删掉，再创建真实目录
  if (fs.lstatSync(targetDir).isSymbolicLink()) {
    fs.unlinkSync(targetDir);
  } else {
    fs.rmSync(targetDir, { recursive: true, force: true });
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}

fs.mkdirSync(targetDir, { recursive: true });

const ignored = new Set(['src', 'node_modules', 'scripts', '.git']);
for (const item of fs.readdirSync(pkgDir)) {
  if (ignored.has(item)) continue;
  fs.cpSync(path.join(pkgDir, item), path.join(targetDir, item), { recursive: true });
}

console.log(`[sync-node-modules] ${pkg.name} -> ${targetDir}`);
