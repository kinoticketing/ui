import { init, register, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';


register('en', async () => {

  const modules = import.meta.glob('./locales/en/*.json');

  const imports = Object.values(modules).map(async (m) => {
    const mod = await m();
    // @ts-ignore
    return mod.default ?? mod;
  });
  const loadedModules = await Promise.all(imports);
  const merged = Object.assign({}, ...loadedModules);
  return merged;
});


register('de', async () => {

  const modules = import.meta.glob('./locales/de/*.json');

  const imports = Object.values(modules).map(async (m) => {
    const mod = await m();
    // @ts-ignore
    return mod.default ?? mod;
  });
  const loadedModules = await Promise.all(imports);
  const merged = Object.assign({}, ...loadedModules);
  return merged;
});

init({
  fallbackLocale: 'en',
  initialLocale: getLocaleFromNavigator(),
  loadingDelay: 200,
  warnOnMissingMessages: true
});

export const i18nReady = waitLocale();