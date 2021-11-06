import { applyChangesToString, ChangeType, getProjects, Tree, names as innerNames } from "@nrwl/devkit";
import {
  createImportClause,
  createImportDeclaration,
  createLiteral,
  createNamespaceImport,
  createSourceFile,
  factory,
  FunctionDeclaration,
  ImportDeclaration,
  isImportDeclaration,
  JsxFragment,
  ScriptTarget,
  SourceFile,
  Statement,
  SyntaxKind
} from 'typescript';
import * as ts from 'typescript';
import { ImportStatementDecl } from "./generator.type";

export function componentExists(tree: Tree, project: string, dir: string) {
    const {pathToComp} = getComponentMeta(tree, project, dir);
    return tree.exists(pathToComp);
}

export function getComponentFile(tree: Tree, project: string, dir: string) {
    const {pathToComp} = getComponentMeta(tree, project, dir);
    if (!tree.exists(pathToComp)) {
      throw `The following '${pathToComp}' is not a component`;
    }
    return tree.read(pathToComp);
}

export function getComponentMeta(tree: Tree, project: string, dir: string) {
    const projects = getProjects(tree);
    if (!projects.has(project)) {
        throw "Project does not exist in this workspace. Make sure you provided the correct project or are in the correct workspace.";
    }
    const projectConfig = projects.get(project);    
    const names = innerNames(dir.split('/')[dir.split('/').length - 1]);
    const componentName = names.className;
    const componentTypeFilename = `${names.className}.type`;
    const pathToComp = `${projectConfig.root}/${dir}/${componentName}.tsx`;
    const pathToTypeFile = `${projectConfig.root}/${dir}/${componentName}.type.ts`;
    const pathToLogicHook = `${projectConfig.root}/${dir}/use${componentName}.hook.tsx`;
    const hookName = `use${names.className}`;
    const hookLogic = getLogicForHook(tree, pathToComp, project, dir);
    const hookFileName = `use${names.className}.hook.tsx`;
    const hookFileNameInExtension = `use${names.className}.hook`;
    const hookReturnType = `${names.className}Hook`;
    const hookPropsType = `${names.className}Props`;
    const hookReturnValues = ``;
    const hookParams = ``;
    const contents = tree.read(pathToComp, 'utf-8');
    const logicHookContents = tree.read(pathToLogicHook, 'utf-8');
    
    const sourceFile = createSourceFile(pathToComp, contents, ScriptTarget.Latest, true);
    const logicHookSourceFile = createSourceFile(pathToLogicHook, logicHookContents, ScriptTarget.Latest, true);

    return {
        pathToComp,
        pathToTypeFile,
        pathToLogicHook,
        hookName,
        hookFileName,
        hookFileNameInExtension,
        hookReturnType,
        hookPropsType,
        hookReturnValues,
        hookParams,
        hookLogic,
        names,
        componentName,
        projectConfig,
        projects,
        componentTypeFilename,
        addHookType,
        getLogicForHook,
        sourceFile,
        contents,
        logicHookContents,
        logicHookSourceFile
         };
}

export function insertStatementAtBeginComp(tree: Tree, path: string, statement: string): void {
    const contents = tree.read(path, 'utf-8');
    const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);
    let index: number;
    const functions = findNodes(sourceFile, SyntaxKind.FunctionDeclaration) as FunctionDeclaration[];
    if(functions[0].modifiers[0].kind === SyntaxKind.ExportKeyword) {
        index= functions[0].body.getStart(sourceFile)+1
    }

    const jsx = findNodes(sourceFile, SyntaxKind.JsxFragment) as JsxFragment[];
    statement = `${statement}\n`;
  
    const newContents = applyChangesToString(contents, [
      {
        type: ChangeType.Insert,
        index,
        text: statement,
      },
    ]);
  
    tree.write(path, newContents);
}

export function findNodes(
  node: ts.Node,
  kind: ts.SyntaxKind | ts.SyntaxKind[],
  max = Infinity
): ts.Node[] {
  if (!node || max == 0) {
    return [];
  }

  const arr: ts.Node[] = [];
  const hasMatch = Array.isArray(kind)
    ? kind.includes(node.kind)
    : node.kind === kind;
  if (hasMatch) {
    arr.push(node);
    max--;
  }
  if (max > 0) {
    for (const child of node.getChildren(node as ts.SourceFile)) {
      findNodes(child, kind, max)
      .forEach((node) => {
        if (max > 0) {
            arr.push(node);
        }
        max--;
      });

      if (max <= 0) {
        break;
      }
    }
  }

  return arr;
}

