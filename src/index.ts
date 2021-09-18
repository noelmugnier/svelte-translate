import LanguageSelector from "./LanguageSelector.svelte";
import TranslatedApp from "./TranslatedApp.svelte";
import { i18n } from "./actions";
import { languages } from "./languages";
import { i18nStore } from "./store";

export type i18nType = {
  id: string,
  data?: Record<string, unknown>
}

//shorthand to avoid mistake with use:i18n={{id:"",data:{}}}
const def = (id: string, data?: Record<string, unknown>): i18nType => {
  return { id, data };
};

export { TranslatedApp, LanguageSelector, i18nStore, def, i18n, languages };
