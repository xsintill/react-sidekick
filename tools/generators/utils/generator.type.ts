import { Identifier, NamedImports, StringLiteral } from "typescript";

enum ImportStatementKind {
    Script,
    ThirdParty,
    Native
}

export interface ImportStatementDecl {
  kind: ImportStatementKind;
  namedImport: NamedImports | Identifier;
  moduleSpecifier: StringLiteral;  
}