export function addHookType(tree: Tree, path: string, project: string, dir: string): void {
  const contents = tree.read(path, 'utf-8');
  const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext);
    
  const {hookReturnType} = getComponentMeta(tree, project, dir);

  const index = sourceFile.end;
  
  const newContents = applyChangesToString(contents, [
    {
      type: ChangeType.Insert,
      index,
      text: `export interface ${hookReturnType} {
        
      }
      `,
    },
  ]);

  tree.write(path, newContents);  
}

export function getLogicForHook(sourceFile: SourceFile, contents: string): {logicForHook:Statement[], startIndex:number, endIndex:number, newContentsAfterLogicExtraction:string} {
  const functions = findNodes(sourceFile, SyntaxKind.FunctionDeclaration) as FunctionDeclaration[];
  let startIndex:number;
  let endIndex:number;
  if(functions[0].modifiers[0].kind === SyntaxKind.ExportKeyword) {
    const body = functions[0].body.getChildren(sourceFile);
    startIndex = body[0].getStart(sourceFile) + 1;
    const returnStatements = findNodes(sourceFile, SyntaxKind.ReturnStatement) as ts.ReturnStatement[];
    endIndex = returnStatements[0].getStart(sourceFile);
  }
  // const logicForHook = contents.substr(startIndex, endIndex - startIndex);
  const logicForHook = getStatements(sourceFile, startIndex, endIndex);
  const newContentsAfterLogicExtraction = applyChangesToString(contents, [
    {
      type: ChangeType.Delete,
      start: startIndex,
      length: endIndex - startIndex
    },
  ]);
  // console.log('aaaaa',logicForHook)
  // tree.write(path, newContents);
  return {logicForHook, startIndex, endIndex, newContentsAfterLogicExtraction};
}



export function getImportStatements(sourceFile:SourceFile): {importDeclarations: ImportDeclaration[], start: number, end: number} {  
  const importDeclarations = findNodes(sourceFile, SyntaxKind.ImportDeclaration) as ImportDeclaration[];
  const start = importDeclarations[0].getStart(sourceFile);
  const end = importDeclarations[importDeclarations.length-1].getEnd();

  return {importDeclarations, start, end};
}

// generate import statements for identifiers in logic hook code 
export function generateImportStatementsForIdentifiersBetweenStartAndEndPos(sourceFile, startPos: number, endPos: number): {
  identifierName: string;
  module: string;
}[] {  
  const {start:importStart, end:importEnd} = getImportStatements(sourceFile);
  // console.log('importStart', importStart, 'importEnd', importEnd);
  //find all identifiers only in import statements
  const importIdentifiers = getIdentifiersBetweenStartAndEndPos(sourceFile, importStart, importEnd);
  // console.log('importIdentifiers', importIdentifiers.length,importStart, importEnd);
  const logicHookIdentifiers = getIdentifiersBetweenStartAndEndPos(sourceFile, startPos, endPos);
  // console.log('logicHookIdentifiers', logicHookIdentifiers.length, startPos, endPos, sourceFile.getStart(),sourceFile.getEnd());
  //find all the import identifiers used in logic hook identifiers
  const importIdentifiersUsedInLogicHook = importIdentifiers.filter(identifier => 
    //only include if escapedText between importIdentifiers and logicHookIdentifiers are the same
    logicHookIdentifiers.some(logicHookIdentifier => logicHookIdentifier.escapedText === identifier.escapedText)
  );

  
  // console.log('importIdentifiersUsedInLogicHook', importIdentifiersUsedInLogicHook[0].getText(sourceFile));
  const importDeclarations = importIdentifiersUsedInLogicHook.map(identifier => {
    // console.log('identifier', identifier)
    const identifierName = identifier.getText(sourceFile);
    //get the module for the identifierName
    const module = getModuleForIdentifier(sourceFile, identifierName);


    
    return {identifierName, module};
  });
  // console.log(1);
//   //get text for import declarations  
//   // const importDeclarationsText = importDeclarations.map(importDeclaration => {
//   //   return importDeclaration.getText(sourceFile);
//   // });
//   console.log(2);
// console.log('importDeclarations', importDeclarations);

  return importDeclarations;
}
  

