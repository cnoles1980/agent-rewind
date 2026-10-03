// Compile the schema during development/build, never with eval in the browser.
import { readFileSync, writeFileSync } from "node:fs";
import Ajv from "ajv";
import standalone from "ajv/dist/standalone/index.js";
import { build } from "esbuild";
const schema = JSON.parse(readFileSync("src/tape.schema.json", "utf8"));
const ajv = new Ajv({
  strict: false,
  useDefaults: true,
  code: { source: true },
});
const source = standalone(ajv, ajv.compile(schema));
const result = await build({
  stdin: {
    contents: source,
    resolveDir: process.cwd(),
    sourcefile: "tape-validator.cjs",
  },
  bundle: true,
  platform: "browser",
  format: "esm",
  write: false,
});
writeFileSync(
  "src/tape.validator.js",
  "// Generated from tape.schema.json. Do not edit.\n" +
    result.outputFiles[0].text,
);
