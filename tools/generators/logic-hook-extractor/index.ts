import { Tree, formatFiles  } from '@nrwl/devkit';
import { insertImport } from "@nrwl/workspace/src/generators/utils/insert-import"

import { componentExists, getComponentFile, getComponentMeta, insertStatementAtBeginComp} from '../utils/generator.utils';
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
    hookFileNameMinExtension: hookFileNameInExtension, 
    hookReturnValues,
    hookParams,
    hookReturnType,
    addHookType 
  } = getComponentMeta(tree, project, dir);

  //first try with a component which does not have any logic hook    
  //search for the react component -> create ast util to find the react component in a file
  // console.log(comp)
  tree.write(pathToLogicHook, 
    `import type { ${hookReturnType} } from './${componentTypeFilename}';

    export function ${hookName}(): ${hookReturnType} {

      return {

      }
    }`);
  insertImport(tree, pathToComp, hookName, `./${hookFileNameInExtension}`);
  // addLogicHookStatement in react component
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


