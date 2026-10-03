// Generated from tape.schema.json. Do not edit.
var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};

// node_modules/ajv/dist/runtime/ucs2length.js
var require_ucs2length = __commonJS({
  "node_modules/ajv/dist/runtime/ucs2length.js"(exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function ucs2length(str) {
      const len = str.length;
      let length = 0;
      let pos = 0;
      let value;
      while (pos < len) {
        length++;
        value = str.charCodeAt(pos++);
        if (value >= 55296 && value <= 56319 && pos < len) {
          value = str.charCodeAt(pos);
          if ((value & 64512) === 56320)
            pos++;
        }
      }
      return length;
    }
    exports.default = ucs2length;
    ucs2length.code = 'require("ajv/dist/runtime/ucs2length").default';
  }
});

// tape-validator.cjs
var require_tape_validator = __commonJS({
  "tape-validator.cjs"(exports, module) {
    module.exports = validate10;
    module.exports.default = validate10;
    var schema12 = { "additionalProperties": false, "properties": { "record": { "const": "run", "default": "run", "title": "Record", "type": "string" }, "schema_version": { "const": 1, "default": 1, "title": "Schema Version", "type": "integer" }, "id": { "maxLength": 120, "minLength": 1, "title": "Id", "type": "string" }, "name": { "maxLength": 200, "title": "Name", "type": "string" }, "source": { "default": "python", "enum": ["python", "codex", "claude-code", "factory", "n8n", "custom", "demo", "example", "clip"], "title": "Source", "type": "string" }, "version": { "default": "0.1.0", "title": "Version", "type": "string" }, "started_at": { "title": "Started At", "type": "string" }, "model": { "anyOf": [{ "type": "string" }, { "type": "null" }], "default": null, "title": "Model" }, "provider": { "anyOf": [{ "type": "string" }, { "type": "null" }], "default": null, "title": "Provider" }, "status": { "default": "running", "enum": ["running", "success", "failed", "cancelled", "incomplete"], "title": "Status", "type": "string" }, "duration_ms": { "anyOf": [{ "minimum": 0, "type": "number" }, { "type": "null" }], "default": null, "title": "Duration Ms" }, "capabilities": { "additionalProperties": { "type": "string" }, "title": "Capabilities", "type": "object" }, "configuration": { "additionalProperties": true, "title": "Configuration", "type": "object" }, "warnings": { "items": { "type": "string" }, "title": "Warnings", "type": "array" } }, "required": ["name"], "title": "Run", "type": "object" };
    var schema13 = { "additionalProperties": false, "properties": { "record": { "const": "event", "default": "event", "title": "Record", "type": "string" }, "id": { "maxLength": 120, "minLength": 1, "title": "Id", "type": "string" }, "run_id": { "maxLength": 120, "minLength": 1, "title": "Run Id", "type": "string" }, "seq": { "minimum": 0, "title": "Seq", "type": "integer" }, "kind": { "enum": ["model.start", "model.end", "tool.start", "tool.end", "context", "memory", "error", "message", "run.end"], "title": "Kind", "type": "string" }, "lane": { "enum": ["model", "tools", "context", "memory", "errors"], "title": "Lane", "type": "string" }, "name": { "maxLength": 200, "title": "Name", "type": "string" }, "timestamp": { "title": "Timestamp", "type": "string" }, "elapsed_ms": { "anyOf": [{ "minimum": 0, "type": "number" }, { "type": "null" }], "default": null, "title": "Elapsed Ms" }, "duration_ms": { "anyOf": [{ "minimum": 0, "type": "number" }, { "type": "null" }], "default": null, "title": "Duration Ms" }, "span_id": { "anyOf": [{ "type": "string" }, { "type": "null" }], "default": null, "title": "Span Id" }, "parent_id": { "anyOf": [{ "type": "string" }, { "type": "null" }], "default": null, "title": "Parent Id" }, "snapshot_id": { "anyOf": [{ "type": "string" }, { "type": "null" }], "default": null, "title": "Snapshot Id" }, "status": { "default": "success", "enum": ["running", "success", "failed", "cancelled", "unknown"], "title": "Status", "type": "string" }, "provenance": { "default": "captured", "enum": ["captured", "imported", "fixture", "derived"], "title": "Provenance", "type": "string" }, "partial": { "default": false, "title": "Partial", "type": "boolean" }, "data": { "additionalProperties": true, "title": "Data", "type": "object" } }, "required": ["run_id", "seq", "kind", "lane", "name"], "title": "Event", "type": "object" };
    var func2 = Object.prototype.hasOwnProperty;
    var func3 = require_ucs2length().default;
    function validate10(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
      let vErrors = null;
      let errors = 0;
      if (errors === 0) {
        if (data && typeof data == "object" && !Array.isArray(data)) {
          let missing0;
          if (data.run === void 0 && (missing0 = "run") || data.events === void 0 && (missing0 = "events")) {
            validate10.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
            return false;
          } else {
            const _errs1 = errors;
            for (const key0 in data) {
              if (!(key0 === "run" || key0 === "events" || key0 === "notes")) {
                validate10.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
                return false;
                break;
              }
            }
            if (_errs1 === errors) {
              if (data.run !== void 0) {
                let data0 = data.run;
                const _errs2 = errors;
                const _errs3 = errors;
                if (errors === _errs3) {
                  if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
                    if (data0.record === void 0) {
                      data0.record = "run";
                    }
                    if (data0.schema_version === void 0) {
                      data0.schema_version = 1;
                    }
                    if (data0.source === void 0) {
                      data0.source = "python";
                    }
                    if (data0.version === void 0) {
                      data0.version = "0.1.0";
                    }
                    if (data0.model === void 0) {
                      data0.model = null;
                    }
                    if (data0.provider === void 0) {
                      data0.provider = null;
                    }
                    if (data0.status === void 0) {
                      data0.status = "running";
                    }
                    if (data0.duration_ms === void 0) {
                      data0.duration_ms = null;
                    }
                    let missing1;
                    if (data0.name === void 0 && (missing1 = "name")) {
                      validate10.errors = [{ instancePath: instancePath + "/run", schemaPath: "#/$defs/Run/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                      return false;
                    } else {
                      const _errs5 = errors;
                      for (const key1 in data0) {
                        if (!func2.call(schema12.properties, key1)) {
                          validate10.errors = [{ instancePath: instancePath + "/run", schemaPath: "#/$defs/Run/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" }];
                          return false;
                          break;
                        }
                      }
                      if (_errs5 === errors) {
                        let data1 = data0.record;
                        const _errs6 = errors;
                        if (typeof data1 !== "string") {
                          validate10.errors = [{ instancePath: instancePath + "/run/record", schemaPath: "#/$defs/Run/properties/record/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        if ("run" !== data1) {
                          validate10.errors = [{ instancePath: instancePath + "/run/record", schemaPath: "#/$defs/Run/properties/record/const", keyword: "const", params: { allowedValue: "run" }, message: "must be equal to constant" }];
                          return false;
                        }
                        var valid2 = _errs6 === errors;
                        if (valid2) {
                          let data2 = data0.schema_version;
                          const _errs8 = errors;
                          if (!(typeof data2 == "number" && (!(data2 % 1) && !isNaN(data2)))) {
                            validate10.errors = [{ instancePath: instancePath + "/run/schema_version", schemaPath: "#/$defs/Run/properties/schema_version/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                            return false;
                          }
                          if (1 !== data2) {
                            validate10.errors = [{ instancePath: instancePath + "/run/schema_version", schemaPath: "#/$defs/Run/properties/schema_version/const", keyword: "const", params: { allowedValue: 1 }, message: "must be equal to constant" }];
                            return false;
                          }
                          var valid2 = _errs8 === errors;
                          if (valid2) {
                            if (data0.id !== void 0) {
                              let data3 = data0.id;
                              const _errs10 = errors;
                              if (errors === _errs10) {
                                if (typeof data3 === "string") {
                                  if (func3(data3) > 120) {
                                    validate10.errors = [{ instancePath: instancePath + "/run/id", schemaPath: "#/$defs/Run/properties/id/maxLength", keyword: "maxLength", params: { limit: 120 }, message: "must NOT have more than 120 characters" }];
                                    return false;
                                  } else {
                                    if (func3(data3) < 1) {
                                      validate10.errors = [{ instancePath: instancePath + "/run/id", schemaPath: "#/$defs/Run/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate10.errors = [{ instancePath: instancePath + "/run/id", schemaPath: "#/$defs/Run/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                              }
                              var valid2 = _errs10 === errors;
                            } else {
                              var valid2 = true;
                            }
                            if (valid2) {
                              if (data0.name !== void 0) {
                                let data4 = data0.name;
                                const _errs12 = errors;
                                if (errors === _errs12) {
                                  if (typeof data4 === "string") {
                                    if (func3(data4) > 200) {
                                      validate10.errors = [{ instancePath: instancePath + "/run/name", schemaPath: "#/$defs/Run/properties/name/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" }];
                                      return false;
                                    }
                                  } else {
                                    validate10.errors = [{ instancePath: instancePath + "/run/name", schemaPath: "#/$defs/Run/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                }
                                var valid2 = _errs12 === errors;
                              } else {
                                var valid2 = true;
                              }
                              if (valid2) {
                                let data5 = data0.source;
                                const _errs14 = errors;
                                if (typeof data5 !== "string") {
                                  validate10.errors = [{ instancePath: instancePath + "/run/source", schemaPath: "#/$defs/Run/properties/source/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                                if (!(data5 === "python" || data5 === "codex" || data5 === "claude-code" || data5 === "factory" || data5 === "n8n" || data5 === "custom" || data5 === "demo" || data5 === "example" || data5 === "clip")) {
                                  validate10.errors = [{ instancePath: instancePath + "/run/source", schemaPath: "#/$defs/Run/properties/source/enum", keyword: "enum", params: { allowedValues: schema12.properties.source.enum }, message: "must be equal to one of the allowed values" }];
                                  return false;
                                }
                                var valid2 = _errs14 === errors;
                                if (valid2) {
                                  const _errs16 = errors;
                                  if (typeof data0.version !== "string") {
                                    validate10.errors = [{ instancePath: instancePath + "/run/version", schemaPath: "#/$defs/Run/properties/version/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                  var valid2 = _errs16 === errors;
                                  if (valid2) {
                                    if (data0.started_at !== void 0) {
                                      const _errs18 = errors;
                                      if (typeof data0.started_at !== "string") {
                                        validate10.errors = [{ instancePath: instancePath + "/run/started_at", schemaPath: "#/$defs/Run/properties/started_at/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                      var valid2 = _errs18 === errors;
                                    } else {
                                      var valid2 = true;
                                    }
                                    if (valid2) {
                                      let data8 = data0.model;
                                      const _errs20 = errors;
                                      const _errs21 = errors;
                                      let valid3 = false;
                                      const _errs22 = errors;
                                      if (typeof data8 !== "string") {
                                        const err0 = { instancePath: instancePath + "/run/model", schemaPath: "#/$defs/Run/properties/model/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                        if (vErrors === null) {
                                          vErrors = [err0];
                                        } else {
                                          vErrors.push(err0);
                                        }
                                        errors++;
                                      }
                                      var _valid0 = _errs22 === errors;
                                      valid3 = valid3 || _valid0;
                                      if (!valid3) {
                                        const _errs24 = errors;
                                        if (data8 !== null) {
                                          const err1 = { instancePath: instancePath + "/run/model", schemaPath: "#/$defs/Run/properties/model/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                          if (vErrors === null) {
                                            vErrors = [err1];
                                          } else {
                                            vErrors.push(err1);
                                          }
                                          errors++;
                                        }
                                        var _valid0 = _errs24 === errors;
                                        valid3 = valid3 || _valid0;
                                      }
                                      if (!valid3) {
                                        const err2 = { instancePath: instancePath + "/run/model", schemaPath: "#/$defs/Run/properties/model/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                        if (vErrors === null) {
                                          vErrors = [err2];
                                        } else {
                                          vErrors.push(err2);
                                        }
                                        errors++;
                                        validate10.errors = vErrors;
                                        return false;
                                      } else {
                                        errors = _errs21;
                                        if (vErrors !== null) {
                                          if (_errs21) {
                                            vErrors.length = _errs21;
                                          } else {
                                            vErrors = null;
                                          }
                                        }
                                      }
                                      var valid2 = _errs20 === errors;
                                      if (valid2) {
                                        let data9 = data0.provider;
                                        const _errs26 = errors;
                                        const _errs27 = errors;
                                        let valid4 = false;
                                        const _errs28 = errors;
                                        if (typeof data9 !== "string") {
                                          const err3 = { instancePath: instancePath + "/run/provider", schemaPath: "#/$defs/Run/properties/provider/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                          if (vErrors === null) {
                                            vErrors = [err3];
                                          } else {
                                            vErrors.push(err3);
                                          }
                                          errors++;
                                        }
                                        var _valid1 = _errs28 === errors;
                                        valid4 = valid4 || _valid1;
                                        if (!valid4) {
                                          const _errs30 = errors;
                                          if (data9 !== null) {
                                            const err4 = { instancePath: instancePath + "/run/provider", schemaPath: "#/$defs/Run/properties/provider/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                            if (vErrors === null) {
                                              vErrors = [err4];
                                            } else {
                                              vErrors.push(err4);
                                            }
                                            errors++;
                                          }
                                          var _valid1 = _errs30 === errors;
                                          valid4 = valid4 || _valid1;
                                        }
                                        if (!valid4) {
                                          const err5 = { instancePath: instancePath + "/run/provider", schemaPath: "#/$defs/Run/properties/provider/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                          if (vErrors === null) {
                                            vErrors = [err5];
                                          } else {
                                            vErrors.push(err5);
                                          }
                                          errors++;
                                          validate10.errors = vErrors;
                                          return false;
                                        } else {
                                          errors = _errs27;
                                          if (vErrors !== null) {
                                            if (_errs27) {
                                              vErrors.length = _errs27;
                                            } else {
                                              vErrors = null;
                                            }
                                          }
                                        }
                                        var valid2 = _errs26 === errors;
                                        if (valid2) {
                                          let data10 = data0.status;
                                          const _errs32 = errors;
                                          if (typeof data10 !== "string") {
                                            validate10.errors = [{ instancePath: instancePath + "/run/status", schemaPath: "#/$defs/Run/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                          if (!(data10 === "running" || data10 === "success" || data10 === "failed" || data10 === "cancelled" || data10 === "incomplete")) {
                                            validate10.errors = [{ instancePath: instancePath + "/run/status", schemaPath: "#/$defs/Run/properties/status/enum", keyword: "enum", params: { allowedValues: schema12.properties.status.enum }, message: "must be equal to one of the allowed values" }];
                                            return false;
                                          }
                                          var valid2 = _errs32 === errors;
                                          if (valid2) {
                                            let data11 = data0.duration_ms;
                                            const _errs34 = errors;
                                            const _errs35 = errors;
                                            let valid5 = false;
                                            const _errs36 = errors;
                                            if (errors === _errs36) {
                                              if (typeof data11 == "number") {
                                                if (data11 < 0 || isNaN(data11)) {
                                                  const err6 = { instancePath: instancePath + "/run/duration_ms", schemaPath: "#/$defs/Run/properties/duration_ms/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                                                  if (vErrors === null) {
                                                    vErrors = [err6];
                                                  } else {
                                                    vErrors.push(err6);
                                                  }
                                                  errors++;
                                                }
                                              } else {
                                                const err7 = { instancePath: instancePath + "/run/duration_ms", schemaPath: "#/$defs/Run/properties/duration_ms/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                if (vErrors === null) {
                                                  vErrors = [err7];
                                                } else {
                                                  vErrors.push(err7);
                                                }
                                                errors++;
                                              }
                                            }
                                            var _valid2 = _errs36 === errors;
                                            valid5 = valid5 || _valid2;
                                            if (!valid5) {
                                              const _errs38 = errors;
                                              if (data11 !== null) {
                                                const err8 = { instancePath: instancePath + "/run/duration_ms", schemaPath: "#/$defs/Run/properties/duration_ms/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                if (vErrors === null) {
                                                  vErrors = [err8];
                                                } else {
                                                  vErrors.push(err8);
                                                }
                                                errors++;
                                              }
                                              var _valid2 = _errs38 === errors;
                                              valid5 = valid5 || _valid2;
                                            }
                                            if (!valid5) {
                                              const err9 = { instancePath: instancePath + "/run/duration_ms", schemaPath: "#/$defs/Run/properties/duration_ms/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                              if (vErrors === null) {
                                                vErrors = [err9];
                                              } else {
                                                vErrors.push(err9);
                                              }
                                              errors++;
                                              validate10.errors = vErrors;
                                              return false;
                                            } else {
                                              errors = _errs35;
                                              if (vErrors !== null) {
                                                if (_errs35) {
                                                  vErrors.length = _errs35;
                                                } else {
                                                  vErrors = null;
                                                }
                                              }
                                            }
                                            var valid2 = _errs34 === errors;
                                            if (valid2) {
                                              if (data0.capabilities !== void 0) {
                                                let data12 = data0.capabilities;
                                                const _errs40 = errors;
                                                if (errors === _errs40) {
                                                  if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
                                                    for (const key2 in data12) {
                                                      const _errs43 = errors;
                                                      if (typeof data12[key2] !== "string") {
                                                        validate10.errors = [{ instancePath: instancePath + "/run/capabilities/" + key2.replace(/~/g, "~0").replace(/\//g, "~1"), schemaPath: "#/$defs/Run/properties/capabilities/additionalProperties/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                        return false;
                                                      }
                                                      var valid6 = _errs43 === errors;
                                                      if (!valid6) {
                                                        break;
                                                      }
                                                    }
                                                  } else {
                                                    validate10.errors = [{ instancePath: instancePath + "/run/capabilities", schemaPath: "#/$defs/Run/properties/capabilities/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                    return false;
                                                  }
                                                }
                                                var valid2 = _errs40 === errors;
                                              } else {
                                                var valid2 = true;
                                              }
                                              if (valid2) {
                                                if (data0.configuration !== void 0) {
                                                  let data14 = data0.configuration;
                                                  const _errs45 = errors;
                                                  if (errors === _errs45) {
                                                    if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
                                                    } else {
                                                      validate10.errors = [{ instancePath: instancePath + "/run/configuration", schemaPath: "#/$defs/Run/properties/configuration/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                      return false;
                                                    }
                                                  }
                                                  var valid2 = _errs45 === errors;
                                                } else {
                                                  var valid2 = true;
                                                }
                                                if (valid2) {
                                                  if (data0.warnings !== void 0) {
                                                    let data15 = data0.warnings;
                                                    const _errs48 = errors;
                                                    if (errors === _errs48) {
                                                      if (Array.isArray(data15)) {
                                                        var valid7 = true;
                                                        const len0 = data15.length;
                                                        for (let i0 = 0; i0 < len0; i0++) {
                                                          const _errs50 = errors;
                                                          if (typeof data15[i0] !== "string") {
                                                            validate10.errors = [{ instancePath: instancePath + "/run/warnings/" + i0, schemaPath: "#/$defs/Run/properties/warnings/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                            return false;
                                                          }
                                                          var valid7 = _errs50 === errors;
                                                          if (!valid7) {
                                                            break;
                                                          }
                                                        }
                                                      } else {
                                                        validate10.errors = [{ instancePath: instancePath + "/run/warnings", schemaPath: "#/$defs/Run/properties/warnings/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                                        return false;
                                                      }
                                                    }
                                                    var valid2 = _errs48 === errors;
                                                  } else {
                                                    var valid2 = true;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  } else {
                    validate10.errors = [{ instancePath: instancePath + "/run", schemaPath: "#/$defs/Run/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                    return false;
                  }
                }
                var valid0 = _errs2 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.events !== void 0) {
                  let data17 = data.events;
                  const _errs52 = errors;
                  if (errors === _errs52) {
                    if (Array.isArray(data17)) {
                      if (data17.length > 1e4) {
                        validate10.errors = [{ instancePath: instancePath + "/events", schemaPath: "#/properties/events/maxItems", keyword: "maxItems", params: { limit: 1e4 }, message: "must NOT have more than 10000 items" }];
                        return false;
                      } else {
                        var valid8 = true;
                        const len1 = data17.length;
                        for (let i1 = 0; i1 < len1; i1++) {
                          let data18 = data17[i1];
                          const _errs54 = errors;
                          const _errs55 = errors;
                          if (errors === _errs55) {
                            if (data18 && typeof data18 == "object" && !Array.isArray(data18)) {
                              if (data18.record === void 0) {
                                data18.record = "event";
                              }
                              if (data18.elapsed_ms === void 0) {
                                data18.elapsed_ms = null;
                              }
                              if (data18.duration_ms === void 0) {
                                data18.duration_ms = null;
                              }
                              if (data18.span_id === void 0) {
                                data18.span_id = null;
                              }
                              if (data18.parent_id === void 0) {
                                data18.parent_id = null;
                              }
                              if (data18.snapshot_id === void 0) {
                                data18.snapshot_id = null;
                              }
                              if (data18.status === void 0) {
                                data18.status = "success";
                              }
                              if (data18.provenance === void 0) {
                                data18.provenance = "captured";
                              }
                              if (data18.partial === void 0) {
                                data18.partial = false;
                              }
                              let missing2;
                              if (data18.run_id === void 0 && (missing2 = "run_id") || data18.seq === void 0 && (missing2 = "seq") || data18.kind === void 0 && (missing2 = "kind") || data18.lane === void 0 && (missing2 = "lane") || data18.name === void 0 && (missing2 = "name")) {
                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1, schemaPath: "#/$defs/Event/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                                return false;
                              } else {
                                const _errs57 = errors;
                                for (const key3 in data18) {
                                  if (!func2.call(schema13.properties, key3)) {
                                    validate10.errors = [{ instancePath: instancePath + "/events/" + i1, schemaPath: "#/$defs/Event/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" }];
                                    return false;
                                    break;
                                  }
                                }
                                if (_errs57 === errors) {
                                  let data19 = data18.record;
                                  const _errs58 = errors;
                                  if (typeof data19 !== "string") {
                                    validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/record", schemaPath: "#/$defs/Event/properties/record/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                  if ("event" !== data19) {
                                    validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/record", schemaPath: "#/$defs/Event/properties/record/const", keyword: "const", params: { allowedValue: "event" }, message: "must be equal to constant" }];
                                    return false;
                                  }
                                  var valid10 = _errs58 === errors;
                                  if (valid10) {
                                    if (data18.id !== void 0) {
                                      let data20 = data18.id;
                                      const _errs60 = errors;
                                      if (errors === _errs60) {
                                        if (typeof data20 === "string") {
                                          if (func3(data20) > 120) {
                                            validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/id", schemaPath: "#/$defs/Event/properties/id/maxLength", keyword: "maxLength", params: { limit: 120 }, message: "must NOT have more than 120 characters" }];
                                            return false;
                                          } else {
                                            if (func3(data20) < 1) {
                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/id", schemaPath: "#/$defs/Event/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                              return false;
                                            }
                                          }
                                        } else {
                                          validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/id", schemaPath: "#/$defs/Event/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                          return false;
                                        }
                                      }
                                      var valid10 = _errs60 === errors;
                                    } else {
                                      var valid10 = true;
                                    }
                                    if (valid10) {
                                      if (data18.run_id !== void 0) {
                                        let data21 = data18.run_id;
                                        const _errs62 = errors;
                                        if (errors === _errs62) {
                                          if (typeof data21 === "string") {
                                            if (func3(data21) > 120) {
                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/run_id", schemaPath: "#/$defs/Event/properties/run_id/maxLength", keyword: "maxLength", params: { limit: 120 }, message: "must NOT have more than 120 characters" }];
                                              return false;
                                            } else {
                                              if (func3(data21) < 1) {
                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/run_id", schemaPath: "#/$defs/Event/properties/run_id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                return false;
                                              }
                                            }
                                          } else {
                                            validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/run_id", schemaPath: "#/$defs/Event/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                        var valid10 = _errs62 === errors;
                                      } else {
                                        var valid10 = true;
                                      }
                                      if (valid10) {
                                        if (data18.seq !== void 0) {
                                          let data22 = data18.seq;
                                          const _errs64 = errors;
                                          if (!(typeof data22 == "number" && (!(data22 % 1) && !isNaN(data22)))) {
                                            validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/seq", schemaPath: "#/$defs/Event/properties/seq/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                            return false;
                                          }
                                          if (errors === _errs64) {
                                            if (typeof data22 == "number") {
                                              if (data22 < 0 || isNaN(data22)) {
                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/seq", schemaPath: "#/$defs/Event/properties/seq/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                                return false;
                                              }
                                            }
                                          }
                                          var valid10 = _errs64 === errors;
                                        } else {
                                          var valid10 = true;
                                        }
                                        if (valid10) {
                                          if (data18.kind !== void 0) {
                                            let data23 = data18.kind;
                                            const _errs66 = errors;
                                            if (typeof data23 !== "string") {
                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/kind", schemaPath: "#/$defs/Event/properties/kind/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                              return false;
                                            }
                                            if (!(data23 === "model.start" || data23 === "model.end" || data23 === "tool.start" || data23 === "tool.end" || data23 === "context" || data23 === "memory" || data23 === "error" || data23 === "message" || data23 === "run.end")) {
                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/kind", schemaPath: "#/$defs/Event/properties/kind/enum", keyword: "enum", params: { allowedValues: schema13.properties.kind.enum }, message: "must be equal to one of the allowed values" }];
                                              return false;
                                            }
                                            var valid10 = _errs66 === errors;
                                          } else {
                                            var valid10 = true;
                                          }
                                          if (valid10) {
                                            if (data18.lane !== void 0) {
                                              let data24 = data18.lane;
                                              const _errs68 = errors;
                                              if (typeof data24 !== "string") {
                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/lane", schemaPath: "#/$defs/Event/properties/lane/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                return false;
                                              }
                                              if (!(data24 === "model" || data24 === "tools" || data24 === "context" || data24 === "memory" || data24 === "errors")) {
                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/lane", schemaPath: "#/$defs/Event/properties/lane/enum", keyword: "enum", params: { allowedValues: schema13.properties.lane.enum }, message: "must be equal to one of the allowed values" }];
                                                return false;
                                              }
                                              var valid10 = _errs68 === errors;
                                            } else {
                                              var valid10 = true;
                                            }
                                            if (valid10) {
                                              if (data18.name !== void 0) {
                                                let data25 = data18.name;
                                                const _errs70 = errors;
                                                if (errors === _errs70) {
                                                  if (typeof data25 === "string") {
                                                    if (func3(data25) > 200) {
                                                      validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/name", schemaPath: "#/$defs/Event/properties/name/maxLength", keyword: "maxLength", params: { limit: 200 }, message: "must NOT have more than 200 characters" }];
                                                      return false;
                                                    }
                                                  } else {
                                                    validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/name", schemaPath: "#/$defs/Event/properties/name/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                }
                                                var valid10 = _errs70 === errors;
                                              } else {
                                                var valid10 = true;
                                              }
                                              if (valid10) {
                                                if (data18.timestamp !== void 0) {
                                                  const _errs72 = errors;
                                                  if (typeof data18.timestamp !== "string") {
                                                    validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/timestamp", schemaPath: "#/$defs/Event/properties/timestamp/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                  var valid10 = _errs72 === errors;
                                                } else {
                                                  var valid10 = true;
                                                }
                                                if (valid10) {
                                                  let data27 = data18.elapsed_ms;
                                                  const _errs74 = errors;
                                                  const _errs75 = errors;
                                                  let valid11 = false;
                                                  const _errs76 = errors;
                                                  if (errors === _errs76) {
                                                    if (typeof data27 == "number") {
                                                      if (data27 < 0 || isNaN(data27)) {
                                                        const err10 = { instancePath: instancePath + "/events/" + i1 + "/elapsed_ms", schemaPath: "#/$defs/Event/properties/elapsed_ms/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                                                        if (vErrors === null) {
                                                          vErrors = [err10];
                                                        } else {
                                                          vErrors.push(err10);
                                                        }
                                                        errors++;
                                                      }
                                                    } else {
                                                      const err11 = { instancePath: instancePath + "/events/" + i1 + "/elapsed_ms", schemaPath: "#/$defs/Event/properties/elapsed_ms/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                      if (vErrors === null) {
                                                        vErrors = [err11];
                                                      } else {
                                                        vErrors.push(err11);
                                                      }
                                                      errors++;
                                                    }
                                                  }
                                                  var _valid3 = _errs76 === errors;
                                                  valid11 = valid11 || _valid3;
                                                  if (!valid11) {
                                                    const _errs78 = errors;
                                                    if (data27 !== null) {
                                                      const err12 = { instancePath: instancePath + "/events/" + i1 + "/elapsed_ms", schemaPath: "#/$defs/Event/properties/elapsed_ms/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                      if (vErrors === null) {
                                                        vErrors = [err12];
                                                      } else {
                                                        vErrors.push(err12);
                                                      }
                                                      errors++;
                                                    }
                                                    var _valid3 = _errs78 === errors;
                                                    valid11 = valid11 || _valid3;
                                                  }
                                                  if (!valid11) {
                                                    const err13 = { instancePath: instancePath + "/events/" + i1 + "/elapsed_ms", schemaPath: "#/$defs/Event/properties/elapsed_ms/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                    if (vErrors === null) {
                                                      vErrors = [err13];
                                                    } else {
                                                      vErrors.push(err13);
                                                    }
                                                    errors++;
                                                    validate10.errors = vErrors;
                                                    return false;
                                                  } else {
                                                    errors = _errs75;
                                                    if (vErrors !== null) {
                                                      if (_errs75) {
                                                        vErrors.length = _errs75;
                                                      } else {
                                                        vErrors = null;
                                                      }
                                                    }
                                                  }
                                                  var valid10 = _errs74 === errors;
                                                  if (valid10) {
                                                    let data28 = data18.duration_ms;
                                                    const _errs80 = errors;
                                                    const _errs81 = errors;
                                                    let valid12 = false;
                                                    const _errs82 = errors;
                                                    if (errors === _errs82) {
                                                      if (typeof data28 == "number") {
                                                        if (data28 < 0 || isNaN(data28)) {
                                                          const err14 = { instancePath: instancePath + "/events/" + i1 + "/duration_ms", schemaPath: "#/$defs/Event/properties/duration_ms/anyOf/0/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" };
                                                          if (vErrors === null) {
                                                            vErrors = [err14];
                                                          } else {
                                                            vErrors.push(err14);
                                                          }
                                                          errors++;
                                                        }
                                                      } else {
                                                        const err15 = { instancePath: instancePath + "/events/" + i1 + "/duration_ms", schemaPath: "#/$defs/Event/properties/duration_ms/anyOf/0/type", keyword: "type", params: { type: "number" }, message: "must be number" };
                                                        if (vErrors === null) {
                                                          vErrors = [err15];
                                                        } else {
                                                          vErrors.push(err15);
                                                        }
                                                        errors++;
                                                      }
                                                    }
                                                    var _valid4 = _errs82 === errors;
                                                    valid12 = valid12 || _valid4;
                                                    if (!valid12) {
                                                      const _errs84 = errors;
                                                      if (data28 !== null) {
                                                        const err16 = { instancePath: instancePath + "/events/" + i1 + "/duration_ms", schemaPath: "#/$defs/Event/properties/duration_ms/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                        if (vErrors === null) {
                                                          vErrors = [err16];
                                                        } else {
                                                          vErrors.push(err16);
                                                        }
                                                        errors++;
                                                      }
                                                      var _valid4 = _errs84 === errors;
                                                      valid12 = valid12 || _valid4;
                                                    }
                                                    if (!valid12) {
                                                      const err17 = { instancePath: instancePath + "/events/" + i1 + "/duration_ms", schemaPath: "#/$defs/Event/properties/duration_ms/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                      if (vErrors === null) {
                                                        vErrors = [err17];
                                                      } else {
                                                        vErrors.push(err17);
                                                      }
                                                      errors++;
                                                      validate10.errors = vErrors;
                                                      return false;
                                                    } else {
                                                      errors = _errs81;
                                                      if (vErrors !== null) {
                                                        if (_errs81) {
                                                          vErrors.length = _errs81;
                                                        } else {
                                                          vErrors = null;
                                                        }
                                                      }
                                                    }
                                                    var valid10 = _errs80 === errors;
                                                    if (valid10) {
                                                      let data29 = data18.span_id;
                                                      const _errs86 = errors;
                                                      const _errs87 = errors;
                                                      let valid13 = false;
                                                      const _errs88 = errors;
                                                      if (typeof data29 !== "string") {
                                                        const err18 = { instancePath: instancePath + "/events/" + i1 + "/span_id", schemaPath: "#/$defs/Event/properties/span_id/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                                        if (vErrors === null) {
                                                          vErrors = [err18];
                                                        } else {
                                                          vErrors.push(err18);
                                                        }
                                                        errors++;
                                                      }
                                                      var _valid5 = _errs88 === errors;
                                                      valid13 = valid13 || _valid5;
                                                      if (!valid13) {
                                                        const _errs90 = errors;
                                                        if (data29 !== null) {
                                                          const err19 = { instancePath: instancePath + "/events/" + i1 + "/span_id", schemaPath: "#/$defs/Event/properties/span_id/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                          if (vErrors === null) {
                                                            vErrors = [err19];
                                                          } else {
                                                            vErrors.push(err19);
                                                          }
                                                          errors++;
                                                        }
                                                        var _valid5 = _errs90 === errors;
                                                        valid13 = valid13 || _valid5;
                                                      }
                                                      if (!valid13) {
                                                        const err20 = { instancePath: instancePath + "/events/" + i1 + "/span_id", schemaPath: "#/$defs/Event/properties/span_id/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                        if (vErrors === null) {
                                                          vErrors = [err20];
                                                        } else {
                                                          vErrors.push(err20);
                                                        }
                                                        errors++;
                                                        validate10.errors = vErrors;
                                                        return false;
                                                      } else {
                                                        errors = _errs87;
                                                        if (vErrors !== null) {
                                                          if (_errs87) {
                                                            vErrors.length = _errs87;
                                                          } else {
                                                            vErrors = null;
                                                          }
                                                        }
                                                      }
                                                      var valid10 = _errs86 === errors;
                                                      if (valid10) {
                                                        let data30 = data18.parent_id;
                                                        const _errs92 = errors;
                                                        const _errs93 = errors;
                                                        let valid14 = false;
                                                        const _errs94 = errors;
                                                        if (typeof data30 !== "string") {
                                                          const err21 = { instancePath: instancePath + "/events/" + i1 + "/parent_id", schemaPath: "#/$defs/Event/properties/parent_id/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                                          if (vErrors === null) {
                                                            vErrors = [err21];
                                                          } else {
                                                            vErrors.push(err21);
                                                          }
                                                          errors++;
                                                        }
                                                        var _valid6 = _errs94 === errors;
                                                        valid14 = valid14 || _valid6;
                                                        if (!valid14) {
                                                          const _errs96 = errors;
                                                          if (data30 !== null) {
                                                            const err22 = { instancePath: instancePath + "/events/" + i1 + "/parent_id", schemaPath: "#/$defs/Event/properties/parent_id/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                            if (vErrors === null) {
                                                              vErrors = [err22];
                                                            } else {
                                                              vErrors.push(err22);
                                                            }
                                                            errors++;
                                                          }
                                                          var _valid6 = _errs96 === errors;
                                                          valid14 = valid14 || _valid6;
                                                        }
                                                        if (!valid14) {
                                                          const err23 = { instancePath: instancePath + "/events/" + i1 + "/parent_id", schemaPath: "#/$defs/Event/properties/parent_id/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                          if (vErrors === null) {
                                                            vErrors = [err23];
                                                          } else {
                                                            vErrors.push(err23);
                                                          }
                                                          errors++;
                                                          validate10.errors = vErrors;
                                                          return false;
                                                        } else {
                                                          errors = _errs93;
                                                          if (vErrors !== null) {
                                                            if (_errs93) {
                                                              vErrors.length = _errs93;
                                                            } else {
                                                              vErrors = null;
                                                            }
                                                          }
                                                        }
                                                        var valid10 = _errs92 === errors;
                                                        if (valid10) {
                                                          let data31 = data18.snapshot_id;
                                                          const _errs98 = errors;
                                                          const _errs99 = errors;
                                                          let valid15 = false;
                                                          const _errs100 = errors;
                                                          if (typeof data31 !== "string") {
                                                            const err24 = { instancePath: instancePath + "/events/" + i1 + "/snapshot_id", schemaPath: "#/$defs/Event/properties/snapshot_id/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                                            if (vErrors === null) {
                                                              vErrors = [err24];
                                                            } else {
                                                              vErrors.push(err24);
                                                            }
                                                            errors++;
                                                          }
                                                          var _valid7 = _errs100 === errors;
                                                          valid15 = valid15 || _valid7;
                                                          if (!valid15) {
                                                            const _errs102 = errors;
                                                            if (data31 !== null) {
                                                              const err25 = { instancePath: instancePath + "/events/" + i1 + "/snapshot_id", schemaPath: "#/$defs/Event/properties/snapshot_id/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                                              if (vErrors === null) {
                                                                vErrors = [err25];
                                                              } else {
                                                                vErrors.push(err25);
                                                              }
                                                              errors++;
                                                            }
                                                            var _valid7 = _errs102 === errors;
                                                            valid15 = valid15 || _valid7;
                                                          }
                                                          if (!valid15) {
                                                            const err26 = { instancePath: instancePath + "/events/" + i1 + "/snapshot_id", schemaPath: "#/$defs/Event/properties/snapshot_id/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                                            if (vErrors === null) {
                                                              vErrors = [err26];
                                                            } else {
                                                              vErrors.push(err26);
                                                            }
                                                            errors++;
                                                            validate10.errors = vErrors;
                                                            return false;
                                                          } else {
                                                            errors = _errs99;
                                                            if (vErrors !== null) {
                                                              if (_errs99) {
                                                                vErrors.length = _errs99;
                                                              } else {
                                                                vErrors = null;
                                                              }
                                                            }
                                                          }
                                                          var valid10 = _errs98 === errors;
                                                          if (valid10) {
                                                            let data32 = data18.status;
                                                            const _errs104 = errors;
                                                            if (typeof data32 !== "string") {
                                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/status", schemaPath: "#/$defs/Event/properties/status/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                              return false;
                                                            }
                                                            if (!(data32 === "running" || data32 === "success" || data32 === "failed" || data32 === "cancelled" || data32 === "unknown")) {
                                                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/status", schemaPath: "#/$defs/Event/properties/status/enum", keyword: "enum", params: { allowedValues: schema13.properties.status.enum }, message: "must be equal to one of the allowed values" }];
                                                              return false;
                                                            }
                                                            var valid10 = _errs104 === errors;
                                                            if (valid10) {
                                                              let data33 = data18.provenance;
                                                              const _errs106 = errors;
                                                              if (typeof data33 !== "string") {
                                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/provenance", schemaPath: "#/$defs/Event/properties/provenance/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                                return false;
                                                              }
                                                              if (!(data33 === "captured" || data33 === "imported" || data33 === "fixture" || data33 === "derived")) {
                                                                validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/provenance", schemaPath: "#/$defs/Event/properties/provenance/enum", keyword: "enum", params: { allowedValues: schema13.properties.provenance.enum }, message: "must be equal to one of the allowed values" }];
                                                                return false;
                                                              }
                                                              var valid10 = _errs106 === errors;
                                                              if (valid10) {
                                                                const _errs108 = errors;
                                                                if (typeof data18.partial !== "boolean") {
                                                                  validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/partial", schemaPath: "#/$defs/Event/properties/partial/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                                                                  return false;
                                                                }
                                                                var valid10 = _errs108 === errors;
                                                                if (valid10) {
                                                                  if (data18.data !== void 0) {
                                                                    let data35 = data18.data;
                                                                    const _errs110 = errors;
                                                                    if (errors === _errs110) {
                                                                      if (data35 && typeof data35 == "object" && !Array.isArray(data35)) {
                                                                      } else {
                                                                        validate10.errors = [{ instancePath: instancePath + "/events/" + i1 + "/data", schemaPath: "#/$defs/Event/properties/data/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                                                        return false;
                                                                      }
                                                                    }
                                                                    var valid10 = _errs110 === errors;
                                                                  } else {
                                                                    var valid10 = true;
                                                                  }
                                                                }
                                                              }
                                                            }
                                                          }
                                                        }
                                                      }
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              validate10.errors = [{ instancePath: instancePath + "/events/" + i1, schemaPath: "#/$defs/Event/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid8 = _errs54 === errors;
                          if (!valid8) {
                            break;
                          }
                        }
                      }
                    } else {
                      validate10.errors = [{ instancePath: instancePath + "/events", schemaPath: "#/properties/events/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs52 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.notes !== void 0) {
                    let data36 = data.notes;
                    const _errs113 = errors;
                    if (errors === _errs113) {
                      if (Array.isArray(data36)) {
                        if (data36.length > 1e3) {
                          validate10.errors = [{ instancePath: instancePath + "/notes", schemaPath: "#/properties/notes/maxItems", keyword: "maxItems", params: { limit: 1e3 }, message: "must NOT have more than 1000 items" }];
                          return false;
                        } else {
                          var valid16 = true;
                          const len2 = data36.length;
                          for (let i2 = 0; i2 < len2; i2++) {
                            let data37 = data36[i2];
                            const _errs115 = errors;
                            const _errs116 = errors;
                            if (errors === _errs116) {
                              if (data37 && typeof data37 == "object" && !Array.isArray(data37)) {
                                if (data37.record === void 0) {
                                  data37.record = "note";
                                }
                                if (data37.event_id === void 0) {
                                  data37.event_id = null;
                                }
                                let missing3;
                                if (data37.run_id === void 0 && (missing3 = "run_id") || data37.elapsed_ms === void 0 && (missing3 = "elapsed_ms") || data37.text === void 0 && (missing3 = "text")) {
                                  validate10.errors = [{ instancePath: instancePath + "/notes/" + i2, schemaPath: "#/$defs/Note/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                                  return false;
                                } else {
                                  const _errs118 = errors;
                                  for (const key4 in data37) {
                                    if (!(key4 === "record" || key4 === "id" || key4 === "run_id" || key4 === "event_id" || key4 === "elapsed_ms" || key4 === "text" || key4 === "created_at" || key4 === "updated_at")) {
                                      validate10.errors = [{ instancePath: instancePath + "/notes/" + i2, schemaPath: "#/$defs/Note/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" }];
                                      return false;
                                      break;
                                    }
                                  }
                                  if (_errs118 === errors) {
                                    let data38 = data37.record;
                                    const _errs119 = errors;
                                    if (typeof data38 !== "string") {
                                      validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/record", schemaPath: "#/$defs/Note/properties/record/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                    if ("note" !== data38) {
                                      validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/record", schemaPath: "#/$defs/Note/properties/record/const", keyword: "const", params: { allowedValue: "note" }, message: "must be equal to constant" }];
                                      return false;
                                    }
                                    var valid18 = _errs119 === errors;
                                    if (valid18) {
                                      if (data37.id !== void 0) {
                                        let data39 = data37.id;
                                        const _errs121 = errors;
                                        if (errors === _errs121) {
                                          if (typeof data39 === "string") {
                                            if (func3(data39) > 120) {
                                              validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/id", schemaPath: "#/$defs/Note/properties/id/maxLength", keyword: "maxLength", params: { limit: 120 }, message: "must NOT have more than 120 characters" }];
                                              return false;
                                            } else {
                                              if (func3(data39) < 1) {
                                                validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/id", schemaPath: "#/$defs/Note/properties/id/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                return false;
                                              }
                                            }
                                          } else {
                                            validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/id", schemaPath: "#/$defs/Note/properties/id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                        var valid18 = _errs121 === errors;
                                      } else {
                                        var valid18 = true;
                                      }
                                      if (valid18) {
                                        if (data37.run_id !== void 0) {
                                          const _errs123 = errors;
                                          if (typeof data37.run_id !== "string") {
                                            validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/run_id", schemaPath: "#/$defs/Note/properties/run_id/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                          var valid18 = _errs123 === errors;
                                        } else {
                                          var valid18 = true;
                                        }
                                        if (valid18) {
                                          let data41 = data37.event_id;
                                          const _errs125 = errors;
                                          const _errs126 = errors;
                                          let valid19 = false;
                                          const _errs127 = errors;
                                          if (typeof data41 !== "string") {
                                            const err27 = { instancePath: instancePath + "/notes/" + i2 + "/event_id", schemaPath: "#/$defs/Note/properties/event_id/anyOf/0/type", keyword: "type", params: { type: "string" }, message: "must be string" };
                                            if (vErrors === null) {
                                              vErrors = [err27];
                                            } else {
                                              vErrors.push(err27);
                                            }
                                            errors++;
                                          }
                                          var _valid8 = _errs127 === errors;
                                          valid19 = valid19 || _valid8;
                                          if (!valid19) {
                                            const _errs129 = errors;
                                            if (data41 !== null) {
                                              const err28 = { instancePath: instancePath + "/notes/" + i2 + "/event_id", schemaPath: "#/$defs/Note/properties/event_id/anyOf/1/type", keyword: "type", params: { type: "null" }, message: "must be null" };
                                              if (vErrors === null) {
                                                vErrors = [err28];
                                              } else {
                                                vErrors.push(err28);
                                              }
                                              errors++;
                                            }
                                            var _valid8 = _errs129 === errors;
                                            valid19 = valid19 || _valid8;
                                          }
                                          if (!valid19) {
                                            const err29 = { instancePath: instancePath + "/notes/" + i2 + "/event_id", schemaPath: "#/$defs/Note/properties/event_id/anyOf", keyword: "anyOf", params: {}, message: "must match a schema in anyOf" };
                                            if (vErrors === null) {
                                              vErrors = [err29];
                                            } else {
                                              vErrors.push(err29);
                                            }
                                            errors++;
                                            validate10.errors = vErrors;
                                            return false;
                                          } else {
                                            errors = _errs126;
                                            if (vErrors !== null) {
                                              if (_errs126) {
                                                vErrors.length = _errs126;
                                              } else {
                                                vErrors = null;
                                              }
                                            }
                                          }
                                          var valid18 = _errs125 === errors;
                                          if (valid18) {
                                            if (data37.elapsed_ms !== void 0) {
                                              let data42 = data37.elapsed_ms;
                                              const _errs131 = errors;
                                              if (errors === _errs131) {
                                                if (typeof data42 == "number") {
                                                  if (data42 < 0 || isNaN(data42)) {
                                                    validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/elapsed_ms", schemaPath: "#/$defs/Note/properties/elapsed_ms/minimum", keyword: "minimum", params: { comparison: ">=", limit: 0 }, message: "must be >= 0" }];
                                                    return false;
                                                  }
                                                } else {
                                                  validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/elapsed_ms", schemaPath: "#/$defs/Note/properties/elapsed_ms/type", keyword: "type", params: { type: "number" }, message: "must be number" }];
                                                  return false;
                                                }
                                              }
                                              var valid18 = _errs131 === errors;
                                            } else {
                                              var valid18 = true;
                                            }
                                            if (valid18) {
                                              if (data37.text !== void 0) {
                                                let data43 = data37.text;
                                                const _errs133 = errors;
                                                if (errors === _errs133) {
                                                  if (typeof data43 === "string") {
                                                    if (func3(data43) > 2e3) {
                                                      validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/text", schemaPath: "#/$defs/Note/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                                                      return false;
                                                    } else {
                                                      if (func3(data43) < 1) {
                                                        validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/text", schemaPath: "#/$defs/Note/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                        return false;
                                                      }
                                                    }
                                                  } else {
                                                    validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/text", schemaPath: "#/$defs/Note/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                }
                                                var valid18 = _errs133 === errors;
                                              } else {
                                                var valid18 = true;
                                              }
                                              if (valid18) {
                                                if (data37.created_at !== void 0) {
                                                  const _errs135 = errors;
                                                  if (typeof data37.created_at !== "string") {
                                                    validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/created_at", schemaPath: "#/$defs/Note/properties/created_at/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                    return false;
                                                  }
                                                  var valid18 = _errs135 === errors;
                                                } else {
                                                  var valid18 = true;
                                                }
                                                if (valid18) {
                                                  if (data37.updated_at !== void 0) {
                                                    const _errs137 = errors;
                                                    if (typeof data37.updated_at !== "string") {
                                                      validate10.errors = [{ instancePath: instancePath + "/notes/" + i2 + "/updated_at", schemaPath: "#/$defs/Note/properties/updated_at/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                      return false;
                                                    }
                                                    var valid18 = _errs137 === errors;
                                                  } else {
                                                    var valid18 = true;
                                                  }
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              } else {
                                validate10.errors = [{ instancePath: instancePath + "/notes/" + i2, schemaPath: "#/$defs/Note/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                                return false;
                              }
                            }
                            var valid16 = _errs115 === errors;
                            if (!valid16) {
                              break;
                            }
                          }
                        }
                      } else {
                        validate10.errors = [{ instancePath: instancePath + "/notes", schemaPath: "#/properties/notes/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs113 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        } else {
          validate10.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
          return false;
        }
      }
      validate10.errors = vErrors;
      return errors === 0;
    }
  }
});
export default require_tape_validator();
