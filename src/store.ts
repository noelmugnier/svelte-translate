import MessageFormat from '@messageformat/core';

import { writable, get, Writable } from "svelte/store";

const translations:any = {
};

export type lang = {
  code: string,
  iso: string,
  name: string
};

export type langStore = {
  isLoading: boolean,
  language: lang,
  languages: lang[],
  languageSelectorEnabled: boolean,
}

const defaultLang:lang = {
  code: "en",
  iso: "default",
  name: "Default",
};

const store:Writable<langStore> = writable({
  isLoading: true,
  language: defaultLang,
  languages: [],
  languageSelectorEnabled: false,
});

let mf: MessageFormat<"string"> | null = null;
let langsPath:string = "/langs";
const { subscribe, update } = store;

export const i18nStore = {
  subscribe,
  init: async (selectedLanguages: lang[], defaultLanguage: lang, langsFolderPath?: string): Promise<void> => {
    defaultLang.code = defaultLanguage.code;
    defaultLang.name = defaultLanguage.name;
    defaultLang.iso = defaultLanguage.iso;

    translations[defaultLang.iso] = {};
    
    update((value) => {
      value.isLoading = true;
      return value;
    });
      
    langsPath = langsFolderPath ? langsFolderPath : langsPath;

    let language:lang = defaultLanguage;
    let languages:lang[] = [...selectedLanguages];
    let languageSelectorEnabled:boolean = languages.length > 1 ? true : false;
    
    //initialize message format with selected language code
    mf = new MessageFormat(language.code);
    await setTranslations(language, languages, languageSelectorEnabled);
  },
  setLanguage: async (language:lang): Promise<void> => {
    await setTranslations(language);
  },
  getTranslationFormatted: (id:string, data?:Record<string, unknown>) : string | null => {
    let storeValues = get(store);
    let entry = getTranslationEntry(id, storeValues.language);
    if (!entry) {
      return null;
    }

    if (mf === null)
      throw "you must init the i18nStore by using <TranslatedApp /> or explicitly calling i18nStore.init(...)";
    
    let compiledFunction = mf.compile(entry);
    return compiledFunction(data);
  },
  getTranslationEntry: (id:string, language?:lang): string | null => {
    if (!language) {
      language = defaultLang;
    }

    return getTranslationEntry(id, language);
  },
  addDefaultTranslation: (id:string, data: string): void => {
    translations[defaultLang.iso][id] = data;
  },
};

const setTranslations = async (language:lang, languages?:lang[], languageSelectorEnabled?:boolean): Promise<void> => {
  //only import if language change and if it's not already loaded in translations.
  if (
    language.iso !== defaultLang.iso &&
    language.iso !== get(store).language.iso &&
    !translations[language.iso]
  ) {
    try {
      let results = await fetch(`${langsPath}/${language.iso}.json`);
      if (results.ok) {
        translations[language.iso] = await results.json();
      }
      updateConfiguration(language, languages, languageSelectorEnabled);
    }
    catch (e) {
      console.error(e);
      updateConfiguration(language, languages, languageSelectorEnabled);      
    }
  } else {
    updateConfiguration(language, languages, languageSelectorEnabled);
  }
};

const updateConfiguration = (language:lang, languages?:lang[], languageSelectorEnabled?:boolean): void => {
  update((value) => {
    value.language = language;

    if (languages != null) {
      value.languages = languages;
    }

    if (languageSelectorEnabled != null) {
      value.languageSelectorEnabled = languageSelectorEnabled;
    }

    value.isLoading = false;
    return value;
  });
};

const getTranslationEntry = (id:string, language?:lang): string | null => {
  language = language ? language : defaultLang;
  let entity = translations[language.iso];
  
  if (!entity) {
    language = defaultLang;
    entity = translations[language.iso];
  }
  
  const entry = entity[id];
  if (!entry || !entry.length || typeof entry !== "string") {
    //if we don't find the translation entry for given language, search with default
    if (language.iso !== defaultLang.iso) {
      return getTranslationEntry(id, defaultLang);
    }

    return null;
  }

  return entry;
};
