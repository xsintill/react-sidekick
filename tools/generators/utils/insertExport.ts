import { insertStatement } from '@nrwl/workspace/src/generators/utils/insert-statement';
import { applyChangesToString, ChangeType, StringChange, Tree } from '@nrwl/devkit';
import ts, {
  createSourceFile,
  isExportDeclaration,
  isNamedExports,
  isStringLiteral,
  NamedExports,
  ScriptTarget,
} from 'typescript';

export function insertExport(
  tree: Tree,
  path: string,
  name: string,
  modulePath: string,
  isTypeOnly: 'isTypeOnly' | 'isNotTypeOnly' = 'isNotTypeOnly'
) {
  
  const contents = tree.read(path, 'utf-8');

  const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);

  const exportStatements = sourceFile.statements.filter(isExportDeclaration);

  //retrieve export statements which do not have an alias
    const exportStatementsWithoutAlias = exportStatements.filter(
        (statement) => (statement.moduleSpecifier)&&
              statement.moduleSpecifier
                .getText(sourceFile)
                .replace(/['"`]/g, '')
                .trim() === modulePath && isNamedExports(statement.exportClause.namedBindings)
        // .elements.some((element) => element.propertyName)
    );



//   const existingExportWithoutNamedExports = exportStatements.find(
//     (statement) =>
//       isStringLiteral(statement.moduleSpecifier) &&
//       statement.moduleSpecifier
//         .getText(sourceFile)
//         .replace(/['"`]/g, '')
//         .trim() === modulePath &&
//       !(statement.exportClause.namedBindings &&
//       isNamedExports(statement.exportClause.namedBindings))
//   );









//======================================
//   const existingExport = exportStatements.find(
//     (statement) =>
//       isStringLiteral(statement.moduleSpecifier) &&
//       statement.moduleSpecifier
//         .getText(sourceFile)
//         .replace(/['"`]/g, '')
//         .trim() === modulePath &&
//       statement.exportClause. &&
//       isNamedExports(statement.exportClause.namedBindings)
//   );
//   if (!existingExport && !existingExportWithoutNamedExports) {
//     insertStatement(tree, path, `export ${(isTypeOnly === 'isTypeOnly') ? 'type ': ''}{ ${name} } from '${modulePath}';`);
//     return;
//   }

//   if (existingExport) {
//     const namedExports = existingExport.exportClause.namedBindings as NamedExports;
//     //if name already exists in namedExports return
//     if (namedExports.elements.find((element) => element.getText(sourceFile) === name)) {
//       return;
//     }
//     const newNamedExports = namedExports.elements.map((element) => {
//       if (element.getText(sourceFile) === name) {
//         return element;
//       }
//       return element.getText(sourceFile);
//     });


//     const hasTrailingComma = namedExports.elements.hasTrailingComma;

//     //sort the namedExports
//     let newExport: string;
//     if (existingExport.exportClause.name) {
//       if (isTypeOnly === 'isTypeOnly') {
//         newExport = 
//           `export ${existingExport.exportClause.name ? existingExport.exportClause.name.getText(sourceFile)+', ' : ''}{ ${newNamedExports.sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';
//            export type { ${name} } from '${modulePath}';`;
//       } else {
//         newExport = 
//           `export ${existingExport.exportClause.name ? existingExport.exportClause.name.getText(sourceFile)+', ' : ''}{ ${[...newNamedExports, name].sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';`;
//       }
//     } else {
//       if (isTypeOnly === 'isTypeOnly') {
//       newExport = 
//         `export { ${newNamedExports.sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';
// export type { ${name} } from '${modulePath}';`;
//       } else {
//         newExport = 
//           `export { ${[...newNamedExports, name].sort().join(', ')}${hasTrailingComma ? ',' : ''} } from '${modulePath}';`;
//       } 

//     }
//     const start = existingExport.getStart(sourceFile);
//     const end = existingExport.getEnd();
//     const changes: StringChange[] = [   
//       {
//         type: ChangeType.Insert,
//         text: newExport,
//         index: start,
//       },
//       {
//         type: ChangeType.Delete,  
//         start: start,
//         length: end - start
//       }    
//     ];
//     const newContents = applyChangesToString(contents, changes);
//     tree.write(path, newContents);
//   }
//   if (existingExportWithoutNamedExports) {
//     const exports = existingExportWithoutNamedExports.exportClause.name;
//     //if name already exists in namedExports return
//     if (exports.getText(sourceFile) === name) {
//       return;
//     }
//     //sort the namedExports
//     const newExport = 
//       `export ${exports.getText(sourceFile)}, { ${name} } from '${modulePath}';`;
//     const start = existingExportWithoutNamedExports.getStart(sourceFile);
//     const end = existingExportWithoutNamedExports.getEnd();
//     const changes: StringChange[] = [   
//       {
//         type: ChangeType.Insert,
//         text: newExport,
//         index: start,
//       },
//       {
//         type: ChangeType.Delete,  
//         start: start,
//         length: end - start
//       }    
//     ];
//     const newContents = applyChangesToString(contents, changes);
//     tree.write(path, newContents);
//   }
  
}
