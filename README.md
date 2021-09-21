
# Svelte Translate Tool (inspired by angular i18n)

Dynamic translation service (loaded from xx-XX.json files) and fallback to the text in html tags if no translations are provided.

# MessageFormat

This component use [MessageFormat.js](https://github.com/messageformat/messageformat) to handle complex formatting (plural, select, etc...)

# Usages

```js
<script>
    import {
	  i18n,
	  def,
	  languages,
	  TranslatedApp,
	  LanguageSelector
	} from "svelte-translate";

	let sampleValue = 0;
</script>
```

```html
<TranslatedApp languages={[languages.enGB,languages.frFR]} defaultLanguage={languages.frFR}>
    <LanguageSelector />
    <span i18n={def("myid", {sampleValue})}>Default text with bindings {sampleValue}<span>
    <span i18n={"simpleid"}>Text without complex construction</span>
</TranslatedApp>
```
Then add two json files (fr-FR.json/en-GB.json) in public/langs folder (can be changed with attribute translationsFolder) containing your translations :

```json
{
  "myid": "Custom translation text with bindings {sampleValue}",
  "simpleid": "Custom text without bindings",
}
```

# TODO

* [x] create script to extract tags (id / tag content) in a dedicated translation_xx-XX.xlf files
* [ ] create script to compile xlf files to json in order to use them with the store
* [ ] add options to extract-i18n.js to specify extraction folder and extraction format
* [ ] support context/description in def() helper in order to extract them and complete xlf files
* [ ] detect usage in SSR mode (and use request headers to set language)
* [ ] create plugin to replace component tag with i18n id corresponding translation found from translation file (at compile time)
