# NocoBase 快捷筛选插件

为 NocoBase 数据表格操作栏提供可配置的选项快捷筛选与文本搜索，同时兼容 V1 Schema 页面与 V2 FlowEngine 页面。

## 兼容范围

| 项目 | 支持范围 |
| --- | --- |
| NocoBase | `>=2.2.0 <2.3.0`（以 2.2.10 API 校验） |
| 页面引擎 | V1 与 V2 |
| Node.js | >= 22 |
| 服务端数据表 | 不需要 |
| 许可证 | AGPL-3.0-only |

本仓库同时提交源码与 NocoBase 构建产物 `dist`，因此可直接通过 git 安装；`dist` 由插件构建命令生成，请勿手工修改。

## 功能

- 支持下拉、单选按钮、多选按钮三种样式。
- 文本字段显示搜索框，只在点击“搜索”或按 Enter 时执行筛选，不会随输入逐字请求。
- 支持显示字段标题、提示信息、默认值、多选、运算符和候选值范围。
- 每个快捷筛选可单独配置“独占一行”；未勾选时与其他快捷筛选横向排列，右侧自定义操作保持固定。
- 选项字段支持 `select`、`dictDataSingle`、`radioGroup`、`checkboxGroup`、`multipleSelect`、`approvalStatus`。
- 文本搜索支持 `input`、`textarea`、`email`、`phone`、`url` 字段接口。
- 多个快捷筛选可同时使用，并与普通筛选及区块数据范围合并。
- 选择“全部”或清空选择时，只移除当前快捷筛选，不影响其他筛选条件。
- V2 手动加载模式下遵循 NocoBase 原生筛选动作的数据清空行为。

## 安装源码

将仓库放入 NocoBase 项目的插件目录，例如：

```bash
git clone https://github.com/charce526/plugin-quick-filter.git \
  packages/plugins/@xiezuo/plugin-quick-filter
```

在 NocoBase 项目根目录安装依赖、编译并启用插件。不同部署方式的具体命令以对应 NocoBase 2.2.x 项目为准。

## 使用

### V1 页面

1. 开启 UI 配置模式。
2. 在表格操作栏点击“配置操作”。
3. 选择“快捷筛选”，再选择目标字段与初始样式。
4. 通过组件右上角设置菜单继续配置标题、独占一行、默认值、运算符和候选值；文本字段还可配置占位文字。

插件注册 V1 表格操作初始化器：优先现行名 `TableActionInitializers`，回退旧名 `table:configureActions`（二者在 2.2.x 内互为同步别名），避免重复注册相同的菜单项。

### V2 页面

1. 开启 UI 配置模式。
2. 在表格操作区添加操作。
3. 展开“快捷筛选”，直接选择目标字段。
4. 在快捷筛选设置中调整基本设置、独占一行、显示设置及值与运算符。

V2 使用独立的 `QuickFilterActionModel`，通过区块资源的筛选组 API 与原生筛选共同工作。

## 字段选项

插件优先读取字段当前提供的 `uiSchema.enum` 或组件 `options`，并在页面配置中保存一份可序列化快照作为回退。字典和审批状态等由其他插件提供的字段，只要其字段接口提供选项或异步选项解析器，运行时即可显示。

## 源码验证

无需安装依赖即可执行基础静态检查：

```bash
node scripts/verify-source.mjs
```

该检查验证目录结构、包元数据、2.2.x peer 范围、适配层边界、V1 初始化器注册、V2 动作注册与两套筛选合并 API。它不替代在你的 NocoBase 实例中的编译与交互测试。

## 发行

`release/` 目录保存可直接分发/安装的发行包 `plugin-quick-filter-<版本>.tgz`，由 `node scripts/release.mjs <版本>` 生成（内部执行 `yarn build @xiezuo/plugin-quick-filter --tar`）。推送 `v*` 标签、或推送包含 `release/*.tgz` 的 main 提交时，`.github/workflows/release.yml` 会校验版本并自动创建 GitHub Release、附带该发行包。

## 设计说明

详见 [docs/architecture.md](docs/architecture.md)。

## 作者

偕作BIM · [xzbim.cn](https://www.xzbim.cn)
