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
  let componentsTranslations = null;

  console.log("Selected languages", languages)
  console.log("Default language", defaultLanguage);

  // get all .svelte files
  glob(path.join(srcPath, "**/*.svelte"), null, async function (err, files) {
    if (err) throw err;
    componentsTranslations = await Promise.all(files.map((filePath) => extractComponentTranslations(path.resolve(filePath))));
    
    //TODO Transform componentsTranslation to id|text|component to be more precise in error log
    
    let sources = {};
    let targets = {};
    let groupedTranslations = lodash.groupBy(componentsTranslations.map(ct => ct.translations).flat(), t => t.id);
    Object.keys(groupedTranslations).forEach(key => {
      if (groupedTranslations[key].length > 1)
        console.error(`Multiple translation found for id ${key}`);
      
      sources[key] = groupedTranslations[key][0].text;
      targets[key] = "";
    });    
    
    languages.forEach(async language => {
      if (language !== defaultLanguage) {
        const res = await xliff.createxliff12(defaultLanguage, language, sources, targets, "er");
        if (!fs.existsSync('./src/langs')){
            fs.mkdirSync('./src/langs');
        }
        
        await fs.writeFile(`./src/langs/${language}.xlf`, res);
      }
    });
  });
}

/**
 * Processes .svelte file and parse AST tree to find node with attribute use:i18n and extract its text value.
 */
async function extractComponentTranslations(filePath) {
  const srcCode = await fs.readFile(filePath, { encoding: "utf-8" });
  const document = parse5.parse(srcCode, {sourceCodeLocationInfo: true});
  
  let paths = filePath.split('/');
  let componentName = paths[paths.length - 1];

  let translations = extractTranslationsFromAstNode(document, filePath);
  return { component: componentName, translations };
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
          translations = [...translations, { id: regexpResults.groups.id, text: value }];
        }
      }
    };
  });
  
  return translations;
}

main();