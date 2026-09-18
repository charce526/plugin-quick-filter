# 架构与兼容性说明

## 目标

插件锁定 NocoBase 2.2.x。开发基准为 2.2.10，包的 peer 依赖明确限制为 `>=2.2.0 <2.3.0`，避免误装到尚未验证的 2.3 及更高版本。

## 分层

| 层 | 目录 | 职责 |
| --- | --- | --- |
| 共享层 | `src/shared` | 字段识别、选项解析、运算符归一、过滤条件生成与通用 UI |
| V1 适配 | `src/client` | SchemaInitializer、SchemaSettings、数据区块请求合并及混合外壳 V2 模型桥接 |
| V2 适配 | `src/client-v2` | FlowModel 注册、设置 Flow、资源筛选组 |
| 服务端 | `src/server` | 客户端插件占位入口，不创建资源或数据表 |

共享层不导入 `@nocobase/client` 或 `@nocobase/client-v2`，防止页面引擎边界混用。

## V1 筛选合并

每个组件使用 `quickFilter:<schema uid>` 作为来源键，写入数据区块请求第二参数中的 `filters` 映射。刷新时调用 NocoBase 的 `mergeFilter` 合并：

1. 所有快捷筛选来源；
2. 原生普通筛选来源；
3. 区块基础 `params.filter` 数据范围。

因此清空某个快捷筛选只删除自己的来源键。

V1 的新建弹窗会显式继承当前页面的 `SchemaOptionsContext`，确保弹窗 Portal 中仍能解析 NocoBase 的表单组件。快捷筛选本体使用 `SortableItem` 并主动渲染 `ActionSchemaToolbar`，因此设置、拖动和删除均沿用原生 UI Schema 机制。

## V2 筛选合并

每个 `QuickFilterActionModel` 使用模型 `uid` 作为筛选组 ID：

- 有值：`resource.addFilterGroup(uid, filter)`；
- 无值：`resource.removeFilterGroup(uid)`；
- 同步调用 `blockModel.setFilterActive`；
- 将页码重置为 1 后刷新资源。

这与 NocoBase 2.2.10 原生 `FilterActionModel` 使用同一组资源接口。

V2 添加菜单中的字段选择会同时写入模型 `props` 和内部初始化 `stepParams`。运行时与设置流程统一读取有效配置，因此即使某些 2.2.x 页面外壳在创建阶段没有保留字段 `props`，也能从初始化参数恢复目标字段，不需要用户在“基本设置”中再次选择。

模型既注册到 FlowEngine，也注册到 `CollectionActionGroupModel` 的动作表；前者负责模型创建与恢复，后者确保它出现在 V2 集合区块的“添加操作”菜单中。NocoBase 2.2.x 还可能在旧客户端外壳中承载 V2 页面，因此 `src/client` 会像官方操作插件一样同步注册该模型；独立 V2 外壳则继续使用 `src/client-v2` 入口。

## 字段、交互与运算符

标量选项字段默认使用 `$eq`，多选时归一为 `$in`。数组选项字段默认使用 `$match`，多选时归一为 `$anyOf`。同时提供相反运算符供页面设计者选择。

文本字段（`input`、`textarea`、`email`、`phone`、`url`）使用独立的搜索框，默认运算符为 `$includes`，还可选择 `$notIncludes`、`$eq`、`$ne`。输入内容仅保存在控件草稿状态，点击搜索或按 Enter 后才写入筛选组并刷新资源；提交空白内容会移除当前筛选。

每个配置通过 `fullRow` 独立决定是否占满操作栏左侧一行。未启用时多个快捷筛选可以同行排列；布局层始终保护右侧操作组不收缩、不被快捷筛选挤到下一行。

## 配置持久化

V1 配置写入 UI Schema 的 `x-component-props`；V2 配置写入 FlowModel props。选项快照只作为字段提供者暂不可用时的回退，运行时优先读取字段的实时选项。旧配置没有 `fullRow` 时按未勾选处理。
