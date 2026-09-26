import { Plugin } from '@nocobase/client';
import { QuickFilterActionModel, registerQuickFilterDragHandler } from '../client-v2/QuickFilterActionModel';
import { localeResources, NAMESPACE } from '../shared/locale';
import { QuickFilter } from './QuickFilter';
import { QuickFilterInitializer } from './QuickFilterInitializer';
import { quickFilterSettings } from './quickFilterSettings';
import { SmartFilterInitializer } from './SmartFilterInitializer';

export class PluginQuickFilterClient extends Plugin {
  async load() {
    Object.entries(localeResources).forEach(([language, resource]) => {
      this.app.i18n.addResources(language, this.options?.packageName || NAMESPACE, resource);
      this.app.i18n.addResources(language, NAMESPACE, resource);
    });

    this.app.addComponents({
      QuickFilter,
      QuickFilterInitializer,
      SmartFilterInitializer,
    });
    this.app.schemaSettingsManager.add(quickFilterSettings);

    // NocoBase 2.2.x can render V2 pages inside the legacy client shell. In
    // that mode only this client entry is loaded, so register the V2 model here
    // as well. This mirrors the compatibility bridge used by built-in plugins.
    // The model is typed against the FlowEngine copy bundled with
    // @nocobase/client-v2, so pass it through `any` for the legacy registry.
    this.app.flowEngine.registerModels({ QuickFilterActionModel } as any);
    // Same bridge as the model registry: V2 pages hosted by the hybrid shell
    // also need the quick-filter drag handle to be reordered.
    registerQuickFilterDragHandler(this.app.flowEngine);

    const initializer = {
      title: "{{ t('Quick filter', { ns: '@xiezuo/plugin-quick-filter' }) }}",
      Component: QuickFilterInitializer,
    };
    // `table:configureActions` and `TableActionInitializers` are synced aliases
    // (CompatibleSchemaInitializer); registering one is enough, adding to both
    // would duplicate the "Quick filter" menu entry.
    const tableActionInitializer =
      this.app.schemaInitializerManager.get('TableActionInitializers') ||
      this.app.schemaInitializerManager.get('table:configureActions');
    tableActionInitializer?.add('customize.quickFilter', initializer);

    // Smart filter is the multi-field variant: it reuses the same runtime
    // component and settings, but its target field list is multiple.
    const smartInitializer = {
      title: "{{ t('Smart filter', { ns: '@xiezuo/plugin-quick-filter' }) }}",
      Component: SmartFilterInitializer,
    };
    tableActionInitializer?.add('customize.smartFilter', smartInitializer);
  }
}

export default PluginQuickFilterClient;
