import assert from "node:assert/strict";
import { readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = realpathSync(fileURLToPath(new URL("..", import.meta.url)));
const packageJson = JSON.parse(
  readFileSync(resolve(root, "package.json"), "utf8"),
);
const lock = JSON.parse(
  readFileSync(resolve(root, "package-lock.json"), "utf8"),
);

function assertInsideRoot(path) {
  const local = relative(root, realpathSync(path));
  assert(
    !isAbsolute(local) && local !== ".." && !local.startsWith(`..${sep}`),
    `Dependency escapes the standalone project: ${path}`,
  );
}

for (const [name, version] of Object.entries({
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
})) {
  assert(
    !/^(?:file:|link:|workspace:)/.test(version),
    `Local dependency: ${name}`,
  );
  const installedRoot = resolve(root, "node_modules", name);
  assertInsideRoot(installedRoot);
  const installed = JSON.parse(
    readFileSync(resolve(installedRoot, "package.json"), "utf8"),
  );
  assert.equal(
    installed.version,
    version,
    `Installed version differs from the manifest: ${name}`,
  );
  assert.equal(
    lock.packages[`node_modules/${name}`]?.version,
    version,
    `Lockfile version differs from the manifest: ${name}`,
  );
}
for (const [name, entry] of Object.entries(lock.packages)) {
  assert(!entry.link, `Linked package in lockfile: ${name}`);
  assert(
    !entry.resolved || /^https:\/\//.test(entry.resolved),
    `Non-registry package in lockfile: ${name}`,
  );
}
for (const entrypoint of [
  "@viselora/dom-webgl",
  "@viselora/dom-webgl/react",
  "@viselora/scroll-adapters",
  "@viselora/scroll-adapters/react",
]) {
  const path = fileURLToPath(import.meta.resolve(entrypoint));
  assertInsideRoot(path);
  console.log(`${entrypoint} -> ${relative(root, path)}`);
}

const configPath = resolve(root, "tsconfig.json");
const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
assert.equal(configFile.error, undefined);
const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root);
assert.equal(config.errors.length, 0);
assert.equal(
  config.options.paths,
  undefined,
  "Source aliases are not permitted",
);
for (const file of config.fileNames) {
  assertInsideRoot(file);
  const source = ts.createSourceFile(
    file,
    readFileSync(file, "utf8"),
    ts.ScriptTarget.Latest,
  );
  function inspect(node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      const specifier = node.moduleSpecifier.text;
      const result = ts.resolveModuleName(
        specifier,
        file,
        config.options,
        ts.sys,
      );
      if (result.resolvedModule)
        assertInsideRoot(result.resolvedModule.resolvedFileName);
      if (specifier.startsWith("@viselora/")) {
        assert(
          /^@viselora\/(?:dom-webgl|scroll-adapters)(?:\/react)?$/.test(
            specifier,
          ),
          `Private Viselora import in ${relative(root, file)}: ${specifier}`,
        );
      }
    }
    ts.forEachChild(node, inspect);
  }
  inspect(source);
}
console.log(
  `Standalone boundary passed: ${config.fileNames.length} TypeScript files.`,
);
