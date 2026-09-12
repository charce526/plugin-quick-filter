# NocoBase Quick Filter Plugin

Configurable instant filters for NocoBase collection action bars, with separate adapters for V1 Schema pages and V2 FlowEngine pages.

## Compatibility

- NocoBase: `>=2.2.0 <2.3.0`, reviewed against 2.2.10 APIs
- Page engines: V1 and V2
- Node.js: 22 or newer
- Server collections: none
- License: AGPL-3.0-only

The repository intentionally contains source only. Build artifacts and release archives are not committed.

## Highlights

- Select, single-button and multi-button presentations.
- Configurable title, tooltip, default value, multiple selection, operator and candidate values.
- Supported interfaces: `select`, `dictDataSingle`, `radioGroup`, `checkboxGroup`, `multipleSelect`, and `approvalStatus`.
- Multiple quick filters compose with each other, the regular filter action, and the block's base data scope.
- V1 registers both 2.2.x table action initializer names.
- V2 uses a dedicated action model and resource filter groups.

See [README.md](README.md) for installation and usage, and [docs/architecture.md](docs/architecture.md) for implementation details.
