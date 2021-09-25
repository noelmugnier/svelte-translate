
# Svelte Translate (inspired by angular i18n and svelte-i18n)

Dynamic translation service (loaded from xx-XX.json files) and fallback to the text in html tags if no translations are provided.

# MessageFormat

This component use [MessageFormat.js](https://github.com/messageformat/messageformat) to handle complex formatting (plural, select, etc...)

# Usages

```js
<script>
    import {
	  i18n,
	  def,
	  i18nStore,
	  languages,
	  TranslatedApp,
	  getLocaleFromNavigator
	} from "svelte-translate";

	import LanguageSelector from "./LanguageSelector.svelte";

	import enGB from './../public/lang/en-GB.json';
	import frFR from './../public/lang/fr-FR.json';

	let count = 0;

	i18nStore.addTranslations("en-GB", enGB);
	i18nStore.addTranslations("fr-FR", frFR);
</script>
```

```html
<TranslatedApp 
	fallbackLanguage="fr-FR" 
	initialLanguage={getLocaleFromNavigator()}
	hideContentWhileLoading={true}>
    <LanguageSelector />
    <span i18n={def("myid", {sampleValue})}>Default text with bindings {sampleValue}<span>
    <span i18n={"simpleid"}>Text without complex construction</span>
</TranslatedApp>

```
Then add two json files (fr-FR.json/en-GB.json) in public/lang folder containing your translations :

```json
{
  "myid": "Custom translation text with bindings {sampleValue}",
  "simpleid": "Custom text without bindings",
}
```

# TODO

* [ ] support context/description in def() helper in order to extract them and complete xlf files require a fork on xliff library to use custom attributes
