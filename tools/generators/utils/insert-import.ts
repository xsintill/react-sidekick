import { insertStatement } from '@nrwl/workspace/src/generators/utils/insert-statement';
import { applyChangesToString, ChangeType, StringChange, Tree } from '@nrwl/devkit';
import {
  createSourceFile,
  isImportDeclaration,
  isNamedImports,
  isStringLiteral,
  NamedImports,
  ScriptTarget,
} from 'typescript';

export function insertImport(
  tree: Tree,
  path: string,
  name: string,
  modulePath: string
) {
  
  const contents = tree.read(path, 'utf-8');

  const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);

  const importStatements = sourceFile.statements.filter(isImportDeclaration);
  // console.log(importStatements[0].getText(sourceFile))
  const existingImport = importStatements.find(
    (statement) =>
      isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier
        .getText(sourceFile)
        .replace(/['"`]/g, '')
        .trim() === modulePath &&
      statement.importClause.namedBindings &&
      isNamedImports(statement.importClause.namedBindings)
  );
  if (!existingImport) {
    insertStatement(tree, path, `import { ${name} } from '${modulePath}';`);
    return;
  }
  const namedImports = existingImport.importClause.namedBindings as NamedImports;

  const newNamedImports = namedImports.elements.map((element) => {
    if (element.getText(sourceFile) === name) {
      return element;
    }
    return element.getText(sourceFile);
  });

  //sort the namedImports
  const newImport = `import { ${[...newNamedImports, name].sort().join(', ')} } from '${modulePath}';`;
  const start = existingImport.getStart(sourceFile);
  const end = existingImport.getEnd();
  
  const changes: StringChange[] = [   
    {
      type: ChangeType.Insert,
      text: newImport,
      index: start,
    },
    {
      type: ChangeType.Delete,  
      start: start,
      length: end - start
    }    
  ];
  const newContents = applyChangesToString(contents, changes);
  tree.write(path, newContents);
}



  
//   const namedImports = existingImport.importClause
//     .namedBindings as NamedImports;

//   const index = namedImports.getEnd() - 1;

//   let text: string;
//   if (namedImports.elements.hasTrailingComma) {
//     text = `${name},`;
//   } else {
//     text = `,${name}`;
//   }

//   const newContents = applyChangesToString(contents, [
//     {
//       type: ChangeType.Insert,
//       index,
//       text,
//     },
//   ]);

//   tree.write(path, newContents);
// }