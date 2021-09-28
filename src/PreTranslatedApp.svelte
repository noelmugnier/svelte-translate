<script lang="ts">
  import { i18nStore } from "./store";

  export let compiledLanguage: string = null;

  i18nStore.initPreCompiledStore(compiledLanguage);    
</script>

<slot></slot>