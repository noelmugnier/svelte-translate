import type { Unsubscriber } from "svelte/store";

import type { i18nType } from ".";
import { i18nStore } from "./store";

export const i18n = (node: HTMLElement, params: i18nType | string) => {  
  let {id, data} = getIdAndDataFromParams(params);

  let unsubscriber: Unsubscriber = i18nStore.subscribe((manager) => {    
    if (manager.isLoading)
      return;
    
    node.innerHTML = i18nStore.getTranslationFormatted(id, data);
  });

  return {
    update(params: i18nType | string) {
      data = getIdAndDataFromParams(params).data;            
      node.innerHTML = i18nStore.getTranslationFormatted(id, (data as any));
    },
    destroy() {
      if (unsubscriber) {
        unsubscriber();
      }
    },
  };
};

export const i18nFormat = (node: HTMLElement, params: i18nType | string) => {
  const content = node.innerHTML;
  //TODO must check for complex formatting (plural, select, date, time etc...)
  const canSkipFormat = typeof (params) === "string" && content.indexOf('{') < 0;
  
  if (canSkipFormat) {
    return;
  }

  let { data } = getIdAndDataFromParams(params);
  let unsubscriber: Unsubscriber = i18nStore.subscribe((manager) => {        
    node.innerHTML = i18nStore.getFormattedMessage(content, data);
  });

  return {
    update(params: i18nType | string) { 
      if (canSkipFormat) {
        return;
      }
      
      data = getIdAndDataFromParams(params).data;            
      node.innerHTML = i18nStore.getFormattedMessage(content, data);
    },
    destroy() {
      if (unsubscriber) {
        unsubscriber();
      }
    },
  };
};

const getIdAndDataFromParams = (params: i18nType | string): { id: string, data: Record<string, any>} => {
  let id:string = typeof params === "string" ? params : params.id;
  let data: Record<string, any> = typeof params === "string" ? {} : params.data ? params.data : {};

  return { id, data };
}
