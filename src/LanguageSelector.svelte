<script lang="ts">
	import { i18nStore, lang } from "./store";

	export let classNames: string = "";
	export let selectedLanguage: lang;

	let initialized: boolean = false;

	$: selected = $i18nStore.language;
	$: updateLanguage($i18nStore.isLoading);

	const updateLanguage = async (loaded: boolean) => {
		if(loaded && !initialized){
			await i18nStore.setLanguage(selectedLanguage);
			initialized = true;
		}
	}

</script>

<select class={classNames} bind:value={selected} on:change={async () => await i18nStore.setLanguage(selected)}>
	{#each $i18nStore.languages as language }
		<option value={language}>{language.name}</option>
	{/each}
</select>