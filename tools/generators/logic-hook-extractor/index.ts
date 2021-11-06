import { Tree, formatFiles, applyChangesToString, ChangeType  } from '@nrwl/devkit';
// import { insertImport } from "@nrwl/workspace/src/generators/utils/insert-import"
import { insertImport } from '../utils/insert-import'
import { Statement } from 'typescript';

import { componentExists, generateImportStatementsForIdentifiersBetweenStartAndEndPos, getComponentFile, getComponentMeta, 
  getStartAndEndPosOfHookLogic,
  getImportStatements, insertStatementAtBeginComp, insertStatementAtBegin} from '../utils/generator.utils';
import { LogicHookExtractorSchema } from './schema';

// console.log({...schema})
// console.log(projectConfig.root+'/'+dir)
export default async function (tree: Tree, {dir, project}: LogicHookExtractorSchema) {
  //determine a way to find the component(folder) to go over -> start with path relative to projectRoot and projectName. So 2 params are needed path and project  
  componentExists(tree, project, dir);
  const comp = getComponentFile(tree, project, dir).toString();
  const {
    names, 
    pathToComp,
    pathToTypeFile, 
    componentTypeFilename,
    pathToLogicHook, 
    hookName,
    hookFileName,
    hookFileNameInExtension, 
    hookReturnValues,
    hookParams,
    hookReturnType,  
    addHookType,
    getLogicForHook,
    contents,
    sourceFile,
    logicHookContents,
    logicHookSourceFile
  } = getComponentMeta(tree, project, dir);
  //first try with a component which does not have any logic hook    
  //search for the react component -> create ast util to find the react component in a file
  //1. get all imports
  const imports = getImportStatements(sourceFile);
  const {logicForHook, startIndex, endIndex} = getLogicForHook(sourceFile, contents);
  const logicForHookText = logicForHook.map((item) => item.getFullText(sourceFile)).join('\n');
  console.log('logicForHookText',logicForHookText)
  // insertImport(tree, pathToLogicHook, hookName, componentTypeFilename);

  const end = logicHookSourceFile.getEnd()
  const superNewContent = applyChangesToString(logicHookContents,[
    {
      type: ChangeType.Insert,
      index: end,        
      text:  `import type { ${hookReturnType} } from './${componentTypeFilename}';
      
      `
    },
    {
      type: ChangeType.Insert,
      index: logicHookSourceFile.getEnd(),        
      text:  `export function ${hookName}(): ${hookReturnType} {
        ${logicForHookText}

        return {
  
        }
      }`
    }
  ])
  tree.write(pathToLogicHook, superNewContent);
  // console.log('start+end',{startIndex, endIndex});
  //2. filter out the imports with identifiers in the code to be moved to the logichook
  // const importsForLogicHook = getImportsForLogicHook(tree, pathToComp, imports, hookLogic);
  const importStatements = generateImportStatementsForIdentifiersBetweenStartAndEndPos(sourceFile, startIndex, endIndex);
  //3. insert the import statements in the logic hook file
  //iterate over importStatements and insert imports in the logic hook file
  importStatements.forEach(({identifierName, module }) => {
    insertImport(tree, pathToLogicHook, identifierName, module);
  });  

  //iterate over logicForHook and get the text for all items and join it


  // //3. create a function which determines all identifiers in an import from the source and the target
  // //4. compare if identifiers in the code are in the imports if so add import collection with code identifier, import identifier and import file
  // //5. Check in target what identifier can be added to existing imports or new import statements
  // //6. check in source what identifiers in imports became unused and remove it do this by checking the identifiers in code


  
  
  insertImport(tree, pathToComp, hookName, `./${hookFileNameInExtension}`);
  // // addLogicHookStatement in react component
  insertStatementAtBeginComp(tree, pathToComp, `const { ${hookReturnValues} } = ${hookName}(${hookParams});`);
  //addHookType in type file
  addHookType(tree, pathToTypeFile, project, dir);

  //we are assuming the name of the last folder in the path is the same as the same as the filename only PascalCased and ending with tsx
  //create the statement for the use<ComponentName>.hook.tsx file
  //add an import to the correct import group for the use<ComponentName>.hook.tsx file
  //create the use<ComponentName>.hook.tsx file 
  //create an empty return type for the hook
  //determine what needs to be refactored to the logic hook
  //find those functions, constant functions, hooks, variables and constants and move the in the new hook
  //in the new hook return back only what is needed for the react component
  //add to the hook any arguments needed coming in as props for the react component
  // console.log(tree)
  await formatFiles(tree);
}