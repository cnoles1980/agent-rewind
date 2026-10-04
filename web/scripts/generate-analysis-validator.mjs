import { readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import standalone from "ajv/dist/standalone/index.js";
import { build } from "esbuild";
import { compile } from "json-schema-to-typescript";
const contract = JSON.parse(
  readFileSync("../cloudflare/src/analysis-contract.json", "utf8"),
);
const ajv = new Ajv({ strict: false, code: { source: true, esm: true } });
ajv.addSchema(contract.request, "request");
ajv.addSchema(contract.result, "result");
const source = standalone(ajv, {
  validateRequest: "request",
  validateResult: "result",
});
const result = await build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: "analysis-validator.cjs",
  },
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
});
writeFileSync(
  "../cloudflare/src/analysis.validator.js",
  "// Generated from Python analysis models; do not edit.\n" +
    result.outputFiles[0].text,
);
for (const kind of ["request", "result"])
  writeFileSync(
    `../cloudflare/src/${kind}.generated.ts`,
    await compile(
      contract[kind],
      kind === "request" ? "AnalysisRequest" : "AnalysisResult",
      { ignoreMinAndMaxItems: true },
    ),
  );
