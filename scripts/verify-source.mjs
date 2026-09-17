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
  'client.js',
  'client-v2.js',
  'server.js',
];

for (const path of required) {
  assert.ok(existsSync(join(root, path)), 'Missing required source file: ' + path);
}

const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.name, '@xiezuo/plugin-quick-filter');
assert.equal(pkg.version, '1.1.0');
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

for (const sourceFile of sourceFiles) {
  const source = readFileSync(sourceFile, 'utf8');
  const importPattern = /from\s+['"](\.[^'"]+)['"]/g;
  let match;
  while ((match = importPattern.exec(source))) {
    const target = resolve(dirname(sourceFile), match[1]);
    const candidates = [
      target,
      target + '.ts',
      target + '.tsx',
      join(target, 'index.ts'),
      join(target, 'index.tsx'),
    ];
    assert.ok(
      candidates.some((candidate) => existsSync(candidate)),
      'Unresolved relative import: ' + relative(root, sourceFile) + ' -> ' + match[1],
    );
  }
}
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

assert.ok(!v1.includes("from '@nocobase/client-v2'"), 'V1 adapter directly imports the V2 client');
assert.ok(!v2.includes("from '@nocobase/client'"), 'V2 source imports the V1 client');
assert.ok(!shared.includes('@nocobase/client'), 'Shared source depends on a page engine');

const v1Entry = read('src/client/index.tsx');
assert.ok(v1Entry.includes('table:configureActions'), 'Modern V1 table initializer is not registered');
assert.ok(v1Entry.includes('TableActionInitializers'), 'Legacy V1 table initializer is not registered');
assert.ok(v1Entry.includes('QuickFilterActionModel'), 'Hybrid-shell V2 model bridge is missing');
assert.ok(
  v1Entry.includes('this.app.flowEngine.registerModels'),
  'Hybrid-shell V2 model is not registered from the legacy client entry',
);

const v1Filter = read('src/client/QuickFilter.tsx');
assert.ok(v1Filter.includes('mergeFilter'), 'V1 filter composition is missing');
assert.ok(v1Filter.includes('filters'), 'V1 named filter sources are missing');
assert.ok(
  v1Filter.includes('const { getDataBlockRequest } = useDataBlockRequestGetter()'),
  'V1 request getter does not match the NocoBase 2.2.x API',
);
assert.ok(v1Filter.includes('useSchemaToolbarRender'), 'V1 schema settings toolbar is not rendered');
assert.ok(v1Filter.includes('<SortableItem'), 'V1 quick filter is not mounted as a configurable schema item');

const v1Initializer = read('src/client/QuickFilterInitializer.tsx');
assert.ok(
  v1Initializer.includes('SchemaComponentOptions'),
  'V1 initializer dialog does not preserve the page schema component context',
);
assert.ok(
  v1Initializer.includes('SchemaOptionsContext'),
  'V1 initializer dialog does not read the page schema options',
);
assert.ok(!v1Initializer.includes('<FormProvider'), 'V1 initializer redundantly nests a Formily form provider');

const v1Settings = read('src/client/quickFilterSettings.tsx');
assert.ok(v1Settings.includes("type: 'remove'"), 'V1 remove setting is missing');

const control = read('src/shared/QuickFilterControl.tsx');
assert.ok(control.includes("styleType === 'select'"), 'Select display mode is missing');
assert.ok(control.includes('<Radio.Group'), 'Single-button display mode is missing');
assert.ok(control.includes('<Checkbox.Group'), 'Multi-button display mode is missing');
assert.ok(!control.includes('size="small"'), 'Quick-filter controls still use the undersized variant');
assert.ok(control.includes('minWidth: 180'), 'Quick-filter select width was not enlarged');
assert.ok(
  control.includes('normalizeQuickFilterValue(value, multiple)'),
  'Quick-filter control does not normalize scalar, empty and multiple values',
);
assert.ok(
  control.includes("closest('.ant-space-item')"),
  'Quick-filter controls are not promoted to independent action-bar rows',
);

const utils = read('src/shared/utils.ts');
assert.ok(utils.includes('normalizeQuickFilterArray'), 'Quick-filter array normalization is missing');
assert.ok(utils.includes('normalizeQuickFilterValue'), 'Quick-filter value normalization is missing');
assert.ok(
  utils.includes('normalizeQuickFilterValueByOperator'),
  'Quick-filter values are not normalized according to operator requirements',
);
for (const operator of ['$match', '$notMatch', '$anyOf', '$noneOf', '$in', '$notIn']) {
  assert.ok(utils.includes(`'${operator}'`), `Array-value operator normalization is missing: ${operator}`);
}
assert.ok(
  utils.includes('if (!multiple || isArrayInterface(fieldInterface)) return requested;'),
  'Array-field operators are still being rewritten when the control allows multiple values',
);

const v2Model = read('src/client-v2/QuickFilterActionModel.tsx');
for (const api of ['addFilterGroup', 'removeFilterGroup', 'setFilterActive', 'setPage']) {
  assert.ok(v2Model.includes(api), 'V2 resource integration is missing: ' + api);
}
assert.ok(
  v2Model.includes('CollectionActionGroupModel.registerActionModels'),
  'V2 model is not registered in the collection action menu',
);
assert.ok(
  v2Model.includes('applyDefaultValueOnce'),
  'V2 default-value application is not guarded against FlowEngine remounts',
);
assert.ok(
  !v2Model.includes('return () => model.detach()'),
  'V2 filter is still detached by the React effect cleanup path',
);

assert.equal(read('client.js').trim(), "module.exports = require('./dist/client/index.js');");
assert.equal(read('client-v2.js').trim(), "module.exports = require('./dist/client-v2/index.js');");
assert.equal(read('server.js').trim(), "module.exports = require('./dist/server/index.js');");

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

// Build artifacts are committed so the plugin can be installed directly from
// git; assert the packaged entry points are present.
for (const path of ['dist/client/index.js', 'dist/client-v2/index.js', 'dist/server/index.js']) {
  assert.ok(existsSync(join(root, path)), 'Missing build artifact: ' + path);
}
console.log('Source validation passed: metadata, adapter boundaries, hybrid V2 bridge and filter APIs are consistent.');
