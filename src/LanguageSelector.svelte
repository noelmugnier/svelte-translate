<script lang="ts">
	import { i18nStore } from "./store";

	export let classNames: string = "";

	$: selected = $i18nStore.language;
</script>

<select class={classNames} bind:value={selected} on:change={async () => await i18nStore.setLanguage(selected)}>
	{#each $i18nStore.languages as language }
		<option value={language}>{language.name}</option>
	{/each}
</select>