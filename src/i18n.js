import { init, register, getLocaleFromNavigator, waitLocale } from 'svelte-i18n';



// register('en', async () => {
//   const modules = import.meta.glob('./locales/en/*.json');
//   const translations = await Promise.all(Object.values(modules).map(m => m()));
//   console.log('translations array =>', translations);


// console.log(Object.assign({}, ...translations));
//   return Object.assign({}, ...translations);
// });

register('en', async () => {
  // Grab all JSON files from a folder, e.g. ./locales/en
  const modules = import.meta.glob('./locales/en/*.json');

  // Dynamically import them all
  const imports = Object.values(modules).map(async (m) => {
    const mod = await m();
    // If the module has a .default, use that, otherwise use the module itself
    return mod.default ?? mod;
  });

  // Wait for all imports
  const loadedModules = await Promise.all(imports);

  // Merge them into a single object
  const merged = Object.assign({}, ...loadedModules);

  return merged;
});


register('de', async () => {
  // Grab all JSON files from a folder, e.g. ./locales/en
  const modules = import.meta.glob('./locales/de/*.json');

  // Dynamically import them all
  const imports = Object.values(modules).map(async (m) => {
    const mod = await m();
    // If the module has a .default, use that, otherwise use the module itself
    return mod.default ?? mod;
  });

  // Wait for all imports
  const loadedModules = await Promise.all(imports);

  // Merge them into a single object
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