import DynamicTranslatedApp from "./DynamicTranslatedApp.svelte";
import PreTranslatedApp from "./PreTranslatedApp.svelte";
import { i18n, i18nFormat } from "./actions";
import { i18nStore, getLocaleFromNavigator } from "./store";

export type i18nType = {
  id: string,
  data?: Record<string, any>
}

//shorthand to avoid mistake with use:i18n={{id:"",data:{}}}
const def = (id: string, data?: Record<string, any>): i18nType => {
  return { id, data };
};

export { DynamicTranslatedApp, PreTranslatedApp, i18nStore, def, i18n, i18nFormat, getLocaleFromNavigator};
