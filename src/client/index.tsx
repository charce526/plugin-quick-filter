import { Plugin } from '@nocobase/client';
import { QuickFilterActionModel } from '../client-v2/QuickFilterActionModel';
import { localeResources, NAMESPACE } from '../shared/locale';
import { QuickFilter } from './QuickFilter';
import { QuickFilterInitializer } from './QuickFilterInitializer';
import { quickFilterSettings } from './quickFilterSettings';

export class PluginQuickFilterClient extends Plugin {
  async load() {
    Object.entries(localeResources).forEach(([language, resource]) => {
      this.app.i18n.addResources(language, this.options?.packageName || NAMESPACE, resource);
      this.app.i18n.addResources(language, NAMESPACE, resource);
    });

    this.app.addComponents({
      QuickFilter,
      QuickFilterInitializer,
    });
    this.app.schemaSettingsManager.add(quickFilterSettings);

    // NocoBase 2.2.x can render V2 pages inside the legacy client shell. In
    // that mode only this client entry is loaded, so register the V2 model here
    // as well. This mirrors the compatibility bridge used by built-in plugins.
    this.app.flowEngine.registerModels({
      QuickFilterActionModel,
    });

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
  }
}

export default PluginQuickFilterClient;
