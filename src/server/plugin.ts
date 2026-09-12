import { Plugin } from '@nocobase/server';

export class PluginQuickFilterServer extends Plugin {
  async load() {
    // Client-only plugin: quick-filter configuration is persisted by the page schema.
  }
}

export default PluginQuickFilterServer;
