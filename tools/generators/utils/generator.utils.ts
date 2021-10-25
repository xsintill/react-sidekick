import { applyChangesToString, ChangeType, getProjects, Tree, names as innerNames } from "@nrwl/devkit";
import {
  createSourceFile,
  FunctionDeclaration,
  isImportDeclaration,
  JsxFragment,
  ScriptTarget,
  SyntaxKind
} from 'typescript';
import * as ts from 'typescript';

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
    const hookFileName = `use${names.className}.hook.tsx`;
    const hookFileNameMinExtension = `use${names.className}.hook`;
    const hookReturnType = `${names.className}Hook`;
    const hookPropsType = `${names.className}Props`;
    const hookReturnValues = ``;
    const hookParams = ``;

    return {
        pathToComp,
        pathToTypeFile,
        pathToLogicHook,
        hookName,
        hookFileName,
        hookFileNameMinExtension,
        hookReturnType,
        hookPropsType,
        hookReturnValues,
        hookParams,
        names,
        componentName,
        projectConfig,
        projects,
        componentTypeFilename,
        addHookType
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
