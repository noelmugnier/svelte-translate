const fs = require("fs-extra");
const glob = require("glob");
const path = require("path");
const {parse} = require('svelte/compiler');
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
  const document = parse(srcCode);
  
  return extractTranslationsFromAstNode(document.html, filePath);
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

  node.children.forEach(childNode => {        
    let i18nAttr = childNode.attributes ? childNode.attributes.find(a => a.name === "i18n" && a.type === "Action") : null;
    if (i18nAttr)
    {
      let id = "";
      let dataKeys = [];
      let expression = i18nAttr.expression;
      if (expression.type === "CallExpression") {
        if (expression.callee.name !== "def")
          throw `You must use def function with use:i18n on tag <${childNode.name}> on position: ${childNode.start} in component ${component}`;
                
        let idProperty = expression.arguments.find(a => a.type === "Literal");
        id = idProperty ? idProperty.value : "";

        let dataProperty = expression.arguments.find(a => a.type === "ObjectExpression");
        if (dataProperty) {
          if (dataProperty.type !== "ObjectExpression") {
            throw `You must specify data as object when using use:i18n={def("", {})} on tag <${childNode.name}> on position: ${childNode.start} in component ${component}`;
          }

          dataKeys = dataProperty.properties.map(p => p.key.name);
        }
      }
      else if (expression.type === "ObjectExpression") {
        let idProperty = expression.properties.find(p => p.key.name === "id");
        if (!idProperty) {
          `You must specify id when using use:i18n={{id:""}} on tag <${childNode.name}> on position: ${childNode.start} in component ${component}`;
        }
        id = idProperty.value.value;

        let dataProperty = expression.properties.find(p => p.key.name === "data");
        if (dataProperty) {
          if (dataProperty.value.type !== "ObjectExpression") {
            throw `You must specify data as object when using use:i18n={{id:"", data:{}}} on tag <${childNode.name}> on position: ${childNode.start} in component ${component}`;
          }

          dataKeys = dataProperty.value.properties.map(p => p.key.name);
        }
      }
      else if (expression.type === "Literal") {
        id = expression.value;
      }
      
      if(!id || id.length< 1){
        console.error(`No id found for tag <${childNode.name}> on position: ${childNode.start} in component ${component}`);        
      }

      if(childNode.children.length < 1){
        console.error(`Tag <${childNode.name}> don't have content on position: ${childNode.start} in component ${component}`);        
      }

      if(childNode.children.filter(c => c.type !== "Text" && c.type !== "MustacheTag").length > 0){
        console.error(`Tag <${childNode.name}> can only have text or simple mustache binding like {xxxx} on position: ${childNode.start} in component ${component}`);        
      }

      let contentChilds = childNode.children.filter(c => c.type === "Text" || c.type === "MustacheTag");
      let content = "";
      contentChilds.forEach(cc => {
        if (cc.type === "Text") {
          content += cc.data;
        }
        else {
          if (cc.expression.type === "Identifier")
            content += cc.expression.name;
          else if (cc.expression.type === "Literal") {
            content += cc.expression.value;
          }
          else if (cc.expression.type === "TemplateLiteral") {
            let quasis = "";
            cc.expression.quasis.filter(q => q.type === "TemplateElement").forEach(q => {
              quasis += q.value.raw;
            });

            content += quasis;
          }
        }
      });
      
      content = content.replace(/\n/g, '').replace(/\t/g, '');

      dataKeys.forEach(dk => {
        if (content.indexOf(dk) < 0)
          console.error(`Binding ${dk} was not found in tag <${childNode.name}> content on position: ${childNode.start} for component ${component}`);
      })
      
      translations = [...translations, { id: id, text: content, line: childNode.start, tag: childNode.name, path: componentPath}];
        
    }
    else {      
      if (childNode.children && childNode.children.length)
        translations = [...translations, ...extractTranslationsFromAstNode(childNode, componentPath)];
    }
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