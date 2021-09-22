<script lang="ts">
	import {
	  i18n,
	  def,
	  languages,
	  TranslatedApp,
	  LanguageSelector
	} from "svelte-translate";

	let count = 0;
	let availableLanguages = [languages.enGB, languages.frFR, languages.itIT];
</script>

<TranslatedApp 
	languages={availableLanguages} 
	defaultLanguage={languages.enGB} 
	hideContentWhileLoading={false}>
	<LanguageSelector/>
	<h2 use:i18n={def("app.title",{count})}>
		This is my default title with 
		{`{count, plural, =0{no results} one{one result} other{# results}}`}
	</h2> 
	<i use:i18n={"definition"}>This is my default definition</i>
	<br/> 
	<br/> 
	<button on:click={() => count++}>
		<span use:i18n={"increase"}>Increase</span>
	</button>
</TranslatedApp>