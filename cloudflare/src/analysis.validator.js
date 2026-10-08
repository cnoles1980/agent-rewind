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
      if (data.explanation === void 0 && (missing0 = "explanation") || data.next_step === void 0 && (missing0 = "next_step") || data.facts === void 0 && (missing0 = "facts") || data.hypotheses === void 0 && (missing0 = "hypotheses") || data.missing_evidence === void 0 && (missing0 = "missing_evidence") || data.verification_steps === void 0 && (missing0 = "verification_steps") || data.repair_prompt === void 0 && (missing0 = "repair_prompt")) {
        validate11.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "explanation" || key0 === "next_step" || key0 === "facts" || key0 === "hypotheses" || key0 === "missing_evidence" || key0 === "verification_steps" || key0 === "repair_prompt")) {
            validate11.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.explanation !== void 0) {
            let data0 = data.explanation;
            const _errs2 = errors;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
                let missing1;
                if (data0.text === void 0 && (missing1 = "text") || data0.event_ids === void 0 && (missing1 = "event_ids")) {
                  validate11.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  const _errs5 = errors;
                  for (const key1 in data0) {
                    if (!(key1 === "text" || key1 === "event_ids")) {
                      validate11.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" }];
                      return false;
                      break;
                    }
                  }
                  if (_errs5 === errors) {
                    if (data0.text !== void 0) {
                      let data1 = data0.text;
                      const _errs6 = errors;
                      if (errors === _errs6) {
                        if (typeof data1 === "string") {
                          if (func2(data1) > 2e3) {
                            validate11.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                            return false;
                          } else {
                            if (func2(data1) < 1) {
                              validate11.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                              return false;
                            }
                          }
                        } else {
                          validate11.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid2 = _errs6 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data0.event_ids !== void 0) {
                        let data2 = data0.event_ids;
                        const _errs8 = errors;
                        if (errors === _errs8) {
                          if (Array.isArray(data2)) {
                            if (data2.length > 11) {
                              validate11.errors = [{ instancePath: instancePath + "/explanation/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                              return false;
                            } else {
                              if (data2.length < 1) {
                                validate11.errors = [{ instancePath: instancePath + "/explanation/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                return false;
                              } else {
                                var valid3 = true;
                                const len0 = data2.length;
                                for (let i0 = 0; i0 < len0; i0++) {
                                  const _errs10 = errors;
                                  if (typeof data2[i0] !== "string") {
                                    validate11.errors = [{ instancePath: instancePath + "/explanation/event_ids/" + i0, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                    return false;
                                  }
                                  var valid3 = _errs10 === errors;
                                  if (!valid3) {
                                    break;
                                  }
                                }
                              }
                            }
                          } else {
                            validate11.errors = [{ instancePath: instancePath + "/explanation/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid2 = _errs8 === errors;
                      } else {
                        var valid2 = true;
                      }
                    }
                  }
                }
              } else {
                validate11.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.next_step !== void 0) {
              let data4 = data.next_step;
              const _errs12 = errors;
              const _errs13 = errors;
              if (errors === _errs13) {
                if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                  let missing2;
                  if (data4.text === void 0 && (missing2 = "text") || data4.event_ids === void 0 && (missing2 = "event_ids")) {
                    validate11.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                    return false;
                  } else {
                    const _errs15 = errors;
                    for (const key2 in data4) {
                      if (!(key2 === "text" || key2 === "event_ids")) {
                        validate11.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" }];
                        return false;
                        break;
                      }
                    }
                    if (_errs15 === errors) {
                      if (data4.text !== void 0) {
                        let data5 = data4.text;
                        const _errs16 = errors;
                        if (errors === _errs16) {
                          if (typeof data5 === "string") {
                            if (func2(data5) > 2e3) {
                              validate11.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                              return false;
                            } else {
                              if (func2(data5) < 1) {
                                validate11.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                return false;
                              }
                            }
                          } else {
                            validate11.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                        var valid5 = _errs16 === errors;
                      } else {
                        var valid5 = true;
                      }
                      if (valid5) {
                        if (data4.event_ids !== void 0) {
                          let data6 = data4.event_ids;
                          const _errs18 = errors;
                          if (errors === _errs18) {
                            if (Array.isArray(data6)) {
                              if (data6.length > 11) {
                                validate11.errors = [{ instancePath: instancePath + "/next_step/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                                return false;
                              } else {
                                if (data6.length < 1) {
                                  validate11.errors = [{ instancePath: instancePath + "/next_step/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                  return false;
                                } else {
                                  var valid6 = true;
                                  const len1 = data6.length;
                                  for (let i1 = 0; i1 < len1; i1++) {
                                    const _errs20 = errors;
                                    if (typeof data6[i1] !== "string") {
                                      validate11.errors = [{ instancePath: instancePath + "/next_step/event_ids/" + i1, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                    var valid6 = _errs20 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                }
                              }
                            } else {
                              validate11.errors = [{ instancePath: instancePath + "/next_step/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid5 = _errs18 === errors;
                        } else {
                          var valid5 = true;
                        }
                      }
                    }
                  }
                } else {
                  validate11.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs12 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.facts !== void 0) {
                let data8 = data.facts;
                const _errs22 = errors;
                if (errors === _errs22) {
                  if (Array.isArray(data8)) {
                    if (data8.length > 6) {
                      validate11.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                      return false;
                    } else {
                      var valid7 = true;
                      const len2 = data8.length;
                      for (let i2 = 0; i2 < len2; i2++) {
                        let data9 = data8[i2];
                        const _errs24 = errors;
                        const _errs25 = errors;
                        if (errors === _errs25) {
                          if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                            let missing3;
                            if (data9.text === void 0 && (missing3 = "text") || data9.event_ids === void 0 && (missing3 = "event_ids")) {
                              validate11.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                              return false;
                            } else {
                              const _errs27 = errors;
                              for (const key3 in data9) {
                                if (!(key3 === "text" || key3 === "event_ids")) {
                                  validate11.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" }];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs27 === errors) {
                                if (data9.text !== void 0) {
                                  let data10 = data9.text;
                                  const _errs28 = errors;
                                  if (errors === _errs28) {
                                    if (typeof data10 === "string") {
                                      if (func2(data10) > 2e3) {
                                        validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                                        return false;
                                      } else {
                                        if (func2(data10) < 1) {
                                          validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                          return false;
                                        }
                                      }
                                    } else {
                                      validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                      return false;
                                    }
                                  }
                                  var valid9 = _errs28 === errors;
                                } else {
                                  var valid9 = true;
                                }
                                if (valid9) {
                                  if (data9.event_ids !== void 0) {
                                    let data11 = data9.event_ids;
                                    const _errs30 = errors;
                                    if (errors === _errs30) {
                                      if (Array.isArray(data11)) {
                                        if (data11.length > 11) {
                                          validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                                          return false;
                                        } else {
                                          if (data11.length < 1) {
                                            validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                            return false;
                                          } else {
                                            var valid10 = true;
                                            const len3 = data11.length;
                                            for (let i3 = 0; i3 < len3; i3++) {
                                              const _errs32 = errors;
                                              if (typeof data11[i3] !== "string") {
                                                validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/event_ids/" + i3, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
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
                                        validate11.errors = [{ instancePath: instancePath + "/facts/" + i2 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                        return false;
                                      }
                                    }
                                    var valid9 = _errs30 === errors;
                                  } else {
                                    var valid9 = true;
                                  }
                                }
                              }
                            }
                          } else {
                            validate11.errors = [{ instancePath: instancePath + "/facts/" + i2, schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid7 = _errs24 === errors;
                        if (!valid7) {
                          break;
                        }
                      }
                    }
                  } else {
                    validate11.errors = [{ instancePath: instancePath + "/facts", schemaPath: "#/properties/facts/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs22 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.hypotheses !== void 0) {
                  let data13 = data.hypotheses;
                  const _errs34 = errors;
                  if (errors === _errs34) {
                    if (Array.isArray(data13)) {
                      if (data13.length > 6) {
                        validate11.errors = [{ instancePath: instancePath + "/hypotheses", schemaPath: "#/properties/hypotheses/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                        return false;
                      } else {
                        var valid11 = true;
                        const len4 = data13.length;
                        for (let i4 = 0; i4 < len4; i4++) {
                          let data14 = data13[i4];
                          const _errs36 = errors;
                          const _errs37 = errors;
                          if (errors === _errs37) {
                            if (data14 && typeof data14 == "object" && !Array.isArray(data14)) {
                              let missing4;
                              if (data14.text === void 0 && (missing4 = "text") || data14.event_ids === void 0 && (missing4 = "event_ids")) {
                                validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4, schemaPath: "#/$defs/Finding/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" }];
                                return false;
                              } else {
                                const _errs39 = errors;
                                for (const key4 in data14) {
                                  if (!(key4 === "text" || key4 === "event_ids")) {
                                    validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4, schemaPath: "#/$defs/Finding/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" }];
                                    return false;
                                    break;
                                  }
                                }
                                if (_errs39 === errors) {
                                  if (data14.text !== void 0) {
                                    let data15 = data14.text;
                                    const _errs40 = errors;
                                    if (errors === _errs40) {
                                      if (typeof data15 === "string") {
                                        if (func2(data15) > 2e3) {
                                          validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/text", schemaPath: "#/$defs/Finding/properties/text/maxLength", keyword: "maxLength", params: { limit: 2e3 }, message: "must NOT have more than 2000 characters" }];
                                          return false;
                                        } else {
                                          if (func2(data15) < 1) {
                                            validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/text", schemaPath: "#/$defs/Finding/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                            return false;
                                          }
                                        }
                                      } else {
                                        validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/text", schemaPath: "#/$defs/Finding/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                        return false;
                                      }
                                    }
                                    var valid13 = _errs40 === errors;
                                  } else {
                                    var valid13 = true;
                                  }
                                  if (valid13) {
                                    if (data14.event_ids !== void 0) {
                                      let data16 = data14.event_ids;
                                      const _errs42 = errors;
                                      if (errors === _errs42) {
                                        if (Array.isArray(data16)) {
                                          if (data16.length > 11) {
                                            validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/maxItems", keyword: "maxItems", params: { limit: 11 }, message: "must NOT have more than 11 items" }];
                                            return false;
                                          } else {
                                            if (data16.length < 1) {
                                              validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                              return false;
                                            } else {
                                              var valid14 = true;
                                              const len5 = data16.length;
                                              for (let i5 = 0; i5 < len5; i5++) {
                                                const _errs44 = errors;
                                                if (typeof data16[i5] !== "string") {
                                                  validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/event_ids/" + i5, schemaPath: "#/$defs/Finding/properties/event_ids/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                                  return false;
                                                }
                                                var valid14 = _errs44 === errors;
                                                if (!valid14) {
                                                  break;
                                                }
                                              }
                                            }
                                          }
                                        } else {
                                          validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4 + "/event_ids", schemaPath: "#/$defs/Finding/properties/event_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                                          return false;
                                        }
                                      }
                                      var valid13 = _errs42 === errors;
                                    } else {
                                      var valid13 = true;
                                    }
                                  }
                                }
                              }
                            } else {
                              validate11.errors = [{ instancePath: instancePath + "/hypotheses/" + i4, schemaPath: "#/$defs/Finding/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid11 = _errs36 === errors;
                          if (!valid11) {
                            break;
                          }
                        }
                      }
                    } else {
                      validate11.errors = [{ instancePath: instancePath + "/hypotheses", schemaPath: "#/properties/hypotheses/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs34 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.missing_evidence !== void 0) {
                    let data18 = data.missing_evidence;
                    const _errs46 = errors;
                    if (errors === _errs46) {
                      if (Array.isArray(data18)) {
                        if (data18.length > 6) {
                          validate11.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                          return false;
                        } else {
                          var valid15 = true;
                          const len6 = data18.length;
                          for (let i6 = 0; i6 < len6; i6++) {
                            const _errs48 = errors;
                            if (typeof data18[i6] !== "string") {
                              validate11.errors = [{ instancePath: instancePath + "/missing_evidence/" + i6, schemaPath: "#/properties/missing_evidence/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            var valid15 = _errs48 === errors;
                            if (!valid15) {
                              break;
                            }
                          }
                        }
                      } else {
                        validate11.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs46 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.verification_steps !== void 0) {
                      let data20 = data.verification_steps;
                      const _errs50 = errors;
                      if (errors === _errs50) {
                        if (Array.isArray(data20)) {
                          if (data20.length > 6) {
                            validate11.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/maxItems", keyword: "maxItems", params: { limit: 6 }, message: "must NOT have more than 6 items" }];
                            return false;
                          } else {
                            if (data20.length < 1) {
                              validate11.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                              return false;
                            } else {
                              var valid16 = true;
                              const len7 = data20.length;
                              for (let i7 = 0; i7 < len7; i7++) {
                                const _errs52 = errors;
                                if (typeof data20[i7] !== "string") {
                                  validate11.errors = [{ instancePath: instancePath + "/verification_steps/" + i7, schemaPath: "#/properties/verification_steps/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                                var valid16 = _errs52 === errors;
                                if (!valid16) {
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
                      var valid0 = _errs50 === errors;
                    } else {
                      var valid0 = true;
                    }
                    if (valid0) {
                      if (data.repair_prompt !== void 0) {
                        let data22 = data.repair_prompt;
                        const _errs54 = errors;
                        if (errors === _errs54) {
                          if (typeof data22 === "string") {
                            if (func2(data22) > 6e3) {
                              validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/maxLength", keyword: "maxLength", params: { limit: 6e3 }, message: "must NOT have more than 6000 characters" }];
                              return false;
                            } else {
                              if (func2(data22) < 1) {
                                validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                return false;
                              }
                            }
                          } else {
                            validate11.errors = [{ instancePath: instancePath + "/repair_prompt", schemaPath: "#/properties/repair_prompt/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                        var valid0 = _errs54 === errors;
                      } else {
                        var valid0 = true;
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
      validate11.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate11.errors = vErrors;
  return errors === 0;
}
var validateDraft = validate12;
function validate12(data, { instancePath = "", parentData, parentDataProperty, rootData = data } = {}) {
  let vErrors = null;
  let errors = 0;
  if (errors === 0) {
    if (data && typeof data == "object" && !Array.isArray(data)) {
      let missing0;
      if (data.explanation === void 0 && (missing0 = "explanation") || data.next_step === void 0 && (missing0 = "next_step") || data.quotes === void 0 && (missing0 = "quotes") || data.questions === void 0 && (missing0 = "questions") || data.missing_evidence === void 0 && (missing0 = "missing_evidence") || data.verification_steps === void 0 && (missing0 = "verification_steps")) {
        validate12.errors = [{ instancePath, schemaPath: "#/required", keyword: "required", params: { missingProperty: missing0 }, message: "must have required property '" + missing0 + "'" }];
        return false;
      } else {
        const _errs1 = errors;
        for (const key0 in data) {
          if (!(key0 === "explanation" || key0 === "next_step" || key0 === "quotes" || key0 === "questions" || key0 === "missing_evidence" || key0 === "verification_steps")) {
            validate12.errors = [{ instancePath, schemaPath: "#/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key0 }, message: "must NOT have additional properties" }];
            return false;
            break;
          }
        }
        if (_errs1 === errors) {
          if (data.explanation !== void 0) {
            let data0 = data.explanation;
            const _errs2 = errors;
            const _errs3 = errors;
            if (errors === _errs3) {
              if (data0 && typeof data0 == "object" && !Array.isArray(data0)) {
                let missing1;
                if (data0.text === void 0 && (missing1 = "text") || data0.excerpt_ids === void 0 && (missing1 = "excerpt_ids")) {
                  validate12.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Interpretation/required", keyword: "required", params: { missingProperty: missing1 }, message: "must have required property '" + missing1 + "'" }];
                  return false;
                } else {
                  const _errs5 = errors;
                  for (const key1 in data0) {
                    if (!(key1 === "text" || key1 === "excerpt_ids")) {
                      validate12.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Interpretation/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key1 }, message: "must NOT have additional properties" }];
                      return false;
                      break;
                    }
                  }
                  if (_errs5 === errors) {
                    if (data0.text !== void 0) {
                      let data1 = data0.text;
                      const _errs6 = errors;
                      if (errors === _errs6) {
                        if (typeof data1 === "string") {
                          if (func2(data1) > 900) {
                            validate12.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Interpretation/properties/text/maxLength", keyword: "maxLength", params: { limit: 900 }, message: "must NOT have more than 900 characters" }];
                            return false;
                          } else {
                            if (func2(data1) < 1) {
                              validate12.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Interpretation/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                              return false;
                            }
                          }
                        } else {
                          validate12.errors = [{ instancePath: instancePath + "/explanation/text", schemaPath: "#/$defs/Interpretation/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                          return false;
                        }
                      }
                      var valid2 = _errs6 === errors;
                    } else {
                      var valid2 = true;
                    }
                    if (valid2) {
                      if (data0.excerpt_ids !== void 0) {
                        let data2 = data0.excerpt_ids;
                        const _errs8 = errors;
                        if (errors === _errs8) {
                          if (Array.isArray(data2)) {
                            if (data2.length > 4) {
                              validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" }];
                              return false;
                            } else {
                              if (data2.length < 1) {
                                validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                return false;
                              } else {
                                var valid3 = true;
                                const len0 = data2.length;
                                for (let i0 = 0; i0 < len0; i0++) {
                                  let data3 = data2[i0];
                                  const _errs10 = errors;
                                  if (!(typeof data3 == "number" && (!(data3 % 1) && !isNaN(data3)))) {
                                    validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids/" + i0, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                    return false;
                                  }
                                  if (errors === _errs10) {
                                    if (typeof data3 == "number") {
                                      if (data3 > 1e3 || isNaN(data3)) {
                                        validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids/" + i0, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e3 }, message: "must be <= 1000" }];
                                        return false;
                                      } else {
                                        if (data3 < 1 || isNaN(data3)) {
                                          validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids/" + i0, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                          return false;
                                        }
                                      }
                                    }
                                  }
                                  var valid3 = _errs10 === errors;
                                  if (!valid3) {
                                    break;
                                  }
                                }
                              }
                            }
                          } else {
                            validate12.errors = [{ instancePath: instancePath + "/explanation/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                            return false;
                          }
                        }
                        var valid2 = _errs8 === errors;
                      } else {
                        var valid2 = true;
                      }
                    }
                  }
                }
              } else {
                validate12.errors = [{ instancePath: instancePath + "/explanation", schemaPath: "#/$defs/Interpretation/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                return false;
              }
            }
            var valid0 = _errs2 === errors;
          } else {
            var valid0 = true;
          }
          if (valid0) {
            if (data.next_step !== void 0) {
              let data4 = data.next_step;
              const _errs12 = errors;
              const _errs13 = errors;
              if (errors === _errs13) {
                if (data4 && typeof data4 == "object" && !Array.isArray(data4)) {
                  let missing2;
                  if (data4.text === void 0 && (missing2 = "text") || data4.excerpt_ids === void 0 && (missing2 = "excerpt_ids")) {
                    validate12.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Interpretation/required", keyword: "required", params: { missingProperty: missing2 }, message: "must have required property '" + missing2 + "'" }];
                    return false;
                  } else {
                    const _errs15 = errors;
                    for (const key2 in data4) {
                      if (!(key2 === "text" || key2 === "excerpt_ids")) {
                        validate12.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Interpretation/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key2 }, message: "must NOT have additional properties" }];
                        return false;
                        break;
                      }
                    }
                    if (_errs15 === errors) {
                      if (data4.text !== void 0) {
                        let data5 = data4.text;
                        const _errs16 = errors;
                        if (errors === _errs16) {
                          if (typeof data5 === "string") {
                            if (func2(data5) > 900) {
                              validate12.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Interpretation/properties/text/maxLength", keyword: "maxLength", params: { limit: 900 }, message: "must NOT have more than 900 characters" }];
                              return false;
                            } else {
                              if (func2(data5) < 1) {
                                validate12.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Interpretation/properties/text/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                return false;
                              }
                            }
                          } else {
                            validate12.errors = [{ instancePath: instancePath + "/next_step/text", schemaPath: "#/$defs/Interpretation/properties/text/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                            return false;
                          }
                        }
                        var valid5 = _errs16 === errors;
                      } else {
                        var valid5 = true;
                      }
                      if (valid5) {
                        if (data4.excerpt_ids !== void 0) {
                          let data6 = data4.excerpt_ids;
                          const _errs18 = errors;
                          if (errors === _errs18) {
                            if (Array.isArray(data6)) {
                              if (data6.length > 4) {
                                validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" }];
                                return false;
                              } else {
                                if (data6.length < 1) {
                                  validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                                  return false;
                                } else {
                                  var valid6 = true;
                                  const len1 = data6.length;
                                  for (let i1 = 0; i1 < len1; i1++) {
                                    let data7 = data6[i1];
                                    const _errs20 = errors;
                                    if (!(typeof data7 == "number" && (!(data7 % 1) && !isNaN(data7)))) {
                                      validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids/" + i1, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                      return false;
                                    }
                                    if (errors === _errs20) {
                                      if (typeof data7 == "number") {
                                        if (data7 > 1e3 || isNaN(data7)) {
                                          validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids/" + i1, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e3 }, message: "must be <= 1000" }];
                                          return false;
                                        } else {
                                          if (data7 < 1 || isNaN(data7)) {
                                            validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids/" + i1, schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/items/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                    var valid6 = _errs20 === errors;
                                    if (!valid6) {
                                      break;
                                    }
                                  }
                                }
                              }
                            } else {
                              validate12.errors = [{ instancePath: instancePath + "/next_step/excerpt_ids", schemaPath: "#/$defs/Interpretation/properties/excerpt_ids/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                              return false;
                            }
                          }
                          var valid5 = _errs18 === errors;
                        } else {
                          var valid5 = true;
                        }
                      }
                    }
                  }
                } else {
                  validate12.errors = [{ instancePath: instancePath + "/next_step", schemaPath: "#/$defs/Interpretation/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                  return false;
                }
              }
              var valid0 = _errs12 === errors;
            } else {
              var valid0 = true;
            }
            if (valid0) {
              if (data.quotes !== void 0) {
                let data8 = data.quotes;
                const _errs22 = errors;
                if (errors === _errs22) {
                  if (Array.isArray(data8)) {
                    if (data8.length > 4) {
                      validate12.errors = [{ instancePath: instancePath + "/quotes", schemaPath: "#/properties/quotes/maxItems", keyword: "maxItems", params: { limit: 4 }, message: "must NOT have more than 4 items" }];
                      return false;
                    } else {
                      var valid7 = true;
                      const len2 = data8.length;
                      for (let i2 = 0; i2 < len2; i2++) {
                        let data9 = data8[i2];
                        const _errs24 = errors;
                        const _errs25 = errors;
                        if (errors === _errs25) {
                          if (data9 && typeof data9 == "object" && !Array.isArray(data9)) {
                            let missing3;
                            if (data9.excerpt_id === void 0 && (missing3 = "excerpt_id")) {
                              validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2, schemaPath: "#/$defs/EvidenceQuote/required", keyword: "required", params: { missingProperty: missing3 }, message: "must have required property '" + missing3 + "'" }];
                              return false;
                            } else {
                              const _errs27 = errors;
                              for (const key3 in data9) {
                                if (!(key3 === "excerpt_id")) {
                                  validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2, schemaPath: "#/$defs/EvidenceQuote/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key3 }, message: "must NOT have additional properties" }];
                                  return false;
                                  break;
                                }
                              }
                              if (_errs27 === errors) {
                                if (data9.excerpt_id !== void 0) {
                                  let data10 = data9.excerpt_id;
                                  const _errs28 = errors;
                                  if (!(typeof data10 == "number" && (!(data10 % 1) && !isNaN(data10)))) {
                                    validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2 + "/excerpt_id", schemaPath: "#/$defs/EvidenceQuote/properties/excerpt_id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                    return false;
                                  }
                                  if (errors === _errs28) {
                                    if (typeof data10 == "number") {
                                      if (data10 > 1e3 || isNaN(data10)) {
                                        validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2 + "/excerpt_id", schemaPath: "#/$defs/EvidenceQuote/properties/excerpt_id/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e3 }, message: "must be <= 1000" }];
                                        return false;
                                      } else {
                                        if (data10 < 1 || isNaN(data10)) {
                                          validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2 + "/excerpt_id", schemaPath: "#/$defs/EvidenceQuote/properties/excerpt_id/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                          return false;
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          } else {
                            validate12.errors = [{ instancePath: instancePath + "/quotes/" + i2, schemaPath: "#/$defs/EvidenceQuote/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                            return false;
                          }
                        }
                        var valid7 = _errs24 === errors;
                        if (!valid7) {
                          break;
                        }
                      }
                    }
                  } else {
                    validate12.errors = [{ instancePath: instancePath + "/quotes", schemaPath: "#/properties/quotes/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                    return false;
                  }
                }
                var valid0 = _errs22 === errors;
              } else {
                var valid0 = true;
              }
              if (valid0) {
                if (data.questions !== void 0) {
                  let data11 = data.questions;
                  const _errs30 = errors;
                  if (errors === _errs30) {
                    if (Array.isArray(data11)) {
                      if (data11.length > 3) {
                        validate12.errors = [{ instancePath: instancePath + "/questions", schemaPath: "#/properties/questions/maxItems", keyword: "maxItems", params: { limit: 3 }, message: "must NOT have more than 3 items" }];
                        return false;
                      } else {
                        var valid10 = true;
                        const len3 = data11.length;
                        for (let i3 = 0; i3 < len3; i3++) {
                          let data12 = data11[i3];
                          const _errs32 = errors;
                          const _errs33 = errors;
                          if (errors === _errs33) {
                            if (data12 && typeof data12 == "object" && !Array.isArray(data12)) {
                              let missing4;
                              if (data12.excerpt_id === void 0 && (missing4 = "excerpt_id") || data12.question === void 0 && (missing4 = "question") || data12.why_unknown === void 0 && (missing4 = "why_unknown")) {
                                validate12.errors = [{ instancePath: instancePath + "/questions/" + i3, schemaPath: "#/$defs/InvestigationQuestion/required", keyword: "required", params: { missingProperty: missing4 }, message: "must have required property '" + missing4 + "'" }];
                                return false;
                              } else {
                                const _errs35 = errors;
                                for (const key4 in data12) {
                                  if (!(key4 === "excerpt_id" || key4 === "question" || key4 === "why_unknown")) {
                                    validate12.errors = [{ instancePath: instancePath + "/questions/" + i3, schemaPath: "#/$defs/InvestigationQuestion/additionalProperties", keyword: "additionalProperties", params: { additionalProperty: key4 }, message: "must NOT have additional properties" }];
                                    return false;
                                    break;
                                  }
                                }
                                if (_errs35 === errors) {
                                  if (data12.excerpt_id !== void 0) {
                                    let data13 = data12.excerpt_id;
                                    const _errs36 = errors;
                                    if (!(typeof data13 == "number" && (!(data13 % 1) && !isNaN(data13)))) {
                                      validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/excerpt_id", schemaPath: "#/$defs/InvestigationQuestion/properties/excerpt_id/type", keyword: "type", params: { type: "integer" }, message: "must be integer" }];
                                      return false;
                                    }
                                    if (errors === _errs36) {
                                      if (typeof data13 == "number") {
                                        if (data13 > 1e3 || isNaN(data13)) {
                                          validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/excerpt_id", schemaPath: "#/$defs/InvestigationQuestion/properties/excerpt_id/maximum", keyword: "maximum", params: { comparison: "<=", limit: 1e3 }, message: "must be <= 1000" }];
                                          return false;
                                        } else {
                                          if (data13 < 1 || isNaN(data13)) {
                                            validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/excerpt_id", schemaPath: "#/$defs/InvestigationQuestion/properties/excerpt_id/minimum", keyword: "minimum", params: { comparison: ">=", limit: 1 }, message: "must be >= 1" }];
                                            return false;
                                          }
                                        }
                                      }
                                    }
                                    var valid12 = _errs36 === errors;
                                  } else {
                                    var valid12 = true;
                                  }
                                  if (valid12) {
                                    if (data12.question !== void 0) {
                                      let data14 = data12.question;
                                      const _errs38 = errors;
                                      if (errors === _errs38) {
                                        if (typeof data14 === "string") {
                                          if (func2(data14) > 600) {
                                            validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/question", schemaPath: "#/$defs/InvestigationQuestion/properties/question/maxLength", keyword: "maxLength", params: { limit: 600 }, message: "must NOT have more than 600 characters" }];
                                            return false;
                                          } else {
                                            if (func2(data14) < 8) {
                                              validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/question", schemaPath: "#/$defs/InvestigationQuestion/properties/question/minLength", keyword: "minLength", params: { limit: 8 }, message: "must NOT have fewer than 8 characters" }];
                                              return false;
                                            }
                                          }
                                        } else {
                                          validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/question", schemaPath: "#/$defs/InvestigationQuestion/properties/question/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                          return false;
                                        }
                                      }
                                      var valid12 = _errs38 === errors;
                                    } else {
                                      var valid12 = true;
                                    }
                                    if (valid12) {
                                      if (data12.why_unknown !== void 0) {
                                        let data15 = data12.why_unknown;
                                        const _errs40 = errors;
                                        if (errors === _errs40) {
                                          if (typeof data15 === "string") {
                                            if (func2(data15) > 400) {
                                              validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/why_unknown", schemaPath: "#/$defs/InvestigationQuestion/properties/why_unknown/maxLength", keyword: "maxLength", params: { limit: 400 }, message: "must NOT have more than 400 characters" }];
                                              return false;
                                            } else {
                                              if (func2(data15) < 1) {
                                                validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/why_unknown", schemaPath: "#/$defs/InvestigationQuestion/properties/why_unknown/minLength", keyword: "minLength", params: { limit: 1 }, message: "must NOT have fewer than 1 characters" }];
                                                return false;
                                              }
                                            }
                                          } else {
                                            validate12.errors = [{ instancePath: instancePath + "/questions/" + i3 + "/why_unknown", schemaPath: "#/$defs/InvestigationQuestion/properties/why_unknown/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                            return false;
                                          }
                                        }
                                        var valid12 = _errs40 === errors;
                                      } else {
                                        var valid12 = true;
                                      }
                                    }
                                  }
                                }
                              }
                            } else {
                              validate12.errors = [{ instancePath: instancePath + "/questions/" + i3, schemaPath: "#/$defs/InvestigationQuestion/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
                              return false;
                            }
                          }
                          var valid10 = _errs32 === errors;
                          if (!valid10) {
                            break;
                          }
                        }
                      }
                    } else {
                      validate12.errors = [{ instancePath: instancePath + "/questions", schemaPath: "#/properties/questions/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                      return false;
                    }
                  }
                  var valid0 = _errs30 === errors;
                } else {
                  var valid0 = true;
                }
                if (valid0) {
                  if (data.missing_evidence !== void 0) {
                    let data16 = data.missing_evidence;
                    const _errs42 = errors;
                    if (errors === _errs42) {
                      if (Array.isArray(data16)) {
                        if (data16.length > 3) {
                          validate12.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/maxItems", keyword: "maxItems", params: { limit: 3 }, message: "must NOT have more than 3 items" }];
                          return false;
                        } else {
                          var valid13 = true;
                          const len4 = data16.length;
                          for (let i4 = 0; i4 < len4; i4++) {
                            const _errs44 = errors;
                            if (typeof data16[i4] !== "string") {
                              validate12.errors = [{ instancePath: instancePath + "/missing_evidence/" + i4, schemaPath: "#/properties/missing_evidence/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                              return false;
                            }
                            var valid13 = _errs44 === errors;
                            if (!valid13) {
                              break;
                            }
                          }
                        }
                      } else {
                        validate12.errors = [{ instancePath: instancePath + "/missing_evidence", schemaPath: "#/properties/missing_evidence/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                        return false;
                      }
                    }
                    var valid0 = _errs42 === errors;
                  } else {
                    var valid0 = true;
                  }
                  if (valid0) {
                    if (data.verification_steps !== void 0) {
                      let data18 = data.verification_steps;
                      const _errs46 = errors;
                      if (errors === _errs46) {
                        if (Array.isArray(data18)) {
                          if (data18.length > 3) {
                            validate12.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/maxItems", keyword: "maxItems", params: { limit: 3 }, message: "must NOT have more than 3 items" }];
                            return false;
                          } else {
                            if (data18.length < 1) {
                              validate12.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/minItems", keyword: "minItems", params: { limit: 1 }, message: "must NOT have fewer than 1 items" }];
                              return false;
                            } else {
                              var valid14 = true;
                              const len5 = data18.length;
                              for (let i5 = 0; i5 < len5; i5++) {
                                const _errs48 = errors;
                                if (typeof data18[i5] !== "string") {
                                  validate12.errors = [{ instancePath: instancePath + "/verification_steps/" + i5, schemaPath: "#/properties/verification_steps/items/type", keyword: "type", params: { type: "string" }, message: "must be string" }];
                                  return false;
                                }
                                var valid14 = _errs48 === errors;
                                if (!valid14) {
                                  break;
                                }
                              }
                            }
                          }
                        } else {
                          validate12.errors = [{ instancePath: instancePath + "/verification_steps", schemaPath: "#/properties/verification_steps/type", keyword: "type", params: { type: "array" }, message: "must be array" }];
                          return false;
                        }
                      }
                      var valid0 = _errs46 === errors;
                    } else {
                      var valid0 = true;
                    }
                  }
                }
              }
            }
          }
        }
      }
    } else {
      validate12.errors = [{ instancePath, schemaPath: "#/type", keyword: "type", params: { type: "object" }, message: "must be object" }];
      return false;
    }
  }
  validate12.errors = vErrors;
  return errors === 0;
}
export {
  validateDraft,
  validateRequest,
  validateResult
};
