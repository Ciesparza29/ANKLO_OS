import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const manifests = new Map();
for (const folder of ["apps", "packages"]) {
  for (const entry of await readdir(join(root, folder), {
    withFileTypes: true,
  })) {
    if (!entry.isDirectory()) continue;
    const manifest = JSON.parse(
      await readFile(join(root, folder, entry.name, "package.json"), "utf8"),
    );
    manifests.set(manifest.name, manifest);
  }
}

const allowed = new Map([
  [
    "@anklo/web",
    new Set(["@anklo/contracts", "@anklo/domain", "@anklo/db", "@anklo/ui"]),
  ],
  ["@anklo/db", new Set(["@anklo/domain", "@anklo/contracts"])],
  ["@anklo/domain", new Set(["@anklo/contracts"])],
  ["@anklo/ui", new Set(["@anklo/contracts"])],
  ["@anklo/contracts", new Set()],
  ["@anklo/config", new Set()],
]);

const graph = new Map();
const errors = [];
for (const [name, manifest] of manifests) {
  const dependencies = {
    ...manifest.dependencies,
    ...manifest.devDependencies,
    ...manifest.peerDependencies,
  };
  const internal = Object.keys(dependencies).filter((dependency) =>
    dependency.startsWith("@anklo/"),
  );
  graph.set(name, internal);
  for (const dependency of internal) {
    if (!manifests.has(dependency))
      errors.push(`${name}: paquete interno desconocido ${dependency}`);
    if (!allowed.get(name)?.has(dependency))
      errors.push(`${name}: dependencia prohibida hacia ${dependency}`);
  }
}

const visiting = new Set();
const visited = new Set();
function visit(name, path = []) {
  if (visiting.has(name)) errors.push(`ciclo: ${[...path, name].join(" -> ")}`);
  if (visited.has(name) || visiting.has(name)) return;
  visiting.add(name);
  for (const dependency of graph.get(name) ?? [])
    visit(dependency, [...path, name]);
  visiting.delete(name);
  visited.add(name);
}
for (const name of graph.keys()) visit(name);

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(
  "Arquitectura de paquetes válida: dirección permitida y sin ciclos.",
);
