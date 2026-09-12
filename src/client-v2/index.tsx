import { Plugin } from '@nocobase/client-v2';
import { localeResources, NAMESPACE } from '../shared/locale';
import { QuickFilterActionModel } from './QuickFilterActionModel';

export class PluginQuickFilterClientV2 extends Plugin {
  async load() {
    Object.entries(localeResources).forEach(([language, resource]) => {
      this.app.i18n.addResources(language, this.options?.packageName || NAMESPACE, resource);
      this.app.i18n.addResources(language, NAMESPACE, resource);
    });

    // Register synchronously (like the built-in action models) so the model is
    // immediately discoverable: the "add action" menu enumerates ActionModel
    // subclasses via the synchronous getSubclassesOf API.
    this.app.flowEngine.registerModels({
      QuickFilterActionModel,
    });
  }
}

export { QuickFilterActionModel };
export default PluginQuickFilterClientV2;
