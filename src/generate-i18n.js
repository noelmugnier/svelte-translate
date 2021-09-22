const fs = require("fs-extra");
const glob = require("glob");
const path = require("path");
const xliff = require('xliff');

const srcPath = path.resolve("./src");
const destPath = path.resolve("./public");

/**
 * This will process .svelte files to extract html tag (with use:i18n action) content to a dedicated json file.
 */
async function main() {
  let outputFormat = 'xlf';
  let translationsFolder = "langs";
  let destinationFolder = "langs";

  // get all .xlf/.json translation files
  glob(path.join(`${srcPath}/${translationsFolder}`, `**/messages.*.${outputFormat}`), null, async function (err, files) {
    if (err) {
      throw err;
    }

    let languagesTranslations = await Promise.all(files.map((filePath) => compileToTranslationFile(path.resolve(filePath), outputFormat)));
    languagesTranslations.forEach(async lt => {
      await fs.writeFile(path.join(`${destPath}/${destinationFolder}/${lt.language}.json`), JSON.stringify(lt.translations, null, 2));
    })
  });
}

/**
 * Processes .svelte file and parse AST tree to find node with attribute use:i18n and extract its text value.
 */
async function compileToTranslationFile(filePath, outputFormat) {
  const srcCode = await fs.readFile(filePath, { encoding: "utf-8" });

  let res = null;
  switch (outputFormat)
    {
      case "xlf":
        res = await xliff.xliff12ToJs(srcCode);
        break;
      case "json":
        res = JSON.parse(srcCode);
        break;
  }

  let results = {};
  const existingTranslations = res.resources["svelte-translate"];
  Object.keys(existingTranslations).forEach(key => {
    let existingTranslation = existingTranslations[key];
    if (existingTranslation && existingTranslation.target && existingTranslation.target.length > 0)
      results[key] = existingTranslation.target;    
  });

  return { language: res.targetLanguage, translations: results };
}

main();