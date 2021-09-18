import MessageFormat from '@messageformat/core';

import { writable, get, Writable } from "svelte/store";

const translations:any = {
  default: {},
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

const notDefined:lang = {
  code: "en",
  iso: "default",
  name: "Default",
};

const store:Writable<langStore> = writable({
  isLoading: true,
  language: notDefined,
  languages: [],
  languageSelectorEnabled: false,
});

let mf: MessageFormat<"string"> | null = null;
let langsPath:string = "/langs";
const { subscribe, update } = store;

export const i18nStore = {
  subscribe,
  init: async (selectedLanguages:lang[], defaultLanguage?:lang, langsFolderPath?:string): Promise<void> => {
    update((value) => {
      value.isLoading = true;
      return value;
    });
      
    langsPath = langsFolderPath ? langsFolderPath : langsPath;

    let language:lang = defaultLanguage ? defaultLanguage : notDefined;
    let languages:lang[] = [...selectedLanguages];
    let languageSelectorEnabled:boolean = languages.length > 1 ? true : false;
    
    //initialize message format with language codes provided by TranslatedApp languages
    mf = new MessageFormat(languages.map((l) => l.code));
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
      language = notDefined;
    }

    return getTranslationEntry(id, language);
  },
  addDefaultTranslation: (id:string, data: string): void => {
    if (id.indexOf(".") > -1) {
      translations[notDefined.iso] = initializeObjectStructure(
        translations[notDefined.iso],
        id.split("."),
        0,
        data
      );
    } else {
      translations[notDefined.iso][id] = data;
    }
  },
};

const setTranslations = async (language:lang, languages?:lang[], languageSelectorEnabled?:boolean): Promise<void> => {
  //only import if language change and if it's not already loaded in translations.
  if (
    language.iso !== notDefined.iso &&
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
  language = language ? language : notDefined;
  let entity = translations[language.iso];
  
  if (!entity) {
    language = notDefined;
    entity = translations[language.iso];
  }
  
  let entry = "";
  if (id.indexOf(".") > -1) {
    let ids = id.split(".");
    for (let i = 0; i < ids.length; i++) {
      let subPart = entity[ids[i]];
      if (!subPart) break;
      else entity = subPart;
    }
    entry = entity;
  } else {
    entry = entity[id];
  }

  if (!entry || !entry.length || typeof entry !== "string") {
    //if we don't find the translation entry for given language, search with default
    if (language.iso !== notDefined.iso) {
      console.info(
        `Id ${id} with language ${language.iso} not found, retrieving default value.`
      );
      return getTranslationEntry(id, notDefined);
    }

    return null;
  }

  return entry;
};

//refactoring needed used to create an complex object like {app:{title:""}, definition:""}
const initializeObjectStructure = (obj:any, idParts:string[], index:number, value?:any) : {} => {
  if (index < idParts.length - 1) {
    if (!obj[idParts[index]]) obj[idParts[index]] = {};
    obj[idParts[index]] = initializeObjectStructure(
      obj[idParts[index]],
      idParts,
      index + 1,
      value
    );
    return obj;
  } else if (index === idParts.length - 1) {
    obj[idParts[index]] = value;
    return obj;
  } else return obj;
};
