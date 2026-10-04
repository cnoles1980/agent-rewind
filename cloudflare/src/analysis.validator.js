// Generated from Python analysis models; do not edit.
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

// analysis-validator.cjs
var validateRequest = validate10;
var func2 = require_ucs2length().default;
var pattern0 = new RegExp("^[a-zA-Z0-9_-]+$", "u");
function validate10(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.evidence === void 0 && (missing0 = "evidence") || data.event_ids === void 0 && (missing0 = "event_ids") || data.reviewed === void 0 && (missing0 = "reviewed") || data.idempotency_key === void 0 && (missing0 = "idempotency_key")) {
        validate10.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "evidence" || key0 === "event_ids" || key0 === "reviewed" || key0 === "idempotency_key")) {
            validate10.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.evidence !== void 0) {
            let data0 = data.evidence;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (typeof data0 === "string") {
                if (func2(data0) > 48e3) {
                  validate10.errors = [{ instancePath: instancePath + "/evidence", schemaPath: "#/properties/evidence/maxLength", keyword: "maxLength", params: { limit: 48e3 }, message: "must NOT have more than 48000 characters" }];
                  return false;
                } else {
                  if (func2(data0) < 1) {
                    validate10.errors = [{ instancePath: instancePath + "/evidence", schemaPath: "#/properties/evidence/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                    return false;
                  }
                }
              } else {
                validate10.errors = [{ instancePath: instancePath + "/evidence", schemaPath: "#/properties/evidence/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.event_ids !== void 0) {
              let data1 = data.event_ids;
              const _errs4 = errors;
              if (errors === _errs4) {
                if (Array.isArray(data1)) {
                  if (data1.length > 11) {
                    validate10.errors = [{ instancePath: instancePath + "/event_ids", schemaPath: "#/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                    return false;
                  } else {
                    if (data1.length < 1) {
                      validate10.errors = [{ instancePath: instancePath + "/event_ids", schemaPath: "#/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                      return false;
                    } else {
                      var valid1 = true;
                      const len0 = data1.length;
                      for (let i0 = 0; i0 < len0; i0++) {
                        const _errs6 = errors;
                        if (typeof data1[i0] !== "string") {
                          validate10.errors = [{ instancePath: instancePath + "/event_ids/" + i0, schemaPath: "#/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        var valid1 = _errs6 === errors;
                        if (!valid1) {
                          break;
                        }
                      }
                    }
                  }
                } else {
                  validate10.errors = [{ instancePath: instancePath + "/event_ids", schemaPath: "#/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs4 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.reviewed !== void 0) {
                let data3 = data.reviewed;
                const _errs8 = errors;
                if (typeof data3 !== "boolean") {
                  validate10.errors = [{ instancePath: instancePath + "/reviewed", schemaPath: "#/properties/reviewed/type", keyword: "type", params: { type: "boolean" }, message: "must be boolean" }];
                  return false;
                }
                if (true !== data3) {
                  validate10.errors = [{ instancePath: instancePath + "/reviewed", schemaPath: "#/properties/reviewed/const", keyword: "const", params: { allowedValue: true }, message: "must be equal to constant" }];
                  return false;
                }
                var valid0 = _errs8 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.idempotency_key !== void 0) {
                  let data4 = data.idempotency_key;
                  const _errs10 = errors;
                  if (errors === _errs10) {
                    if (typeof data4 === "string") {
                      if (func2(data4) > 100) {
                        validate10.errors = [{ instancePath: instancePath + "/idempotency_key", schemaPath: "#/properties/idempotency_key/maxLength", keyword: "maxLength", params: { limit: 100 }, message: "must NOT have more than 100 characters" }];
                        return false;
                      } else {
                        if (func2(data4) < 8) {
                          validate10.errors = [{ instancePath: instancePath + "/idempotency_key", schemaPath: "#/properties/idempotency_key/minLength", keyword: "minLength", params: { limit: 8 }, message: "must NOT have fewer than 8 characters" }];
                          return false;
                        } else {
                          if (!pattern0.test(data4)) {
                            validate10.errors = [{ instancePath: instancePath + "/idempotency_key", schemaPath: "#/properties/idempotency_key/pattern", keyword: "pattern", params: { pattern: "^[a-zA-Z0-9_-]+$" }, message: 'must match pattern "^[a-zA-Z0-9_-]+$"' }];
                            return false;
                          }
                        }
                      }
                    } else {
                      validate10.errors = [{ instancePath: instancePath + "/idempotency_key", schemaPath: "#/properties/idempotency_key/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                      return false;
                    }
                  }
                  var valid0 = _errs10 === errors;
                } else {
                  var valid0 = true;
                }
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
var validateResult = validate11;
function validate11(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.facts === void 0 && (missing0 = "facts") || data.hypotheses === void 0 && (missing0 = "hypotheses") || data.missing_evidence === void 0 && (missing0 = "missing_evidence") || data.verification_steps === void 0 && (missing0 = "verification_steps") || data.repair_prompt === void 0 && (missing0 = "repair_prompt")) {
        validate11.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "facts" || key0 === "hypotheses" || key0 === "missing_evidence" || key0 === "verification_steps" || key0 === "repair_prompt")) {
            validate11.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.facts !== void 0) {
            let data0 = data.facts;
            const _errs2 = errors;
            if (errors === _errs2) {
              if (Array.isArray(data0)) {
                if (data0.length > 6) {
                  validate11.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                  return false;
                } else {
                  var valid1 = true;
                  const len0 = data0.length;
                  for (let i0 = 0; i0 < len0; i0++) {
                    let data1 = data0[i0];
                    const _errs4 = errors;
                    const _errs5 = errors;
                    if (errors === _errs5) {
                      if (data1 && typeof data1 == "object" && !Array.isArray(data1)) {
                        let missing1;
                        if (data1.text === void 0 && (missing1 = "text") || data1.event_ids === void 0 && (missing1 = "event_ids")) {
                          validate11.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                          return false;
                        } else {
                          const _errs7 = errors;
                          for (const key1 in data1) {
                            if (!(key1 === "text" || key1 === "event_ids")) {
                              validate11.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" }];
                              return false;
                              break;
                            }
                          }
                          if (_errs7 === errors) {
                            if (data1.text !== void 0) {
                              let data2 = data1.text;
                              const _errs8 = errors;
                              if (errors === _errs8) {
                                if (typeof data2 === "string") {
                                  if (func2(data2) > 2e3) {
                                    validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                                    return false;
                                  } else {
                                    if (func2(data2) < 1) {
                                      validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                      return false;
                                    }
                                  }
                                } else {
                                  validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                              }
                              var valid3 = _errs8 === errors;
                            } else {
                              var valid3 = true;
                            }
                            if (valid3) {
                              if (data1.event_ids !== void 0) {
                                let data3 = data1.event_ids;
                                const _errs10 = errors;
                                if (errors === _errs10) {
                                  if (Array.isArray(data3)) {
                                    if (data3.length > 11) {
                                      validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                                      return false;
                                    } else {
                                      if (data3.length < 1) {
                                        validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                        return false;
                                      } else {
                                        var valid4 = true;
                                        const len1 = data3.length;
                                        for (let i1 = 0; i1 < len1; i1++) {
                                          const _errs12 = errors;
                                          if (typeof data3[i1] !== "string") {
                                            validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/event_ids/" + i1, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                          var valid4 = _errs12 === errors;
                                          if (!valid4) {
                                            break;
                                          }
                                        }
                                      }
                                    }
                                  } else {
                                    validate11.errors = [{ instancePath: instancePath + "/facts/" + i0 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                    return false;
                                  }
                                }
                                var valid3 = _errs10 === errors;
                              } else {
                                var valid3 = true;
                              }
                            }
                          }
                        }
                      } else {
                        validate11.errors = [{ instancePath: instancePath + "/facts/" + i0, schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                        return false;
                      }
                    }
                    var valid1 = _errs4 === errors;
                    if (!valid1) {
                      break;
                    }
                  }
                }
              } else {
                validate11.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.hypotheses !== void 0) {
              let data5 = data.hypotheses;
              const _errs14 = errors;
              if (errors === _errs14) {
                if (Array.isArray(data5)) {
                  if (data5.length > 6) {
                    validate11.errors = [{ instancePath: instancePath + "/hypotheses", schemaPath: "#/properties/hypotheses/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                    return false;
                  } else {
                    var valid5 = true;
                    const len2 = data5.length;
                    for (let i2 = 0; i2 < len2; i2++) {
                      let data6 = data5[i2];
                      const _errs16 = errors;
                      const _errs17 = errors;
                      if (errors === _errs17) {
                        if (data6 && typeof data6 == "object" && !Array.isArray(data6)) {
                          let missing2;
                          if (data6.text === void 0 && (missing2 = "text") || data6.event_ids === void 0 && (missing2 = "event_ids")) {
                            validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2, schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                            return false;
                          } else {
                            const _errs19 = errors;
                            for (const key2 in data6) {
                              if (!(key2 === "text" || key2 === "event_ids")) {
                                validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2, schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" }];
                                return false;
                                break;
                              }
                            }
                            if (_errs19 === errors) {
                              if (data6.text !== void 0) {
                                let data7 = data6.text;
                                const _errs20 = errors;
                                if (errors === _errs20) {
                                  if (typeof data7 === "string") {
                                    if (func2(data7) > 2e3) {
                                      validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                                      return false;
                                    } else {
                                      if (func2(data7) < 1) {
                                        validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                        return false;
                                      }
                                    }
                                  } else {
                                    validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                }
                                var valid7 = _errs20 === errors;
                              } else {
                                var valid7 = true;
                              }
                              if (valid7) {
                                if (data6.event_ids !== void 0) {
                                  let data8 = data6.event_ids;
                                  const _errs22 = errors;
                                  if (errors === _errs22) {
                                    if (Array.isArray(data8)) {
                                      if (data8.length > 11) {
                                        validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                                        return false;
                                      } else {
                                        if (data8.length < 1) {
                                          validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                          return false;
                                        } else {
                                          var valid8 = true;
                                          const len3 = data8.length;
                                          for (let i3 = 0; i3 < len3; i3++) {
                                            const _errs24 = errors;
                                            if (typeof data8[i3] !== "string") {
                                              validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/event_ids/" + i3, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                              return false;
                                            }
                                            var valid8 = _errs24 === errors;
                                            if (!valid8) {
                                              break;
                                            }
                                          }
                                        }
                                      }
                                    } else {
                                      validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                      return false;
                                    }
                                  }
                                  var valid7 = _errs22 === errors;
                                } else {
                                  var valid7 = true;
                                }
                              }
                            }
                          }
                        } else {
                          validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i2, schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                          return false;
                        }
                      }
                      var valid5 = _errs16 === errors;
                      if (!valid5) {
                        break;
                      }
                    }
                  }
                } else {
                  validate11.errors = [{ instancePath: instancePath + "/hypotheses", schemaPath: "#/properties/hypotheses/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                  return false;
                }
              }
              var valid0 = _errs14 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.missing_evidence !== void 0) {
                let data10 = data.missing_evidence;
                const _errs26 = errors;
                if (errors === _errs26) {
                  if (Array.isArray(data10)) {
                    if (data10.length > 6) {
                      validate11.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                      return false;
                    } else {
                      var valid9 = true;
                      const len4 = data10.length;
                      for (let i4 = 0; i4 < len4; i4++) {
                        const _errs28 = errors;
                        if (typeof data10[i4] !== "string") {
                          validate11.errors = [{ instancePath: instancePath + "/missing_evidence/" + i4, schemaPath: "#/properties/missing_evidence/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                        var valid9 = _errs28 === errors;
                        if (!valid9) {
                          break;
                        }
                      }
                    }
                  } else {
                    validate11.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs26 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.verification_steps !== void 0) {
                  let data12 = data.verification_steps;
                  const _errs30 = errors;
                  if (errors === _errs30) {
                    if (Array.isArray(data12)) {
                      if (data12.length > 6) {
                        validate11.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                        return false;
                      } else {
                        if (data12.length < 1) {
                          validate11.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                          return false;
                        } else {
                          var valid10 = true;
                          const len5 = data12.length;
                          for (let i5 = 0; i5 < len5; i5++) {
                            const _errs32 = errors;
                            if (typeof data12[i5] !== "string") {
                              validate11.errors = [{ instancePath: instancePath + "/verification_steps/" + i5, schemaPath: "#/properties/verification_steps/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            var valid10 = _errs32 === errors;
                            if (!valid10) {
                              break;
                            }
                          }
                        }
                      }
                    } else {
                      validate11.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs30 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.repair_prompt !== void 0) {
                    let data14 = data.repair_prompt;
                    const _errs34 = errors;
                    if (errors === _errs34) {
                      if (typeof data14 === "string") {
                        if (func2(data14) > 6e3) {
                          validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/maxLength", keyword: "maxLength", params: { limit: 6e3 }, message: "must NOT have more than 6000 characters" }];
                          return false;
                        } else {
                          if (func2(data14) < 1) {
                            validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                            return false;
                          }
                        }
                      } else {
                        validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                        return false;
                      }
                    }
                    var valid0 = _errs34 === errors;
                  } else {
                    var valid0 = true;
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate11.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate11.errors = vErrors;
  return errors === 0;
}
export {
  validateRequest,
  validateResult
};
