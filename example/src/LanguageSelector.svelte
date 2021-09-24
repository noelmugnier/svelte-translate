<script lang="ts">
	import { languages } from "./languages";
	import { i18nStore } from "svelte-translate";

	export let classNames: string = "";

	const getLanguageName = (value:any):string => {
		if(value.indexOf('-') > -1)
			return languages.find(l => l.iso === value).name;

		return languages.find(l => l.code === value).name;
	}

	$: selected = $i18nStore.language;
</script>

<select class={classNames} bind:value={selected} on:change={async () => await i18nStore.setLanguage(selected)}>
	{#each $i18nStore.languages as language }
		<option value={language}>{getLanguageName(language)}</option>
	{/each}
</select>