import { Tree } from '@nrwl/devkit';
import { createTree } from '@nrwl/devkit/testing';
import { insertImport } from './insertImport';

describe('insertImport', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTree();
  });

  it('should insert a statement after the last import', () => {
    tree.write('index.ts', `import { a } from 'a-path';`);

    insertImport(tree, 'index.ts', 'b', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"import { a, b } from 'a-path';"`
    );
  });

  it('should insert a statement after the last import with a trailing comma', () => {
    tree.write('index.ts', `import { a, } from 'a-path';`);

    insertImport(tree, 'index.ts', 'b', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"import { a, b, } from 'a-path';"`
    );
  });

  it('should insert a statement at the beginning if there are no imports', () => {
    tree.write('index.ts', `import { a } from 'a-path';`);

    insertImport(tree, 'index.ts', 'b', 'b-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(`
      "import { a } from 'a-path';
      import { b } from 'b-path';"
    `);
  });

  it('should sort the namedImports identifiers', () => {
    tree.write('index.ts', `import { z } from 'a-path';`);

    insertImport(tree, 'index.ts', 'a', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"import { a, z } from 'a-path';"`
    );
  });

  it('should not add anything if identifier and import path already exist', () => {
    tree.write('index.ts', `import { a } from 'a-path';`);

    insertImport(tree, 'index.ts', 'a', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"import { a } from 'a-path';"`
    );
  });
});