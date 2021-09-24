import TranslatedApp from "./TranslatedApp.svelte";
import { i18n } from "./actions";
import { i18nStore, getLocaleFromNavigator } from "./store";

export type i18nType = {
  id: string,
  data?: Record<string, any>
}

//shorthand to avoid mistake with use:i18n={{id:"",data:{}}}
const def = (id: string, data?: Record<string, any>): i18nType => {
  return { id, data };
};

export { TranslatedApp, i18nStore, def, i18n, getLocaleFromNavigator};
