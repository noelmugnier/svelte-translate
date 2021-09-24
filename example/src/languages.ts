type LanguageDefinition = {
  iso: string,
  code: string,
  name: string
};

export const languages: LanguageDefinition[] = [
  {
    code: "fr",
    iso: "fr-FR",
    name: "Français",
  },
  {
    code: "fr",
    iso: "fr-CA",
    name: "Québécois",
  },
  {
    code: "en",
    iso: "en-GB",
    name: "English (UK)",
  },
  {
    code: "en",
    iso: "en-US",
    name: "English (US)",
  },
  {
    code: "it",
    iso: "it-IT",
    name: "Italiano",
  },
  {
    code: "es",
    iso: "es-ES",
    name: "Español",
  },
  {
    code: "de",
    iso: "de-DE",
    name: "Deutsch",
  },
];
