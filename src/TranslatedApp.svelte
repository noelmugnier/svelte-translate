<script lang="ts">
  import { i18nStore, lang } from "./store";

  export let languages: lang[];
  export let defaultLanguage: lang;
  export let hideContentWhileLoading: boolean = true;
  export let translationsFolder: string = "/langs";

  //if used in ssr mode, should get default language from $browser request headers
  i18nStore.init(languages, defaultLanguage, translationsFolder);    
</script>

{#if !hideContentWhileLoading || !$i18nStore.isLoading}
  <slot></slot>
{/if}