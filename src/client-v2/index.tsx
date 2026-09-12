import { Plugin } from '@nocobase/client-v2';
import { localeResources, NAMESPACE } from '../shared/locale';

export class PluginQuickFilterClientV2 extends Plugin {
  async load() {
    Object.entries(localeResources).forEach(([language, resource]) => {
      this.app.i18n.addResources(language, this.options?.packageName || NAMESPACE, resource);
      this.app.i18n.addResources(language, NAMESPACE, resource);
    });

    this.app.flowEngine.registerModelLoaders({
      QuickFilterActionModel: {
        extends: 'ActionModel',
        loader: () => import('./QuickFilterActionModel'),
      },
    });
  }
}

export { QuickFilterActionModel } from './QuickFilterActionModel';
export default PluginQuickFilterClientV2;
