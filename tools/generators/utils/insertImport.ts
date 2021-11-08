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
  modulePath: string,
  isTypeOnly: 'isTypeOnly' | 'isNotTypeOnly' = 'isNotTypeOnly'
) {
  
  const contents = tree.read(path, 'utf-8');

  const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);

  const importStatements = sourceFile.statements.filter(isImportDeclaration);
  // console.log(importStatements[0].getText(sourceFile))
  const existingImportWithoutNamedImports = importStatements.find(
    (statement) =>
      isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier
        .getText(sourceFile)
        .replace(/['"`]/g, '')
        .trim() === modulePath &&
      !(statement.importClause.namedBindings &&
      isNamedImports(statement.importClause.namedBindings))
  );
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
  if (!existingImport && !existingImportWithoutNamedImports) {
    insertStatement(tree, path, `import ${(isTypeOnly === 'isTypeOnly') ? 'type ': ''}{ ${name} } from '${modulePath}';`);
    return;
  }

  if (existingImport) {
    const namedImports = existingImport.importClause.namedBindings as NamedImports;
    //if name already exists in namedImports return
    if (namedImports.elements.find((element) => element.getText(sourceFile) === name)) {
      return;
    }
    const newNamedImports = namedImports.elements.map((element) => {
      if (element.getText(sourceFile) === name) {
        return element;
      }
      return element.getText(sourceFile);
    });


    const hasTrailingComma = namedImports.elements.hasTrailingComma;

    //sort the namedImports
    let newImport: string;
    if (existingImport.importClause.name) {
      if (isTypeOnly === 'isTypeOnly') {
        newImport = 
          `import ${existingImport.importClause.name ? existingImport.importClause.name.getText(sourceFile)+', ' : ''}{ ${newNamedImports.sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';
           import type { ${name} } from '${modulePath}';`;
      } else {
        newImport = 
          `import ${existingImport.importClause.name ? existingImport.importClause.name.getText(sourceFile)+', ' : ''}{ ${[...newNamedImports, name].sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';`;
      }
    } else {
      if (isTypeOnly === 'isTypeOnly') {
      newImport = 
        `import { ${newNamedImports.sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';
import type { ${name} } from '${modulePath}';`;
      } else {
        newImport = 
          `import { ${[...newNamedImports, name].sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';`;
      } 

    }
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
  if (existingImportWithoutNamedImports) {
    const imports = existingImportWithoutNamedImports.importClause.name;
    //if name already exists in namedImports return
    if (imports.getText(sourceFile) === name) {
      return;
    }
    //sort the namedImports
    const newImport = 
      `import ${imports.getText(sourceFile)}, { ${name} } from '${modulePath}';`;
    const start = existingImportWithoutNamedImports.getStart(sourceFile);
    const end = existingImportWithoutNamedImports.getEnd();
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
  
}
