
# Svelte Translate Tool (inspired by angular i18n)

The goal of this component is to use a dynamic translation service (loaded from xx-XX.json files) and fallback to the text in html tags if no translations are provided.
The main reason is that I hate to navigate to the translation files to be able to know what's the default html content in my components.

# MessageFormat

This component use [MessageFormat.js](https://github.com/messageformat/messageformat) to handle complex translation (plural, select, etc...)

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

* [ ] detect usage in SSR mode (and use request headers to set language)
* [ ] create rollup plugin to extract tags (id/text content) in a dedicated translation_xx-XX.json files
* [ ] create rollup plugin to compile the translations with specific language to replace html tag in compiled source to get precompiled components/websites
