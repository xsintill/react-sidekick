import { Tree } from '@nrwl/devkit';
import { createTree } from '@nrwl/devkit/testing';
import { insertExport } from './insertExport';

describe('insertExport', () => {
  let tree: Tree;

  beforeEach(() => {
    tree = createTree();
  });

  it('inserts a statement after the last export', () => {
    tree.write('index.ts', `export { a } from 'a-path';`);

    insertExport(tree, 'index.ts', 'b', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export { a, b } from 'a-path';"`
    );
  });

  it('inserts a statement after the last export with a trailing comma', () => {
    tree.write('index.ts', `export { a, } from 'a-path';`);

    insertExport(tree, 'index.ts', 'b', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export { a, b, } from 'a-path';"`
    );
  });

  it('inserts a statement at the beginning if there are no exports', () => {
    tree.write('index.ts', `export { a } from 'a-path';`);

    insertExport(tree, 'index.ts', 'b', 'b-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(`
      "export { a } from 'a-path';
      export { b } from 'b-path';"
    `);
  });

  it('sorts the namedExports identifiers', () => {
    tree.write('index.ts', `export { z } from 'a-path';`);

    insertExport(tree, 'index.ts', 'a', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export { a, z } from 'a-path';"`
    );
  });

  it('adds nothing if identifier and export path already exist', () => {
    tree.write('index.ts', `exort { a } from 'a-path';`);

    insertExport(tree, 'index.ts', 'a', 'a-path');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export { a } from 'a-path';"`
    );
  });

  it('adds the block with the exportIdentifier if no block exist', () => {
    tree.write('index.ts', `export react from 'react';`);

    insertExport(tree, 'index.ts', 'useState', 'react');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export react, { useState } from 'react';"`
    );
  });

  it('keeps both the existing identifier and nameExport stay intact', () => {
    tree.write('index.ts', `export react, {useState} from 'react';`);

    insertExport(tree, 'index.ts', 'useRef', 'react');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(
      `"export react, { useRef, useState } from 'react';"`
    );
  });

  it('adds type when iserting typeOnly export', () => {
    tree.write('index.ts', `export { useState } from 'react';`);

    insertExport(tree, 'index.ts', 'ReactNode', 'react', 'isTypeOnly');

    expect(tree.read('index.ts', 'utf-8')).toMatchInlineSnapshot(`
"export { useState } from 'react';
export type { ReactNode } from 'react';"
`);
  });
});