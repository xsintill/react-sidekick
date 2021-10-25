import { Tree, formatFiles } from '@nrwl/devkit';

export default async function (tree: Tree, schema: any) {
  //divide imports in 3 groups: 1: imports from resources i.e. json, svg; 2. import from 3rd party(node-modules); 3: import from your own code relative or via aliases
  //sort imports per group by import path. 
  
  //p.s. Might be a good idea to not allow imports from just a . or .. since these might be a little problematic to sort
  await formatFiles(tree);
}
