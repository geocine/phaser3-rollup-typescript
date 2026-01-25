import * as ts from 'typescript';

const willReadFrequentlyArg = () =>
  ts.factory.createObjectLiteralExpression(
    [
      ts.factory.createPropertyAssignment(
        'willReadFrequently',
        ts.factory.createTrue()
      )
    ],
    false
  );

export const patchCanvasFeatures = (code: string): string => {
  const source = ts.createSourceFile(
    'CanvasFeatures.js',
    code,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.JS
  );
  let changed = false;

  const cloneNode = <T extends ts.Node>(node: T): T =>
    typeof ts.factory.cloneNode === 'function'
      ? ts.factory.cloneNode(node)
      : node;

  const isCanvasPoolCreate = (node: ts.Expression): node is ts.CallExpression =>
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    ts.isIdentifier(node.expression.expression) &&
    node.expression.expression.text === 'CanvasPool' &&
    node.expression.name.text === 'create';

  const isCanvasPoolRemoveStatement = (statement: ts.Statement): boolean => {
    if (!ts.isExpressionStatement(statement)) {
      return false;
    }

    const expression = statement.expression;
    return (
      ts.isCallExpression(expression) &&
      ts.isPropertyAccessExpression(expression.expression) &&
      ts.isIdentifier(expression.expression.expression) &&
      expression.expression.expression.text === 'CanvasPool' &&
      expression.expression.name.text === 'remove'
    );
  };

  const isCanvasPoolRequireStatement = (statement: ts.Statement): boolean => {
    if (!ts.isVariableStatement(statement)) {
      return false;
    }

    const declarations = statement.declarationList.declarations;
    if (declarations.length !== 1) {
      return false;
    }

    const declaration = declarations[0];
    if (!ts.isIdentifier(declaration.name)) {
      return false;
    }

    if (declaration.name.text !== 'CanvasPool') {
      return false;
    }

    const initializer = declaration.initializer;
    if (!initializer || !ts.isCallExpression(initializer)) {
      return false;
    }

    if (!ts.isIdentifier(initializer.expression)) {
      return false;
    }

    if (initializer.expression.text !== 'require') {
      return false;
    }

    if (
      initializer.arguments.length !== 1 ||
      !ts.isStringLiteral(initializer.arguments[0])
    ) {
      return false;
    }

    const spec = initializer.arguments[0].text;
    return spec === '../display/canvas/CanvasPool';
  };

  const createCanvasCall = () =>
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier('document'),
        'createElement'
      ),
      undefined,
      [ts.factory.createStringLiteral('canvas')]
    );

  const createAssign = (
    target: ts.Identifier,
    prop: 'width' | 'height',
    value: ts.Expression
  ) =>
    ts.factory.createExpressionStatement(
      ts.factory.createBinaryExpression(
        ts.factory.createPropertyAccessExpression(target, prop),
        ts.SyntaxKind.EqualsToken,
        value
      )
    );

  const transformer = (context: ts.TransformationContext) => {
    const rewriteCanvasPoolCreate = (
      statement: ts.Statement
    ): ts.Statement[] | null => {
      if (ts.isVariableStatement(statement)) {
        const declarations = statement.declarationList.declarations;
        if (declarations.length === 1) {
          const declaration = declarations[0];
          if (
            declaration.initializer &&
            isCanvasPoolCreate(declaration.initializer) &&
            ts.isIdentifier(declaration.name)
          ) {
            const args = declaration.initializer.arguments;
            const widthArg =
              args[1] ?? ts.factory.createNumericLiteral('1');
            const heightArg =
              args[2] ?? ts.factory.createNumericLiteral('1');
            const newDecl = ts.factory.updateVariableDeclaration(
              declaration,
              declaration.name,
              declaration.exclamationToken,
              declaration.type,
              createCanvasCall()
            );
            const newList = ts.factory.updateVariableDeclarationList(
              statement.declarationList,
              [newDecl]
            );
            const newStatement = ts.factory.updateVariableStatement(
              statement,
              statement.modifiers,
              newList
            );
            changed = true;
            return [
              newStatement,
              createAssign(declaration.name, 'width', cloneNode(widthArg)),
              createAssign(declaration.name, 'height', cloneNode(heightArg))
            ];
          }
        }
      }

      return null;
    };

    const visitStatements = (
      statements: readonly ts.Statement[]
    ): ts.Statement[] => {
      const next: ts.Statement[] = [];
      statements.forEach((statement) => {
        if (isCanvasPoolRequireStatement(statement)) {
          changed = true;
          return;
        }
        if (isCanvasPoolRemoveStatement(statement)) {
          changed = true;
          return;
        }
        const replaced = rewriteCanvasPoolCreate(statement);
        if (replaced) {
          replaced.forEach((node) => {
            next.push(ts.visitNode(node, visit) as ts.Statement);
          });
        } else {
          next.push(ts.visitNode(statement, visit) as ts.Statement);
        }
      });
      return next;
    };

    const visit: ts.Visitor = (node) => {
      if (ts.isSourceFile(node)) {
        return ts.factory.updateSourceFile(
          node,
          visitStatements(node.statements)
        );
      }

      if (ts.isBlock(node)) {
        return ts.factory.updateBlock(node, visitStatements(node.statements));
      }

      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === 'getContext' &&
        node.arguments.length === 1 &&
        ts.isStringLiteral(node.arguments[0]) &&
        node.arguments[0].text === '2d'
      ) {
        changed = true;
        return ts.factory.updateCallExpression(
          node,
          node.expression,
          node.typeArguments,
          [node.arguments[0], willReadFrequentlyArg()]
        );
      }

      return ts.visitEachChild(node, visit, context);
    };

    return (node: ts.SourceFile) => ts.visitNode(node, visit);
  };

  const result = ts.transform(source, [transformer]);
  const transformed = result.transformed[0] as ts.SourceFile;
  const output = changed
    ? ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(
        transformed
      )
    : code;
  result.dispose();

  return output;
};
