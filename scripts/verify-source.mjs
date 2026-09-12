import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const required = [
  'package.json',
  'src/shared/types.ts',
  'src/shared/utils.ts',
  'src/shared/QuickFilterControl.tsx',
  'src/client/index.tsx',
  'src/client/QuickFilter.tsx',
  'src/client/QuickFilterInitializer.tsx',
  'src/client/quickFilterSettings.tsx',
  'src/client-v2/index.tsx',
  'src/client-v2/QuickFilterActionModel.tsx',
  'src/server/index.ts',
  'src/server/plugin.ts',
];

for (const path of required) {
  assert.ok(existsSync(join(root, path)), 'Missing required source file: ' + path);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, '@xiezuo/plugin-quick-filter');
assert.equal(pkg.version, '1.0.0');
assert.equal(pkg.author?.name, '偕作BIM');
assert.equal(pkg.license, 'AGPL-3.0-only');
for (const dependency of [
  '@nocobase/client',
  '@nocobase/client-v2',
  '@nocobase/flow-engine',
  '@nocobase/server',
]) {
  assert.equal(
    pkg.peerDependencies?.[dependency],
    '>=2.2.0 <2.3.0',
    'Incorrect 2.2.x peer range for ' + dependency,
  );
}

function walk(path) {
  return readdirSync(path).flatMap((name) => {
    const child = join(path, name);
    return statSync(child).isDirectory() ? walk(child) : [child];
  });
}

const sourceFiles = walk(join(root, 'src')).filter((path) => /\.(ts|tsx)$/.test(path));
const read = (path) => readFileSync(join(root, path), 'utf8');
const v1 = sourceFiles
  .filter((path) => relative(root, path).startsWith('src/client/'))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');
const v2 = sourceFiles
  .filter((path) => relative(root, path).startsWith('src/client-v2/'))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');
const shared = sourceFiles
  .filter((path) => relative(root, path).startsWith('src/shared/'))
  .map((path) => readFileSync(path, 'utf8'))
  .join('\n');

assert.ok(!v1.includes("@nocobase/client-v2"), 'V1 source imports the V2 client');
assert.ok(!v2.includes("from '@nocobase/client'"), 'V2 source imports the V1 client');
assert.ok(!shared.includes('@nocobase/client'), 'Shared source depends on a page engine');

const v1Entry = read('src/client/index.tsx');
assert.ok(v1Entry.includes('table:configureActions'), 'Modern V1 table initializer is not registered');
assert.ok(v1Entry.includes('TableActionInitializers'), 'Legacy V1 table initializer is not registered');

const v1Filter = read('src/client/QuickFilter.tsx');
assert.ok(v1Filter.includes('mergeFilter'), 'V1 filter composition is missing');
assert.ok(v1Filter.includes('filters'), 'V1 named filter sources are missing');

const v2Model = read('src/client-v2/QuickFilterActionModel.tsx');
for (const api of ['addFilterGroup', 'removeFilterGroup', 'setFilterActive', 'setPage']) {
  assert.ok(v2Model.includes(api), 'V2 resource integration is missing: ' + api);
}

const types = read('src/shared/types.ts');
for (const name of [
  'select',
  'dictDataSingle',
  'radioGroup',
  'checkboxGroup',
  'multipleSelect',
  'approvalStatus',
]) {
  assert.ok(types.includes("'" + name + "'"), 'Supported field interface missing: ' + name);
}

assert.ok(!existsSync(join(root, 'dist')), 'dist must not be committed in this source-only repository');
console.log('Source validation passed: metadata, structure, V1/V2 isolation and filter APIs are consistent.');
