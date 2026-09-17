# Changelog

## Unreleased

- Normalized empty, scalar and array values before rendering multi-select controls and building filters.
- Rendered every quick-filter object on its own action-bar row in both V1 and V2 pages.
- Enlarged select and button controls to the standard action-bar size and increased spacing.
- Registered the V2 action model from the legacy client entry for V2 pages hosted by the NocoBase 2.2.x hybrid shell.
- Preserved the V1 page schema context inside the quick-filter creation dialog so field and display-style selections work normally.
- Rendered the V1 schema toolbar around quick filters, enabling configuration, drag handling and deletion.
- Registered the V2 model in the collection action group's explicit registry so its field submenu is visible.
- Extended source verification to cover the V1 toolbar/display modes, V2 action-menu registration and package entry shims.
- Fixed the declaration build and committed the NocoBase build output (`dist`) so the plugin can be installed directly from git.
- Registered a single table action initializer and removed an unused locale key.
- Added a distributable release package (`release/*.tgz`) and a tag-driven GitHub Release workflow.

## 1.0.0

- Initial source release.
- Added NocoBase 2.2.x compatibility metadata.
- Added V1 Schema page quick-filter initializer, settings and request-filter composition.
- Added V2 FlowEngine quick-filter action model, field submenu and filter-group composition.
- Added shared controls, option resolution, operators, Chinese/English locales and source validation.
