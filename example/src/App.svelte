<script lang="ts">
	import {
	  i18n,
	  def,
	  DynamicTranslatedApp,
	  i18nStore,
	  getLocaleFromNavigator
	} from "svelte-translate";
	
	import LanguageSelector from "./LanguageSelector.svelte";
	
	import enGB from './../public/lang/en-GB.json';
	import frFR from './../public/lang/fr-FR.json';

	let count = 0;

	i18nStore.addTranslations("en-GB", enGB);
	i18nStore.addTranslations("fr-FR", frFR);
</script>

<DynamicTranslatedApp 
	fallbackLanguage="fr-FR" 
	initialLanguage={getLocaleFromNavigator()}
	hideContentWhileLoading={true}>
	<LanguageSelector/>
	<p use:i18n={def("app.title",{count, strong: chunks => `<strong>${chunks}</strong>`})}>
		This is my <strong>default title</strong> with 
		{`{count, plural, =0{no results} one{one result} other{# results}}`}
	</p> 
	<i use:i18n={"definition"}>This is my default definition</i>
	<br/> 
	<br/> 
	<button use:i18n={def("increase", {count})} on:click={() => count++}>
		Increase {count}
	</button>
</DynamicTranslatedApp>