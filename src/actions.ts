import { get } from "svelte/store";
import type { Unsubscriber } from "svelte/store";

import type { i18nType } from ".";
import { i18nStore } from "./store";

export const i18n = (node: HTMLElement, params?: i18nType | string) => {
  if (!params)
    throw "params are required";
  
  let id:string = typeof params === "string" ? params : params.id;
  let data: Record<string, unknown> = typeof params === "string" ? {} : params.data ? params.data : {};
  let paramsKeys = data ? Object.keys(data) : [];

  let unsubscriber: Unsubscriber = i18nStore.subscribe((manager) => {    
    let obj: Record<string, unknown> = {};
    if (paramsKeys.length > 0) {
      //retrieve data value from node attributes in order to get an uptodate value while changing language.
      paramsKeys.forEach((o) => {
        let nodedata = node.dataset[o];
        obj[o] = nodedata ? nodedata : (data as any)[o];
      });
    } else {
      obj = data;
    }

    if (manager.isLoading)
      return;
    
    let value = i18nStore.getTranslationFormatted(id, obj);
    node.innerHTML = value ? value : "";
  });

  return {
    update(params: i18nType | string) {
      //hack to be able to retrieve updated value in the upper subscriber when the language change
      
      let id: string = typeof params === "string" ? params : params.id;      
      let data = typeof params === "string" ? null : params.data;
      
      if (data) {
        paramsKeys.forEach((o) => {
          node.dataset[o] = (data as any)[o];
        });
      }
      
      let value = i18nStore.getTranslationFormatted(id, (data as any));
      node.innerHTML = value ? value : "";
    },
    destroy() {
      if (unsubscriber) {
        unsubscriber();
      }
    },
  };
};
