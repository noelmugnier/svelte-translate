<script lang="ts">
  import { i18nStore } from "./store";

  export let fallbackLanguage: string;
  export let initialLanguage: string = null;
  export let hideContentWhileLoading: boolean = true;

  //if used in ssr mode, should get default language from $browser request headers
  i18nStore.initDynamicStore(fallbackLanguage, initialLanguage);    
</script>

{#if !hideContentWhileLoading || !$i18nStore.isLoading}
  <slot></slot>
{/if}