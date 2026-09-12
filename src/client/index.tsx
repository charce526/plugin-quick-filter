import { Plugin } from '@nocobase/client';
import { localeResources, NAMESPACE } from '../shared/locale';
import { QuickFilter } from './QuickFilter';
import { QuickFilterInitializer } from './QuickFilterInitializer';
import { quickFilterSettings } from './quickFilterSettings';

const INITIALIZERS = ['table:configureActions', 'TableActionInitializers'];

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

    const initializer = {
      title: "{{ t('Quick filter', { ns: '@xiezuo/plugin-quick-filter' }) }}",
      Component: QuickFilterInitializer,
    };
    INITIALIZERS.forEach((name) => {
      this.app.schemaInitializerManager.get(name)?.add('customize.quickFilter', initializer);
    });
  }
}

export default PluginQuickFilterClient;
