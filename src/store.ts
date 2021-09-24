import { writable, get, Writable } from "svelte/store";

import IntlMessageFormat from 'intl-messageformat';

const messages: any = {};

interface KeyValuePair<T, U>{
    key: T;
    value: U;
}

type LanguagesStore = {
  isLoading: boolean,
  language: string,
  fallbackLanguage: string,
  languages: string[]
}

const store:Writable<LanguagesStore> = writable({
  isLoading: true,
  language: null,
  fallbackLanguage: null,
  languages: []
});

export const getLocaleFromNavigator = () : string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  
  let language = window.navigator.language || window.navigator.languages[0];
  if (!messages[language]) {
    return findMatchingLanguageForNavigator(language);
  }

  return language;
};

const findMatchingLanguageForNavigator = (language: string): string => {
  let languages = Object.keys(messages);
  return languages.find(l => l.indexOf(language) > -1);  
}

const { subscribe, update } = store;

let translationsToLoad: KeyValuePair<string, () => Promise<any>>[] = [];

export const i18nStore = {
  subscribe,
  init: async (fallbackLanguage: string, initialLanguage?: string): Promise<void> => {
    if (!initialLanguage)
    {
      initialLanguage = fallbackLanguage;
    }
    
    await setTranslations(initialLanguage, fallbackLanguage);    
    setIsLoading(false);
  },
  addTranslations: (language: string, translations: {}) => {
    messages[language] = translations;

    update(value => {
      value.languages = [...value.languages, language];
      return value;
    });
  },
  registerTranslations: (language: string, callback: () => Promise<any>) => {
    if (translationsToLoad.find(t => t.key === language))
      throw `translations ${language} are already registered as defered loading.`;
    
    messages[language] = null;    
    translationsToLoad = [...translationsToLoad, { key: language, value: callback }];
  },
  setLanguage: async (language: string): Promise<void> => {    
    await setTranslations(language);
  },
  getTranslationFormatted: (id:string, data?:Record<string, any>) : string => {
    let storeValues = get(store);
    let translation = getTranslationEntry(id, storeValues.language);
    if (!translation) {
      return "";
    }
    
    let formattedTranslation = new IntlMessageFormat(translation, storeValues.language).format<string>(data);
    return typeof(formattedTranslation) === "object" ? formattedTranslation[0] : formattedTranslation;
  },
  getTranslationEntry: (id:string, language?:string): string | null => {
    return getTranslationEntry(id, language);
  }
};

const setTranslations = async (newLanguage: string, fallbackLanguage?: string): Promise<void> => {
  let storeLanguages = get(store);
  let changingLanguage = newLanguage !== storeLanguages.language;
  
  if (changingLanguage && !messages[newLanguage] && translationsToLoad.length > 0) {
    let translationToLoad = translationsToLoad.find(t => t.key === newLanguage);
    translationsToLoad = translationsToLoad.filter(t => t.key !== newLanguage);
    
    if (translationToLoad) {
      try {
        setIsLoading(true);
        
        let results = await translationToLoad.value();
        messages[newLanguage] = results.default ? results.default : results;
      }
      catch (e) {
        console.error(`An error occured while retrieving translations for lang ${newLanguage}`);
        translationsToLoad = [...translationsToLoad, translationToLoad];

        setIsLoading(false);
        throw e;
      }
    }
  }

  if (changingLanguage) {  
    update((value) => {
      value.language = newLanguage;
      value.fallbackLanguage = fallbackLanguage;
      value.isLoading = false;
      return value;
    });
    
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('lang', newLanguage.split('-')[0]);
    }
  }
};

const setIsLoading = (isLoading: boolean) => {
  update((value) => {
    value.isLoading = isLoading;
    return value;
  });
}

const getTranslationEntry = (id: string, language?: string): string | null => {
  let storeLanguages = get(store);
  if (!storeLanguages.language)
    throw 'Default language not yet initialized';
  
  if (!language)
  {
    language = storeLanguages.fallbackLanguage;
  }
  
  let entity = messages[language];  
  
  const entry = entity[id];
  if (!entry || !entry.length || typeof entry !== "string") {
    //if we don't find the translation entry for given language, search with default
    if (language !== storeLanguages.fallbackLanguage) {
      return getTranslationEntry(id, storeLanguages.fallbackLanguage);
    }

    return null;
  }

  return entry;
};