export function getStartAndEndPosOfHookLogic(tree: Tree, pathToComp: string, hookLogic: Statement[]) {
  if (hookLogic.length === 0) {
    return {startPos: 0, endPos: 0};
  }
  const contents = tree.read(pathToComp, 'utf-8');
  const sourceFile = createSourceFile(pathToComp, contents, ScriptTarget.ESNext);
  const comp = tree.read(pathToComp).toString();
  const startPos = comp.indexOf(hookLogic[0].getText(sourceFile));
  // console.log(4)
  
  const endPos = comp.indexOf(hookLogic[hookLogic.length-1].getText(sourceFile)) + hookLogic[hookLogic.length-1].getText(sourceFile).length;
  // console.log(5)
  return {startPos, endPos};
}

export function getIdentifiersBetweenStartAndEndPos(sourceFile: ts.SourceFile, startPos: number, endPos: number): ts.Identifier[] {
  const identifiers = findNodes(sourceFile, SyntaxKind.Identifier) as ts.Identifier[];
  // console.log('identifiers', identifiers.length);
  const identifiersBetweenStartAndEndPos =
    identifiers.filter(identifier => identifier.getStart(sourceFile) >= startPos && identifier.getEnd() <= endPos);
  return identifiersBetweenStartAndEndPos;
}

export function insertStatementAtBegin(tree: Tree, path: string, statements: Statement[]) {
  const contents = tree.read(path).toString();
  const sourceFile = ts.createSourceFile(path, contents, ts.ScriptTarget.Latest, true);
  //iterate through statements and insert them at the beginning of the file
  statements.forEach(statement => {
    const newContents = applyChangesToString(contents, [
      {
        type: ChangeType.Insert,
        index: 0,        
        text: statement.getText(sourceFile)
      }
    ]);
    tree.write(path, newContents);
  });
  // const statementsText = statements.map(statement => statement.getText(sourceFile));

  // insertStatementAtBeginComp(tree,path, statementsText.join());
  // tree.overwrite(path, newSourceFile.getFullText());
}






// export function getImportsForLogicHook(tree: Tree, path: string, imports: Statement[], logicForHook: Statement[]): ImportStatementDecl[] {
//   const contents = tree.read(path, 'utf-8');
//   const sourceFile = createSourceFile(path, contents, ScriptTarget.ESNext); 
//   const usedIdentifiers: Statement[] = [];
//   // console.log('logicForHook:',(logicForHook[0] as ts.Node).getText(sourceFile))
//   logicForHook.forEach((statement)=>{
//     if(statement.kind === SyntaxKind.Identifier){
//       imports.forEach((imp)=>{
//         // console.log(imp.parent.kind, SyntaxKind.ImportClause)
//         if(imp.parent.kind === SyntaxKind.ImportClause) {
//           usedIdentifiers.push(imp)
//         }
//       })
//     }
//   });
//   // console.log('length',usedIdentifiers.length)
//   // usedIdentifiers.forEach((stat)=>{
//   //   console.log(stat.getText(sourceFile))
//   // })
//   return[]
// };

export function getStatements(sourceFile: SourceFile, start: number, end:number): Statement[] {
  const statements: Statement[]=[];
  sourceFile.statements.forEach((stat)=>{
    // console.log(`stat:${stat.pos}, ${start}, ${stat.getEnd()}, ${end} `,stat.getText(sourceFile))
    if (stat.pos >= start && stat.getEnd() <= end) {
      statements.push(stat)
    }
  })
  return statements;
}

export function getModuleForIdentifier(sourceFile: SourceFile, identifierName: string): string {
  const importDeclarations = findNodes(sourceFile, SyntaxKind.ImportDeclaration) as ts.ImportDeclaration[];
  const importDeclaration = importDeclarations.find(importDeclaration => {
    const importClause = importDeclaration.importClause;
    if (importClause) {
      const namedBindings = importClause.namedBindings;
      if (namedBindings) {
        let namedImports;
        let namedImport;
        //check if namedBindings is of type NamedImports and if so then assign property elements to namedImports

        if (namedBindings.kind === SyntaxKind.NamedImports) {
          namedImports = (namedBindings as ts.NamedImports).elements;
        } else if (namedBindings.kind === SyntaxKind.NamespaceImport){
          namedImport = (namedBindings as ts.NamespaceImport).name;
           
          if (namedImport.name.escapedText === identifierName) {
            return true;
          }
        }

        if (namedImports) {
          const namedImport = namedImports.find(namedImport => namedImport.name.escapedText === identifierName);
          if (namedImport) {
            return true;
          }
        }
      }
    }
    return false;
  });
  if (importDeclaration) {
    const moduleSpecifier = importDeclaration.moduleSpecifier;
    if (moduleSpecifier) { 
      //get unquoted module specifier text
      return moduleSpecifier.getText(sourceFile).replace(/['"]+/g, '');
    }
  }
  return '';
} 
