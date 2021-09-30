import DynamicTranslatedApp from "./DynamicTranslatedApp.svelte";
import PreTranslatedApp from "./PreTranslatedApp.svelte";
import { i18n, i18nFormat } from "./actions";
import { i18nStore, getLocaleFromNavigator } from "./store";

export type i18nType = {
  id: string,
  data?: Record<string, any>,
  description?:string
}

//shorthand to avoid mistake with use:i18n={{id:"",data:{},description:""}}
const def = (id: string, data?: Record<string, any>, description?:string): i18nType => {
  return { id, data, description };
};

export { DynamicTranslatedApp, PreTranslatedApp, i18nStore, def, i18n, i18nFormat, getLocaleFromNavigator};
