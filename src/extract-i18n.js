const fs = require("fs-extra");
const glob = require("glob");
const path = require("path");
const parse5 = require('parse5');
const lodash = require('lodash');
const xliff = require('xliff');

const srcPath = path.resolve("./src");

/**
 * This will process .svelte files to extract html tag (with use:i18n action) content to a dedicated json file.
 */
async function main() {
  let languages = process.argv.slice(2);
  let defaultLanguage = languages[0];
  let outputFormat = 'xlf';
  let translationsFolder = "langs";

  if (translationsFolder.indexOf('/') === 0)
    translationsFolder = translationsFolder.substr(1);
  
  if (translationsFolder.indexOf('/') === translationsFolder.length - 1)
    translationsFolder = translationsFolder.substr(0, translationsFolder.length - 2);

  console.log("Selected languages", languages)
  console.log("Default language", defaultLanguage);

  // get all .svelte files
  glob(path.join(srcPath, "**/*.svelte"), null, async function (err, files) {
    if (err) {
      throw err;
    }

    translations = await Promise.all(files.map((filePath) => extractComponentTranslations(path.resolve(filePath))));    
    const { sources, targets } = initSourcesAndTargetsTranslations(translations[0]);
    
    await writeLanguagesTranslations(defaultLanguage, languages, sources, targets, translationsFolder, outputFormat);
  });
}

/**
 * Processes .svelte file and parse AST tree to find node with attribute use:i18n and extract its text value.
 */
async function extractComponentTranslations(filePath) {
  const srcCode = await fs.readFile(filePath, { encoding: "utf-8" });
  const document = parse5.parse(srcCode, {sourceCodeLocationInfo: true});  

  return extractTranslationsFromAstNode(document, filePath);
}

function initSourcesAndTargetsTranslations(translations) {
    let sources = {};
    let targets = {};
    let groupedTranslations = lodash.groupBy(translations, t => t.id);

    let errors = [];
    Object.keys(groupedTranslations).forEach(key => {
      if (groupedTranslations[key].length > 1) {
        hasErrors = true;
        errors = [...errors, `\n\nMultiple translation found for id "${key}":`];
        groupedTranslations[key].forEach(t => {
          errors = [...errors, `\n${getComponentNameFromPath(t.path)} with tag <${t.tag}> on in file ${t.componentPath}:${t.line}`];
        })
      }
      
      sources[key] = groupedTranslations[key][0].text;
      targets[key] = "";
    });
    
    if (errors && errors.length)
      throw `Error(s) occured while extracting translations from svelte components: ${errors}\n`;
  
  return { sources, targets };
}

function getComponentNameFromPath(filePath) {  
  let paths = filePath.split('/');
  return paths[paths.length - 1];
}

function extractTranslationsFromAstNode(node, componentPath) {
  let translations = [];

  node.childNodes.forEach(childNode => {
    if (childNode.childNodes && childNode.childNodes.length)
      translations = [...translations, ...extractTranslationsFromAstNode(childNode, componentPath)];
        
    let i18nAttr = childNode.attrs ? childNode.attrs.find(a => a.name === "use:i18n") : null;
    if (i18nAttr)
    {
      let regexpResults = /\{def\([\s]*"(?<id>[A-z0-9.]+)".*/.exec(i18nAttr.value);
      if (!regexpResults || !regexpResults.groups)
        regexpResults = /\{[\s]*"(?<id>[A-z0-9.]+)"[\s]*\}/.exec(i18nAttr.value);
            
      if (!regexpResults || !regexpResults.groups) {
        console.error(`No id found for tag <${childNode.nodeName}> on line: ${childNode.sourceCodeLocation.startLine} in component ${component}`);
      }
      else {
        let text = childNode.childNodes.filter(cn => cn.nodeName === '#text');
        if (text) {
          let value = text[0].value.replace(/\n/g, '').replace(/\t/g, '');
          //TODO check that binded values in text are present in def("", {xxxx})
          translations = [...translations, { id: regexpResults.groups.id, text: value, line: childNode.sourceCodeLocation.startLine, tag: childNode.nodeName, path: componentPath}];
        }
      }
    };
  });
  
  return translations;
}

async function writeLanguagesTranslations(defaultLanguage, languages, sourcesTranslations, initialTargetTranslations, translationsFolder, outputFormat) {
  languages.forEach(async language => {
    if (defaultLanguage === language)
      return;
    
    const targetTranslations = await updateExistingTargetTranslations(defaultLanguage, language, sourcesTranslations, initialTargetTranslations, translationsFolder, outputFormat);

    let res = null;
      switch (outputFormat)
      {
        case "xlf":
          res = await xliff.createxliff12(defaultLanguage, language, sourcesTranslations, targetTranslations, "svelte-translate");
          break;
        case "json":
          res = JSON.stringify(await xliff.createjs(defaultLanguage, language, sourcesTranslations, targetTranslations, "svelte-translate"), null, 2);        
          break;
      }

      let folder = `./src/${translationsFolder}`;
      if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder);
      }

      await fs.writeFile(`${folder}/messages.${language}.${outputFormat}`, res, 'utf-8');
    });
}

async function updateExistingTargetTranslations(defaultLanguage, language, sourcesTranslations, initialTargetTranslations, translationsFolder, outputFormat) {
  if (language === defaultLanguage) {
    return { ...sourcesTranslations };
  }
  
  let updatedTargets = { ...initialTargetTranslations };
  let file = `./src/${translationsFolder}/messages.${language}.${outputFormat}`;
  if (!fs.existsSync(file)) {
    return updatedTargets;
  }

  let res = null;
  const targetTranslationFile = await fs.readFile(file, { encoding: "utf-8" });
  switch (outputFormat)
  {
    case "xlf":
      res = await xliff.xliff12ToJs(targetTranslationFile);
      break;
    case "json":
      res = JSON.parse(targetTranslationFile);
      break;
  }
  
  const existingTranslations = res.resources["svelte-translate"];
  Object.keys(updatedTargets).forEach(key => {
    let existingTranslation = existingTranslations[key];
    if (existingTranslation && existingTranslation.target && existingTranslation.target.length > 0)
      updatedTargets[key] = existingTranslation.target;    
  });

  return updatedTargets;
}

main();