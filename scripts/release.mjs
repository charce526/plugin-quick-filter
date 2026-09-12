#!/usr/bin/env node
/**
 * 一键发行脚本：写入发行版本号 -> 编译并打包 -> 输出可上传的发行包。
 *
 * 用法：
 *   node scripts/release.mjs 1.0.1              # 写入版本号、编译、打包，产物在 release/
 *   node scripts/release.mjs 1.0.1 --no-build   # 只写入版本号（CI 或仅需改版本时用）
 *
 * 编译依赖 NocoBase 工作区（@nocobase/build），脚本会从插件目录逐级向上找到项目根目录，
 * 再执行 `yarn build @xiezuo/plugin-quick-filter --tar`；发行包内的 package.json 会带上
 * 这里写入的版本号，即“发行包中自动填写发行版”。
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const pluginDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

/** 从插件目录向上寻找 NocoBase 项目根目录（含 workspaces 与 nocobase 构建脚本的 package.json） */
function findAppRoot(start) {
  let dir = start;
  for (;;) {
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
    const candidate = path.join(dir, 'package.json');
    if (!fs.existsSync(candidate)) {
      continue;
    }
    try {
      const json = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      if (json.workspaces && String(json.scripts?.build || '').includes('nocobase')) {
        return dir;
      }
    } catch {
      // 非 JSON 或读不到，继续向上找
    }
  }
}

const args = process.argv.slice(2);
const noBuild = args.includes('--no-build');
const version = args.find((item) => !item.startsWith('--'));

if (!version || !SEMVER.test(version)) {
  console.error('用法: node scripts/release.mjs <版本号，例如 1.0.1> [--no-build]');
  process.exit(1);
}

const pkgPath = path.join(pluginDir, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
const previousVersion = pkg.version;
pkg.version = version;
fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(`[release] package.json 版本：${previousVersion} -> ${version}`);

const changelogPath = path.join(pluginDir, 'CHANGELOG.md');
const changelogHeading = new RegExp(`^##+ \\[?${version.replace(/\./g, '\\.')}\\]?`, 'm');
if (fs.existsSync(changelogPath) && !changelogHeading.test(fs.readFileSync(changelogPath, 'utf8'))) {
  console.warn(`[release] 提示：CHANGELOG.md 中还没有「## ${version}」段落，建议先补上本次更新说明。`);
}

if (noBuild) {
  console.log('[release] 已跳过编译（--no-build）。');
  process.exit(0);
}

const appRoot = findAppRoot(pluginDir);
if (!appRoot) {
  console.error('[release] 未找到 NocoBase 项目根目录，无法编译。');
  console.error('        请把插件放在 <项目>/packages/plugins/@xiezuo/plugin-quick-filter 下，或用 --no-build 只写入版本号。');
  process.exit(1);
}
console.log(`[release] 项目根目录：${appRoot}`);

console.log(`[release] 执行：yarn build ${pkg.name} --tar`);
const build = spawnSync(`yarn build ${pkg.name} --tar`, {
  cwd: appRoot,
  stdio: 'inherit',
  shell: true,
});
if (build.status !== 0) {
  console.error(`[release] 编译失败，退出码 ${build.status}`);
  process.exit(build.status ?? 1);
}

const releaseDir = path.join(pluginDir, 'release');
const assetName = `${pkg.name.split('/').pop()}-${version}.tgz`;

/** 打包产物路径：storage/tar/<包名>-<版本>.tgz（包名带作用域时会多出一层目录） */
function findTarball() {
  const expected = path.join(appRoot, 'storage', 'tar', `${pkg.name}-${version}.tgz`);
  if (fs.existsSync(expected)) {
    return expected;
  }
  const tarRoot = path.join(appRoot, 'storage', 'tar');
  if (!fs.existsSync(tarRoot)) {
    return null;
  }
  const queue = [tarRoot];
  while (queue.length) {
    const dir = queue.shift();
    for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
      const target = path.join(dir, item.name);
      if (item.isDirectory()) {
        queue.push(target);
      } else if (item.name === `${pkg.name}-${version}.tgz` || item.name === assetName) {
        return target;
      }
    }
  }
  return null;
}

const tarball = findTarball();
if (!tarball) {
  console.error(`[release] 未在 storage/tar 下找到发行包：${pkg.name}-${version}.tgz`);
  process.exit(1);
}

fs.mkdirSync(releaseDir, { recursive: true });
const assetPath = path.join(releaseDir, assetName);
fs.copyFileSync(tarball, assetPath);

const size = (fs.statSync(assetPath).size / 1024).toFixed(1);
console.log('');
console.log(`[release] 发行包已生成：${path.relative(pluginDir, assetPath)} (${size} KB)`);
console.log('[release] 后续步骤：');
console.log(`  1. 提交并推 tag：git add -A && git commit -m "chore: release ${version}" && git tag v${version} && git push origin main --tags`);
console.log('  2. 推送 tag 后 GitHub Actions 会自动创建 Release 并上传发行包；');
console.log(`     也可手动上传：把 release/${assetName} 拖到 Release 附件中。`);
