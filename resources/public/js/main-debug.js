var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.string");
goog.require("goog.string.StringBuffer");
goog.require("goog.object");
goog.require("goog.array");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
void 0;
void 0;
void 0;
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
void 0;
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  if(p[goog.typeOf.call(null, x)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error("No protocol method " + proto + " defined for type " + goog.typeOf.call(null, obj) + ": " + obj)
};
cljs.core.aclone = function aclone(array_like) {
  return Array.prototype.slice.call(array_like)
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
void 0;
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__4537__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__4537 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4537__delegate.call(this, array, i, idxs)
    };
    G__4537.cljs$lang$maxFixedArity = 2;
    G__4537.cljs$lang$applyTo = function(arglist__4538) {
      var array = cljs.core.first(arglist__4538);
      var i = cljs.core.first(cljs.core.next(arglist__4538));
      var idxs = cljs.core.rest(cljs.core.next(arglist__4538));
      return G__4537__delegate(array, i, idxs)
    };
    G__4537.cljs$lang$arity$variadic = G__4537__delegate;
    return G__4537
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
void 0;
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
void 0;
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3822__auto____4539 = this$;
      if(and__3822__auto____4539) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3822__auto____4539
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____4540 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4540) {
          return or__3824__auto____4540
        }else {
          var or__3824__auto____4541 = cljs.core._invoke["_"];
          if(or__3824__auto____4541) {
            return or__3824__auto____4541
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3822__auto____4542 = this$;
      if(and__3822__auto____4542) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3822__auto____4542
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      return function() {
        var or__3824__auto____4543 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4543) {
          return or__3824__auto____4543
        }else {
          var or__3824__auto____4544 = cljs.core._invoke["_"];
          if(or__3824__auto____4544) {
            return or__3824__auto____4544
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3822__auto____4545 = this$;
      if(and__3822__auto____4545) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3822__auto____4545
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      return function() {
        var or__3824__auto____4546 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4546) {
          return or__3824__auto____4546
        }else {
          var or__3824__auto____4547 = cljs.core._invoke["_"];
          if(or__3824__auto____4547) {
            return or__3824__auto____4547
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3822__auto____4548 = this$;
      if(and__3822__auto____4548) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3822__auto____4548
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      return function() {
        var or__3824__auto____4549 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4549) {
          return or__3824__auto____4549
        }else {
          var or__3824__auto____4550 = cljs.core._invoke["_"];
          if(or__3824__auto____4550) {
            return or__3824__auto____4550
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3822__auto____4551 = this$;
      if(and__3822__auto____4551) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3822__auto____4551
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      return function() {
        var or__3824__auto____4552 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4552) {
          return or__3824__auto____4552
        }else {
          var or__3824__auto____4553 = cljs.core._invoke["_"];
          if(or__3824__auto____4553) {
            return or__3824__auto____4553
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3822__auto____4554 = this$;
      if(and__3822__auto____4554) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3822__auto____4554
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      return function() {
        var or__3824__auto____4555 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4555) {
          return or__3824__auto____4555
        }else {
          var or__3824__auto____4556 = cljs.core._invoke["_"];
          if(or__3824__auto____4556) {
            return or__3824__auto____4556
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3822__auto____4557 = this$;
      if(and__3822__auto____4557) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3822__auto____4557
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      return function() {
        var or__3824__auto____4558 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4558) {
          return or__3824__auto____4558
        }else {
          var or__3824__auto____4559 = cljs.core._invoke["_"];
          if(or__3824__auto____4559) {
            return or__3824__auto____4559
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3822__auto____4560 = this$;
      if(and__3822__auto____4560) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3822__auto____4560
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      return function() {
        var or__3824__auto____4561 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4561) {
          return or__3824__auto____4561
        }else {
          var or__3824__auto____4562 = cljs.core._invoke["_"];
          if(or__3824__auto____4562) {
            return or__3824__auto____4562
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3822__auto____4563 = this$;
      if(and__3822__auto____4563) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3822__auto____4563
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      return function() {
        var or__3824__auto____4564 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4564) {
          return or__3824__auto____4564
        }else {
          var or__3824__auto____4565 = cljs.core._invoke["_"];
          if(or__3824__auto____4565) {
            return or__3824__auto____4565
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3822__auto____4566 = this$;
      if(and__3822__auto____4566) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3822__auto____4566
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      return function() {
        var or__3824__auto____4567 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4567) {
          return or__3824__auto____4567
        }else {
          var or__3824__auto____4568 = cljs.core._invoke["_"];
          if(or__3824__auto____4568) {
            return or__3824__auto____4568
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3822__auto____4569 = this$;
      if(and__3822__auto____4569) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3822__auto____4569
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      return function() {
        var or__3824__auto____4570 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4570) {
          return or__3824__auto____4570
        }else {
          var or__3824__auto____4571 = cljs.core._invoke["_"];
          if(or__3824__auto____4571) {
            return or__3824__auto____4571
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3822__auto____4572 = this$;
      if(and__3822__auto____4572) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3822__auto____4572
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      return function() {
        var or__3824__auto____4573 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4573) {
          return or__3824__auto____4573
        }else {
          var or__3824__auto____4574 = cljs.core._invoke["_"];
          if(or__3824__auto____4574) {
            return or__3824__auto____4574
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3822__auto____4575 = this$;
      if(and__3822__auto____4575) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3822__auto____4575
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      return function() {
        var or__3824__auto____4576 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4576) {
          return or__3824__auto____4576
        }else {
          var or__3824__auto____4577 = cljs.core._invoke["_"];
          if(or__3824__auto____4577) {
            return or__3824__auto____4577
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3822__auto____4578 = this$;
      if(and__3822__auto____4578) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3822__auto____4578
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      return function() {
        var or__3824__auto____4579 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4579) {
          return or__3824__auto____4579
        }else {
          var or__3824__auto____4580 = cljs.core._invoke["_"];
          if(or__3824__auto____4580) {
            return or__3824__auto____4580
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3822__auto____4581 = this$;
      if(and__3822__auto____4581) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3822__auto____4581
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      return function() {
        var or__3824__auto____4582 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4582) {
          return or__3824__auto____4582
        }else {
          var or__3824__auto____4583 = cljs.core._invoke["_"];
          if(or__3824__auto____4583) {
            return or__3824__auto____4583
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3822__auto____4584 = this$;
      if(and__3822__auto____4584) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3822__auto____4584
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      return function() {
        var or__3824__auto____4585 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4585) {
          return or__3824__auto____4585
        }else {
          var or__3824__auto____4586 = cljs.core._invoke["_"];
          if(or__3824__auto____4586) {
            return or__3824__auto____4586
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3822__auto____4587 = this$;
      if(and__3822__auto____4587) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3822__auto____4587
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      return function() {
        var or__3824__auto____4588 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4588) {
          return or__3824__auto____4588
        }else {
          var or__3824__auto____4589 = cljs.core._invoke["_"];
          if(or__3824__auto____4589) {
            return or__3824__auto____4589
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3822__auto____4590 = this$;
      if(and__3822__auto____4590) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3822__auto____4590
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      return function() {
        var or__3824__auto____4591 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4591) {
          return or__3824__auto____4591
        }else {
          var or__3824__auto____4592 = cljs.core._invoke["_"];
          if(or__3824__auto____4592) {
            return or__3824__auto____4592
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3822__auto____4593 = this$;
      if(and__3822__auto____4593) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3822__auto____4593
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      return function() {
        var or__3824__auto____4594 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4594) {
          return or__3824__auto____4594
        }else {
          var or__3824__auto____4595 = cljs.core._invoke["_"];
          if(or__3824__auto____4595) {
            return or__3824__auto____4595
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3822__auto____4596 = this$;
      if(and__3822__auto____4596) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3822__auto____4596
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      return function() {
        var or__3824__auto____4597 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4597) {
          return or__3824__auto____4597
        }else {
          var or__3824__auto____4598 = cljs.core._invoke["_"];
          if(or__3824__auto____4598) {
            return or__3824__auto____4598
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3822__auto____4599 = this$;
      if(and__3822__auto____4599) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3822__auto____4599
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      return function() {
        var or__3824__auto____4600 = cljs.core._invoke[goog.typeOf.call(null, this$)];
        if(or__3824__auto____4600) {
          return or__3824__auto____4600
        }else {
          var or__3824__auto____4601 = cljs.core._invoke["_"];
          if(or__3824__auto____4601) {
            return or__3824__auto____4601
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
void 0;
void 0;
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3822__auto____4602 = coll;
    if(and__3822__auto____4602) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3822__auto____4602
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4603 = cljs.core._count[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4603) {
        return or__3824__auto____4603
      }else {
        var or__3824__auto____4604 = cljs.core._count["_"];
        if(or__3824__auto____4604) {
          return or__3824__auto____4604
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3822__auto____4605 = coll;
    if(and__3822__auto____4605) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3822__auto____4605
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4606 = cljs.core._empty[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4606) {
        return or__3824__auto____4606
      }else {
        var or__3824__auto____4607 = cljs.core._empty["_"];
        if(or__3824__auto____4607) {
          return or__3824__auto____4607
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3822__auto____4608 = coll;
    if(and__3822__auto____4608) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3822__auto____4608
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    return function() {
      var or__3824__auto____4609 = cljs.core._conj[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4609) {
        return or__3824__auto____4609
      }else {
        var or__3824__auto____4610 = cljs.core._conj["_"];
        if(or__3824__auto____4610) {
          return or__3824__auto____4610
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
void 0;
void 0;
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3822__auto____4611 = coll;
      if(and__3822__auto____4611) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3822__auto____4611
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      return function() {
        var or__3824__auto____4612 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4612) {
          return or__3824__auto____4612
        }else {
          var or__3824__auto____4613 = cljs.core._nth["_"];
          if(or__3824__auto____4613) {
            return or__3824__auto____4613
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3822__auto____4614 = coll;
      if(and__3822__auto____4614) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3822__auto____4614
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      return function() {
        var or__3824__auto____4615 = cljs.core._nth[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4615) {
          return or__3824__auto____4615
        }else {
          var or__3824__auto____4616 = cljs.core._nth["_"];
          if(or__3824__auto____4616) {
            return or__3824__auto____4616
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
void 0;
void 0;
cljs.core.ASeq = {};
void 0;
void 0;
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3822__auto____4617 = coll;
    if(and__3822__auto____4617) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3822__auto____4617
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4618 = cljs.core._first[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4618) {
        return or__3824__auto____4618
      }else {
        var or__3824__auto____4619 = cljs.core._first["_"];
        if(or__3824__auto____4619) {
          return or__3824__auto____4619
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3822__auto____4620 = coll;
    if(and__3822__auto____4620) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3822__auto____4620
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4621 = cljs.core._rest[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4621) {
        return or__3824__auto____4621
      }else {
        var or__3824__auto____4622 = cljs.core._rest["_"];
        if(or__3824__auto____4622) {
          return or__3824__auto____4622
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3822__auto____4623 = o;
      if(and__3822__auto____4623) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3822__auto____4623
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      return function() {
        var or__3824__auto____4624 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4624) {
          return or__3824__auto____4624
        }else {
          var or__3824__auto____4625 = cljs.core._lookup["_"];
          if(or__3824__auto____4625) {
            return or__3824__auto____4625
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3822__auto____4626 = o;
      if(and__3822__auto____4626) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3822__auto____4626
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      return function() {
        var or__3824__auto____4627 = cljs.core._lookup[goog.typeOf.call(null, o)];
        if(or__3824__auto____4627) {
          return or__3824__auto____4627
        }else {
          var or__3824__auto____4628 = cljs.core._lookup["_"];
          if(or__3824__auto____4628) {
            return or__3824__auto____4628
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
void 0;
void 0;
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3822__auto____4629 = coll;
    if(and__3822__auto____4629) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3822__auto____4629
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4630 = cljs.core._contains_key_QMARK_[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4630) {
        return or__3824__auto____4630
      }else {
        var or__3824__auto____4631 = cljs.core._contains_key_QMARK_["_"];
        if(or__3824__auto____4631) {
          return or__3824__auto____4631
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3822__auto____4632 = coll;
    if(and__3822__auto____4632) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3822__auto____4632
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    return function() {
      var or__3824__auto____4633 = cljs.core._assoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4633) {
        return or__3824__auto____4633
      }else {
        var or__3824__auto____4634 = cljs.core._assoc["_"];
        if(or__3824__auto____4634) {
          return or__3824__auto____4634
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
void 0;
void 0;
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3822__auto____4635 = coll;
    if(and__3822__auto____4635) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3822__auto____4635
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    return function() {
      var or__3824__auto____4636 = cljs.core._dissoc[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4636) {
        return or__3824__auto____4636
      }else {
        var or__3824__auto____4637 = cljs.core._dissoc["_"];
        if(or__3824__auto____4637) {
          return or__3824__auto____4637
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
void 0;
void 0;
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3822__auto____4638 = coll;
    if(and__3822__auto____4638) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3822__auto____4638
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4639 = cljs.core._key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4639) {
        return or__3824__auto____4639
      }else {
        var or__3824__auto____4640 = cljs.core._key["_"];
        if(or__3824__auto____4640) {
          return or__3824__auto____4640
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3822__auto____4641 = coll;
    if(and__3822__auto____4641) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3822__auto____4641
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4642 = cljs.core._val[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4642) {
        return or__3824__auto____4642
      }else {
        var or__3824__auto____4643 = cljs.core._val["_"];
        if(or__3824__auto____4643) {
          return or__3824__auto____4643
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3822__auto____4644 = coll;
    if(and__3822__auto____4644) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3822__auto____4644
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    return function() {
      var or__3824__auto____4645 = cljs.core._disjoin[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4645) {
        return or__3824__auto____4645
      }else {
        var or__3824__auto____4646 = cljs.core._disjoin["_"];
        if(or__3824__auto____4646) {
          return or__3824__auto____4646
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
void 0;
void 0;
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3822__auto____4647 = coll;
    if(and__3822__auto____4647) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3822__auto____4647
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4648 = cljs.core._peek[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4648) {
        return or__3824__auto____4648
      }else {
        var or__3824__auto____4649 = cljs.core._peek["_"];
        if(or__3824__auto____4649) {
          return or__3824__auto____4649
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3822__auto____4650 = coll;
    if(and__3822__auto____4650) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3822__auto____4650
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4651 = cljs.core._pop[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4651) {
        return or__3824__auto____4651
      }else {
        var or__3824__auto____4652 = cljs.core._pop["_"];
        if(or__3824__auto____4652) {
          return or__3824__auto____4652
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3822__auto____4653 = coll;
    if(and__3822__auto____4653) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3822__auto____4653
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    return function() {
      var or__3824__auto____4654 = cljs.core._assoc_n[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4654) {
        return or__3824__auto____4654
      }else {
        var or__3824__auto____4655 = cljs.core._assoc_n["_"];
        if(or__3824__auto____4655) {
          return or__3824__auto____4655
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
void 0;
void 0;
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3822__auto____4656 = o;
    if(and__3822__auto____4656) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3822__auto____4656
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4657 = cljs.core._deref[goog.typeOf.call(null, o)];
      if(or__3824__auto____4657) {
        return or__3824__auto____4657
      }else {
        var or__3824__auto____4658 = cljs.core._deref["_"];
        if(or__3824__auto____4658) {
          return or__3824__auto____4658
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3822__auto____4659 = o;
    if(and__3822__auto____4659) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3822__auto____4659
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    return function() {
      var or__3824__auto____4660 = cljs.core._deref_with_timeout[goog.typeOf.call(null, o)];
      if(or__3824__auto____4660) {
        return or__3824__auto____4660
      }else {
        var or__3824__auto____4661 = cljs.core._deref_with_timeout["_"];
        if(or__3824__auto____4661) {
          return or__3824__auto____4661
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
void 0;
void 0;
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3822__auto____4662 = o;
    if(and__3822__auto____4662) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3822__auto____4662
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4663 = cljs.core._meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4663) {
        return or__3824__auto____4663
      }else {
        var or__3824__auto____4664 = cljs.core._meta["_"];
        if(or__3824__auto____4664) {
          return or__3824__auto____4664
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3822__auto____4665 = o;
    if(and__3822__auto____4665) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3822__auto____4665
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    return function() {
      var or__3824__auto____4666 = cljs.core._with_meta[goog.typeOf.call(null, o)];
      if(or__3824__auto____4666) {
        return or__3824__auto____4666
      }else {
        var or__3824__auto____4667 = cljs.core._with_meta["_"];
        if(or__3824__auto____4667) {
          return or__3824__auto____4667
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
void 0;
void 0;
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3822__auto____4668 = coll;
      if(and__3822__auto____4668) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3822__auto____4668
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      return function() {
        var or__3824__auto____4669 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4669) {
          return or__3824__auto____4669
        }else {
          var or__3824__auto____4670 = cljs.core._reduce["_"];
          if(or__3824__auto____4670) {
            return or__3824__auto____4670
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3822__auto____4671 = coll;
      if(and__3822__auto____4671) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3822__auto____4671
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      return function() {
        var or__3824__auto____4672 = cljs.core._reduce[goog.typeOf.call(null, coll)];
        if(or__3824__auto____4672) {
          return or__3824__auto____4672
        }else {
          var or__3824__auto____4673 = cljs.core._reduce["_"];
          if(or__3824__auto____4673) {
            return or__3824__auto____4673
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
void 0;
void 0;
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3822__auto____4674 = coll;
    if(and__3822__auto____4674) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3822__auto____4674
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    return function() {
      var or__3824__auto____4675 = cljs.core._kv_reduce[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4675) {
        return or__3824__auto____4675
      }else {
        var or__3824__auto____4676 = cljs.core._kv_reduce["_"];
        if(or__3824__auto____4676) {
          return or__3824__auto____4676
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
void 0;
void 0;
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3822__auto____4677 = o;
    if(and__3822__auto____4677) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3822__auto____4677
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    return function() {
      var or__3824__auto____4678 = cljs.core._equiv[goog.typeOf.call(null, o)];
      if(or__3824__auto____4678) {
        return or__3824__auto____4678
      }else {
        var or__3824__auto____4679 = cljs.core._equiv["_"];
        if(or__3824__auto____4679) {
          return or__3824__auto____4679
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
void 0;
void 0;
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3822__auto____4680 = o;
    if(and__3822__auto____4680) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3822__auto____4680
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4681 = cljs.core._hash[goog.typeOf.call(null, o)];
      if(or__3824__auto____4681) {
        return or__3824__auto____4681
      }else {
        var or__3824__auto____4682 = cljs.core._hash["_"];
        if(or__3824__auto____4682) {
          return or__3824__auto____4682
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3822__auto____4683 = o;
    if(and__3822__auto____4683) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3822__auto____4683
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    return function() {
      var or__3824__auto____4684 = cljs.core._seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4684) {
        return or__3824__auto____4684
      }else {
        var or__3824__auto____4685 = cljs.core._seq["_"];
        if(or__3824__auto____4685) {
          return or__3824__auto____4685
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
void 0;
void 0;
cljs.core.ISequential = {};
void 0;
void 0;
cljs.core.IList = {};
void 0;
void 0;
cljs.core.IRecord = {};
void 0;
void 0;
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3822__auto____4686 = coll;
    if(and__3822__auto____4686) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3822__auto____4686
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4687 = cljs.core._rseq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4687) {
        return or__3824__auto____4687
      }else {
        var or__3824__auto____4688 = cljs.core._rseq["_"];
        if(or__3824__auto____4688) {
          return or__3824__auto____4688
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4689 = coll;
    if(and__3822__auto____4689) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3822__auto____4689
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4690 = cljs.core._sorted_seq[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4690) {
        return or__3824__auto____4690
      }else {
        var or__3824__auto____4691 = cljs.core._sorted_seq["_"];
        if(or__3824__auto____4691) {
          return or__3824__auto____4691
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3822__auto____4692 = coll;
    if(and__3822__auto____4692) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3822__auto____4692
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    return function() {
      var or__3824__auto____4693 = cljs.core._sorted_seq_from[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4693) {
        return or__3824__auto____4693
      }else {
        var or__3824__auto____4694 = cljs.core._sorted_seq_from["_"];
        if(or__3824__auto____4694) {
          return or__3824__auto____4694
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3822__auto____4695 = coll;
    if(and__3822__auto____4695) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3822__auto____4695
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    return function() {
      var or__3824__auto____4696 = cljs.core._entry_key[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4696) {
        return or__3824__auto____4696
      }else {
        var or__3824__auto____4697 = cljs.core._entry_key["_"];
        if(or__3824__auto____4697) {
          return or__3824__auto____4697
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3822__auto____4698 = coll;
    if(and__3822__auto____4698) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3822__auto____4698
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4699 = cljs.core._comparator[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4699) {
        return or__3824__auto____4699
      }else {
        var or__3824__auto____4700 = cljs.core._comparator["_"];
        if(or__3824__auto____4700) {
          return or__3824__auto____4700
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3822__auto____4701 = o;
    if(and__3822__auto____4701) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3822__auto____4701
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    return function() {
      var or__3824__auto____4702 = cljs.core._pr_seq[goog.typeOf.call(null, o)];
      if(or__3824__auto____4702) {
        return or__3824__auto____4702
      }else {
        var or__3824__auto____4703 = cljs.core._pr_seq["_"];
        if(or__3824__auto____4703) {
          return or__3824__auto____4703
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
void 0;
void 0;
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3822__auto____4704 = d;
    if(and__3822__auto____4704) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3822__auto____4704
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    return function() {
      var or__3824__auto____4705 = cljs.core._realized_QMARK_[goog.typeOf.call(null, d)];
      if(or__3824__auto____4705) {
        return or__3824__auto____4705
      }else {
        var or__3824__auto____4706 = cljs.core._realized_QMARK_["_"];
        if(or__3824__auto____4706) {
          return or__3824__auto____4706
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
void 0;
void 0;
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3822__auto____4707 = this$;
    if(and__3822__auto____4707) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3822__auto____4707
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    return function() {
      var or__3824__auto____4708 = cljs.core._notify_watches[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4708) {
        return or__3824__auto____4708
      }else {
        var or__3824__auto____4709 = cljs.core._notify_watches["_"];
        if(or__3824__auto____4709) {
          return or__3824__auto____4709
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3822__auto____4710 = this$;
    if(and__3822__auto____4710) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3822__auto____4710
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    return function() {
      var or__3824__auto____4711 = cljs.core._add_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4711) {
        return or__3824__auto____4711
      }else {
        var or__3824__auto____4712 = cljs.core._add_watch["_"];
        if(or__3824__auto____4712) {
          return or__3824__auto____4712
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3822__auto____4713 = this$;
    if(and__3822__auto____4713) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3822__auto____4713
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    return function() {
      var or__3824__auto____4714 = cljs.core._remove_watch[goog.typeOf.call(null, this$)];
      if(or__3824__auto____4714) {
        return or__3824__auto____4714
      }else {
        var or__3824__auto____4715 = cljs.core._remove_watch["_"];
        if(or__3824__auto____4715) {
          return or__3824__auto____4715
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
void 0;
void 0;
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3822__auto____4716 = coll;
    if(and__3822__auto____4716) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3822__auto____4716
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    return function() {
      var or__3824__auto____4717 = cljs.core._as_transient[goog.typeOf.call(null, coll)];
      if(or__3824__auto____4717) {
        return or__3824__auto____4717
      }else {
        var or__3824__auto____4718 = cljs.core._as_transient["_"];
        if(or__3824__auto____4718) {
          return or__3824__auto____4718
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
void 0;
void 0;
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3822__auto____4719 = tcoll;
    if(and__3822__auto____4719) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3822__auto____4719
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    return function() {
      var or__3824__auto____4720 = cljs.core._conj_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4720) {
        return or__3824__auto____4720
      }else {
        var or__3824__auto____4721 = cljs.core._conj_BANG_["_"];
        if(or__3824__auto____4721) {
          return or__3824__auto____4721
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4722 = tcoll;
    if(and__3822__auto____4722) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3822__auto____4722
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4723 = cljs.core._persistent_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4723) {
        return or__3824__auto____4723
      }else {
        var or__3824__auto____4724 = cljs.core._persistent_BANG_["_"];
        if(or__3824__auto____4724) {
          return or__3824__auto____4724
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3822__auto____4725 = tcoll;
    if(and__3822__auto____4725) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3822__auto____4725
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    return function() {
      var or__3824__auto____4726 = cljs.core._assoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4726) {
        return or__3824__auto____4726
      }else {
        var or__3824__auto____4727 = cljs.core._assoc_BANG_["_"];
        if(or__3824__auto____4727) {
          return or__3824__auto____4727
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
void 0;
void 0;
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3822__auto____4728 = tcoll;
    if(and__3822__auto____4728) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3822__auto____4728
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    return function() {
      var or__3824__auto____4729 = cljs.core._dissoc_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4729) {
        return or__3824__auto____4729
      }else {
        var or__3824__auto____4730 = cljs.core._dissoc_BANG_["_"];
        if(or__3824__auto____4730) {
          return or__3824__auto____4730
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
void 0;
void 0;
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3822__auto____4731 = tcoll;
    if(and__3822__auto____4731) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3822__auto____4731
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    return function() {
      var or__3824__auto____4732 = cljs.core._assoc_n_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4732) {
        return or__3824__auto____4732
      }else {
        var or__3824__auto____4733 = cljs.core._assoc_n_BANG_["_"];
        if(or__3824__auto____4733) {
          return or__3824__auto____4733
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3822__auto____4734 = tcoll;
    if(and__3822__auto____4734) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3822__auto____4734
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    return function() {
      var or__3824__auto____4735 = cljs.core._pop_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4735) {
        return or__3824__auto____4735
      }else {
        var or__3824__auto____4736 = cljs.core._pop_BANG_["_"];
        if(or__3824__auto____4736) {
          return or__3824__auto____4736
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
void 0;
void 0;
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3822__auto____4737 = tcoll;
    if(and__3822__auto____4737) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3822__auto____4737
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    return function() {
      var or__3824__auto____4738 = cljs.core._disjoin_BANG_[goog.typeOf.call(null, tcoll)];
      if(or__3824__auto____4738) {
        return or__3824__auto____4738
      }else {
        var or__3824__auto____4739 = cljs.core._disjoin_BANG_["_"];
        if(or__3824__auto____4739) {
          return or__3824__auto____4739
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
void 0;
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
void 0;
void 0;
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3824__auto____4740 = x === y;
    if(or__3824__auto____4740) {
      return or__3824__auto____4740
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__4741__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4742 = y;
            var G__4743 = cljs.core.first.call(null, more);
            var G__4744 = cljs.core.next.call(null, more);
            x = G__4742;
            y = G__4743;
            more = G__4744;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4741 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4741__delegate.call(this, x, y, more)
    };
    G__4741.cljs$lang$maxFixedArity = 2;
    G__4741.cljs$lang$applyTo = function(arglist__4745) {
      var x = cljs.core.first(arglist__4745);
      var y = cljs.core.first(cljs.core.next(arglist__4745));
      var more = cljs.core.rest(cljs.core.next(arglist__4745));
      return G__4741__delegate(x, y, more)
    };
    G__4741.cljs$lang$arity$variadic = G__4741__delegate;
    return G__4741
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(function() {
    var or__3824__auto____4746 = x == null;
    if(or__3824__auto____4746) {
      return or__3824__auto____4746
    }else {
      return void 0 === x
    }
  }()) {
    return null
  }else {
    return x.constructor
  }
};
void 0;
void 0;
void 0;
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__4747 = null;
  var G__4747__2 = function(o, k) {
    return null
  };
  var G__4747__3 = function(o, k, not_found) {
    return not_found
  };
  G__4747 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4747__2.call(this, o, k);
      case 3:
        return G__4747__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4747
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__4748 = null;
  var G__4748__2 = function(_, f) {
    return f.call(null)
  };
  var G__4748__3 = function(_, f, start) {
    return start
  };
  G__4748 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4748__2.call(this, _, f);
      case 3:
        return G__4748__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4748
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__4749 = null;
  var G__4749__2 = function(_, n) {
    return null
  };
  var G__4749__3 = function(_, n, not_found) {
    return not_found
  };
  G__4749 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4749__2.call(this, _, n);
      case 3:
        return G__4749__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4749
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  return o.toString() === other.toString()
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  return o === true ? 1 : 0
};
cljs.core.IHash["function"] = true;
cljs.core._hash["function"] = function(o) {
  return goog.getUid.call(null, o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
void 0;
void 0;
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    if(cljs.core._count.call(null, cicoll) === 0) {
      return f.call(null)
    }else {
      var val__4750 = cljs.core._nth.call(null, cicoll, 0);
      var n__4751 = 1;
      while(true) {
        if(n__4751 < cljs.core._count.call(null, cicoll)) {
          var nval__4752 = f.call(null, val__4750, cljs.core._nth.call(null, cicoll, n__4751));
          if(cljs.core.reduced_QMARK_.call(null, nval__4752)) {
            return cljs.core.deref.call(null, nval__4752)
          }else {
            var G__4759 = nval__4752;
            var G__4760 = n__4751 + 1;
            val__4750 = G__4759;
            n__4751 = G__4760;
            continue
          }
        }else {
          return val__4750
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var val__4753 = val;
    var n__4754 = 0;
    while(true) {
      if(n__4754 < cljs.core._count.call(null, cicoll)) {
        var nval__4755 = f.call(null, val__4753, cljs.core._nth.call(null, cicoll, n__4754));
        if(cljs.core.reduced_QMARK_.call(null, nval__4755)) {
          return cljs.core.deref.call(null, nval__4755)
        }else {
          var G__4761 = nval__4755;
          var G__4762 = n__4754 + 1;
          val__4753 = G__4761;
          n__4754 = G__4762;
          continue
        }
      }else {
        return val__4753
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var val__4756 = val;
    var n__4757 = idx;
    while(true) {
      if(n__4757 < cljs.core._count.call(null, cicoll)) {
        var nval__4758 = f.call(null, val__4756, cljs.core._nth.call(null, cicoll, n__4757));
        if(cljs.core.reduced_QMARK_.call(null, nval__4758)) {
          return cljs.core.deref.call(null, nval__4758)
        }else {
          var G__4763 = nval__4758;
          var G__4764 = n__4757 + 1;
          val__4756 = G__4763;
          n__4757 = G__4764;
          continue
        }
      }else {
        return val__4756
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
void 0;
void 0;
void 0;
void 0;
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15990906
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__4765 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__4766 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$ASeq$ = true;
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__4767 = this;
  var this$__4768 = this;
  return cljs.core.pr_str.call(null, this$__4768)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__4769 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4769.a)) {
    return cljs.core.ci_reduce.call(null, this__4769.a, f, this__4769.a[this__4769.i], this__4769.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__4769.a[this__4769.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__4770 = this;
  if(cljs.core.counted_QMARK_.call(null, this__4770.a)) {
    return cljs.core.ci_reduce.call(null, this__4770.a, f, start, this__4770.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__4771 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__4772 = this;
  return this__4772.a.length - this__4772.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__4773 = this;
  return this__4773.a[this__4773.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__4774 = this;
  if(this__4774.i + 1 < this__4774.a.length) {
    return new cljs.core.IndexedSeq(this__4774.a, this__4774.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__4775 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__4776 = this;
  var i__4777 = n + this__4776.i;
  if(i__4777 < this__4776.a.length) {
    return this__4776.a[i__4777]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__4778 = this;
  var i__4779 = n + this__4778.i;
  if(i__4779 < this__4778.a.length) {
    return this__4778.a[i__4779]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__4780 = null;
  var G__4780__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__4780__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__4780 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__4780__2.call(this, array, f);
      case 3:
        return G__4780__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4780
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__4781 = null;
  var G__4781__2 = function(array, k) {
    return array[k]
  };
  var G__4781__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__4781 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4781__2.call(this, array, k);
      case 3:
        return G__4781__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4781
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__4782 = null;
  var G__4782__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__4782__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__4782 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__4782__2.call(this, array, n);
      case 3:
        return G__4782__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__4782
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.seq = function seq(coll) {
  if(coll != null) {
    if(function() {
      var G__4783__4784 = coll;
      if(G__4783__4784 != null) {
        if(function() {
          var or__3824__auto____4785 = G__4783__4784.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3824__auto____4785) {
            return or__3824__auto____4785
          }else {
            return G__4783__4784.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__4783__4784.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4783__4784)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4783__4784)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }else {
    return null
  }
};
cljs.core.first = function first(coll) {
  if(coll != null) {
    if(function() {
      var G__4786__4787 = coll;
      if(G__4786__4787 != null) {
        if(function() {
          var or__3824__auto____4788 = G__4786__4787.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4788) {
            return or__3824__auto____4788
          }else {
            return G__4786__4787.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4786__4787.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4786__4787)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4786__4787)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__4789 = cljs.core.seq.call(null, coll);
      if(s__4789 != null) {
        return cljs.core._first.call(null, s__4789)
      }else {
        return null
      }
    }
  }else {
    return null
  }
};
cljs.core.rest = function rest(coll) {
  if(coll != null) {
    if(function() {
      var G__4790__4791 = coll;
      if(G__4790__4791 != null) {
        if(function() {
          var or__3824__auto____4792 = G__4790__4791.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4792) {
            return or__3824__auto____4792
          }else {
            return G__4790__4791.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4790__4791.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4790__4791)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4790__4791)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__4793 = cljs.core.seq.call(null, coll);
      if(s__4793 != null) {
        return cljs.core._rest.call(null, s__4793)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll != null) {
    if(function() {
      var G__4794__4795 = coll;
      if(G__4794__4795 != null) {
        if(function() {
          var or__3824__auto____4796 = G__4794__4795.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____4796) {
            return or__3824__auto____4796
          }else {
            return G__4794__4795.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__4794__4795.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4794__4795)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4794__4795)
      }
    }()) {
      var coll__4797 = cljs.core._rest.call(null, coll);
      if(coll__4797 != null) {
        if(function() {
          var G__4798__4799 = coll__4797;
          if(G__4798__4799 != null) {
            if(function() {
              var or__3824__auto____4800 = G__4798__4799.cljs$lang$protocol_mask$partition0$ & 32;
              if(or__3824__auto____4800) {
                return or__3824__auto____4800
              }else {
                return G__4798__4799.cljs$core$ASeq$
              }
            }()) {
              return true
            }else {
              if(!G__4798__4799.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4798__4799)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__4798__4799)
          }
        }()) {
          return coll__4797
        }else {
          return cljs.core._seq.call(null, coll__4797)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }else {
    return null
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s))) {
      var G__4801 = cljs.core.next.call(null, s);
      s = G__4801;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__4802__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__4803 = conj.call(null, coll, x);
          var G__4804 = cljs.core.first.call(null, xs);
          var G__4805 = cljs.core.next.call(null, xs);
          coll = G__4803;
          x = G__4804;
          xs = G__4805;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__4802 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4802__delegate.call(this, coll, x, xs)
    };
    G__4802.cljs$lang$maxFixedArity = 2;
    G__4802.cljs$lang$applyTo = function(arglist__4806) {
      var coll = cljs.core.first(arglist__4806);
      var x = cljs.core.first(cljs.core.next(arglist__4806));
      var xs = cljs.core.rest(cljs.core.next(arglist__4806));
      return G__4802__delegate(coll, x, xs)
    };
    G__4802.cljs$lang$arity$variadic = G__4802__delegate;
    return G__4802
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
void 0;
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__4807 = cljs.core.seq.call(null, coll);
  var acc__4808 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__4807)) {
      return acc__4808 + cljs.core._count.call(null, s__4807)
    }else {
      var G__4809 = cljs.core.next.call(null, s__4807);
      var G__4810 = acc__4808 + 1;
      s__4807 = G__4809;
      acc__4808 = G__4810;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
void 0;
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll != null) {
      if(function() {
        var G__4811__4812 = coll;
        if(G__4811__4812 != null) {
          if(function() {
            var or__3824__auto____4813 = G__4811__4812.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4813) {
              return or__3824__auto____4813
            }else {
              return G__4811__4812.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4811__4812.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4811__4812)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4811__4812)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }else {
      return null
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(coll != null) {
      if(function() {
        var G__4814__4815 = coll;
        if(G__4814__4815 != null) {
          if(function() {
            var or__3824__auto____4816 = G__4814__4815.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3824__auto____4816) {
              return or__3824__auto____4816
            }else {
              return G__4814__4815.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__4814__4815.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4814__4815)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4814__4815)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__4818__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__4817 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__4819 = ret__4817;
          var G__4820 = cljs.core.first.call(null, kvs);
          var G__4821 = cljs.core.second.call(null, kvs);
          var G__4822 = cljs.core.nnext.call(null, kvs);
          coll = G__4819;
          k = G__4820;
          v = G__4821;
          kvs = G__4822;
          continue
        }else {
          return ret__4817
        }
        break
      }
    };
    var G__4818 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__4818__delegate.call(this, coll, k, v, kvs)
    };
    G__4818.cljs$lang$maxFixedArity = 3;
    G__4818.cljs$lang$applyTo = function(arglist__4823) {
      var coll = cljs.core.first(arglist__4823);
      var k = cljs.core.first(cljs.core.next(arglist__4823));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__4823)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__4823)));
      return G__4818__delegate(coll, k, v, kvs)
    };
    G__4818.cljs$lang$arity$variadic = G__4818__delegate;
    return G__4818
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__4825__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4824 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4826 = ret__4824;
          var G__4827 = cljs.core.first.call(null, ks);
          var G__4828 = cljs.core.next.call(null, ks);
          coll = G__4826;
          k = G__4827;
          ks = G__4828;
          continue
        }else {
          return ret__4824
        }
        break
      }
    };
    var G__4825 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4825__delegate.call(this, coll, k, ks)
    };
    G__4825.cljs$lang$maxFixedArity = 2;
    G__4825.cljs$lang$applyTo = function(arglist__4829) {
      var coll = cljs.core.first(arglist__4829);
      var k = cljs.core.first(cljs.core.next(arglist__4829));
      var ks = cljs.core.rest(cljs.core.next(arglist__4829));
      return G__4825__delegate(coll, k, ks)
    };
    G__4825.cljs$lang$arity$variadic = G__4825__delegate;
    return G__4825
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__4830__4831 = o;
    if(G__4830__4831 != null) {
      if(function() {
        var or__3824__auto____4832 = G__4830__4831.cljs$lang$protocol_mask$partition0$ & 65536;
        if(or__3824__auto____4832) {
          return or__3824__auto____4832
        }else {
          return G__4830__4831.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__4830__4831.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4830__4831)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__4830__4831)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__4834__delegate = function(coll, k, ks) {
      while(true) {
        var ret__4833 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__4835 = ret__4833;
          var G__4836 = cljs.core.first.call(null, ks);
          var G__4837 = cljs.core.next.call(null, ks);
          coll = G__4835;
          k = G__4836;
          ks = G__4837;
          continue
        }else {
          return ret__4833
        }
        break
      }
    };
    var G__4834 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4834__delegate.call(this, coll, k, ks)
    };
    G__4834.cljs$lang$maxFixedArity = 2;
    G__4834.cljs$lang$applyTo = function(arglist__4838) {
      var coll = cljs.core.first(arglist__4838);
      var k = cljs.core.first(cljs.core.next(arglist__4838));
      var ks = cljs.core.rest(cljs.core.next(arglist__4838));
      return G__4834__delegate(coll, k, ks)
    };
    G__4834.cljs$lang$arity$variadic = G__4834__delegate;
    return G__4834
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.hash = function hash(o) {
  return cljs.core._hash.call(null, o)
};
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4839__4840 = x;
    if(G__4839__4840 != null) {
      if(function() {
        var or__3824__auto____4841 = G__4839__4840.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3824__auto____4841) {
          return or__3824__auto____4841
        }else {
          return G__4839__4840.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__4839__4840.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4839__4840)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__4839__4840)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4842__4843 = x;
    if(G__4842__4843 != null) {
      if(function() {
        var or__3824__auto____4844 = G__4842__4843.cljs$lang$protocol_mask$partition0$ & 2048;
        if(or__3824__auto____4844) {
          return or__3824__auto____4844
        }else {
          return G__4842__4843.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__4842__4843.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4842__4843)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__4842__4843)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__4845__4846 = x;
  if(G__4845__4846 != null) {
    if(function() {
      var or__3824__auto____4847 = G__4845__4846.cljs$lang$protocol_mask$partition0$ & 256;
      if(or__3824__auto____4847) {
        return or__3824__auto____4847
      }else {
        return G__4845__4846.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__4845__4846.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4845__4846)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__4845__4846)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__4848__4849 = x;
  if(G__4848__4849 != null) {
    if(function() {
      var or__3824__auto____4850 = G__4848__4849.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3824__auto____4850) {
        return or__3824__auto____4850
      }else {
        return G__4848__4849.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__4848__4849.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4848__4849)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__4848__4849)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__4851__4852 = x;
  if(G__4851__4852 != null) {
    if(function() {
      var or__3824__auto____4853 = G__4851__4852.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3824__auto____4853) {
        return or__3824__auto____4853
      }else {
        return G__4851__4852.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__4851__4852.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4851__4852)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__4851__4852)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__4854__4855 = x;
  if(G__4854__4855 != null) {
    if(function() {
      var or__3824__auto____4856 = G__4854__4855.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3824__auto____4856) {
        return or__3824__auto____4856
      }else {
        return G__4854__4855.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__4854__4855.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4854__4855)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__4854__4855)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__4857__4858 = x;
  if(G__4857__4858 != null) {
    if(function() {
      var or__3824__auto____4859 = G__4857__4858.cljs$lang$protocol_mask$partition0$ & 262144;
      if(or__3824__auto____4859) {
        return or__3824__auto____4859
      }else {
        return G__4857__4858.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__4857__4858.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4857__4858)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4857__4858)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__4860__4861 = x;
    if(G__4860__4861 != null) {
      if(function() {
        var or__3824__auto____4862 = G__4860__4861.cljs$lang$protocol_mask$partition0$ & 512;
        if(or__3824__auto____4862) {
          return or__3824__auto____4862
        }else {
          return G__4860__4861.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__4860__4861.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4860__4861)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__4860__4861)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__4863__4864 = x;
  if(G__4863__4864 != null) {
    if(function() {
      var or__3824__auto____4865 = G__4863__4864.cljs$lang$protocol_mask$partition0$ & 8192;
      if(or__3824__auto____4865) {
        return or__3824__auto____4865
      }else {
        return G__4863__4864.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__4863__4864.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4863__4864)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__4863__4864)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__4866__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__4866 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__4866__delegate.call(this, keyvals)
    };
    G__4866.cljs$lang$maxFixedArity = 0;
    G__4866.cljs$lang$applyTo = function(arglist__4867) {
      var keyvals = cljs.core.seq(arglist__4867);
      return G__4866__delegate(keyvals)
    };
    G__4866.cljs$lang$arity$variadic = G__4866__delegate;
    return G__4866
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(falsecljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__4868 = [];
  goog.object.forEach.call(null, obj, function(val, key, obj) {
    return keys__4868.push(key)
  });
  return keys__4868
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__4869 = i;
  var j__4870 = j;
  var len__4871 = len;
  while(true) {
    if(len__4871 === 0) {
      return to
    }else {
      to[j__4870] = from[i__4869];
      var G__4872 = i__4869 + 1;
      var G__4873 = j__4870 + 1;
      var G__4874 = len__4871 - 1;
      i__4869 = G__4872;
      j__4870 = G__4873;
      len__4871 = G__4874;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__4875 = i + (len - 1);
  var j__4876 = j + (len - 1);
  var len__4877 = len;
  while(true) {
    if(len__4877 === 0) {
      return to
    }else {
      to[j__4876] = from[i__4875];
      var G__4878 = i__4875 - 1;
      var G__4879 = j__4876 - 1;
      var G__4880 = len__4877 - 1;
      i__4875 = G__4878;
      j__4876 = G__4879;
      len__4877 = G__4880;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o != null && (o instanceof t || o.constructor === t || t === Object)
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__4881__4882 = s;
    if(G__4881__4882 != null) {
      if(function() {
        var or__3824__auto____4883 = G__4881__4882.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3824__auto____4883) {
          return or__3824__auto____4883
        }else {
          return G__4881__4882.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__4881__4882.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4881__4882)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__4881__4882)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__4884__4885 = s;
  if(G__4884__4885 != null) {
    if(function() {
      var or__3824__auto____4886 = G__4884__4885.cljs$lang$protocol_mask$partition0$ & 4194304;
      if(or__3824__auto____4886) {
        return or__3824__auto____4886
      }else {
        return G__4884__4885.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__4884__4885.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4884__4885)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__4884__4885)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3822__auto____4887 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4887)) {
    return cljs.core.not.call(null, function() {
      var or__3824__auto____4888 = x.charAt(0) === "\ufdd0";
      if(or__3824__auto____4888) {
        return or__3824__auto____4888
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }())
  }else {
    return and__3822__auto____4887
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3822__auto____4889 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4889)) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3822__auto____4889
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3822__auto____4890 = goog.isString.call(null, x);
  if(cljs.core.truth_(and__3822__auto____4890)) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3822__auto____4890
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber.call(null, n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction.call(null, f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3824__auto____4891 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3824__auto____4891) {
    return or__3824__auto____4891
  }else {
    var G__4892__4893 = f;
    if(G__4892__4893 != null) {
      if(function() {
        var or__3824__auto____4894 = G__4892__4893.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3824__auto____4894) {
          return or__3824__auto____4894
        }else {
          return G__4892__4893.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__4892__4893.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4892__4893)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__4892__4893)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3822__auto____4895 = cljs.core.number_QMARK_.call(null, n);
  if(and__3822__auto____4895) {
    return n == n.toFixed()
  }else {
    return and__3822__auto____4895
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3822__auto____4896 = coll;
    if(cljs.core.truth_(and__3822__auto____4896)) {
      var and__3822__auto____4897 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3822__auto____4897) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3822__auto____4897
      }
    }else {
      return and__3822__auto____4896
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)])
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var distinct_QMARK___3 = function() {
    var G__4902__delegate = function(x, y, more) {
      if(cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))) {
        var s__4898 = cljs.core.set([y, x]);
        var xs__4899 = more;
        while(true) {
          var x__4900 = cljs.core.first.call(null, xs__4899);
          var etc__4901 = cljs.core.next.call(null, xs__4899);
          if(cljs.core.truth_(xs__4899)) {
            if(cljs.core.contains_QMARK_.call(null, s__4898, x__4900)) {
              return false
            }else {
              var G__4903 = cljs.core.conj.call(null, s__4898, x__4900);
              var G__4904 = etc__4901;
              s__4898 = G__4903;
              xs__4899 = G__4904;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__4902 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4902__delegate.call(this, x, y, more)
    };
    G__4902.cljs$lang$maxFixedArity = 2;
    G__4902.cljs$lang$applyTo = function(arglist__4905) {
      var x = cljs.core.first(arglist__4905);
      var y = cljs.core.first(cljs.core.next(arglist__4905));
      var more = cljs.core.rest(cljs.core.next(arglist__4905));
      return G__4902__delegate(x, y, more)
    };
    G__4902.cljs$lang$arity$variadic = G__4902__delegate;
    return G__4902
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
    return goog.array.defaultCompare.call(null, x, y)
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if("\ufdd0'else") {
          throw new Error("compare on non-nil objects of different types");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__4906 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__4906)) {
        return r__4906
      }else {
        if(cljs.core.truth_(r__4906)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
void 0;
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var a__4907 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort.call(null, a__4907, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__4907)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__3971__auto____4908 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3971__auto____4908)) {
      var s__4909 = temp__3971__auto____4908;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__4909), cljs.core.next.call(null, s__4909))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__4910 = val;
    var coll__4911 = cljs.core.seq.call(null, coll);
    while(true) {
      if(cljs.core.truth_(coll__4911)) {
        var nval__4912 = f.call(null, val__4910, cljs.core.first.call(null, coll__4911));
        if(cljs.core.reduced_QMARK_.call(null, nval__4912)) {
          return cljs.core.deref.call(null, nval__4912)
        }else {
          var G__4913 = nval__4912;
          var G__4914 = cljs.core.next.call(null, coll__4911);
          val__4910 = G__4913;
          coll__4911 = G__4914;
          continue
        }
      }else {
        return val__4910
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__4915__4916 = coll;
      if(G__4915__4916 != null) {
        if(function() {
          var or__3824__auto____4917 = G__4915__4916.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4917) {
            return or__3824__auto____4917
          }else {
            return G__4915__4916.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4915__4916.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4915__4916)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4915__4916)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__4918__4919 = coll;
      if(G__4918__4919 != null) {
        if(function() {
          var or__3824__auto____4920 = G__4918__4919.cljs$lang$protocol_mask$partition0$ & 262144;
          if(or__3824__auto____4920) {
            return or__3824__auto____4920
          }else {
            return G__4918__4919.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__4918__4919.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4918__4919)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__4918__4919)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16384
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$ = true;
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__4921 = this;
  return this__4921.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__4922__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__4922 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4922__delegate.call(this, x, y, more)
    };
    G__4922.cljs$lang$maxFixedArity = 2;
    G__4922.cljs$lang$applyTo = function(arglist__4923) {
      var x = cljs.core.first(arglist__4923);
      var y = cljs.core.first(cljs.core.next(arglist__4923));
      var more = cljs.core.rest(cljs.core.next(arglist__4923));
      return G__4922__delegate(x, y, more)
    };
    G__4922.cljs$lang$arity$variadic = G__4922__delegate;
    return G__4922
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__4924__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__4924 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4924__delegate.call(this, x, y, more)
    };
    G__4924.cljs$lang$maxFixedArity = 2;
    G__4924.cljs$lang$applyTo = function(arglist__4925) {
      var x = cljs.core.first(arglist__4925);
      var y = cljs.core.first(cljs.core.next(arglist__4925));
      var more = cljs.core.rest(cljs.core.next(arglist__4925));
      return G__4924__delegate(x, y, more)
    };
    G__4924.cljs$lang$arity$variadic = G__4924__delegate;
    return G__4924
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__4926__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__4926 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4926__delegate.call(this, x, y, more)
    };
    G__4926.cljs$lang$maxFixedArity = 2;
    G__4926.cljs$lang$applyTo = function(arglist__4927) {
      var x = cljs.core.first(arglist__4927);
      var y = cljs.core.first(cljs.core.next(arglist__4927));
      var more = cljs.core.rest(cljs.core.next(arglist__4927));
      return G__4926__delegate(x, y, more)
    };
    G__4926.cljs$lang$arity$variadic = G__4926__delegate;
    return G__4926
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__4928__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__4928 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4928__delegate.call(this, x, y, more)
    };
    G__4928.cljs$lang$maxFixedArity = 2;
    G__4928.cljs$lang$applyTo = function(arglist__4929) {
      var x = cljs.core.first(arglist__4929);
      var y = cljs.core.first(cljs.core.next(arglist__4929));
      var more = cljs.core.rest(cljs.core.next(arglist__4929));
      return G__4928__delegate(x, y, more)
    };
    G__4928.cljs$lang$arity$variadic = G__4928__delegate;
    return G__4928
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__4930__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4931 = y;
            var G__4932 = cljs.core.first.call(null, more);
            var G__4933 = cljs.core.next.call(null, more);
            x = G__4931;
            y = G__4932;
            more = G__4933;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4930 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4930__delegate.call(this, x, y, more)
    };
    G__4930.cljs$lang$maxFixedArity = 2;
    G__4930.cljs$lang$applyTo = function(arglist__4934) {
      var x = cljs.core.first(arglist__4934);
      var y = cljs.core.first(cljs.core.next(arglist__4934));
      var more = cljs.core.rest(cljs.core.next(arglist__4934));
      return G__4930__delegate(x, y, more)
    };
    G__4930.cljs$lang$arity$variadic = G__4930__delegate;
    return G__4930
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__4935__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4936 = y;
            var G__4937 = cljs.core.first.call(null, more);
            var G__4938 = cljs.core.next.call(null, more);
            x = G__4936;
            y = G__4937;
            more = G__4938;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4935 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4935__delegate.call(this, x, y, more)
    };
    G__4935.cljs$lang$maxFixedArity = 2;
    G__4935.cljs$lang$applyTo = function(arglist__4939) {
      var x = cljs.core.first(arglist__4939);
      var y = cljs.core.first(cljs.core.next(arglist__4939));
      var more = cljs.core.rest(cljs.core.next(arglist__4939));
      return G__4935__delegate(x, y, more)
    };
    G__4935.cljs$lang$arity$variadic = G__4935__delegate;
    return G__4935
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__4940__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4941 = y;
            var G__4942 = cljs.core.first.call(null, more);
            var G__4943 = cljs.core.next.call(null, more);
            x = G__4941;
            y = G__4942;
            more = G__4943;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4940 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4940__delegate.call(this, x, y, more)
    };
    G__4940.cljs$lang$maxFixedArity = 2;
    G__4940.cljs$lang$applyTo = function(arglist__4944) {
      var x = cljs.core.first(arglist__4944);
      var y = cljs.core.first(cljs.core.next(arglist__4944));
      var more = cljs.core.rest(cljs.core.next(arglist__4944));
      return G__4940__delegate(x, y, more)
    };
    G__4940.cljs$lang$arity$variadic = G__4940__delegate;
    return G__4940
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__4945__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4946 = y;
            var G__4947 = cljs.core.first.call(null, more);
            var G__4948 = cljs.core.next.call(null, more);
            x = G__4946;
            y = G__4947;
            more = G__4948;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4945 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4945__delegate.call(this, x, y, more)
    };
    G__4945.cljs$lang$maxFixedArity = 2;
    G__4945.cljs$lang$applyTo = function(arglist__4949) {
      var x = cljs.core.first(arglist__4949);
      var y = cljs.core.first(cljs.core.next(arglist__4949));
      var more = cljs.core.rest(cljs.core.next(arglist__4949));
      return G__4945__delegate(x, y, more)
    };
    G__4945.cljs$lang$arity$variadic = G__4945__delegate;
    return G__4945
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__4950__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__4950 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4950__delegate.call(this, x, y, more)
    };
    G__4950.cljs$lang$maxFixedArity = 2;
    G__4950.cljs$lang$applyTo = function(arglist__4951) {
      var x = cljs.core.first(arglist__4951);
      var y = cljs.core.first(cljs.core.next(arglist__4951));
      var more = cljs.core.rest(cljs.core.next(arglist__4951));
      return G__4950__delegate(x, y, more)
    };
    G__4950.cljs$lang$arity$variadic = G__4950__delegate;
    return G__4950
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__4952__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__4952 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4952__delegate.call(this, x, y, more)
    };
    G__4952.cljs$lang$maxFixedArity = 2;
    G__4952.cljs$lang$applyTo = function(arglist__4953) {
      var x = cljs.core.first(arglist__4953);
      var y = cljs.core.first(cljs.core.next(arglist__4953));
      var more = cljs.core.rest(cljs.core.next(arglist__4953));
      return G__4952__delegate(x, y, more)
    };
    G__4952.cljs$lang$arity$variadic = G__4952__delegate;
    return G__4952
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__4954 = n % d;
  return cljs.core.fix.call(null, (n - rem__4954) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__4955 = cljs.core.quot.call(null, n, d);
  return n - d * q__4955
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(n) {
  var c__4956 = 0;
  var n__4957 = n;
  while(true) {
    if(n__4957 === 0) {
      return c__4956
    }else {
      var G__4958 = c__4956 + 1;
      var G__4959 = n__4957 & n__4957 - 1;
      c__4956 = G__4958;
      n__4957 = G__4959;
      continue
    }
    break
  }
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__4960__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.truth_(cljs.core.next.call(null, more))) {
            var G__4961 = y;
            var G__4962 = cljs.core.first.call(null, more);
            var G__4963 = cljs.core.next.call(null, more);
            x = G__4961;
            y = G__4962;
            more = G__4963;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__4960 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__4960__delegate.call(this, x, y, more)
    };
    G__4960.cljs$lang$maxFixedArity = 2;
    G__4960.cljs$lang$applyTo = function(arglist__4964) {
      var x = cljs.core.first(arglist__4964);
      var y = cljs.core.first(cljs.core.next(arglist__4964));
      var more = cljs.core.rest(cljs.core.next(arglist__4964));
      return G__4960__delegate(x, y, more)
    };
    G__4960.cljs$lang$arity$variadic = G__4960__delegate;
    return G__4960
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__4965 = n;
  var xs__4966 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____4967 = xs__4966;
      if(cljs.core.truth_(and__3822__auto____4967)) {
        return n__4965 > 0
      }else {
        return and__3822__auto____4967
      }
    }())) {
      var G__4968 = n__4965 - 1;
      var G__4969 = cljs.core.next.call(null, xs__4966);
      n__4965 = G__4968;
      xs__4966 = G__4969;
      continue
    }else {
      return xs__4966
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__4970__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4971 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__4972 = cljs.core.next.call(null, more);
            sb = G__4971;
            more = G__4972;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__4970 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4970__delegate.call(this, x, ys)
    };
    G__4970.cljs$lang$maxFixedArity = 1;
    G__4970.cljs$lang$applyTo = function(arglist__4973) {
      var x = cljs.core.first(arglist__4973);
      var ys = cljs.core.rest(arglist__4973);
      return G__4970__delegate(x, ys)
    };
    G__4970.cljs$lang$arity$variadic = G__4970__delegate;
    return G__4970
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__4974__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__4975 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__4976 = cljs.core.next.call(null, more);
            sb = G__4975;
            more = G__4976;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__4974 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__4974__delegate.call(this, x, ys)
    };
    G__4974.cljs$lang$maxFixedArity = 1;
    G__4974.cljs$lang$applyTo = function(arglist__4977) {
      var x = cljs.core.first(arglist__4977);
      var ys = cljs.core.rest(arglist__4977);
      return G__4974__delegate(x, ys)
    };
    G__4974.cljs$lang$arity$variadic = G__4974__delegate;
    return G__4974
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__4978 = cljs.core.seq.call(null, x);
    var ys__4979 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__4978 == null) {
        return ys__4979 == null
      }else {
        if(ys__4979 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__4978), cljs.core.first.call(null, ys__4979))) {
            var G__4980 = cljs.core.next.call(null, xs__4978);
            var G__4981 = cljs.core.next.call(null, ys__4979);
            xs__4978 = G__4980;
            ys__4979 = G__4981;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__4982_SHARP_, p2__4983_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__4982_SHARP_, cljs.core.hash.call(null, p2__4983_SHARP_))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll)), cljs.core.next.call(null, coll))
};
void 0;
void 0;
cljs.core.hash_imap = function hash_imap(m) {
  var h__4984 = 0;
  var s__4985 = cljs.core.seq.call(null, m);
  while(true) {
    if(cljs.core.truth_(s__4985)) {
      var e__4986 = cljs.core.first.call(null, s__4985);
      var G__4987 = (h__4984 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__4986)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__4986)))) % 4503599627370496;
      var G__4988 = cljs.core.next.call(null, s__4985);
      h__4984 = G__4987;
      s__4985 = G__4988;
      continue
    }else {
      return h__4984
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__4989 = 0;
  var s__4990 = cljs.core.seq.call(null, s);
  while(true) {
    if(cljs.core.truth_(s__4990)) {
      var e__4991 = cljs.core.first.call(null, s__4990);
      var G__4992 = (h__4989 + cljs.core.hash.call(null, e__4991)) % 4503599627370496;
      var G__4993 = cljs.core.next.call(null, s__4990);
      h__4989 = G__4992;
      s__4990 = G__4993;
      continue
    }else {
      return h__4989
    }
    break
  }
};
void 0;
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__4994__4995 = cljs.core.seq.call(null, fn_map);
  if(cljs.core.truth_(G__4994__4995)) {
    var G__4997__4999 = cljs.core.first.call(null, G__4994__4995);
    var vec__4998__5000 = G__4997__4999;
    var key_name__5001 = cljs.core.nth.call(null, vec__4998__5000, 0, null);
    var f__5002 = cljs.core.nth.call(null, vec__4998__5000, 1, null);
    var G__4994__5003 = G__4994__4995;
    var G__4997__5004 = G__4997__4999;
    var G__4994__5005 = G__4994__5003;
    while(true) {
      var vec__5006__5007 = G__4997__5004;
      var key_name__5008 = cljs.core.nth.call(null, vec__5006__5007, 0, null);
      var f__5009 = cljs.core.nth.call(null, vec__5006__5007, 1, null);
      var G__4994__5010 = G__4994__5005;
      var str_name__5011 = cljs.core.name.call(null, key_name__5008);
      obj[str_name__5011] = f__5009;
      var temp__3974__auto____5012 = cljs.core.next.call(null, G__4994__5010);
      if(cljs.core.truth_(temp__3974__auto____5012)) {
        var G__4994__5013 = temp__3974__auto____5012;
        var G__5014 = cljs.core.first.call(null, G__4994__5013);
        var G__5015 = G__4994__5013;
        G__4997__5004 = G__5014;
        G__4994__5005 = G__5015;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706670
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.List")
};
cljs.core.List.prototype.cljs$core$IHash$ = true;
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5016 = this;
  var h__364__auto____5017 = this__5016.__hash;
  if(h__364__auto____5017 != null) {
    return h__364__auto____5017
  }else {
    var h__364__auto____5018 = cljs.core.hash_coll.call(null, coll);
    this__5016.__hash = h__364__auto____5018;
    return h__364__auto____5018
  }
};
cljs.core.List.prototype.cljs$core$ISequential$ = true;
cljs.core.List.prototype.cljs$core$ICollection$ = true;
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5019 = this;
  return new cljs.core.List(this__5019.meta, o, coll, this__5019.count + 1, null)
};
cljs.core.List.prototype.cljs$core$ASeq$ = true;
cljs.core.List.prototype.toString = function() {
  var this__5020 = this;
  var this$__5021 = this;
  return cljs.core.pr_str.call(null, this$__5021)
};
cljs.core.List.prototype.cljs$core$ISeqable$ = true;
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5022 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$ = true;
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5023 = this;
  return this__5023.count
};
cljs.core.List.prototype.cljs$core$IStack$ = true;
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5024 = this;
  return this__5024.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5025 = this;
  return cljs.core._rest.call(null, coll)
};
cljs.core.List.prototype.cljs$core$ISeq$ = true;
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5026 = this;
  return this__5026.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5027 = this;
  return this__5027.rest
};
cljs.core.List.prototype.cljs$core$IEquiv$ = true;
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5028 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$ = true;
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5029 = this;
  return new cljs.core.List(meta, this__5029.first, this__5029.rest, this__5029.count, this__5029.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$ = true;
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5030 = this;
  return this__5030.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5031 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List.prototype.cljs$core$IList$ = true;
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32706638
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$ = true;
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5032 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$ISequential$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5033 = this;
  return new cljs.core.List(this__5033.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__5034 = this;
  var this$__5035 = this;
  return cljs.core.pr_str.call(null, this$__5035)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5036 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$ = true;
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5037 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$ = true;
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5038 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5039 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$ = true;
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5040 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5041 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5042 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5043 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$ = true;
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5044 = this;
  return this__5044.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5045 = this;
  return coll
};
cljs.core.EmptyList.prototype.cljs$core$IList$ = true;
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__5046__5047 = coll;
  if(G__5046__5047 != null) {
    if(function() {
      var or__3824__auto____5048 = G__5046__5047.cljs$lang$protocol_mask$partition0$ & 67108864;
      if(or__3824__auto____5048) {
        return or__3824__auto____5048
      }else {
        return G__5046__5047.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__5046__5047.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5046__5047)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__5046__5047)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
};
cljs.core.list = function() {
  var list__delegate = function(items) {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items))
  };
  var list = function(var_args) {
    var items = null;
    if(goog.isDef(var_args)) {
      items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return list__delegate.call(this, items)
  };
  list.cljs$lang$maxFixedArity = 0;
  list.cljs$lang$applyTo = function(arglist__5049) {
    var items = cljs.core.seq(arglist__5049);
    return list__delegate(items)
  };
  list.cljs$lang$arity$variadic = list__delegate;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32702572
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$ = true;
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5050 = this;
  var h__364__auto____5051 = this__5050.__hash;
  if(h__364__auto____5051 != null) {
    return h__364__auto____5051
  }else {
    var h__364__auto____5052 = cljs.core.hash_coll.call(null, coll);
    this__5050.__hash = h__364__auto____5052;
    return h__364__auto____5052
  }
};
cljs.core.Cons.prototype.cljs$core$ISequential$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$ = true;
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5053 = this;
  return new cljs.core.Cons(null, o, coll, this__5053.__hash)
};
cljs.core.Cons.prototype.cljs$core$ASeq$ = true;
cljs.core.Cons.prototype.toString = function() {
  var this__5054 = this;
  var this$__5055 = this;
  return cljs.core.pr_str.call(null, this$__5055)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$ = true;
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5056 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$ = true;
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5057 = this;
  return this__5057.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5058 = this;
  if(this__5058.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__5058.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$ = true;
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5059 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5060 = this;
  return new cljs.core.Cons(meta, this__5060.first, this__5060.rest, this__5060.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$ = true;
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5061 = this;
  return this__5061.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5062 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5062.meta)
};
cljs.core.Cons.prototype.cljs$core$IList$ = true;
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3824__auto____5063 = coll == null;
    if(or__3824__auto____5063) {
      return or__3824__auto____5063
    }else {
      var G__5064__5065 = coll;
      if(G__5064__5065 != null) {
        if(function() {
          var or__3824__auto____5066 = G__5064__5065.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3824__auto____5066) {
            return or__3824__auto____5066
          }else {
            return G__5064__5065.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__5064__5065.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5064__5065)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__5064__5065)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__5067__5068 = x;
  if(G__5067__5068 != null) {
    if(function() {
      var or__3824__auto____5069 = G__5067__5068.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3824__auto____5069) {
        return or__3824__auto____5069
      }else {
        return G__5067__5068.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__5067__5068.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5067__5068)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__5067__5068)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__5070 = null;
  var G__5070__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__5070__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__5070 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__5070__2.call(this, string, f);
      case 3:
        return G__5070__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5070
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__5071 = null;
  var G__5071__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__5071__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__5071 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5071__2.call(this, string, k);
      case 3:
        return G__5071__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5071
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__5072 = null;
  var G__5072__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__5072__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__5072 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5072__2.call(this, string, n);
      case 3:
        return G__5072__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5072
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode.call(null, o)
};
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__5081 = null;
  var G__5081__2 = function(tsym5075, coll) {
    var tsym5075__5077 = this;
    var this$__5078 = tsym5075__5077;
    return cljs.core.get.call(null, coll, this$__5078.toString())
  };
  var G__5081__3 = function(tsym5076, coll, not_found) {
    var tsym5076__5079 = this;
    var this$__5080 = tsym5076__5079;
    return cljs.core.get.call(null, coll, this$__5080.toString(), not_found)
  };
  G__5081 = function(tsym5076, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5081__2.call(this, tsym5076, coll);
      case 3:
        return G__5081__3.call(this, tsym5076, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5081
}();
String.prototype.apply = function(tsym5073, args5074) {
  return tsym5073.call.apply(tsym5073, [tsym5073].concat(cljs.core.aclone.call(null, args5074)))
};
String["prototype"]["apply"] = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core.get.call(null, args[0], s)
  }else {
    return cljs.core.get.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__5082 = lazy_seq.x;
  if(cljs.core.truth_(lazy_seq.realized)) {
    return x__5082
  }else {
    lazy_seq.x = x__5082.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$ = true;
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5083 = this;
  var h__364__auto____5084 = this__5083.__hash;
  if(h__364__auto____5084 != null) {
    return h__364__auto____5084
  }else {
    var h__364__auto____5085 = cljs.core.hash_coll.call(null, coll);
    this__5083.__hash = h__364__auto____5085;
    return h__364__auto____5085
  }
};
cljs.core.LazySeq.prototype.cljs$core$ISequential$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5086 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__5087 = this;
  var this$__5088 = this;
  return cljs.core.pr_str.call(null, this$__5088)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5089 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$ = true;
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5090 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5091 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5092 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5093 = this;
  return new cljs.core.LazySeq(meta, this__5093.realized, this__5093.x, this__5093.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$ = true;
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5094 = this;
  return this__5094.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5095 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5095.meta)
};
cljs.core.LazySeq;
cljs.core.to_array = function to_array(s) {
  var ary__5096 = [];
  var s__5097 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, s__5097))) {
      ary__5096.push(cljs.core.first.call(null, s__5097));
      var G__5098 = cljs.core.next.call(null, s__5097);
      s__5097 = G__5098;
      continue
    }else {
      return ary__5096
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__5099 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__5100 = 0;
  var xs__5101 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(xs__5101)) {
      ret__5099[i__5100] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__5101));
      var G__5102 = i__5100 + 1;
      var G__5103 = cljs.core.next.call(null, xs__5101);
      i__5100 = G__5102;
      xs__5101 = G__5103;
      continue
    }else {
    }
    break
  }
  return ret__5099
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__5104 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5105 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5106 = 0;
      var s__5107 = s__5105;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5108 = s__5107;
          if(cljs.core.truth_(and__3822__auto____5108)) {
            return i__5106 < size
          }else {
            return and__3822__auto____5108
          }
        }())) {
          a__5104[i__5106] = cljs.core.first.call(null, s__5107);
          var G__5111 = i__5106 + 1;
          var G__5112 = cljs.core.next.call(null, s__5107);
          i__5106 = G__5111;
          s__5107 = G__5112;
          continue
        }else {
          return a__5104
        }
        break
      }
    }else {
      var n__685__auto____5109 = size;
      var i__5110 = 0;
      while(true) {
        if(i__5110 < n__685__auto____5109) {
          a__5104[i__5110] = init_val_or_seq;
          var G__5113 = i__5110 + 1;
          i__5110 = G__5113;
          continue
        }else {
        }
        break
      }
      return a__5104
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__5114 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5115 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5116 = 0;
      var s__5117 = s__5115;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5118 = s__5117;
          if(cljs.core.truth_(and__3822__auto____5118)) {
            return i__5116 < size
          }else {
            return and__3822__auto____5118
          }
        }())) {
          a__5114[i__5116] = cljs.core.first.call(null, s__5117);
          var G__5121 = i__5116 + 1;
          var G__5122 = cljs.core.next.call(null, s__5117);
          i__5116 = G__5121;
          s__5117 = G__5122;
          continue
        }else {
          return a__5114
        }
        break
      }
    }else {
      var n__685__auto____5119 = size;
      var i__5120 = 0;
      while(true) {
        if(i__5120 < n__685__auto____5119) {
          a__5114[i__5120] = init_val_or_seq;
          var G__5123 = i__5120 + 1;
          i__5120 = G__5123;
          continue
        }else {
        }
        break
      }
      return a__5114
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__5124 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__5125 = cljs.core.seq.call(null, init_val_or_seq);
      var i__5126 = 0;
      var s__5127 = s__5125;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3822__auto____5128 = s__5127;
          if(cljs.core.truth_(and__3822__auto____5128)) {
            return i__5126 < size
          }else {
            return and__3822__auto____5128
          }
        }())) {
          a__5124[i__5126] = cljs.core.first.call(null, s__5127);
          var G__5131 = i__5126 + 1;
          var G__5132 = cljs.core.next.call(null, s__5127);
          i__5126 = G__5131;
          s__5127 = G__5132;
          continue
        }else {
          return a__5124
        }
        break
      }
    }else {
      var n__685__auto____5129 = size;
      var i__5130 = 0;
      while(true) {
        if(i__5130 < n__685__auto____5129) {
          a__5124[i__5130] = init_val_or_seq;
          var G__5133 = i__5130 + 1;
          i__5130 = G__5133;
          continue
        }else {
        }
        break
      }
      return a__5124
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__5134 = s;
    var i__5135 = n;
    var sum__5136 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____5137 = i__5135 > 0;
        if(and__3822__auto____5137) {
          return cljs.core.seq.call(null, s__5134)
        }else {
          return and__3822__auto____5137
        }
      }())) {
        var G__5138 = cljs.core.next.call(null, s__5134);
        var G__5139 = i__5135 - 1;
        var G__5140 = sum__5136 + 1;
        s__5134 = G__5138;
        i__5135 = G__5139;
        sum__5136 = G__5140;
        continue
      }else {
        return sum__5136
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    })
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    })
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__5141 = cljs.core.seq.call(null, x);
      if(cljs.core.truth_(s__5141)) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5141), concat.call(null, cljs.core.rest.call(null, s__5141), y))
      }else {
        return y
      }
    })
  };
  var concat__3 = function() {
    var G__5144__delegate = function(x, y, zs) {
      var cat__5143 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__5142 = cljs.core.seq.call(null, xys);
          if(cljs.core.truth_(xys__5142)) {
            return cljs.core.cons.call(null, cljs.core.first.call(null, xys__5142), cat.call(null, cljs.core.rest.call(null, xys__5142), zs))
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        })
      };
      return cat__5143.call(null, concat.call(null, x, y), zs)
    };
    var G__5144 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5144__delegate.call(this, x, y, zs)
    };
    G__5144.cljs$lang$maxFixedArity = 2;
    G__5144.cljs$lang$applyTo = function(arglist__5145) {
      var x = cljs.core.first(arglist__5145);
      var y = cljs.core.first(cljs.core.next(arglist__5145));
      var zs = cljs.core.rest(cljs.core.next(arglist__5145));
      return G__5144__delegate(x, y, zs)
    };
    G__5144.cljs$lang$arity$variadic = G__5144__delegate;
    return G__5144
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__5146__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__5146 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5146__delegate.call(this, a, b, c, d, more)
    };
    G__5146.cljs$lang$maxFixedArity = 4;
    G__5146.cljs$lang$applyTo = function(arglist__5147) {
      var a = cljs.core.first(arglist__5147);
      var b = cljs.core.first(cljs.core.next(arglist__5147));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5147)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5147))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5147))));
      return G__5146__delegate(a, b, c, d, more)
    };
    G__5146.cljs$lang$arity$variadic = G__5146__delegate;
    return G__5146
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
void 0;
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__5148 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__5149 = cljs.core._first.call(null, args__5148);
    var args__5150 = cljs.core._rest.call(null, args__5148);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__5149)
      }else {
        return f.call(null, a__5149)
      }
    }else {
      var b__5151 = cljs.core._first.call(null, args__5150);
      var args__5152 = cljs.core._rest.call(null, args__5150);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__5149, b__5151)
        }else {
          return f.call(null, a__5149, b__5151)
        }
      }else {
        var c__5153 = cljs.core._first.call(null, args__5152);
        var args__5154 = cljs.core._rest.call(null, args__5152);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__5149, b__5151, c__5153)
          }else {
            return f.call(null, a__5149, b__5151, c__5153)
          }
        }else {
          var d__5155 = cljs.core._first.call(null, args__5154);
          var args__5156 = cljs.core._rest.call(null, args__5154);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__5149, b__5151, c__5153, d__5155)
            }else {
              return f.call(null, a__5149, b__5151, c__5153, d__5155)
            }
          }else {
            var e__5157 = cljs.core._first.call(null, args__5156);
            var args__5158 = cljs.core._rest.call(null, args__5156);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__5149, b__5151, c__5153, d__5155, e__5157)
              }else {
                return f.call(null, a__5149, b__5151, c__5153, d__5155, e__5157)
              }
            }else {
              var f__5159 = cljs.core._first.call(null, args__5158);
              var args__5160 = cljs.core._rest.call(null, args__5158);
              if(argc === 6) {
                if(f__5159.cljs$lang$arity$6) {
                  return f__5159.cljs$lang$arity$6(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159)
                }else {
                  return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159)
                }
              }else {
                var g__5161 = cljs.core._first.call(null, args__5160);
                var args__5162 = cljs.core._rest.call(null, args__5160);
                if(argc === 7) {
                  if(f__5159.cljs$lang$arity$7) {
                    return f__5159.cljs$lang$arity$7(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161)
                  }else {
                    return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161)
                  }
                }else {
                  var h__5163 = cljs.core._first.call(null, args__5162);
                  var args__5164 = cljs.core._rest.call(null, args__5162);
                  if(argc === 8) {
                    if(f__5159.cljs$lang$arity$8) {
                      return f__5159.cljs$lang$arity$8(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163)
                    }else {
                      return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163)
                    }
                  }else {
                    var i__5165 = cljs.core._first.call(null, args__5164);
                    var args__5166 = cljs.core._rest.call(null, args__5164);
                    if(argc === 9) {
                      if(f__5159.cljs$lang$arity$9) {
                        return f__5159.cljs$lang$arity$9(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165)
                      }else {
                        return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165)
                      }
                    }else {
                      var j__5167 = cljs.core._first.call(null, args__5166);
                      var args__5168 = cljs.core._rest.call(null, args__5166);
                      if(argc === 10) {
                        if(f__5159.cljs$lang$arity$10) {
                          return f__5159.cljs$lang$arity$10(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167)
                        }else {
                          return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167)
                        }
                      }else {
                        var k__5169 = cljs.core._first.call(null, args__5168);
                        var args__5170 = cljs.core._rest.call(null, args__5168);
                        if(argc === 11) {
                          if(f__5159.cljs$lang$arity$11) {
                            return f__5159.cljs$lang$arity$11(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169)
                          }else {
                            return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169)
                          }
                        }else {
                          var l__5171 = cljs.core._first.call(null, args__5170);
                          var args__5172 = cljs.core._rest.call(null, args__5170);
                          if(argc === 12) {
                            if(f__5159.cljs$lang$arity$12) {
                              return f__5159.cljs$lang$arity$12(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171)
                            }else {
                              return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171)
                            }
                          }else {
                            var m__5173 = cljs.core._first.call(null, args__5172);
                            var args__5174 = cljs.core._rest.call(null, args__5172);
                            if(argc === 13) {
                              if(f__5159.cljs$lang$arity$13) {
                                return f__5159.cljs$lang$arity$13(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173)
                              }else {
                                return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173)
                              }
                            }else {
                              var n__5175 = cljs.core._first.call(null, args__5174);
                              var args__5176 = cljs.core._rest.call(null, args__5174);
                              if(argc === 14) {
                                if(f__5159.cljs$lang$arity$14) {
                                  return f__5159.cljs$lang$arity$14(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175)
                                }else {
                                  return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175)
                                }
                              }else {
                                var o__5177 = cljs.core._first.call(null, args__5176);
                                var args__5178 = cljs.core._rest.call(null, args__5176);
                                if(argc === 15) {
                                  if(f__5159.cljs$lang$arity$15) {
                                    return f__5159.cljs$lang$arity$15(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177)
                                  }else {
                                    return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177)
                                  }
                                }else {
                                  var p__5179 = cljs.core._first.call(null, args__5178);
                                  var args__5180 = cljs.core._rest.call(null, args__5178);
                                  if(argc === 16) {
                                    if(f__5159.cljs$lang$arity$16) {
                                      return f__5159.cljs$lang$arity$16(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179)
                                    }else {
                                      return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179)
                                    }
                                  }else {
                                    var q__5181 = cljs.core._first.call(null, args__5180);
                                    var args__5182 = cljs.core._rest.call(null, args__5180);
                                    if(argc === 17) {
                                      if(f__5159.cljs$lang$arity$17) {
                                        return f__5159.cljs$lang$arity$17(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181)
                                      }else {
                                        return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181)
                                      }
                                    }else {
                                      var r__5183 = cljs.core._first.call(null, args__5182);
                                      var args__5184 = cljs.core._rest.call(null, args__5182);
                                      if(argc === 18) {
                                        if(f__5159.cljs$lang$arity$18) {
                                          return f__5159.cljs$lang$arity$18(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183)
                                        }else {
                                          return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183)
                                        }
                                      }else {
                                        var s__5185 = cljs.core._first.call(null, args__5184);
                                        var args__5186 = cljs.core._rest.call(null, args__5184);
                                        if(argc === 19) {
                                          if(f__5159.cljs$lang$arity$19) {
                                            return f__5159.cljs$lang$arity$19(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183, s__5185)
                                          }else {
                                            return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183, s__5185)
                                          }
                                        }else {
                                          var t__5187 = cljs.core._first.call(null, args__5186);
                                          var args__5188 = cljs.core._rest.call(null, args__5186);
                                          if(argc === 20) {
                                            if(f__5159.cljs$lang$arity$20) {
                                              return f__5159.cljs$lang$arity$20(a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183, s__5185, t__5187)
                                            }else {
                                              return f__5159.call(null, a__5149, b__5151, c__5153, d__5155, e__5157, f__5159, g__5161, h__5163, i__5165, j__5167, k__5169, l__5171, m__5173, n__5175, o__5177, p__5179, q__5181, r__5183, s__5185, t__5187)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
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
    }
  }
};
void 0;
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__5189 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5190 = cljs.core.bounded_count.call(null, args, fixed_arity__5189 + 1);
      if(bc__5190 <= fixed_arity__5189) {
        return cljs.core.apply_to.call(null, f, bc__5190, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__5191 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__5192 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5193 = cljs.core.bounded_count.call(null, arglist__5191, fixed_arity__5192 + 1);
      if(bc__5193 <= fixed_arity__5192) {
        return cljs.core.apply_to.call(null, f, bc__5193, arglist__5191)
      }else {
        return f.cljs$lang$applyTo(arglist__5191)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5191))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__5194 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__5195 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5196 = cljs.core.bounded_count.call(null, arglist__5194, fixed_arity__5195 + 1);
      if(bc__5196 <= fixed_arity__5195) {
        return cljs.core.apply_to.call(null, f, bc__5196, arglist__5194)
      }else {
        return f.cljs$lang$applyTo(arglist__5194)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5194))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__5197 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__5198 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__5199 = cljs.core.bounded_count.call(null, arglist__5197, fixed_arity__5198 + 1);
      if(bc__5199 <= fixed_arity__5198) {
        return cljs.core.apply_to.call(null, f, bc__5199, arglist__5197)
      }else {
        return f.cljs$lang$applyTo(arglist__5197)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__5197))
    }
  };
  var apply__6 = function() {
    var G__5203__delegate = function(f, a, b, c, d, args) {
      var arglist__5200 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__5201 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__5202 = cljs.core.bounded_count.call(null, arglist__5200, fixed_arity__5201 + 1);
        if(bc__5202 <= fixed_arity__5201) {
          return cljs.core.apply_to.call(null, f, bc__5202, arglist__5200)
        }else {
          return f.cljs$lang$applyTo(arglist__5200)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__5200))
      }
    };
    var G__5203 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__5203__delegate.call(this, f, a, b, c, d, args)
    };
    G__5203.cljs$lang$maxFixedArity = 5;
    G__5203.cljs$lang$applyTo = function(arglist__5204) {
      var f = cljs.core.first(arglist__5204);
      var a = cljs.core.first(cljs.core.next(arglist__5204));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5204)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5204))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5204)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5204)))));
      return G__5203__delegate(f, a, b, c, d, args)
    };
    G__5203.cljs$lang$arity$variadic = G__5203__delegate;
    return G__5203
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__5205) {
    var obj = cljs.core.first(arglist__5205);
    var f = cljs.core.first(cljs.core.next(arglist__5205));
    var args = cljs.core.rest(cljs.core.next(arglist__5205));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return cljs.core.not.call(null, cljs.core._EQ_.call(null, x, y))
  };
  var not_EQ___3 = function() {
    var G__5206__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__5206 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5206__delegate.call(this, x, y, more)
    };
    G__5206.cljs$lang$maxFixedArity = 2;
    G__5206.cljs$lang$applyTo = function(arglist__5207) {
      var x = cljs.core.first(arglist__5207);
      var y = cljs.core.first(cljs.core.next(arglist__5207));
      var more = cljs.core.rest(cljs.core.next(arglist__5207));
      return G__5206__delegate(x, y, more)
    };
    G__5206.cljs$lang$arity$variadic = G__5206__delegate;
    return G__5206
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__5208 = pred;
        var G__5209 = cljs.core.next.call(null, coll);
        pred = G__5208;
        coll = G__5209;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.every_QMARK_.call(null, pred, coll))
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
      var or__3824__auto____5210 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3824__auto____5210)) {
        return or__3824__auto____5210
      }else {
        var G__5211 = pred;
        var G__5212 = cljs.core.next.call(null, coll);
        pred = G__5211;
        coll = G__5212;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return cljs.core.not.call(null, cljs.core.even_QMARK_.call(null, n))
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__5213 = null;
    var G__5213__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__5213__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__5213__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__5213__3 = function() {
      var G__5214__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__5214 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__5214__delegate.call(this, x, y, zs)
      };
      G__5214.cljs$lang$maxFixedArity = 2;
      G__5214.cljs$lang$applyTo = function(arglist__5215) {
        var x = cljs.core.first(arglist__5215);
        var y = cljs.core.first(cljs.core.next(arglist__5215));
        var zs = cljs.core.rest(cljs.core.next(arglist__5215));
        return G__5214__delegate(x, y, zs)
      };
      G__5214.cljs$lang$arity$variadic = G__5214__delegate;
      return G__5214
    }();
    G__5213 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__5213__0.call(this);
        case 1:
          return G__5213__1.call(this, x);
        case 2:
          return G__5213__2.call(this, x, y);
        default:
          return G__5213__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__5213.cljs$lang$maxFixedArity = 2;
    G__5213.cljs$lang$applyTo = G__5213__3.cljs$lang$applyTo;
    return G__5213
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__5216__delegate = function(args) {
      return x
    };
    var G__5216 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__5216__delegate.call(this, args)
    };
    G__5216.cljs$lang$maxFixedArity = 0;
    G__5216.cljs$lang$applyTo = function(arglist__5217) {
      var args = cljs.core.seq(arglist__5217);
      return G__5216__delegate(args)
    };
    G__5216.cljs$lang$arity$variadic = G__5216__delegate;
    return G__5216
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__5221 = null;
      var G__5221__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__5221__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__5221__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__5221__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__5221__4 = function() {
        var G__5222__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__5222 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5222__delegate.call(this, x, y, z, args)
        };
        G__5222.cljs$lang$maxFixedArity = 3;
        G__5222.cljs$lang$applyTo = function(arglist__5223) {
          var x = cljs.core.first(arglist__5223);
          var y = cljs.core.first(cljs.core.next(arglist__5223));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5223)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5223)));
          return G__5222__delegate(x, y, z, args)
        };
        G__5222.cljs$lang$arity$variadic = G__5222__delegate;
        return G__5222
      }();
      G__5221 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5221__0.call(this);
          case 1:
            return G__5221__1.call(this, x);
          case 2:
            return G__5221__2.call(this, x, y);
          case 3:
            return G__5221__3.call(this, x, y, z);
          default:
            return G__5221__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5221.cljs$lang$maxFixedArity = 3;
      G__5221.cljs$lang$applyTo = G__5221__4.cljs$lang$applyTo;
      return G__5221
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__5224 = null;
      var G__5224__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__5224__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__5224__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__5224__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__5224__4 = function() {
        var G__5225__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__5225 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5225__delegate.call(this, x, y, z, args)
        };
        G__5225.cljs$lang$maxFixedArity = 3;
        G__5225.cljs$lang$applyTo = function(arglist__5226) {
          var x = cljs.core.first(arglist__5226);
          var y = cljs.core.first(cljs.core.next(arglist__5226));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5226)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5226)));
          return G__5225__delegate(x, y, z, args)
        };
        G__5225.cljs$lang$arity$variadic = G__5225__delegate;
        return G__5225
      }();
      G__5224 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__5224__0.call(this);
          case 1:
            return G__5224__1.call(this, x);
          case 2:
            return G__5224__2.call(this, x, y);
          case 3:
            return G__5224__3.call(this, x, y, z);
          default:
            return G__5224__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5224.cljs$lang$maxFixedArity = 3;
      G__5224.cljs$lang$applyTo = G__5224__4.cljs$lang$applyTo;
      return G__5224
    }()
  };
  var comp__4 = function() {
    var G__5227__delegate = function(f1, f2, f3, fs) {
      var fs__5218 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__5228__delegate = function(args) {
          var ret__5219 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__5218), args);
          var fs__5220 = cljs.core.next.call(null, fs__5218);
          while(true) {
            if(cljs.core.truth_(fs__5220)) {
              var G__5229 = cljs.core.first.call(null, fs__5220).call(null, ret__5219);
              var G__5230 = cljs.core.next.call(null, fs__5220);
              ret__5219 = G__5229;
              fs__5220 = G__5230;
              continue
            }else {
              return ret__5219
            }
            break
          }
        };
        var G__5228 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5228__delegate.call(this, args)
        };
        G__5228.cljs$lang$maxFixedArity = 0;
        G__5228.cljs$lang$applyTo = function(arglist__5231) {
          var args = cljs.core.seq(arglist__5231);
          return G__5228__delegate(args)
        };
        G__5228.cljs$lang$arity$variadic = G__5228__delegate;
        return G__5228
      }()
    };
    var G__5227 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5227__delegate.call(this, f1, f2, f3, fs)
    };
    G__5227.cljs$lang$maxFixedArity = 3;
    G__5227.cljs$lang$applyTo = function(arglist__5232) {
      var f1 = cljs.core.first(arglist__5232);
      var f2 = cljs.core.first(cljs.core.next(arglist__5232));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5232)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5232)));
      return G__5227__delegate(f1, f2, f3, fs)
    };
    G__5227.cljs$lang$arity$variadic = G__5227__delegate;
    return G__5227
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__5233__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__5233 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5233__delegate.call(this, args)
      };
      G__5233.cljs$lang$maxFixedArity = 0;
      G__5233.cljs$lang$applyTo = function(arglist__5234) {
        var args = cljs.core.seq(arglist__5234);
        return G__5233__delegate(args)
      };
      G__5233.cljs$lang$arity$variadic = G__5233__delegate;
      return G__5233
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__5235__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__5235 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5235__delegate.call(this, args)
      };
      G__5235.cljs$lang$maxFixedArity = 0;
      G__5235.cljs$lang$applyTo = function(arglist__5236) {
        var args = cljs.core.seq(arglist__5236);
        return G__5235__delegate(args)
      };
      G__5235.cljs$lang$arity$variadic = G__5235__delegate;
      return G__5235
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__5237__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__5237 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__5237__delegate.call(this, args)
      };
      G__5237.cljs$lang$maxFixedArity = 0;
      G__5237.cljs$lang$applyTo = function(arglist__5238) {
        var args = cljs.core.seq(arglist__5238);
        return G__5237__delegate(args)
      };
      G__5237.cljs$lang$arity$variadic = G__5237__delegate;
      return G__5237
    }()
  };
  var partial__5 = function() {
    var G__5239__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__5240__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__5240 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__5240__delegate.call(this, args)
        };
        G__5240.cljs$lang$maxFixedArity = 0;
        G__5240.cljs$lang$applyTo = function(arglist__5241) {
          var args = cljs.core.seq(arglist__5241);
          return G__5240__delegate(args)
        };
        G__5240.cljs$lang$arity$variadic = G__5240__delegate;
        return G__5240
      }()
    };
    var G__5239 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5239__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__5239.cljs$lang$maxFixedArity = 4;
    G__5239.cljs$lang$applyTo = function(arglist__5242) {
      var f = cljs.core.first(arglist__5242);
      var arg1 = cljs.core.first(cljs.core.next(arglist__5242));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5242)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5242))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5242))));
      return G__5239__delegate(f, arg1, arg2, arg3, more)
    };
    G__5239.cljs$lang$arity$variadic = G__5239__delegate;
    return G__5239
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__5243 = null;
      var G__5243__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__5243__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__5243__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__5243__4 = function() {
        var G__5244__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__5244 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5244__delegate.call(this, a, b, c, ds)
        };
        G__5244.cljs$lang$maxFixedArity = 3;
        G__5244.cljs$lang$applyTo = function(arglist__5245) {
          var a = cljs.core.first(arglist__5245);
          var b = cljs.core.first(cljs.core.next(arglist__5245));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5245)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5245)));
          return G__5244__delegate(a, b, c, ds)
        };
        G__5244.cljs$lang$arity$variadic = G__5244__delegate;
        return G__5244
      }();
      G__5243 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__5243__1.call(this, a);
          case 2:
            return G__5243__2.call(this, a, b);
          case 3:
            return G__5243__3.call(this, a, b, c);
          default:
            return G__5243__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5243.cljs$lang$maxFixedArity = 3;
      G__5243.cljs$lang$applyTo = G__5243__4.cljs$lang$applyTo;
      return G__5243
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__5246 = null;
      var G__5246__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5246__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__5246__4 = function() {
        var G__5247__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__5247 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5247__delegate.call(this, a, b, c, ds)
        };
        G__5247.cljs$lang$maxFixedArity = 3;
        G__5247.cljs$lang$applyTo = function(arglist__5248) {
          var a = cljs.core.first(arglist__5248);
          var b = cljs.core.first(cljs.core.next(arglist__5248));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5248)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5248)));
          return G__5247__delegate(a, b, c, ds)
        };
        G__5247.cljs$lang$arity$variadic = G__5247__delegate;
        return G__5247
      }();
      G__5246 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5246__2.call(this, a, b);
          case 3:
            return G__5246__3.call(this, a, b, c);
          default:
            return G__5246__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5246.cljs$lang$maxFixedArity = 3;
      G__5246.cljs$lang$applyTo = G__5246__4.cljs$lang$applyTo;
      return G__5246
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__5249 = null;
      var G__5249__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__5249__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__5249__4 = function() {
        var G__5250__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__5250 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5250__delegate.call(this, a, b, c, ds)
        };
        G__5250.cljs$lang$maxFixedArity = 3;
        G__5250.cljs$lang$applyTo = function(arglist__5251) {
          var a = cljs.core.first(arglist__5251);
          var b = cljs.core.first(cljs.core.next(arglist__5251));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5251)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5251)));
          return G__5250__delegate(a, b, c, ds)
        };
        G__5250.cljs$lang$arity$variadic = G__5250__delegate;
        return G__5250
      }();
      G__5249 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__5249__2.call(this, a, b);
          case 3:
            return G__5249__3.call(this, a, b, c);
          default:
            return G__5249__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__5249.cljs$lang$maxFixedArity = 3;
      G__5249.cljs$lang$applyTo = G__5249__4.cljs$lang$applyTo;
      return G__5249
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__5254 = function mpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5252 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5252)) {
        var s__5253 = temp__3974__auto____5252;
        return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__5253)), mpi.call(null, idx + 1, cljs.core.rest.call(null, s__5253)))
      }else {
        return null
      }
    })
  };
  return mapi__5254.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5255 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5255)) {
      var s__5256 = temp__3974__auto____5255;
      var x__5257 = f.call(null, cljs.core.first.call(null, s__5256));
      if(x__5257 == null) {
        return keep.call(null, f, cljs.core.rest.call(null, s__5256))
      }else {
        return cljs.core.cons.call(null, x__5257, keep.call(null, f, cljs.core.rest.call(null, s__5256)))
      }
    }else {
      return null
    }
  })
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__5267 = function kpi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5264 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5264)) {
        var s__5265 = temp__3974__auto____5264;
        var x__5266 = f.call(null, idx, cljs.core.first.call(null, s__5265));
        if(x__5266 == null) {
          return kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5265))
        }else {
          return cljs.core.cons.call(null, x__5266, kpi.call(null, idx + 1, cljs.core.rest.call(null, s__5265)))
        }
      }else {
        return null
      }
    })
  };
  return keepi__5267.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5274 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5274)) {
            return p.call(null, y)
          }else {
            return and__3822__auto____5274
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5275 = p.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5275)) {
            var and__3822__auto____5276 = p.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5276)) {
              return p.call(null, z)
            }else {
              return and__3822__auto____5276
            }
          }else {
            return and__3822__auto____5275
          }
        }())
      };
      var ep1__4 = function() {
        var G__5312__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5277 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5277)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3822__auto____5277
            }
          }())
        };
        var G__5312 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5312__delegate.call(this, x, y, z, args)
        };
        G__5312.cljs$lang$maxFixedArity = 3;
        G__5312.cljs$lang$applyTo = function(arglist__5313) {
          var x = cljs.core.first(arglist__5313);
          var y = cljs.core.first(cljs.core.next(arglist__5313));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5313)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5313)));
          return G__5312__delegate(x, y, z, args)
        };
        G__5312.cljs$lang$arity$variadic = G__5312__delegate;
        return G__5312
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5278 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5278)) {
            return p2.call(null, x)
          }else {
            return and__3822__auto____5278
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5279 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5279)) {
            var and__3822__auto____5280 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5280)) {
              var and__3822__auto____5281 = p2.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5281)) {
                return p2.call(null, y)
              }else {
                return and__3822__auto____5281
              }
            }else {
              return and__3822__auto____5280
            }
          }else {
            return and__3822__auto____5279
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5282 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5282)) {
            var and__3822__auto____5283 = p1.call(null, y);
            if(cljs.core.truth_(and__3822__auto____5283)) {
              var and__3822__auto____5284 = p1.call(null, z);
              if(cljs.core.truth_(and__3822__auto____5284)) {
                var and__3822__auto____5285 = p2.call(null, x);
                if(cljs.core.truth_(and__3822__auto____5285)) {
                  var and__3822__auto____5286 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5286)) {
                    return p2.call(null, z)
                  }else {
                    return and__3822__auto____5286
                  }
                }else {
                  return and__3822__auto____5285
                }
              }else {
                return and__3822__auto____5284
              }
            }else {
              return and__3822__auto____5283
            }
          }else {
            return and__3822__auto____5282
          }
        }())
      };
      var ep2__4 = function() {
        var G__5314__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5287 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5287)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5258_SHARP_) {
                var and__3822__auto____5288 = p1.call(null, p1__5258_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5288)) {
                  return p2.call(null, p1__5258_SHARP_)
                }else {
                  return and__3822__auto____5288
                }
              }, args)
            }else {
              return and__3822__auto____5287
            }
          }())
        };
        var G__5314 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5314__delegate.call(this, x, y, z, args)
        };
        G__5314.cljs$lang$maxFixedArity = 3;
        G__5314.cljs$lang$applyTo = function(arglist__5315) {
          var x = cljs.core.first(arglist__5315);
          var y = cljs.core.first(cljs.core.next(arglist__5315));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5315)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5315)));
          return G__5314__delegate(x, y, z, args)
        };
        G__5314.cljs$lang$arity$variadic = G__5314__delegate;
        return G__5314
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5289 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5289)) {
            var and__3822__auto____5290 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5290)) {
              return p3.call(null, x)
            }else {
              return and__3822__auto____5290
            }
          }else {
            return and__3822__auto____5289
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5291 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5291)) {
            var and__3822__auto____5292 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5292)) {
              var and__3822__auto____5293 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5293)) {
                var and__3822__auto____5294 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5294)) {
                  var and__3822__auto____5295 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5295)) {
                    return p3.call(null, y)
                  }else {
                    return and__3822__auto____5295
                  }
                }else {
                  return and__3822__auto____5294
                }
              }else {
                return and__3822__auto____5293
              }
            }else {
              return and__3822__auto____5292
            }
          }else {
            return and__3822__auto____5291
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3822__auto____5296 = p1.call(null, x);
          if(cljs.core.truth_(and__3822__auto____5296)) {
            var and__3822__auto____5297 = p2.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5297)) {
              var and__3822__auto____5298 = p3.call(null, x);
              if(cljs.core.truth_(and__3822__auto____5298)) {
                var and__3822__auto____5299 = p1.call(null, y);
                if(cljs.core.truth_(and__3822__auto____5299)) {
                  var and__3822__auto____5300 = p2.call(null, y);
                  if(cljs.core.truth_(and__3822__auto____5300)) {
                    var and__3822__auto____5301 = p3.call(null, y);
                    if(cljs.core.truth_(and__3822__auto____5301)) {
                      var and__3822__auto____5302 = p1.call(null, z);
                      if(cljs.core.truth_(and__3822__auto____5302)) {
                        var and__3822__auto____5303 = p2.call(null, z);
                        if(cljs.core.truth_(and__3822__auto____5303)) {
                          return p3.call(null, z)
                        }else {
                          return and__3822__auto____5303
                        }
                      }else {
                        return and__3822__auto____5302
                      }
                    }else {
                      return and__3822__auto____5301
                    }
                  }else {
                    return and__3822__auto____5300
                  }
                }else {
                  return and__3822__auto____5299
                }
              }else {
                return and__3822__auto____5298
              }
            }else {
              return and__3822__auto____5297
            }
          }else {
            return and__3822__auto____5296
          }
        }())
      };
      var ep3__4 = function() {
        var G__5316__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3822__auto____5304 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3822__auto____5304)) {
              return cljs.core.every_QMARK_.call(null, function(p1__5259_SHARP_) {
                var and__3822__auto____5305 = p1.call(null, p1__5259_SHARP_);
                if(cljs.core.truth_(and__3822__auto____5305)) {
                  var and__3822__auto____5306 = p2.call(null, p1__5259_SHARP_);
                  if(cljs.core.truth_(and__3822__auto____5306)) {
                    return p3.call(null, p1__5259_SHARP_)
                  }else {
                    return and__3822__auto____5306
                  }
                }else {
                  return and__3822__auto____5305
                }
              }, args)
            }else {
              return and__3822__auto____5304
            }
          }())
        };
        var G__5316 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5316__delegate.call(this, x, y, z, args)
        };
        G__5316.cljs$lang$maxFixedArity = 3;
        G__5316.cljs$lang$applyTo = function(arglist__5317) {
          var x = cljs.core.first(arglist__5317);
          var y = cljs.core.first(cljs.core.next(arglist__5317));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5317)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5317)));
          return G__5316__delegate(x, y, z, args)
        };
        G__5316.cljs$lang$arity$variadic = G__5316__delegate;
        return G__5316
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__5318__delegate = function(p1, p2, p3, ps) {
      var ps__5307 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__5260_SHARP_) {
            return p1__5260_SHARP_.call(null, x)
          }, ps__5307)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__5261_SHARP_) {
            var and__3822__auto____5308 = p1__5261_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5308)) {
              return p1__5261_SHARP_.call(null, y)
            }else {
              return and__3822__auto____5308
            }
          }, ps__5307)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__5262_SHARP_) {
            var and__3822__auto____5309 = p1__5262_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3822__auto____5309)) {
              var and__3822__auto____5310 = p1__5262_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3822__auto____5310)) {
                return p1__5262_SHARP_.call(null, z)
              }else {
                return and__3822__auto____5310
              }
            }else {
              return and__3822__auto____5309
            }
          }, ps__5307)
        };
        var epn__4 = function() {
          var G__5319__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3822__auto____5311 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3822__auto____5311)) {
                return cljs.core.every_QMARK_.call(null, function(p1__5263_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__5263_SHARP_, args)
                }, ps__5307)
              }else {
                return and__3822__auto____5311
              }
            }())
          };
          var G__5319 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5319__delegate.call(this, x, y, z, args)
          };
          G__5319.cljs$lang$maxFixedArity = 3;
          G__5319.cljs$lang$applyTo = function(arglist__5320) {
            var x = cljs.core.first(arglist__5320);
            var y = cljs.core.first(cljs.core.next(arglist__5320));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5320)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5320)));
            return G__5319__delegate(x, y, z, args)
          };
          G__5319.cljs$lang$arity$variadic = G__5319__delegate;
          return G__5319
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__5318 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5318__delegate.call(this, p1, p2, p3, ps)
    };
    G__5318.cljs$lang$maxFixedArity = 3;
    G__5318.cljs$lang$applyTo = function(arglist__5321) {
      var p1 = cljs.core.first(arglist__5321);
      var p2 = cljs.core.first(cljs.core.next(arglist__5321));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5321)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5321)));
      return G__5318__delegate(p1, p2, p3, ps)
    };
    G__5318.cljs$lang$arity$variadic = G__5318__delegate;
    return G__5318
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3824__auto____5323 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5323)) {
          return or__3824__auto____5323
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3824__auto____5324 = p.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5324)) {
          return or__3824__auto____5324
        }else {
          var or__3824__auto____5325 = p.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5325)) {
            return or__3824__auto____5325
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__5361__delegate = function(x, y, z, args) {
          var or__3824__auto____5326 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5326)) {
            return or__3824__auto____5326
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__5361 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5361__delegate.call(this, x, y, z, args)
        };
        G__5361.cljs$lang$maxFixedArity = 3;
        G__5361.cljs$lang$applyTo = function(arglist__5362) {
          var x = cljs.core.first(arglist__5362);
          var y = cljs.core.first(cljs.core.next(arglist__5362));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5362)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5362)));
          return G__5361__delegate(x, y, z, args)
        };
        G__5361.cljs$lang$arity$variadic = G__5361__delegate;
        return G__5361
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3824__auto____5327 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5327)) {
          return or__3824__auto____5327
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3824__auto____5328 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5328)) {
          return or__3824__auto____5328
        }else {
          var or__3824__auto____5329 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5329)) {
            return or__3824__auto____5329
          }else {
            var or__3824__auto____5330 = p2.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5330)) {
              return or__3824__auto____5330
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3824__auto____5331 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5331)) {
          return or__3824__auto____5331
        }else {
          var or__3824__auto____5332 = p1.call(null, y);
          if(cljs.core.truth_(or__3824__auto____5332)) {
            return or__3824__auto____5332
          }else {
            var or__3824__auto____5333 = p1.call(null, z);
            if(cljs.core.truth_(or__3824__auto____5333)) {
              return or__3824__auto____5333
            }else {
              var or__3824__auto____5334 = p2.call(null, x);
              if(cljs.core.truth_(or__3824__auto____5334)) {
                return or__3824__auto____5334
              }else {
                var or__3824__auto____5335 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5335)) {
                  return or__3824__auto____5335
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__5363__delegate = function(x, y, z, args) {
          var or__3824__auto____5336 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5336)) {
            return or__3824__auto____5336
          }else {
            return cljs.core.some.call(null, function(p1__5268_SHARP_) {
              var or__3824__auto____5337 = p1.call(null, p1__5268_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5337)) {
                return or__3824__auto____5337
              }else {
                return p2.call(null, p1__5268_SHARP_)
              }
            }, args)
          }
        };
        var G__5363 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5363__delegate.call(this, x, y, z, args)
        };
        G__5363.cljs$lang$maxFixedArity = 3;
        G__5363.cljs$lang$applyTo = function(arglist__5364) {
          var x = cljs.core.first(arglist__5364);
          var y = cljs.core.first(cljs.core.next(arglist__5364));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5364)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5364)));
          return G__5363__delegate(x, y, z, args)
        };
        G__5363.cljs$lang$arity$variadic = G__5363__delegate;
        return G__5363
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3824__auto____5338 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5338)) {
          return or__3824__auto____5338
        }else {
          var or__3824__auto____5339 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5339)) {
            return or__3824__auto____5339
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3824__auto____5340 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5340)) {
          return or__3824__auto____5340
        }else {
          var or__3824__auto____5341 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5341)) {
            return or__3824__auto____5341
          }else {
            var or__3824__auto____5342 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5342)) {
              return or__3824__auto____5342
            }else {
              var or__3824__auto____5343 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5343)) {
                return or__3824__auto____5343
              }else {
                var or__3824__auto____5344 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5344)) {
                  return or__3824__auto____5344
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3824__auto____5345 = p1.call(null, x);
        if(cljs.core.truth_(or__3824__auto____5345)) {
          return or__3824__auto____5345
        }else {
          var or__3824__auto____5346 = p2.call(null, x);
          if(cljs.core.truth_(or__3824__auto____5346)) {
            return or__3824__auto____5346
          }else {
            var or__3824__auto____5347 = p3.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5347)) {
              return or__3824__auto____5347
            }else {
              var or__3824__auto____5348 = p1.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5348)) {
                return or__3824__auto____5348
              }else {
                var or__3824__auto____5349 = p2.call(null, y);
                if(cljs.core.truth_(or__3824__auto____5349)) {
                  return or__3824__auto____5349
                }else {
                  var or__3824__auto____5350 = p3.call(null, y);
                  if(cljs.core.truth_(or__3824__auto____5350)) {
                    return or__3824__auto____5350
                  }else {
                    var or__3824__auto____5351 = p1.call(null, z);
                    if(cljs.core.truth_(or__3824__auto____5351)) {
                      return or__3824__auto____5351
                    }else {
                      var or__3824__auto____5352 = p2.call(null, z);
                      if(cljs.core.truth_(or__3824__auto____5352)) {
                        return or__3824__auto____5352
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__5365__delegate = function(x, y, z, args) {
          var or__3824__auto____5353 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3824__auto____5353)) {
            return or__3824__auto____5353
          }else {
            return cljs.core.some.call(null, function(p1__5269_SHARP_) {
              var or__3824__auto____5354 = p1.call(null, p1__5269_SHARP_);
              if(cljs.core.truth_(or__3824__auto____5354)) {
                return or__3824__auto____5354
              }else {
                var or__3824__auto____5355 = p2.call(null, p1__5269_SHARP_);
                if(cljs.core.truth_(or__3824__auto____5355)) {
                  return or__3824__auto____5355
                }else {
                  return p3.call(null, p1__5269_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__5365 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__5365__delegate.call(this, x, y, z, args)
        };
        G__5365.cljs$lang$maxFixedArity = 3;
        G__5365.cljs$lang$applyTo = function(arglist__5366) {
          var x = cljs.core.first(arglist__5366);
          var y = cljs.core.first(cljs.core.next(arglist__5366));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5366)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5366)));
          return G__5365__delegate(x, y, z, args)
        };
        G__5365.cljs$lang$arity$variadic = G__5365__delegate;
        return G__5365
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__5367__delegate = function(p1, p2, p3, ps) {
      var ps__5356 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__5270_SHARP_) {
            return p1__5270_SHARP_.call(null, x)
          }, ps__5356)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__5271_SHARP_) {
            var or__3824__auto____5357 = p1__5271_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5357)) {
              return or__3824__auto____5357
            }else {
              return p1__5271_SHARP_.call(null, y)
            }
          }, ps__5356)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__5272_SHARP_) {
            var or__3824__auto____5358 = p1__5272_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3824__auto____5358)) {
              return or__3824__auto____5358
            }else {
              var or__3824__auto____5359 = p1__5272_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3824__auto____5359)) {
                return or__3824__auto____5359
              }else {
                return p1__5272_SHARP_.call(null, z)
              }
            }
          }, ps__5356)
        };
        var spn__4 = function() {
          var G__5368__delegate = function(x, y, z, args) {
            var or__3824__auto____5360 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3824__auto____5360)) {
              return or__3824__auto____5360
            }else {
              return cljs.core.some.call(null, function(p1__5273_SHARP_) {
                return cljs.core.some.call(null, p1__5273_SHARP_, args)
              }, ps__5356)
            }
          };
          var G__5368 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__5368__delegate.call(this, x, y, z, args)
          };
          G__5368.cljs$lang$maxFixedArity = 3;
          G__5368.cljs$lang$applyTo = function(arglist__5369) {
            var x = cljs.core.first(arglist__5369);
            var y = cljs.core.first(cljs.core.next(arglist__5369));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5369)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5369)));
            return G__5368__delegate(x, y, z, args)
          };
          G__5368.cljs$lang$arity$variadic = G__5368__delegate;
          return G__5368
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__5367 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__5367__delegate.call(this, p1, p2, p3, ps)
    };
    G__5367.cljs$lang$maxFixedArity = 3;
    G__5367.cljs$lang$applyTo = function(arglist__5370) {
      var p1 = cljs.core.first(arglist__5370);
      var p2 = cljs.core.first(cljs.core.next(arglist__5370));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5370)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5370)));
      return G__5367__delegate(p1, p2, p3, ps)
    };
    G__5367.cljs$lang$arity$variadic = G__5367__delegate;
    return G__5367
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5371 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5371)) {
        var s__5372 = temp__3974__auto____5371;
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__5372)), map.call(null, f, cljs.core.rest.call(null, s__5372)))
      }else {
        return null
      }
    })
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5373 = cljs.core.seq.call(null, c1);
      var s2__5374 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5375 = s1__5373;
        if(cljs.core.truth_(and__3822__auto____5375)) {
          return s2__5374
        }else {
          return and__3822__auto____5375
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5373), cljs.core.first.call(null, s2__5374)), map.call(null, f, cljs.core.rest.call(null, s1__5373), cljs.core.rest.call(null, s2__5374)))
      }else {
        return null
      }
    })
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5376 = cljs.core.seq.call(null, c1);
      var s2__5377 = cljs.core.seq.call(null, c2);
      var s3__5378 = cljs.core.seq.call(null, c3);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5379 = s1__5376;
        if(cljs.core.truth_(and__3822__auto____5379)) {
          var and__3822__auto____5380 = s2__5377;
          if(cljs.core.truth_(and__3822__auto____5380)) {
            return s3__5378
          }else {
            return and__3822__auto____5380
          }
        }else {
          return and__3822__auto____5379
        }
      }())) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__5376), cljs.core.first.call(null, s2__5377), cljs.core.first.call(null, s3__5378)), map.call(null, f, cljs.core.rest.call(null, s1__5376), cljs.core.rest.call(null, s2__5377), cljs.core.rest.call(null, s3__5378)))
      }else {
        return null
      }
    })
  };
  var map__5 = function() {
    var G__5383__delegate = function(f, c1, c2, c3, colls) {
      var step__5382 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__5381 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5381)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__5381), step.call(null, map.call(null, cljs.core.rest, ss__5381)))
          }else {
            return null
          }
        })
      };
      return map.call(null, function(p1__5322_SHARP_) {
        return cljs.core.apply.call(null, f, p1__5322_SHARP_)
      }, step__5382.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__5383 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5383__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5383.cljs$lang$maxFixedArity = 4;
    G__5383.cljs$lang$applyTo = function(arglist__5384) {
      var f = cljs.core.first(arglist__5384);
      var c1 = cljs.core.first(cljs.core.next(arglist__5384));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5384)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5384))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5384))));
      return G__5383__delegate(f, c1, c2, c3, colls)
    };
    G__5383.cljs$lang$arity$variadic = G__5383__delegate;
    return G__5383
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__3974__auto____5385 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5385)) {
        var s__5386 = temp__3974__auto____5385;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__5386), take.call(null, n - 1, cljs.core.rest.call(null, s__5386)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.drop = function drop(n, coll) {
  var step__5389 = function(n, coll) {
    while(true) {
      var s__5387 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5388 = n > 0;
        if(and__3822__auto____5388) {
          return s__5387
        }else {
          return and__3822__auto____5388
        }
      }())) {
        var G__5390 = n - 1;
        var G__5391 = cljs.core.rest.call(null, s__5387);
        n = G__5390;
        coll = G__5391;
        continue
      }else {
        return s__5387
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5389.call(null, n, coll)
  })
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__5392 = cljs.core.seq.call(null, coll);
  var lead__5393 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(cljs.core.truth_(lead__5393)) {
      var G__5394 = cljs.core.next.call(null, s__5392);
      var G__5395 = cljs.core.next.call(null, lead__5393);
      s__5392 = G__5394;
      lead__5393 = G__5395;
      continue
    }else {
      return s__5392
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__5398 = function(pred, coll) {
    while(true) {
      var s__5396 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5397 = s__5396;
        if(cljs.core.truth_(and__3822__auto____5397)) {
          return pred.call(null, cljs.core.first.call(null, s__5396))
        }else {
          return and__3822__auto____5397
        }
      }())) {
        var G__5399 = pred;
        var G__5400 = cljs.core.rest.call(null, s__5396);
        pred = G__5399;
        coll = G__5400;
        continue
      }else {
        return s__5396
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__5398.call(null, pred, coll)
  })
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5401 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5401)) {
      var s__5402 = temp__3974__auto____5401;
      return cljs.core.concat.call(null, s__5402, cycle.call(null, s__5402))
    }else {
      return null
    }
  })
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)])
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    })
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    })
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__5403 = cljs.core.seq.call(null, c1);
      var s2__5404 = cljs.core.seq.call(null, c2);
      if(cljs.core.truth_(function() {
        var and__3822__auto____5405 = s1__5403;
        if(cljs.core.truth_(and__3822__auto____5405)) {
          return s2__5404
        }else {
          return and__3822__auto____5405
        }
      }())) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__5403), cljs.core.cons.call(null, cljs.core.first.call(null, s2__5404), interleave.call(null, cljs.core.rest.call(null, s1__5403), cljs.core.rest.call(null, s2__5404))))
      }else {
        return null
      }
    })
  };
  var interleave__3 = function() {
    var G__5407__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__5406 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__5406)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__5406), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__5406)))
        }else {
          return null
        }
      })
    };
    var G__5407 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5407__delegate.call(this, c1, c2, colls)
    };
    G__5407.cljs$lang$maxFixedArity = 2;
    G__5407.cljs$lang$applyTo = function(arglist__5408) {
      var c1 = cljs.core.first(arglist__5408);
      var c2 = cljs.core.first(cljs.core.next(arglist__5408));
      var colls = cljs.core.rest(cljs.core.next(arglist__5408));
      return G__5407__delegate(c1, c2, colls)
    };
    G__5407.cljs$lang$arity$variadic = G__5407__delegate;
    return G__5407
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__5411 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____5409 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____5409)) {
        var coll__5410 = temp__3971__auto____5409;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__5410), cat.call(null, cljs.core.rest.call(null, coll__5410), colls))
      }else {
        if(cljs.core.truth_(cljs.core.seq.call(null, colls))) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    })
  };
  return cat__5411.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__5412__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__5412 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__5412__delegate.call(this, f, coll, colls)
    };
    G__5412.cljs$lang$maxFixedArity = 2;
    G__5412.cljs$lang$applyTo = function(arglist__5413) {
      var f = cljs.core.first(arglist__5413);
      var coll = cljs.core.first(cljs.core.next(arglist__5413));
      var colls = cljs.core.rest(cljs.core.next(arglist__5413));
      return G__5412__delegate(f, coll, colls)
    };
    G__5412.cljs$lang$arity$variadic = G__5412__delegate;
    return G__5412
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____5414 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____5414)) {
      var s__5415 = temp__3974__auto____5414;
      var f__5416 = cljs.core.first.call(null, s__5415);
      var r__5417 = cljs.core.rest.call(null, s__5415);
      if(cljs.core.truth_(pred.call(null, f__5416))) {
        return cljs.core.cons.call(null, f__5416, filter.call(null, pred, r__5417))
      }else {
        return filter.call(null, pred, r__5417)
      }
    }else {
      return null
    }
  })
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__5419 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    })
  };
  return walk__5419.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__5418_SHARP_) {
    return cljs.core.not.call(null, cljs.core.sequential_QMARK_.call(null, p1__5418_SHARP_))
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__5420__5421 = to;
    if(G__5420__5421 != null) {
      if(function() {
        var or__3824__auto____5422 = G__5420__5421.cljs$lang$protocol_mask$partition0$ & 2147483648;
        if(or__3824__auto____5422) {
          return or__3824__auto____5422
        }else {
          return G__5420__5421.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__5420__5421.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5420__5421)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__5420__5421)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__5423__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.fromArray([]), cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__5423 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__5423__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__5423.cljs$lang$maxFixedArity = 4;
    G__5423.cljs$lang$applyTo = function(arglist__5424) {
      var f = cljs.core.first(arglist__5424);
      var c1 = cljs.core.first(cljs.core.next(arglist__5424));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5424)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5424))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__5424))));
      return G__5423__delegate(f, c1, c2, c3, colls)
    };
    G__5423.cljs$lang$arity$variadic = G__5423__delegate;
    return G__5423
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.fromArray([])), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5425 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5425)) {
        var s__5426 = temp__3974__auto____5425;
        var p__5427 = cljs.core.take.call(null, n, s__5426);
        if(n === cljs.core.count.call(null, p__5427)) {
          return cljs.core.cons.call(null, p__5427, partition.call(null, n, step, cljs.core.drop.call(null, step, s__5426)))
        }else {
          return null
        }
      }else {
        return null
      }
    })
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____5428 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____5428)) {
        var s__5429 = temp__3974__auto____5428;
        var p__5430 = cljs.core.take.call(null, n, s__5429);
        if(n === cljs.core.count.call(null, p__5430)) {
          return cljs.core.cons.call(null, p__5430, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__5429)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__5430, pad)))
        }
      }else {
        return null
      }
    })
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__5431 = cljs.core.lookup_sentinel;
    var m__5432 = m;
    var ks__5433 = cljs.core.seq.call(null, ks);
    while(true) {
      if(cljs.core.truth_(ks__5433)) {
        var m__5434 = cljs.core.get.call(null, m__5432, cljs.core.first.call(null, ks__5433), sentinel__5431);
        if(sentinel__5431 === m__5434) {
          return not_found
        }else {
          var G__5435 = sentinel__5431;
          var G__5436 = m__5434;
          var G__5437 = cljs.core.next.call(null, ks__5433);
          sentinel__5431 = G__5435;
          m__5432 = G__5436;
          ks__5433 = G__5437;
          continue
        }
      }else {
        return m__5432
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__5438, v) {
  var vec__5439__5440 = p__5438;
  var k__5441 = cljs.core.nth.call(null, vec__5439__5440, 0, null);
  var ks__5442 = cljs.core.nthnext.call(null, vec__5439__5440, 1);
  if(cljs.core.truth_(ks__5442)) {
    return cljs.core.assoc.call(null, m, k__5441, assoc_in.call(null, cljs.core.get.call(null, m, k__5441), ks__5442, v))
  }else {
    return cljs.core.assoc.call(null, m, k__5441, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__5443, f, args) {
    var vec__5444__5445 = p__5443;
    var k__5446 = cljs.core.nth.call(null, vec__5444__5445, 0, null);
    var ks__5447 = cljs.core.nthnext.call(null, vec__5444__5445, 1);
    if(cljs.core.truth_(ks__5447)) {
      return cljs.core.assoc.call(null, m, k__5446, cljs.core.apply.call(null, update_in, cljs.core.get.call(null, m, k__5446), ks__5447, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__5446, cljs.core.apply.call(null, f, cljs.core.get.call(null, m, k__5446), args))
    }
  };
  var update_in = function(m, p__5443, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__5443, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__5448) {
    var m = cljs.core.first(arglist__5448);
    var p__5443 = cljs.core.first(cljs.core.next(arglist__5448));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__5448)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__5448)));
    return update_in__delegate(m, p__5443, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$ = true;
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5453 = this;
  var h__364__auto____5454 = this__5453.__hash;
  if(h__364__auto____5454 != null) {
    return h__364__auto____5454
  }else {
    var h__364__auto____5455 = cljs.core.hash_coll.call(null, coll);
    this__5453.__hash = h__364__auto____5455;
    return h__364__auto____5455
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$ = true;
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5456 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5457 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$ = true;
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5458 = this;
  var new_array__5459 = cljs.core.aclone.call(null, this__5458.array);
  new_array__5459[k] = v;
  return new cljs.core.Vector(this__5458.meta, new_array__5459, null)
};
cljs.core.Vector.prototype.cljs$core$IFn$ = true;
cljs.core.Vector.prototype.call = function() {
  var G__5488 = null;
  var G__5488__2 = function(tsym5451, k) {
    var this__5460 = this;
    var tsym5451__5461 = this;
    var coll__5462 = tsym5451__5461;
    return cljs.core._lookup.call(null, coll__5462, k)
  };
  var G__5488__3 = function(tsym5452, k, not_found) {
    var this__5463 = this;
    var tsym5452__5464 = this;
    var coll__5465 = tsym5452__5464;
    return cljs.core._lookup.call(null, coll__5465, k, not_found)
  };
  G__5488 = function(tsym5452, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5488__2.call(this, tsym5452, k);
      case 3:
        return G__5488__3.call(this, tsym5452, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5488
}();
cljs.core.Vector.prototype.apply = function(tsym5449, args5450) {
  return tsym5449.call.apply(tsym5449, [tsym5449].concat(cljs.core.aclone.call(null, args5450)))
};
cljs.core.Vector.prototype.cljs$core$ISequential$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$ = true;
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5466 = this;
  var new_array__5467 = cljs.core.aclone.call(null, this__5466.array);
  new_array__5467.push(o);
  return new cljs.core.Vector(this__5466.meta, new_array__5467, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__5468 = this;
  var this$__5469 = this;
  return cljs.core.pr_str.call(null, this$__5469)
};
cljs.core.Vector.prototype.cljs$core$IReduce$ = true;
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5470 = this;
  return cljs.core.ci_reduce.call(null, this__5470.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5471 = this;
  return cljs.core.ci_reduce.call(null, this__5471.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$ = true;
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5472 = this;
  if(this__5472.array.length > 0) {
    var vector_seq__5473 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__5472.array.length) {
          return cljs.core.cons.call(null, this__5472.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      })
    };
    return vector_seq__5473.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$ = true;
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5474 = this;
  return this__5474.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$ = true;
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5475 = this;
  var count__5476 = this__5475.array.length;
  if(count__5476 > 0) {
    return this__5475.array[count__5476 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5477 = this;
  if(this__5477.array.length > 0) {
    var new_array__5478 = cljs.core.aclone.call(null, this__5477.array);
    new_array__5478.pop();
    return new cljs.core.Vector(this__5477.meta, new_array__5478, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$ = true;
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5479 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$ = true;
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5480 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5481 = this;
  return new cljs.core.Vector(meta, this__5481.array, this__5481.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$ = true;
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5482 = this;
  return this__5482.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$ = true;
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5484 = this;
  if(function() {
    var and__3822__auto____5485 = 0 <= n;
    if(and__3822__auto____5485) {
      return n < this__5484.array.length
    }else {
      return and__3822__auto____5485
    }
  }()) {
    return this__5484.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5486 = this;
  if(function() {
    var and__3822__auto____5487 = 0 <= n;
    if(and__3822__auto____5487) {
      return n < this__5486.array.length
    }else {
      return and__3822__auto____5487
    }
  }()) {
    return this__5486.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5483 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5483.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__455__auto__) {
  return cljs.core.list.call(null, "cljs.core.VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__5489 = pv.cnt;
  if(cnt__5489 < 32) {
    return 0
  }else {
    return cnt__5489 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__5490 = level;
  var ret__5491 = node;
  while(true) {
    if(ll__5490 === 0) {
      return ret__5491
    }else {
      var embed__5492 = ret__5491;
      var r__5493 = cljs.core.pv_fresh_node.call(null, edit);
      var ___5494 = cljs.core.pv_aset.call(null, r__5493, 0, embed__5492);
      var G__5495 = ll__5490 - 5;
      var G__5496 = r__5493;
      ll__5490 = G__5495;
      ret__5491 = G__5496;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__5497 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__5498 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__5497, subidx__5498, tailnode);
    return ret__5497
  }else {
    var temp__3971__auto____5499 = cljs.core.pv_aget.call(null, parent, subidx__5498);
    if(cljs.core.truth_(temp__3971__auto____5499)) {
      var child__5500 = temp__3971__auto____5499;
      var node_to_insert__5501 = push_tail.call(null, pv, level - 5, child__5500, tailnode);
      cljs.core.pv_aset.call(null, ret__5497, subidx__5498, node_to_insert__5501);
      return ret__5497
    }else {
      var node_to_insert__5502 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__5497, subidx__5498, node_to_insert__5502);
      return ret__5497
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3822__auto____5503 = 0 <= i;
    if(and__3822__auto____5503) {
      return i < pv.cnt
    }else {
      return and__3822__auto____5503
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__5504 = pv.root;
      var level__5505 = pv.shift;
      while(true) {
        if(level__5505 > 0) {
          var G__5506 = cljs.core.pv_aget.call(null, node__5504, i >>> level__5505 & 31);
          var G__5507 = level__5505 - 5;
          node__5504 = G__5506;
          level__5505 = G__5507;
          continue
        }else {
          return node__5504.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__5508 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__5508, i & 31, val);
    return ret__5508
  }else {
    var subidx__5509 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__5508, subidx__5509, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5509), i, val));
    return ret__5508
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__5510 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5511 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__5510));
    if(function() {
      var and__3822__auto____5512 = new_child__5511 == null;
      if(and__3822__auto____5512) {
        return subidx__5510 === 0
      }else {
        return and__3822__auto____5512
      }
    }()) {
      return null
    }else {
      var ret__5513 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__5513, subidx__5510, new_child__5511);
      return ret__5513
    }
  }else {
    if(subidx__5510 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__5514 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__5514, subidx__5510, null);
        return ret__5514
      }else {
        return null
      }
    }
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.vector_seq = function vector_seq(v, offset) {
  var c__5515 = cljs.core._count.call(null, v);
  if(c__5515 > 0) {
    if(void 0 === cljs.core.t5516) {
      cljs.core.t5516 = function(c, offset, v, vector_seq, __meta__389__auto__) {
        this.c = c;
        this.offset = offset;
        this.v = v;
        this.vector_seq = vector_seq;
        this.__meta__389__auto__ = __meta__389__auto__;
        this.cljs$lang$protocol_mask$partition1$ = 0;
        this.cljs$lang$protocol_mask$partition0$ = 282263648
      };
      cljs.core.t5516.cljs$lang$type = true;
      cljs.core.t5516.cljs$lang$ctorPrSeq = function(this__454__auto__) {
        return cljs.core.list.call(null, "cljs.core.t5516")
      };
      cljs.core.t5516.prototype.cljs$core$ISeqable$ = true;
      cljs.core.t5516.prototype.cljs$core$ISeqable$_seq$arity$1 = function(vseq) {
        var this__5517 = this;
        return vseq
      };
      cljs.core.t5516.prototype.cljs$core$ISeq$ = true;
      cljs.core.t5516.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
        var this__5518 = this;
        return cljs.core._nth.call(null, this__5518.v, this__5518.offset)
      };
      cljs.core.t5516.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
        var this__5519 = this;
        var offset__5520 = this__5519.offset + 1;
        if(offset__5520 < this__5519.c) {
          return this__5519.vector_seq.call(null, this__5519.v, offset__5520)
        }else {
          return cljs.core.List.EMPTY
        }
      };
      cljs.core.t5516.prototype.cljs$core$ASeq$ = true;
      cljs.core.t5516.prototype.cljs$core$IEquiv$ = true;
      cljs.core.t5516.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(vseq, other) {
        var this__5521 = this;
        return cljs.core.equiv_sequential.call(null, vseq, other)
      };
      cljs.core.t5516.prototype.cljs$core$ISequential$ = true;
      cljs.core.t5516.prototype.cljs$core$IPrintable$ = true;
      cljs.core.t5516.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(vseq, opts) {
        var this__5522 = this;
        return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, vseq)
      };
      cljs.core.t5516.prototype.cljs$core$IMeta$ = true;
      cljs.core.t5516.prototype.cljs$core$IMeta$_meta$arity$1 = function(___390__auto__) {
        var this__5523 = this;
        return this__5523.__meta__389__auto__
      };
      cljs.core.t5516.prototype.cljs$core$IWithMeta$ = true;
      cljs.core.t5516.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(___390__auto__, __meta__389__auto__) {
        var this__5524 = this;
        return new cljs.core.t5516(this__5524.c, this__5524.offset, this__5524.v, this__5524.vector_seq, __meta__389__auto__)
      };
      cljs.core.t5516
    }else {
    }
    return new cljs.core.t5516(c__5515, offset, v, vector_seq, null)
  }else {
    return null
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2164209055
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5529 = this;
  return new cljs.core.TransientVector(this__5529.cnt, this__5529.shift, cljs.core.tv_editable_root.call(null, this__5529.root), cljs.core.tv_editable_tail.call(null, this__5529.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5530 = this;
  var h__364__auto____5531 = this__5530.__hash;
  if(h__364__auto____5531 != null) {
    return h__364__auto____5531
  }else {
    var h__364__auto____5532 = cljs.core.hash_coll.call(null, coll);
    this__5530.__hash = h__364__auto____5532;
    return h__364__auto____5532
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5533 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5534 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5535 = this;
  if(function() {
    var and__3822__auto____5536 = 0 <= k;
    if(and__3822__auto____5536) {
      return k < this__5535.cnt
    }else {
      return and__3822__auto____5536
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__5537 = cljs.core.aclone.call(null, this__5535.tail);
      new_tail__5537[k & 31] = v;
      return new cljs.core.PersistentVector(this__5535.meta, this__5535.cnt, this__5535.shift, this__5535.root, new_tail__5537, null)
    }else {
      return new cljs.core.PersistentVector(this__5535.meta, this__5535.cnt, this__5535.shift, cljs.core.do_assoc.call(null, coll, this__5535.shift, this__5535.root, k, v), this__5535.tail, null)
    }
  }else {
    if(k === this__5535.cnt) {
      return cljs.core._conj.call(null, coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__5535.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentVector.prototype.call = function() {
  var G__5582 = null;
  var G__5582__2 = function(tsym5527, k) {
    var this__5538 = this;
    var tsym5527__5539 = this;
    var coll__5540 = tsym5527__5539;
    return cljs.core._lookup.call(null, coll__5540, k)
  };
  var G__5582__3 = function(tsym5528, k, not_found) {
    var this__5541 = this;
    var tsym5528__5542 = this;
    var coll__5543 = tsym5528__5542;
    return cljs.core._lookup.call(null, coll__5543, k, not_found)
  };
  G__5582 = function(tsym5528, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5582__2.call(this, tsym5528, k);
      case 3:
        return G__5582__3.call(this, tsym5528, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5582
}();
cljs.core.PersistentVector.prototype.apply = function(tsym5525, args5526) {
  return tsym5525.call.apply(tsym5525, [tsym5525].concat(cljs.core.aclone.call(null, args5526)))
};
cljs.core.PersistentVector.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__5544 = this;
  var step_init__5545 = [0, init];
  var i__5546 = 0;
  while(true) {
    if(i__5546 < this__5544.cnt) {
      var arr__5547 = cljs.core.array_for.call(null, v, i__5546);
      var len__5548 = arr__5547.length;
      var init__5552 = function() {
        var j__5549 = 0;
        var init__5550 = step_init__5545[1];
        while(true) {
          if(j__5549 < len__5548) {
            var init__5551 = f.call(null, init__5550, j__5549 + i__5546, arr__5547[j__5549]);
            if(cljs.core.reduced_QMARK_.call(null, init__5551)) {
              return init__5551
            }else {
              var G__5583 = j__5549 + 1;
              var G__5584 = init__5551;
              j__5549 = G__5583;
              init__5550 = G__5584;
              continue
            }
          }else {
            step_init__5545[0] = len__5548;
            step_init__5545[1] = init__5550;
            return init__5550
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5552)) {
        return cljs.core.deref.call(null, init__5552)
      }else {
        var G__5585 = i__5546 + step_init__5545[0];
        i__5546 = G__5585;
        continue
      }
    }else {
      return step_init__5545[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5553 = this;
  if(this__5553.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__5554 = cljs.core.aclone.call(null, this__5553.tail);
    new_tail__5554.push(o);
    return new cljs.core.PersistentVector(this__5553.meta, this__5553.cnt + 1, this__5553.shift, this__5553.root, new_tail__5554, null)
  }else {
    var root_overflow_QMARK___5555 = this__5553.cnt >>> 5 > 1 << this__5553.shift;
    var new_shift__5556 = root_overflow_QMARK___5555 ? this__5553.shift + 5 : this__5553.shift;
    var new_root__5558 = root_overflow_QMARK___5555 ? function() {
      var n_r__5557 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__5557, 0, this__5553.root);
      cljs.core.pv_aset.call(null, n_r__5557, 1, cljs.core.new_path.call(null, null, this__5553.shift, new cljs.core.VectorNode(null, this__5553.tail)));
      return n_r__5557
    }() : cljs.core.push_tail.call(null, coll, this__5553.shift, this__5553.root, new cljs.core.VectorNode(null, this__5553.tail));
    return new cljs.core.PersistentVector(this__5553.meta, this__5553.cnt + 1, new_shift__5556, new_root__5558, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__5559 = this;
  return cljs.core._nth.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__5560 = this;
  return cljs.core._nth.call(null, coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__5561 = this;
  var this$__5562 = this;
  return cljs.core.pr_str.call(null, this$__5562)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__5563 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__5564 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5565 = this;
  return cljs.core.vector_seq.call(null, coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5566 = this;
  return this__5566.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5567 = this;
  if(this__5567.cnt > 0) {
    return cljs.core._nth.call(null, coll, this__5567.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5568 = this;
  if(this__5568.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__5568.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5568.meta)
    }else {
      if(1 < this__5568.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__5568.meta, this__5568.cnt - 1, this__5568.shift, this__5568.root, this__5568.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__5569 = cljs.core.array_for.call(null, coll, this__5568.cnt - 2);
          var nr__5570 = cljs.core.pop_tail.call(null, coll, this__5568.shift, this__5568.root);
          var new_root__5571 = nr__5570 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__5570;
          var cnt_1__5572 = this__5568.cnt - 1;
          if(function() {
            var and__3822__auto____5573 = 5 < this__5568.shift;
            if(and__3822__auto____5573) {
              return cljs.core.pv_aget.call(null, new_root__5571, 1) == null
            }else {
              return and__3822__auto____5573
            }
          }()) {
            return new cljs.core.PersistentVector(this__5568.meta, cnt_1__5572, this__5568.shift - 5, cljs.core.pv_aget.call(null, new_root__5571, 0), new_tail__5569, null)
          }else {
            return new cljs.core.PersistentVector(this__5568.meta, cnt_1__5572, this__5568.shift, new_root__5571, new_tail__5569, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5575 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5576 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5577 = this;
  return new cljs.core.PersistentVector(meta, this__5577.cnt, this__5577.shift, this__5577.root, this__5577.tail, this__5577.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5578 = this;
  return this__5578.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5579 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5580 = this;
  if(function() {
    var and__3822__auto____5581 = 0 <= n;
    if(and__3822__auto____5581) {
      return n < this__5580.cnt
    }else {
      return and__3822__auto____5581
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5574 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__5574.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs) {
  var xs__5586 = cljs.core.seq.call(null, xs);
  var out__5587 = cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY);
  while(true) {
    if(cljs.core.truth_(xs__5586)) {
      var G__5588 = cljs.core.next.call(null, xs__5586);
      var G__5589 = cljs.core.conj_BANG_.call(null, out__5587, cljs.core.first.call(null, xs__5586));
      xs__5586 = G__5588;
      out__5587 = G__5589;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5587)
    }
    break
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.PersistentVector.EMPTY, coll)
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__5590) {
    var args = cljs.core.seq(arglist__5590);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16200095
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$ = true;
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5595 = this;
  var h__364__auto____5596 = this__5595.__hash;
  if(h__364__auto____5596 != null) {
    return h__364__auto____5596
  }else {
    var h__364__auto____5597 = cljs.core.hash_coll.call(null, coll);
    this__5595.__hash = h__364__auto____5597;
    return h__364__auto____5597
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$ = true;
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5598 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5599 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$ = true;
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__5600 = this;
  var v_pos__5601 = this__5600.start + key;
  return new cljs.core.Subvec(this__5600.meta, cljs.core._assoc.call(null, this__5600.v, v_pos__5601, val), this__5600.start, this__5600.end > v_pos__5601 + 1 ? this__5600.end : v_pos__5601 + 1, null)
};
cljs.core.Subvec.prototype.cljs$core$IFn$ = true;
cljs.core.Subvec.prototype.call = function() {
  var G__5625 = null;
  var G__5625__2 = function(tsym5593, k) {
    var this__5602 = this;
    var tsym5593__5603 = this;
    var coll__5604 = tsym5593__5603;
    return cljs.core._lookup.call(null, coll__5604, k)
  };
  var G__5625__3 = function(tsym5594, k, not_found) {
    var this__5605 = this;
    var tsym5594__5606 = this;
    var coll__5607 = tsym5594__5606;
    return cljs.core._lookup.call(null, coll__5607, k, not_found)
  };
  G__5625 = function(tsym5594, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5625__2.call(this, tsym5594, k);
      case 3:
        return G__5625__3.call(this, tsym5594, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5625
}();
cljs.core.Subvec.prototype.apply = function(tsym5591, args5592) {
  return tsym5591.call.apply(tsym5591, [tsym5591].concat(cljs.core.aclone.call(null, args5592)))
};
cljs.core.Subvec.prototype.cljs$core$ISequential$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$ = true;
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5608 = this;
  return new cljs.core.Subvec(this__5608.meta, cljs.core._assoc_n.call(null, this__5608.v, this__5608.end, o), this__5608.start, this__5608.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__5609 = this;
  var this$__5610 = this;
  return cljs.core.pr_str.call(null, this$__5610)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$ = true;
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__5611 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__5612 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$ = true;
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5613 = this;
  var subvec_seq__5614 = function subvec_seq(i) {
    if(i === this__5613.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__5613.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }))
    }
  };
  return subvec_seq__5614.call(null, this__5613.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$ = true;
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5615 = this;
  return this__5615.end - this__5615.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$ = true;
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5616 = this;
  return cljs.core._nth.call(null, this__5616.v, this__5616.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5617 = this;
  if(this__5617.start === this__5617.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__5617.meta, this__5617.v, this__5617.start, this__5617.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$ = true;
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__5618 = this;
  return cljs.core._assoc.call(null, coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$ = true;
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5619 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5620 = this;
  return new cljs.core.Subvec(meta, this__5620.v, this__5620.start, this__5620.end, this__5620.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$ = true;
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5621 = this;
  return this__5621.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$ = true;
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5623 = this;
  return cljs.core._nth.call(null, this__5623.v, this__5623.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5624 = this;
  return cljs.core._nth.call(null, this__5624.v, this__5624.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5622 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__5622.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, cljs.core.aclone.call(null, node.arr))
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, cljs.core.aclone.call(null, node.arr))
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__5626 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__5626, 0, tl.length);
  return ret__5626
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__5627 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__5628 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__5627, subidx__5628, level === 5 ? tail_node : function() {
    var child__5629 = cljs.core.pv_aget.call(null, ret__5627, subidx__5628);
    if(child__5629 != null) {
      return tv_push_tail.call(null, tv, level - 5, child__5629, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__5627
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__5630 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__5631 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__5632 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__5630, subidx__5631));
    if(function() {
      var and__3822__auto____5633 = new_child__5632 == null;
      if(and__3822__auto____5633) {
        return subidx__5631 === 0
      }else {
        return and__3822__auto____5633
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__5630, subidx__5631, new_child__5632);
      return node__5630
    }
  }else {
    if(subidx__5631 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__5630, subidx__5631, null);
        return node__5630
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3822__auto____5634 = 0 <= i;
    if(and__3822__auto____5634) {
      return i < tv.cnt
    }else {
      return and__3822__auto____5634
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__5635 = tv.root;
      var node__5636 = root__5635;
      var level__5637 = tv.shift;
      while(true) {
        if(level__5637 > 0) {
          var G__5638 = cljs.core.tv_ensure_editable.call(null, root__5635.edit, cljs.core.pv_aget.call(null, node__5636, i >>> level__5637 & 31));
          var G__5639 = level__5637 - 5;
          node__5636 = G__5638;
          level__5637 = G__5639;
          continue
        }else {
          return node__5636.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 147;
  this.cljs$lang$protocol_mask$partition1$ = 11
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientVector")
};
cljs.core.TransientVector.prototype.cljs$core$IFn$ = true;
cljs.core.TransientVector.prototype.call = function() {
  var G__5677 = null;
  var G__5677__2 = function(tsym5642, k) {
    var this__5644 = this;
    var tsym5642__5645 = this;
    var coll__5646 = tsym5642__5645;
    return cljs.core._lookup.call(null, coll__5646, k)
  };
  var G__5677__3 = function(tsym5643, k, not_found) {
    var this__5647 = this;
    var tsym5643__5648 = this;
    var coll__5649 = tsym5643__5648;
    return cljs.core._lookup.call(null, coll__5649, k, not_found)
  };
  G__5677 = function(tsym5643, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5677__2.call(this, tsym5643, k);
      case 3:
        return G__5677__3.call(this, tsym5643, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5677
}();
cljs.core.TransientVector.prototype.apply = function(tsym5640, args5641) {
  return tsym5640.call.apply(tsym5640, [tsym5640].concat(cljs.core.aclone.call(null, args5641)))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5650 = this;
  return cljs.core._nth.call(null, coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5651 = this;
  return cljs.core._nth.call(null, coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$ = true;
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__5652 = this;
  if(cljs.core.truth_(this__5652.root.edit)) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__5653 = this;
  if(function() {
    var and__3822__auto____5654 = 0 <= n;
    if(and__3822__auto____5654) {
      return n < this__5653.cnt
    }else {
      return and__3822__auto____5654
    }
  }()) {
    return cljs.core._nth.call(null, coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5655 = this;
  if(cljs.core.truth_(this__5655.root.edit)) {
    return this__5655.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__5656 = this;
  if(cljs.core.truth_(this__5656.root.edit)) {
    if(function() {
      var and__3822__auto____5657 = 0 <= n;
      if(and__3822__auto____5657) {
        return n < this__5656.cnt
      }else {
        return and__3822__auto____5657
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__5656.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__5660 = function go(level, node) {
          var node__5658 = cljs.core.tv_ensure_editable.call(null, this__5656.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__5658, n & 31, val);
            return node__5658
          }else {
            var subidx__5659 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__5658, subidx__5659, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__5658, subidx__5659)));
            return node__5658
          }
        }.call(null, this__5656.shift, this__5656.root);
        this__5656.root = new_root__5660;
        return tcoll
      }
    }else {
      if(n === this__5656.cnt) {
        return cljs.core._conj_BANG_.call(null, tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__5656.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__5661 = this;
  if(cljs.core.truth_(this__5661.root.edit)) {
    if(this__5661.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__5661.cnt) {
        this__5661.cnt = 0;
        return tcoll
      }else {
        if((this__5661.cnt - 1 & 31) > 0) {
          this__5661.cnt = this__5661.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__5662 = cljs.core.editable_array_for.call(null, tcoll, this__5661.cnt - 2);
            var new_root__5664 = function() {
              var nr__5663 = cljs.core.tv_pop_tail.call(null, tcoll, this__5661.shift, this__5661.root);
              if(nr__5663 != null) {
                return nr__5663
              }else {
                return new cljs.core.VectorNode(this__5661.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3822__auto____5665 = 5 < this__5661.shift;
              if(and__3822__auto____5665) {
                return cljs.core.pv_aget.call(null, new_root__5664, 1) == null
              }else {
                return and__3822__auto____5665
              }
            }()) {
              var new_root__5666 = cljs.core.tv_ensure_editable.call(null, this__5661.root.edit, cljs.core.pv_aget.call(null, new_root__5664, 0));
              this__5661.root = new_root__5666;
              this__5661.shift = this__5661.shift - 5;
              this__5661.cnt = this__5661.cnt - 1;
              this__5661.tail = new_tail__5662;
              return tcoll
            }else {
              this__5661.root = new_root__5664;
              this__5661.cnt = this__5661.cnt - 1;
              this__5661.tail = new_tail__5662;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5667 = this;
  return cljs.core._assoc_n_BANG_.call(null, tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5668 = this;
  if(cljs.core.truth_(this__5668.root.edit)) {
    if(this__5668.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__5668.tail[this__5668.cnt & 31] = o;
      this__5668.cnt = this__5668.cnt + 1;
      return tcoll
    }else {
      var tail_node__5669 = new cljs.core.VectorNode(this__5668.root.edit, this__5668.tail);
      var new_tail__5670 = cljs.core.make_array.call(null, 32);
      new_tail__5670[0] = o;
      this__5668.tail = new_tail__5670;
      if(this__5668.cnt >>> 5 > 1 << this__5668.shift) {
        var new_root_array__5671 = cljs.core.make_array.call(null, 32);
        var new_shift__5672 = this__5668.shift + 5;
        new_root_array__5671[0] = this__5668.root;
        new_root_array__5671[1] = cljs.core.new_path.call(null, this__5668.root.edit, this__5668.shift, tail_node__5669);
        this__5668.root = new cljs.core.VectorNode(this__5668.root.edit, new_root_array__5671);
        this__5668.shift = new_shift__5672;
        this__5668.cnt = this__5668.cnt + 1;
        return tcoll
      }else {
        var new_root__5673 = cljs.core.tv_push_tail.call(null, tcoll, this__5668.shift, this__5668.root, tail_node__5669);
        this__5668.root = new_root__5673;
        this__5668.cnt = this__5668.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5674 = this;
  if(cljs.core.truth_(this__5674.root.edit)) {
    this__5674.root.edit = null;
    var len__5675 = this__5674.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__5676 = cljs.core.make_array.call(null, len__5675);
    cljs.core.array_copy.call(null, this__5674.tail, 0, trimmed_tail__5676, 0, len__5675);
    return new cljs.core.PersistentVector(null, this__5674.cnt, this__5674.shift, this__5674.root, trimmed_tail__5676, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5678 = this;
  var h__364__auto____5679 = this__5678.__hash;
  if(h__364__auto____5679 != null) {
    return h__364__auto____5679
  }else {
    var h__364__auto____5680 = cljs.core.hash_coll.call(null, coll);
    this__5678.__hash = h__364__auto____5680;
    return h__364__auto____5680
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5681 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__5682 = this;
  var this$__5683 = this;
  return cljs.core.pr_str.call(null, this$__5683)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5684 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5685 = this;
  return cljs.core._first.call(null, this__5685.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5686 = this;
  var temp__3971__auto____5687 = cljs.core.next.call(null, this__5686.front);
  if(cljs.core.truth_(temp__3971__auto____5687)) {
    var f1__5688 = temp__3971__auto____5687;
    return new cljs.core.PersistentQueueSeq(this__5686.meta, f1__5688, this__5686.rear, null)
  }else {
    if(this__5686.rear == null) {
      return cljs.core._empty.call(null, coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__5686.meta, this__5686.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5689 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5690 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__5690.front, this__5690.rear, this__5690.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5691 = this;
  return this__5691.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5692 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__5692.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15929422
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5693 = this;
  var h__364__auto____5694 = this__5693.__hash;
  if(h__364__auto____5694 != null) {
    return h__364__auto____5694
  }else {
    var h__364__auto____5695 = cljs.core.hash_coll.call(null, coll);
    this__5693.__hash = h__364__auto____5695;
    return h__364__auto____5695
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__5696 = this;
  if(cljs.core.truth_(this__5696.front)) {
    return new cljs.core.PersistentQueue(this__5696.meta, this__5696.count + 1, this__5696.front, cljs.core.conj.call(null, function() {
      var or__3824__auto____5697 = this__5696.rear;
      if(cljs.core.truth_(or__3824__auto____5697)) {
        return or__3824__auto____5697
      }else {
        return cljs.core.PersistentVector.fromArray([])
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__5696.meta, this__5696.count + 1, cljs.core.conj.call(null, this__5696.front, o), cljs.core.PersistentVector.fromArray([]), null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__5698 = this;
  var this$__5699 = this;
  return cljs.core.pr_str.call(null, this$__5699)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5700 = this;
  var rear__5701 = cljs.core.seq.call(null, this__5700.rear);
  if(cljs.core.truth_(function() {
    var or__3824__auto____5702 = this__5700.front;
    if(cljs.core.truth_(or__3824__auto____5702)) {
      return or__3824__auto____5702
    }else {
      return rear__5701
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__5700.front, cljs.core.seq.call(null, rear__5701), null, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5703 = this;
  return this__5703.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__5704 = this;
  return cljs.core._first.call(null, this__5704.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__5705 = this;
  if(cljs.core.truth_(this__5705.front)) {
    var temp__3971__auto____5706 = cljs.core.next.call(null, this__5705.front);
    if(cljs.core.truth_(temp__3971__auto____5706)) {
      var f1__5707 = temp__3971__auto____5706;
      return new cljs.core.PersistentQueue(this__5705.meta, this__5705.count - 1, f1__5707, this__5705.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__5705.meta, this__5705.count - 1, cljs.core.seq.call(null, this__5705.rear), cljs.core.PersistentVector.fromArray([]), null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__5708 = this;
  return cljs.core.first.call(null, this__5708.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__5709 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5710 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5711 = this;
  return new cljs.core.PersistentQueue(meta, this__5711.count, this__5711.front, this__5711.rear, this__5711.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5712 = this;
  return this__5712.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5713 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.fromArray([]), 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1048576
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$ = true;
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__5714 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core.get.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__5715 = array.length;
  var i__5716 = 0;
  while(true) {
    if(i__5716 < len__5715) {
      if(cljs.core._EQ_.call(null, k, array[i__5716])) {
        return i__5716
      }else {
        var G__5717 = i__5716 + incr;
        i__5716 = G__5717;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_contains_key_QMARK_ = function() {
  var obj_map_contains_key_QMARK_ = null;
  var obj_map_contains_key_QMARK___2 = function(k, strobj) {
    return obj_map_contains_key_QMARK_.call(null, k, strobj, true, false)
  };
  var obj_map_contains_key_QMARK___4 = function(k, strobj, true_val, false_val) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____5718 = goog.isString.call(null, k);
      if(cljs.core.truth_(and__3822__auto____5718)) {
        return strobj.hasOwnProperty(k)
      }else {
        return and__3822__auto____5718
      }
    }())) {
      return true_val
    }else {
      return false_val
    }
  };
  obj_map_contains_key_QMARK_ = function(k, strobj, true_val, false_val) {
    switch(arguments.length) {
      case 2:
        return obj_map_contains_key_QMARK___2.call(this, k, strobj);
      case 4:
        return obj_map_contains_key_QMARK___4.call(this, k, strobj, true_val, false_val)
    }
    throw"Invalid arity: " + arguments.length;
  };
  obj_map_contains_key_QMARK_.cljs$lang$arity$2 = obj_map_contains_key_QMARK___2;
  obj_map_contains_key_QMARK_.cljs$lang$arity$4 = obj_map_contains_key_QMARK___4;
  return obj_map_contains_key_QMARK_
}();
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__5719 = cljs.core.hash.call(null, a);
  var b__5720 = cljs.core.hash.call(null, b);
  if(a__5719 < b__5720) {
    return-1
  }else {
    if(a__5719 > b__5720) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__5722 = m.keys;
  var len__5723 = ks__5722.length;
  var so__5724 = m.strobj;
  var out__5725 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__5726 = 0;
  var out__5727 = cljs.core.transient$.call(null, out__5725);
  while(true) {
    if(i__5726 < len__5723) {
      var k__5728 = ks__5722[i__5726];
      var G__5729 = i__5726 + 1;
      var G__5730 = cljs.core.assoc_BANG_.call(null, out__5727, k__5728, so__5724[k__5728]);
      i__5726 = G__5729;
      out__5727 = G__5730;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__5727, k, v))
    }
    break
  }
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155021199
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5735 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$ = true;
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5736 = this;
  var h__364__auto____5737 = this__5736.__hash;
  if(h__364__auto____5737 != null) {
    return h__364__auto____5737
  }else {
    var h__364__auto____5738 = cljs.core.hash_imap.call(null, coll);
    this__5736.__hash = h__364__auto____5738;
    return h__364__auto____5738
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$ = true;
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5739 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5740 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5740.strobj, this__5740.strobj[k], not_found)
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5741 = this;
  if(cljs.core.truth_(goog.isString.call(null, k))) {
    var overwrite_QMARK___5742 = this__5741.strobj.hasOwnProperty(k);
    if(cljs.core.truth_(overwrite_QMARK___5742)) {
      var new_strobj__5743 = goog.object.clone.call(null, this__5741.strobj);
      new_strobj__5743[k] = v;
      return new cljs.core.ObjMap(this__5741.meta, this__5741.keys, new_strobj__5743, this__5741.update_count + 1, null)
    }else {
      if(this__5741.update_count < cljs.core.ObjMap.HASHMAP_THRESHOLD) {
        var new_strobj__5744 = goog.object.clone.call(null, this__5741.strobj);
        var new_keys__5745 = cljs.core.aclone.call(null, this__5741.keys);
        new_strobj__5744[k] = v;
        new_keys__5745.push(k);
        return new cljs.core.ObjMap(this__5741.meta, new_keys__5745, new_strobj__5744, this__5741.update_count + 1, null)
      }else {
        return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5746 = this;
  return cljs.core.obj_map_contains_key_QMARK_.call(null, k, this__5746.strobj)
};
cljs.core.ObjMap.prototype.cljs$core$IFn$ = true;
cljs.core.ObjMap.prototype.call = function() {
  var G__5766 = null;
  var G__5766__2 = function(tsym5733, k) {
    var this__5747 = this;
    var tsym5733__5748 = this;
    var coll__5749 = tsym5733__5748;
    return cljs.core._lookup.call(null, coll__5749, k)
  };
  var G__5766__3 = function(tsym5734, k, not_found) {
    var this__5750 = this;
    var tsym5734__5751 = this;
    var coll__5752 = tsym5734__5751;
    return cljs.core._lookup.call(null, coll__5752, k, not_found)
  };
  G__5766 = function(tsym5734, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5766__2.call(this, tsym5734, k);
      case 3:
        return G__5766__3.call(this, tsym5734, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5766
}();
cljs.core.ObjMap.prototype.apply = function(tsym5731, args5732) {
  return tsym5731.call.apply(tsym5731, [tsym5731].concat(cljs.core.aclone.call(null, args5732)))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5753 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__5754 = this;
  var this$__5755 = this;
  return cljs.core.pr_str.call(null, this$__5755)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5756 = this;
  if(this__5756.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__5721_SHARP_) {
      return cljs.core.vector.call(null, p1__5721_SHARP_, this__5756.strobj[p1__5721_SHARP_])
    }, this__5756.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$ = true;
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5757 = this;
  return this__5757.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5758 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5759 = this;
  return new cljs.core.ObjMap(meta, this__5759.keys, this__5759.strobj, this__5759.update_count, this__5759.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5760 = this;
  return this__5760.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5761 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__5761.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$ = true;
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5762 = this;
  if(cljs.core.truth_(function() {
    var and__3822__auto____5763 = goog.isString.call(null, k);
    if(cljs.core.truth_(and__3822__auto____5763)) {
      return this__5762.strobj.hasOwnProperty(k)
    }else {
      return and__3822__auto____5763
    }
  }())) {
    var new_keys__5764 = cljs.core.aclone.call(null, this__5762.keys);
    var new_strobj__5765 = goog.object.clone.call(null, this__5762.strobj);
    new_keys__5764.splice(cljs.core.scan_array.call(null, 1, k, new_keys__5764), 1);
    cljs.core.js_delete.call(null, new_strobj__5765, k);
    return new cljs.core.ObjMap(this__5762.meta, new_keys__5764, new_strobj__5765, this__5762.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 7537551
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$ = true;
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5772 = this;
  var h__364__auto____5773 = this__5772.__hash;
  if(h__364__auto____5773 != null) {
    return h__364__auto____5773
  }else {
    var h__364__auto____5774 = cljs.core.hash_imap.call(null, coll);
    this__5772.__hash = h__364__auto____5774;
    return h__364__auto____5774
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5775 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5776 = this;
  var bucket__5777 = this__5776.hashobj[cljs.core.hash.call(null, k)];
  var i__5778 = cljs.core.truth_(bucket__5777) ? cljs.core.scan_array.call(null, 2, k, bucket__5777) : null;
  if(cljs.core.truth_(i__5778)) {
    return bucket__5777[i__5778 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5779 = this;
  var h__5780 = cljs.core.hash.call(null, k);
  var bucket__5781 = this__5779.hashobj[h__5780];
  if(cljs.core.truth_(bucket__5781)) {
    var new_bucket__5782 = cljs.core.aclone.call(null, bucket__5781);
    var new_hashobj__5783 = goog.object.clone.call(null, this__5779.hashobj);
    new_hashobj__5783[h__5780] = new_bucket__5782;
    var temp__3971__auto____5784 = cljs.core.scan_array.call(null, 2, k, new_bucket__5782);
    if(cljs.core.truth_(temp__3971__auto____5784)) {
      var i__5785 = temp__3971__auto____5784;
      new_bucket__5782[i__5785 + 1] = v;
      return new cljs.core.HashMap(this__5779.meta, this__5779.count, new_hashobj__5783, null)
    }else {
      new_bucket__5782.push(k, v);
      return new cljs.core.HashMap(this__5779.meta, this__5779.count + 1, new_hashobj__5783, null)
    }
  }else {
    var new_hashobj__5786 = goog.object.clone.call(null, this__5779.hashobj);
    new_hashobj__5786[h__5780] = [k, v];
    return new cljs.core.HashMap(this__5779.meta, this__5779.count + 1, new_hashobj__5786, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5787 = this;
  var bucket__5788 = this__5787.hashobj[cljs.core.hash.call(null, k)];
  var i__5789 = cljs.core.truth_(bucket__5788) ? cljs.core.scan_array.call(null, 2, k, bucket__5788) : null;
  if(cljs.core.truth_(i__5789)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.cljs$core$IFn$ = true;
cljs.core.HashMap.prototype.call = function() {
  var G__5812 = null;
  var G__5812__2 = function(tsym5770, k) {
    var this__5790 = this;
    var tsym5770__5791 = this;
    var coll__5792 = tsym5770__5791;
    return cljs.core._lookup.call(null, coll__5792, k)
  };
  var G__5812__3 = function(tsym5771, k, not_found) {
    var this__5793 = this;
    var tsym5771__5794 = this;
    var coll__5795 = tsym5771__5794;
    return cljs.core._lookup.call(null, coll__5795, k, not_found)
  };
  G__5812 = function(tsym5771, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5812__2.call(this, tsym5771, k);
      case 3:
        return G__5812__3.call(this, tsym5771, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5812
}();
cljs.core.HashMap.prototype.apply = function(tsym5768, args5769) {
  return tsym5768.call.apply(tsym5768, [tsym5768].concat(cljs.core.aclone.call(null, args5769)))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5796 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__5797 = this;
  var this$__5798 = this;
  return cljs.core.pr_str.call(null, this$__5798)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5799 = this;
  if(this__5799.count > 0) {
    var hashes__5800 = cljs.core.js_keys.call(null, this__5799.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__5767_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__5799.hashobj[p1__5767_SHARP_]))
    }, hashes__5800)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5801 = this;
  return this__5801.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5802 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5803 = this;
  return new cljs.core.HashMap(meta, this__5803.count, this__5803.hashobj, this__5803.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5804 = this;
  return this__5804.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5805 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__5805.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$ = true;
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5806 = this;
  var h__5807 = cljs.core.hash.call(null, k);
  var bucket__5808 = this__5806.hashobj[h__5807];
  var i__5809 = cljs.core.truth_(bucket__5808) ? cljs.core.scan_array.call(null, 2, k, bucket__5808) : null;
  if(cljs.core.not.call(null, i__5809)) {
    return coll
  }else {
    var new_hashobj__5810 = goog.object.clone.call(null, this__5806.hashobj);
    if(3 > bucket__5808.length) {
      cljs.core.js_delete.call(null, new_hashobj__5810, h__5807)
    }else {
      var new_bucket__5811 = cljs.core.aclone.call(null, bucket__5808);
      new_bucket__5811.splice(i__5809, 2);
      new_hashobj__5810[h__5807] = new_bucket__5811
    }
    return new cljs.core.HashMap(this__5806.meta, this__5806.count - 1, new_hashobj__5810, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__5813 = ks.length;
  var i__5814 = 0;
  var out__5815 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__5814 < len__5813) {
      var G__5816 = i__5814 + 1;
      var G__5817 = cljs.core.assoc.call(null, out__5815, ks[i__5814], vs[i__5814]);
      i__5814 = G__5816;
      out__5815 = G__5817;
      continue
    }else {
      return out__5815
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__5818 = m.arr;
  var len__5819 = arr__5818.length;
  var i__5820 = 0;
  while(true) {
    if(len__5819 <= i__5820) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__5818[i__5820], k)) {
        return i__5820
      }else {
        if("\ufdd0'else") {
          var G__5821 = i__5820 + 2;
          i__5820 = G__5821;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
void 0;
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__5826 = this;
  return new cljs.core.TransientArrayMap({}, this__5826.arr.length, cljs.core.aclone.call(null, this__5826.arr))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__5827 = this;
  var h__364__auto____5828 = this__5827.__hash;
  if(h__364__auto____5828 != null) {
    return h__364__auto____5828
  }else {
    var h__364__auto____5829 = cljs.core.hash_imap.call(null, coll);
    this__5827.__hash = h__364__auto____5829;
    return h__364__auto____5829
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__5830 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__5831 = this;
  var idx__5832 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5832 === -1) {
    return not_found
  }else {
    return this__5831.arr[idx__5832 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__5833 = this;
  var idx__5834 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5834 === -1) {
    if(this__5833.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__5833.meta, this__5833.cnt + 1, function() {
        var G__5835__5836 = cljs.core.aclone.call(null, this__5833.arr);
        G__5835__5836.push(k);
        G__5835__5836.push(v);
        return G__5835__5836
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__5833.arr[idx__5834 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__5833.meta, this__5833.cnt, function() {
          var G__5837__5838 = cljs.core.aclone.call(null, this__5833.arr);
          G__5837__5838[idx__5834 + 1] = v;
          return G__5837__5838
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__5839 = this;
  return cljs.core.array_map_index_of.call(null, coll, k) != -1
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__5869 = null;
  var G__5869__2 = function(tsym5824, k) {
    var this__5840 = this;
    var tsym5824__5841 = this;
    var coll__5842 = tsym5824__5841;
    return cljs.core._lookup.call(null, coll__5842, k)
  };
  var G__5869__3 = function(tsym5825, k, not_found) {
    var this__5843 = this;
    var tsym5825__5844 = this;
    var coll__5845 = tsym5825__5844;
    return cljs.core._lookup.call(null, coll__5845, k, not_found)
  };
  G__5869 = function(tsym5825, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__5869__2.call(this, tsym5825, k);
      case 3:
        return G__5869__3.call(this, tsym5825, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5869
}();
cljs.core.PersistentArrayMap.prototype.apply = function(tsym5822, args5823) {
  return tsym5822.call.apply(tsym5822, [tsym5822].concat(cljs.core.aclone.call(null, args5823)))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__5846 = this;
  var len__5847 = this__5846.arr.length;
  var i__5848 = 0;
  var init__5849 = init;
  while(true) {
    if(i__5848 < len__5847) {
      var init__5850 = f.call(null, init__5849, this__5846.arr[i__5848], this__5846.arr[i__5848 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__5850)) {
        return cljs.core.deref.call(null, init__5850)
      }else {
        var G__5870 = i__5848 + 2;
        var G__5871 = init__5850;
        i__5848 = G__5870;
        init__5849 = G__5871;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__5851 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__5852 = this;
  var this$__5853 = this;
  return cljs.core.pr_str.call(null, this$__5853)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__5854 = this;
  if(this__5854.cnt > 0) {
    var len__5855 = this__5854.arr.length;
    var array_map_seq__5856 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__5855) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__5854.arr[i], this__5854.arr[i + 1]]), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      })
    };
    return array_map_seq__5856.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__5857 = this;
  return this__5857.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__5858 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__5859 = this;
  return new cljs.core.PersistentArrayMap(meta, this__5859.cnt, this__5859.arr, this__5859.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__5860 = this;
  return this__5860.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__5861 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__5861.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__5862 = this;
  var idx__5863 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__5863 >= 0) {
    var len__5864 = this__5862.arr.length;
    var new_len__5865 = len__5864 - 2;
    if(new_len__5865 === 0) {
      return cljs.core._empty.call(null, coll)
    }else {
      var new_arr__5866 = cljs.core.make_array.call(null, new_len__5865);
      var s__5867 = 0;
      var d__5868 = 0;
      while(true) {
        if(s__5867 >= len__5864) {
          return new cljs.core.PersistentArrayMap(this__5862.meta, this__5862.cnt - 1, new_arr__5866, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__5862.arr[s__5867])) {
            var G__5872 = s__5867 + 2;
            var G__5873 = d__5868;
            s__5867 = G__5872;
            d__5868 = G__5873;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__5866[d__5868] = this__5862.arr[s__5867];
              new_arr__5866[d__5868 + 1] = this__5862.arr[s__5867 + 1];
              var G__5874 = s__5867 + 2;
              var G__5875 = d__5868 + 2;
              s__5867 = G__5874;
              d__5868 = G__5875;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__5876 = cljs.core.count.call(null, ks);
  var i__5877 = 0;
  var out__5878 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__5877 < len__5876) {
      var G__5879 = i__5877 + 1;
      var G__5880 = cljs.core.assoc_BANG_.call(null, out__5878, ks[i__5877], vs[i__5877]);
      i__5877 = G__5879;
      out__5878 = G__5880;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__5878)
    }
    break
  }
};
void 0;
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__5881 = this;
  if(cljs.core.truth_(this__5881.editable_QMARK_)) {
    var idx__5882 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5882 >= 0) {
      this__5881.arr[idx__5882] = this__5881.arr[this__5881.len - 2];
      this__5881.arr[idx__5882 + 1] = this__5881.arr[this__5881.len - 1];
      var G__5883__5884 = this__5881.arr;
      G__5883__5884.pop();
      G__5883__5884.pop();
      G__5883__5884;
      this__5881.len = this__5881.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__5885 = this;
  if(cljs.core.truth_(this__5885.editable_QMARK_)) {
    var idx__5886 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__5886 === -1) {
      if(this__5885.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__5885.len = this__5885.len + 2;
        this__5885.arr.push(key);
        this__5885.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__5885.len, this__5885.arr), key, val)
      }
    }else {
      if(val === this__5885.arr[idx__5886 + 1]) {
        return tcoll
      }else {
        this__5885.arr[idx__5886 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__5887 = this;
  if(cljs.core.truth_(this__5887.editable_QMARK_)) {
    if(function() {
      var G__5888__5889 = o;
      if(G__5888__5889 != null) {
        if(function() {
          var or__3824__auto____5890 = G__5888__5889.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____5890) {
            return or__3824__auto____5890
          }else {
            return G__5888__5889.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__5888__5889.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5888__5889)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__5888__5889)
      }
    }()) {
      return cljs.core._assoc_BANG_.call(null, tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__5891 = cljs.core.seq.call(null, o);
      var tcoll__5892 = tcoll;
      while(true) {
        var temp__3971__auto____5893 = cljs.core.first.call(null, es__5891);
        if(cljs.core.truth_(temp__3971__auto____5893)) {
          var e__5894 = temp__3971__auto____5893;
          var G__5900 = cljs.core.next.call(null, es__5891);
          var G__5901 = cljs.core._assoc_BANG_.call(null, tcoll__5892, cljs.core.key.call(null, e__5894), cljs.core.val.call(null, e__5894));
          es__5891 = G__5900;
          tcoll__5892 = G__5901;
          continue
        }else {
          return tcoll__5892
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__5895 = this;
  if(cljs.core.truth_(this__5895.editable_QMARK_)) {
    this__5895.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__5895.len, 2), this__5895.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__5896 = this;
  return cljs.core._lookup.call(null, tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__5897 = this;
  if(cljs.core.truth_(this__5897.editable_QMARK_)) {
    var idx__5898 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__5898 === -1) {
      return not_found
    }else {
      return this__5897.arr[idx__5898 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__5899 = this;
  if(cljs.core.truth_(this__5899.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__5899.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
void 0;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__5902 = cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {}));
  var i__5903 = 0;
  while(true) {
    if(i__5903 < len) {
      var G__5904 = cljs.core.assoc_BANG_.call(null, out__5902, arr[i__5903], arr[i__5903 + 1]);
      var G__5905 = i__5903 + 2;
      out__5902 = G__5904;
      i__5903 = G__5905;
      continue
    }else {
      return out__5902
    }
    break
  }
};
void 0;
void 0;
void 0;
void 0;
void 0;
void 0;
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__5906__5907 = cljs.core.aclone.call(null, arr);
    G__5906__5907[i] = a;
    return G__5906__5907
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__5908__5909 = cljs.core.aclone.call(null, arr);
    G__5908__5909[i] = a;
    G__5908__5909[j] = b;
    return G__5908__5909
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__5910 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__5910, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__5910, 2 * i, new_arr__5910.length - 2 * i);
  return new_arr__5910
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__5911 = inode.ensure_editable(edit);
    editable__5911.arr[i] = a;
    return editable__5911
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__5912 = inode.ensure_editable(edit);
    editable__5912.arr[i] = a;
    editable__5912.arr[j] = b;
    return editable__5912
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__5913 = arr.length;
  var i__5914 = 0;
  var init__5915 = init;
  while(true) {
    if(i__5914 < len__5913) {
      var init__5918 = function() {
        var k__5916 = arr[i__5914];
        if(k__5916 != null) {
          return f.call(null, init__5915, k__5916, arr[i__5914 + 1])
        }else {
          var node__5917 = arr[i__5914 + 1];
          if(node__5917 != null) {
            return node__5917.kv_reduce(f, init__5915)
          }else {
            return init__5915
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__5918)) {
        return cljs.core.deref.call(null, init__5918)
      }else {
        var G__5919 = i__5914 + 2;
        var G__5920 = init__5918;
        i__5914 = G__5919;
        init__5915 = G__5920;
        continue
      }
    }else {
      return init__5915
    }
    break
  }
};
void 0;
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__5921 = this;
  var inode__5922 = this;
  if(this__5921.bitmap === bit) {
    return null
  }else {
    var editable__5923 = inode__5922.ensure_editable(e);
    var earr__5924 = editable__5923.arr;
    var len__5925 = earr__5924.length;
    editable__5923.bitmap = bit ^ editable__5923.bitmap;
    cljs.core.array_copy.call(null, earr__5924, 2 * (i + 1), earr__5924, 2 * i, len__5925 - 2 * (i + 1));
    earr__5924[len__5925 - 2] = null;
    earr__5924[len__5925 - 1] = null;
    return editable__5923
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__5926 = this;
  var inode__5927 = this;
  var bit__5928 = 1 << (hash >>> shift & 31);
  var idx__5929 = cljs.core.bitmap_indexed_node_index.call(null, this__5926.bitmap, bit__5928);
  if((this__5926.bitmap & bit__5928) === 0) {
    var n__5930 = cljs.core.bit_count.call(null, this__5926.bitmap);
    if(2 * n__5930 < this__5926.arr.length) {
      var editable__5931 = inode__5927.ensure_editable(edit);
      var earr__5932 = editable__5931.arr;
      added_leaf_QMARK_[0] = true;
      cljs.core.array_copy_downward.call(null, earr__5932, 2 * idx__5929, earr__5932, 2 * (idx__5929 + 1), 2 * (n__5930 - idx__5929));
      earr__5932[2 * idx__5929] = key;
      earr__5932[2 * idx__5929 + 1] = val;
      editable__5931.bitmap = editable__5931.bitmap | bit__5928;
      return editable__5931
    }else {
      if(n__5930 >= 16) {
        var nodes__5933 = cljs.core.make_array.call(null, 32);
        var jdx__5934 = hash >>> shift & 31;
        nodes__5933[jdx__5934] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__5935 = 0;
        var j__5936 = 0;
        while(true) {
          if(i__5935 < 32) {
            if((this__5926.bitmap >>> i__5935 & 1) === 0) {
              var G__5989 = i__5935 + 1;
              var G__5990 = j__5936;
              i__5935 = G__5989;
              j__5936 = G__5990;
              continue
            }else {
              nodes__5933[i__5935] = null != this__5926.arr[j__5936] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__5926.arr[j__5936]), this__5926.arr[j__5936], this__5926.arr[j__5936 + 1], added_leaf_QMARK_) : this__5926.arr[j__5936 + 1];
              var G__5991 = i__5935 + 1;
              var G__5992 = j__5936 + 2;
              i__5935 = G__5991;
              j__5936 = G__5992;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__5930 + 1, nodes__5933)
      }else {
        if("\ufdd0'else") {
          var new_arr__5937 = cljs.core.make_array.call(null, 2 * (n__5930 + 4));
          cljs.core.array_copy.call(null, this__5926.arr, 0, new_arr__5937, 0, 2 * idx__5929);
          new_arr__5937[2 * idx__5929] = key;
          added_leaf_QMARK_[0] = true;
          new_arr__5937[2 * idx__5929 + 1] = val;
          cljs.core.array_copy.call(null, this__5926.arr, 2 * idx__5929, new_arr__5937, 2 * (idx__5929 + 1), 2 * (n__5930 - idx__5929));
          var editable__5938 = inode__5927.ensure_editable(edit);
          editable__5938.arr = new_arr__5937;
          editable__5938.bitmap = editable__5938.bitmap | bit__5928;
          return editable__5938
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__5939 = this__5926.arr[2 * idx__5929];
    var val_or_node__5940 = this__5926.arr[2 * idx__5929 + 1];
    if(null == key_or_nil__5939) {
      var n__5941 = val_or_node__5940.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5941 === val_or_node__5940) {
        return inode__5927
      }else {
        return cljs.core.edit_and_set.call(null, inode__5927, edit, 2 * idx__5929 + 1, n__5941)
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5939)) {
        if(val === val_or_node__5940) {
          return inode__5927
        }else {
          return cljs.core.edit_and_set.call(null, inode__5927, edit, 2 * idx__5929 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return cljs.core.edit_and_set.call(null, inode__5927, edit, 2 * idx__5929, null, 2 * idx__5929 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__5939, val_or_node__5940, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__5942 = this;
  var inode__5943 = this;
  return cljs.core.create_inode_seq.call(null, this__5942.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__5944 = this;
  var inode__5945 = this;
  var bit__5946 = 1 << (hash >>> shift & 31);
  if((this__5944.bitmap & bit__5946) === 0) {
    return inode__5945
  }else {
    var idx__5947 = cljs.core.bitmap_indexed_node_index.call(null, this__5944.bitmap, bit__5946);
    var key_or_nil__5948 = this__5944.arr[2 * idx__5947];
    var val_or_node__5949 = this__5944.arr[2 * idx__5947 + 1];
    if(null == key_or_nil__5948) {
      var n__5950 = val_or_node__5949.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__5950 === val_or_node__5949) {
        return inode__5945
      }else {
        if(null != n__5950) {
          return cljs.core.edit_and_set.call(null, inode__5945, edit, 2 * idx__5947 + 1, n__5950)
        }else {
          if(this__5944.bitmap === bit__5946) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__5945.edit_and_remove_pair(edit, bit__5946, idx__5947)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5948)) {
        removed_leaf_QMARK_[0] = true;
        return inode__5945.edit_and_remove_pair(edit, bit__5946, idx__5947)
      }else {
        if("\ufdd0'else") {
          return inode__5945
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__5951 = this;
  var inode__5952 = this;
  if(e === this__5951.edit) {
    return inode__5952
  }else {
    var n__5953 = cljs.core.bit_count.call(null, this__5951.bitmap);
    var new_arr__5954 = cljs.core.make_array.call(null, n__5953 < 0 ? 4 : 2 * (n__5953 + 1));
    cljs.core.array_copy.call(null, this__5951.arr, 0, new_arr__5954, 0, 2 * n__5953);
    return new cljs.core.BitmapIndexedNode(e, this__5951.bitmap, new_arr__5954)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__5955 = this;
  var inode__5956 = this;
  return cljs.core.inode_kv_reduce.call(null, this__5955.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function() {
  var G__5993 = null;
  var G__5993__3 = function(shift, hash, key) {
    var this__5957 = this;
    var inode__5958 = this;
    var bit__5959 = 1 << (hash >>> shift & 31);
    if((this__5957.bitmap & bit__5959) === 0) {
      return null
    }else {
      var idx__5960 = cljs.core.bitmap_indexed_node_index.call(null, this__5957.bitmap, bit__5959);
      var key_or_nil__5961 = this__5957.arr[2 * idx__5960];
      var val_or_node__5962 = this__5957.arr[2 * idx__5960 + 1];
      if(null == key_or_nil__5961) {
        return val_or_node__5962.inode_find(shift + 5, hash, key)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5961)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5961, val_or_node__5962])
        }else {
          if("\ufdd0'else") {
            return null
          }else {
            return null
          }
        }
      }
    }
  };
  var G__5993__4 = function(shift, hash, key, not_found) {
    var this__5963 = this;
    var inode__5964 = this;
    var bit__5965 = 1 << (hash >>> shift & 31);
    if((this__5963.bitmap & bit__5965) === 0) {
      return not_found
    }else {
      var idx__5966 = cljs.core.bitmap_indexed_node_index.call(null, this__5963.bitmap, bit__5965);
      var key_or_nil__5967 = this__5963.arr[2 * idx__5966];
      var val_or_node__5968 = this__5963.arr[2 * idx__5966 + 1];
      if(null == key_or_nil__5967) {
        return val_or_node__5968.inode_find(shift + 5, hash, key, not_found)
      }else {
        if(cljs.core._EQ_.call(null, key, key_or_nil__5967)) {
          return cljs.core.PersistentVector.fromArray([key_or_nil__5967, val_or_node__5968])
        }else {
          if("\ufdd0'else") {
            return not_found
          }else {
            return null
          }
        }
      }
    }
  };
  G__5993 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__5993__3.call(this, shift, hash, key);
      case 4:
        return G__5993__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__5993
}();
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__5969 = this;
  var inode__5970 = this;
  var bit__5971 = 1 << (hash >>> shift & 31);
  if((this__5969.bitmap & bit__5971) === 0) {
    return inode__5970
  }else {
    var idx__5972 = cljs.core.bitmap_indexed_node_index.call(null, this__5969.bitmap, bit__5971);
    var key_or_nil__5973 = this__5969.arr[2 * idx__5972];
    var val_or_node__5974 = this__5969.arr[2 * idx__5972 + 1];
    if(null == key_or_nil__5973) {
      var n__5975 = val_or_node__5974.inode_without(shift + 5, hash, key);
      if(n__5975 === val_or_node__5974) {
        return inode__5970
      }else {
        if(null != n__5975) {
          return new cljs.core.BitmapIndexedNode(null, this__5969.bitmap, cljs.core.clone_and_set.call(null, this__5969.arr, 2 * idx__5972 + 1, n__5975))
        }else {
          if(this__5969.bitmap === bit__5971) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__5969.bitmap ^ bit__5971, cljs.core.remove_pair.call(null, this__5969.arr, idx__5972))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5973)) {
        return new cljs.core.BitmapIndexedNode(null, this__5969.bitmap ^ bit__5971, cljs.core.remove_pair.call(null, this__5969.arr, idx__5972))
      }else {
        if("\ufdd0'else") {
          return inode__5970
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__5976 = this;
  var inode__5977 = this;
  var bit__5978 = 1 << (hash >>> shift & 31);
  var idx__5979 = cljs.core.bitmap_indexed_node_index.call(null, this__5976.bitmap, bit__5978);
  if((this__5976.bitmap & bit__5978) === 0) {
    var n__5980 = cljs.core.bit_count.call(null, this__5976.bitmap);
    if(n__5980 >= 16) {
      var nodes__5981 = cljs.core.make_array.call(null, 32);
      var jdx__5982 = hash >>> shift & 31;
      nodes__5981[jdx__5982] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__5983 = 0;
      var j__5984 = 0;
      while(true) {
        if(i__5983 < 32) {
          if((this__5976.bitmap >>> i__5983 & 1) === 0) {
            var G__5994 = i__5983 + 1;
            var G__5995 = j__5984;
            i__5983 = G__5994;
            j__5984 = G__5995;
            continue
          }else {
            nodes__5981[i__5983] = null != this__5976.arr[j__5984] ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__5976.arr[j__5984]), this__5976.arr[j__5984], this__5976.arr[j__5984 + 1], added_leaf_QMARK_) : this__5976.arr[j__5984 + 1];
            var G__5996 = i__5983 + 1;
            var G__5997 = j__5984 + 2;
            i__5983 = G__5996;
            j__5984 = G__5997;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__5980 + 1, nodes__5981)
    }else {
      var new_arr__5985 = cljs.core.make_array.call(null, 2 * (n__5980 + 1));
      cljs.core.array_copy.call(null, this__5976.arr, 0, new_arr__5985, 0, 2 * idx__5979);
      new_arr__5985[2 * idx__5979] = key;
      added_leaf_QMARK_[0] = true;
      new_arr__5985[2 * idx__5979 + 1] = val;
      cljs.core.array_copy.call(null, this__5976.arr, 2 * idx__5979, new_arr__5985, 2 * (idx__5979 + 1), 2 * (n__5980 - idx__5979));
      return new cljs.core.BitmapIndexedNode(null, this__5976.bitmap | bit__5978, new_arr__5985)
    }
  }else {
    var key_or_nil__5986 = this__5976.arr[2 * idx__5979];
    var val_or_node__5987 = this__5976.arr[2 * idx__5979 + 1];
    if(null == key_or_nil__5986) {
      var n__5988 = val_or_node__5987.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__5988 === val_or_node__5987) {
        return inode__5977
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__5976.bitmap, cljs.core.clone_and_set.call(null, this__5976.arr, 2 * idx__5979 + 1, n__5988))
      }
    }else {
      if(cljs.core._EQ_.call(null, key, key_or_nil__5986)) {
        if(val === val_or_node__5987) {
          return inode__5977
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__5976.bitmap, cljs.core.clone_and_set.call(null, this__5976.arr, 2 * idx__5979 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_[0] = true;
          return new cljs.core.BitmapIndexedNode(null, this__5976.bitmap, cljs.core.clone_and_set.call(null, this__5976.arr, 2 * idx__5979, null, 2 * idx__5979 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__5986, val_or_node__5987, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__5998 = array_node.arr;
  var len__5999 = 2 * (array_node.cnt - 1);
  var new_arr__6000 = cljs.core.make_array.call(null, len__5999);
  var i__6001 = 0;
  var j__6002 = 1;
  var bitmap__6003 = 0;
  while(true) {
    if(i__6001 < len__5999) {
      if(function() {
        var and__3822__auto____6004 = i__6001 != idx;
        if(and__3822__auto____6004) {
          return null != arr__5998[i__6001]
        }else {
          return and__3822__auto____6004
        }
      }()) {
        new_arr__6000[j__6002] = arr__5998[i__6001];
        var G__6005 = i__6001 + 1;
        var G__6006 = j__6002 + 2;
        var G__6007 = bitmap__6003 | 1 << i__6001;
        i__6001 = G__6005;
        j__6002 = G__6006;
        bitmap__6003 = G__6007;
        continue
      }else {
        var G__6008 = i__6001 + 1;
        var G__6009 = j__6002;
        var G__6010 = bitmap__6003;
        i__6001 = G__6008;
        j__6002 = G__6009;
        bitmap__6003 = G__6010;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__6003, new_arr__6000)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6011 = this;
  var inode__6012 = this;
  var idx__6013 = hash >>> shift & 31;
  var node__6014 = this__6011.arr[idx__6013];
  if(null == node__6014) {
    return new cljs.core.ArrayNode(null, this__6011.cnt + 1, cljs.core.clone_and_set.call(null, this__6011.arr, idx__6013, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__6015 = node__6014.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6015 === node__6014) {
      return inode__6012
    }else {
      return new cljs.core.ArrayNode(null, this__6011.cnt, cljs.core.clone_and_set.call(null, this__6011.arr, idx__6013, n__6015))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__6016 = this;
  var inode__6017 = this;
  var idx__6018 = hash >>> shift & 31;
  var node__6019 = this__6016.arr[idx__6018];
  if(null != node__6019) {
    var n__6020 = node__6019.inode_without(shift + 5, hash, key);
    if(n__6020 === node__6019) {
      return inode__6017
    }else {
      if(n__6020 == null) {
        if(this__6016.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6017, null, idx__6018)
        }else {
          return new cljs.core.ArrayNode(null, this__6016.cnt - 1, cljs.core.clone_and_set.call(null, this__6016.arr, idx__6018, n__6020))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__6016.cnt, cljs.core.clone_and_set.call(null, this__6016.arr, idx__6018, n__6020))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__6017
  }
};
cljs.core.ArrayNode.prototype.inode_find = function() {
  var G__6052 = null;
  var G__6052__3 = function(shift, hash, key) {
    var this__6021 = this;
    var inode__6022 = this;
    var idx__6023 = hash >>> shift & 31;
    var node__6024 = this__6021.arr[idx__6023];
    if(null != node__6024) {
      return node__6024.inode_find(shift + 5, hash, key)
    }else {
      return null
    }
  };
  var G__6052__4 = function(shift, hash, key, not_found) {
    var this__6025 = this;
    var inode__6026 = this;
    var idx__6027 = hash >>> shift & 31;
    var node__6028 = this__6025.arr[idx__6027];
    if(null != node__6028) {
      return node__6028.inode_find(shift + 5, hash, key, not_found)
    }else {
      return not_found
    }
  };
  G__6052 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6052__3.call(this, shift, hash, key);
      case 4:
        return G__6052__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6052
}();
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__6029 = this;
  var inode__6030 = this;
  return cljs.core.create_array_node_seq.call(null, this__6029.arr)
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__6031 = this;
  var inode__6032 = this;
  if(e === this__6031.edit) {
    return inode__6032
  }else {
    return new cljs.core.ArrayNode(e, this__6031.cnt, cljs.core.aclone.call(null, this__6031.arr))
  }
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6033 = this;
  var inode__6034 = this;
  var idx__6035 = hash >>> shift & 31;
  var node__6036 = this__6033.arr[idx__6035];
  if(null == node__6036) {
    var editable__6037 = cljs.core.edit_and_set.call(null, inode__6034, edit, idx__6035, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__6037.cnt = editable__6037.cnt + 1;
    return editable__6037
  }else {
    var n__6038 = node__6036.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__6038 === node__6036) {
      return inode__6034
    }else {
      return cljs.core.edit_and_set.call(null, inode__6034, edit, idx__6035, n__6038)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6039 = this;
  var inode__6040 = this;
  var idx__6041 = hash >>> shift & 31;
  var node__6042 = this__6039.arr[idx__6041];
  if(null == node__6042) {
    return inode__6040
  }else {
    var n__6043 = node__6042.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__6043 === node__6042) {
      return inode__6040
    }else {
      if(null == n__6043) {
        if(this__6039.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__6040, edit, idx__6041)
        }else {
          var editable__6044 = cljs.core.edit_and_set.call(null, inode__6040, edit, idx__6041, n__6043);
          editable__6044.cnt = editable__6044.cnt - 1;
          return editable__6044
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__6040, edit, idx__6041, n__6043)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__6045 = this;
  var inode__6046 = this;
  var len__6047 = this__6045.arr.length;
  var i__6048 = 0;
  var init__6049 = init;
  while(true) {
    if(i__6048 < len__6047) {
      var node__6050 = this__6045.arr[i__6048];
      if(node__6050 != null) {
        var init__6051 = node__6050.kv_reduce(f, init__6049);
        if(cljs.core.reduced_QMARK_.call(null, init__6051)) {
          return cljs.core.deref.call(null, init__6051)
        }else {
          var G__6053 = i__6048 + 1;
          var G__6054 = init__6051;
          i__6048 = G__6053;
          init__6049 = G__6054;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__6049
    }
    break
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__6055 = 2 * cnt;
  var i__6056 = 0;
  while(true) {
    if(i__6056 < lim__6055) {
      if(cljs.core._EQ_.call(null, key, arr[i__6056])) {
        return i__6056
      }else {
        var G__6057 = i__6056 + 2;
        i__6056 = G__6057;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__6058 = this;
  var inode__6059 = this;
  if(hash === this__6058.collision_hash) {
    var idx__6060 = cljs.core.hash_collision_node_find_index.call(null, this__6058.arr, this__6058.cnt, key);
    if(idx__6060 === -1) {
      var len__6061 = this__6058.arr.length;
      var new_arr__6062 = cljs.core.make_array.call(null, len__6061 + 2);
      cljs.core.array_copy.call(null, this__6058.arr, 0, new_arr__6062, 0, len__6061);
      new_arr__6062[len__6061] = key;
      new_arr__6062[len__6061 + 1] = val;
      added_leaf_QMARK_[0] = true;
      return new cljs.core.HashCollisionNode(null, this__6058.collision_hash, this__6058.cnt + 1, new_arr__6062)
    }else {
      if(cljs.core._EQ_.call(null, this__6058.arr[idx__6060], val)) {
        return inode__6059
      }else {
        return new cljs.core.HashCollisionNode(null, this__6058.collision_hash, this__6058.cnt, cljs.core.clone_and_set.call(null, this__6058.arr, idx__6060 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__6058.collision_hash >>> shift & 31), [null, inode__6059])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__6063 = this;
  var inode__6064 = this;
  var idx__6065 = cljs.core.hash_collision_node_find_index.call(null, this__6063.arr, this__6063.cnt, key);
  if(idx__6065 === -1) {
    return inode__6064
  }else {
    if(this__6063.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__6063.collision_hash, this__6063.cnt - 1, cljs.core.remove_pair.call(null, this__6063.arr, cljs.core.quot.call(null, idx__6065, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_find = function() {
  var G__6092 = null;
  var G__6092__3 = function(shift, hash, key) {
    var this__6066 = this;
    var inode__6067 = this;
    var idx__6068 = cljs.core.hash_collision_node_find_index.call(null, this__6066.arr, this__6066.cnt, key);
    if(idx__6068 < 0) {
      return null
    }else {
      if(cljs.core._EQ_.call(null, key, this__6066.arr[idx__6068])) {
        return cljs.core.PersistentVector.fromArray([this__6066.arr[idx__6068], this__6066.arr[idx__6068 + 1]])
      }else {
        if("\ufdd0'else") {
          return null
        }else {
          return null
        }
      }
    }
  };
  var G__6092__4 = function(shift, hash, key, not_found) {
    var this__6069 = this;
    var inode__6070 = this;
    var idx__6071 = cljs.core.hash_collision_node_find_index.call(null, this__6069.arr, this__6069.cnt, key);
    if(idx__6071 < 0) {
      return not_found
    }else {
      if(cljs.core._EQ_.call(null, key, this__6069.arr[idx__6071])) {
        return cljs.core.PersistentVector.fromArray([this__6069.arr[idx__6071], this__6069.arr[idx__6071 + 1]])
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  };
  G__6092 = function(shift, hash, key, not_found) {
    switch(arguments.length) {
      case 3:
        return G__6092__3.call(this, shift, hash, key);
      case 4:
        return G__6092__4.call(this, shift, hash, key, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6092
}();
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__6072 = this;
  var inode__6073 = this;
  return cljs.core.create_inode_seq.call(null, this__6072.arr)
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function() {
  var G__6093 = null;
  var G__6093__1 = function(e) {
    var this__6074 = this;
    var inode__6075 = this;
    if(e === this__6074.edit) {
      return inode__6075
    }else {
      var new_arr__6076 = cljs.core.make_array.call(null, 2 * (this__6074.cnt + 1));
      cljs.core.array_copy.call(null, this__6074.arr, 0, new_arr__6076, 0, 2 * this__6074.cnt);
      return new cljs.core.HashCollisionNode(e, this__6074.collision_hash, this__6074.cnt, new_arr__6076)
    }
  };
  var G__6093__3 = function(e, count, array) {
    var this__6077 = this;
    var inode__6078 = this;
    if(e === this__6077.edit) {
      this__6077.arr = array;
      this__6077.cnt = count;
      return inode__6078
    }else {
      return new cljs.core.HashCollisionNode(this__6077.edit, this__6077.collision_hash, count, array)
    }
  };
  G__6093 = function(e, count, array) {
    switch(arguments.length) {
      case 1:
        return G__6093__1.call(this, e);
      case 3:
        return G__6093__3.call(this, e, count, array)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6093
}();
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__6079 = this;
  var inode__6080 = this;
  if(hash === this__6079.collision_hash) {
    var idx__6081 = cljs.core.hash_collision_node_find_index.call(null, this__6079.arr, this__6079.cnt, key);
    if(idx__6081 === -1) {
      if(this__6079.arr.length > 2 * this__6079.cnt) {
        var editable__6082 = cljs.core.edit_and_set.call(null, inode__6080, edit, 2 * this__6079.cnt, key, 2 * this__6079.cnt + 1, val);
        added_leaf_QMARK_[0] = true;
        editable__6082.cnt = editable__6082.cnt + 1;
        return editable__6082
      }else {
        var len__6083 = this__6079.arr.length;
        var new_arr__6084 = cljs.core.make_array.call(null, len__6083 + 2);
        cljs.core.array_copy.call(null, this__6079.arr, 0, new_arr__6084, 0, len__6083);
        new_arr__6084[len__6083] = key;
        new_arr__6084[len__6083 + 1] = val;
        added_leaf_QMARK_[0] = true;
        return inode__6080.ensure_editable(edit, this__6079.cnt + 1, new_arr__6084)
      }
    }else {
      if(this__6079.arr[idx__6081 + 1] === val) {
        return inode__6080
      }else {
        return cljs.core.edit_and_set.call(null, inode__6080, edit, idx__6081 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__6079.collision_hash >>> shift & 31), [null, inode__6080, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__6085 = this;
  var inode__6086 = this;
  var idx__6087 = cljs.core.hash_collision_node_find_index.call(null, this__6085.arr, this__6085.cnt, key);
  if(idx__6087 === -1) {
    return inode__6086
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__6085.cnt === 1) {
      return null
    }else {
      var editable__6088 = inode__6086.ensure_editable(edit);
      var earr__6089 = editable__6088.arr;
      earr__6089[idx__6087] = earr__6089[2 * this__6085.cnt - 2];
      earr__6089[idx__6087 + 1] = earr__6089[2 * this__6085.cnt - 1];
      earr__6089[2 * this__6085.cnt - 1] = null;
      earr__6089[2 * this__6085.cnt - 2] = null;
      editable__6088.cnt = editable__6088.cnt - 1;
      return editable__6088
    }
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__6090 = this;
  var inode__6091 = this;
  return cljs.core.inode_kv_reduce.call(null, this__6090.arr, f, init)
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6094 = cljs.core.hash.call(null, key1);
    if(key1hash__6094 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6094, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6095 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__6094, key1, val1, added_leaf_QMARK___6095).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___6095)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__6096 = cljs.core.hash.call(null, key1);
    if(key1hash__6096 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__6096, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___6097 = [false];
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__6096, key1, val1, added_leaf_QMARK___6097).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___6097)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6098 = this;
  var h__364__auto____6099 = this__6098.__hash;
  if(h__364__auto____6099 != null) {
    return h__364__auto____6099
  }else {
    var h__364__auto____6100 = cljs.core.hash_coll.call(null, coll);
    this__6098.__hash = h__364__auto____6100;
    return h__364__auto____6100
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6101 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__6102 = this;
  var this$__6103 = this;
  return cljs.core.pr_str.call(null, this$__6103)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6104 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6105 = this;
  if(this__6105.s == null) {
    return cljs.core.PersistentVector.fromArray([this__6105.nodes[this__6105.i], this__6105.nodes[this__6105.i + 1]])
  }else {
    return cljs.core.first.call(null, this__6105.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6106 = this;
  if(this__6106.s == null) {
    return cljs.core.create_inode_seq.call(null, this__6106.nodes, this__6106.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__6106.nodes, this__6106.i, cljs.core.next.call(null, this__6106.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6107 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6108 = this;
  return new cljs.core.NodeSeq(meta, this__6108.nodes, this__6108.i, this__6108.s, this__6108.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6109 = this;
  return this__6109.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6110 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6110.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__6111 = nodes.length;
      var j__6112 = i;
      while(true) {
        if(j__6112 < len__6111) {
          if(null != nodes[j__6112]) {
            return new cljs.core.NodeSeq(null, nodes, j__6112, null, null)
          }else {
            var temp__3971__auto____6113 = nodes[j__6112 + 1];
            if(cljs.core.truth_(temp__3971__auto____6113)) {
              var node__6114 = temp__3971__auto____6113;
              var temp__3971__auto____6115 = node__6114.inode_seq();
              if(cljs.core.truth_(temp__3971__auto____6115)) {
                var node_seq__6116 = temp__3971__auto____6115;
                return new cljs.core.NodeSeq(null, nodes, j__6112 + 2, node_seq__6116, null)
              }else {
                var G__6117 = j__6112 + 2;
                j__6112 = G__6117;
                continue
              }
            }else {
              var G__6118 = j__6112 + 2;
              j__6112 = G__6118;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925324
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6119 = this;
  var h__364__auto____6120 = this__6119.__hash;
  if(h__364__auto____6120 != null) {
    return h__364__auto____6120
  }else {
    var h__364__auto____6121 = cljs.core.hash_coll.call(null, coll);
    this__6119.__hash = h__364__auto____6121;
    return h__364__auto____6121
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6122 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__6123 = this;
  var this$__6124 = this;
  return cljs.core.pr_str.call(null, this$__6124)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6125 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6126 = this;
  return cljs.core.first.call(null, this__6126.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6127 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__6127.nodes, this__6127.i, cljs.core.next.call(null, this__6127.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6128 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6129 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__6129.nodes, this__6129.i, this__6129.s, this__6129.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6130 = this;
  return this__6130.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6131 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6131.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__6132 = nodes.length;
      var j__6133 = i;
      while(true) {
        if(j__6133 < len__6132) {
          var temp__3971__auto____6134 = nodes[j__6133];
          if(cljs.core.truth_(temp__3971__auto____6134)) {
            var nj__6135 = temp__3971__auto____6134;
            var temp__3971__auto____6136 = nj__6135.inode_seq();
            if(cljs.core.truth_(temp__3971__auto____6136)) {
              var ns__6137 = temp__3971__auto____6136;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__6133 + 1, ns__6137, null)
            }else {
              var G__6138 = j__6133 + 1;
              j__6133 = G__6138;
              continue
            }
          }else {
            var G__6139 = j__6133 + 1;
            j__6133 = G__6139;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
void 0;
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155545487
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6144 = this;
  return new cljs.core.TransientHashMap({}, this__6144.root, this__6144.cnt, this__6144.has_nil_QMARK_, this__6144.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6145 = this;
  var h__364__auto____6146 = this__6145.__hash;
  if(h__364__auto____6146 != null) {
    return h__364__auto____6146
  }else {
    var h__364__auto____6147 = cljs.core.hash_imap.call(null, coll);
    this__6145.__hash = h__364__auto____6147;
    return h__364__auto____6147
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6148 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6149 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6149.has_nil_QMARK_)) {
      return this__6149.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6149.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return cljs.core.nth.call(null, this__6149.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6150 = this;
  if(k == null) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6151 = this__6150.has_nil_QMARK_;
      if(cljs.core.truth_(and__3822__auto____6151)) {
        return v === this__6150.nil_val
      }else {
        return and__3822__auto____6151
      }
    }())) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6150.meta, cljs.core.truth_(this__6150.has_nil_QMARK_) ? this__6150.cnt : this__6150.cnt + 1, this__6150.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___6152 = [false];
    var new_root__6153 = (this__6150.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6150.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6152);
    if(new_root__6153 === this__6150.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__6150.meta, cljs.core.truth_(added_leaf_QMARK___6152[0]) ? this__6150.cnt + 1 : this__6150.cnt, new_root__6153, this__6150.has_nil_QMARK_, this__6150.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6154 = this;
  if(k == null) {
    return this__6154.has_nil_QMARK_
  }else {
    if(this__6154.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return cljs.core.not.call(null, this__6154.root.inode_find(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__6175 = null;
  var G__6175__2 = function(tsym6142, k) {
    var this__6155 = this;
    var tsym6142__6156 = this;
    var coll__6157 = tsym6142__6156;
    return cljs.core._lookup.call(null, coll__6157, k)
  };
  var G__6175__3 = function(tsym6143, k, not_found) {
    var this__6158 = this;
    var tsym6143__6159 = this;
    var coll__6160 = tsym6143__6159;
    return cljs.core._lookup.call(null, coll__6160, k, not_found)
  };
  G__6175 = function(tsym6143, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6175__2.call(this, tsym6143, k);
      case 3:
        return G__6175__3.call(this, tsym6143, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6175
}();
cljs.core.PersistentHashMap.prototype.apply = function(tsym6140, args6141) {
  return tsym6140.call.apply(tsym6140, [tsym6140].concat(cljs.core.aclone.call(null, args6141)))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6161 = this;
  var init__6162 = cljs.core.truth_(this__6161.has_nil_QMARK_) ? f.call(null, init, null, this__6161.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__6162)) {
    return cljs.core.deref.call(null, init__6162)
  }else {
    if(null != this__6161.root) {
      return this__6161.root.kv_reduce(f, init__6162)
    }else {
      if("\ufdd0'else") {
        return init__6162
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6163 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__6164 = this;
  var this$__6165 = this;
  return cljs.core.pr_str.call(null, this$__6165)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6166 = this;
  if(this__6166.cnt > 0) {
    var s__6167 = null != this__6166.root ? this__6166.root.inode_seq() : null;
    if(cljs.core.truth_(this__6166.has_nil_QMARK_)) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__6166.nil_val]), s__6167)
    }else {
      return s__6167
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6168 = this;
  return this__6168.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6169 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6170 = this;
  return new cljs.core.PersistentHashMap(meta, this__6170.cnt, this__6170.root, this__6170.has_nil_QMARK_, this__6170.nil_val, this__6170.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6171 = this;
  return this__6171.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6172 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__6172.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6173 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6173.has_nil_QMARK_)) {
      return new cljs.core.PersistentHashMap(this__6173.meta, this__6173.cnt - 1, this__6173.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__6173.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__6174 = this__6173.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__6174 === this__6173.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__6173.meta, this__6173.cnt - 1, new_root__6174, this__6173.has_nil_QMARK_, this__6173.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__6176 = ks.length;
  var i__6177 = 0;
  var out__6178 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__6177 < len__6176) {
      var G__6179 = i__6177 + 1;
      var G__6180 = cljs.core.assoc_BANG_.call(null, out__6178, ks[i__6177], vs[i__6177]);
      i__6177 = G__6179;
      out__6178 = G__6180;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6178)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 7;
  this.cljs$lang$protocol_mask$partition0$ = 130
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__6181 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__6182 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__6183 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6184 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__6185 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6185.has_nil_QMARK_)) {
      return this__6185.nil_val
    }else {
      return null
    }
  }else {
    if(this__6185.root == null) {
      return null
    }else {
      return cljs.core.nth.call(null, this__6185.root.inode_find(0, cljs.core.hash.call(null, k), k), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__6186 = this;
  if(k == null) {
    if(cljs.core.truth_(this__6186.has_nil_QMARK_)) {
      return this__6186.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__6186.root == null) {
      return not_found
    }else {
      return cljs.core.nth.call(null, this__6186.root.inode_find(0, cljs.core.hash.call(null, k), k, [null, not_found]), 1)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6187 = this;
  if(cljs.core.truth_(this__6187.edit)) {
    return this__6187.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__6188 = this;
  var tcoll__6189 = this;
  if(cljs.core.truth_(this__6188.edit)) {
    if(function() {
      var G__6190__6191 = o;
      if(G__6190__6191 != null) {
        if(function() {
          var or__3824__auto____6192 = G__6190__6191.cljs$lang$protocol_mask$partition0$ & 1024;
          if(or__3824__auto____6192) {
            return or__3824__auto____6192
          }else {
            return G__6190__6191.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__6190__6191.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6190__6191)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__6190__6191)
      }
    }()) {
      return tcoll__6189.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__6193 = cljs.core.seq.call(null, o);
      var tcoll__6194 = tcoll__6189;
      while(true) {
        var temp__3971__auto____6195 = cljs.core.first.call(null, es__6193);
        if(cljs.core.truth_(temp__3971__auto____6195)) {
          var e__6196 = temp__3971__auto____6195;
          var G__6207 = cljs.core.next.call(null, es__6193);
          var G__6208 = tcoll__6194.assoc_BANG_(cljs.core.key.call(null, e__6196), cljs.core.val.call(null, e__6196));
          es__6193 = G__6207;
          tcoll__6194 = G__6208;
          continue
        }else {
          return tcoll__6194
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__6197 = this;
  var tcoll__6198 = this;
  if(cljs.core.truth_(this__6197.edit)) {
    if(k == null) {
      if(this__6197.nil_val === v) {
      }else {
        this__6197.nil_val = v
      }
      if(cljs.core.truth_(this__6197.has_nil_QMARK_)) {
      }else {
        this__6197.count = this__6197.count + 1;
        this__6197.has_nil_QMARK_ = true
      }
      return tcoll__6198
    }else {
      var added_leaf_QMARK___6199 = [false];
      var node__6200 = (this__6197.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__6197.root).inode_assoc_BANG_(this__6197.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___6199);
      if(node__6200 === this__6197.root) {
      }else {
        this__6197.root = node__6200
      }
      if(cljs.core.truth_(added_leaf_QMARK___6199[0])) {
        this__6197.count = this__6197.count + 1
      }else {
      }
      return tcoll__6198
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__6201 = this;
  var tcoll__6202 = this;
  if(cljs.core.truth_(this__6201.edit)) {
    if(k == null) {
      if(cljs.core.truth_(this__6201.has_nil_QMARK_)) {
        this__6201.has_nil_QMARK_ = false;
        this__6201.nil_val = null;
        this__6201.count = this__6201.count - 1;
        return tcoll__6202
      }else {
        return tcoll__6202
      }
    }else {
      if(this__6201.root == null) {
        return tcoll__6202
      }else {
        var removed_leaf_QMARK___6203 = [false];
        var node__6204 = this__6201.root.inode_without_BANG_(this__6201.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___6203);
        if(node__6204 === this__6201.root) {
        }else {
          this__6201.root = node__6204
        }
        if(cljs.core.truth_(removed_leaf_QMARK___6203[0])) {
          this__6201.count = this__6201.count - 1
        }else {
        }
        return tcoll__6202
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__6205 = this;
  var tcoll__6206 = this;
  if(cljs.core.truth_(this__6205.edit)) {
    this__6205.edit = null;
    return new cljs.core.PersistentHashMap(null, this__6205.count, this__6205.root, this__6205.has_nil_QMARK_, this__6205.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__6209 = node;
  var stack__6210 = stack;
  while(true) {
    if(t__6209 != null) {
      var G__6211 = cljs.core.truth_(ascending_QMARK_) ? t__6209.left : t__6209.right;
      var G__6212 = cljs.core.conj.call(null, stack__6210, t__6209);
      t__6209 = G__6211;
      stack__6210 = G__6212;
      continue
    }else {
      return stack__6210
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15925322
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6213 = this;
  var h__364__auto____6214 = this__6213.__hash;
  if(h__364__auto____6214 != null) {
    return h__364__auto____6214
  }else {
    var h__364__auto____6215 = cljs.core.hash_coll.call(null, coll);
    this__6213.__hash = h__364__auto____6215;
    return h__364__auto____6215
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISequential$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6216 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__6217 = this;
  var this$__6218 = this;
  return cljs.core.pr_str.call(null, this$__6218)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6219 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6220 = this;
  if(this__6220.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__6220.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__6221 = this;
  return cljs.core.peek.call(null, this__6221.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__6222 = this;
  var t__6223 = cljs.core.peek.call(null, this__6222.stack);
  var next_stack__6224 = cljs.core.tree_map_seq_push.call(null, cljs.core.truth_(this__6222.ascending_QMARK_) ? t__6223.right : t__6223.left, cljs.core.pop.call(null, this__6222.stack), this__6222.ascending_QMARK_);
  if(next_stack__6224 != null) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__6224, this__6222.ascending_QMARK_, this__6222.cnt - 1, null)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6225 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6226 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__6226.stack, this__6226.ascending_QMARK_, this__6226.cnt, this__6226.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6227 = this;
  return this__6227.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
void 0;
void 0;
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3822__auto____6228 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3822__auto____6228) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3822__auto____6228
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3822__auto____6229 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3822__auto____6229) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3822__auto____6229
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__6230 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__6230)) {
    return cljs.core.deref.call(null, init__6230)
  }else {
    var init__6231 = node.left != null ? tree_map_kv_reduce.call(null, node.left, f, init__6230) : init__6230;
    if(cljs.core.reduced_QMARK_.call(null, init__6231)) {
      return cljs.core.deref.call(null, init__6231)
    }else {
      var init__6232 = node.right != null ? tree_map_kv_reduce.call(null, node.right, f, init__6231) : init__6231;
      if(cljs.core.reduced_QMARK_.call(null, init__6232)) {
        return cljs.core.deref.call(null, init__6232)
      }else {
        return init__6232
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$ = true;
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6237 = this;
  var h__364__auto____6238 = this__6237.__hash;
  if(h__364__auto____6238 != null) {
    return h__364__auto____6238
  }else {
    var h__364__auto____6239 = cljs.core.hash_coll.call(null, coll);
    this__6237.__hash = h__364__auto____6239;
    return h__364__auto____6239
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$ = true;
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6240 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6241 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6242 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6242.key, this__6242.val]), k, v)
};
cljs.core.BlackNode.prototype.cljs$core$IFn$ = true;
cljs.core.BlackNode.prototype.call = function() {
  var G__6289 = null;
  var G__6289__2 = function(tsym6235, k) {
    var this__6243 = this;
    var tsym6235__6244 = this;
    var node__6245 = tsym6235__6244;
    return cljs.core._lookup.call(null, node__6245, k)
  };
  var G__6289__3 = function(tsym6236, k, not_found) {
    var this__6246 = this;
    var tsym6236__6247 = this;
    var node__6248 = tsym6236__6247;
    return cljs.core._lookup.call(null, node__6248, k, not_found)
  };
  G__6289 = function(tsym6236, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6289__2.call(this, tsym6236, k);
      case 3:
        return G__6289__3.call(this, tsym6236, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6289
}();
cljs.core.BlackNode.prototype.apply = function(tsym6233, args6234) {
  return tsym6233.call.apply(tsym6233, [tsym6233].concat(cljs.core.aclone.call(null, args6234)))
};
cljs.core.BlackNode.prototype.cljs$core$ISequential$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6249 = this;
  return cljs.core.PersistentVector.fromArray([this__6249.key, this__6249.val, o])
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6250 = this;
  return this__6250.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6251 = this;
  return this__6251.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__6252 = this;
  var node__6253 = this;
  return ins.balance_right(node__6253)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__6254 = this;
  var node__6255 = this;
  return new cljs.core.RedNode(this__6254.key, this__6254.val, this__6254.left, this__6254.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__6256 = this;
  var node__6257 = this;
  return cljs.core.balance_right_del.call(null, this__6256.key, this__6256.val, this__6256.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__6258 = this;
  var node__6259 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__6260 = this;
  var node__6261 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6261, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__6262 = this;
  var node__6263 = this;
  return cljs.core.balance_left_del.call(null, this__6262.key, this__6262.val, del, this__6262.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__6264 = this;
  var node__6265 = this;
  return ins.balance_left(node__6265)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__6266 = this;
  var node__6267 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__6267, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__6290 = null;
  var G__6290__0 = function() {
    var this__6270 = this;
    var this$__6271 = this;
    return cljs.core.pr_str.call(null, this$__6271)
  };
  G__6290 = function() {
    switch(arguments.length) {
      case 0:
        return G__6290__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6290
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__6272 = this;
  var node__6273 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6273, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__6274 = this;
  var node__6275 = this;
  return node__6275
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$ = true;
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6276 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6277 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6278 = this;
  return cljs.core.list.call(null, this__6278.key, this__6278.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$ = true;
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6280 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$ = true;
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6281 = this;
  return this__6281.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6282 = this;
  return cljs.core.PersistentVector.fromArray([this__6282.key])
};
cljs.core.BlackNode.prototype.cljs$core$IVector$ = true;
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6283 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6283.key, this__6283.val]), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6284 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6285 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6285.key, this__6285.val]), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$ = true;
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6286 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6287 = this;
  if(n === 0) {
    return this__6287.key
  }else {
    if(n === 1) {
      return this__6287.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6288 = this;
  if(n === 0) {
    return this__6288.key
  }else {
    if(n === 1) {
      return this__6288.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6279 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16201119
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$ = true;
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6295 = this;
  var h__364__auto____6296 = this__6295.__hash;
  if(h__364__auto____6296 != null) {
    return h__364__auto____6296
  }else {
    var h__364__auto____6297 = cljs.core.hash_coll.call(null, coll);
    this__6295.__hash = h__364__auto____6297;
    return h__364__auto____6297
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$ = true;
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__6298 = this;
  return cljs.core._nth.call(null, node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__6299 = this;
  return cljs.core._nth.call(null, node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$ = true;
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__6300 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__6300.key, this__6300.val]), k, v)
};
cljs.core.RedNode.prototype.cljs$core$IFn$ = true;
cljs.core.RedNode.prototype.call = function() {
  var G__6347 = null;
  var G__6347__2 = function(tsym6293, k) {
    var this__6301 = this;
    var tsym6293__6302 = this;
    var node__6303 = tsym6293__6302;
    return cljs.core._lookup.call(null, node__6303, k)
  };
  var G__6347__3 = function(tsym6294, k, not_found) {
    var this__6304 = this;
    var tsym6294__6305 = this;
    var node__6306 = tsym6294__6305;
    return cljs.core._lookup.call(null, node__6306, k, not_found)
  };
  G__6347 = function(tsym6294, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6347__2.call(this, tsym6294, k);
      case 3:
        return G__6347__3.call(this, tsym6294, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6347
}();
cljs.core.RedNode.prototype.apply = function(tsym6291, args6292) {
  return tsym6291.call.apply(tsym6291, [tsym6291].concat(cljs.core.aclone.call(null, args6292)))
};
cljs.core.RedNode.prototype.cljs$core$ISequential$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$ = true;
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__6307 = this;
  return cljs.core.PersistentVector.fromArray([this__6307.key, this__6307.val, o])
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$ = true;
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__6308 = this;
  return this__6308.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__6309 = this;
  return this__6309.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__6310 = this;
  var node__6311 = this;
  return new cljs.core.RedNode(this__6310.key, this__6310.val, this__6310.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__6312 = this;
  var node__6313 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__6314 = this;
  var node__6315 = this;
  return new cljs.core.RedNode(this__6314.key, this__6314.val, this__6314.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__6316 = this;
  var node__6317 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__6318 = this;
  var node__6319 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__6319, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__6320 = this;
  var node__6321 = this;
  return new cljs.core.RedNode(this__6320.key, this__6320.val, del, this__6320.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__6322 = this;
  var node__6323 = this;
  return new cljs.core.RedNode(this__6322.key, this__6322.val, ins, this__6322.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__6324 = this;
  var node__6325 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6324.left)) {
    return new cljs.core.RedNode(this__6324.key, this__6324.val, this__6324.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__6324.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6324.right)) {
      return new cljs.core.RedNode(this__6324.right.key, this__6324.right.val, new cljs.core.BlackNode(this__6324.key, this__6324.val, this__6324.left, this__6324.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__6324.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__6325, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__6348 = null;
  var G__6348__0 = function() {
    var this__6328 = this;
    var this$__6329 = this;
    return cljs.core.pr_str.call(null, this$__6329)
  };
  G__6348 = function() {
    switch(arguments.length) {
      case 0:
        return G__6348__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6348
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__6330 = this;
  var node__6331 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6330.right)) {
    return new cljs.core.RedNode(this__6330.key, this__6330.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6330.left, null), this__6330.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__6330.left)) {
      return new cljs.core.RedNode(this__6330.left.key, this__6330.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__6330.left.left, null), new cljs.core.BlackNode(this__6330.key, this__6330.val, this__6330.left.right, this__6330.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__6331, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__6332 = this;
  var node__6333 = this;
  return new cljs.core.BlackNode(this__6332.key, this__6332.val, this__6332.left, this__6332.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$ = true;
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__6334 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__6335 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$ = true;
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__6336 = this;
  return cljs.core.list.call(null, this__6336.key, this__6336.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$ = true;
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__6338 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$ = true;
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__6339 = this;
  return this__6339.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__6340 = this;
  return cljs.core.PersistentVector.fromArray([this__6340.key])
};
cljs.core.RedNode.prototype.cljs$core$IVector$ = true;
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__6341 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__6341.key, this__6341.val]), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$ = true;
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6342 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__6343 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__6343.key, this__6343.val]), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$ = true;
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__6344 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$ = true;
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__6345 = this;
  if(n === 0) {
    return this__6345.key
  }else {
    if(n === 1) {
      return this__6345.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__6346 = this;
  if(n === 0) {
    return this__6346.key
  }else {
    if(n === 1) {
      return this__6346.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__6337 = this;
  return cljs.core.PersistentVector.fromArray([])
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__6349 = comp.call(null, k, tree.key);
    if(c__6349 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__6349 < 0) {
        var ins__6350 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(ins__6350 != null) {
          return tree.add_left(ins__6350)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__6351 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(ins__6351 != null) {
            return tree.add_right(ins__6351)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__6352 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6352)) {
            return new cljs.core.RedNode(app__6352.key, app__6352.val, new cljs.core.RedNode(left.key, left.val, left.left, app__6352.left), new cljs.core.RedNode(right.key, right.val, app__6352.right, right.right), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__6352, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__6353 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__6353)) {
              return new cljs.core.RedNode(app__6353.key, app__6353.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__6353.left, null), new cljs.core.BlackNode(right.key, right.val, app__6353.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__6353, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(tree != null) {
    var c__6354 = comp.call(null, k, tree.key);
    if(c__6354 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__6354 < 0) {
        var del__6355 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3824__auto____6356 = del__6355 != null;
          if(or__3824__auto____6356) {
            return or__3824__auto____6356
          }else {
            return found[0] != null
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__6355, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__6355, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__6357 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3824__auto____6358 = del__6357 != null;
            if(or__3824__auto____6358) {
              return or__3824__auto____6358
            }else {
              return found[0] != null
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__6357)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__6357, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__6359 = tree.key;
  var c__6360 = comp.call(null, k, tk__6359);
  if(c__6360 === 0) {
    return tree.replace(tk__6359, v, tree.left, tree.right)
  }else {
    if(c__6360 < 0) {
      return tree.replace(tk__6359, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__6359, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
void 0;
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 209388431
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6365 = this;
  var h__364__auto____6366 = this__6365.__hash;
  if(h__364__auto____6366 != null) {
    return h__364__auto____6366
  }else {
    var h__364__auto____6367 = cljs.core.hash_imap.call(null, coll);
    this__6365.__hash = h__364__auto____6367;
    return h__364__auto____6367
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__6368 = this;
  return cljs.core._lookup.call(null, coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__6369 = this;
  var n__6370 = coll.entry_at(k);
  if(n__6370 != null) {
    return n__6370.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__6371 = this;
  var found__6372 = [null];
  var t__6373 = cljs.core.tree_map_add.call(null, this__6371.comp, this__6371.tree, k, v, found__6372);
  if(t__6373 == null) {
    var found_node__6374 = cljs.core.nth.call(null, found__6372, 0);
    if(cljs.core._EQ_.call(null, v, found_node__6374.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6371.comp, cljs.core.tree_map_replace.call(null, this__6371.comp, this__6371.tree, k, v), this__6371.cnt, this__6371.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6371.comp, t__6373.blacken(), this__6371.cnt + 1, this__6371.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__6375 = this;
  return coll.entry_at(k) != null
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__6407 = null;
  var G__6407__2 = function(tsym6363, k) {
    var this__6376 = this;
    var tsym6363__6377 = this;
    var coll__6378 = tsym6363__6377;
    return cljs.core._lookup.call(null, coll__6378, k)
  };
  var G__6407__3 = function(tsym6364, k, not_found) {
    var this__6379 = this;
    var tsym6364__6380 = this;
    var coll__6381 = tsym6364__6380;
    return cljs.core._lookup.call(null, coll__6381, k, not_found)
  };
  G__6407 = function(tsym6364, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6407__2.call(this, tsym6364, k);
      case 3:
        return G__6407__3.call(this, tsym6364, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6407
}();
cljs.core.PersistentTreeMap.prototype.apply = function(tsym6361, args6362) {
  return tsym6361.call.apply(tsym6361, [tsym6361].concat(cljs.core.aclone.call(null, args6362)))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__6382 = this;
  if(this__6382.tree != null) {
    return cljs.core.tree_map_kv_reduce.call(null, this__6382.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__6383 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return cljs.core._assoc.call(null, coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6384 = this;
  if(this__6384.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6384.tree, false, this__6384.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__6385 = this;
  var this$__6386 = this;
  return cljs.core.pr_str.call(null, this$__6386)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__6387 = this;
  var coll__6388 = this;
  var t__6389 = this__6387.tree;
  while(true) {
    if(t__6389 != null) {
      var c__6390 = this__6387.comp.call(null, k, t__6389.key);
      if(c__6390 === 0) {
        return t__6389
      }else {
        if(c__6390 < 0) {
          var G__6408 = t__6389.left;
          t__6389 = G__6408;
          continue
        }else {
          if("\ufdd0'else") {
            var G__6409 = t__6389.right;
            t__6389 = G__6409;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6391 = this;
  if(this__6391.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6391.tree, ascending_QMARK_, this__6391.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6392 = this;
  if(this__6392.cnt > 0) {
    var stack__6393 = null;
    var t__6394 = this__6392.tree;
    while(true) {
      if(t__6394 != null) {
        var c__6395 = this__6392.comp.call(null, k, t__6394.key);
        if(c__6395 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__6393, t__6394), ascending_QMARK_, -1)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__6395 < 0) {
              var G__6410 = cljs.core.conj.call(null, stack__6393, t__6394);
              var G__6411 = t__6394.left;
              stack__6393 = G__6410;
              t__6394 = G__6411;
              continue
            }else {
              var G__6412 = stack__6393;
              var G__6413 = t__6394.right;
              stack__6393 = G__6412;
              t__6394 = G__6413;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__6395 > 0) {
                var G__6414 = cljs.core.conj.call(null, stack__6393, t__6394);
                var G__6415 = t__6394.right;
                stack__6393 = G__6414;
                t__6394 = G__6415;
                continue
              }else {
                var G__6416 = stack__6393;
                var G__6417 = t__6394.left;
                stack__6393 = G__6416;
                t__6394 = G__6417;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__6393 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__6393, ascending_QMARK_, -1)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6396 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6397 = this;
  return this__6397.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6398 = this;
  if(this__6398.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__6398.tree, true, this__6398.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6399 = this;
  return this__6399.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6400 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6401 = this;
  return new cljs.core.PersistentTreeMap(this__6401.comp, this__6401.tree, this__6401.cnt, meta, this__6401.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6405 = this;
  return this__6405.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6406 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__6406.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__6402 = this;
  var found__6403 = [null];
  var t__6404 = cljs.core.tree_map_remove.call(null, this__6402.comp, this__6402.tree, k, found__6403);
  if(t__6404 == null) {
    if(cljs.core.nth.call(null, found__6403, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__6402.comp, null, 0, this__6402.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__6402.comp, t__6404.blacken(), this__6402.cnt - 1, this__6402.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in$__6418 = cljs.core.seq.call(null, keyvals);
    var out__6419 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(cljs.core.truth_(in$__6418)) {
        var G__6420 = cljs.core.nnext.call(null, in$__6418);
        var G__6421 = cljs.core.assoc_BANG_.call(null, out__6419, cljs.core.first.call(null, in$__6418), cljs.core.second.call(null, in$__6418));
        in$__6418 = G__6420;
        out__6419 = G__6421;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__6419)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__6422) {
    var keyvals = cljs.core.seq(arglist__6422);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__6423) {
    var keyvals = cljs.core.seq(arglist__6423);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in$__6424 = cljs.core.seq.call(null, keyvals);
    var out__6425 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(cljs.core.truth_(in$__6424)) {
        var G__6426 = cljs.core.nnext.call(null, in$__6424);
        var G__6427 = cljs.core.assoc.call(null, out__6425, cljs.core.first.call(null, in$__6424), cljs.core.second.call(null, in$__6424));
        in$__6424 = G__6426;
        out__6425 = G__6427;
        continue
      }else {
        return out__6425
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__6428) {
    var keyvals = cljs.core.seq(arglist__6428);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in$__6429 = cljs.core.seq.call(null, keyvals);
    var out__6430 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(cljs.core.truth_(in$__6429)) {
        var G__6431 = cljs.core.nnext.call(null, in$__6429);
        var G__6432 = cljs.core.assoc.call(null, out__6430, cljs.core.first.call(null, in$__6429), cljs.core.second.call(null, in$__6429));
        in$__6429 = G__6431;
        out__6430 = G__6432;
        continue
      }else {
        return out__6430
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__6433) {
    var comparator = cljs.core.first(arglist__6433);
    var keyvals = cljs.core.rest(arglist__6433);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__6434_SHARP_, p2__6435_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3824__auto____6436 = p1__6434_SHARP_;
          if(cljs.core.truth_(or__3824__auto____6436)) {
            return or__3824__auto____6436
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), p2__6435_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__6437) {
    var maps = cljs.core.seq(arglist__6437);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__6440 = function(m, e) {
        var k__6438 = cljs.core.first.call(null, e);
        var v__6439 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__6438)) {
          return cljs.core.assoc.call(null, m, k__6438, f.call(null, cljs.core.get.call(null, m, k__6438), v__6439))
        }else {
          return cljs.core.assoc.call(null, m, k__6438, v__6439)
        }
      };
      var merge2__6442 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__6440, function() {
          var or__3824__auto____6441 = m1;
          if(cljs.core.truth_(or__3824__auto____6441)) {
            return or__3824__auto____6441
          }else {
            return cljs.core.ObjMap.fromObject([], {})
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__6442, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__6443) {
    var f = cljs.core.first(arglist__6443);
    var maps = cljs.core.rest(arglist__6443);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__6444 = cljs.core.ObjMap.fromObject([], {});
  var keys__6445 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(cljs.core.truth_(keys__6445)) {
      var key__6446 = cljs.core.first.call(null, keys__6445);
      var entry__6447 = cljs.core.get.call(null, map, key__6446, "\ufdd0'user/not-found");
      var G__6448 = cljs.core.not_EQ_.call(null, entry__6447, "\ufdd0'user/not-found") ? cljs.core.assoc.call(null, ret__6444, key__6446, entry__6447) : ret__6444;
      var G__6449 = cljs.core.next.call(null, keys__6445);
      ret__6444 = G__6448;
      keys__6445 = G__6449;
      continue
    }else {
      return ret__6444
    }
    break
  }
};
void 0;
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2155022479
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__6455 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__6455.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6456 = this;
  var h__364__auto____6457 = this__6456.__hash;
  if(h__364__auto____6457 != null) {
    return h__364__auto____6457
  }else {
    var h__364__auto____6458 = cljs.core.hash_iset.call(null, coll);
    this__6456.__hash = h__364__auto____6458;
    return h__364__auto____6458
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6459 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6460 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6460.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__6479 = null;
  var G__6479__2 = function(tsym6453, k) {
    var this__6461 = this;
    var tsym6453__6462 = this;
    var coll__6463 = tsym6453__6462;
    return cljs.core._lookup.call(null, coll__6463, k)
  };
  var G__6479__3 = function(tsym6454, k, not_found) {
    var this__6464 = this;
    var tsym6454__6465 = this;
    var coll__6466 = tsym6454__6465;
    return cljs.core._lookup.call(null, coll__6466, k, not_found)
  };
  G__6479 = function(tsym6454, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6479__2.call(this, tsym6454, k);
      case 3:
        return G__6479__3.call(this, tsym6454, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6479
}();
cljs.core.PersistentHashSet.prototype.apply = function(tsym6451, args6452) {
  return tsym6451.call.apply(tsym6451, [tsym6451].concat(cljs.core.aclone.call(null, args6452)))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6467 = this;
  return new cljs.core.PersistentHashSet(this__6467.meta, cljs.core.assoc.call(null, this__6467.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__6468 = this;
  var this$__6469 = this;
  return cljs.core.pr_str.call(null, this$__6469)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6470 = this;
  return cljs.core.keys.call(null, this__6470.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6471 = this;
  return new cljs.core.PersistentHashSet(this__6471.meta, cljs.core.dissoc.call(null, this__6471.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6472 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6473 = this;
  var and__3822__auto____6474 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6474) {
    var and__3822__auto____6475 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6475) {
      return cljs.core.every_QMARK_.call(null, function(p1__6450_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6450_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6475
    }
  }else {
    return and__3822__auto____6474
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6476 = this;
  return new cljs.core.PersistentHashSet(meta, this__6476.hash_map, this__6476.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6477 = this;
  return this__6477.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6478 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__6478.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 131;
  this.cljs$lang$protocol_mask$partition1$ = 17
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.TransientHashSet")
};
cljs.core.TransientHashSet.prototype.cljs$core$IFn$ = true;
cljs.core.TransientHashSet.prototype.call = function() {
  var G__6497 = null;
  var G__6497__2 = function(tsym6483, k) {
    var this__6485 = this;
    var tsym6483__6486 = this;
    var tcoll__6487 = tsym6483__6486;
    if(cljs.core._lookup.call(null, this__6485.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__6497__3 = function(tsym6484, k, not_found) {
    var this__6488 = this;
    var tsym6484__6489 = this;
    var tcoll__6490 = tsym6484__6489;
    if(cljs.core._lookup.call(null, this__6488.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__6497 = function(tsym6484, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6497__2.call(this, tsym6484, k);
      case 3:
        return G__6497__3.call(this, tsym6484, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6497
}();
cljs.core.TransientHashSet.prototype.apply = function(tsym6481, args6482) {
  return tsym6481.call.apply(tsym6481, [tsym6481].concat(cljs.core.aclone.call(null, args6482)))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__6491 = this;
  return cljs.core._lookup.call(null, tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__6492 = this;
  if(cljs.core._lookup.call(null, this__6492.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__6493 = this;
  return cljs.core.count.call(null, this__6493.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__6494 = this;
  this__6494.transient_map = cljs.core.dissoc_BANG_.call(null, this__6494.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$ = true;
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__6495 = this;
  this__6495.transient_map = cljs.core.assoc_BANG_.call(null, this__6495.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__6496 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__6496.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 208865423
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6502 = this;
  var h__364__auto____6503 = this__6502.__hash;
  if(h__364__auto____6503 != null) {
    return h__364__auto____6503
  }else {
    var h__364__auto____6504 = cljs.core.hash_iset.call(null, coll);
    this__6502.__hash = h__364__auto____6504;
    return h__364__auto____6504
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__6505 = this;
  return cljs.core._lookup.call(null, coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__6506 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__6506.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IFn$ = true;
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__6530 = null;
  var G__6530__2 = function(tsym6500, k) {
    var this__6507 = this;
    var tsym6500__6508 = this;
    var coll__6509 = tsym6500__6508;
    return cljs.core._lookup.call(null, coll__6509, k)
  };
  var G__6530__3 = function(tsym6501, k, not_found) {
    var this__6510 = this;
    var tsym6501__6511 = this;
    var coll__6512 = tsym6501__6511;
    return cljs.core._lookup.call(null, coll__6512, k, not_found)
  };
  G__6530 = function(tsym6501, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6530__2.call(this, tsym6501, k);
      case 3:
        return G__6530__3.call(this, tsym6501, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6530
}();
cljs.core.PersistentTreeSet.prototype.apply = function(tsym6498, args6499) {
  return tsym6498.call.apply(tsym6498, [tsym6498].concat(cljs.core.aclone.call(null, args6499)))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6513 = this;
  return new cljs.core.PersistentTreeSet(this__6513.meta, cljs.core.assoc.call(null, this__6513.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6514 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__6514.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__6515 = this;
  var this$__6516 = this;
  return cljs.core.pr_str.call(null, this$__6516)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__6517 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__6517.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__6518 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__6518.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__6519 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__6520 = this;
  return cljs.core._comparator.call(null, this__6520.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6521 = this;
  return cljs.core.keys.call(null, this__6521.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__6522 = this;
  return new cljs.core.PersistentTreeSet(this__6522.meta, cljs.core.dissoc.call(null, this__6522.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6523 = this;
  return cljs.core.count.call(null, this__6523.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6524 = this;
  var and__3822__auto____6525 = cljs.core.set_QMARK_.call(null, other);
  if(and__3822__auto____6525) {
    var and__3822__auto____6526 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3822__auto____6526) {
      return cljs.core.every_QMARK_.call(null, function(p1__6480_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__6480_SHARP_)
      }, other)
    }else {
      return and__3822__auto____6526
    }
  }else {
    return and__3822__auto____6525
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__6527 = this;
  return new cljs.core.PersistentTreeSet(meta, this__6527.tree_map, this__6527.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6528 = this;
  return this__6528.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__6529 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__6529.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.set = function set(coll) {
  var in$__6531 = cljs.core.seq.call(null, coll);
  var out__6532 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(cljs.core.truth_(cljs.core.seq.call(null, in$__6531))) {
      var G__6533 = cljs.core.next.call(null, in$__6531);
      var G__6534 = cljs.core.conj_BANG_.call(null, out__6532, cljs.core.first.call(null, in$__6531));
      in$__6531 = G__6533;
      out__6532 = G__6534;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__6532)
    }
    break
  }
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__6535) {
    var keys = cljs.core.seq(arglist__6535);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__6537) {
    var comparator = cljs.core.first(arglist__6537);
    var keys = cljs.core.rest(arglist__6537);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__6538 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__3971__auto____6539 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__3971__auto____6539)) {
        var e__6540 = temp__3971__auto____6539;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__6540))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__6538, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__6536_SHARP_) {
      var temp__3971__auto____6541 = cljs.core.find.call(null, smap, p1__6536_SHARP_);
      if(cljs.core.truth_(temp__3971__auto____6541)) {
        var e__6542 = temp__3971__auto____6541;
        return cljs.core.second.call(null, e__6542)
      }else {
        return p1__6536_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__6550 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__6543, seen) {
        while(true) {
          var vec__6544__6545 = p__6543;
          var f__6546 = cljs.core.nth.call(null, vec__6544__6545, 0, null);
          var xs__6547 = vec__6544__6545;
          var temp__3974__auto____6548 = cljs.core.seq.call(null, xs__6547);
          if(cljs.core.truth_(temp__3974__auto____6548)) {
            var s__6549 = temp__3974__auto____6548;
            if(cljs.core.contains_QMARK_.call(null, seen, f__6546)) {
              var G__6551 = cljs.core.rest.call(null, s__6549);
              var G__6552 = seen;
              p__6543 = G__6551;
              seen = G__6552;
              continue
            }else {
              return cljs.core.cons.call(null, f__6546, step.call(null, cljs.core.rest.call(null, s__6549), cljs.core.conj.call(null, seen, f__6546)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    })
  };
  return step__6550.call(null, coll, cljs.core.set([]))
};
cljs.core.butlast = function butlast(s) {
  var ret__6553 = cljs.core.PersistentVector.fromArray([]);
  var s__6554 = s;
  while(true) {
    if(cljs.core.truth_(cljs.core.next.call(null, s__6554))) {
      var G__6555 = cljs.core.conj.call(null, ret__6553, cljs.core.first.call(null, s__6554));
      var G__6556 = cljs.core.next.call(null, s__6554);
      ret__6553 = G__6555;
      s__6554 = G__6556;
      continue
    }else {
      return cljs.core.seq.call(null, ret__6553)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3824__auto____6557 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3824__auto____6557) {
        return or__3824__auto____6557
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__6558 = x.lastIndexOf("/");
      if(i__6558 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__6558 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3824__auto____6559 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3824__auto____6559) {
      return or__3824__auto____6559
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__6560 = x.lastIndexOf("/");
    if(i__6560 > -1) {
      return cljs.core.subs.call(null, x, 2, i__6560)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__6563 = cljs.core.ObjMap.fromObject([], {});
  var ks__6564 = cljs.core.seq.call(null, keys);
  var vs__6565 = cljs.core.seq.call(null, vals);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3822__auto____6566 = ks__6564;
      if(cljs.core.truth_(and__3822__auto____6566)) {
        return vs__6565
      }else {
        return and__3822__auto____6566
      }
    }())) {
      var G__6567 = cljs.core.assoc.call(null, map__6563, cljs.core.first.call(null, ks__6564), cljs.core.first.call(null, vs__6565));
      var G__6568 = cljs.core.next.call(null, ks__6564);
      var G__6569 = cljs.core.next.call(null, vs__6565);
      map__6563 = G__6567;
      ks__6564 = G__6568;
      vs__6565 = G__6569;
      continue
    }else {
      return map__6563
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__6572__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6561_SHARP_, p2__6562_SHARP_) {
        return max_key.call(null, k, p1__6561_SHARP_, p2__6562_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__6572 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6572__delegate.call(this, k, x, y, more)
    };
    G__6572.cljs$lang$maxFixedArity = 3;
    G__6572.cljs$lang$applyTo = function(arglist__6573) {
      var k = cljs.core.first(arglist__6573);
      var x = cljs.core.first(cljs.core.next(arglist__6573));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6573)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6573)));
      return G__6572__delegate(k, x, y, more)
    };
    G__6572.cljs$lang$arity$variadic = G__6572__delegate;
    return G__6572
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__6574__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__6570_SHARP_, p2__6571_SHARP_) {
        return min_key.call(null, k, p1__6570_SHARP_, p2__6571_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__6574 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6574__delegate.call(this, k, x, y, more)
    };
    G__6574.cljs$lang$maxFixedArity = 3;
    G__6574.cljs$lang$applyTo = function(arglist__6575) {
      var k = cljs.core.first(arglist__6575);
      var x = cljs.core.first(cljs.core.next(arglist__6575));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6575)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6575)));
      return G__6574__delegate(k, x, y, more)
    };
    G__6574.cljs$lang$arity$variadic = G__6574__delegate;
    return G__6574
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6576 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6576)) {
        var s__6577 = temp__3974__auto____6576;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__6577), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__6577)))
      }else {
        return null
      }
    })
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6578 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6578)) {
      var s__6579 = temp__3974__auto____6578;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__6579)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__6579), take_while.call(null, pred, cljs.core.rest.call(null, s__6579)))
      }else {
        return null
      }
    }else {
      return null
    }
  })
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__6580 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__6580.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__6581 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__3974__auto____6582 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__3974__auto____6582)) {
        var vec__6583__6584 = temp__3974__auto____6582;
        var e__6585 = cljs.core.nth.call(null, vec__6583__6584, 0, null);
        var s__6586 = vec__6583__6584;
        if(cljs.core.truth_(include__6581.call(null, e__6585))) {
          return s__6586
        }else {
          return cljs.core.next.call(null, s__6586)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6581, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6587 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__3974__auto____6587)) {
      var vec__6588__6589 = temp__3974__auto____6587;
      var e__6590 = cljs.core.nth.call(null, vec__6588__6589, 0, null);
      var s__6591 = vec__6588__6589;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__6590)) ? s__6591 : cljs.core.next.call(null, s__6591))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__6592 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.set([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__3974__auto____6593 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__3974__auto____6593)) {
        var vec__6594__6595 = temp__3974__auto____6593;
        var e__6596 = cljs.core.nth.call(null, vec__6594__6595, 0, null);
        var s__6597 = vec__6594__6595;
        if(cljs.core.truth_(include__6592.call(null, e__6596))) {
          return s__6597
        }else {
          return cljs.core.next.call(null, s__6597)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__6592, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__3974__auto____6598 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__3974__auto____6598)) {
      var vec__6599__6600 = temp__3974__auto____6598;
      var e__6601 = cljs.core.nth.call(null, vec__6599__6600, 0, null);
      var s__6602 = vec__6599__6600;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__6601)) ? s__6602 : cljs.core.next.call(null, s__6602))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 16187486
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Range")
};
cljs.core.Range.prototype.cljs$core$IHash$ = true;
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__6603 = this;
  var h__364__auto____6604 = this__6603.__hash;
  if(h__364__auto____6604 != null) {
    return h__364__auto____6604
  }else {
    var h__364__auto____6605 = cljs.core.hash_coll.call(null, rng);
    this__6603.__hash = h__364__auto____6605;
    return h__364__auto____6605
  }
};
cljs.core.Range.prototype.cljs$core$ISequential$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$ = true;
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__6606 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__6607 = this;
  var this$__6608 = this;
  return cljs.core.pr_str.call(null, this$__6608)
};
cljs.core.Range.prototype.cljs$core$IReduce$ = true;
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__6609 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__6610 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$ = true;
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__6611 = this;
  var comp__6612 = this__6611.step > 0 ? cljs.core._LT_ : cljs.core._GT_;
  if(cljs.core.truth_(comp__6612.call(null, this__6611.start, this__6611.end))) {
    return rng
  }else {
    return null
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$ = true;
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__6613 = this;
  if(cljs.core.not.call(null, cljs.core._seq.call(null, rng))) {
    return 0
  }else {
    return Math["ceil"]((this__6613.end - this__6613.start) / this__6613.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$ = true;
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__6614 = this;
  return this__6614.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__6615 = this;
  if(cljs.core.truth_(cljs.core._seq.call(null, rng))) {
    return new cljs.core.Range(this__6615.meta, this__6615.start + this__6615.step, this__6615.end, this__6615.step, null)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$ = true;
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__6616 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$ = true;
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__6617 = this;
  return new cljs.core.Range(meta, this__6617.start, this__6617.end, this__6617.step, this__6617.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$ = true;
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__6618 = this;
  return this__6618.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$ = true;
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__6619 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6619.start + n * this__6619.step
  }else {
    if(function() {
      var and__3822__auto____6620 = this__6619.start > this__6619.end;
      if(and__3822__auto____6620) {
        return this__6619.step === 0
      }else {
        return and__3822__auto____6620
      }
    }()) {
      return this__6619.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__6621 = this;
  if(n < cljs.core._count.call(null, rng)) {
    return this__6621.start + n * this__6621.step
  }else {
    if(function() {
      var and__3822__auto____6622 = this__6621.start > this__6621.end;
      if(and__3822__auto____6622) {
        return this__6621.step === 0
      }else {
        return and__3822__auto____6622
      }
    }()) {
      return this__6621.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$ = true;
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__6623 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__6623.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number["MAX_VALUE"], 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6624 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6624)) {
      var s__6625 = temp__3974__auto____6624;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__6625), take_nth.call(null, n, cljs.core.drop.call(null, n, s__6625)))
    }else {
      return null
    }
  })
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)])
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__3974__auto____6627 = cljs.core.seq.call(null, coll);
    if(cljs.core.truth_(temp__3974__auto____6627)) {
      var s__6628 = temp__3974__auto____6627;
      var fst__6629 = cljs.core.first.call(null, s__6628);
      var fv__6630 = f.call(null, fst__6629);
      var run__6631 = cljs.core.cons.call(null, fst__6629, cljs.core.take_while.call(null, function(p1__6626_SHARP_) {
        return cljs.core._EQ_.call(null, fv__6630, f.call(null, p1__6626_SHARP_))
      }, cljs.core.next.call(null, s__6628)));
      return cljs.core.cons.call(null, run__6631, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__6631), s__6628))))
    }else {
      return null
    }
  })
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core.get.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.fromObject([], {})), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__3971__auto____6642 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3971__auto____6642)) {
        var s__6643 = temp__3971__auto____6642;
        return reductions.call(null, f, cljs.core.first.call(null, s__6643), cljs.core.rest.call(null, s__6643))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    })
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__3974__auto____6644 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(temp__3974__auto____6644)) {
        var s__6645 = temp__3974__auto____6644;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__6645)), cljs.core.rest.call(null, s__6645))
      }else {
        return null
      }
    }))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__6647 = null;
      var G__6647__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__6647__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__6647__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__6647__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__6647__4 = function() {
        var G__6648__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__6648 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6648__delegate.call(this, x, y, z, args)
        };
        G__6648.cljs$lang$maxFixedArity = 3;
        G__6648.cljs$lang$applyTo = function(arglist__6649) {
          var x = cljs.core.first(arglist__6649);
          var y = cljs.core.first(cljs.core.next(arglist__6649));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6649)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6649)));
          return G__6648__delegate(x, y, z, args)
        };
        G__6648.cljs$lang$arity$variadic = G__6648__delegate;
        return G__6648
      }();
      G__6647 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6647__0.call(this);
          case 1:
            return G__6647__1.call(this, x);
          case 2:
            return G__6647__2.call(this, x, y);
          case 3:
            return G__6647__3.call(this, x, y, z);
          default:
            return G__6647__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6647.cljs$lang$maxFixedArity = 3;
      G__6647.cljs$lang$applyTo = G__6647__4.cljs$lang$applyTo;
      return G__6647
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__6650 = null;
      var G__6650__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__6650__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__6650__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__6650__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__6650__4 = function() {
        var G__6651__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__6651 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6651__delegate.call(this, x, y, z, args)
        };
        G__6651.cljs$lang$maxFixedArity = 3;
        G__6651.cljs$lang$applyTo = function(arglist__6652) {
          var x = cljs.core.first(arglist__6652);
          var y = cljs.core.first(cljs.core.next(arglist__6652));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6652)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6652)));
          return G__6651__delegate(x, y, z, args)
        };
        G__6651.cljs$lang$arity$variadic = G__6651__delegate;
        return G__6651
      }();
      G__6650 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6650__0.call(this);
          case 1:
            return G__6650__1.call(this, x);
          case 2:
            return G__6650__2.call(this, x, y);
          case 3:
            return G__6650__3.call(this, x, y, z);
          default:
            return G__6650__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6650.cljs$lang$maxFixedArity = 3;
      G__6650.cljs$lang$applyTo = G__6650__4.cljs$lang$applyTo;
      return G__6650
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__6653 = null;
      var G__6653__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__6653__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__6653__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__6653__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__6653__4 = function() {
        var G__6654__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__6654 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__6654__delegate.call(this, x, y, z, args)
        };
        G__6654.cljs$lang$maxFixedArity = 3;
        G__6654.cljs$lang$applyTo = function(arglist__6655) {
          var x = cljs.core.first(arglist__6655);
          var y = cljs.core.first(cljs.core.next(arglist__6655));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6655)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6655)));
          return G__6654__delegate(x, y, z, args)
        };
        G__6654.cljs$lang$arity$variadic = G__6654__delegate;
        return G__6654
      }();
      G__6653 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__6653__0.call(this);
          case 1:
            return G__6653__1.call(this, x);
          case 2:
            return G__6653__2.call(this, x, y);
          case 3:
            return G__6653__3.call(this, x, y, z);
          default:
            return G__6653__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__6653.cljs$lang$maxFixedArity = 3;
      G__6653.cljs$lang$applyTo = G__6653__4.cljs$lang$applyTo;
      return G__6653
    }()
  };
  var juxt__4 = function() {
    var G__6656__delegate = function(f, g, h, fs) {
      var fs__6646 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__6657 = null;
        var G__6657__0 = function() {
          return cljs.core.reduce.call(null, function(p1__6632_SHARP_, p2__6633_SHARP_) {
            return cljs.core.conj.call(null, p1__6632_SHARP_, p2__6633_SHARP_.call(null))
          }, cljs.core.PersistentVector.fromArray([]), fs__6646)
        };
        var G__6657__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__6634_SHARP_, p2__6635_SHARP_) {
            return cljs.core.conj.call(null, p1__6634_SHARP_, p2__6635_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.fromArray([]), fs__6646)
        };
        var G__6657__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__6636_SHARP_, p2__6637_SHARP_) {
            return cljs.core.conj.call(null, p1__6636_SHARP_, p2__6637_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.fromArray([]), fs__6646)
        };
        var G__6657__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__6638_SHARP_, p2__6639_SHARP_) {
            return cljs.core.conj.call(null, p1__6638_SHARP_, p2__6639_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.fromArray([]), fs__6646)
        };
        var G__6657__4 = function() {
          var G__6658__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__6640_SHARP_, p2__6641_SHARP_) {
              return cljs.core.conj.call(null, p1__6640_SHARP_, cljs.core.apply.call(null, p2__6641_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.fromArray([]), fs__6646)
          };
          var G__6658 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__6658__delegate.call(this, x, y, z, args)
          };
          G__6658.cljs$lang$maxFixedArity = 3;
          G__6658.cljs$lang$applyTo = function(arglist__6659) {
            var x = cljs.core.first(arglist__6659);
            var y = cljs.core.first(cljs.core.next(arglist__6659));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6659)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6659)));
            return G__6658__delegate(x, y, z, args)
          };
          G__6658.cljs$lang$arity$variadic = G__6658__delegate;
          return G__6658
        }();
        G__6657 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__6657__0.call(this);
            case 1:
              return G__6657__1.call(this, x);
            case 2:
              return G__6657__2.call(this, x, y);
            case 3:
              return G__6657__3.call(this, x, y, z);
            default:
              return G__6657__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__6657.cljs$lang$maxFixedArity = 3;
        G__6657.cljs$lang$applyTo = G__6657__4.cljs$lang$applyTo;
        return G__6657
      }()
    };
    var G__6656 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6656__delegate.call(this, f, g, h, fs)
    };
    G__6656.cljs$lang$maxFixedArity = 3;
    G__6656.cljs$lang$applyTo = function(arglist__6660) {
      var f = cljs.core.first(arglist__6660);
      var g = cljs.core.first(cljs.core.next(arglist__6660));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6660)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6660)));
      return G__6656__delegate(f, g, h, fs)
    };
    G__6656.cljs$lang$arity$variadic = G__6656__delegate;
    return G__6656
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.truth_(cljs.core.seq.call(null, coll))) {
        var G__6662 = cljs.core.next.call(null, coll);
        coll = G__6662;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3822__auto____6661 = cljs.core.seq.call(null, coll);
        if(cljs.core.truth_(and__3822__auto____6661)) {
          return n > 0
        }else {
          return and__3822__auto____6661
        }
      }())) {
        var G__6663 = n - 1;
        var G__6664 = cljs.core.next.call(null, coll);
        n = G__6663;
        coll = G__6664;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.re_matches = function re_matches(re, s) {
  var matches__6665 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__6665), s)) {
    if(cljs.core.count.call(null, matches__6665) === 1) {
      return cljs.core.first.call(null, matches__6665)
    }else {
      return cljs.core.vec.call(null, matches__6665)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__6666 = re.exec(s);
  if(matches__6666 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__6666) === 1) {
      return cljs.core.first.call(null, matches__6666)
    }else {
      return cljs.core.vec.call(null, matches__6666)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__6667 = cljs.core.re_find.call(null, re, s);
  var match_idx__6668 = s.search(re);
  var match_str__6669 = cljs.core.coll_QMARK_.call(null, match_data__6667) ? cljs.core.first.call(null, match_data__6667) : match_data__6667;
  var post_match__6670 = cljs.core.subs.call(null, s, match_idx__6668 + cljs.core.count.call(null, match_str__6669));
  if(cljs.core.truth_(match_data__6667)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__6667, re_seq.call(null, re, post_match__6670))
    })
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__6672__6673 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___6674 = cljs.core.nth.call(null, vec__6672__6673, 0, null);
  var flags__6675 = cljs.core.nth.call(null, vec__6672__6673, 1, null);
  var pattern__6676 = cljs.core.nth.call(null, vec__6672__6673, 2, null);
  return new RegExp(pattern__6676, flags__6675)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin]), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep]), cljs.core.map.call(null, function(p1__6671_SHARP_) {
    return print_one.call(null, p1__6671_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end]))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3822__auto____6677 = cljs.core.get.call(null, opts, "\ufdd0'meta");
          if(cljs.core.truth_(and__3822__auto____6677)) {
            var and__3822__auto____6681 = function() {
              var G__6678__6679 = obj;
              if(G__6678__6679 != null) {
                if(function() {
                  var or__3824__auto____6680 = G__6678__6679.cljs$lang$protocol_mask$partition0$ & 65536;
                  if(or__3824__auto____6680) {
                    return or__3824__auto____6680
                  }else {
                    return G__6678__6679.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__6678__6679.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6678__6679)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6678__6679)
              }
            }();
            if(cljs.core.truth_(and__3822__auto____6681)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3822__auto____6681
            }
          }else {
            return and__3822__auto____6677
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"]), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "])) : null, cljs.core.truth_(function() {
          var and__3822__auto____6682 = obj != null;
          if(and__3822__auto____6682) {
            return obj.cljs$lang$type
          }else {
            return and__3822__auto____6682
          }
        }()) ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__6683__6684 = obj;
          if(G__6683__6684 != null) {
            if(function() {
              var or__3824__auto____6685 = G__6683__6684.cljs$lang$protocol_mask$partition0$ & 268435456;
              if(or__3824__auto____6685) {
                return or__3824__auto____6685
              }else {
                return G__6683__6684.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__6683__6684.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6683__6684)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__6683__6684)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var first_obj__6686 = cljs.core.first.call(null, objs);
  var sb__6687 = new goog.string.StringBuffer;
  var G__6688__6689 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6688__6689)) {
    var obj__6690 = cljs.core.first.call(null, G__6688__6689);
    var G__6688__6691 = G__6688__6689;
    while(true) {
      if(obj__6690 === first_obj__6686) {
      }else {
        sb__6687.append(" ")
      }
      var G__6692__6693 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6690, opts));
      if(cljs.core.truth_(G__6692__6693)) {
        var string__6694 = cljs.core.first.call(null, G__6692__6693);
        var G__6692__6695 = G__6692__6693;
        while(true) {
          sb__6687.append(string__6694);
          var temp__3974__auto____6696 = cljs.core.next.call(null, G__6692__6695);
          if(cljs.core.truth_(temp__3974__auto____6696)) {
            var G__6692__6697 = temp__3974__auto____6696;
            var G__6700 = cljs.core.first.call(null, G__6692__6697);
            var G__6701 = G__6692__6697;
            string__6694 = G__6700;
            G__6692__6695 = G__6701;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6698 = cljs.core.next.call(null, G__6688__6691);
      if(cljs.core.truth_(temp__3974__auto____6698)) {
        var G__6688__6699 = temp__3974__auto____6698;
        var G__6702 = cljs.core.first.call(null, G__6688__6699);
        var G__6703 = G__6688__6699;
        obj__6690 = G__6702;
        G__6688__6691 = G__6703;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__6687
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__6704 = cljs.core.pr_sb.call(null, objs, opts);
  sb__6704.append("\n");
  return[cljs.core.str(sb__6704)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var first_obj__6705 = cljs.core.first.call(null, objs);
  var G__6706__6707 = cljs.core.seq.call(null, objs);
  if(cljs.core.truth_(G__6706__6707)) {
    var obj__6708 = cljs.core.first.call(null, G__6706__6707);
    var G__6706__6709 = G__6706__6707;
    while(true) {
      if(obj__6708 === first_obj__6705) {
      }else {
        cljs.core.string_print.call(null, " ")
      }
      var G__6710__6711 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__6708, opts));
      if(cljs.core.truth_(G__6710__6711)) {
        var string__6712 = cljs.core.first.call(null, G__6710__6711);
        var G__6710__6713 = G__6710__6711;
        while(true) {
          cljs.core.string_print.call(null, string__6712);
          var temp__3974__auto____6714 = cljs.core.next.call(null, G__6710__6713);
          if(cljs.core.truth_(temp__3974__auto____6714)) {
            var G__6710__6715 = temp__3974__auto____6714;
            var G__6718 = cljs.core.first.call(null, G__6710__6715);
            var G__6719 = G__6710__6715;
            string__6712 = G__6718;
            G__6710__6713 = G__6719;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__3974__auto____6716 = cljs.core.next.call(null, G__6706__6709);
      if(cljs.core.truth_(temp__3974__auto____6716)) {
        var G__6706__6717 = temp__3974__auto____6716;
        var G__6720 = cljs.core.first.call(null, G__6706__6717);
        var G__6721 = G__6706__6717;
        obj__6708 = G__6720;
        G__6706__6709 = G__6721;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core.get.call(null, opts, "\ufdd0'flush-on-newline"))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__6722) {
    var objs = cljs.core.seq(arglist__6722);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__6723) {
    var objs = cljs.core.seq(arglist__6723);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__6724) {
    var objs = cljs.core.seq(arglist__6724);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__6725) {
    var objs = cljs.core.seq(arglist__6725);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__6726) {
    var objs = cljs.core.seq(arglist__6726);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__6727) {
    var objs = cljs.core.seq(arglist__6727);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__6728) {
    var objs = cljs.core.seq(arglist__6728);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__6729) {
    var objs = cljs.core.seq(arglist__6729);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6730 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6730, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6731 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6731, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6732 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6732, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__3974__auto____6733 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__3974__auto____6733)) {
        var nspc__6734 = temp__3974__auto____6733;
        return[cljs.core.str(nspc__6734), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__3974__auto____6735 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__3974__auto____6735)) {
          var nspc__6736 = temp__3974__auto____6735;
          return[cljs.core.str(nspc__6736), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_("\ufdd0'readably".call(null, opts)) ? goog.string.quote.call(null, obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6737 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6737, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__6738 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__6738, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1345404928
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$ = true;
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6739 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$ = true;
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__6740 = this;
  var G__6741__6742 = cljs.core.seq.call(null, this__6740.watches);
  if(cljs.core.truth_(G__6741__6742)) {
    var G__6744__6746 = cljs.core.first.call(null, G__6741__6742);
    var vec__6745__6747 = G__6744__6746;
    var key__6748 = cljs.core.nth.call(null, vec__6745__6747, 0, null);
    var f__6749 = cljs.core.nth.call(null, vec__6745__6747, 1, null);
    var G__6741__6750 = G__6741__6742;
    var G__6744__6751 = G__6744__6746;
    var G__6741__6752 = G__6741__6750;
    while(true) {
      var vec__6753__6754 = G__6744__6751;
      var key__6755 = cljs.core.nth.call(null, vec__6753__6754, 0, null);
      var f__6756 = cljs.core.nth.call(null, vec__6753__6754, 1, null);
      var G__6741__6757 = G__6741__6752;
      f__6756.call(null, key__6755, this$, oldval, newval);
      var temp__3974__auto____6758 = cljs.core.next.call(null, G__6741__6757);
      if(cljs.core.truth_(temp__3974__auto____6758)) {
        var G__6741__6759 = temp__3974__auto____6758;
        var G__6766 = cljs.core.first.call(null, G__6741__6759);
        var G__6767 = G__6741__6759;
        G__6744__6751 = G__6766;
        G__6741__6752 = G__6767;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__6760 = this;
  return this$.watches = cljs.core.assoc.call(null, this__6760.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__6761 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__6761.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$ = true;
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__6762 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "]), cljs.core._pr_seq.call(null, this__6762.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$ = true;
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__6763 = this;
  return this__6763.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$ = true;
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6764 = this;
  return this__6764.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$ = true;
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__6765 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__6774__delegate = function(x, p__6768) {
      var map__6769__6770 = p__6768;
      var map__6769__6771 = cljs.core.seq_QMARK_.call(null, map__6769__6770) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6769__6770) : map__6769__6770;
      var validator__6772 = cljs.core.get.call(null, map__6769__6771, "\ufdd0'validator");
      var meta__6773 = cljs.core.get.call(null, map__6769__6771, "\ufdd0'meta");
      return new cljs.core.Atom(x, meta__6773, validator__6772, null)
    };
    var G__6774 = function(x, var_args) {
      var p__6768 = null;
      if(goog.isDef(var_args)) {
        p__6768 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6774__delegate.call(this, x, p__6768)
    };
    G__6774.cljs$lang$maxFixedArity = 1;
    G__6774.cljs$lang$applyTo = function(arglist__6775) {
      var x = cljs.core.first(arglist__6775);
      var p__6768 = cljs.core.rest(arglist__6775);
      return G__6774__delegate(x, p__6768)
    };
    G__6774.cljs$lang$arity$variadic = G__6774__delegate;
    return G__6774
  }();
  atom = function(x, var_args) {
    var p__6768 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__3974__auto____6776 = a.validator;
  if(cljs.core.truth_(temp__3974__auto____6776)) {
    var validate__6777 = temp__3974__auto____6776;
    if(cljs.core.truth_(validate__6777.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 5917))))].join(""));
    }
  }else {
  }
  var old_value__6778 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__6778, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__6779__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__6779 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__6779__delegate.call(this, a, f, x, y, z, more)
    };
    G__6779.cljs$lang$maxFixedArity = 5;
    G__6779.cljs$lang$applyTo = function(arglist__6780) {
      var a = cljs.core.first(arglist__6780);
      var f = cljs.core.first(cljs.core.next(arglist__6780));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6780)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6780))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6780)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__6780)))));
      return G__6779__delegate(a, f, x, y, z, more)
    };
    G__6779.cljs$lang$arity$variadic = G__6779__delegate;
    return G__6779
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__6781) {
    var iref = cljs.core.first(arglist__6781);
    var f = cljs.core.first(cljs.core.next(arglist__6781));
    var args = cljs.core.rest(cljs.core.next(arglist__6781));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 536887296
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$ = true;
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__6782 = this;
  return"\ufdd0'done".call(null, cljs.core.deref.call(null, this__6782.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$ = true;
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__6783 = this;
  return"\ufdd0'value".call(null, cljs.core.swap_BANG_.call(null, this__6783.state, function(p__6784) {
    var curr_state__6785 = p__6784;
    var curr_state__6786 = cljs.core.seq_QMARK_.call(null, curr_state__6785) ? cljs.core.apply.call(null, cljs.core.hash_map, curr_state__6785) : curr_state__6785;
    var done__6787 = cljs.core.get.call(null, curr_state__6786, "\ufdd0'done");
    if(cljs.core.truth_(done__6787)) {
      return curr_state__6786
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__6783.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__6788__6789 = options;
    var map__6788__6790 = cljs.core.seq_QMARK_.call(null, map__6788__6789) ? cljs.core.apply.call(null, cljs.core.hash_map, map__6788__6789) : map__6788__6789;
    var keywordize_keys__6791 = cljs.core.get.call(null, map__6788__6790, "\ufdd0'keywordize-keys");
    var keyfn__6792 = cljs.core.truth_(keywordize_keys__6791) ? cljs.core.keyword : cljs.core.str;
    var f__6798 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray.call(null, x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), function() {
                var iter__625__auto____6797 = function iter__6793(s__6794) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__6794__6795 = s__6794;
                    while(true) {
                      if(cljs.core.truth_(cljs.core.seq.call(null, s__6794__6795))) {
                        var k__6796 = cljs.core.first.call(null, s__6794__6795);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__6792.call(null, k__6796), thisfn.call(null, x[k__6796])]), iter__6793.call(null, cljs.core.rest.call(null, s__6794__6795)))
                      }else {
                        return null
                      }
                      break
                    }
                  })
                };
                return iter__625__auto____6797.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__6798.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__6799) {
    var x = cljs.core.first(arglist__6799);
    var options = cljs.core.rest(arglist__6799);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__6800 = cljs.core.atom.call(null, cljs.core.ObjMap.fromObject([], {}));
  return function() {
    var G__6804__delegate = function(args) {
      var temp__3971__auto____6801 = cljs.core.get.call(null, cljs.core.deref.call(null, mem__6800), args);
      if(cljs.core.truth_(temp__3971__auto____6801)) {
        var v__6802 = temp__3971__auto____6801;
        return v__6802
      }else {
        var ret__6803 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__6800, cljs.core.assoc, args, ret__6803);
        return ret__6803
      }
    };
    var G__6804 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6804__delegate.call(this, args)
    };
    G__6804.cljs$lang$maxFixedArity = 0;
    G__6804.cljs$lang$applyTo = function(arglist__6805) {
      var args = cljs.core.seq(arglist__6805);
      return G__6804__delegate(args)
    };
    G__6804.cljs$lang$arity$variadic = G__6804__delegate;
    return G__6804
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__6806 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__6806)) {
        var G__6807 = ret__6806;
        f = G__6807;
        continue
      }else {
        return ret__6806
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__6808__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__6808 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__6808__delegate.call(this, f, args)
    };
    G__6808.cljs$lang$maxFixedArity = 1;
    G__6808.cljs$lang$applyTo = function(arglist__6809) {
      var f = cljs.core.first(arglist__6809);
      var args = cljs.core.rest(arglist__6809);
      return G__6808__delegate(f, args)
    };
    G__6808.cljs$lang$arity$variadic = G__6808__delegate;
    return G__6808
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random() * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor(Math.random() * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__6810 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__6810, cljs.core.conj.call(null, cljs.core.get.call(null, ret, k__6810, cljs.core.PersistentVector.fromArray([])), x))
  }, cljs.core.ObjMap.fromObject([], {}), coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'descendants":cljs.core.ObjMap.fromObject([], {}), "\ufdd0'ancestors":cljs.core.ObjMap.fromObject([], {})})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3824__auto____6811 = cljs.core._EQ_.call(null, child, parent);
    if(or__3824__auto____6811) {
      return or__3824__auto____6811
    }else {
      var or__3824__auto____6812 = cljs.core.contains_QMARK_.call(null, "\ufdd0'ancestors".call(null, h).call(null, child), parent);
      if(or__3824__auto____6812) {
        return or__3824__auto____6812
      }else {
        var and__3822__auto____6813 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3822__auto____6813) {
          var and__3822__auto____6814 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3822__auto____6814) {
            var and__3822__auto____6815 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3822__auto____6815) {
              var ret__6816 = true;
              var i__6817 = 0;
              while(true) {
                if(function() {
                  var or__3824__auto____6818 = cljs.core.not.call(null, ret__6816);
                  if(or__3824__auto____6818) {
                    return or__3824__auto____6818
                  }else {
                    return i__6817 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__6816
                }else {
                  var G__6819 = isa_QMARK_.call(null, h, child.call(null, i__6817), parent.call(null, i__6817));
                  var G__6820 = i__6817 + 1;
                  ret__6816 = G__6819;
                  i__6817 = G__6820;
                  continue
                }
                break
              }
            }else {
              return and__3822__auto____6815
            }
          }else {
            return and__3822__auto____6814
          }
        }else {
          return and__3822__auto____6813
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'parents".call(null, h), tag))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'ancestors".call(null, h), tag))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core.get.call(null, "\ufdd0'descendants".call(null, h), tag))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6201))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6205))))].join(""));
    }
    var tp__6824 = "\ufdd0'parents".call(null, h);
    var td__6825 = "\ufdd0'descendants".call(null, h);
    var ta__6826 = "\ufdd0'ancestors".call(null, h);
    var tf__6827 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.get.call(null, targets, k, cljs.core.set([])), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3824__auto____6828 = cljs.core.contains_QMARK_.call(null, tp__6824.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__6826.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__6826.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, "\ufdd0'parents".call(null, h), tag, cljs.core.conj.call(null, cljs.core.get.call(null, tp__6824, tag, cljs.core.set([])), parent)), "\ufdd0'ancestors":tf__6827.call(null, "\ufdd0'ancestors".call(null, h), tag, td__6825, parent, ta__6826), "\ufdd0'descendants":tf__6827.call(null, "\ufdd0'descendants".call(null, h), parent, ta__6826, tag, td__6825)})
    }();
    if(cljs.core.truth_(or__3824__auto____6828)) {
      return or__3824__auto____6828
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__6829 = "\ufdd0'parents".call(null, h);
    var childsParents__6830 = cljs.core.truth_(parentMap__6829.call(null, tag)) ? cljs.core.disj.call(null, parentMap__6829.call(null, tag), parent) : cljs.core.set([]);
    var newParents__6831 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__6830)) ? cljs.core.assoc.call(null, parentMap__6829, tag, childsParents__6830) : cljs.core.dissoc.call(null, parentMap__6829, tag);
    var deriv_seq__6832 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__6821_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__6821_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__6821_SHARP_), cljs.core.second.call(null, p1__6821_SHARP_)))
    }, cljs.core.seq.call(null, newParents__6831)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__6829.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__6822_SHARP_, p2__6823_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__6822_SHARP_, p2__6823_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__6832))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__6833 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3824__auto____6835 = cljs.core.truth_(function() {
    var and__3822__auto____6834 = xprefs__6833;
    if(cljs.core.truth_(and__3822__auto____6834)) {
      return xprefs__6833.call(null, y)
    }else {
      return and__3822__auto____6834
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3824__auto____6835)) {
    return or__3824__auto____6835
  }else {
    var or__3824__auto____6837 = function() {
      var ps__6836 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__6836) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__6836), prefer_table))) {
          }else {
          }
          var G__6840 = cljs.core.rest.call(null, ps__6836);
          ps__6836 = G__6840;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3824__auto____6837)) {
      return or__3824__auto____6837
    }else {
      var or__3824__auto____6839 = function() {
        var ps__6838 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__6838) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__6838), y, prefer_table))) {
            }else {
            }
            var G__6841 = cljs.core.rest.call(null, ps__6838);
            ps__6838 = G__6841;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3824__auto____6839)) {
        return or__3824__auto____6839
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3824__auto____6842 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3824__auto____6842)) {
    return or__3824__auto____6842
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__6851 = cljs.core.reduce.call(null, function(be, p__6843) {
    var vec__6844__6845 = p__6843;
    var k__6846 = cljs.core.nth.call(null, vec__6844__6845, 0, null);
    var ___6847 = cljs.core.nth.call(null, vec__6844__6845, 1, null);
    var e__6848 = vec__6844__6845;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__6846)) {
      var be2__6850 = cljs.core.truth_(function() {
        var or__3824__auto____6849 = be == null;
        if(or__3824__auto____6849) {
          return or__3824__auto____6849
        }else {
          return cljs.core.dominates.call(null, k__6846, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__6848 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__6850), k__6846, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__6846), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__6850)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__6850
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__6851)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__6851));
      return cljs.core.second.call(null, best_entry__6851)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
void 0;
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3822__auto____6852 = mf;
    if(and__3822__auto____6852) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3822__auto____6852
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6853 = cljs.core._reset[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6853) {
        return or__3824__auto____6853
      }else {
        var or__3824__auto____6854 = cljs.core._reset["_"];
        if(or__3824__auto____6854) {
          return or__3824__auto____6854
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3822__auto____6855 = mf;
    if(and__3822__auto____6855) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3822__auto____6855
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    return function() {
      var or__3824__auto____6856 = cljs.core._add_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6856) {
        return or__3824__auto____6856
      }else {
        var or__3824__auto____6857 = cljs.core._add_method["_"];
        if(or__3824__auto____6857) {
          return or__3824__auto____6857
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6858 = mf;
    if(and__3822__auto____6858) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3822__auto____6858
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6859 = cljs.core._remove_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6859) {
        return or__3824__auto____6859
      }else {
        var or__3824__auto____6860 = cljs.core._remove_method["_"];
        if(or__3824__auto____6860) {
          return or__3824__auto____6860
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3822__auto____6861 = mf;
    if(and__3822__auto____6861) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3822__auto____6861
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    return function() {
      var or__3824__auto____6862 = cljs.core._prefer_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6862) {
        return or__3824__auto____6862
      }else {
        var or__3824__auto____6863 = cljs.core._prefer_method["_"];
        if(or__3824__auto____6863) {
          return or__3824__auto____6863
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3822__auto____6864 = mf;
    if(and__3822__auto____6864) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3822__auto____6864
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    return function() {
      var or__3824__auto____6865 = cljs.core._get_method[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6865) {
        return or__3824__auto____6865
      }else {
        var or__3824__auto____6866 = cljs.core._get_method["_"];
        if(or__3824__auto____6866) {
          return or__3824__auto____6866
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3822__auto____6867 = mf;
    if(and__3822__auto____6867) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3822__auto____6867
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6868 = cljs.core._methods[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6868) {
        return or__3824__auto____6868
      }else {
        var or__3824__auto____6869 = cljs.core._methods["_"];
        if(or__3824__auto____6869) {
          return or__3824__auto____6869
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3822__auto____6870 = mf;
    if(and__3822__auto____6870) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3822__auto____6870
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    return function() {
      var or__3824__auto____6871 = cljs.core._prefers[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6871) {
        return or__3824__auto____6871
      }else {
        var or__3824__auto____6872 = cljs.core._prefers["_"];
        if(or__3824__auto____6872) {
          return or__3824__auto____6872
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3822__auto____6873 = mf;
    if(and__3822__auto____6873) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3822__auto____6873
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    return function() {
      var or__3824__auto____6874 = cljs.core._dispatch[goog.typeOf.call(null, mf)];
      if(or__3824__auto____6874) {
        return or__3824__auto____6874
      }else {
        var or__3824__auto____6875 = cljs.core._dispatch["_"];
        if(or__3824__auto____6875) {
          return or__3824__auto____6875
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
void 0;
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__6876 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__6877 = cljs.core._get_method.call(null, mf, dispatch_val__6876);
  if(cljs.core.truth_(target_fn__6877)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__6876)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__6877, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 2097152;
  this.cljs$lang$protocol_mask$partition1$ = 32
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__454__auto__) {
  return cljs.core.list.call(null, "cljs.core.MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$ = true;
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__6878 = this;
  return goog.getUid.call(null, this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$ = true;
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__6879 = this;
  cljs.core.swap_BANG_.call(null, this__6879.method_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6879.method_cache, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6879.prefer_table, function(mf) {
    return cljs.core.ObjMap.fromObject([], {})
  });
  cljs.core.swap_BANG_.call(null, this__6879.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__6880 = this;
  cljs.core.swap_BANG_.call(null, this__6880.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__6880.method_cache, this__6880.method_table, this__6880.cached_hierarchy, this__6880.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__6881 = this;
  cljs.core.swap_BANG_.call(null, this__6881.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__6881.method_cache, this__6881.method_table, this__6881.cached_hierarchy, this__6881.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__6882 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__6882.cached_hierarchy), cljs.core.deref.call(null, this__6882.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__6882.method_cache, this__6882.method_table, this__6882.cached_hierarchy, this__6882.hierarchy)
  }
  var temp__3971__auto____6883 = cljs.core.deref.call(null, this__6882.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__3971__auto____6883)) {
    var target_fn__6884 = temp__3971__auto____6883;
    return target_fn__6884
  }else {
    var temp__3971__auto____6885 = cljs.core.find_and_cache_best_method.call(null, this__6882.name, dispatch_val, this__6882.hierarchy, this__6882.method_table, this__6882.prefer_table, this__6882.method_cache, this__6882.cached_hierarchy);
    if(cljs.core.truth_(temp__3971__auto____6885)) {
      var target_fn__6886 = temp__3971__auto____6885;
      return target_fn__6886
    }else {
      return cljs.core.deref.call(null, this__6882.method_table).call(null, this__6882.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__6887 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__6887.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__6887.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__6887.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core.get.call(null, old, dispatch_val_x, cljs.core.set([])), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__6887.method_cache, this__6887.method_table, this__6887.cached_hierarchy, this__6887.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__6888 = this;
  return cljs.core.deref.call(null, this__6888.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__6889 = this;
  return cljs.core.deref.call(null, this__6889.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__6890 = this;
  return cljs.core.do_dispatch.call(null, mf, this__6890.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__6891__delegate = function(_, args) {
    return cljs.core._dispatch.call(null, this, args)
  };
  var G__6891 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__6891__delegate.call(this, _, args)
  };
  G__6891.cljs$lang$maxFixedArity = 1;
  G__6891.cljs$lang$applyTo = function(arglist__6892) {
    var _ = cljs.core.first(arglist__6892);
    var args = cljs.core.rest(arglist__6892);
    return G__6891__delegate(_, args)
  };
  G__6891.cljs$lang$arity$variadic = G__6891__delegate;
  return G__6891
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  return cljs.core._dispatch.call(null, this, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
goog.provide("goog.userAgent");
goog.require("goog.string");
goog.userAgent.ASSUME_IE = false;
goog.userAgent.ASSUME_GECKO = false;
goog.userAgent.ASSUME_WEBKIT = false;
goog.userAgent.ASSUME_MOBILE_WEBKIT = false;
goog.userAgent.ASSUME_OPERA = false;
goog.userAgent.BROWSER_KNOWN_ = goog.userAgent.ASSUME_IE || goog.userAgent.ASSUME_GECKO || goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_OPERA;
goog.userAgent.getUserAgentString = function() {
  return goog.global["navigator"] ? goog.global["navigator"].userAgent : null
};
goog.userAgent.getNavigator = function() {
  return goog.global["navigator"]
};
goog.userAgent.init_ = function() {
  goog.userAgent.detectedOpera_ = false;
  goog.userAgent.detectedIe_ = false;
  goog.userAgent.detectedWebkit_ = false;
  goog.userAgent.detectedMobile_ = false;
  goog.userAgent.detectedGecko_ = false;
  var ua;
  if(!goog.userAgent.BROWSER_KNOWN_ && (ua = goog.userAgent.getUserAgentString())) {
    var navigator = goog.userAgent.getNavigator();
    goog.userAgent.detectedOpera_ = ua.indexOf("Opera") == 0;
    goog.userAgent.detectedIe_ = !goog.userAgent.detectedOpera_ && ua.indexOf("MSIE") != -1;
    goog.userAgent.detectedWebkit_ = !goog.userAgent.detectedOpera_ && ua.indexOf("WebKit") != -1;
    goog.userAgent.detectedMobile_ = goog.userAgent.detectedWebkit_ && ua.indexOf("Mobile") != -1;
    goog.userAgent.detectedGecko_ = !goog.userAgent.detectedOpera_ && !goog.userAgent.detectedWebkit_ && navigator.product == "Gecko"
  }
};
if(!goog.userAgent.BROWSER_KNOWN_) {
  goog.userAgent.init_()
}
goog.userAgent.OPERA = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_OPERA : goog.userAgent.detectedOpera_;
goog.userAgent.IE = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_IE : goog.userAgent.detectedIe_;
goog.userAgent.GECKO = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_GECKO : goog.userAgent.detectedGecko_;
goog.userAgent.WEBKIT = goog.userAgent.BROWSER_KNOWN_ ? goog.userAgent.ASSUME_WEBKIT || goog.userAgent.ASSUME_MOBILE_WEBKIT : goog.userAgent.detectedWebkit_;
goog.userAgent.MOBILE = goog.userAgent.ASSUME_MOBILE_WEBKIT || goog.userAgent.detectedMobile_;
goog.userAgent.SAFARI = goog.userAgent.WEBKIT;
goog.userAgent.determinePlatform_ = function() {
  var navigator = goog.userAgent.getNavigator();
  return navigator && navigator.platform || ""
};
goog.userAgent.PLATFORM = goog.userAgent.determinePlatform_();
goog.userAgent.ASSUME_MAC = false;
goog.userAgent.ASSUME_WINDOWS = false;
goog.userAgent.ASSUME_LINUX = false;
goog.userAgent.ASSUME_X11 = false;
goog.userAgent.PLATFORM_KNOWN_ = goog.userAgent.ASSUME_MAC || goog.userAgent.ASSUME_WINDOWS || goog.userAgent.ASSUME_LINUX || goog.userAgent.ASSUME_X11;
goog.userAgent.initPlatform_ = function() {
  goog.userAgent.detectedMac_ = goog.string.contains(goog.userAgent.PLATFORM, "Mac");
  goog.userAgent.detectedWindows_ = goog.string.contains(goog.userAgent.PLATFORM, "Win");
  goog.userAgent.detectedLinux_ = goog.string.contains(goog.userAgent.PLATFORM, "Linux");
  goog.userAgent.detectedX11_ = !!goog.userAgent.getNavigator() && goog.string.contains(goog.userAgent.getNavigator()["appVersion"] || "", "X11")
};
if(!goog.userAgent.PLATFORM_KNOWN_) {
  goog.userAgent.initPlatform_()
}
goog.userAgent.MAC = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_MAC : goog.userAgent.detectedMac_;
goog.userAgent.WINDOWS = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_WINDOWS : goog.userAgent.detectedWindows_;
goog.userAgent.LINUX = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_LINUX : goog.userAgent.detectedLinux_;
goog.userAgent.X11 = goog.userAgent.PLATFORM_KNOWN_ ? goog.userAgent.ASSUME_X11 : goog.userAgent.detectedX11_;
goog.userAgent.determineVersion_ = function() {
  var version = "", re;
  if(goog.userAgent.OPERA && goog.global["opera"]) {
    var operaVersion = goog.global["opera"].version;
    version = typeof operaVersion == "function" ? operaVersion() : operaVersion
  }else {
    if(goog.userAgent.GECKO) {
      re = /rv\:([^\);]+)(\)|;)/
    }else {
      if(goog.userAgent.IE) {
        re = /MSIE\s+([^\);]+)(\)|;)/
      }else {
        if(goog.userAgent.WEBKIT) {
          re = /WebKit\/(\S+)/
        }
      }
    }
    if(re) {
      var arr = re.exec(goog.userAgent.getUserAgentString());
      version = arr ? arr[1] : ""
    }
  }
  if(goog.userAgent.IE) {
    var docMode = goog.userAgent.getDocumentMode_();
    if(docMode > parseFloat(version)) {
      return String(docMode)
    }
  }
  return version
};
goog.userAgent.getDocumentMode_ = function() {
  var doc = goog.global["document"];
  return doc ? doc["documentMode"] : undefined
};
goog.userAgent.VERSION = goog.userAgent.determineVersion_();
goog.userAgent.compare = function(v1, v2) {
  return goog.string.compareVersions(v1, v2)
};
goog.userAgent.isVersionCache_ = {};
goog.userAgent.isVersion = function(version) {
  return goog.userAgent.isVersionCache_[version] || (goog.userAgent.isVersionCache_[version] = goog.string.compareVersions(goog.userAgent.VERSION, version) >= 0)
};
goog.userAgent.isDocumentModeCache_ = {};
goog.userAgent.isDocumentMode = function(documentMode) {
  return goog.userAgent.isDocumentModeCache_[documentMode] || (goog.userAgent.isDocumentModeCache_[documentMode] = goog.userAgent.IE && document.documentMode && document.documentMode >= documentMode)
};
goog.provide("goog.events.EventType");
goog.require("goog.userAgent");
goog.events.EventType = {CLICK:"click", DBLCLICK:"dblclick", MOUSEDOWN:"mousedown", MOUSEUP:"mouseup", MOUSEOVER:"mouseover", MOUSEOUT:"mouseout", MOUSEMOVE:"mousemove", SELECTSTART:"selectstart", KEYPRESS:"keypress", KEYDOWN:"keydown", KEYUP:"keyup", BLUR:"blur", FOCUS:"focus", DEACTIVATE:"deactivate", FOCUSIN:goog.userAgent.IE ? "focusin" : "DOMFocusIn", FOCUSOUT:goog.userAgent.IE ? "focusout" : "DOMFocusOut", CHANGE:"change", SELECT:"select", SUBMIT:"submit", INPUT:"input", PROPERTYCHANGE:"propertychange", 
DRAGSTART:"dragstart", DRAGENTER:"dragenter", DRAGOVER:"dragover", DRAGLEAVE:"dragleave", DROP:"drop", TOUCHSTART:"touchstart", TOUCHMOVE:"touchmove", TOUCHEND:"touchend", TOUCHCANCEL:"touchcancel", CONTEXTMENU:"contextmenu", ERROR:"error", HELP:"help", LOAD:"load", LOSECAPTURE:"losecapture", READYSTATECHANGE:"readystatechange", RESIZE:"resize", SCROLL:"scroll", UNLOAD:"unload", HASHCHANGE:"hashchange", PAGEHIDE:"pagehide", PAGESHOW:"pageshow", POPSTATE:"popstate", COPY:"copy", PASTE:"paste", CUT:"cut", 
BEFORECOPY:"beforecopy", BEFORECUT:"beforecut", BEFOREPASTE:"beforepaste", MESSAGE:"message", CONNECT:"connect", TRANSITIONEND:goog.userAgent.WEBKIT ? "webkitTransitionEnd" : goog.userAgent.OPERA ? "oTransitionEnd" : "transitionend"};
goog.provide("goog.disposable.IDisposable");
goog.disposable.IDisposable = function() {
};
goog.disposable.IDisposable.prototype.dispose;
goog.disposable.IDisposable.prototype.isDisposed;
goog.provide("goog.Disposable");
goog.provide("goog.dispose");
goog.require("goog.disposable.IDisposable");
goog.Disposable = function() {
  if(goog.Disposable.ENABLE_MONITORING) {
    goog.Disposable.instances_[goog.getUid(this)] = this
  }
};
goog.Disposable.ENABLE_MONITORING = false;
goog.Disposable.instances_ = {};
goog.Disposable.getUndisposedObjects = function() {
  var ret = [];
  for(var id in goog.Disposable.instances_) {
    if(goog.Disposable.instances_.hasOwnProperty(id)) {
      ret.push(goog.Disposable.instances_[Number(id)])
    }
  }
  return ret
};
goog.Disposable.clearUndisposedObjects = function() {
  goog.Disposable.instances_ = {}
};
goog.Disposable.prototype.disposed_ = false;
goog.Disposable.prototype.dependentDisposables_;
goog.Disposable.prototype.isDisposed = function() {
  return this.disposed_
};
goog.Disposable.prototype.getDisposed = goog.Disposable.prototype.isDisposed;
goog.Disposable.prototype.dispose = function() {
  if(!this.disposed_) {
    this.disposed_ = true;
    this.disposeInternal();
    if(goog.Disposable.ENABLE_MONITORING) {
      var uid = goog.getUid(this);
      if(!goog.Disposable.instances_.hasOwnProperty(uid)) {
        throw Error(this + " did not call the goog.Disposable base " + "constructor or was disposed of after a clearUndisposedObjects " + "call");
      }
      delete goog.Disposable.instances_[uid]
    }
  }
};
goog.Disposable.prototype.registerDisposable = function(disposable) {
  if(!this.dependentDisposables_) {
    this.dependentDisposables_ = []
  }
  this.dependentDisposables_.push(disposable)
};
goog.Disposable.prototype.disposeInternal = function() {
  if(this.dependentDisposables_) {
    goog.disposeAll.apply(null, this.dependentDisposables_)
  }
};
goog.dispose = function(obj) {
  if(obj && typeof obj.dispose == "function") {
    obj.dispose()
  }
};
goog.disposeAll = function(var_args) {
  for(var i = 0, len = arguments.length;i < len;++i) {
    var disposable = arguments[i];
    if(goog.isArrayLike(disposable)) {
      goog.disposeAll.apply(null, disposable)
    }else {
      goog.dispose(disposable)
    }
  }
};
goog.provide("goog.debug.EntryPointMonitor");
goog.provide("goog.debug.entryPointRegistry");
goog.require("goog.asserts");
goog.debug.EntryPointMonitor = function() {
};
goog.debug.EntryPointMonitor.prototype.wrap;
goog.debug.EntryPointMonitor.prototype.unwrap;
goog.debug.entryPointRegistry.refList_ = [];
goog.debug.entryPointRegistry.monitors_ = [];
goog.debug.entryPointRegistry.monitorsMayExist_ = false;
goog.debug.entryPointRegistry.register = function(callback) {
  goog.debug.entryPointRegistry.refList_[goog.debug.entryPointRegistry.refList_.length] = callback;
  if(goog.debug.entryPointRegistry.monitorsMayExist_) {
    var monitors = goog.debug.entryPointRegistry.monitors_;
    for(var i = 0;i < monitors.length;i++) {
      callback(goog.bind(monitors[i].wrap, monitors[i]))
    }
  }
};
goog.debug.entryPointRegistry.monitorAll = function(monitor) {
  goog.debug.entryPointRegistry.monitorsMayExist_ = true;
  var transformer = goog.bind(monitor.wrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  goog.debug.entryPointRegistry.monitors_.push(monitor)
};
goog.debug.entryPointRegistry.unmonitorAllIfPossible = function(monitor) {
  var monitors = goog.debug.entryPointRegistry.monitors_;
  goog.asserts.assert(monitor == monitors[monitors.length - 1], "Only the most recent monitor can be unwrapped.");
  var transformer = goog.bind(monitor.unwrap, monitor);
  for(var i = 0;i < goog.debug.entryPointRegistry.refList_.length;i++) {
    goog.debug.entryPointRegistry.refList_[i](transformer)
  }
  monitors.length--
};
goog.provide("goog.debug.errorHandlerWeakDep");
goog.debug.errorHandlerWeakDep = {protectEntryPoint:function(fn, opt_tracers) {
  return fn
}};
goog.provide("goog.events.BrowserFeature");
goog.require("goog.userAgent");
goog.events.BrowserFeature = {HAS_W3C_BUTTON:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), HAS_W3C_EVENT_SUPPORT:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), SET_KEY_CODE_TO_PREVENT_DEFAULT:goog.userAgent.IE && !goog.userAgent.isVersion("8")};
goog.provide("goog.events.Event");
goog.require("goog.Disposable");
goog.events.Event = function(type, opt_target) {
  goog.Disposable.call(this);
  this.type = type;
  this.target = opt_target;
  this.currentTarget = this.target
};
goog.inherits(goog.events.Event, goog.Disposable);
goog.events.Event.prototype.disposeInternal = function() {
  delete this.type;
  delete this.target;
  delete this.currentTarget
};
goog.events.Event.prototype.propagationStopped_ = false;
goog.events.Event.prototype.returnValue_ = true;
goog.events.Event.prototype.stopPropagation = function() {
  this.propagationStopped_ = true
};
goog.events.Event.prototype.preventDefault = function() {
  this.returnValue_ = false
};
goog.events.Event.stopPropagation = function(e) {
  e.stopPropagation()
};
goog.events.Event.preventDefault = function(e) {
  e.preventDefault()
};
goog.provide("goog.reflect");
goog.reflect.object = function(type, object) {
  return object
};
goog.reflect.sinkValue = function(x) {
  goog.reflect.sinkValue[" "](x);
  return x
};
goog.reflect.sinkValue[" "] = goog.nullFunction;
goog.reflect.canAccessProperty = function(obj, prop) {
  try {
    goog.reflect.sinkValue(obj[prop]);
    return true
  }catch(e) {
  }
  return false
};
goog.provide("goog.events.BrowserEvent");
goog.provide("goog.events.BrowserEvent.MouseButton");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventType");
goog.require("goog.reflect");
goog.require("goog.userAgent");
goog.events.BrowserEvent = function(opt_e, opt_currentTarget) {
  if(opt_e) {
    this.init(opt_e, opt_currentTarget)
  }
};
goog.inherits(goog.events.BrowserEvent, goog.events.Event);
goog.events.BrowserEvent.MouseButton = {LEFT:0, MIDDLE:1, RIGHT:2};
goog.events.BrowserEvent.IEButtonMap = [1, 4, 2];
goog.events.BrowserEvent.prototype.target = null;
goog.events.BrowserEvent.prototype.currentTarget;
goog.events.BrowserEvent.prototype.relatedTarget = null;
goog.events.BrowserEvent.prototype.offsetX = 0;
goog.events.BrowserEvent.prototype.offsetY = 0;
goog.events.BrowserEvent.prototype.clientX = 0;
goog.events.BrowserEvent.prototype.clientY = 0;
goog.events.BrowserEvent.prototype.screenX = 0;
goog.events.BrowserEvent.prototype.screenY = 0;
goog.events.BrowserEvent.prototype.button = 0;
goog.events.BrowserEvent.prototype.keyCode = 0;
goog.events.BrowserEvent.prototype.charCode = 0;
goog.events.BrowserEvent.prototype.ctrlKey = false;
goog.events.BrowserEvent.prototype.altKey = false;
goog.events.BrowserEvent.prototype.shiftKey = false;
goog.events.BrowserEvent.prototype.metaKey = false;
goog.events.BrowserEvent.prototype.state;
goog.events.BrowserEvent.prototype.platformModifierKey = false;
goog.events.BrowserEvent.prototype.event_ = null;
goog.events.BrowserEvent.prototype.init = function(e, opt_currentTarget) {
  var type = this.type = e.type;
  goog.events.Event.call(this, type);
  this.target = e.target || e.srcElement;
  this.currentTarget = opt_currentTarget;
  var relatedTarget = e.relatedTarget;
  if(relatedTarget) {
    if(goog.userAgent.GECKO) {
      if(!goog.reflect.canAccessProperty(relatedTarget, "nodeName")) {
        relatedTarget = null
      }
    }
  }else {
    if(type == goog.events.EventType.MOUSEOVER) {
      relatedTarget = e.fromElement
    }else {
      if(type == goog.events.EventType.MOUSEOUT) {
        relatedTarget = e.toElement
      }
    }
  }
  this.relatedTarget = relatedTarget;
  this.offsetX = e.offsetX !== undefined ? e.offsetX : e.layerX;
  this.offsetY = e.offsetY !== undefined ? e.offsetY : e.layerY;
  this.clientX = e.clientX !== undefined ? e.clientX : e.pageX;
  this.clientY = e.clientY !== undefined ? e.clientY : e.pageY;
  this.screenX = e.screenX || 0;
  this.screenY = e.screenY || 0;
  this.button = e.button;
  this.keyCode = e.keyCode || 0;
  this.charCode = e.charCode || (type == "keypress" ? e.keyCode : 0);
  this.ctrlKey = e.ctrlKey;
  this.altKey = e.altKey;
  this.shiftKey = e.shiftKey;
  this.metaKey = e.metaKey;
  this.platformModifierKey = goog.userAgent.MAC ? e.metaKey : e.ctrlKey;
  this.state = e.state;
  this.event_ = e;
  delete this.returnValue_;
  delete this.propagationStopped_
};
goog.events.BrowserEvent.prototype.isButton = function(button) {
  if(!goog.events.BrowserFeature.HAS_W3C_BUTTON) {
    if(this.type == "click") {
      return button == goog.events.BrowserEvent.MouseButton.LEFT
    }else {
      return!!(this.event_.button & goog.events.BrowserEvent.IEButtonMap[button])
    }
  }else {
    return this.event_.button == button
  }
};
goog.events.BrowserEvent.prototype.isMouseActionButton = function() {
  return this.isButton(goog.events.BrowserEvent.MouseButton.LEFT) && !(goog.userAgent.WEBKIT && goog.userAgent.MAC && this.ctrlKey)
};
goog.events.BrowserEvent.prototype.stopPropagation = function() {
  goog.events.BrowserEvent.superClass_.stopPropagation.call(this);
  if(this.event_.stopPropagation) {
    this.event_.stopPropagation()
  }else {
    this.event_.cancelBubble = true
  }
};
goog.events.BrowserEvent.prototype.preventDefault = function() {
  goog.events.BrowserEvent.superClass_.preventDefault.call(this);
  var be = this.event_;
  if(!be.preventDefault) {
    be.returnValue = false;
    if(goog.events.BrowserFeature.SET_KEY_CODE_TO_PREVENT_DEFAULT) {
      try {
        var VK_F1 = 112;
        var VK_F12 = 123;
        if(be.ctrlKey || be.keyCode >= VK_F1 && be.keyCode <= VK_F12) {
          be.keyCode = -1
        }
      }catch(ex) {
      }
    }
  }else {
    be.preventDefault()
  }
};
goog.events.BrowserEvent.prototype.getBrowserEvent = function() {
  return this.event_
};
goog.events.BrowserEvent.prototype.disposeInternal = function() {
  goog.events.BrowserEvent.superClass_.disposeInternal.call(this);
  this.event_ = null;
  this.target = null;
  this.currentTarget = null;
  this.relatedTarget = null
};
goog.provide("goog.events.EventWrapper");
goog.events.EventWrapper = function() {
};
goog.events.EventWrapper.prototype.listen = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.events.EventWrapper.prototype.unlisten = function(src, listener, opt_capt, opt_scope, opt_eventHandler) {
};
goog.provide("goog.events.Listener");
goog.events.Listener = function() {
};
goog.events.Listener.counter_ = 0;
goog.events.Listener.prototype.isFunctionListener_;
goog.events.Listener.prototype.listener;
goog.events.Listener.prototype.proxy;
goog.events.Listener.prototype.src;
goog.events.Listener.prototype.type;
goog.events.Listener.prototype.capture;
goog.events.Listener.prototype.handler;
goog.events.Listener.prototype.key = 0;
goog.events.Listener.prototype.removed = false;
goog.events.Listener.prototype.callOnce = false;
goog.events.Listener.prototype.init = function(listener, proxy, src, type, capture, opt_handler) {
  if(goog.isFunction(listener)) {
    this.isFunctionListener_ = true
  }else {
    if(listener && listener.handleEvent && goog.isFunction(listener.handleEvent)) {
      this.isFunctionListener_ = false
    }else {
      throw Error("Invalid listener argument");
    }
  }
  this.listener = listener;
  this.proxy = proxy;
  this.src = src;
  this.type = type;
  this.capture = !!capture;
  this.handler = opt_handler;
  this.callOnce = false;
  this.key = ++goog.events.Listener.counter_;
  this.removed = false
};
goog.events.Listener.prototype.handleEvent = function(eventObject) {
  if(this.isFunctionListener_) {
    return this.listener.call(this.handler || this.src, eventObject)
  }
  return this.listener.handleEvent.call(this.listener, eventObject)
};
goog.provide("goog.events");
goog.require("goog.array");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.BrowserEvent");
goog.require("goog.events.BrowserFeature");
goog.require("goog.events.Event");
goog.require("goog.events.EventWrapper");
goog.require("goog.events.Listener");
goog.require("goog.object");
goog.require("goog.userAgent");
goog.events.ASSUME_GOOD_GC = false;
goog.events.listeners_ = {};
goog.events.listenerTree_ = {};
goog.events.sources_ = {};
goog.events.onString_ = "on";
goog.events.onStringMap_ = {};
goog.events.keySeparator_ = "_";
goog.events.listen = function(src, type, listener, opt_capt, opt_handler) {
  if(!type) {
    throw Error("Invalid event type");
  }else {
    if(goog.isArray(type)) {
      for(var i = 0;i < type.length;i++) {
        goog.events.listen(src, type[i], listener, opt_capt, opt_handler)
      }
      return null
    }else {
      var capture = !!opt_capt;
      var map = goog.events.listenerTree_;
      if(!(type in map)) {
        map[type] = {count_:0, remaining_:0}
      }
      map = map[type];
      if(!(capture in map)) {
        map[capture] = {count_:0, remaining_:0};
        map.count_++
      }
      map = map[capture];
      var srcUid = goog.getUid(src);
      var listenerArray, listenerObj;
      map.remaining_++;
      if(!map[srcUid]) {
        listenerArray = map[srcUid] = [];
        map.count_++
      }else {
        listenerArray = map[srcUid];
        for(var i = 0;i < listenerArray.length;i++) {
          listenerObj = listenerArray[i];
          if(listenerObj.listener == listener && listenerObj.handler == opt_handler) {
            if(listenerObj.removed) {
              break
            }
            return listenerArray[i].key
          }
        }
      }
      var proxy = goog.events.getProxy();
      proxy.src = src;
      listenerObj = new goog.events.Listener;
      listenerObj.init(listener, proxy, src, type, capture, opt_handler);
      var key = listenerObj.key;
      proxy.key = key;
      listenerArray.push(listenerObj);
      goog.events.listeners_[key] = listenerObj;
      if(!goog.events.sources_[srcUid]) {
        goog.events.sources_[srcUid] = []
      }
      goog.events.sources_[srcUid].push(listenerObj);
      if(src.addEventListener) {
        if(src == goog.global || !src.customEvent_) {
          src.addEventListener(type, proxy, capture)
        }
      }else {
        src.attachEvent(goog.events.getOnString_(type), proxy)
      }
      return key
    }
  }
};
goog.events.getProxy = function() {
  var proxyCallbackFunction = goog.events.handleBrowserEvent_;
  var f = goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT ? function(eventObject) {
    return proxyCallbackFunction.call(f.src, f.key, eventObject)
  } : function(eventObject) {
    var v = proxyCallbackFunction.call(f.src, f.key, eventObject);
    if(!v) {
      return v
    }
  };
  return f
};
goog.events.listenOnce = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.listenOnce(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var key = goog.events.listen(src, type, listener, opt_capt, opt_handler);
  var listenerObj = goog.events.listeners_[key];
  listenerObj.callOnce = true;
  return key
};
goog.events.listenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.listen(src, listener, opt_capt, opt_handler)
};
goog.events.unlisten = function(src, type, listener, opt_capt, opt_handler) {
  if(goog.isArray(type)) {
    for(var i = 0;i < type.length;i++) {
      goog.events.unlisten(src, type[i], listener, opt_capt, opt_handler)
    }
    return null
  }
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(!listenerArray) {
    return false
  }
  for(var i = 0;i < listenerArray.length;i++) {
    if(listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
      return goog.events.unlistenByKey(listenerArray[i].key)
    }
  }
  return false
};
goog.events.unlistenByKey = function(key) {
  if(!goog.events.listeners_[key]) {
    return false
  }
  var listener = goog.events.listeners_[key];
  if(listener.removed) {
    return false
  }
  var src = listener.src;
  var type = listener.type;
  var proxy = listener.proxy;
  var capture = listener.capture;
  if(src.removeEventListener) {
    if(src == goog.global || !src.customEvent_) {
      src.removeEventListener(type, proxy, capture)
    }
  }else {
    if(src.detachEvent) {
      src.detachEvent(goog.events.getOnString_(type), proxy)
    }
  }
  var srcUid = goog.getUid(src);
  var listenerArray = goog.events.listenerTree_[type][capture][srcUid];
  if(goog.events.sources_[srcUid]) {
    var sourcesArray = goog.events.sources_[srcUid];
    goog.array.remove(sourcesArray, listener);
    if(sourcesArray.length == 0) {
      delete goog.events.sources_[srcUid]
    }
  }
  listener.removed = true;
  listenerArray.needsCleanup_ = true;
  goog.events.cleanUp_(type, capture, srcUid, listenerArray);
  delete goog.events.listeners_[key];
  return true
};
goog.events.unlistenWithWrapper = function(src, wrapper, listener, opt_capt, opt_handler) {
  wrapper.unlisten(src, listener, opt_capt, opt_handler)
};
goog.events.cleanUp_ = function(type, capture, srcUid, listenerArray) {
  if(!listenerArray.locked_) {
    if(listenerArray.needsCleanup_) {
      for(var oldIndex = 0, newIndex = 0;oldIndex < listenerArray.length;oldIndex++) {
        if(listenerArray[oldIndex].removed) {
          var proxy = listenerArray[oldIndex].proxy;
          proxy.src = null;
          continue
        }
        if(oldIndex != newIndex) {
          listenerArray[newIndex] = listenerArray[oldIndex]
        }
        newIndex++
      }
      listenerArray.length = newIndex;
      listenerArray.needsCleanup_ = false;
      if(newIndex == 0) {
        delete goog.events.listenerTree_[type][capture][srcUid];
        goog.events.listenerTree_[type][capture].count_--;
        if(goog.events.listenerTree_[type][capture].count_ == 0) {
          delete goog.events.listenerTree_[type][capture];
          goog.events.listenerTree_[type].count_--
        }
        if(goog.events.listenerTree_[type].count_ == 0) {
          delete goog.events.listenerTree_[type]
        }
      }
    }
  }
};
goog.events.removeAll = function(opt_obj, opt_type, opt_capt) {
  var count = 0;
  var noObj = opt_obj == null;
  var noType = opt_type == null;
  var noCapt = opt_capt == null;
  opt_capt = !!opt_capt;
  if(!noObj) {
    var srcUid = goog.getUid(opt_obj);
    if(goog.events.sources_[srcUid]) {
      var sourcesArray = goog.events.sources_[srcUid];
      for(var i = sourcesArray.length - 1;i >= 0;i--) {
        var listener = sourcesArray[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    }
  }else {
    goog.object.forEach(goog.events.sources_, function(listeners) {
      for(var i = listeners.length - 1;i >= 0;i--) {
        var listener = listeners[i];
        if((noType || opt_type == listener.type) && (noCapt || opt_capt == listener.capture)) {
          goog.events.unlistenByKey(listener.key);
          count++
        }
      }
    })
  }
  return count
};
goog.events.getListeners = function(obj, type, capture) {
  return goog.events.getListeners_(obj, type, capture) || []
};
goog.events.getListeners_ = function(obj, type, capture) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      map = map[capture];
      var objUid = goog.getUid(obj);
      if(map[objUid]) {
        return map[objUid]
      }
    }
  }
  return null
};
goog.events.getListener = function(src, type, listener, opt_capt, opt_handler) {
  var capture = !!opt_capt;
  var listenerArray = goog.events.getListeners_(src, type, capture);
  if(listenerArray) {
    for(var i = 0;i < listenerArray.length;i++) {
      if(!listenerArray[i].removed && listenerArray[i].listener == listener && listenerArray[i].capture == capture && listenerArray[i].handler == opt_handler) {
        return listenerArray[i]
      }
    }
  }
  return null
};
goog.events.hasListener = function(obj, opt_type, opt_capture) {
  var objUid = goog.getUid(obj);
  var listeners = goog.events.sources_[objUid];
  if(listeners) {
    var hasType = goog.isDef(opt_type);
    var hasCapture = goog.isDef(opt_capture);
    if(hasType && hasCapture) {
      var map = goog.events.listenerTree_[opt_type];
      return!!map && !!map[opt_capture] && objUid in map[opt_capture]
    }else {
      if(!(hasType || hasCapture)) {
        return true
      }else {
        return goog.array.some(listeners, function(listener) {
          return hasType && listener.type == opt_type || hasCapture && listener.capture == opt_capture
        })
      }
    }
  }
  return false
};
goog.events.expose = function(e) {
  var str = [];
  for(var key in e) {
    if(e[key] && e[key].id) {
      str.push(key + " = " + e[key] + " (" + e[key].id + ")")
    }else {
      str.push(key + " = " + e[key])
    }
  }
  return str.join("\n")
};
goog.events.getOnString_ = function(type) {
  if(type in goog.events.onStringMap_) {
    return goog.events.onStringMap_[type]
  }
  return goog.events.onStringMap_[type] = goog.events.onString_ + type
};
goog.events.fireListeners = function(obj, type, capture, eventObject) {
  var map = goog.events.listenerTree_;
  if(type in map) {
    map = map[type];
    if(capture in map) {
      return goog.events.fireListeners_(map[capture], obj, type, capture, eventObject)
    }
  }
  return true
};
goog.events.fireListeners_ = function(map, obj, type, capture, eventObject) {
  var retval = 1;
  var objUid = goog.getUid(obj);
  if(map[objUid]) {
    map.remaining_--;
    var listenerArray = map[objUid];
    if(!listenerArray.locked_) {
      listenerArray.locked_ = 1
    }else {
      listenerArray.locked_++
    }
    try {
      var length = listenerArray.length;
      for(var i = 0;i < length;i++) {
        var listener = listenerArray[i];
        if(listener && !listener.removed) {
          retval &= goog.events.fireListener(listener, eventObject) !== false
        }
      }
    }finally {
      listenerArray.locked_--;
      goog.events.cleanUp_(type, capture, objUid, listenerArray)
    }
  }
  return Boolean(retval)
};
goog.events.fireListener = function(listener, eventObject) {
  var rv = listener.handleEvent(eventObject);
  if(listener.callOnce) {
    goog.events.unlistenByKey(listener.key)
  }
  return rv
};
goog.events.getTotalListenerCount = function() {
  return goog.object.getCount(goog.events.listeners_)
};
goog.events.dispatchEvent = function(src, e) {
  var type = e.type || e;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  if(goog.isString(e)) {
    e = new goog.events.Event(e, src)
  }else {
    if(!(e instanceof goog.events.Event)) {
      var oldEvent = e;
      e = new goog.events.Event(type, src);
      goog.object.extend(e, oldEvent)
    }else {
      e.target = e.target || src
    }
  }
  var rv = 1, ancestors;
  map = map[type];
  var hasCapture = true in map;
  var targetsMap;
  if(hasCapture) {
    ancestors = [];
    for(var parent = src;parent;parent = parent.getParentEventTarget()) {
      ancestors.push(parent)
    }
    targetsMap = map[true];
    targetsMap.remaining_ = targetsMap.count_;
    for(var i = ancestors.length - 1;!e.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
      e.currentTarget = ancestors[i];
      rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, true, e) && e.returnValue_ != false
    }
  }
  var hasBubble = false in map;
  if(hasBubble) {
    targetsMap = map[false];
    targetsMap.remaining_ = targetsMap.count_;
    if(hasCapture) {
      for(var i = 0;!e.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
        e.currentTarget = ancestors[i];
        rv &= goog.events.fireListeners_(targetsMap, ancestors[i], e.type, false, e) && e.returnValue_ != false
      }
    }else {
      for(var current = src;!e.propagationStopped_ && current && targetsMap.remaining_;current = current.getParentEventTarget()) {
        e.currentTarget = current;
        rv &= goog.events.fireListeners_(targetsMap, current, e.type, false, e) && e.returnValue_ != false
      }
    }
  }
  return Boolean(rv)
};
goog.events.protectBrowserEventEntryPoint = function(errorHandler) {
  goog.events.handleBrowserEvent_ = errorHandler.protectEntryPoint(goog.events.handleBrowserEvent_)
};
goog.events.handleBrowserEvent_ = function(key, opt_evt) {
  if(!goog.events.listeners_[key]) {
    return true
  }
  var listener = goog.events.listeners_[key];
  var type = listener.type;
  var map = goog.events.listenerTree_;
  if(!(type in map)) {
    return true
  }
  map = map[type];
  var retval, targetsMap;
  if(!goog.events.BrowserFeature.HAS_W3C_EVENT_SUPPORT) {
    var ieEvent = opt_evt || goog.getObjectByName("window.event");
    var hasCapture = true in map;
    var hasBubble = false in map;
    if(hasCapture) {
      if(goog.events.isMarkedIeEvent_(ieEvent)) {
        return true
      }
      goog.events.markIeEvent_(ieEvent)
    }
    var evt = new goog.events.BrowserEvent;
    evt.init(ieEvent, this);
    retval = true;
    try {
      if(hasCapture) {
        var ancestors = [];
        for(var parent = evt.currentTarget;parent;parent = parent.parentNode) {
          ancestors.push(parent)
        }
        targetsMap = map[true];
        targetsMap.remaining_ = targetsMap.count_;
        for(var i = ancestors.length - 1;!evt.propagationStopped_ && i >= 0 && targetsMap.remaining_;i--) {
          evt.currentTarget = ancestors[i];
          retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, true, evt)
        }
        if(hasBubble) {
          targetsMap = map[false];
          targetsMap.remaining_ = targetsMap.count_;
          for(var i = 0;!evt.propagationStopped_ && i < ancestors.length && targetsMap.remaining_;i++) {
            evt.currentTarget = ancestors[i];
            retval &= goog.events.fireListeners_(targetsMap, ancestors[i], type, false, evt)
          }
        }
      }else {
        retval = goog.events.fireListener(listener, evt)
      }
    }finally {
      if(ancestors) {
        ancestors.length = 0
      }
      evt.dispose()
    }
    return retval
  }
  var be = new goog.events.BrowserEvent(opt_evt, this);
  try {
    retval = goog.events.fireListener(listener, be)
  }finally {
    be.dispose()
  }
  return retval
};
goog.events.markIeEvent_ = function(e) {
  var useReturnValue = false;
  if(e.keyCode == 0) {
    try {
      e.keyCode = -1;
      return
    }catch(ex) {
      useReturnValue = true
    }
  }
  if(useReturnValue || e.returnValue == undefined) {
    e.returnValue = true
  }
};
goog.events.isMarkedIeEvent_ = function(e) {
  return e.keyCode < 0 || e.returnValue != undefined
};
goog.events.uniqueIdCounter_ = 0;
goog.events.getUniqueId = function(identifier) {
  return identifier + "_" + goog.events.uniqueIdCounter_++
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.events.handleBrowserEvent_ = transformer(goog.events.handleBrowserEvent_)
});
goog.provide("goog.events.EventTarget");
goog.require("goog.Disposable");
goog.require("goog.events");
goog.events.EventTarget = function() {
  goog.Disposable.call(this)
};
goog.inherits(goog.events.EventTarget, goog.Disposable);
goog.events.EventTarget.prototype.customEvent_ = true;
goog.events.EventTarget.prototype.parentEventTarget_ = null;
goog.events.EventTarget.prototype.getParentEventTarget = function() {
  return this.parentEventTarget_
};
goog.events.EventTarget.prototype.setParentEventTarget = function(parent) {
  this.parentEventTarget_ = parent
};
goog.events.EventTarget.prototype.addEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.listen(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.removeEventListener = function(type, handler, opt_capture, opt_handlerScope) {
  goog.events.unlisten(this, type, handler, opt_capture, opt_handlerScope)
};
goog.events.EventTarget.prototype.dispatchEvent = function(e) {
  return goog.events.dispatchEvent(this, e)
};
goog.events.EventTarget.prototype.disposeInternal = function() {
  goog.events.EventTarget.superClass_.disposeInternal.call(this);
  goog.events.removeAll(this);
  this.parentEventTarget_ = null
};
goog.provide("clojure.browser.event");
goog.require("cljs.core");
goog.require("goog.events");
goog.require("goog.events.EventTarget");
goog.require("goog.events.EventType");
void 0;
clojure.browser.event.EventType = {};
clojure.browser.event.event_types = function event_types(this$) {
  if(function() {
    var and__3822__auto____6965 = this$;
    if(and__3822__auto____6965) {
      return this$.clojure$browser$event$EventType$event_types$arity$1
    }else {
      return and__3822__auto____6965
    }
  }()) {
    return this$.clojure$browser$event$EventType$event_types$arity$1(this$)
  }else {
    return function() {
      var or__3824__auto____6966 = clojure.browser.event.event_types[goog.typeOf.call(null, this$)];
      if(or__3824__auto____6966) {
        return or__3824__auto____6966
      }else {
        var or__3824__auto____6967 = clojure.browser.event.event_types["_"];
        if(or__3824__auto____6967) {
          return or__3824__auto____6967
        }else {
          throw cljs.core.missing_protocol.call(null, "EventType.event-types", this$);
        }
      }
    }().call(null, this$)
  }
};
void 0;
Element.prototype.clojure$browser$event$EventType$ = true;
Element.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__6968) {
    var vec__6969__6970 = p__6968;
    var k__6971 = cljs.core.nth.call(null, vec__6969__6970, 0, null);
    var v__6972 = cljs.core.nth.call(null, vec__6969__6970, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6971.toLowerCase()), v__6972])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
goog.events.EventTarget.prototype.clojure$browser$event$EventType$ = true;
goog.events.EventTarget.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__6973) {
    var vec__6974__6975 = p__6973;
    var k__6976 = cljs.core.nth.call(null, vec__6974__6975, 0, null);
    var v__6977 = cljs.core.nth.call(null, vec__6974__6975, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6976.toLowerCase()), v__6977])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.events.EventType))))
};
clojure.browser.event.listen = function() {
  var listen = null;
  var listen__3 = function(src, type, fn) {
    return listen.call(null, src, type, fn, false)
  };
  var listen__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listen.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen__3.call(this, src, type, fn);
      case 4:
        return listen__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen.cljs$lang$arity$3 = listen__3;
  listen.cljs$lang$arity$4 = listen__4;
  return listen
}();
clojure.browser.event.listen_once = function() {
  var listen_once = null;
  var listen_once__3 = function(src, type, fn) {
    return listen_once.call(null, src, type, fn, false)
  };
  var listen_once__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.listenOnce.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  listen_once = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return listen_once__3.call(this, src, type, fn);
      case 4:
        return listen_once__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  listen_once.cljs$lang$arity$3 = listen_once__3;
  listen_once.cljs$lang$arity$4 = listen_once__4;
  return listen_once
}();
clojure.browser.event.unlisten = function() {
  var unlisten = null;
  var unlisten__3 = function(src, type, fn) {
    return unlisten.call(null, src, type, fn, false)
  };
  var unlisten__4 = function(src, type, fn, capture_QMARK_) {
    return goog.events.unlisten.call(null, src, cljs.core.get.call(null, clojure.browser.event.event_types.call(null, src), type, type), fn, capture_QMARK_)
  };
  unlisten = function(src, type, fn, capture_QMARK_) {
    switch(arguments.length) {
      case 3:
        return unlisten__3.call(this, src, type, fn);
      case 4:
        return unlisten__4.call(this, src, type, fn, capture_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  unlisten.cljs$lang$arity$3 = unlisten__3;
  unlisten.cljs$lang$arity$4 = unlisten__4;
  return unlisten
}();
clojure.browser.event.unlisten_by_key = function unlisten_by_key(key) {
  return goog.events.unlistenByKey.call(null, key)
};
clojure.browser.event.dispatch_event = function dispatch_event(src, event) {
  return goog.events.dispatchEvent.call(null, src, event)
};
clojure.browser.event.expose = function expose(e) {
  return goog.events.expose.call(null, e)
};
clojure.browser.event.fire_listeners = function fire_listeners(obj, type, capture, event) {
  return null
};
clojure.browser.event.total_listener_count = function total_listener_count() {
  return goog.events.getTotalListenerCount.call(null)
};
clojure.browser.event.get_listener = function get_listener(src, type, listener, opt_capt, opt_handler) {
  return null
};
clojure.browser.event.all_listeners = function all_listeners(obj, type, capture) {
  return null
};
clojure.browser.event.unique_event_id = function unique_event_id(event_type) {
  return null
};
clojure.browser.event.has_listener = function has_listener(obj, opt_type, opt_capture) {
  return null
};
clojure.browser.event.remove_all = function remove_all(opt_obj, opt_type, opt_capt) {
  return null
};
goog.provide("goog.structs");
goog.require("goog.array");
goog.require("goog.object");
goog.structs.getCount = function(col) {
  if(typeof col.getCount == "function") {
    return col.getCount()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return col.length
  }
  return goog.object.getCount(col)
};
goog.structs.getValues = function(col) {
  if(typeof col.getValues == "function") {
    return col.getValues()
  }
  if(goog.isString(col)) {
    return col.split("")
  }
  if(goog.isArrayLike(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(col[i])
    }
    return rv
  }
  return goog.object.getValues(col)
};
goog.structs.getKeys = function(col) {
  if(typeof col.getKeys == "function") {
    return col.getKeys()
  }
  if(typeof col.getValues == "function") {
    return undefined
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    var rv = [];
    var l = col.length;
    for(var i = 0;i < l;i++) {
      rv.push(i)
    }
    return rv
  }
  return goog.object.getKeys(col)
};
goog.structs.contains = function(col, val) {
  if(typeof col.contains == "function") {
    return col.contains(val)
  }
  if(typeof col.containsValue == "function") {
    return col.containsValue(val)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.contains(col, val)
  }
  return goog.object.containsValue(col, val)
};
goog.structs.isEmpty = function(col) {
  if(typeof col.isEmpty == "function") {
    return col.isEmpty()
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.isEmpty(col)
  }
  return goog.object.isEmpty(col)
};
goog.structs.clear = function(col) {
  if(typeof col.clear == "function") {
    col.clear()
  }else {
    if(goog.isArrayLike(col)) {
      goog.array.clear(col)
    }else {
      goog.object.clear(col)
    }
  }
};
goog.structs.forEach = function(col, f, opt_obj) {
  if(typeof col.forEach == "function") {
    col.forEach(f, opt_obj)
  }else {
    if(goog.isArrayLike(col) || goog.isString(col)) {
      goog.array.forEach(col, f, opt_obj)
    }else {
      var keys = goog.structs.getKeys(col);
      var values = goog.structs.getValues(col);
      var l = values.length;
      for(var i = 0;i < l;i++) {
        f.call(opt_obj, values[i], keys && keys[i], col)
      }
    }
  }
};
goog.structs.filter = function(col, f, opt_obj) {
  if(typeof col.filter == "function") {
    return col.filter(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.filter(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], keys[i], col)) {
        rv[keys[i]] = values[i]
      }
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      if(f.call(opt_obj, values[i], undefined, col)) {
        rv.push(values[i])
      }
    }
  }
  return rv
};
goog.structs.map = function(col, f, opt_obj) {
  if(typeof col.map == "function") {
    return col.map(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.map(col, f, opt_obj)
  }
  var rv;
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  if(keys) {
    rv = {};
    for(var i = 0;i < l;i++) {
      rv[keys[i]] = f.call(opt_obj, values[i], keys[i], col)
    }
  }else {
    rv = [];
    for(var i = 0;i < l;i++) {
      rv[i] = f.call(opt_obj, values[i], undefined, col)
    }
  }
  return rv
};
goog.structs.some = function(col, f, opt_obj) {
  if(typeof col.some == "function") {
    return col.some(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.some(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(f.call(opt_obj, values[i], keys && keys[i], col)) {
      return true
    }
  }
  return false
};
goog.structs.every = function(col, f, opt_obj) {
  if(typeof col.every == "function") {
    return col.every(f, opt_obj)
  }
  if(goog.isArrayLike(col) || goog.isString(col)) {
    return goog.array.every(col, f, opt_obj)
  }
  var keys = goog.structs.getKeys(col);
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    if(!f.call(opt_obj, values[i], keys && keys[i], col)) {
      return false
    }
  }
  return true
};
goog.provide("goog.iter");
goog.provide("goog.iter.Iterator");
goog.provide("goog.iter.StopIteration");
goog.require("goog.array");
goog.require("goog.asserts");
goog.iter.Iterable;
if("StopIteration" in goog.global) {
  goog.iter.StopIteration = goog.global["StopIteration"]
}else {
  goog.iter.StopIteration = Error("StopIteration")
}
goog.iter.Iterator = function() {
};
goog.iter.Iterator.prototype.next = function() {
  throw goog.iter.StopIteration;
};
goog.iter.Iterator.prototype.__iterator__ = function(opt_keys) {
  return this
};
goog.iter.toIterator = function(iterable) {
  if(iterable instanceof goog.iter.Iterator) {
    return iterable
  }
  if(typeof iterable.__iterator__ == "function") {
    return iterable.__iterator__(false)
  }
  if(goog.isArrayLike(iterable)) {
    var i = 0;
    var newIter = new goog.iter.Iterator;
    newIter.next = function() {
      while(true) {
        if(i >= iterable.length) {
          throw goog.iter.StopIteration;
        }
        if(!(i in iterable)) {
          i++;
          continue
        }
        return iterable[i++]
      }
    };
    return newIter
  }
  throw Error("Not implemented");
};
goog.iter.forEach = function(iterable, f, opt_obj) {
  if(goog.isArrayLike(iterable)) {
    try {
      goog.array.forEach(iterable, f, opt_obj)
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }else {
    iterable = goog.iter.toIterator(iterable);
    try {
      while(true) {
        f.call(opt_obj, iterable.next(), undefined, iterable)
      }
    }catch(ex) {
      if(ex !== goog.iter.StopIteration) {
        throw ex;
      }
    }
  }
};
goog.iter.filter = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(f.call(opt_obj, val, undefined, iterable)) {
        return val
      }
    }
  };
  return newIter
};
goog.iter.range = function(startOrStop, opt_stop, opt_step) {
  var start = 0;
  var stop = startOrStop;
  var step = opt_step || 1;
  if(arguments.length > 1) {
    start = startOrStop;
    stop = opt_stop
  }
  if(step == 0) {
    throw Error("Range step argument must not be zero");
  }
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    if(step > 0 && start >= stop || step < 0 && start <= stop) {
      throw goog.iter.StopIteration;
    }
    var rv = start;
    start += step;
    return rv
  };
  return newIter
};
goog.iter.join = function(iterable, deliminator) {
  return goog.iter.toArray(iterable).join(deliminator)
};
goog.iter.map = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      return f.call(opt_obj, val, undefined, iterable)
    }
  };
  return newIter
};
goog.iter.reduce = function(iterable, f, val, opt_obj) {
  var rval = val;
  goog.iter.forEach(iterable, function(val) {
    rval = f.call(opt_obj, rval, val)
  });
  return rval
};
goog.iter.some = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return true
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return false
};
goog.iter.every = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  try {
    while(true) {
      if(!f.call(opt_obj, iterable.next(), undefined, iterable)) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }
  }
  return true
};
goog.iter.chain = function(var_args) {
  var args = arguments;
  var length = args.length;
  var i = 0;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    try {
      if(i >= length) {
        throw goog.iter.StopIteration;
      }
      var current = goog.iter.toIterator(args[i]);
      return current.next()
    }catch(ex) {
      if(ex !== goog.iter.StopIteration || i >= length) {
        throw ex;
      }else {
        i++;
        return this.next()
      }
    }
  };
  return newIter
};
goog.iter.dropWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var dropping = true;
  newIter.next = function() {
    while(true) {
      var val = iterable.next();
      if(dropping && f.call(opt_obj, val, undefined, iterable)) {
        continue
      }else {
        dropping = false
      }
      return val
    }
  };
  return newIter
};
goog.iter.takeWhile = function(iterable, f, opt_obj) {
  iterable = goog.iter.toIterator(iterable);
  var newIter = new goog.iter.Iterator;
  var taking = true;
  newIter.next = function() {
    while(true) {
      if(taking) {
        var val = iterable.next();
        if(f.call(opt_obj, val, undefined, iterable)) {
          return val
        }else {
          taking = false
        }
      }else {
        throw goog.iter.StopIteration;
      }
    }
  };
  return newIter
};
goog.iter.toArray = function(iterable) {
  if(goog.isArrayLike(iterable)) {
    return goog.array.toArray(iterable)
  }
  iterable = goog.iter.toIterator(iterable);
  var array = [];
  goog.iter.forEach(iterable, function(val) {
    array.push(val)
  });
  return array
};
goog.iter.equals = function(iterable1, iterable2) {
  iterable1 = goog.iter.toIterator(iterable1);
  iterable2 = goog.iter.toIterator(iterable2);
  var b1, b2;
  try {
    while(true) {
      b1 = b2 = false;
      var val1 = iterable1.next();
      b1 = true;
      var val2 = iterable2.next();
      b2 = true;
      if(val1 != val2) {
        return false
      }
    }
  }catch(ex) {
    if(ex !== goog.iter.StopIteration) {
      throw ex;
    }else {
      if(b1 && !b2) {
        return false
      }
      if(!b2) {
        try {
          val2 = iterable2.next();
          return false
        }catch(ex1) {
          if(ex1 !== goog.iter.StopIteration) {
            throw ex1;
          }
          return true
        }
      }
    }
  }
  return false
};
goog.iter.nextOrValue = function(iterable, defaultValue) {
  try {
    return goog.iter.toIterator(iterable).next()
  }catch(e) {
    if(e != goog.iter.StopIteration) {
      throw e;
    }
    return defaultValue
  }
};
goog.iter.product = function(var_args) {
  var someArrayEmpty = goog.array.some(arguments, function(arr) {
    return!arr.length
  });
  if(someArrayEmpty || !arguments.length) {
    return new goog.iter.Iterator
  }
  var iter = new goog.iter.Iterator;
  var arrays = arguments;
  var indicies = goog.array.repeat(0, arrays.length);
  iter.next = function() {
    if(indicies) {
      var retVal = goog.array.map(indicies, function(valueIndex, arrayIndex) {
        return arrays[arrayIndex][valueIndex]
      });
      for(var i = indicies.length - 1;i >= 0;i--) {
        goog.asserts.assert(indicies);
        if(indicies[i] < arrays[i].length - 1) {
          indicies[i]++;
          break
        }
        if(i == 0) {
          indicies = null;
          break
        }
        indicies[i] = 0
      }
      return retVal
    }
    throw goog.iter.StopIteration;
  };
  return iter
};
goog.iter.cycle = function(iterable) {
  var baseIterator = goog.iter.toIterator(iterable);
  var cache = [];
  var cacheIndex = 0;
  var iter = new goog.iter.Iterator;
  var useCache = false;
  iter.next = function() {
    var returnElement = null;
    if(!useCache) {
      try {
        returnElement = baseIterator.next();
        cache.push(returnElement);
        return returnElement
      }catch(e) {
        if(e != goog.iter.StopIteration || goog.array.isEmpty(cache)) {
          throw e;
        }
        useCache = true
      }
    }
    returnElement = cache[cacheIndex];
    cacheIndex = (cacheIndex + 1) % cache.length;
    return returnElement
  };
  return iter
};
goog.provide("goog.structs.Map");
goog.require("goog.iter.Iterator");
goog.require("goog.iter.StopIteration");
goog.require("goog.object");
goog.require("goog.structs");
goog.structs.Map = function(opt_map, var_args) {
  this.map_ = {};
  this.keys_ = [];
  var argLength = arguments.length;
  if(argLength > 1) {
    if(argLength % 2) {
      throw Error("Uneven number of arguments");
    }
    for(var i = 0;i < argLength;i += 2) {
      this.set(arguments[i], arguments[i + 1])
    }
  }else {
    if(opt_map) {
      this.addAll(opt_map)
    }
  }
};
goog.structs.Map.prototype.count_ = 0;
goog.structs.Map.prototype.version_ = 0;
goog.structs.Map.prototype.getCount = function() {
  return this.count_
};
goog.structs.Map.prototype.getValues = function() {
  this.cleanupKeysArray_();
  var rv = [];
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    rv.push(this.map_[key])
  }
  return rv
};
goog.structs.Map.prototype.getKeys = function() {
  this.cleanupKeysArray_();
  return this.keys_.concat()
};
goog.structs.Map.prototype.containsKey = function(key) {
  return goog.structs.Map.hasKey_(this.map_, key)
};
goog.structs.Map.prototype.containsValue = function(val) {
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    if(goog.structs.Map.hasKey_(this.map_, key) && this.map_[key] == val) {
      return true
    }
  }
  return false
};
goog.structs.Map.prototype.equals = function(otherMap, opt_equalityFn) {
  if(this === otherMap) {
    return true
  }
  if(this.count_ != otherMap.getCount()) {
    return false
  }
  var equalityFn = opt_equalityFn || goog.structs.Map.defaultEquals;
  this.cleanupKeysArray_();
  for(var key, i = 0;key = this.keys_[i];i++) {
    if(!equalityFn(this.get(key), otherMap.get(key))) {
      return false
    }
  }
  return true
};
goog.structs.Map.defaultEquals = function(a, b) {
  return a === b
};
goog.structs.Map.prototype.isEmpty = function() {
  return this.count_ == 0
};
goog.structs.Map.prototype.clear = function() {
  this.map_ = {};
  this.keys_.length = 0;
  this.count_ = 0;
  this.version_ = 0
};
goog.structs.Map.prototype.remove = function(key) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    delete this.map_[key];
    this.count_--;
    this.version_++;
    if(this.keys_.length > 2 * this.count_) {
      this.cleanupKeysArray_()
    }
    return true
  }
  return false
};
goog.structs.Map.prototype.cleanupKeysArray_ = function() {
  if(this.count_ != this.keys_.length) {
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(goog.structs.Map.hasKey_(this.map_, key)) {
        this.keys_[destIndex++] = key
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
  if(this.count_ != this.keys_.length) {
    var seen = {};
    var srcIndex = 0;
    var destIndex = 0;
    while(srcIndex < this.keys_.length) {
      var key = this.keys_[srcIndex];
      if(!goog.structs.Map.hasKey_(seen, key)) {
        this.keys_[destIndex++] = key;
        seen[key] = 1
      }
      srcIndex++
    }
    this.keys_.length = destIndex
  }
};
goog.structs.Map.prototype.get = function(key, opt_val) {
  if(goog.structs.Map.hasKey_(this.map_, key)) {
    return this.map_[key]
  }
  return opt_val
};
goog.structs.Map.prototype.set = function(key, value) {
  if(!goog.structs.Map.hasKey_(this.map_, key)) {
    this.count_++;
    this.keys_.push(key);
    this.version_++
  }
  this.map_[key] = value
};
goog.structs.Map.prototype.addAll = function(map) {
  var keys, values;
  if(map instanceof goog.structs.Map) {
    keys = map.getKeys();
    values = map.getValues()
  }else {
    keys = goog.object.getKeys(map);
    values = goog.object.getValues(map)
  }
  for(var i = 0;i < keys.length;i++) {
    this.set(keys[i], values[i])
  }
};
goog.structs.Map.prototype.clone = function() {
  return new goog.structs.Map(this)
};
goog.structs.Map.prototype.transpose = function() {
  var transposed = new goog.structs.Map;
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    var value = this.map_[key];
    transposed.set(value, key)
  }
  return transposed
};
goog.structs.Map.prototype.toObject = function() {
  this.cleanupKeysArray_();
  var obj = {};
  for(var i = 0;i < this.keys_.length;i++) {
    var key = this.keys_[i];
    obj[key] = this.map_[key]
  }
  return obj
};
goog.structs.Map.prototype.getKeyIterator = function() {
  return this.__iterator__(true)
};
goog.structs.Map.prototype.getValueIterator = function() {
  return this.__iterator__(false)
};
goog.structs.Map.prototype.__iterator__ = function(opt_keys) {
  this.cleanupKeysArray_();
  var i = 0;
  var keys = this.keys_;
  var map = this.map_;
  var version = this.version_;
  var selfObj = this;
  var newIter = new goog.iter.Iterator;
  newIter.next = function() {
    while(true) {
      if(version != selfObj.version_) {
        throw Error("The map has changed since the iterator was created");
      }
      if(i >= keys.length) {
        throw goog.iter.StopIteration;
      }
      var key = keys[i++];
      return opt_keys ? key : map[key]
    }
  };
  return newIter
};
goog.structs.Map.hasKey_ = function(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key)
};
goog.provide("goog.uri.utils");
goog.provide("goog.uri.utils.ComponentIndex");
goog.provide("goog.uri.utils.QueryArray");
goog.provide("goog.uri.utils.QueryValue");
goog.provide("goog.uri.utils.StandardQueryParam");
goog.require("goog.asserts");
goog.require("goog.string");
goog.uri.utils.CharCode_ = {AMPERSAND:38, EQUAL:61, HASH:35, QUESTION:63};
goog.uri.utils.buildFromEncodedParts = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_queryData, opt_fragment) {
  var out = [];
  if(opt_scheme) {
    out.push(opt_scheme, ":")
  }
  if(opt_domain) {
    out.push("//");
    if(opt_userInfo) {
      out.push(opt_userInfo, "@")
    }
    out.push(opt_domain);
    if(opt_port) {
      out.push(":", opt_port)
    }
  }
  if(opt_path) {
    out.push(opt_path)
  }
  if(opt_queryData) {
    out.push("?", opt_queryData)
  }
  if(opt_fragment) {
    out.push("#", opt_fragment)
  }
  return out.join("")
};
goog.uri.utils.splitRe_ = new RegExp("^" + "(?:" + "([^:/?#.]+)" + ":)?" + "(?://" + "(?:([^/?#]*)@)?" + "([\\w\\d\\-\\u0100-\\uffff.%]*)" + "(?::([0-9]+))?" + ")?" + "([^?#]+)?" + "(?:\\?([^#]*))?" + "(?:#(.*))?" + "$");
goog.uri.utils.ComponentIndex = {SCHEME:1, USER_INFO:2, DOMAIN:3, PORT:4, PATH:5, QUERY_DATA:6, FRAGMENT:7};
goog.uri.utils.split = function(uri) {
  return uri.match(goog.uri.utils.splitRe_)
};
goog.uri.utils.decodeIfPossible_ = function(uri) {
  return uri && decodeURIComponent(uri)
};
goog.uri.utils.getComponentByIndex_ = function(componentIndex, uri) {
  return goog.uri.utils.split(uri)[componentIndex] || null
};
goog.uri.utils.getScheme = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.SCHEME, uri)
};
goog.uri.utils.getUserInfoEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.USER_INFO, uri)
};
goog.uri.utils.getUserInfo = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getUserInfoEncoded(uri))
};
goog.uri.utils.getDomainEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.DOMAIN, uri)
};
goog.uri.utils.getDomain = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getDomainEncoded(uri))
};
goog.uri.utils.getPort = function(uri) {
  return Number(goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PORT, uri)) || null
};
goog.uri.utils.getPathEncoded = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.PATH, uri)
};
goog.uri.utils.getPath = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getPathEncoded(uri))
};
goog.uri.utils.getQueryData = function(uri) {
  return goog.uri.utils.getComponentByIndex_(goog.uri.utils.ComponentIndex.QUERY_DATA, uri)
};
goog.uri.utils.getFragmentEncoded = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? null : uri.substr(hashIndex + 1)
};
goog.uri.utils.setFragmentEncoded = function(uri, fragment) {
  return goog.uri.utils.removeFragment(uri) + (fragment ? "#" + fragment : "")
};
goog.uri.utils.getFragment = function(uri) {
  return goog.uri.utils.decodeIfPossible_(goog.uri.utils.getFragmentEncoded(uri))
};
goog.uri.utils.getHost = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(pieces[goog.uri.utils.ComponentIndex.SCHEME], pieces[goog.uri.utils.ComponentIndex.USER_INFO], pieces[goog.uri.utils.ComponentIndex.DOMAIN], pieces[goog.uri.utils.ComponentIndex.PORT])
};
goog.uri.utils.getPathAndAfter = function(uri) {
  var pieces = goog.uri.utils.split(uri);
  return goog.uri.utils.buildFromEncodedParts(null, null, null, null, pieces[goog.uri.utils.ComponentIndex.PATH], pieces[goog.uri.utils.ComponentIndex.QUERY_DATA], pieces[goog.uri.utils.ComponentIndex.FRAGMENT])
};
goog.uri.utils.removeFragment = function(uri) {
  var hashIndex = uri.indexOf("#");
  return hashIndex < 0 ? uri : uri.substr(0, hashIndex)
};
goog.uri.utils.haveSameDomain = function(uri1, uri2) {
  var pieces1 = goog.uri.utils.split(uri1);
  var pieces2 = goog.uri.utils.split(uri2);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.SCHEME] == pieces2[goog.uri.utils.ComponentIndex.SCHEME] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.uri.utils.assertNoFragmentsOrQueries_ = function(uri) {
  if(goog.DEBUG && (uri.indexOf("#") >= 0 || uri.indexOf("?") >= 0)) {
    throw Error("goog.uri.utils: Fragment or query identifiers are not " + "supported: [" + uri + "]");
  }
};
goog.uri.utils.QueryValue;
goog.uri.utils.QueryArray;
goog.uri.utils.appendQueryData_ = function(buffer) {
  if(buffer[1]) {
    var baseUri = buffer[0];
    var hashIndex = baseUri.indexOf("#");
    if(hashIndex >= 0) {
      buffer.push(baseUri.substr(hashIndex));
      buffer[0] = baseUri = baseUri.substr(0, hashIndex)
    }
    var questionIndex = baseUri.indexOf("?");
    if(questionIndex < 0) {
      buffer[1] = "?"
    }else {
      if(questionIndex == baseUri.length - 1) {
        buffer[1] = undefined
      }
    }
  }
  return buffer.join("")
};
goog.uri.utils.appendKeyValuePairs_ = function(key, value, pairs) {
  if(goog.isArray(value)) {
    value = value;
    for(var j = 0;j < value.length;j++) {
      pairs.push("&", key);
      if(value[j] !== "") {
        pairs.push("=", goog.string.urlEncode(value[j]))
      }
    }
  }else {
    if(value != null) {
      pairs.push("&", key);
      if(value !== "") {
        pairs.push("=", goog.string.urlEncode(value))
      }
    }
  }
};
goog.uri.utils.buildQueryDataBuffer_ = function(buffer, keysAndValues, opt_startIndex) {
  goog.asserts.assert(Math.max(keysAndValues.length - (opt_startIndex || 0), 0) % 2 == 0, "goog.uri.utils: Key/value lists must be even in length.");
  for(var i = opt_startIndex || 0;i < keysAndValues.length;i += 2) {
    goog.uri.utils.appendKeyValuePairs_(keysAndValues[i], keysAndValues[i + 1], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryData = function(keysAndValues, opt_startIndex) {
  var buffer = goog.uri.utils.buildQueryDataBuffer_([], keysAndValues, opt_startIndex);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.buildQueryDataBufferFromMap_ = function(buffer, map) {
  for(var key in map) {
    goog.uri.utils.appendKeyValuePairs_(key, map[key], buffer)
  }
  return buffer
};
goog.uri.utils.buildQueryDataFromMap = function(map) {
  var buffer = goog.uri.utils.buildQueryDataBufferFromMap_([], map);
  buffer[0] = "";
  return buffer.join("")
};
goog.uri.utils.appendParams = function(uri, var_args) {
  return goog.uri.utils.appendQueryData_(arguments.length == 2 ? goog.uri.utils.buildQueryDataBuffer_([uri], arguments[1], 0) : goog.uri.utils.buildQueryDataBuffer_([uri], arguments, 1))
};
goog.uri.utils.appendParamsFromMap = function(uri, map) {
  return goog.uri.utils.appendQueryData_(goog.uri.utils.buildQueryDataBufferFromMap_([uri], map))
};
goog.uri.utils.appendParam = function(uri, key, value) {
  return goog.uri.utils.appendQueryData_([uri, "&", key, "=", goog.string.urlEncode(value)])
};
goog.uri.utils.findParam_ = function(uri, startIndex, keyEncoded, hashOrEndIndex) {
  var index = startIndex;
  var keyLength = keyEncoded.length;
  while((index = uri.indexOf(keyEncoded, index)) >= 0 && index < hashOrEndIndex) {
    var precedingChar = uri.charCodeAt(index - 1);
    if(precedingChar == goog.uri.utils.CharCode_.AMPERSAND || precedingChar == goog.uri.utils.CharCode_.QUESTION) {
      var followingChar = uri.charCodeAt(index + keyLength);
      if(!followingChar || followingChar == goog.uri.utils.CharCode_.EQUAL || followingChar == goog.uri.utils.CharCode_.AMPERSAND || followingChar == goog.uri.utils.CharCode_.HASH) {
        return index
      }
    }
    index += keyLength + 1
  }
  return-1
};
goog.uri.utils.hashOrEndRe_ = /#|$/;
goog.uri.utils.hasParam = function(uri, keyEncoded) {
  return goog.uri.utils.findParam_(uri, 0, keyEncoded, uri.search(goog.uri.utils.hashOrEndRe_)) >= 0
};
goog.uri.utils.getParamValue = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var foundIndex = goog.uri.utils.findParam_(uri, 0, keyEncoded, hashOrEndIndex);
  if(foundIndex < 0) {
    return null
  }else {
    var endPosition = uri.indexOf("&", foundIndex);
    if(endPosition < 0 || endPosition > hashOrEndIndex) {
      endPosition = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    return goog.string.urlDecode(uri.substr(foundIndex, endPosition - foundIndex))
  }
};
goog.uri.utils.getParamValues = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var result = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    position = uri.indexOf("&", foundIndex);
    if(position < 0 || position > hashOrEndIndex) {
      position = hashOrEndIndex
    }
    foundIndex += keyEncoded.length + 1;
    result.push(goog.string.urlDecode(uri.substr(foundIndex, position - foundIndex)))
  }
  return result
};
goog.uri.utils.trailingQueryPunctuationRe_ = /[?&]($|#)/;
goog.uri.utils.removeParam = function(uri, keyEncoded) {
  var hashOrEndIndex = uri.search(goog.uri.utils.hashOrEndRe_);
  var position = 0;
  var foundIndex;
  var buffer = [];
  while((foundIndex = goog.uri.utils.findParam_(uri, position, keyEncoded, hashOrEndIndex)) >= 0) {
    buffer.push(uri.substring(position, foundIndex));
    position = Math.min(uri.indexOf("&", foundIndex) + 1 || hashOrEndIndex, hashOrEndIndex)
  }
  buffer.push(uri.substr(position));
  return buffer.join("").replace(goog.uri.utils.trailingQueryPunctuationRe_, "$1")
};
goog.uri.utils.setParam = function(uri, keyEncoded, value) {
  return goog.uri.utils.appendParam(goog.uri.utils.removeParam(uri, keyEncoded), keyEncoded, value)
};
goog.uri.utils.appendPath = function(baseUri, path) {
  goog.uri.utils.assertNoFragmentsOrQueries_(baseUri);
  if(goog.string.endsWith(baseUri, "/")) {
    baseUri = baseUri.substr(0, baseUri.length - 1)
  }
  if(goog.string.startsWith(path, "/")) {
    path = path.substr(1)
  }
  return goog.string.buildString(baseUri, "/", path)
};
goog.uri.utils.StandardQueryParam = {RANDOM:"zx"};
goog.uri.utils.makeUnique = function(uri) {
  return goog.uri.utils.setParam(uri, goog.uri.utils.StandardQueryParam.RANDOM, goog.string.getRandomString())
};
goog.provide("goog.Uri");
goog.provide("goog.Uri.QueryData");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.require("goog.uri.utils.ComponentIndex");
goog.Uri = function(opt_uri, opt_ignoreCase) {
  var m;
  if(opt_uri instanceof goog.Uri) {
    this.setIgnoreCase(opt_ignoreCase == null ? opt_uri.getIgnoreCase() : opt_ignoreCase);
    this.setScheme(opt_uri.getScheme());
    this.setUserInfo(opt_uri.getUserInfo());
    this.setDomain(opt_uri.getDomain());
    this.setPort(opt_uri.getPort());
    this.setPath(opt_uri.getPath());
    this.setQueryData(opt_uri.getQueryData().clone());
    this.setFragment(opt_uri.getFragment())
  }else {
    if(opt_uri && (m = goog.uri.utils.split(String(opt_uri)))) {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.setScheme(m[goog.uri.utils.ComponentIndex.SCHEME] || "", true);
      this.setUserInfo(m[goog.uri.utils.ComponentIndex.USER_INFO] || "", true);
      this.setDomain(m[goog.uri.utils.ComponentIndex.DOMAIN] || "", true);
      this.setPort(m[goog.uri.utils.ComponentIndex.PORT]);
      this.setPath(m[goog.uri.utils.ComponentIndex.PATH] || "", true);
      this.setQuery(m[goog.uri.utils.ComponentIndex.QUERY_DATA] || "", true);
      this.setFragment(m[goog.uri.utils.ComponentIndex.FRAGMENT] || "", true)
    }else {
      this.setIgnoreCase(!!opt_ignoreCase);
      this.queryData_ = new goog.Uri.QueryData(null, this, this.ignoreCase_)
    }
  }
};
goog.Uri.RANDOM_PARAM = goog.uri.utils.StandardQueryParam.RANDOM;
goog.Uri.prototype.scheme_ = "";
goog.Uri.prototype.userInfo_ = "";
goog.Uri.prototype.domain_ = "";
goog.Uri.prototype.port_ = null;
goog.Uri.prototype.path_ = "";
goog.Uri.prototype.queryData_;
goog.Uri.prototype.fragment_ = "";
goog.Uri.prototype.isReadOnly_ = false;
goog.Uri.prototype.ignoreCase_ = false;
goog.Uri.prototype.toString = function() {
  if(this.cachedToString_) {
    return this.cachedToString_
  }
  var out = [];
  if(this.scheme_) {
    out.push(goog.Uri.encodeSpecialChars_(this.scheme_, goog.Uri.reDisallowedInSchemeOrUserInfo_), ":")
  }
  if(this.domain_) {
    out.push("//");
    if(this.userInfo_) {
      out.push(goog.Uri.encodeSpecialChars_(this.userInfo_, goog.Uri.reDisallowedInSchemeOrUserInfo_), "@")
    }
    out.push(goog.Uri.encodeString_(this.domain_));
    if(this.port_ != null) {
      out.push(":", String(this.getPort()))
    }
  }
  if(this.path_) {
    if(this.hasDomain() && this.path_.charAt(0) != "/") {
      out.push("/")
    }
    out.push(goog.Uri.encodeSpecialChars_(this.path_, this.path_.charAt(0) == "/" ? goog.Uri.reDisallowedInAbsolutePath_ : goog.Uri.reDisallowedInRelativePath_))
  }
  var query = String(this.queryData_);
  if(query) {
    out.push("?", query)
  }
  if(this.fragment_) {
    out.push("#", goog.Uri.encodeSpecialChars_(this.fragment_, goog.Uri.reDisallowedInFragment_))
  }
  return this.cachedToString_ = out.join("")
};
goog.Uri.prototype.resolve = function(relativeUri) {
  var absoluteUri = this.clone();
  var overridden = relativeUri.hasScheme();
  if(overridden) {
    absoluteUri.setScheme(relativeUri.getScheme())
  }else {
    overridden = relativeUri.hasUserInfo()
  }
  if(overridden) {
    absoluteUri.setUserInfo(relativeUri.getUserInfo())
  }else {
    overridden = relativeUri.hasDomain()
  }
  if(overridden) {
    absoluteUri.setDomain(relativeUri.getDomain())
  }else {
    overridden = relativeUri.hasPort()
  }
  var path = relativeUri.getPath();
  if(overridden) {
    absoluteUri.setPort(relativeUri.getPort())
  }else {
    overridden = relativeUri.hasPath();
    if(overridden) {
      if(path.charAt(0) != "/") {
        if(this.hasDomain() && !this.hasPath()) {
          path = "/" + path
        }else {
          var lastSlashIndex = absoluteUri.getPath().lastIndexOf("/");
          if(lastSlashIndex != -1) {
            path = absoluteUri.getPath().substr(0, lastSlashIndex + 1) + path
          }
        }
      }
      path = goog.Uri.removeDotSegments(path)
    }
  }
  if(overridden) {
    absoluteUri.setPath(path)
  }else {
    overridden = relativeUri.hasQuery()
  }
  if(overridden) {
    absoluteUri.setQuery(relativeUri.getDecodedQuery())
  }else {
    overridden = relativeUri.hasFragment()
  }
  if(overridden) {
    absoluteUri.setFragment(relativeUri.getFragment())
  }
  return absoluteUri
};
goog.Uri.prototype.clone = function() {
  return goog.Uri.create(this.scheme_, this.userInfo_, this.domain_, this.port_, this.path_, this.queryData_.clone(), this.fragment_, this.ignoreCase_)
};
goog.Uri.prototype.getScheme = function() {
  return this.scheme_
};
goog.Uri.prototype.setScheme = function(newScheme, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.scheme_ = opt_decode ? goog.Uri.decodeOrEmpty_(newScheme) : newScheme;
  if(this.scheme_) {
    this.scheme_ = this.scheme_.replace(/:$/, "")
  }
  return this
};
goog.Uri.prototype.hasScheme = function() {
  return!!this.scheme_
};
goog.Uri.prototype.getUserInfo = function() {
  return this.userInfo_
};
goog.Uri.prototype.setUserInfo = function(newUserInfo, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.userInfo_ = opt_decode ? goog.Uri.decodeOrEmpty_(newUserInfo) : newUserInfo;
  return this
};
goog.Uri.prototype.hasUserInfo = function() {
  return!!this.userInfo_
};
goog.Uri.prototype.getDomain = function() {
  return this.domain_
};
goog.Uri.prototype.setDomain = function(newDomain, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.domain_ = opt_decode ? goog.Uri.decodeOrEmpty_(newDomain) : newDomain;
  return this
};
goog.Uri.prototype.hasDomain = function() {
  return!!this.domain_
};
goog.Uri.prototype.getPort = function() {
  return this.port_
};
goog.Uri.prototype.setPort = function(newPort) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(newPort) {
    newPort = Number(newPort);
    if(isNaN(newPort) || newPort < 0) {
      throw Error("Bad port number " + newPort);
    }
    this.port_ = newPort
  }else {
    this.port_ = null
  }
  return this
};
goog.Uri.prototype.hasPort = function() {
  return this.port_ != null
};
goog.Uri.prototype.getPath = function() {
  return this.path_
};
goog.Uri.prototype.setPath = function(newPath, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.path_ = opt_decode ? goog.Uri.decodeOrEmpty_(newPath) : newPath;
  return this
};
goog.Uri.prototype.hasPath = function() {
  return!!this.path_
};
goog.Uri.prototype.hasQuery = function() {
  return this.queryData_.toString() !== ""
};
goog.Uri.prototype.setQueryData = function(queryData, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(queryData instanceof goog.Uri.QueryData) {
    this.queryData_ = queryData;
    this.queryData_.uri_ = this;
    this.queryData_.setIgnoreCase(this.ignoreCase_)
  }else {
    if(!opt_decode) {
      queryData = goog.Uri.encodeSpecialChars_(queryData, goog.Uri.reDisallowedInQuery_)
    }
    this.queryData_ = new goog.Uri.QueryData(queryData, this, this.ignoreCase_)
  }
  return this
};
goog.Uri.prototype.setQuery = function(newQuery, opt_decode) {
  return this.setQueryData(newQuery, opt_decode)
};
goog.Uri.prototype.getEncodedQuery = function() {
  return this.queryData_.toString()
};
goog.Uri.prototype.getDecodedQuery = function() {
  return this.queryData_.toDecodedString()
};
goog.Uri.prototype.getQueryData = function() {
  return this.queryData_
};
goog.Uri.prototype.getQuery = function() {
  return this.getEncodedQuery()
};
goog.Uri.prototype.setParameterValue = function(key, value) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.queryData_.set(key, value);
  return this
};
goog.Uri.prototype.setParameterValues = function(key, values) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  if(!goog.isArray(values)) {
    values = [String(values)]
  }
  this.queryData_.setValues(key, values);
  return this
};
goog.Uri.prototype.getParameterValues = function(name) {
  return this.queryData_.getValues(name)
};
goog.Uri.prototype.getParameterValue = function(paramName) {
  return this.queryData_.get(paramName)
};
goog.Uri.prototype.getFragment = function() {
  return this.fragment_
};
goog.Uri.prototype.setFragment = function(newFragment, opt_decode) {
  this.enforceReadOnly();
  delete this.cachedToString_;
  this.fragment_ = opt_decode ? goog.Uri.decodeOrEmpty_(newFragment) : newFragment;
  return this
};
goog.Uri.prototype.hasFragment = function() {
  return!!this.fragment_
};
goog.Uri.prototype.hasSameDomainAs = function(uri2) {
  return(!this.hasDomain() && !uri2.hasDomain() || this.getDomain() == uri2.getDomain()) && (!this.hasPort() && !uri2.hasPort() || this.getPort() == uri2.getPort())
};
goog.Uri.prototype.makeUnique = function() {
  this.enforceReadOnly();
  this.setParameterValue(goog.Uri.RANDOM_PARAM, goog.string.getRandomString());
  return this
};
goog.Uri.prototype.removeParameter = function(key) {
  this.enforceReadOnly();
  this.queryData_.remove(key);
  return this
};
goog.Uri.prototype.setReadOnly = function(isReadOnly) {
  this.isReadOnly_ = isReadOnly;
  return this
};
goog.Uri.prototype.isReadOnly = function() {
  return this.isReadOnly_
};
goog.Uri.prototype.enforceReadOnly = function() {
  if(this.isReadOnly_) {
    throw Error("Tried to modify a read-only Uri");
  }
};
goog.Uri.prototype.setIgnoreCase = function(ignoreCase) {
  this.ignoreCase_ = ignoreCase;
  if(this.queryData_) {
    this.queryData_.setIgnoreCase(ignoreCase)
  }
  return this
};
goog.Uri.prototype.getIgnoreCase = function() {
  return this.ignoreCase_
};
goog.Uri.parse = function(uri, opt_ignoreCase) {
  return uri instanceof goog.Uri ? uri.clone() : new goog.Uri(uri, opt_ignoreCase)
};
goog.Uri.create = function(opt_scheme, opt_userInfo, opt_domain, opt_port, opt_path, opt_query, opt_fragment, opt_ignoreCase) {
  var uri = new goog.Uri(null, opt_ignoreCase);
  opt_scheme && uri.setScheme(opt_scheme);
  opt_userInfo && uri.setUserInfo(opt_userInfo);
  opt_domain && uri.setDomain(opt_domain);
  opt_port && uri.setPort(opt_port);
  opt_path && uri.setPath(opt_path);
  opt_query && uri.setQueryData(opt_query);
  opt_fragment && uri.setFragment(opt_fragment);
  return uri
};
goog.Uri.resolve = function(base, rel) {
  if(!(base instanceof goog.Uri)) {
    base = goog.Uri.parse(base)
  }
  if(!(rel instanceof goog.Uri)) {
    rel = goog.Uri.parse(rel)
  }
  return base.resolve(rel)
};
goog.Uri.removeDotSegments = function(path) {
  if(path == ".." || path == ".") {
    return""
  }else {
    if(!goog.string.contains(path, "./") && !goog.string.contains(path, "/.")) {
      return path
    }else {
      var leadingSlash = goog.string.startsWith(path, "/");
      var segments = path.split("/");
      var out = [];
      for(var pos = 0;pos < segments.length;) {
        var segment = segments[pos++];
        if(segment == ".") {
          if(leadingSlash && pos == segments.length) {
            out.push("")
          }
        }else {
          if(segment == "..") {
            if(out.length > 1 || out.length == 1 && out[0] != "") {
              out.pop()
            }
            if(leadingSlash && pos == segments.length) {
              out.push("")
            }
          }else {
            out.push(segment);
            leadingSlash = true
          }
        }
      }
      return out.join("/")
    }
  }
};
goog.Uri.decodeOrEmpty_ = function(val) {
  return val ? decodeURIComponent(val) : ""
};
goog.Uri.encodeString_ = function(unescapedPart) {
  if(goog.isString(unescapedPart)) {
    return encodeURIComponent(unescapedPart)
  }
  return null
};
goog.Uri.encodeSpecialRegExp_ = /^[a-zA-Z0-9\-_.!~*'():\/;?]*$/;
goog.Uri.encodeSpecialChars_ = function(unescapedPart, extra) {
  var ret = null;
  if(goog.isString(unescapedPart)) {
    ret = unescapedPart;
    if(!goog.Uri.encodeSpecialRegExp_.test(ret)) {
      ret = encodeURI(unescapedPart)
    }
    if(ret.search(extra) >= 0) {
      ret = ret.replace(extra, goog.Uri.encodeChar_)
    }
  }
  return ret
};
goog.Uri.encodeChar_ = function(ch) {
  var n = ch.charCodeAt(0);
  return"%" + (n >> 4 & 15).toString(16) + (n & 15).toString(16)
};
goog.Uri.reDisallowedInSchemeOrUserInfo_ = /[#\/\?@]/g;
goog.Uri.reDisallowedInRelativePath_ = /[\#\?:]/g;
goog.Uri.reDisallowedInAbsolutePath_ = /[\#\?]/g;
goog.Uri.reDisallowedInQuery_ = /[\#\?@]/g;
goog.Uri.reDisallowedInFragment_ = /#/g;
goog.Uri.haveSameDomain = function(uri1String, uri2String) {
  var pieces1 = goog.uri.utils.split(uri1String);
  var pieces2 = goog.uri.utils.split(uri2String);
  return pieces1[goog.uri.utils.ComponentIndex.DOMAIN] == pieces2[goog.uri.utils.ComponentIndex.DOMAIN] && pieces1[goog.uri.utils.ComponentIndex.PORT] == pieces2[goog.uri.utils.ComponentIndex.PORT]
};
goog.Uri.QueryData = function(opt_query, opt_uri, opt_ignoreCase) {
  this.encodedQuery_ = opt_query || null;
  this.uri_ = opt_uri || null;
  this.ignoreCase_ = !!opt_ignoreCase
};
goog.Uri.QueryData.prototype.ensureKeyMapInitialized_ = function() {
  if(!this.keyMap_) {
    this.keyMap_ = new goog.structs.Map;
    this.count_ = 0;
    if(this.encodedQuery_) {
      var pairs = this.encodedQuery_.split("&");
      for(var i = 0;i < pairs.length;i++) {
        var indexOfEquals = pairs[i].indexOf("=");
        var name = null;
        var value = null;
        if(indexOfEquals >= 0) {
          name = pairs[i].substring(0, indexOfEquals);
          value = pairs[i].substring(indexOfEquals + 1)
        }else {
          name = pairs[i]
        }
        name = goog.string.urlDecode(name);
        name = this.getKeyName_(name);
        this.add(name, value ? goog.string.urlDecode(value) : "")
      }
    }
  }
};
goog.Uri.QueryData.createFromMap = function(map, opt_uri, opt_ignoreCase) {
  var keys = goog.structs.getKeys(map);
  if(typeof keys == "undefined") {
    throw Error("Keys are undefined");
  }
  return goog.Uri.QueryData.createFromKeysValues(keys, goog.structs.getValues(map), opt_uri, opt_ignoreCase)
};
goog.Uri.QueryData.createFromKeysValues = function(keys, values, opt_uri, opt_ignoreCase) {
  if(keys.length != values.length) {
    throw Error("Mismatched lengths for keys/values");
  }
  var queryData = new goog.Uri.QueryData(null, opt_uri, opt_ignoreCase);
  for(var i = 0;i < keys.length;i++) {
    queryData.add(keys[i], values[i])
  }
  return queryData
};
goog.Uri.QueryData.prototype.keyMap_ = null;
goog.Uri.QueryData.prototype.count_ = null;
goog.Uri.QueryData.decodedQuery_ = null;
goog.Uri.QueryData.prototype.getCount = function() {
  this.ensureKeyMapInitialized_();
  return this.count_
};
goog.Uri.QueryData.prototype.add = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(!this.containsKey(key)) {
    this.keyMap_.set(key, value)
  }else {
    var current = this.keyMap_.get(key);
    if(goog.isArray(current)) {
      current.push(value)
    }else {
      this.keyMap_.set(key, [current, value])
    }
  }
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.remove = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.keyMap_.containsKey(key)) {
    this.invalidateCache_();
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
    return this.keyMap_.remove(key)
  }
  return false
};
goog.Uri.QueryData.prototype.clear = function() {
  this.invalidateCache_();
  if(this.keyMap_) {
    this.keyMap_.clear()
  }
  this.count_ = 0
};
goog.Uri.QueryData.prototype.isEmpty = function() {
  this.ensureKeyMapInitialized_();
  return this.count_ == 0
};
goog.Uri.QueryData.prototype.containsKey = function(key) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  return this.keyMap_.containsKey(key)
};
goog.Uri.QueryData.prototype.containsValue = function(value) {
  var vals = this.getValues();
  return goog.array.contains(vals, value)
};
goog.Uri.QueryData.prototype.getKeys = function() {
  this.ensureKeyMapInitialized_();
  var vals = this.keyMap_.getValues();
  var keys = this.keyMap_.getKeys();
  var rv = [];
  for(var i = 0;i < keys.length;i++) {
    var val = vals[i];
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        rv.push(keys[i])
      }
    }else {
      rv.push(keys[i])
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.getValues = function(opt_key) {
  this.ensureKeyMapInitialized_();
  var rv;
  if(opt_key) {
    var key = this.getKeyName_(opt_key);
    if(this.containsKey(key)) {
      var value = this.keyMap_.get(key);
      if(goog.isArray(value)) {
        return value
      }else {
        rv = [];
        rv.push(value)
      }
    }else {
      rv = []
    }
  }else {
    var vals = this.keyMap_.getValues();
    rv = [];
    for(var i = 0;i < vals.length;i++) {
      var val = vals[i];
      if(goog.isArray(val)) {
        goog.array.extend(rv, val)
      }else {
        rv.push(val)
      }
    }
  }
  return rv
};
goog.Uri.QueryData.prototype.set = function(key, value) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  this.keyMap_.set(key, value);
  this.count_++;
  return this
};
goog.Uri.QueryData.prototype.get = function(key, opt_default) {
  this.ensureKeyMapInitialized_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      return val[0]
    }else {
      return val
    }
  }else {
    return opt_default
  }
};
goog.Uri.QueryData.prototype.setValues = function(key, values) {
  this.ensureKeyMapInitialized_();
  this.invalidateCache_();
  key = this.getKeyName_(key);
  if(this.containsKey(key)) {
    var old = this.keyMap_.get(key);
    if(goog.isArray(old)) {
      this.count_ -= old.length
    }else {
      this.count_--
    }
  }
  if(values.length > 0) {
    this.keyMap_.set(key, values);
    this.count_ += values.length
  }
};
goog.Uri.QueryData.prototype.toString = function() {
  if(this.encodedQuery_) {
    return this.encodedQuery_
  }
  if(!this.keyMap_) {
    return""
  }
  var sb = [];
  var count = 0;
  var keys = this.keyMap_.getKeys();
  for(var i = 0;i < keys.length;i++) {
    var key = keys[i];
    var encodedKey = goog.string.urlEncode(key);
    var val = this.keyMap_.get(key);
    if(goog.isArray(val)) {
      for(var j = 0;j < val.length;j++) {
        if(count > 0) {
          sb.push("&")
        }
        sb.push(encodedKey);
        if(val[j] !== "") {
          sb.push("=", goog.string.urlEncode(val[j]))
        }
        count++
      }
    }else {
      if(count > 0) {
        sb.push("&")
      }
      sb.push(encodedKey);
      if(val !== "") {
        sb.push("=", goog.string.urlEncode(val))
      }
      count++
    }
  }
  return this.encodedQuery_ = sb.join("")
};
goog.Uri.QueryData.prototype.toDecodedString = function() {
  if(!this.decodedQuery_) {
    this.decodedQuery_ = goog.Uri.decodeOrEmpty_(this.toString())
  }
  return this.decodedQuery_
};
goog.Uri.QueryData.prototype.invalidateCache_ = function() {
  delete this.decodedQuery_;
  delete this.encodedQuery_;
  if(this.uri_) {
    delete this.uri_.cachedToString_
  }
};
goog.Uri.QueryData.prototype.filterKeys = function(keys) {
  this.ensureKeyMapInitialized_();
  goog.structs.forEach(this.keyMap_, function(value, key, map) {
    if(!goog.array.contains(keys, key)) {
      this.remove(key)
    }
  }, this);
  return this
};
goog.Uri.QueryData.prototype.clone = function() {
  var rv = new goog.Uri.QueryData;
  if(this.decodedQuery_) {
    rv.decodedQuery_ = this.decodedQuery_
  }
  if(this.encodedQuery_) {
    rv.encodedQuery_ = this.encodedQuery_
  }
  if(this.keyMap_) {
    rv.keyMap_ = this.keyMap_.clone()
  }
  return rv
};
goog.Uri.QueryData.prototype.getKeyName_ = function(arg) {
  var keyName = String(arg);
  if(this.ignoreCase_) {
    keyName = keyName.toLowerCase()
  }
  return keyName
};
goog.Uri.QueryData.prototype.setIgnoreCase = function(ignoreCase) {
  var resetKeys = ignoreCase && !this.ignoreCase_;
  if(resetKeys) {
    this.ensureKeyMapInitialized_();
    this.invalidateCache_();
    goog.structs.forEach(this.keyMap_, function(value, key, map) {
      var lowerCase = key.toLowerCase();
      if(key != lowerCase) {
        this.remove(key);
        this.add(lowerCase, value)
      }
    }, this)
  }
  this.ignoreCase_ = ignoreCase
};
goog.Uri.QueryData.prototype.extend = function(var_args) {
  for(var i = 0;i < arguments.length;i++) {
    var data = arguments[i];
    goog.structs.forEach(data, function(value, key) {
      this.add(key, value)
    }, this)
  }
};
goog.provide("goog.dom.BrowserFeature");
goog.require("goog.userAgent");
goog.dom.BrowserFeature = {CAN_ADD_NAME_OR_TYPE_ATTRIBUTES:!goog.userAgent.IE || goog.userAgent.isDocumentMode(9), CAN_USE_CHILDREN_ATTRIBUTE:!goog.userAgent.GECKO && !goog.userAgent.IE || goog.userAgent.IE && goog.userAgent.isDocumentMode(9) || goog.userAgent.GECKO && goog.userAgent.isVersion("1.9.1"), CAN_USE_INNER_TEXT:goog.userAgent.IE && !goog.userAgent.isVersion("9"), INNER_HTML_NEEDS_SCOPED_ELEMENT:goog.userAgent.IE};
goog.provide("goog.dom.TagName");
goog.dom.TagName = {A:"A", ABBR:"ABBR", ACRONYM:"ACRONYM", ADDRESS:"ADDRESS", APPLET:"APPLET", AREA:"AREA", B:"B", BASE:"BASE", BASEFONT:"BASEFONT", BDO:"BDO", BIG:"BIG", BLOCKQUOTE:"BLOCKQUOTE", BODY:"BODY", BR:"BR", BUTTON:"BUTTON", CANVAS:"CANVAS", CAPTION:"CAPTION", CENTER:"CENTER", CITE:"CITE", CODE:"CODE", COL:"COL", COLGROUP:"COLGROUP", DD:"DD", DEL:"DEL", DFN:"DFN", DIR:"DIR", DIV:"DIV", DL:"DL", DT:"DT", EM:"EM", FIELDSET:"FIELDSET", FONT:"FONT", FORM:"FORM", FRAME:"FRAME", FRAMESET:"FRAMESET", 
H1:"H1", H2:"H2", H3:"H3", H4:"H4", H5:"H5", H6:"H6", HEAD:"HEAD", HR:"HR", HTML:"HTML", I:"I", IFRAME:"IFRAME", IMG:"IMG", INPUT:"INPUT", INS:"INS", ISINDEX:"ISINDEX", KBD:"KBD", LABEL:"LABEL", LEGEND:"LEGEND", LI:"LI", LINK:"LINK", MAP:"MAP", MENU:"MENU", META:"META", NOFRAMES:"NOFRAMES", NOSCRIPT:"NOSCRIPT", OBJECT:"OBJECT", OL:"OL", OPTGROUP:"OPTGROUP", OPTION:"OPTION", P:"P", PARAM:"PARAM", PRE:"PRE", Q:"Q", S:"S", SAMP:"SAMP", SCRIPT:"SCRIPT", SELECT:"SELECT", SMALL:"SMALL", SPAN:"SPAN", STRIKE:"STRIKE", 
STRONG:"STRONG", STYLE:"STYLE", SUB:"SUB", SUP:"SUP", TABLE:"TABLE", TBODY:"TBODY", TD:"TD", TEXTAREA:"TEXTAREA", TFOOT:"TFOOT", TH:"TH", THEAD:"THEAD", TITLE:"TITLE", TR:"TR", TT:"TT", U:"U", UL:"UL", VAR:"VAR"};
goog.provide("goog.dom.classes");
goog.require("goog.array");
goog.dom.classes.set = function(element, className) {
  element.className = className
};
goog.dom.classes.get = function(element) {
  var className = element.className;
  return className && typeof className.split == "function" ? className.split(/\s+/) : []
};
goog.dom.classes.add = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.add_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.remove = function(element, var_args) {
  var classes = goog.dom.classes.get(element);
  var args = goog.array.slice(arguments, 1);
  var b = goog.dom.classes.remove_(classes, args);
  element.className = classes.join(" ");
  return b
};
goog.dom.classes.add_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < args.length;i++) {
    if(!goog.array.contains(classes, args[i])) {
      classes.push(args[i]);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.remove_ = function(classes, args) {
  var rv = 0;
  for(var i = 0;i < classes.length;i++) {
    if(goog.array.contains(args, classes[i])) {
      goog.array.splice(classes, i--, 1);
      rv++
    }
  }
  return rv == args.length
};
goog.dom.classes.swap = function(element, fromClass, toClass) {
  var classes = goog.dom.classes.get(element);
  var removed = false;
  for(var i = 0;i < classes.length;i++) {
    if(classes[i] == fromClass) {
      goog.array.splice(classes, i--, 1);
      removed = true
    }
  }
  if(removed) {
    classes.push(toClass);
    element.className = classes.join(" ")
  }
  return removed
};
goog.dom.classes.addRemove = function(element, classesToRemove, classesToAdd) {
  var classes = goog.dom.classes.get(element);
  if(goog.isString(classesToRemove)) {
    goog.array.remove(classes, classesToRemove)
  }else {
    if(goog.isArray(classesToRemove)) {
      goog.dom.classes.remove_(classes, classesToRemove)
    }
  }
  if(goog.isString(classesToAdd) && !goog.array.contains(classes, classesToAdd)) {
    classes.push(classesToAdd)
  }else {
    if(goog.isArray(classesToAdd)) {
      goog.dom.classes.add_(classes, classesToAdd)
    }
  }
  element.className = classes.join(" ")
};
goog.dom.classes.has = function(element, className) {
  return goog.array.contains(goog.dom.classes.get(element), className)
};
goog.dom.classes.enable = function(element, className, enabled) {
  if(enabled) {
    goog.dom.classes.add(element, className)
  }else {
    goog.dom.classes.remove(element, className)
  }
};
goog.dom.classes.toggle = function(element, className) {
  var add = !goog.dom.classes.has(element, className);
  goog.dom.classes.enable(element, className, add);
  return add
};
goog.provide("goog.math.Coordinate");
goog.math.Coordinate = function(opt_x, opt_y) {
  this.x = goog.isDef(opt_x) ? opt_x : 0;
  this.y = goog.isDef(opt_y) ? opt_y : 0
};
goog.math.Coordinate.prototype.clone = function() {
  return new goog.math.Coordinate(this.x, this.y)
};
if(goog.DEBUG) {
  goog.math.Coordinate.prototype.toString = function() {
    return"(" + this.x + ", " + this.y + ")"
  }
}
goog.math.Coordinate.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.x == b.x && a.y == b.y
};
goog.math.Coordinate.distance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy)
};
goog.math.Coordinate.squaredDistance = function(a, b) {
  var dx = a.x - b.x;
  var dy = a.y - b.y;
  return dx * dx + dy * dy
};
goog.math.Coordinate.difference = function(a, b) {
  return new goog.math.Coordinate(a.x - b.x, a.y - b.y)
};
goog.math.Coordinate.sum = function(a, b) {
  return new goog.math.Coordinate(a.x + b.x, a.y + b.y)
};
goog.provide("goog.math.Size");
goog.math.Size = function(width, height) {
  this.width = width;
  this.height = height
};
goog.math.Size.equals = function(a, b) {
  if(a == b) {
    return true
  }
  if(!a || !b) {
    return false
  }
  return a.width == b.width && a.height == b.height
};
goog.math.Size.prototype.clone = function() {
  return new goog.math.Size(this.width, this.height)
};
if(goog.DEBUG) {
  goog.math.Size.prototype.toString = function() {
    return"(" + this.width + " x " + this.height + ")"
  }
}
goog.math.Size.prototype.getLongest = function() {
  return Math.max(this.width, this.height)
};
goog.math.Size.prototype.getShortest = function() {
  return Math.min(this.width, this.height)
};
goog.math.Size.prototype.area = function() {
  return this.width * this.height
};
goog.math.Size.prototype.perimeter = function() {
  return(this.width + this.height) * 2
};
goog.math.Size.prototype.aspectRatio = function() {
  return this.width / this.height
};
goog.math.Size.prototype.isEmpty = function() {
  return!this.area()
};
goog.math.Size.prototype.ceil = function() {
  this.width = Math.ceil(this.width);
  this.height = Math.ceil(this.height);
  return this
};
goog.math.Size.prototype.fitsInside = function(target) {
  return this.width <= target.width && this.height <= target.height
};
goog.math.Size.prototype.floor = function() {
  this.width = Math.floor(this.width);
  this.height = Math.floor(this.height);
  return this
};
goog.math.Size.prototype.round = function() {
  this.width = Math.round(this.width);
  this.height = Math.round(this.height);
  return this
};
goog.math.Size.prototype.scale = function(s) {
  this.width *= s;
  this.height *= s;
  return this
};
goog.math.Size.prototype.scaleToFit = function(target) {
  var s = this.aspectRatio() > target.aspectRatio() ? target.width / this.width : target.height / this.height;
  return this.scale(s)
};
goog.provide("goog.dom");
goog.provide("goog.dom.DomHelper");
goog.provide("goog.dom.NodeType");
goog.require("goog.array");
goog.require("goog.dom.BrowserFeature");
goog.require("goog.dom.TagName");
goog.require("goog.dom.classes");
goog.require("goog.math.Coordinate");
goog.require("goog.math.Size");
goog.require("goog.object");
goog.require("goog.string");
goog.require("goog.userAgent");
goog.dom.ASSUME_QUIRKS_MODE = false;
goog.dom.ASSUME_STANDARDS_MODE = false;
goog.dom.COMPAT_MODE_KNOWN_ = goog.dom.ASSUME_QUIRKS_MODE || goog.dom.ASSUME_STANDARDS_MODE;
goog.dom.NodeType = {ELEMENT:1, ATTRIBUTE:2, TEXT:3, CDATA_SECTION:4, ENTITY_REFERENCE:5, ENTITY:6, PROCESSING_INSTRUCTION:7, COMMENT:8, DOCUMENT:9, DOCUMENT_TYPE:10, DOCUMENT_FRAGMENT:11, NOTATION:12};
goog.dom.getDomHelper = function(opt_element) {
  return opt_element ? new goog.dom.DomHelper(goog.dom.getOwnerDocument(opt_element)) : goog.dom.defaultDomHelper_ || (goog.dom.defaultDomHelper_ = new goog.dom.DomHelper)
};
goog.dom.defaultDomHelper_;
goog.dom.getDocument = function() {
  return document
};
goog.dom.getElement = function(element) {
  return goog.isString(element) ? document.getElementById(element) : element
};
goog.dom.$ = goog.dom.getElement;
goog.dom.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(document, opt_tag, opt_class, opt_el)
};
goog.dom.getElementsByClass = function(className, opt_el) {
  var parent = opt_el || document;
  if(goog.dom.canUseQuerySelector_(parent)) {
    return parent.querySelectorAll("." + className)
  }else {
    if(parent.getElementsByClassName) {
      return parent.getElementsByClassName(className)
    }
  }
  return goog.dom.getElementsByTagNameAndClass_(document, "*", className, opt_el)
};
goog.dom.getElementByClass = function(className, opt_el) {
  var parent = opt_el || document;
  var retVal = null;
  if(goog.dom.canUseQuerySelector_(parent)) {
    retVal = parent.querySelector("." + className)
  }else {
    retVal = goog.dom.getElementsByClass(className, opt_el)[0]
  }
  return retVal || null
};
goog.dom.canUseQuerySelector_ = function(parent) {
  return parent.querySelectorAll && parent.querySelector && (!goog.userAgent.WEBKIT || goog.dom.isCss1CompatMode_(document) || goog.userAgent.isVersion("528"))
};
goog.dom.getElementsByTagNameAndClass_ = function(doc, opt_tag, opt_class, opt_el) {
  var parent = opt_el || doc;
  var tagName = opt_tag && opt_tag != "*" ? opt_tag.toUpperCase() : "";
  if(goog.dom.canUseQuerySelector_(parent) && (tagName || opt_class)) {
    var query = tagName + (opt_class ? "." + opt_class : "");
    return parent.querySelectorAll(query)
  }
  if(opt_class && parent.getElementsByClassName) {
    var els = parent.getElementsByClassName(opt_class);
    if(tagName) {
      var arrayLike = {};
      var len = 0;
      for(var i = 0, el;el = els[i];i++) {
        if(tagName == el.nodeName) {
          arrayLike[len++] = el
        }
      }
      arrayLike.length = len;
      return arrayLike
    }else {
      return els
    }
  }
  var els = parent.getElementsByTagName(tagName || "*");
  if(opt_class) {
    var arrayLike = {};
    var len = 0;
    for(var i = 0, el;el = els[i];i++) {
      var className = el.className;
      if(typeof className.split == "function" && goog.array.contains(className.split(/\s+/), opt_class)) {
        arrayLike[len++] = el
      }
    }
    arrayLike.length = len;
    return arrayLike
  }else {
    return els
  }
};
goog.dom.$$ = goog.dom.getElementsByTagNameAndClass;
goog.dom.setProperties = function(element, properties) {
  goog.object.forEach(properties, function(val, key) {
    if(key == "style") {
      element.style.cssText = val
    }else {
      if(key == "class") {
        element.className = val
      }else {
        if(key == "for") {
          element.htmlFor = val
        }else {
          if(key in goog.dom.DIRECT_ATTRIBUTE_MAP_) {
            element.setAttribute(goog.dom.DIRECT_ATTRIBUTE_MAP_[key], val)
          }else {
            if(goog.string.startsWith(key, "aria-")) {
              element.setAttribute(key, val)
            }else {
              element[key] = val
            }
          }
        }
      }
    }
  })
};
goog.dom.DIRECT_ATTRIBUTE_MAP_ = {"cellpadding":"cellPadding", "cellspacing":"cellSpacing", "colspan":"colSpan", "rowspan":"rowSpan", "valign":"vAlign", "height":"height", "width":"width", "usemap":"useMap", "frameborder":"frameBorder", "maxlength":"maxLength", "type":"type"};
goog.dom.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize_(opt_window || window)
};
goog.dom.getViewportSize_ = function(win) {
  var doc = win.document;
  if(goog.userAgent.WEBKIT && !goog.userAgent.isVersion("500") && !goog.userAgent.MOBILE) {
    if(typeof win.innerHeight == "undefined") {
      win = window
    }
    var innerHeight = win.innerHeight;
    var scrollHeight = win.document.documentElement.scrollHeight;
    if(win == win.top) {
      if(scrollHeight < innerHeight) {
        innerHeight -= 15
      }
    }
    return new goog.math.Size(win.innerWidth, innerHeight)
  }
  var el = goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body;
  return new goog.math.Size(el.clientWidth, el.clientHeight)
};
goog.dom.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(window)
};
goog.dom.getDocumentHeight_ = function(win) {
  var doc = win.document;
  var height = 0;
  if(doc) {
    var vh = goog.dom.getViewportSize_(win).height;
    var body = doc.body;
    var docEl = doc.documentElement;
    if(goog.dom.isCss1CompatMode_(doc) && docEl.scrollHeight) {
      height = docEl.scrollHeight != vh ? docEl.scrollHeight : docEl.offsetHeight
    }else {
      var sh = docEl.scrollHeight;
      var oh = docEl.offsetHeight;
      if(docEl.clientHeight != oh) {
        sh = body.scrollHeight;
        oh = body.offsetHeight
      }
      if(sh > vh) {
        height = sh > oh ? sh : oh
      }else {
        height = sh < oh ? sh : oh
      }
    }
  }
  return height
};
goog.dom.getPageScroll = function(opt_window) {
  var win = opt_window || goog.global || window;
  return goog.dom.getDomHelper(win.document).getDocumentScroll()
};
goog.dom.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(document)
};
goog.dom.getDocumentScroll_ = function(doc) {
  var el = goog.dom.getDocumentScrollElement_(doc);
  var win = goog.dom.getWindow_(doc);
  return new goog.math.Coordinate(win.pageXOffset || el.scrollLeft, win.pageYOffset || el.scrollTop)
};
goog.dom.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(document)
};
goog.dom.getDocumentScrollElement_ = function(doc) {
  return!goog.userAgent.WEBKIT && goog.dom.isCss1CompatMode_(doc) ? doc.documentElement : doc.body
};
goog.dom.getWindow = function(opt_doc) {
  return opt_doc ? goog.dom.getWindow_(opt_doc) : window
};
goog.dom.getWindow_ = function(doc) {
  return doc.parentWindow || doc.defaultView
};
goog.dom.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(document, arguments)
};
goog.dom.createDom_ = function(doc, args) {
  var tagName = args[0];
  var attributes = args[1];
  if(!goog.dom.BrowserFeature.CAN_ADD_NAME_OR_TYPE_ATTRIBUTES && attributes && (attributes.name || attributes.type)) {
    var tagNameArr = ["<", tagName];
    if(attributes.name) {
      tagNameArr.push(' name="', goog.string.htmlEscape(attributes.name), '"')
    }
    if(attributes.type) {
      tagNameArr.push(' type="', goog.string.htmlEscape(attributes.type), '"');
      var clone = {};
      goog.object.extend(clone, attributes);
      attributes = clone;
      delete attributes.type
    }
    tagNameArr.push(">");
    tagName = tagNameArr.join("")
  }
  var element = doc.createElement(tagName);
  if(attributes) {
    if(goog.isString(attributes)) {
      element.className = attributes
    }else {
      if(goog.isArray(attributes)) {
        goog.dom.classes.add.apply(null, [element].concat(attributes))
      }else {
        goog.dom.setProperties(element, attributes)
      }
    }
  }
  if(args.length > 2) {
    goog.dom.append_(doc, element, args, 2)
  }
  return element
};
goog.dom.append_ = function(doc, parent, args, startIndex) {
  function childHandler(child) {
    if(child) {
      parent.appendChild(goog.isString(child) ? doc.createTextNode(child) : child)
    }
  }
  for(var i = startIndex;i < args.length;i++) {
    var arg = args[i];
    if(goog.isArrayLike(arg) && !goog.dom.isNodeLike(arg)) {
      goog.array.forEach(goog.dom.isNodeList(arg) ? goog.array.clone(arg) : arg, childHandler)
    }else {
      childHandler(arg)
    }
  }
};
goog.dom.$dom = goog.dom.createDom;
goog.dom.createElement = function(name) {
  return document.createElement(name)
};
goog.dom.createTextNode = function(content) {
  return document.createTextNode(content)
};
goog.dom.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(document, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.createTable_ = function(doc, rows, columns, fillWithNbsp) {
  var rowHtml = ["<tr>"];
  for(var i = 0;i < columns;i++) {
    rowHtml.push(fillWithNbsp ? "<td>&nbsp;</td>" : "<td></td>")
  }
  rowHtml.push("</tr>");
  rowHtml = rowHtml.join("");
  var totalHtml = ["<table>"];
  for(i = 0;i < rows;i++) {
    totalHtml.push(rowHtml)
  }
  totalHtml.push("</table>");
  var elem = doc.createElement(goog.dom.TagName.DIV);
  elem.innerHTML = totalHtml.join("");
  return elem.removeChild(elem.firstChild)
};
goog.dom.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(document, htmlString)
};
goog.dom.htmlToDocumentFragment_ = function(doc, htmlString) {
  var tempDiv = doc.createElement("div");
  if(goog.dom.BrowserFeature.INNER_HTML_NEEDS_SCOPED_ELEMENT) {
    tempDiv.innerHTML = "<br>" + htmlString;
    tempDiv.removeChild(tempDiv.firstChild)
  }else {
    tempDiv.innerHTML = htmlString
  }
  if(tempDiv.childNodes.length == 1) {
    return tempDiv.removeChild(tempDiv.firstChild)
  }else {
    var fragment = doc.createDocumentFragment();
    while(tempDiv.firstChild) {
      fragment.appendChild(tempDiv.firstChild)
    }
    return fragment
  }
};
goog.dom.getCompatMode = function() {
  return goog.dom.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(document)
};
goog.dom.isCss1CompatMode_ = function(doc) {
  if(goog.dom.COMPAT_MODE_KNOWN_) {
    return goog.dom.ASSUME_STANDARDS_MODE
  }
  return doc.compatMode == "CSS1Compat"
};
goog.dom.canHaveChildren = function(node) {
  if(node.nodeType != goog.dom.NodeType.ELEMENT) {
    return false
  }
  switch(node.tagName) {
    case goog.dom.TagName.APPLET:
    ;
    case goog.dom.TagName.AREA:
    ;
    case goog.dom.TagName.BASE:
    ;
    case goog.dom.TagName.BR:
    ;
    case goog.dom.TagName.COL:
    ;
    case goog.dom.TagName.FRAME:
    ;
    case goog.dom.TagName.HR:
    ;
    case goog.dom.TagName.IMG:
    ;
    case goog.dom.TagName.INPUT:
    ;
    case goog.dom.TagName.IFRAME:
    ;
    case goog.dom.TagName.ISINDEX:
    ;
    case goog.dom.TagName.LINK:
    ;
    case goog.dom.TagName.NOFRAMES:
    ;
    case goog.dom.TagName.NOSCRIPT:
    ;
    case goog.dom.TagName.META:
    ;
    case goog.dom.TagName.OBJECT:
    ;
    case goog.dom.TagName.PARAM:
    ;
    case goog.dom.TagName.SCRIPT:
    ;
    case goog.dom.TagName.STYLE:
      return false
  }
  return true
};
goog.dom.appendChild = function(parent, child) {
  parent.appendChild(child)
};
goog.dom.append = function(parent, var_args) {
  goog.dom.append_(goog.dom.getOwnerDocument(parent), parent, arguments, 1)
};
goog.dom.removeChildren = function(node) {
  var child;
  while(child = node.firstChild) {
    node.removeChild(child)
  }
};
goog.dom.insertSiblingBefore = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode)
  }
};
goog.dom.insertSiblingAfter = function(newNode, refNode) {
  if(refNode.parentNode) {
    refNode.parentNode.insertBefore(newNode, refNode.nextSibling)
  }
};
goog.dom.insertChildAt = function(parent, child, index) {
  parent.insertBefore(child, parent.childNodes[index] || null)
};
goog.dom.removeNode = function(node) {
  return node && node.parentNode ? node.parentNode.removeChild(node) : null
};
goog.dom.replaceNode = function(newNode, oldNode) {
  var parent = oldNode.parentNode;
  if(parent) {
    parent.replaceChild(newNode, oldNode)
  }
};
goog.dom.flattenElement = function(element) {
  var child, parent = element.parentNode;
  if(parent && parent.nodeType != goog.dom.NodeType.DOCUMENT_FRAGMENT) {
    if(element.removeNode) {
      return element.removeNode(false)
    }else {
      while(child = element.firstChild) {
        parent.insertBefore(child, element)
      }
      return goog.dom.removeNode(element)
    }
  }
};
goog.dom.getChildren = function(element) {
  if(goog.dom.BrowserFeature.CAN_USE_CHILDREN_ATTRIBUTE && element.children != undefined) {
    return element.children
  }
  return goog.array.filter(element.childNodes, function(node) {
    return node.nodeType == goog.dom.NodeType.ELEMENT
  })
};
goog.dom.getFirstElementChild = function(node) {
  if(node.firstElementChild != undefined) {
    return node.firstElementChild
  }
  return goog.dom.getNextElementNode_(node.firstChild, true)
};
goog.dom.getLastElementChild = function(node) {
  if(node.lastElementChild != undefined) {
    return node.lastElementChild
  }
  return goog.dom.getNextElementNode_(node.lastChild, false)
};
goog.dom.getNextElementSibling = function(node) {
  if(node.nextElementSibling != undefined) {
    return node.nextElementSibling
  }
  return goog.dom.getNextElementNode_(node.nextSibling, true)
};
goog.dom.getPreviousElementSibling = function(node) {
  if(node.previousElementSibling != undefined) {
    return node.previousElementSibling
  }
  return goog.dom.getNextElementNode_(node.previousSibling, false)
};
goog.dom.getNextElementNode_ = function(node, forward) {
  while(node && node.nodeType != goog.dom.NodeType.ELEMENT) {
    node = forward ? node.nextSibling : node.previousSibling
  }
  return node
};
goog.dom.getNextNode = function(node) {
  if(!node) {
    return null
  }
  if(node.firstChild) {
    return node.firstChild
  }
  while(node && !node.nextSibling) {
    node = node.parentNode
  }
  return node ? node.nextSibling : null
};
goog.dom.getPreviousNode = function(node) {
  if(!node) {
    return null
  }
  if(!node.previousSibling) {
    return node.parentNode
  }
  node = node.previousSibling;
  while(node && node.lastChild) {
    node = node.lastChild
  }
  return node
};
goog.dom.isNodeLike = function(obj) {
  return goog.isObject(obj) && obj.nodeType > 0
};
goog.dom.isElement = function(obj) {
  return goog.isObject(obj) && obj.nodeType == goog.dom.NodeType.ELEMENT
};
goog.dom.isWindow = function(obj) {
  return goog.isObject(obj) && obj["window"] == obj
};
goog.dom.contains = function(parent, descendant) {
  if(parent.contains && descendant.nodeType == goog.dom.NodeType.ELEMENT) {
    return parent == descendant || parent.contains(descendant)
  }
  if(typeof parent.compareDocumentPosition != "undefined") {
    return parent == descendant || Boolean(parent.compareDocumentPosition(descendant) & 16)
  }
  while(descendant && parent != descendant) {
    descendant = descendant.parentNode
  }
  return descendant == parent
};
goog.dom.compareNodeOrder = function(node1, node2) {
  if(node1 == node2) {
    return 0
  }
  if(node1.compareDocumentPosition) {
    return node1.compareDocumentPosition(node2) & 2 ? 1 : -1
  }
  if("sourceIndex" in node1 || node1.parentNode && "sourceIndex" in node1.parentNode) {
    var isElement1 = node1.nodeType == goog.dom.NodeType.ELEMENT;
    var isElement2 = node2.nodeType == goog.dom.NodeType.ELEMENT;
    if(isElement1 && isElement2) {
      return node1.sourceIndex - node2.sourceIndex
    }else {
      var parent1 = node1.parentNode;
      var parent2 = node2.parentNode;
      if(parent1 == parent2) {
        return goog.dom.compareSiblingOrder_(node1, node2)
      }
      if(!isElement1 && goog.dom.contains(parent1, node2)) {
        return-1 * goog.dom.compareParentsDescendantNodeIe_(node1, node2)
      }
      if(!isElement2 && goog.dom.contains(parent2, node1)) {
        return goog.dom.compareParentsDescendantNodeIe_(node2, node1)
      }
      return(isElement1 ? node1.sourceIndex : parent1.sourceIndex) - (isElement2 ? node2.sourceIndex : parent2.sourceIndex)
    }
  }
  var doc = goog.dom.getOwnerDocument(node1);
  var range1, range2;
  range1 = doc.createRange();
  range1.selectNode(node1);
  range1.collapse(true);
  range2 = doc.createRange();
  range2.selectNode(node2);
  range2.collapse(true);
  return range1.compareBoundaryPoints(goog.global["Range"].START_TO_END, range2)
};
goog.dom.compareParentsDescendantNodeIe_ = function(textNode, node) {
  var parent = textNode.parentNode;
  if(parent == node) {
    return-1
  }
  var sibling = node;
  while(sibling.parentNode != parent) {
    sibling = sibling.parentNode
  }
  return goog.dom.compareSiblingOrder_(sibling, textNode)
};
goog.dom.compareSiblingOrder_ = function(node1, node2) {
  var s = node2;
  while(s = s.previousSibling) {
    if(s == node1) {
      return-1
    }
  }
  return 1
};
goog.dom.findCommonAncestor = function(var_args) {
  var i, count = arguments.length;
  if(!count) {
    return null
  }else {
    if(count == 1) {
      return arguments[0]
    }
  }
  var paths = [];
  var minLength = Infinity;
  for(i = 0;i < count;i++) {
    var ancestors = [];
    var node = arguments[i];
    while(node) {
      ancestors.unshift(node);
      node = node.parentNode
    }
    paths.push(ancestors);
    minLength = Math.min(minLength, ancestors.length)
  }
  var output = null;
  for(i = 0;i < minLength;i++) {
    var first = paths[0][i];
    for(var j = 1;j < count;j++) {
      if(first != paths[j][i]) {
        return output
      }
    }
    output = first
  }
  return output
};
goog.dom.getOwnerDocument = function(node) {
  return node.nodeType == goog.dom.NodeType.DOCUMENT ? node : node.ownerDocument || node.document
};
goog.dom.getFrameContentDocument = function(frame) {
  var doc = frame.contentDocument || frame.contentWindow.document;
  return doc
};
goog.dom.getFrameContentWindow = function(frame) {
  return frame.contentWindow || goog.dom.getWindow_(goog.dom.getFrameContentDocument(frame))
};
goog.dom.setTextContent = function(element, text) {
  if("textContent" in element) {
    element.textContent = text
  }else {
    if(element.firstChild && element.firstChild.nodeType == goog.dom.NodeType.TEXT) {
      while(element.lastChild != element.firstChild) {
        element.removeChild(element.lastChild)
      }
      element.firstChild.data = text
    }else {
      goog.dom.removeChildren(element);
      var doc = goog.dom.getOwnerDocument(element);
      element.appendChild(doc.createTextNode(text))
    }
  }
};
goog.dom.getOuterHtml = function(element) {
  if("outerHTML" in element) {
    return element.outerHTML
  }else {
    var doc = goog.dom.getOwnerDocument(element);
    var div = doc.createElement("div");
    div.appendChild(element.cloneNode(true));
    return div.innerHTML
  }
};
goog.dom.findNode = function(root, p) {
  var rv = [];
  var found = goog.dom.findNodes_(root, p, rv, true);
  return found ? rv[0] : undefined
};
goog.dom.findNodes = function(root, p) {
  var rv = [];
  goog.dom.findNodes_(root, p, rv, false);
  return rv
};
goog.dom.findNodes_ = function(root, p, rv, findOne) {
  if(root != null) {
    var child = root.firstChild;
    while(child) {
      if(p(child)) {
        rv.push(child);
        if(findOne) {
          return true
        }
      }
      if(goog.dom.findNodes_(child, p, rv, findOne)) {
        return true
      }
      child = child.nextSibling
    }
  }
  return false
};
goog.dom.TAGS_TO_IGNORE_ = {"SCRIPT":1, "STYLE":1, "HEAD":1, "IFRAME":1, "OBJECT":1};
goog.dom.PREDEFINED_TAG_VALUES_ = {"IMG":" ", "BR":"\n"};
goog.dom.isFocusableTabIndex = function(element) {
  var attrNode = element.getAttributeNode("tabindex");
  if(attrNode && attrNode.specified) {
    var index = element.tabIndex;
    return goog.isNumber(index) && index >= 0 && index < 32768
  }
  return false
};
goog.dom.setFocusableTabIndex = function(element, enable) {
  if(enable) {
    element.tabIndex = 0
  }else {
    element.tabIndex = -1;
    element.removeAttribute("tabIndex")
  }
};
goog.dom.getTextContent = function(node) {
  var textContent;
  if(goog.dom.BrowserFeature.CAN_USE_INNER_TEXT && "innerText" in node) {
    textContent = goog.string.canonicalizeNewlines(node.innerText)
  }else {
    var buf = [];
    goog.dom.getTextContent_(node, buf, true);
    textContent = buf.join("")
  }
  textContent = textContent.replace(/ \xAD /g, " ").replace(/\xAD/g, "");
  textContent = textContent.replace(/\u200B/g, "");
  if(!goog.dom.BrowserFeature.CAN_USE_INNER_TEXT) {
    textContent = textContent.replace(/ +/g, " ")
  }
  if(textContent != " ") {
    textContent = textContent.replace(/^\s*/, "")
  }
  return textContent
};
goog.dom.getRawTextContent = function(node) {
  var buf = [];
  goog.dom.getTextContent_(node, buf, false);
  return buf.join("")
};
goog.dom.getTextContent_ = function(node, buf, normalizeWhitespace) {
  if(node.nodeName in goog.dom.TAGS_TO_IGNORE_) {
  }else {
    if(node.nodeType == goog.dom.NodeType.TEXT) {
      if(normalizeWhitespace) {
        buf.push(String(node.nodeValue).replace(/(\r\n|\r|\n)/g, ""))
      }else {
        buf.push(node.nodeValue)
      }
    }else {
      if(node.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
        buf.push(goog.dom.PREDEFINED_TAG_VALUES_[node.nodeName])
      }else {
        var child = node.firstChild;
        while(child) {
          goog.dom.getTextContent_(child, buf, normalizeWhitespace);
          child = child.nextSibling
        }
      }
    }
  }
};
goog.dom.getNodeTextLength = function(node) {
  return goog.dom.getTextContent(node).length
};
goog.dom.getNodeTextOffset = function(node, opt_offsetParent) {
  var root = opt_offsetParent || goog.dom.getOwnerDocument(node).body;
  var buf = [];
  while(node && node != root) {
    var cur = node;
    while(cur = cur.previousSibling) {
      buf.unshift(goog.dom.getTextContent(cur))
    }
    node = node.parentNode
  }
  return goog.string.trimLeft(buf.join("")).replace(/ +/g, " ").length
};
goog.dom.getNodeAtOffset = function(parent, offset, opt_result) {
  var stack = [parent], pos = 0, cur;
  while(stack.length > 0 && pos < offset) {
    cur = stack.pop();
    if(cur.nodeName in goog.dom.TAGS_TO_IGNORE_) {
    }else {
      if(cur.nodeType == goog.dom.NodeType.TEXT) {
        var text = cur.nodeValue.replace(/(\r\n|\r|\n)/g, "").replace(/ +/g, " ");
        pos += text.length
      }else {
        if(cur.nodeName in goog.dom.PREDEFINED_TAG_VALUES_) {
          pos += goog.dom.PREDEFINED_TAG_VALUES_[cur.nodeName].length
        }else {
          for(var i = cur.childNodes.length - 1;i >= 0;i--) {
            stack.push(cur.childNodes[i])
          }
        }
      }
    }
  }
  if(goog.isObject(opt_result)) {
    opt_result.remainder = cur ? cur.nodeValue.length + offset - pos - 1 : 0;
    opt_result.node = cur
  }
  return cur
};
goog.dom.isNodeList = function(val) {
  if(val && typeof val.length == "number") {
    if(goog.isObject(val)) {
      return typeof val.item == "function" || typeof val.item == "string"
    }else {
      if(goog.isFunction(val)) {
        return typeof val.item == "function"
      }
    }
  }
  return false
};
goog.dom.getAncestorByTagNameAndClass = function(element, opt_tag, opt_class) {
  var tagName = opt_tag ? opt_tag.toUpperCase() : null;
  return goog.dom.getAncestor(element, function(node) {
    return(!tagName || node.nodeName == tagName) && (!opt_class || goog.dom.classes.has(node, opt_class))
  }, true)
};
goog.dom.getAncestorByClass = function(element, opt_class) {
  return goog.dom.getAncestorByTagNameAndClass(element, null, opt_class)
};
goog.dom.getAncestor = function(element, matcher, opt_includeNode, opt_maxSearchSteps) {
  if(!opt_includeNode) {
    element = element.parentNode
  }
  var ignoreSearchSteps = opt_maxSearchSteps == null;
  var steps = 0;
  while(element && (ignoreSearchSteps || steps <= opt_maxSearchSteps)) {
    if(matcher(element)) {
      return element
    }
    element = element.parentNode;
    steps++
  }
  return null
};
goog.dom.getActiveElement = function(doc) {
  try {
    return doc && doc.activeElement
  }catch(e) {
  }
  return null
};
goog.dom.DomHelper = function(opt_document) {
  this.document_ = opt_document || goog.global.document || document
};
goog.dom.DomHelper.prototype.getDomHelper = goog.dom.getDomHelper;
goog.dom.DomHelper.prototype.setDocument = function(document) {
  this.document_ = document
};
goog.dom.DomHelper.prototype.getDocument = function() {
  return this.document_
};
goog.dom.DomHelper.prototype.getElement = function(element) {
  if(goog.isString(element)) {
    return this.document_.getElementById(element)
  }else {
    return element
  }
};
goog.dom.DomHelper.prototype.$ = goog.dom.DomHelper.prototype.getElement;
goog.dom.DomHelper.prototype.getElementsByTagNameAndClass = function(opt_tag, opt_class, opt_el) {
  return goog.dom.getElementsByTagNameAndClass_(this.document_, opt_tag, opt_class, opt_el)
};
goog.dom.DomHelper.prototype.getElementsByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementsByClass(className, doc)
};
goog.dom.DomHelper.prototype.getElementByClass = function(className, opt_el) {
  var doc = opt_el || this.document_;
  return goog.dom.getElementByClass(className, doc)
};
goog.dom.DomHelper.prototype.$$ = goog.dom.DomHelper.prototype.getElementsByTagNameAndClass;
goog.dom.DomHelper.prototype.setProperties = goog.dom.setProperties;
goog.dom.DomHelper.prototype.getViewportSize = function(opt_window) {
  return goog.dom.getViewportSize(opt_window || this.getWindow())
};
goog.dom.DomHelper.prototype.getDocumentHeight = function() {
  return goog.dom.getDocumentHeight_(this.getWindow())
};
goog.dom.Appendable;
goog.dom.DomHelper.prototype.createDom = function(tagName, opt_attributes, var_args) {
  return goog.dom.createDom_(this.document_, arguments)
};
goog.dom.DomHelper.prototype.$dom = goog.dom.DomHelper.prototype.createDom;
goog.dom.DomHelper.prototype.createElement = function(name) {
  return this.document_.createElement(name)
};
goog.dom.DomHelper.prototype.createTextNode = function(content) {
  return this.document_.createTextNode(content)
};
goog.dom.DomHelper.prototype.createTable = function(rows, columns, opt_fillWithNbsp) {
  return goog.dom.createTable_(this.document_, rows, columns, !!opt_fillWithNbsp)
};
goog.dom.DomHelper.prototype.htmlToDocumentFragment = function(htmlString) {
  return goog.dom.htmlToDocumentFragment_(this.document_, htmlString)
};
goog.dom.DomHelper.prototype.getCompatMode = function() {
  return this.isCss1CompatMode() ? "CSS1Compat" : "BackCompat"
};
goog.dom.DomHelper.prototype.isCss1CompatMode = function() {
  return goog.dom.isCss1CompatMode_(this.document_)
};
goog.dom.DomHelper.prototype.getWindow = function() {
  return goog.dom.getWindow_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScrollElement = function() {
  return goog.dom.getDocumentScrollElement_(this.document_)
};
goog.dom.DomHelper.prototype.getDocumentScroll = function() {
  return goog.dom.getDocumentScroll_(this.document_)
};
goog.dom.DomHelper.prototype.appendChild = goog.dom.appendChild;
goog.dom.DomHelper.prototype.append = goog.dom.append;
goog.dom.DomHelper.prototype.removeChildren = goog.dom.removeChildren;
goog.dom.DomHelper.prototype.insertSiblingBefore = goog.dom.insertSiblingBefore;
goog.dom.DomHelper.prototype.insertSiblingAfter = goog.dom.insertSiblingAfter;
goog.dom.DomHelper.prototype.removeNode = goog.dom.removeNode;
goog.dom.DomHelper.prototype.replaceNode = goog.dom.replaceNode;
goog.dom.DomHelper.prototype.flattenElement = goog.dom.flattenElement;
goog.dom.DomHelper.prototype.getFirstElementChild = goog.dom.getFirstElementChild;
goog.dom.DomHelper.prototype.getLastElementChild = goog.dom.getLastElementChild;
goog.dom.DomHelper.prototype.getNextElementSibling = goog.dom.getNextElementSibling;
goog.dom.DomHelper.prototype.getPreviousElementSibling = goog.dom.getPreviousElementSibling;
goog.dom.DomHelper.prototype.getNextNode = goog.dom.getNextNode;
goog.dom.DomHelper.prototype.getPreviousNode = goog.dom.getPreviousNode;
goog.dom.DomHelper.prototype.isNodeLike = goog.dom.isNodeLike;
goog.dom.DomHelper.prototype.contains = goog.dom.contains;
goog.dom.DomHelper.prototype.getOwnerDocument = goog.dom.getOwnerDocument;
goog.dom.DomHelper.prototype.getFrameContentDocument = goog.dom.getFrameContentDocument;
goog.dom.DomHelper.prototype.getFrameContentWindow = goog.dom.getFrameContentWindow;
goog.dom.DomHelper.prototype.setTextContent = goog.dom.setTextContent;
goog.dom.DomHelper.prototype.findNode = goog.dom.findNode;
goog.dom.DomHelper.prototype.findNodes = goog.dom.findNodes;
goog.dom.DomHelper.prototype.getTextContent = goog.dom.getTextContent;
goog.dom.DomHelper.prototype.getNodeTextLength = goog.dom.getNodeTextLength;
goog.dom.DomHelper.prototype.getNodeTextOffset = goog.dom.getNodeTextOffset;
goog.dom.DomHelper.prototype.getAncestorByTagNameAndClass = goog.dom.getAncestorByTagNameAndClass;
goog.dom.DomHelper.prototype.getAncestorByClass = goog.dom.getAncestorByClass;
goog.dom.DomHelper.prototype.getAncestor = goog.dom.getAncestor;
goog.provide("goog.json");
goog.provide("goog.json.Serializer");
goog.json.isValid_ = function(s) {
  if(/^\s*$/.test(s)) {
    return false
  }
  var backslashesRe = /\\["\\\/bfnrtu]/g;
  var simpleValuesRe = /"[^"\\\n\r\u2028\u2029\x00-\x08\x10-\x1f\x80-\x9f]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
  var openBracketsRe = /(?:^|:|,)(?:[\s\u2028\u2029]*\[)+/g;
  var remainderRe = /^[\],:{}\s\u2028\u2029]*$/;
  return remainderRe.test(s.replace(backslashesRe, "@").replace(simpleValuesRe, "]").replace(openBracketsRe, ""))
};
goog.json.parse = function(s) {
  var o = String(s);
  if(goog.json.isValid_(o)) {
    try {
      return eval("(" + o + ")")
    }catch(ex) {
    }
  }
  throw Error("Invalid JSON string: " + o);
};
goog.json.unsafeParse = function(s) {
  return eval("(" + s + ")")
};
goog.json.Replacer;
goog.json.serialize = function(object, opt_replacer) {
  return(new goog.json.Serializer(opt_replacer)).serialize(object)
};
goog.json.Serializer = function(opt_replacer) {
  this.replacer_ = opt_replacer
};
goog.json.Serializer.prototype.serialize = function(object) {
  var sb = [];
  this.serialize_(object, sb);
  return sb.join("")
};
goog.json.Serializer.prototype.serialize_ = function(object, sb) {
  switch(typeof object) {
    case "string":
      this.serializeString_(object, sb);
      break;
    case "number":
      this.serializeNumber_(object, sb);
      break;
    case "boolean":
      sb.push(object);
      break;
    case "undefined":
      sb.push("null");
      break;
    case "object":
      if(object == null) {
        sb.push("null");
        break
      }
      if(goog.isArray(object)) {
        this.serializeArray_(object, sb);
        break
      }
      this.serializeObject_(object, sb);
      break;
    case "function":
      break;
    default:
      throw Error("Unknown type: " + typeof object);
  }
};
goog.json.Serializer.charToJsonCharCache_ = {'"':'\\"', "\\":"\\\\", "/":"\\/", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\u000b"};
goog.json.Serializer.charsToReplace_ = /\uffff/.test("\uffff") ? /[\\\"\x00-\x1f\x7f-\uffff]/g : /[\\\"\x00-\x1f\x7f-\xff]/g;
goog.json.Serializer.prototype.serializeString_ = function(s, sb) {
  sb.push('"', s.replace(goog.json.Serializer.charsToReplace_, function(c) {
    if(c in goog.json.Serializer.charToJsonCharCache_) {
      return goog.json.Serializer.charToJsonCharCache_[c]
    }
    var cc = c.charCodeAt(0);
    var rv = "\\u";
    if(cc < 16) {
      rv += "000"
    }else {
      if(cc < 256) {
        rv += "00"
      }else {
        if(cc < 4096) {
          rv += "0"
        }
      }
    }
    return goog.json.Serializer.charToJsonCharCache_[c] = rv + cc.toString(16)
  }), '"')
};
goog.json.Serializer.prototype.serializeNumber_ = function(n, sb) {
  sb.push(isFinite(n) && !isNaN(n) ? n : "null")
};
goog.json.Serializer.prototype.serializeArray_ = function(arr, sb) {
  var l = arr.length;
  sb.push("[");
  var sep = "";
  for(var i = 0;i < l;i++) {
    sb.push(sep);
    var value = arr[i];
    this.serialize_(this.replacer_ ? this.replacer_.call(arr, String(i), value) : value, sb);
    sep = ","
  }
  sb.push("]")
};
goog.json.Serializer.prototype.serializeObject_ = function(obj, sb) {
  sb.push("{");
  var sep = "";
  for(var key in obj) {
    if(Object.prototype.hasOwnProperty.call(obj, key)) {
      var value = obj[key];
      if(typeof value != "function") {
        sb.push(sep);
        this.serializeString_(key, sb);
        sb.push(":");
        this.serialize_(this.replacer_ ? this.replacer_.call(obj, key, value) : value, sb);
        sep = ","
      }
    }
  }
  sb.push("}")
};
goog.provide("goog.structs.Collection");
goog.structs.Collection = function() {
};
goog.structs.Collection.prototype.add;
goog.structs.Collection.prototype.remove;
goog.structs.Collection.prototype.contains;
goog.structs.Collection.prototype.getCount;
goog.provide("goog.structs.Set");
goog.require("goog.structs");
goog.require("goog.structs.Collection");
goog.require("goog.structs.Map");
goog.structs.Set = function(opt_values) {
  this.map_ = new goog.structs.Map;
  if(opt_values) {
    this.addAll(opt_values)
  }
};
goog.structs.Set.getKey_ = function(val) {
  var type = typeof val;
  if(type == "object" && val || type == "function") {
    return"o" + goog.getUid(val)
  }else {
    return type.substr(0, 1) + val
  }
};
goog.structs.Set.prototype.getCount = function() {
  return this.map_.getCount()
};
goog.structs.Set.prototype.add = function(element) {
  this.map_.set(goog.structs.Set.getKey_(element), element)
};
goog.structs.Set.prototype.addAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.add(values[i])
  }
};
goog.structs.Set.prototype.removeAll = function(col) {
  var values = goog.structs.getValues(col);
  var l = values.length;
  for(var i = 0;i < l;i++) {
    this.remove(values[i])
  }
};
goog.structs.Set.prototype.remove = function(element) {
  return this.map_.remove(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.clear = function() {
  this.map_.clear()
};
goog.structs.Set.prototype.isEmpty = function() {
  return this.map_.isEmpty()
};
goog.structs.Set.prototype.contains = function(element) {
  return this.map_.containsKey(goog.structs.Set.getKey_(element))
};
goog.structs.Set.prototype.containsAll = function(col) {
  return goog.structs.every(col, this.contains, this)
};
goog.structs.Set.prototype.intersection = function(col) {
  var result = new goog.structs.Set;
  var values = goog.structs.getValues(col);
  for(var i = 0;i < values.length;i++) {
    var value = values[i];
    if(this.contains(value)) {
      result.add(value)
    }
  }
  return result
};
goog.structs.Set.prototype.getValues = function() {
  return this.map_.getValues()
};
goog.structs.Set.prototype.clone = function() {
  return new goog.structs.Set(this)
};
goog.structs.Set.prototype.equals = function(col) {
  return this.getCount() == goog.structs.getCount(col) && this.isSubsetOf(col)
};
goog.structs.Set.prototype.isSubsetOf = function(col) {
  var colCount = goog.structs.getCount(col);
  if(this.getCount() > colCount) {
    return false
  }
  if(!(col instanceof goog.structs.Set) && colCount > 5) {
    col = new goog.structs.Set(col)
  }
  return goog.structs.every(this, function(value) {
    return goog.structs.contains(col, value)
  })
};
goog.structs.Set.prototype.__iterator__ = function(opt_keys) {
  return this.map_.__iterator__(false)
};
goog.provide("goog.debug");
goog.require("goog.array");
goog.require("goog.string");
goog.require("goog.structs.Set");
goog.require("goog.userAgent");
goog.debug.catchErrors = function(logFunc, opt_cancel, opt_target) {
  var target = opt_target || goog.global;
  var oldErrorHandler = target.onerror;
  var retVal = goog.userAgent.WEBKIT ? !opt_cancel : !!opt_cancel;
  target.onerror = function(message, url, line) {
    if(oldErrorHandler) {
      oldErrorHandler(message, url, line)
    }
    logFunc({message:message, fileName:url, line:line});
    return retVal
  }
};
goog.debug.expose = function(obj, opt_showFn) {
  if(typeof obj == "undefined") {
    return"undefined"
  }
  if(obj == null) {
    return"NULL"
  }
  var str = [];
  for(var x in obj) {
    if(!opt_showFn && goog.isFunction(obj[x])) {
      continue
    }
    var s = x + " = ";
    try {
      s += obj[x]
    }catch(e) {
      s += "*** " + e + " ***"
    }
    str.push(s)
  }
  return str.join("\n")
};
goog.debug.deepExpose = function(obj, opt_showFn) {
  var previous = new goog.structs.Set;
  var str = [];
  var helper = function(obj, space) {
    var nestspace = space + "  ";
    var indentMultiline = function(str) {
      return str.replace(/\n/g, "\n" + space)
    };
    try {
      if(!goog.isDef(obj)) {
        str.push("undefined")
      }else {
        if(goog.isNull(obj)) {
          str.push("NULL")
        }else {
          if(goog.isString(obj)) {
            str.push('"' + indentMultiline(obj) + '"')
          }else {
            if(goog.isFunction(obj)) {
              str.push(indentMultiline(String(obj)))
            }else {
              if(goog.isObject(obj)) {
                if(previous.contains(obj)) {
                  str.push("*** reference loop detected ***")
                }else {
                  previous.add(obj);
                  str.push("{");
                  for(var x in obj) {
                    if(!opt_showFn && goog.isFunction(obj[x])) {
                      continue
                    }
                    str.push("\n");
                    str.push(nestspace);
                    str.push(x + " = ");
                    helper(obj[x], nestspace)
                  }
                  str.push("\n" + space + "}")
                }
              }else {
                str.push(obj)
              }
            }
          }
        }
      }
    }catch(e) {
      str.push("*** " + e + " ***")
    }
  };
  helper(obj, "");
  return str.join("")
};
goog.debug.exposeArray = function(arr) {
  var str = [];
  for(var i = 0;i < arr.length;i++) {
    if(goog.isArray(arr[i])) {
      str.push(goog.debug.exposeArray(arr[i]))
    }else {
      str.push(arr[i])
    }
  }
  return"[ " + str.join(", ") + " ]"
};
goog.debug.exposeException = function(err, opt_fn) {
  try {
    var e = goog.debug.normalizeErrorObject(err);
    var error = "Message: " + goog.string.htmlEscape(e.message) + '\nUrl: <a href="view-source:' + e.fileName + '" target="_new">' + e.fileName + "</a>\nLine: " + e.lineNumber + "\n\nBrowser stack:\n" + goog.string.htmlEscape(e.stack + "-> ") + "[end]\n\nJS stack traversal:\n" + goog.string.htmlEscape(goog.debug.getStacktrace(opt_fn) + "-> ");
    return error
  }catch(e2) {
    return"Exception trying to expose exception! You win, we lose. " + e2
  }
};
goog.debug.normalizeErrorObject = function(err) {
  var href = goog.getObjectByName("window.location.href");
  if(goog.isString(err)) {
    return{"message":err, "name":"Unknown error", "lineNumber":"Not available", "fileName":href, "stack":"Not available"}
  }
  var lineNumber, fileName;
  var threwError = false;
  try {
    lineNumber = err.lineNumber || err.line || "Not available"
  }catch(e) {
    lineNumber = "Not available";
    threwError = true
  }
  try {
    fileName = err.fileName || err.filename || err.sourceURL || href
  }catch(e) {
    fileName = "Not available";
    threwError = true
  }
  if(threwError || !err.lineNumber || !err.fileName || !err.stack) {
    return{"message":err.message, "name":err.name, "lineNumber":lineNumber, "fileName":fileName, "stack":err.stack || "Not available"}
  }
  return err
};
goog.debug.enhanceError = function(err, opt_message) {
  var error = typeof err == "string" ? Error(err) : err;
  if(!error.stack) {
    error.stack = goog.debug.getStacktrace(arguments.callee.caller)
  }
  if(opt_message) {
    var x = 0;
    while(error["message" + x]) {
      ++x
    }
    error["message" + x] = String(opt_message)
  }
  return error
};
goog.debug.getStacktraceSimple = function(opt_depth) {
  var sb = [];
  var fn = arguments.callee.caller;
  var depth = 0;
  while(fn && (!opt_depth || depth < opt_depth)) {
    sb.push(goog.debug.getFunctionName(fn));
    sb.push("()\n");
    try {
      fn = fn.caller
    }catch(e) {
      sb.push("[exception trying to get caller]\n");
      break
    }
    depth++;
    if(depth >= goog.debug.MAX_STACK_DEPTH) {
      sb.push("[...long stack...]");
      break
    }
  }
  if(opt_depth && depth >= opt_depth) {
    sb.push("[...reached max depth limit...]")
  }else {
    sb.push("[end]")
  }
  return sb.join("")
};
goog.debug.MAX_STACK_DEPTH = 50;
goog.debug.getStacktrace = function(opt_fn) {
  return goog.debug.getStacktraceHelper_(opt_fn || arguments.callee.caller, [])
};
goog.debug.getStacktraceHelper_ = function(fn, visited) {
  var sb = [];
  if(goog.array.contains(visited, fn)) {
    sb.push("[...circular reference...]")
  }else {
    if(fn && visited.length < goog.debug.MAX_STACK_DEPTH) {
      sb.push(goog.debug.getFunctionName(fn) + "(");
      var args = fn.arguments;
      for(var i = 0;i < args.length;i++) {
        if(i > 0) {
          sb.push(", ")
        }
        var argDesc;
        var arg = args[i];
        switch(typeof arg) {
          case "object":
            argDesc = arg ? "object" : "null";
            break;
          case "string":
            argDesc = arg;
            break;
          case "number":
            argDesc = String(arg);
            break;
          case "boolean":
            argDesc = arg ? "true" : "false";
            break;
          case "function":
            argDesc = goog.debug.getFunctionName(arg);
            argDesc = argDesc ? argDesc : "[fn]";
            break;
          case "undefined":
          ;
          default:
            argDesc = typeof arg;
            break
        }
        if(argDesc.length > 40) {
          argDesc = argDesc.substr(0, 40) + "..."
        }
        sb.push(argDesc)
      }
      visited.push(fn);
      sb.push(")\n");
      try {
        sb.push(goog.debug.getStacktraceHelper_(fn.caller, visited))
      }catch(e) {
        sb.push("[exception trying to get caller]\n")
      }
    }else {
      if(fn) {
        sb.push("[...long stack...]")
      }else {
        sb.push("[end]")
      }
    }
  }
  return sb.join("")
};
goog.debug.setFunctionResolver = function(resolver) {
  goog.debug.fnNameResolver_ = resolver
};
goog.debug.getFunctionName = function(fn) {
  if(goog.debug.fnNameCache_[fn]) {
    return goog.debug.fnNameCache_[fn]
  }
  if(goog.debug.fnNameResolver_) {
    var name = goog.debug.fnNameResolver_(fn);
    if(name) {
      goog.debug.fnNameCache_[fn] = name;
      return name
    }
  }
  var functionSource = String(fn);
  if(!goog.debug.fnNameCache_[functionSource]) {
    var matches = /function ([^\(]+)/.exec(functionSource);
    if(matches) {
      var method = matches[1];
      goog.debug.fnNameCache_[functionSource] = method
    }else {
      goog.debug.fnNameCache_[functionSource] = "[Anonymous]"
    }
  }
  return goog.debug.fnNameCache_[functionSource]
};
goog.debug.makeWhitespaceVisible = function(string) {
  return string.replace(/ /g, "[_]").replace(/\f/g, "[f]").replace(/\n/g, "[n]\n").replace(/\r/g, "[r]").replace(/\t/g, "[t]")
};
goog.debug.fnNameCache_ = {};
goog.debug.fnNameResolver_;
goog.provide("goog.debug.LogRecord");
goog.debug.LogRecord = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  this.reset(level, msg, loggerName, opt_time, opt_sequenceNumber)
};
goog.debug.LogRecord.prototype.time_;
goog.debug.LogRecord.prototype.level_;
goog.debug.LogRecord.prototype.msg_;
goog.debug.LogRecord.prototype.loggerName_;
goog.debug.LogRecord.prototype.sequenceNumber_ = 0;
goog.debug.LogRecord.prototype.exception_ = null;
goog.debug.LogRecord.prototype.exceptionText_ = null;
goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS = true;
goog.debug.LogRecord.nextSequenceNumber_ = 0;
goog.debug.LogRecord.prototype.reset = function(level, msg, loggerName, opt_time, opt_sequenceNumber) {
  if(goog.debug.LogRecord.ENABLE_SEQUENCE_NUMBERS) {
    this.sequenceNumber_ = typeof opt_sequenceNumber == "number" ? opt_sequenceNumber : goog.debug.LogRecord.nextSequenceNumber_++
  }
  this.time_ = opt_time || goog.now();
  this.level_ = level;
  this.msg_ = msg;
  this.loggerName_ = loggerName;
  delete this.exception_;
  delete this.exceptionText_
};
goog.debug.LogRecord.prototype.getLoggerName = function() {
  return this.loggerName_
};
goog.debug.LogRecord.prototype.getException = function() {
  return this.exception_
};
goog.debug.LogRecord.prototype.setException = function(exception) {
  this.exception_ = exception
};
goog.debug.LogRecord.prototype.getExceptionText = function() {
  return this.exceptionText_
};
goog.debug.LogRecord.prototype.setExceptionText = function(text) {
  this.exceptionText_ = text
};
goog.debug.LogRecord.prototype.setLoggerName = function(loggerName) {
  this.loggerName_ = loggerName
};
goog.debug.LogRecord.prototype.getLevel = function() {
  return this.level_
};
goog.debug.LogRecord.prototype.setLevel = function(level) {
  this.level_ = level
};
goog.debug.LogRecord.prototype.getMessage = function() {
  return this.msg_
};
goog.debug.LogRecord.prototype.setMessage = function(msg) {
  this.msg_ = msg
};
goog.debug.LogRecord.prototype.getMillis = function() {
  return this.time_
};
goog.debug.LogRecord.prototype.setMillis = function(time) {
  this.time_ = time
};
goog.debug.LogRecord.prototype.getSequenceNumber = function() {
  return this.sequenceNumber_
};
goog.provide("goog.debug.LogBuffer");
goog.require("goog.asserts");
goog.require("goog.debug.LogRecord");
goog.debug.LogBuffer = function() {
  goog.asserts.assert(goog.debug.LogBuffer.isBufferingEnabled(), "Cannot use goog.debug.LogBuffer without defining " + "goog.debug.LogBuffer.CAPACITY.");
  this.clear()
};
goog.debug.LogBuffer.getInstance = function() {
  if(!goog.debug.LogBuffer.instance_) {
    goog.debug.LogBuffer.instance_ = new goog.debug.LogBuffer
  }
  return goog.debug.LogBuffer.instance_
};
goog.debug.LogBuffer.CAPACITY = 0;
goog.debug.LogBuffer.prototype.buffer_;
goog.debug.LogBuffer.prototype.curIndex_;
goog.debug.LogBuffer.prototype.isFull_;
goog.debug.LogBuffer.prototype.addRecord = function(level, msg, loggerName) {
  var curIndex = (this.curIndex_ + 1) % goog.debug.LogBuffer.CAPACITY;
  this.curIndex_ = curIndex;
  if(this.isFull_) {
    var ret = this.buffer_[curIndex];
    ret.reset(level, msg, loggerName);
    return ret
  }
  this.isFull_ = curIndex == goog.debug.LogBuffer.CAPACITY - 1;
  return this.buffer_[curIndex] = new goog.debug.LogRecord(level, msg, loggerName)
};
goog.debug.LogBuffer.isBufferingEnabled = function() {
  return goog.debug.LogBuffer.CAPACITY > 0
};
goog.debug.LogBuffer.prototype.clear = function() {
  this.buffer_ = new Array(goog.debug.LogBuffer.CAPACITY);
  this.curIndex_ = -1;
  this.isFull_ = false
};
goog.debug.LogBuffer.prototype.forEachRecord = function(func) {
  var buffer = this.buffer_;
  if(!buffer[0]) {
    return
  }
  var curIndex = this.curIndex_;
  var i = this.isFull_ ? curIndex : -1;
  do {
    i = (i + 1) % goog.debug.LogBuffer.CAPACITY;
    func(buffer[i])
  }while(i != curIndex)
};
goog.provide("goog.debug.LogManager");
goog.provide("goog.debug.Logger");
goog.provide("goog.debug.Logger.Level");
goog.require("goog.array");
goog.require("goog.asserts");
goog.require("goog.debug");
goog.require("goog.debug.LogBuffer");
goog.require("goog.debug.LogRecord");
goog.debug.Logger = function(name) {
  this.name_ = name
};
goog.debug.Logger.prototype.parent_ = null;
goog.debug.Logger.prototype.level_ = null;
goog.debug.Logger.prototype.children_ = null;
goog.debug.Logger.prototype.handlers_ = null;
goog.debug.Logger.ENABLE_HIERARCHY = true;
if(!goog.debug.Logger.ENABLE_HIERARCHY) {
  goog.debug.Logger.rootHandlers_ = [];
  goog.debug.Logger.rootLevel_
}
goog.debug.Logger.Level = function(name, value) {
  this.name = name;
  this.value = value
};
goog.debug.Logger.Level.prototype.toString = function() {
  return this.name
};
goog.debug.Logger.Level.OFF = new goog.debug.Logger.Level("OFF", Infinity);
goog.debug.Logger.Level.SHOUT = new goog.debug.Logger.Level("SHOUT", 1200);
goog.debug.Logger.Level.SEVERE = new goog.debug.Logger.Level("SEVERE", 1E3);
goog.debug.Logger.Level.WARNING = new goog.debug.Logger.Level("WARNING", 900);
goog.debug.Logger.Level.INFO = new goog.debug.Logger.Level("INFO", 800);
goog.debug.Logger.Level.CONFIG = new goog.debug.Logger.Level("CONFIG", 700);
goog.debug.Logger.Level.FINE = new goog.debug.Logger.Level("FINE", 500);
goog.debug.Logger.Level.FINER = new goog.debug.Logger.Level("FINER", 400);
goog.debug.Logger.Level.FINEST = new goog.debug.Logger.Level("FINEST", 300);
goog.debug.Logger.Level.ALL = new goog.debug.Logger.Level("ALL", 0);
goog.debug.Logger.Level.PREDEFINED_LEVELS = [goog.debug.Logger.Level.OFF, goog.debug.Logger.Level.SHOUT, goog.debug.Logger.Level.SEVERE, goog.debug.Logger.Level.WARNING, goog.debug.Logger.Level.INFO, goog.debug.Logger.Level.CONFIG, goog.debug.Logger.Level.FINE, goog.debug.Logger.Level.FINER, goog.debug.Logger.Level.FINEST, goog.debug.Logger.Level.ALL];
goog.debug.Logger.Level.predefinedLevelsCache_ = null;
goog.debug.Logger.Level.createPredefinedLevelsCache_ = function() {
  goog.debug.Logger.Level.predefinedLevelsCache_ = {};
  for(var i = 0, level;level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];i++) {
    goog.debug.Logger.Level.predefinedLevelsCache_[level.value] = level;
    goog.debug.Logger.Level.predefinedLevelsCache_[level.name] = level
  }
};
goog.debug.Logger.Level.getPredefinedLevel = function(name) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  return goog.debug.Logger.Level.predefinedLevelsCache_[name] || null
};
goog.debug.Logger.Level.getPredefinedLevelByValue = function(value) {
  if(!goog.debug.Logger.Level.predefinedLevelsCache_) {
    goog.debug.Logger.Level.createPredefinedLevelsCache_()
  }
  if(value in goog.debug.Logger.Level.predefinedLevelsCache_) {
    return goog.debug.Logger.Level.predefinedLevelsCache_[value]
  }
  for(var i = 0;i < goog.debug.Logger.Level.PREDEFINED_LEVELS.length;++i) {
    var level = goog.debug.Logger.Level.PREDEFINED_LEVELS[i];
    if(level.value <= value) {
      return level
    }
  }
  return null
};
goog.debug.Logger.getLogger = function(name) {
  return goog.debug.LogManager.getLogger(name)
};
goog.debug.Logger.logToProfilers = function(msg) {
  if(goog.global["console"]) {
    if(goog.global["console"]["timeStamp"]) {
      goog.global["console"]["timeStamp"](msg)
    }else {
      if(goog.global["console"]["markTimeline"]) {
        goog.global["console"]["markTimeline"](msg)
      }
    }
  }
  if(goog.global["msWriteProfilerMark"]) {
    goog.global["msWriteProfilerMark"](msg)
  }
};
goog.debug.Logger.prototype.getName = function() {
  return this.name_
};
goog.debug.Logger.prototype.addHandler = function(handler) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    if(!this.handlers_) {
      this.handlers_ = []
    }
    this.handlers_.push(handler)
  }else {
    goog.asserts.assert(!this.name_, "Cannot call addHandler on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootHandlers_.push(handler)
  }
};
goog.debug.Logger.prototype.removeHandler = function(handler) {
  var handlers = goog.debug.Logger.ENABLE_HIERARCHY ? this.handlers_ : goog.debug.Logger.rootHandlers_;
  return!!handlers && goog.array.remove(handlers, handler)
};
goog.debug.Logger.prototype.getParent = function() {
  return this.parent_
};
goog.debug.Logger.prototype.getChildren = function() {
  if(!this.children_) {
    this.children_ = {}
  }
  return this.children_
};
goog.debug.Logger.prototype.setLevel = function(level) {
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    this.level_ = level
  }else {
    goog.asserts.assert(!this.name_, "Cannot call setLevel() on a non-root logger when " + "goog.debug.Logger.ENABLE_HIERARCHY is false.");
    goog.debug.Logger.rootLevel_ = level
  }
};
goog.debug.Logger.prototype.getLevel = function() {
  return this.level_
};
goog.debug.Logger.prototype.getEffectiveLevel = function() {
  if(!goog.debug.Logger.ENABLE_HIERARCHY) {
    return goog.debug.Logger.rootLevel_
  }
  if(this.level_) {
    return this.level_
  }
  if(this.parent_) {
    return this.parent_.getEffectiveLevel()
  }
  goog.asserts.fail("Root logger has no level set.");
  return null
};
goog.debug.Logger.prototype.isLoggable = function(level) {
  return level.value >= this.getEffectiveLevel().value
};
goog.debug.Logger.prototype.log = function(level, msg, opt_exception) {
  if(this.isLoggable(level)) {
    this.doLogRecord_(this.getLogRecord(level, msg, opt_exception))
  }
};
goog.debug.Logger.prototype.getLogRecord = function(level, msg, opt_exception) {
  if(goog.debug.LogBuffer.isBufferingEnabled()) {
    var logRecord = goog.debug.LogBuffer.getInstance().addRecord(level, msg, this.name_)
  }else {
    logRecord = new goog.debug.LogRecord(level, String(msg), this.name_)
  }
  if(opt_exception) {
    logRecord.setException(opt_exception);
    logRecord.setExceptionText(goog.debug.exposeException(opt_exception, arguments.callee.caller))
  }
  return logRecord
};
goog.debug.Logger.prototype.shout = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SHOUT, msg, opt_exception)
};
goog.debug.Logger.prototype.severe = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.SEVERE, msg, opt_exception)
};
goog.debug.Logger.prototype.warning = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.WARNING, msg, opt_exception)
};
goog.debug.Logger.prototype.info = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.INFO, msg, opt_exception)
};
goog.debug.Logger.prototype.config = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.CONFIG, msg, opt_exception)
};
goog.debug.Logger.prototype.fine = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINE, msg, opt_exception)
};
goog.debug.Logger.prototype.finer = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINER, msg, opt_exception)
};
goog.debug.Logger.prototype.finest = function(msg, opt_exception) {
  this.log(goog.debug.Logger.Level.FINEST, msg, opt_exception)
};
goog.debug.Logger.prototype.logRecord = function(logRecord) {
  if(this.isLoggable(logRecord.getLevel())) {
    this.doLogRecord_(logRecord)
  }
};
goog.debug.Logger.prototype.doLogRecord_ = function(logRecord) {
  goog.debug.Logger.logToProfilers("log:" + logRecord.getMessage());
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var target = this;
    while(target) {
      target.callPublish_(logRecord);
      target = target.getParent()
    }
  }else {
    for(var i = 0, handler;handler = goog.debug.Logger.rootHandlers_[i++];) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.callPublish_ = function(logRecord) {
  if(this.handlers_) {
    for(var i = 0, handler;handler = this.handlers_[i];i++) {
      handler(logRecord)
    }
  }
};
goog.debug.Logger.prototype.setParent_ = function(parent) {
  this.parent_ = parent
};
goog.debug.Logger.prototype.addChild_ = function(name, logger) {
  this.getChildren()[name] = logger
};
goog.debug.LogManager = {};
goog.debug.LogManager.loggers_ = {};
goog.debug.LogManager.rootLogger_ = null;
goog.debug.LogManager.initialize = function() {
  if(!goog.debug.LogManager.rootLogger_) {
    goog.debug.LogManager.rootLogger_ = new goog.debug.Logger("");
    goog.debug.LogManager.loggers_[""] = goog.debug.LogManager.rootLogger_;
    goog.debug.LogManager.rootLogger_.setLevel(goog.debug.Logger.Level.CONFIG)
  }
};
goog.debug.LogManager.getLoggers = function() {
  return goog.debug.LogManager.loggers_
};
goog.debug.LogManager.getRoot = function() {
  goog.debug.LogManager.initialize();
  return goog.debug.LogManager.rootLogger_
};
goog.debug.LogManager.getLogger = function(name) {
  goog.debug.LogManager.initialize();
  var ret = goog.debug.LogManager.loggers_[name];
  return ret || goog.debug.LogManager.createLogger_(name)
};
goog.debug.LogManager.createFunctionForCatchErrors = function(opt_logger) {
  return function(info) {
    var logger = opt_logger || goog.debug.LogManager.getRoot();
    logger.severe("Error: " + info.message + " (" + info.fileName + " @ Line: " + info.line + ")")
  }
};
goog.debug.LogManager.createLogger_ = function(name) {
  var logger = new goog.debug.Logger(name);
  if(goog.debug.Logger.ENABLE_HIERARCHY) {
    var lastDotIndex = name.lastIndexOf(".");
    var parentName = name.substr(0, lastDotIndex);
    var leafName = name.substr(lastDotIndex + 1);
    var parentLogger = goog.debug.LogManager.getLogger(parentName);
    parentLogger.addChild_(leafName, logger);
    logger.setParent_(parentLogger)
  }
  goog.debug.LogManager.loggers_[name] = logger;
  return logger
};
goog.provide("goog.messaging.MessageChannel");
goog.messaging.MessageChannel = function() {
};
goog.messaging.MessageChannel.prototype.connect = function(opt_connectCb) {
};
goog.messaging.MessageChannel.prototype.isConnected = function() {
};
goog.messaging.MessageChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
};
goog.messaging.MessageChannel.prototype.registerDefaultService = function(callback) {
};
goog.messaging.MessageChannel.prototype.send = function(serviceName, payload) {
};
goog.provide("goog.messaging.AbstractChannel");
goog.require("goog.Disposable");
goog.require("goog.debug");
goog.require("goog.debug.Logger");
goog.require("goog.json");
goog.require("goog.messaging.MessageChannel");
goog.messaging.AbstractChannel = function() {
  goog.base(this);
  this.services_ = {}
};
goog.inherits(goog.messaging.AbstractChannel, goog.Disposable);
goog.messaging.AbstractChannel.prototype.defaultService_;
goog.messaging.AbstractChannel.prototype.logger = goog.debug.Logger.getLogger("goog.messaging.AbstractChannel");
goog.messaging.AbstractChannel.prototype.connect = function(opt_connectCb) {
  if(opt_connectCb) {
    opt_connectCb()
  }
};
goog.messaging.AbstractChannel.prototype.isConnected = function() {
  return true
};
goog.messaging.AbstractChannel.prototype.registerService = function(serviceName, callback, opt_objectPayload) {
  this.services_[serviceName] = {callback:callback, objectPayload:!!opt_objectPayload}
};
goog.messaging.AbstractChannel.prototype.registerDefaultService = function(callback) {
  this.defaultService_ = callback
};
goog.messaging.AbstractChannel.prototype.send = goog.abstractMethod;
goog.messaging.AbstractChannel.prototype.deliver = function(serviceName, payload) {
  var service = this.getService(serviceName, payload);
  if(!service) {
    return
  }
  var decodedPayload = this.decodePayload(serviceName, payload, service.objectPayload);
  if(goog.isDefAndNotNull(decodedPayload)) {
    service.callback(decodedPayload)
  }
};
goog.messaging.AbstractChannel.prototype.getService = function(serviceName, payload) {
  var service = this.services_[serviceName];
  if(service) {
    return service
  }else {
    if(this.defaultService_) {
      var callback = goog.partial(this.defaultService_, serviceName);
      var objectPayload = goog.isObject(payload);
      return{callback:callback, objectPayload:objectPayload}
    }
  }
  this.logger.warning('Unknown service name "' + serviceName + '"');
  return null
};
goog.messaging.AbstractChannel.prototype.decodePayload = function(serviceName, payload, objectPayload) {
  if(objectPayload && goog.isString(payload)) {
    try {
      return goog.json.parse(payload)
    }catch(err) {
      this.logger.warning("Expected JSON payload for " + serviceName + ', was "' + payload + '"');
      return null
    }
  }else {
    if(!objectPayload && !goog.isString(payload)) {
      return goog.json.serialize(payload)
    }
  }
  return payload
};
goog.messaging.AbstractChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  goog.dispose(this.logger);
  delete this.logger;
  delete this.services_;
  delete this.defaultService_
};
goog.provide("goog.net.xpc");
goog.provide("goog.net.xpc.CfgFields");
goog.provide("goog.net.xpc.ChannelStates");
goog.provide("goog.net.xpc.TransportNames");
goog.provide("goog.net.xpc.TransportTypes");
goog.provide("goog.net.xpc.UriCfgFields");
goog.require("goog.debug.Logger");
goog.net.xpc.TransportTypes = {NATIVE_MESSAGING:1, FRAME_ELEMENT_METHOD:2, IFRAME_RELAY:3, IFRAME_POLLING:4, FLASH:5, NIX:6};
goog.net.xpc.TransportNames = {1:"NativeMessagingTransport", 2:"FrameElementMethodTransport", 3:"IframeRelayTransport", 4:"IframePollingTransport", 5:"FlashTransport", 6:"NixTransport"};
goog.net.xpc.CfgFields = {CHANNEL_NAME:"cn", AUTH_TOKEN:"at", REMOTE_AUTH_TOKEN:"rat", PEER_URI:"pu", IFRAME_ID:"ifrid", TRANSPORT:"tp", LOCAL_RELAY_URI:"lru", PEER_RELAY_URI:"pru", LOCAL_POLL_URI:"lpu", PEER_POLL_URI:"ppu", PEER_HOSTNAME:"ph"};
goog.net.xpc.UriCfgFields = [goog.net.xpc.CfgFields.PEER_URI, goog.net.xpc.CfgFields.LOCAL_RELAY_URI, goog.net.xpc.CfgFields.PEER_RELAY_URI, goog.net.xpc.CfgFields.LOCAL_POLL_URI, goog.net.xpc.CfgFields.PEER_POLL_URI];
goog.net.xpc.ChannelStates = {NOT_CONNECTED:1, CONNECTED:2, CLOSED:3};
goog.net.xpc.TRANSPORT_SERVICE_ = "tp";
goog.net.xpc.SETUP = "SETUP";
goog.net.xpc.SETUP_ACK_ = "SETUP_ACK";
goog.net.xpc.channels_ = {};
goog.net.xpc.getRandomString = function(length, opt_characters) {
  var chars = opt_characters || goog.net.xpc.randomStringCharacters_;
  var charsLength = chars.length;
  var s = "";
  while(length-- > 0) {
    s += chars.charAt(Math.floor(Math.random() * charsLength))
  }
  return s
};
goog.net.xpc.randomStringCharacters_ = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
goog.net.xpc.logger = goog.debug.Logger.getLogger("goog.net.xpc");
goog.provide("goog.net.xpc.CrossPageChannelRole");
goog.net.xpc.CrossPageChannelRole = {OUTER:0, INNER:1};
goog.provide("goog.net.xpc.Transport");
goog.require("goog.Disposable");
goog.require("goog.dom");
goog.require("goog.net.xpc");
goog.net.xpc.Transport = function(opt_domHelper) {
  goog.Disposable.call(this);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper()
};
goog.inherits(goog.net.xpc.Transport, goog.Disposable);
goog.net.xpc.Transport.prototype.transportType = 0;
goog.net.xpc.Transport.prototype.getType = function() {
  return this.transportType
};
goog.net.xpc.Transport.prototype.getWindow = function() {
  return this.domHelper_.getWindow()
};
goog.net.xpc.Transport.prototype.getName = function() {
  return goog.net.xpc.TransportNames[this.transportType] || ""
};
goog.net.xpc.Transport.prototype.transportServiceHandler = goog.abstractMethod;
goog.net.xpc.Transport.prototype.connect = goog.abstractMethod;
goog.net.xpc.Transport.prototype.send = goog.abstractMethod;
goog.provide("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.CrossPageChannelRole");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.FrameElementMethodTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.queue_ = [];
  this.deliverQueuedCb_ = goog.bind(this.deliverQueued_, this)
};
goog.inherits(goog.net.xpc.FrameElementMethodTransport, goog.net.xpc.Transport);
goog.net.xpc.FrameElementMethodTransport.prototype.transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD;
goog.net.xpc.FrameElementMethodTransport.prototype.recursive_ = false;
goog.net.xpc.FrameElementMethodTransport.prototype.timer_ = 0;
goog.net.xpc.FrameElementMethodTransport.outgoing_ = null;
goog.net.xpc.FrameElementMethodTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannelRole.OUTER) {
    this.iframeElm_ = this.channel_.iframeElement_;
    this.iframeElm_["XPC_toOuter"] = goog.bind(this.incoming_, this)
  }else {
    this.attemptSetup_()
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.attemptSetup_ = function() {
  var retry = true;
  try {
    if(!this.iframeElm_) {
      this.iframeElm_ = this.getWindow().frameElement
    }
    if(this.iframeElm_ && this.iframeElm_["XPC_toOuter"]) {
      this.outgoing_ = this.iframeElm_["XPC_toOuter"];
      this.iframeElm_["XPC_toOuter"]["XPC_toInner"] = goog.bind(this.incoming_, this);
      retry = false;
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(retry) {
    if(!this.attemptSetupCb_) {
      this.attemptSetupCb_ = goog.bind(this.attemptSetup_, this)
    }
    this.getWindow().setTimeout(this.attemptSetupCb_, 100)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.transportServiceHandler = function(payload) {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannelRole.OUTER && !this.channel_.isConnected() && payload == goog.net.xpc.SETUP_ACK_) {
    this.outgoing_ = this.iframeElm_["XPC_toOuter"]["XPC_toInner"];
    this.channel_.notifyConnected_()
  }else {
    throw Error("Got unexpected transport message.");
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.incoming_ = function(serviceName, payload) {
  if(!this.recursive_ && this.queue_.length == 0) {
    this.channel_.deliver_(serviceName, payload)
  }else {
    this.queue_.push({serviceName:serviceName, payload:payload});
    if(this.queue_.length == 1) {
      this.timer_ = this.getWindow().setTimeout(this.deliverQueuedCb_, 1)
    }
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.deliverQueued_ = function() {
  while(this.queue_.length) {
    var msg = this.queue_.shift();
    this.channel_.deliver_(msg.serviceName, msg.payload)
  }
};
goog.net.xpc.FrameElementMethodTransport.prototype.send = function(service, payload) {
  this.recursive_ = true;
  this.outgoing_(service, payload);
  this.recursive_ = false
};
goog.net.xpc.FrameElementMethodTransport.prototype.disposeInternal = function() {
  goog.net.xpc.FrameElementMethodTransport.superClass_.disposeInternal.call(this);
  this.outgoing_ = null;
  this.iframeElm_ = null
};
goog.provide("goog.net.xpc.IframePollingTransport");
goog.provide("goog.net.xpc.IframePollingTransport.Receiver");
goog.provide("goog.net.xpc.IframePollingTransport.Sender");
goog.require("goog.array");
goog.require("goog.dom");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.CrossPageChannelRole");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframePollingTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.sendUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI];
  this.rcvUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI];
  this.sendQueue_ = []
};
goog.inherits(goog.net.xpc.IframePollingTransport, goog.net.xpc.Transport);
goog.net.xpc.IframePollingTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING;
goog.net.xpc.IframePollingTransport.prototype.sequence_ = 0;
goog.net.xpc.IframePollingTransport.prototype.waitForAck_ = false;
goog.net.xpc.IframePollingTransport.prototype.initialized_ = false;
goog.net.xpc.IframePollingTransport.IFRAME_PREFIX = "googlexpc";
goog.net.xpc.IframePollingTransport.prototype.getMsgFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_msg"
};
goog.net.xpc.IframePollingTransport.prototype.getAckFrameName_ = function() {
  return goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_" + this.channel_.name + "_ack"
};
goog.net.xpc.IframePollingTransport.prototype.connect = function() {
  if(this.isDisposed()) {
    return
  }
  goog.net.xpc.logger.fine("transport connect called");
  if(!this.initialized_) {
    goog.net.xpc.logger.fine("initializing...");
    this.constructSenderFrames_();
    this.initialized_ = true
  }
  this.checkForeignFramesReady_()
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrames_ = function() {
  var name = this.getMsgFrameName_();
  this.msgIframeElm_ = this.constructSenderFrame_(name);
  this.msgWinObj_ = this.getWindow().frames[name];
  name = this.getAckFrameName_();
  this.ackIframeElm_ = this.constructSenderFrame_(name);
  this.ackWinObj_ = this.getWindow().frames[name]
};
goog.net.xpc.IframePollingTransport.prototype.constructSenderFrame_ = function(id) {
  goog.net.xpc.logger.finest("constructing sender frame: " + id);
  var ifr = goog.dom.createElement("iframe");
  var s = ifr.style;
  s.position = "absolute";
  s.top = "-10px";
  s.left = "10px";
  s.width = "1px";
  s.height = "1px";
  ifr.id = ifr.name = id;
  ifr.src = this.sendUri_ + "#INITIAL";
  this.getWindow().document.body.appendChild(ifr);
  return ifr
};
goog.net.xpc.IframePollingTransport.prototype.innerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("innerPeerReconnect called");
  this.channel_.name = goog.net.xpc.getRandomString(10);
  goog.net.xpc.logger.finest("switching channels: " + this.channel_.name);
  this.deconstructSenderFrames_();
  this.initialized_ = false;
  this.reconnectFrame_ = this.constructSenderFrame_(goog.net.xpc.IframePollingTransport.IFRAME_PREFIX + "_reconnect_" + this.channel_.name)
};
goog.net.xpc.IframePollingTransport.prototype.outerPeerReconnect_ = function() {
  goog.net.xpc.logger.finest("outerPeerReconnect called");
  var frames = this.channel_.peerWindowObject_.frames;
  var length = frames.length;
  for(var i = 0;i < length;i++) {
    var frameName;
    try {
      if(frames[i] && frames[i].name) {
        frameName = frames[i].name
      }
    }catch(e) {
    }
    if(!frameName) {
      continue
    }
    var message = frameName.split("_");
    if(message.length == 3 && message[0] == goog.net.xpc.IframePollingTransport.IFRAME_PREFIX && message[1] == "reconnect") {
      this.channel_.name = message[2];
      this.deconstructSenderFrames_();
      this.initialized_ = false;
      break
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.deconstructSenderFrames_ = function() {
  goog.net.xpc.logger.finest("deconstructSenderFrames called");
  if(this.msgIframeElm_) {
    this.msgIframeElm_.parentNode.removeChild(this.msgIframeElm_);
    this.msgIframeElm_ = null;
    this.msgWinObj_ = null
  }
  if(this.ackIframeElm_) {
    this.ackIframeElm_.parentNode.removeChild(this.ackIframeElm_);
    this.ackIframeElm_ = null;
    this.ackWinObj_ = null
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkForeignFramesReady_ = function() {
  if(!(this.isRcvFrameReady_(this.getMsgFrameName_()) && this.isRcvFrameReady_(this.getAckFrameName_()))) {
    goog.net.xpc.logger.finest("foreign frames not (yet) present");
    if(this.channel_.getRole() == goog.net.xpc.CrossPageChannelRole.INNER && !this.reconnectFrame_) {
      this.innerPeerReconnect_()
    }else {
      if(this.channel_.getRole() == goog.net.xpc.CrossPageChannelRole.OUTER) {
        this.outerPeerReconnect_()
      }
    }
    this.getWindow().setTimeout(goog.bind(this.connect, this), 100)
  }else {
    goog.net.xpc.logger.fine("foreign frames present");
    this.msgReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getMsgFrameName_()], goog.bind(this.processIncomingMsg, this));
    this.ackReceiver_ = new goog.net.xpc.IframePollingTransport.Receiver(this, this.channel_.peerWindowObject_.frames[this.getAckFrameName_()], goog.bind(this.processIncomingAck, this));
    this.checkLocalFramesPresent_()
  }
};
goog.net.xpc.IframePollingTransport.prototype.isRcvFrameReady_ = function(frameName) {
  goog.net.xpc.logger.finest("checking for receive frame: " + frameName);
  try {
    var winObj = this.channel_.peerWindowObject_.frames[frameName];
    if(!winObj || winObj.location.href.indexOf(this.rcvUri_) != 0) {
      return false
    }
  }catch(e) {
    return false
  }
  return true
};
goog.net.xpc.IframePollingTransport.prototype.checkLocalFramesPresent_ = function() {
  var frames = this.channel_.peerWindowObject_.frames;
  if(!(frames[this.getAckFrameName_()] && frames[this.getMsgFrameName_()])) {
    if(!this.checkLocalFramesPresentCb_) {
      this.checkLocalFramesPresentCb_ = goog.bind(this.checkLocalFramesPresent_, this)
    }
    this.getWindow().setTimeout(this.checkLocalFramesPresentCb_, 100);
    goog.net.xpc.logger.fine("local frames not (yet) present")
  }else {
    this.msgSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.msgWinObj_);
    this.ackSender_ = new goog.net.xpc.IframePollingTransport.Sender(this.sendUri_, this.ackWinObj_);
    goog.net.xpc.logger.fine("local frames ready");
    this.getWindow().setTimeout(goog.bind(function() {
      this.msgSender_.send(goog.net.xpc.SETUP);
      this.sentConnectionSetup_ = true;
      this.waitForAck_ = true;
      goog.net.xpc.logger.fine("SETUP sent")
    }, this), 100)
  }
};
goog.net.xpc.IframePollingTransport.prototype.checkIfConnected_ = function() {
  if(this.sentConnectionSetupAck_ && this.rcvdConnectionSetupAck_) {
    this.channel_.notifyConnected_();
    if(this.deliveryQueue_) {
      goog.net.xpc.logger.fine("delivering queued messages " + "(" + this.deliveryQueue_.length + ")");
      for(var i = 0, m;i < this.deliveryQueue_.length;i++) {
        m = this.deliveryQueue_[i];
        this.channel_.deliver_(m.service, m.payload)
      }
      delete this.deliveryQueue_
    }
  }else {
    goog.net.xpc.logger.finest("checking if connected: " + "ack sent:" + this.sentConnectionSetupAck_ + ", ack rcvd: " + this.rcvdConnectionSetupAck_)
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingMsg = function(raw) {
  goog.net.xpc.logger.finest("msg received: " + raw);
  if(raw == goog.net.xpc.SETUP) {
    if(!this.ackSender_) {
      return
    }
    this.ackSender_.send(goog.net.xpc.SETUP_ACK_);
    goog.net.xpc.logger.finest("SETUP_ACK sent");
    this.sentConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected() || this.sentConnectionSetupAck_) {
      var pos = raw.indexOf("|");
      var head = raw.substring(0, pos);
      var frame = raw.substring(pos + 1);
      pos = head.indexOf(",");
      if(pos == -1) {
        var seq = head;
        this.ackSender_.send("ACK:" + seq);
        this.deliverPayload_(frame)
      }else {
        var seq = head.substring(0, pos);
        this.ackSender_.send("ACK:" + seq);
        var partInfo = head.substring(pos + 1).split("/");
        var part0 = parseInt(partInfo[0], 10);
        var part1 = parseInt(partInfo[1], 10);
        if(part0 == 1) {
          this.parts_ = []
        }
        this.parts_.push(frame);
        if(part0 == part1) {
          this.deliverPayload_(this.parts_.join(""));
          delete this.parts_
        }
      }
    }else {
      goog.net.xpc.logger.warning("received msg, but channel is not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.processIncomingAck = function(msgStr) {
  goog.net.xpc.logger.finest("ack received: " + msgStr);
  if(msgStr == goog.net.xpc.SETUP_ACK_) {
    this.waitForAck_ = false;
    this.rcvdConnectionSetupAck_ = true;
    this.checkIfConnected_()
  }else {
    if(this.channel_.isConnected()) {
      if(!this.waitForAck_) {
        goog.net.xpc.logger.warning("got unexpected ack");
        return
      }
      var seq = parseInt(msgStr.split(":")[1], 10);
      if(seq == this.sequence_) {
        this.waitForAck_ = false;
        this.sendNextFrame_()
      }else {
        goog.net.xpc.logger.warning("got ack with wrong sequence")
      }
    }else {
      goog.net.xpc.logger.warning("received ack, but channel not connected")
    }
  }
};
goog.net.xpc.IframePollingTransport.prototype.sendNextFrame_ = function() {
  if(this.waitForAck_ || !this.sendQueue_.length) {
    return
  }
  var s = this.sendQueue_.shift();
  ++this.sequence_;
  this.msgSender_.send(this.sequence_ + s);
  goog.net.xpc.logger.finest("msg sent: " + this.sequence_ + s);
  this.waitForAck_ = true
};
goog.net.xpc.IframePollingTransport.prototype.deliverPayload_ = function(s) {
  var pos = s.indexOf(":");
  var service = s.substr(0, pos);
  var payload = s.substring(pos + 1);
  if(!this.channel_.isConnected()) {
    (this.deliveryQueue_ || (this.deliveryQueue_ = [])).push({service:service, payload:payload});
    goog.net.xpc.logger.finest("queued delivery")
  }else {
    this.channel_.deliver_(service, payload)
  }
};
goog.net.xpc.IframePollingTransport.prototype.MAX_FRAME_LENGTH_ = 3800;
goog.net.xpc.IframePollingTransport.prototype.send = function(service, payload) {
  var frame = service + ":" + payload;
  if(!goog.userAgent.IE || payload.length <= this.MAX_FRAME_LENGTH_) {
    this.sendQueue_.push("|" + frame)
  }else {
    var l = payload.length;
    var num = Math.ceil(l / this.MAX_FRAME_LENGTH_);
    var pos = 0;
    var i = 1;
    while(pos < l) {
      this.sendQueue_.push("," + i + "/" + num + "|" + frame.substr(pos, this.MAX_FRAME_LENGTH_));
      i++;
      pos += this.MAX_FRAME_LENGTH_
    }
  }
  this.sendNextFrame_()
};
goog.net.xpc.IframePollingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  var receivers = goog.net.xpc.IframePollingTransport.receivers_;
  goog.array.remove(receivers, this.msgReceiver_);
  goog.array.remove(receivers, this.ackReceiver_);
  this.msgReceiver_ = this.ackReceiver_ = null;
  goog.dom.removeNode(this.msgIframeElm_);
  goog.dom.removeNode(this.ackIframeElm_);
  this.msgIframeElm_ = this.ackIframeElm_ = null;
  this.msgWinObj_ = this.ackWinObj_ = null
};
goog.net.xpc.IframePollingTransport.receivers_ = [];
goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ = 10;
goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_ = 100;
goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ = 1E3;
goog.net.xpc.IframePollingTransport.receive_ = function() {
  var rcvd = false;
  try {
    for(var i = 0, l = goog.net.xpc.IframePollingTransport.receivers_.length;i < l;i++) {
      rcvd = rcvd || goog.net.xpc.IframePollingTransport.receivers_[i].receive()
    }
  }catch(e) {
    goog.net.xpc.logger.info("receive_() failed: " + e);
    goog.net.xpc.IframePollingTransport.receivers_[i].transport_.channel_.notifyTransportError_();
    if(!goog.net.xpc.IframePollingTransport.receivers_.length) {
      return
    }
  }
  var now = goog.now();
  if(rcvd) {
    goog.net.xpc.IframePollingTransport.lastActivity_ = now
  }
  var t = now - goog.net.xpc.IframePollingTransport.lastActivity_ < goog.net.xpc.IframePollingTransport.TIME_SHORT_POLL_AFTER_ACTIVITY_ ? goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_ : goog.net.xpc.IframePollingTransport.TIME_POLL_LONG_;
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, t)
};
goog.net.xpc.IframePollingTransport.receiveCb_ = goog.bind(goog.net.xpc.IframePollingTransport.receive_, goog.net.xpc.IframePollingTransport);
goog.net.xpc.IframePollingTransport.startRcvTimer_ = function() {
  goog.net.xpc.logger.fine("starting receive-timer");
  goog.net.xpc.IframePollingTransport.lastActivity_ = goog.now();
  if(goog.net.xpc.IframePollingTransport.rcvTimer_) {
    window.clearTimeout(goog.net.xpc.IframePollingTransport.rcvTimer_)
  }
  goog.net.xpc.IframePollingTransport.rcvTimer_ = window.setTimeout(goog.net.xpc.IframePollingTransport.receiveCb_, goog.net.xpc.IframePollingTransport.TIME_POLL_SHORT_)
};
goog.net.xpc.IframePollingTransport.Sender = function(url, windowObj) {
  this.sendUri_ = url;
  this.sendFrame_ = windowObj;
  this.cycle_ = 0
};
goog.net.xpc.IframePollingTransport.Sender.prototype.send = function(payload) {
  this.cycle_ = ++this.cycle_ % 2;
  var url = this.sendUri_ + "#" + this.cycle_ + encodeURIComponent(payload);
  try {
    if(goog.userAgent.WEBKIT) {
      this.sendFrame_.location.href = url
    }else {
      this.sendFrame_.location.replace(url)
    }
  }catch(e) {
    goog.net.xpc.logger.severe("sending failed", e)
  }
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver = function(transport, windowObj, callback) {
  this.transport_ = transport;
  this.rcvFrame_ = windowObj;
  this.cb_ = callback;
  this.currentLoc_ = this.rcvFrame_.location.href.split("#")[0] + "#INITIAL";
  goog.net.xpc.IframePollingTransport.receivers_.push(this);
  goog.net.xpc.IframePollingTransport.startRcvTimer_()
};
goog.net.xpc.IframePollingTransport.Receiver.prototype.receive = function() {
  var loc = this.rcvFrame_.location.href;
  if(loc != this.currentLoc_) {
    this.currentLoc_ = loc;
    var payload = loc.split("#")[1];
    if(payload) {
      payload = payload.substr(1);
      this.cb_(decodeURIComponent(payload))
    }
    return true
  }else {
    return false
  }
};
goog.provide("goog.net.xpc.IframeRelayTransport");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.IframeRelayTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerRelayUri_ = this.channel_.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI];
  this.peerIframeId_ = this.channel_.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.startCleanupTimer_()
  }
};
goog.inherits(goog.net.xpc.IframeRelayTransport, goog.net.xpc.Transport);
if(goog.userAgent.WEBKIT) {
  goog.net.xpc.IframeRelayTransport.iframeRefs_ = [];
  goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_ = 1E3;
  goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_ = 3E3;
  goog.net.xpc.IframeRelayTransport.cleanupTimer_ = 0;
  goog.net.xpc.IframeRelayTransport.startCleanupTimer_ = function() {
    if(!goog.net.xpc.IframeRelayTransport.cleanupTimer_) {
      goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(function() {
        goog.net.xpc.IframeRelayTransport.cleanup_()
      }, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
    }
  };
  goog.net.xpc.IframeRelayTransport.cleanup_ = function(opt_maxAge) {
    var now = goog.now();
    var maxAge = opt_maxAge || goog.net.xpc.IframeRelayTransport.IFRAME_MAX_AGE_;
    while(goog.net.xpc.IframeRelayTransport.iframeRefs_.length && now - goog.net.xpc.IframeRelayTransport.iframeRefs_[0].timestamp >= maxAge) {
      var ifr = goog.net.xpc.IframeRelayTransport.iframeRefs_.shift().iframeElement;
      goog.dom.removeNode(ifr);
      goog.net.xpc.logger.finest("iframe removed")
    }
    goog.net.xpc.IframeRelayTransport.cleanupTimer_ = window.setTimeout(goog.net.xpc.IframeRelayTransport.cleanupCb_, goog.net.xpc.IframeRelayTransport.CLEANUP_INTERVAL_)
  };
  goog.net.xpc.IframeRelayTransport.cleanupCb_ = function() {
    goog.net.xpc.IframeRelayTransport.cleanup_()
  }
}
goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_ = 1800;
goog.net.xpc.IframeRelayTransport.FragmentInfo;
goog.net.xpc.IframeRelayTransport.fragmentMap_ = {};
goog.net.xpc.IframeRelayTransport.prototype.transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY;
goog.net.xpc.IframeRelayTransport.prototype.connect = function() {
  if(!this.getWindow()["xpcRelay"]) {
    this.getWindow()["xpcRelay"] = goog.net.xpc.IframeRelayTransport.receiveMessage_
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP)
};
goog.net.xpc.IframeRelayTransport.receiveMessage_ = function(channelName, frame) {
  var pos = frame.indexOf(":");
  var header = frame.substr(0, pos);
  var payload = frame.substr(pos + 1);
  if(!goog.userAgent.IE || (pos = header.indexOf("|")) == -1) {
    var service = header
  }else {
    var service = header.substr(0, pos);
    var fragmentIdStr = header.substr(pos + 1);
    pos = fragmentIdStr.indexOf("+");
    var messageIdStr = fragmentIdStr.substr(0, pos);
    var fragmentNum = parseInt(fragmentIdStr.substr(pos + 1), 10);
    var fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr];
    if(!fragmentInfo) {
      fragmentInfo = goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr] = {fragments:[], received:0, expected:0}
    }
    if(goog.string.contains(fragmentIdStr, "++")) {
      fragmentInfo.expected = fragmentNum + 1
    }
    fragmentInfo.fragments[fragmentNum] = payload;
    fragmentInfo.received++;
    if(fragmentInfo.received != fragmentInfo.expected) {
      return
    }
    payload = fragmentInfo.fragments.join("");
    delete goog.net.xpc.IframeRelayTransport.fragmentMap_[messageIdStr]
  }
  goog.net.xpc.channels_[channelName].deliver_(service, decodeURIComponent(payload))
};
goog.net.xpc.IframeRelayTransport.prototype.transportServiceHandler = function(payload) {
  if(payload == goog.net.xpc.SETUP) {
    this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
    this.channel_.notifyConnected_()
  }else {
    if(payload == goog.net.xpc.SETUP_ACK_) {
      this.channel_.notifyConnected_()
    }
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send = function(service, payload) {
  var encodedPayload = encodeURIComponent(payload);
  var encodedLen = encodedPayload.length;
  var maxSize = goog.net.xpc.IframeRelayTransport.IE_PAYLOAD_MAX_SIZE_;
  if(goog.userAgent.IE && encodedLen > maxSize) {
    var messageIdStr = goog.string.getRandomString();
    for(var startIndex = 0, fragmentNum = 0;startIndex < encodedLen;fragmentNum++) {
      var payloadFragment = encodedPayload.substr(startIndex, maxSize);
      startIndex += maxSize;
      var fragmentIdStr = messageIdStr + (startIndex >= encodedLen ? "++" : "+") + fragmentNum;
      this.send_(service, payloadFragment, fragmentIdStr)
    }
  }else {
    this.send_(service, encodedPayload)
  }
};
goog.net.xpc.IframeRelayTransport.prototype.send_ = function(service, encodedPayload, opt_fragmentIdStr) {
  if(goog.userAgent.IE) {
    var div = this.getWindow().document.createElement("div");
    div.innerHTML = '<iframe onload="this.xpcOnload()"></iframe>';
    var ifr = div.childNodes[0];
    div = null;
    ifr["xpcOnload"] = goog.net.xpc.IframeRelayTransport.iframeLoadHandler_
  }else {
    var ifr = this.getWindow().document.createElement("iframe");
    if(goog.userAgent.WEBKIT) {
      goog.net.xpc.IframeRelayTransport.iframeRefs_.push({timestamp:goog.now(), iframeElement:ifr})
    }else {
      goog.events.listen(ifr, "load", goog.net.xpc.IframeRelayTransport.iframeLoadHandler_)
    }
  }
  var style = ifr.style;
  style.visibility = "hidden";
  style.width = ifr.style.height = "0px";
  style.position = "absolute";
  var url = this.peerRelayUri_;
  url += "#" + this.channel_.name;
  if(this.peerIframeId_) {
    url += "," + this.peerIframeId_
  }
  url += "|" + service;
  if(opt_fragmentIdStr) {
    url += "|" + opt_fragmentIdStr
  }
  url += ":" + encodedPayload;
  ifr.src = url;
  this.getWindow().document.body.appendChild(ifr);
  goog.net.xpc.logger.finest("msg sent: " + url)
};
goog.net.xpc.IframeRelayTransport.iframeLoadHandler_ = function() {
  goog.net.xpc.logger.finest("iframe-load");
  goog.dom.removeNode(this);
  this.xpcOnload = null
};
goog.net.xpc.IframeRelayTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(goog.userAgent.WEBKIT) {
    goog.net.xpc.IframeRelayTransport.cleanup_(0)
  }
};
goog.provide("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.events");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.CrossPageChannelRole");
goog.require("goog.net.xpc.Transport");
goog.net.xpc.NativeMessagingTransport = function(channel, peerHostname, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.peerHostname_ = peerHostname || "*"
};
goog.inherits(goog.net.xpc.NativeMessagingTransport, goog.net.xpc.Transport);
goog.net.xpc.NativeMessagingTransport.prototype.initialized_ = false;
goog.net.xpc.NativeMessagingTransport.prototype.transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING;
goog.net.xpc.NativeMessagingTransport.activeCount_ = {};
goog.net.xpc.NativeMessagingTransport.initialize_ = function(listenWindow) {
  var uid = goog.getUid(listenWindow);
  var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
  if(!goog.isNumber(value)) {
    value = 0
  }
  if(value == 0) {
    goog.events.listen(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
  }
  goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value + 1
};
goog.net.xpc.NativeMessagingTransport.messageReceived_ = function(msgEvt) {
  var data = msgEvt.getBrowserEvent().data;
  if(!goog.isString(data)) {
    return false
  }
  var headDelim = data.indexOf("|");
  var serviceDelim = data.indexOf(":");
  if(headDelim == -1 || serviceDelim == -1) {
    return false
  }
  var channelName = data.substring(0, headDelim);
  var service = data.substring(headDelim + 1, serviceDelim);
  var payload = data.substring(serviceDelim + 1);
  goog.net.xpc.logger.fine("messageReceived: channel=" + channelName + ", service=" + service + ", payload=" + payload);
  var channel = goog.net.xpc.channels_[channelName];
  if(channel) {
    channel.deliver_(service, payload, msgEvt.getBrowserEvent().origin);
    return true
  }
  for(var staleChannelName in goog.net.xpc.channels_) {
    var staleChannel = goog.net.xpc.channels_[staleChannelName];
    if(staleChannel.getRole() == goog.net.xpc.CrossPageChannelRole.INNER && !staleChannel.isConnected() && service == goog.net.xpc.TRANSPORT_SERVICE_ && payload == goog.net.xpc.SETUP) {
      goog.net.xpc.logger.fine("changing channel name to " + channelName);
      staleChannel.name = channelName;
      delete goog.net.xpc.channels_[staleChannelName];
      goog.net.xpc.channels_[channelName] = staleChannel;
      staleChannel.deliver_(service, payload);
      return true
    }
  }
  goog.net.xpc.logger.info('channel name mismatch; message ignored"');
  return false
};
goog.net.xpc.NativeMessagingTransport.prototype.transportServiceHandler = function(payload) {
  switch(payload) {
    case goog.net.xpc.SETUP:
      this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP_ACK_);
      break;
    case goog.net.xpc.SETUP_ACK_:
      this.channel_.notifyConnected_();
      break
  }
};
goog.net.xpc.NativeMessagingTransport.prototype.connect = function() {
  goog.net.xpc.NativeMessagingTransport.initialize_(this.getWindow());
  this.initialized_ = true;
  this.connectWithRetries_()
};
goog.net.xpc.NativeMessagingTransport.prototype.connectWithRetries_ = function() {
  if(this.channel_.isConnected() || this.isDisposed()) {
    return
  }
  this.send(goog.net.xpc.TRANSPORT_SERVICE_, goog.net.xpc.SETUP);
  this.getWindow().setTimeout(goog.bind(this.connectWithRetries_, this), 100)
};
goog.net.xpc.NativeMessagingTransport.prototype.send = function(service, payload) {
  var win = this.channel_.peerWindowObject_;
  if(!win) {
    goog.net.xpc.logger.fine("send(): window not ready");
    return
  }
  var obj = win.postMessage ? win : win.document;
  this.send = function(service, payload) {
    goog.net.xpc.logger.fine("send(): payload=" + payload + " to hostname=" + this.peerHostname_);
    obj.postMessage(this.channel_.name + "|" + service + ":" + payload, this.peerHostname_)
  };
  this.send(service, payload)
};
goog.net.xpc.NativeMessagingTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  if(this.initialized_) {
    var listenWindow = this.getWindow();
    var uid = goog.getUid(listenWindow);
    var value = goog.net.xpc.NativeMessagingTransport.activeCount_[uid];
    goog.net.xpc.NativeMessagingTransport.activeCount_[uid] = value - 1;
    if(value == 1) {
      goog.events.unlisten(listenWindow.postMessage ? listenWindow : listenWindow.document, "message", goog.net.xpc.NativeMessagingTransport.messageReceived_, false, goog.net.xpc.NativeMessagingTransport)
    }
  }
  delete this.send
};
goog.provide("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.CrossPageChannelRole");
goog.require("goog.net.xpc.Transport");
goog.require("goog.reflect");
goog.net.xpc.NixTransport = function(channel, opt_domHelper) {
  goog.base(this, opt_domHelper);
  this.channel_ = channel;
  this.authToken_ = channel[goog.net.xpc.CfgFields.AUTH_TOKEN] || "";
  this.remoteAuthToken_ = channel[goog.net.xpc.CfgFields.REMOTE_AUTH_TOKEN] || "";
  goog.net.xpc.NixTransport.conductGlobalSetup_(this.getWindow());
  this[goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE] = this.handleMessage_;
  this[goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL] = this.createChannel_
};
goog.inherits(goog.net.xpc.NixTransport, goog.net.xpc.Transport);
goog.net.xpc.NixTransport.NIX_WRAPPER = "GCXPC____NIXVBS_wrapper";
goog.net.xpc.NixTransport.NIX_GET_WRAPPER = "GCXPC____NIXVBS_get_wrapper";
goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE = "GCXPC____NIXJS_handle_message";
goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL = "GCXPC____NIXJS_create_channel";
goog.net.xpc.NixTransport.NIX_ID_FIELD = "GCXPC____NIXVBS_container";
goog.net.xpc.NixTransport.isNixSupported = function() {
  var isSupported = false;
  try {
    var oldOpener = window.opener;
    window.opener = {};
    isSupported = goog.reflect.canAccessProperty(window, "opener");
    window.opener = oldOpener
  }catch(e) {
  }
  return isSupported
};
goog.net.xpc.NixTransport.conductGlobalSetup_ = function(listenWindow) {
  if(listenWindow["nix_setup_complete"]) {
    return
  }
  var vbscript = "Class " + goog.net.xpc.NixTransport.NIX_WRAPPER + "\n " + "Private m_Transport\n" + "Private m_Auth\n" + "Public Sub SetTransport(transport)\n" + "If isEmpty(m_Transport) Then\n" + "Set m_Transport = transport\n" + "End If\n" + "End Sub\n" + "Public Sub SetAuth(auth)\n" + "If isEmpty(m_Auth) Then\n" + "m_Auth = auth\n" + "End If\n" + "End Sub\n" + "Public Function GetAuthToken()\n " + "GetAuthToken = m_Auth\n" + "End Function\n" + "Public Sub SendMessage(service, payload)\n " + 
  "Call m_Transport." + goog.net.xpc.NixTransport.NIX_HANDLE_MESSAGE + "(service, payload)\n" + "End Sub\n" + "Public Sub CreateChannel(channel)\n " + "Call m_Transport." + goog.net.xpc.NixTransport.NIX_CREATE_CHANNEL + "(channel)\n" + "End Sub\n" + "Public Sub " + goog.net.xpc.NixTransport.NIX_ID_FIELD + "()\n " + "End Sub\n" + "End Class\n " + "Function " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + "(transport, auth)\n" + "Dim wrap\n" + "Set wrap = New " + goog.net.xpc.NixTransport.NIX_WRAPPER + 
  "\n" + "wrap.SetTransport transport\n" + "wrap.SetAuth auth\n" + "Set " + goog.net.xpc.NixTransport.NIX_GET_WRAPPER + " = wrap\n" + "End Function";
  try {
    listenWindow.execScript(vbscript, "vbscript");
    listenWindow["nix_setup_complete"] = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting global setup: " + e)
  }
};
goog.net.xpc.NixTransport.prototype.transportType = goog.net.xpc.TransportTypes.NIX;
goog.net.xpc.NixTransport.prototype.localSetupCompleted_ = false;
goog.net.xpc.NixTransport.prototype.nixChannel_ = null;
goog.net.xpc.NixTransport.prototype.connect = function() {
  if(this.channel_.getRole() == goog.net.xpc.CrossPageChannelRole.OUTER) {
    this.attemptOuterSetup_()
  }else {
    this.attemptInnerSetup_()
  }
};
goog.net.xpc.NixTransport.prototype.attemptOuterSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  var innerFrame = this.channel_.iframeElement_;
  try {
    innerFrame.contentWindow.opener = this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_);
    this.localSetupCompleted_ = true
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e)
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptOuterSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.attemptInnerSetup_ = function() {
  if(this.localSetupCompleted_) {
    return
  }
  try {
    var opener = this.getWindow().opener;
    if(opener && goog.net.xpc.NixTransport.NIX_ID_FIELD in opener) {
      this.nixChannel_ = opener;
      var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
      if(remoteAuthToken != this.remoteAuthToken_) {
        goog.net.xpc.logger.severe("Invalid auth token from other party");
        return
      }
      this.nixChannel_["CreateChannel"](this.getWindow()[goog.net.xpc.NixTransport.NIX_GET_WRAPPER](this, this.authToken_));
      this.localSetupCompleted_ = true;
      this.channel_.notifyConnected_()
    }
  }catch(e) {
    goog.net.xpc.logger.severe("exception caught while attempting setup: " + e);
    return
  }
  if(!this.localSetupCompleted_) {
    this.getWindow().setTimeout(goog.bind(this.attemptInnerSetup_, this), 100)
  }
};
goog.net.xpc.NixTransport.prototype.createChannel_ = function(channel) {
  if(typeof channel != "unknown" || !(goog.net.xpc.NixTransport.NIX_ID_FIELD in channel)) {
    goog.net.xpc.logger.severe("Invalid NIX channel given to createChannel_")
  }
  this.nixChannel_ = channel;
  var remoteAuthToken = this.nixChannel_["GetAuthToken"]();
  if(remoteAuthToken != this.remoteAuthToken_) {
    goog.net.xpc.logger.severe("Invalid auth token from other party");
    return
  }
  this.channel_.notifyConnected_()
};
goog.net.xpc.NixTransport.prototype.handleMessage_ = function(serviceName, payload) {
  function deliveryHandler() {
    this.channel_.deliver_(serviceName, payload)
  }
  this.getWindow().setTimeout(goog.bind(deliveryHandler, this), 1)
};
goog.net.xpc.NixTransport.prototype.send = function(service, payload) {
  if(typeof this.nixChannel_ !== "unknown") {
    goog.net.xpc.logger.severe("NIX channel not connected")
  }
  this.nixChannel_["SendMessage"](service, payload)
};
goog.net.xpc.NixTransport.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.nixChannel_ = null
};
goog.provide("goog.net.xpc.CrossPageChannel");
goog.require("goog.Disposable");
goog.require("goog.Uri");
goog.require("goog.dom");
goog.require("goog.events");
goog.require("goog.json");
goog.require("goog.messaging.AbstractChannel");
goog.require("goog.net.xpc");
goog.require("goog.net.xpc.CrossPageChannelRole");
goog.require("goog.net.xpc.FrameElementMethodTransport");
goog.require("goog.net.xpc.IframePollingTransport");
goog.require("goog.net.xpc.IframeRelayTransport");
goog.require("goog.net.xpc.NativeMessagingTransport");
goog.require("goog.net.xpc.NixTransport");
goog.require("goog.net.xpc.Transport");
goog.require("goog.userAgent");
goog.net.xpc.CrossPageChannel = function(cfg, opt_domHelper) {
  goog.base(this);
  for(var i = 0, uriField;uriField = goog.net.xpc.UriCfgFields[i];i++) {
    if(uriField in cfg && !/^https?:\/\//.test(cfg[uriField])) {
      throw Error("URI " + cfg[uriField] + " is invalid for field " + uriField);
    }
  }
  this.cfg_ = cfg;
  this.name = this.cfg_[goog.net.xpc.CfgFields.CHANNEL_NAME] || goog.net.xpc.getRandomString(10);
  this.domHelper_ = opt_domHelper || goog.dom.getDomHelper();
  this.deferredDeliveries_ = [];
  cfg[goog.net.xpc.CfgFields.LOCAL_POLL_URI] = cfg[goog.net.xpc.CfgFields.LOCAL_POLL_URI] || goog.uri.utils.getHost(this.domHelper_.getWindow().location.href) + "/robots.txt";
  cfg[goog.net.xpc.CfgFields.PEER_POLL_URI] = cfg[goog.net.xpc.CfgFields.PEER_POLL_URI] || goog.uri.utils.getHost(cfg[goog.net.xpc.CfgFields.PEER_URI] || "") + "/robots.txt";
  goog.net.xpc.channels_[this.name] = this;
  goog.events.listen(window, "unload", goog.net.xpc.CrossPageChannel.disposeAll_);
  goog.net.xpc.logger.info("CrossPageChannel created: " + this.name)
};
goog.inherits(goog.net.xpc.CrossPageChannel, goog.messaging.AbstractChannel);
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_ = new RegExp("^%*" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_ = new RegExp("^%+" + goog.net.xpc.TRANSPORT_SERVICE_ + "$");
goog.net.xpc.CrossPageChannel.prototype.transport_ = null;
goog.net.xpc.CrossPageChannel.prototype.state_ = goog.net.xpc.ChannelStates.NOT_CONNECTED;
goog.net.xpc.CrossPageChannel.prototype.isConnected = function() {
  return this.state_ == goog.net.xpc.ChannelStates.CONNECTED
};
goog.net.xpc.CrossPageChannel.prototype.peerWindowObject_ = null;
goog.net.xpc.CrossPageChannel.prototype.iframeElement_ = null;
goog.net.xpc.CrossPageChannel.prototype.setPeerWindowObject = function(peerWindowObject) {
  this.peerWindowObject_ = peerWindowObject
};
goog.net.xpc.CrossPageChannel.prototype.determineTransportType_ = function() {
  var transportType;
  if(goog.isFunction(document.postMessage) || goog.isFunction(window.postMessage) || goog.userAgent.IE && window.postMessage) {
    transportType = goog.net.xpc.TransportTypes.NATIVE_MESSAGING
  }else {
    if(goog.userAgent.GECKO) {
      transportType = goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD
    }else {
      if(goog.userAgent.IE && this.cfg_[goog.net.xpc.CfgFields.PEER_RELAY_URI]) {
        transportType = goog.net.xpc.TransportTypes.IFRAME_RELAY
      }else {
        if(goog.userAgent.IE && goog.net.xpc.NixTransport.isNixSupported()) {
          transportType = goog.net.xpc.TransportTypes.NIX
        }else {
          transportType = goog.net.xpc.TransportTypes.IFRAME_POLLING
        }
      }
    }
  }
  return transportType
};
goog.net.xpc.CrossPageChannel.prototype.createTransport_ = function() {
  if(this.transport_) {
    return
  }
  if(!this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    this.cfg_[goog.net.xpc.CfgFields.TRANSPORT] = this.determineTransportType_()
  }
  switch(this.cfg_[goog.net.xpc.CfgFields.TRANSPORT]) {
    case goog.net.xpc.TransportTypes.NATIVE_MESSAGING:
      this.transport_ = new goog.net.xpc.NativeMessagingTransport(this, this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME], this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.NIX:
      this.transport_ = new goog.net.xpc.NixTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.FRAME_ELEMENT_METHOD:
      this.transport_ = new goog.net.xpc.FrameElementMethodTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_RELAY:
      this.transport_ = new goog.net.xpc.IframeRelayTransport(this, this.domHelper_);
      break;
    case goog.net.xpc.TransportTypes.IFRAME_POLLING:
      this.transport_ = new goog.net.xpc.IframePollingTransport(this, this.domHelper_);
      break
  }
  if(this.transport_) {
    goog.net.xpc.logger.info("Transport created: " + this.transport_.getName())
  }else {
    throw Error("CrossPageChannel: No suitable transport found!");
  }
};
goog.net.xpc.CrossPageChannel.prototype.getTransportType = function() {
  return this.transport_.getType()
};
goog.net.xpc.CrossPageChannel.prototype.getTransportName = function() {
  return this.transport_.getName()
};
goog.net.xpc.CrossPageChannel.prototype.getPeerConfiguration = function() {
  var peerCfg = {};
  peerCfg[goog.net.xpc.CfgFields.CHANNEL_NAME] = this.name;
  peerCfg[goog.net.xpc.CfgFields.TRANSPORT] = this.cfg_[goog.net.xpc.CfgFields.TRANSPORT];
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_RELAY_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_RELAY_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.PEER_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.LOCAL_POLL_URI]
  }
  if(this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]) {
    peerCfg[goog.net.xpc.CfgFields.LOCAL_POLL_URI] = this.cfg_[goog.net.xpc.CfgFields.PEER_POLL_URI]
  }
  return peerCfg
};
goog.net.xpc.CrossPageChannel.prototype.createPeerIframe = function(parentElm, opt_configureIframeCb, opt_addCfgParam) {
  var iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID];
  if(!iframeId) {
    iframeId = this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID] = "xpcpeer" + goog.net.xpc.getRandomString(4)
  }
  var iframeElm = goog.dom.createElement("IFRAME");
  iframeElm.id = iframeElm.name = iframeId;
  if(opt_configureIframeCb) {
    opt_configureIframeCb(iframeElm)
  }else {
    iframeElm.style.width = iframeElm.style.height = "100%"
  }
  var peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI];
  if(goog.isString(peerUri)) {
    peerUri = this.cfg_[goog.net.xpc.CfgFields.PEER_URI] = new goog.Uri(peerUri)
  }
  if(opt_addCfgParam !== false) {
    peerUri.setParameterValue("xpc", goog.json.serialize(this.getPeerConfiguration()))
  }
  if(goog.userAgent.GECKO || goog.userAgent.WEBKIT) {
    this.deferConnect_ = true;
    window.setTimeout(goog.bind(function() {
      this.deferConnect_ = false;
      parentElm.appendChild(iframeElm);
      iframeElm.src = peerUri.toString();
      goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")");
      if(this.connectDeferred_) {
        this.connect(this.connectCb_)
      }
    }, this), 1)
  }else {
    iframeElm.src = peerUri.toString();
    parentElm.appendChild(iframeElm);
    goog.net.xpc.logger.info("peer iframe created (" + iframeId + ")")
  }
  return iframeElm
};
goog.net.xpc.CrossPageChannel.prototype.deferConnect_ = false;
goog.net.xpc.CrossPageChannel.prototype.connectDeferred_ = false;
goog.net.xpc.CrossPageChannel.prototype.connect = function(opt_connectCb) {
  this.connectCb_ = opt_connectCb || goog.nullFunction;
  if(this.deferConnect_) {
    goog.net.xpc.logger.info("connect() deferred");
    this.connectDeferred_ = true;
    return
  }
  this.connectDeferred_ = false;
  goog.net.xpc.logger.info("connect()");
  if(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]) {
    this.iframeElement_ = this.domHelper_.getElement(this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID])
  }
  if(this.iframeElement_) {
    var winObj = this.iframeElement_.contentWindow;
    if(!winObj) {
      winObj = window.frames[this.cfg_[goog.net.xpc.CfgFields.IFRAME_ID]]
    }
    this.setPeerWindowObject(winObj)
  }
  if(!this.peerWindowObject_) {
    if(window == top) {
      throw Error("CrossPageChannel: Can't connect, peer window-object not set.");
    }else {
      this.setPeerWindowObject(window.parent)
    }
  }
  this.createTransport_();
  this.transport_.connect();
  while(this.deferredDeliveries_.length > 0) {
    this.deferredDeliveries_.shift()()
  }
};
goog.net.xpc.CrossPageChannel.prototype.close = function() {
  if(!this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CLOSED;
  this.transport_.dispose();
  this.transport_ = null;
  this.connectCb_ = null;
  this.connectDeferred_ = false;
  this.deferredDeliveries_.length = 0;
  goog.net.xpc.logger.info('Channel "' + this.name + '" closed')
};
goog.net.xpc.CrossPageChannel.prototype.notifyConnected_ = function() {
  if(this.isConnected()) {
    return
  }
  this.state_ = goog.net.xpc.ChannelStates.CONNECTED;
  goog.net.xpc.logger.info('Channel "' + this.name + '" connected');
  this.connectCb_()
};
goog.net.xpc.CrossPageChannel.prototype.notifyTransportError_ = function() {
  goog.net.xpc.logger.info("Transport Error");
  this.close()
};
goog.net.xpc.CrossPageChannel.prototype.send = function(serviceName, payload) {
  if(!this.isConnected()) {
    goog.net.xpc.logger.severe("Can't send. Channel not connected.");
    return
  }
  if(Boolean(this.peerWindowObject_.closed)) {
    goog.net.xpc.logger.severe("Peer has disappeared.");
    this.close();
    return
  }
  if(goog.isObject(payload)) {
    payload = goog.json.serialize(payload)
  }
  this.transport_.send(this.escapeServiceName_(serviceName), payload)
};
goog.net.xpc.CrossPageChannel.prototype.deliver_ = function(serviceName, payload, opt_origin) {
  if(this.connectDeferred_) {
    this.deferredDeliveries_.push(goog.bind(this.deliver_, this, serviceName, payload, opt_origin));
    return
  }
  if(!this.isMessageOriginAcceptable_(opt_origin)) {
    goog.net.xpc.logger.warning('Message received from unapproved origin "' + opt_origin + '" - rejected.');
    return
  }
  if(this.isDisposed()) {
    goog.net.xpc.logger.warning("CrossPageChannel::deliver_(): Disposed.")
  }else {
    if(!serviceName || serviceName == goog.net.xpc.TRANSPORT_SERVICE_) {
      this.transport_.transportServiceHandler(payload)
    }else {
      if(this.isConnected()) {
        this.deliver(this.unescapeServiceName_(serviceName), payload)
      }else {
        goog.net.xpc.logger.info("CrossPageChannel::deliver_(): Not connected.")
      }
    }
  }
};
goog.net.xpc.CrossPageChannel.prototype.escapeServiceName_ = function(name) {
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_ESCAPE_RE_.test(name)) {
    name = "%" + name
  }
  return name.replace(/[%:|]/g, encodeURIComponent)
};
goog.net.xpc.CrossPageChannel.prototype.unescapeServiceName_ = function(name) {
  name = name.replace(/%[0-9a-f]{2}/gi, decodeURIComponent);
  if(goog.net.xpc.CrossPageChannel.TRANSPORT_SERVICE_UNESCAPE_RE_.test(name)) {
    return name.substring(1)
  }else {
    return name
  }
};
goog.net.xpc.CrossPageChannel.prototype.getRole = function() {
  return window.parent == this.peerWindowObject_ ? goog.net.xpc.CrossPageChannelRole.INNER : goog.net.xpc.CrossPageChannelRole.OUTER
};
goog.net.xpc.CrossPageChannel.prototype.isMessageOriginAcceptable_ = function(opt_origin) {
  var peerHostname = this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME];
  return goog.string.isEmptySafe(opt_origin) || goog.string.isEmptySafe(peerHostname) || opt_origin == this.cfg_[goog.net.xpc.CfgFields.PEER_HOSTNAME]
};
goog.net.xpc.CrossPageChannel.prototype.disposeInternal = function() {
  goog.base(this, "disposeInternal");
  this.close();
  this.peerWindowObject_ = null;
  this.iframeElement_ = null;
  delete goog.net.xpc.channels_[this.name];
  this.deferredDeliveries_.length = 0
};
goog.net.xpc.CrossPageChannel.disposeAll_ = function() {
  for(var name in goog.net.xpc.channels_) {
    var ch = goog.net.xpc.channels_[name];
    if(ch) {
      ch.dispose()
    }
  }
};
goog.provide("goog.net.EventType");
goog.net.EventType = {COMPLETE:"complete", SUCCESS:"success", ERROR:"error", ABORT:"abort", READY:"ready", READY_STATE_CHANGE:"readystatechange", TIMEOUT:"timeout", INCREMENTAL_DATA:"incrementaldata", PROGRESS:"progress"};
goog.provide("goog.Timer");
goog.require("goog.events.EventTarget");
goog.Timer = function(opt_interval, opt_timerObject) {
  goog.events.EventTarget.call(this);
  this.interval_ = opt_interval || 1;
  this.timerObject_ = opt_timerObject || goog.Timer.defaultTimerObject;
  this.boundTick_ = goog.bind(this.tick_, this);
  this.last_ = goog.now()
};
goog.inherits(goog.Timer, goog.events.EventTarget);
goog.Timer.MAX_TIMEOUT_ = 2147483647;
goog.Timer.prototype.enabled = false;
goog.Timer.defaultTimerObject = goog.global["window"];
goog.Timer.intervalScale = 0.8;
goog.Timer.prototype.timer_ = null;
goog.Timer.prototype.getInterval = function() {
  return this.interval_
};
goog.Timer.prototype.setInterval = function(interval) {
  this.interval_ = interval;
  if(this.timer_ && this.enabled) {
    this.stop();
    this.start()
  }else {
    if(this.timer_) {
      this.stop()
    }
  }
};
goog.Timer.prototype.tick_ = function() {
  if(this.enabled) {
    var elapsed = goog.now() - this.last_;
    if(elapsed > 0 && elapsed < this.interval_ * goog.Timer.intervalScale) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_ - elapsed);
      return
    }
    this.dispatchTick();
    if(this.enabled) {
      this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
      this.last_ = goog.now()
    }
  }
};
goog.Timer.prototype.dispatchTick = function() {
  this.dispatchEvent(goog.Timer.TICK)
};
goog.Timer.prototype.start = function() {
  this.enabled = true;
  if(!this.timer_) {
    this.timer_ = this.timerObject_.setTimeout(this.boundTick_, this.interval_);
    this.last_ = goog.now()
  }
};
goog.Timer.prototype.stop = function() {
  this.enabled = false;
  if(this.timer_) {
    this.timerObject_.clearTimeout(this.timer_);
    this.timer_ = null
  }
};
goog.Timer.prototype.disposeInternal = function() {
  goog.Timer.superClass_.disposeInternal.call(this);
  this.stop();
  delete this.timerObject_
};
goog.Timer.TICK = "tick";
goog.Timer.callOnce = function(listener, opt_delay, opt_handler) {
  if(goog.isFunction(listener)) {
    if(opt_handler) {
      listener = goog.bind(listener, opt_handler)
    }
  }else {
    if(listener && typeof listener.handleEvent == "function") {
      listener = goog.bind(listener.handleEvent, listener)
    }else {
      throw Error("Invalid listener argument");
    }
  }
  if(opt_delay > goog.Timer.MAX_TIMEOUT_) {
    return-1
  }else {
    return goog.Timer.defaultTimerObject.setTimeout(listener, opt_delay || 0)
  }
};
goog.Timer.clear = function(timerId) {
  goog.Timer.defaultTimerObject.clearTimeout(timerId)
};
goog.provide("goog.net.ErrorCode");
goog.net.ErrorCode = {NO_ERROR:0, ACCESS_DENIED:1, FILE_NOT_FOUND:2, FF_SILENT_ERROR:3, CUSTOM_ERROR:4, EXCEPTION:5, HTTP_ERROR:6, ABORT:7, TIMEOUT:8, OFFLINE:9};
goog.net.ErrorCode.getDebugMessage = function(errorCode) {
  switch(errorCode) {
    case goog.net.ErrorCode.NO_ERROR:
      return"No Error";
    case goog.net.ErrorCode.ACCESS_DENIED:
      return"Access denied to content document";
    case goog.net.ErrorCode.FILE_NOT_FOUND:
      return"File not found";
    case goog.net.ErrorCode.FF_SILENT_ERROR:
      return"Firefox silently errored";
    case goog.net.ErrorCode.CUSTOM_ERROR:
      return"Application custom error";
    case goog.net.ErrorCode.EXCEPTION:
      return"An exception occurred";
    case goog.net.ErrorCode.HTTP_ERROR:
      return"Http response at 400 or 500 level";
    case goog.net.ErrorCode.ABORT:
      return"Request was aborted";
    case goog.net.ErrorCode.TIMEOUT:
      return"Request timed out";
    case goog.net.ErrorCode.OFFLINE:
      return"The resource is not available offline";
    default:
      return"Unrecognized error code"
  }
};
goog.provide("goog.net.HttpStatus");
goog.net.HttpStatus = {CONTINUE:100, SWITCHING_PROTOCOLS:101, OK:200, CREATED:201, ACCEPTED:202, NON_AUTHORITATIVE_INFORMATION:203, NO_CONTENT:204, RESET_CONTENT:205, PARTIAL_CONTENT:206, MULTIPLE_CHOICES:300, MOVED_PERMANENTLY:301, FOUND:302, SEE_OTHER:303, NOT_MODIFIED:304, USE_PROXY:305, TEMPORARY_REDIRECT:307, BAD_REQUEST:400, UNAUTHORIZED:401, PAYMENT_REQUIRED:402, FORBIDDEN:403, NOT_FOUND:404, METHOD_NOT_ALLOWED:405, NOT_ACCEPTABLE:406, PROXY_AUTHENTICATION_REQUIRED:407, REQUEST_TIMEOUT:408, 
CONFLICT:409, GONE:410, LENGTH_REQUIRED:411, PRECONDITION_FAILED:412, REQUEST_ENTITY_TOO_LARGE:413, REQUEST_URI_TOO_LONG:414, UNSUPPORTED_MEDIA_TYPE:415, REQUEST_RANGE_NOT_SATISFIABLE:416, EXPECTATION_FAILED:417, INTERNAL_SERVER_ERROR:500, NOT_IMPLEMENTED:501, BAD_GATEWAY:502, SERVICE_UNAVAILABLE:503, GATEWAY_TIMEOUT:504, HTTP_VERSION_NOT_SUPPORTED:505, QUIRK_IE_NO_CONTENT:1223};
goog.provide("goog.net.XmlHttpFactory");
goog.net.XmlHttpFactory = function() {
};
goog.net.XmlHttpFactory.prototype.cachedOptions_ = null;
goog.net.XmlHttpFactory.prototype.createInstance = goog.abstractMethod;
goog.net.XmlHttpFactory.prototype.getOptions = function() {
  return this.cachedOptions_ || (this.cachedOptions_ = this.internalGetOptions())
};
goog.net.XmlHttpFactory.prototype.internalGetOptions = goog.abstractMethod;
goog.provide("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.WrapperXmlHttpFactory = function(xhrFactory, optionsFactory) {
  goog.net.XmlHttpFactory.call(this);
  this.xhrFactory_ = xhrFactory;
  this.optionsFactory_ = optionsFactory
};
goog.inherits(goog.net.WrapperXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.WrapperXmlHttpFactory.prototype.createInstance = function() {
  return this.xhrFactory_()
};
goog.net.WrapperXmlHttpFactory.prototype.getOptions = function() {
  return this.optionsFactory_()
};
goog.provide("goog.net.DefaultXmlHttpFactory");
goog.provide("goog.net.XmlHttp");
goog.provide("goog.net.XmlHttp.OptionType");
goog.provide("goog.net.XmlHttp.ReadyState");
goog.require("goog.net.WrapperXmlHttpFactory");
goog.require("goog.net.XmlHttpFactory");
goog.net.XmlHttp = function() {
  return goog.net.XmlHttp.factory_.createInstance()
};
goog.net.XmlHttp.getOptions = function() {
  return goog.net.XmlHttp.factory_.getOptions()
};
goog.net.XmlHttp.OptionType = {USE_NULL_FUNCTION:0, LOCAL_REQUEST_ERROR:1};
goog.net.XmlHttp.ReadyState = {UNINITIALIZED:0, LOADING:1, LOADED:2, INTERACTIVE:3, COMPLETE:4};
goog.net.XmlHttp.factory_;
goog.net.XmlHttp.setFactory = function(factory, optionsFactory) {
  goog.net.XmlHttp.setGlobalFactory(new goog.net.WrapperXmlHttpFactory(factory, optionsFactory))
};
goog.net.XmlHttp.setGlobalFactory = function(factory) {
  goog.net.XmlHttp.factory_ = factory
};
goog.net.DefaultXmlHttpFactory = function() {
  goog.net.XmlHttpFactory.call(this)
};
goog.inherits(goog.net.DefaultXmlHttpFactory, goog.net.XmlHttpFactory);
goog.net.DefaultXmlHttpFactory.prototype.createInstance = function() {
  var progId = this.getProgId_();
  if(progId) {
    return new ActiveXObject(progId)
  }else {
    return new XMLHttpRequest
  }
};
goog.net.DefaultXmlHttpFactory.prototype.internalGetOptions = function() {
  var progId = this.getProgId_();
  var options = {};
  if(progId) {
    options[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] = true;
    options[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] = true
  }
  return options
};
goog.net.DefaultXmlHttpFactory.prototype.ieProgId_ = null;
goog.net.DefaultXmlHttpFactory.prototype.getProgId_ = function() {
  if(!this.ieProgId_ && typeof XMLHttpRequest == "undefined" && typeof ActiveXObject != "undefined") {
    var ACTIVE_X_IDENTS = ["MSXML2.XMLHTTP.6.0", "MSXML2.XMLHTTP.3.0", "MSXML2.XMLHTTP", "Microsoft.XMLHTTP"];
    for(var i = 0;i < ACTIVE_X_IDENTS.length;i++) {
      var candidate = ACTIVE_X_IDENTS[i];
      try {
        new ActiveXObject(candidate);
        this.ieProgId_ = candidate;
        return candidate
      }catch(e) {
      }
    }
    throw Error("Could not create ActiveXObject. ActiveX might be disabled," + " or MSXML might not be installed");
  }
  return this.ieProgId_
};
goog.net.XmlHttp.setGlobalFactory(new goog.net.DefaultXmlHttpFactory);
goog.provide("goog.net.xhrMonitor");
goog.require("goog.array");
goog.require("goog.debug.Logger");
goog.require("goog.userAgent");
goog.net.XhrMonitor_ = function() {
  if(!goog.userAgent.GECKO) {
    return
  }
  this.contextsToXhr_ = {};
  this.xhrToContexts_ = {};
  this.stack_ = []
};
goog.net.XhrMonitor_.getKey = function(obj) {
  return goog.isString(obj) ? obj : goog.isObject(obj) ? goog.getUid(obj) : ""
};
goog.net.XhrMonitor_.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.xhrMonitor");
goog.net.XhrMonitor_.prototype.enabled_ = goog.userAgent.GECKO;
goog.net.XhrMonitor_.prototype.setEnabled = function(val) {
  this.enabled_ = goog.userAgent.GECKO && val
};
goog.net.XhrMonitor_.prototype.pushContext = function(context) {
  if(!this.enabled_) {
    return
  }
  var key = goog.net.XhrMonitor_.getKey(context);
  this.logger_.finest("Pushing context: " + context + " (" + key + ")");
  this.stack_.push(key)
};
goog.net.XhrMonitor_.prototype.popContext = function() {
  if(!this.enabled_) {
    return
  }
  var context = this.stack_.pop();
  this.logger_.finest("Popping context: " + context);
  this.updateDependentContexts_(context)
};
goog.net.XhrMonitor_.prototype.isContextSafe = function(context) {
  if(!this.enabled_) {
    return true
  }
  var deps = this.contextsToXhr_[goog.net.XhrMonitor_.getKey(context)];
  this.logger_.fine("Context is safe : " + context + " - " + deps);
  return!deps
};
goog.net.XhrMonitor_.prototype.markXhrOpen = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Opening XHR : " + uid);
  for(var i = 0;i < this.stack_.length;i++) {
    var context = this.stack_[i];
    this.addToMap_(this.contextsToXhr_, context, uid);
    this.addToMap_(this.xhrToContexts_, uid, context)
  }
};
goog.net.XhrMonitor_.prototype.markXhrClosed = function(xhr) {
  if(!this.enabled_) {
    return
  }
  var uid = goog.getUid(xhr);
  this.logger_.fine("Closing XHR : " + uid);
  delete this.xhrToContexts_[uid];
  for(var context in this.contextsToXhr_) {
    goog.array.remove(this.contextsToXhr_[context], uid);
    if(this.contextsToXhr_[context].length == 0) {
      delete this.contextsToXhr_[context]
    }
  }
};
goog.net.XhrMonitor_.prototype.updateDependentContexts_ = function(xhrUid) {
  var contexts = this.xhrToContexts_[xhrUid];
  var xhrs = this.contextsToXhr_[xhrUid];
  if(contexts && xhrs) {
    this.logger_.finest("Updating dependent contexts");
    goog.array.forEach(contexts, function(context) {
      goog.array.forEach(xhrs, function(xhr) {
        this.addToMap_(this.contextsToXhr_, context, xhr);
        this.addToMap_(this.xhrToContexts_, xhr, context)
      }, this)
    }, this)
  }
};
goog.net.XhrMonitor_.prototype.addToMap_ = function(map, key, value) {
  if(!map[key]) {
    map[key] = []
  }
  if(!goog.array.contains(map[key], value)) {
    map[key].push(value)
  }
};
goog.net.xhrMonitor = new goog.net.XhrMonitor_;
goog.provide("goog.net.XhrIo");
goog.provide("goog.net.XhrIo.ResponseType");
goog.require("goog.Timer");
goog.require("goog.debug.Logger");
goog.require("goog.debug.entryPointRegistry");
goog.require("goog.debug.errorHandlerWeakDep");
goog.require("goog.events.EventTarget");
goog.require("goog.json");
goog.require("goog.net.ErrorCode");
goog.require("goog.net.EventType");
goog.require("goog.net.HttpStatus");
goog.require("goog.net.XmlHttp");
goog.require("goog.net.xhrMonitor");
goog.require("goog.object");
goog.require("goog.structs");
goog.require("goog.structs.Map");
goog.require("goog.uri.utils");
goog.net.XhrIo = function(opt_xmlHttpFactory) {
  goog.events.EventTarget.call(this);
  this.headers = new goog.structs.Map;
  this.xmlHttpFactory_ = opt_xmlHttpFactory || null
};
goog.inherits(goog.net.XhrIo, goog.events.EventTarget);
goog.net.XhrIo.ResponseType = {DEFAULT:"", TEXT:"text", DOCUMENT:"document", BLOB:"blob", ARRAY_BUFFER:"arraybuffer"};
goog.net.XhrIo.prototype.logger_ = goog.debug.Logger.getLogger("goog.net.XhrIo");
goog.net.XhrIo.CONTENT_TYPE_HEADER = "Content-Type";
goog.net.XhrIo.HTTP_SCHEME_PATTERN = /^https?:?$/i;
goog.net.XhrIo.FORM_CONTENT_TYPE = "application/x-www-form-urlencoded;charset=utf-8";
goog.net.XhrIo.sendInstances_ = [];
goog.net.XhrIo.send = function(url, opt_callback, opt_method, opt_content, opt_headers, opt_timeoutInterval) {
  var x = new goog.net.XhrIo;
  goog.net.XhrIo.sendInstances_.push(x);
  if(opt_callback) {
    goog.events.listen(x, goog.net.EventType.COMPLETE, opt_callback)
  }
  goog.events.listen(x, goog.net.EventType.READY, goog.partial(goog.net.XhrIo.cleanupSend_, x));
  if(opt_timeoutInterval) {
    x.setTimeoutInterval(opt_timeoutInterval)
  }
  x.send(url, opt_method, opt_content, opt_headers)
};
goog.net.XhrIo.cleanup = function() {
  var instances = goog.net.XhrIo.sendInstances_;
  while(instances.length) {
    instances.pop().dispose()
  }
};
goog.net.XhrIo.protectEntryPoints = function(errorHandler) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = errorHandler.protectEntryPoint(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
};
goog.net.XhrIo.cleanupSend_ = function(XhrIo) {
  XhrIo.dispose();
  goog.array.remove(goog.net.XhrIo.sendInstances_, XhrIo)
};
goog.net.XhrIo.prototype.active_ = false;
goog.net.XhrIo.prototype.xhr_ = null;
goog.net.XhrIo.prototype.xhrOptions_ = null;
goog.net.XhrIo.prototype.lastUri_ = "";
goog.net.XhrIo.prototype.lastMethod_ = "";
goog.net.XhrIo.prototype.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
goog.net.XhrIo.prototype.lastError_ = "";
goog.net.XhrIo.prototype.errorDispatched_ = false;
goog.net.XhrIo.prototype.inSend_ = false;
goog.net.XhrIo.prototype.inOpen_ = false;
goog.net.XhrIo.prototype.inAbort_ = false;
goog.net.XhrIo.prototype.timeoutInterval_ = 0;
goog.net.XhrIo.prototype.timeoutId_ = null;
goog.net.XhrIo.prototype.responseType_ = goog.net.XhrIo.ResponseType.DEFAULT;
goog.net.XhrIo.prototype.withCredentials_ = false;
goog.net.XhrIo.prototype.getTimeoutInterval = function() {
  return this.timeoutInterval_
};
goog.net.XhrIo.prototype.setTimeoutInterval = function(ms) {
  this.timeoutInterval_ = Math.max(0, ms)
};
goog.net.XhrIo.prototype.setResponseType = function(type) {
  this.responseType_ = type
};
goog.net.XhrIo.prototype.getResponseType = function() {
  return this.responseType_
};
goog.net.XhrIo.prototype.setWithCredentials = function(withCredentials) {
  this.withCredentials_ = withCredentials
};
goog.net.XhrIo.prototype.getWithCredentials = function() {
  return this.withCredentials_
};
goog.net.XhrIo.prototype.send = function(url, opt_method, opt_content, opt_headers) {
  if(this.xhr_) {
    throw Error("[goog.net.XhrIo] Object is active with another request");
  }
  var method = opt_method ? opt_method.toUpperCase() : "GET";
  this.lastUri_ = url;
  this.lastError_ = "";
  this.lastErrorCode_ = goog.net.ErrorCode.NO_ERROR;
  this.lastMethod_ = method;
  this.errorDispatched_ = false;
  this.active_ = true;
  this.xhr_ = this.createXhr();
  this.xhrOptions_ = this.xmlHttpFactory_ ? this.xmlHttpFactory_.getOptions() : goog.net.XmlHttp.getOptions();
  goog.net.xhrMonitor.markXhrOpen(this.xhr_);
  this.xhr_.onreadystatechange = goog.bind(this.onReadyStateChange_, this);
  try {
    this.logger_.fine(this.formatMsg_("Opening Xhr"));
    this.inOpen_ = true;
    this.xhr_.open(method, url, true);
    this.inOpen_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Error opening Xhr: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err);
    return
  }
  var content = opt_content || "";
  var headers = this.headers.clone();
  if(opt_headers) {
    goog.structs.forEach(opt_headers, function(value, key) {
      headers.set(key, value)
    })
  }
  if(method == "POST" && !headers.containsKey(goog.net.XhrIo.CONTENT_TYPE_HEADER)) {
    headers.set(goog.net.XhrIo.CONTENT_TYPE_HEADER, goog.net.XhrIo.FORM_CONTENT_TYPE)
  }
  goog.structs.forEach(headers, function(value, key) {
    this.xhr_.setRequestHeader(key, value)
  }, this);
  if(this.responseType_) {
    this.xhr_.responseType = this.responseType_
  }
  if(goog.object.containsKey(this.xhr_, "withCredentials")) {
    this.xhr_.withCredentials = this.withCredentials_
  }
  try {
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(this.timeoutInterval_ > 0) {
      this.logger_.fine(this.formatMsg_("Will abort after " + this.timeoutInterval_ + "ms if incomplete"));
      this.timeoutId_ = goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.timeout_, this), this.timeoutInterval_)
    }
    this.logger_.fine(this.formatMsg_("Sending request"));
    this.inSend_ = true;
    this.xhr_.send(content);
    this.inSend_ = false
  }catch(err) {
    this.logger_.fine(this.formatMsg_("Send error: " + err.message));
    this.error_(goog.net.ErrorCode.EXCEPTION, err)
  }
};
goog.net.XhrIo.prototype.createXhr = function() {
  return this.xmlHttpFactory_ ? this.xmlHttpFactory_.createInstance() : goog.net.XmlHttp()
};
goog.net.XhrIo.prototype.dispatchEvent = function(e) {
  if(this.xhr_) {
    goog.net.xhrMonitor.pushContext(this.xhr_);
    try {
      return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
    }finally {
      goog.net.xhrMonitor.popContext()
    }
  }else {
    return goog.net.XhrIo.superClass_.dispatchEvent.call(this, e)
  }
};
goog.net.XhrIo.prototype.timeout_ = function() {
  if(typeof goog == "undefined") {
  }else {
    if(this.xhr_) {
      this.lastError_ = "Timed out after " + this.timeoutInterval_ + "ms, aborting";
      this.lastErrorCode_ = goog.net.ErrorCode.TIMEOUT;
      this.logger_.fine(this.formatMsg_(this.lastError_));
      this.dispatchEvent(goog.net.EventType.TIMEOUT);
      this.abort(goog.net.ErrorCode.TIMEOUT)
    }
  }
};
goog.net.XhrIo.prototype.error_ = function(errorCode, err) {
  this.active_ = false;
  if(this.xhr_) {
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false
  }
  this.lastError_ = err;
  this.lastErrorCode_ = errorCode;
  this.dispatchErrors_();
  this.cleanUpXhr_()
};
goog.net.XhrIo.prototype.dispatchErrors_ = function() {
  if(!this.errorDispatched_) {
    this.errorDispatched_ = true;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ERROR)
  }
};
goog.net.XhrIo.prototype.abort = function(opt_failureCode) {
  if(this.xhr_ && this.active_) {
    this.logger_.fine(this.formatMsg_("Aborting"));
    this.active_ = false;
    this.inAbort_ = true;
    this.xhr_.abort();
    this.inAbort_ = false;
    this.lastErrorCode_ = opt_failureCode || goog.net.ErrorCode.ABORT;
    this.dispatchEvent(goog.net.EventType.COMPLETE);
    this.dispatchEvent(goog.net.EventType.ABORT);
    this.cleanUpXhr_()
  }
};
goog.net.XhrIo.prototype.disposeInternal = function() {
  if(this.xhr_) {
    if(this.active_) {
      this.active_ = false;
      this.inAbort_ = true;
      this.xhr_.abort();
      this.inAbort_ = false
    }
    this.cleanUpXhr_(true)
  }
  goog.net.XhrIo.superClass_.disposeInternal.call(this)
};
goog.net.XhrIo.prototype.onReadyStateChange_ = function() {
  if(!this.inOpen_ && !this.inSend_ && !this.inAbort_) {
    this.onReadyStateChangeEntryPoint_()
  }else {
    this.onReadyStateChangeHelper_()
  }
};
goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = function() {
  this.onReadyStateChangeHelper_()
};
goog.net.XhrIo.prototype.onReadyStateChangeHelper_ = function() {
  if(!this.active_) {
    return
  }
  if(typeof goog == "undefined") {
  }else {
    if(this.xhrOptions_[goog.net.XmlHttp.OptionType.LOCAL_REQUEST_ERROR] && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE && this.getStatus() == 2) {
      this.logger_.fine(this.formatMsg_("Local request error detected and ignored"))
    }else {
      if(this.inSend_ && this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE) {
        goog.Timer.defaultTimerObject.setTimeout(goog.bind(this.onReadyStateChange_, this), 0);
        return
      }
      this.dispatchEvent(goog.net.EventType.READY_STATE_CHANGE);
      if(this.isComplete()) {
        this.logger_.fine(this.formatMsg_("Request complete"));
        this.active_ = false;
        if(this.isSuccess()) {
          this.dispatchEvent(goog.net.EventType.COMPLETE);
          this.dispatchEvent(goog.net.EventType.SUCCESS)
        }else {
          this.lastErrorCode_ = goog.net.ErrorCode.HTTP_ERROR;
          this.lastError_ = this.getStatusText() + " [" + this.getStatus() + "]";
          this.dispatchErrors_()
        }
        this.cleanUpXhr_()
      }
    }
  }
};
goog.net.XhrIo.prototype.cleanUpXhr_ = function(opt_fromDispose) {
  if(this.xhr_) {
    var xhr = this.xhr_;
    var clearedOnReadyStateChange = this.xhrOptions_[goog.net.XmlHttp.OptionType.USE_NULL_FUNCTION] ? goog.nullFunction : null;
    this.xhr_ = null;
    this.xhrOptions_ = null;
    if(this.timeoutId_) {
      goog.Timer.defaultTimerObject.clearTimeout(this.timeoutId_);
      this.timeoutId_ = null
    }
    if(!opt_fromDispose) {
      goog.net.xhrMonitor.pushContext(xhr);
      this.dispatchEvent(goog.net.EventType.READY);
      goog.net.xhrMonitor.popContext()
    }
    goog.net.xhrMonitor.markXhrClosed(xhr);
    try {
      xhr.onreadystatechange = clearedOnReadyStateChange
    }catch(e) {
      this.logger_.severe("Problem encountered resetting onreadystatechange: " + e.message)
    }
  }
};
goog.net.XhrIo.prototype.isActive = function() {
  return!!this.xhr_
};
goog.net.XhrIo.prototype.isComplete = function() {
  return this.getReadyState() == goog.net.XmlHttp.ReadyState.COMPLETE
};
goog.net.XhrIo.prototype.isSuccess = function() {
  switch(this.getStatus()) {
    case 0:
      return!this.isLastUriEffectiveSchemeHttp_();
    case goog.net.HttpStatus.OK:
    ;
    case goog.net.HttpStatus.CREATED:
    ;
    case goog.net.HttpStatus.ACCEPTED:
    ;
    case goog.net.HttpStatus.NO_CONTENT:
    ;
    case goog.net.HttpStatus.NOT_MODIFIED:
    ;
    case goog.net.HttpStatus.QUIRK_IE_NO_CONTENT:
      return true;
    default:
      return false
  }
};
goog.net.XhrIo.prototype.isLastUriEffectiveSchemeHttp_ = function() {
  var lastUriScheme = goog.isString(this.lastUri_) ? goog.uri.utils.getScheme(this.lastUri_) : this.lastUri_.getScheme();
  if(lastUriScheme) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(lastUriScheme)
  }
  if(self.location) {
    return goog.net.XhrIo.HTTP_SCHEME_PATTERN.test(self.location.protocol)
  }else {
    return true
  }
};
goog.net.XhrIo.prototype.getReadyState = function() {
  return this.xhr_ ? this.xhr_.readyState : goog.net.XmlHttp.ReadyState.UNINITIALIZED
};
goog.net.XhrIo.prototype.getStatus = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.status : -1
  }catch(e) {
    this.logger_.warning("Can not get status: " + e.message);
    return-1
  }
};
goog.net.XhrIo.prototype.getStatusText = function() {
  try {
    return this.getReadyState() > goog.net.XmlHttp.ReadyState.LOADED ? this.xhr_.statusText : ""
  }catch(e) {
    this.logger_.fine("Can not get status: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getLastUri = function() {
  return String(this.lastUri_)
};
goog.net.XhrIo.prototype.getResponseText = function() {
  try {
    return this.xhr_ ? this.xhr_.responseText : ""
  }catch(e) {
    this.logger_.fine("Can not get responseText: " + e.message);
    return""
  }
};
goog.net.XhrIo.prototype.getResponseXml = function() {
  try {
    return this.xhr_ ? this.xhr_.responseXML : null
  }catch(e) {
    this.logger_.fine("Can not get responseXML: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseJson = function(opt_xssiPrefix) {
  if(!this.xhr_) {
    return undefined
  }
  var responseText = this.xhr_.responseText;
  if(opt_xssiPrefix && responseText.indexOf(opt_xssiPrefix) == 0) {
    responseText = responseText.substring(opt_xssiPrefix.length)
  }
  return goog.json.parse(responseText)
};
goog.net.XhrIo.prototype.getResponse = function() {
  try {
    if(!this.xhr_) {
      return null
    }
    if("response" in this.xhr_) {
      return this.xhr_.response
    }
    switch(this.responseType_) {
      case goog.net.XhrIo.ResponseType.DEFAULT:
      ;
      case goog.net.XhrIo.ResponseType.TEXT:
        return this.xhr_.responseText;
      case goog.net.XhrIo.ResponseType.ARRAY_BUFFER:
        if("mozResponseArrayBuffer" in this.xhr_) {
          return this.xhr_.mozResponseArrayBuffer
        }
    }
    this.logger_.severe("Response type " + this.responseType_ + " is not " + "supported on this browser");
    return null
  }catch(e) {
    this.logger_.fine("Can not get response: " + e.message);
    return null
  }
};
goog.net.XhrIo.prototype.getResponseHeader = function(key) {
  return this.xhr_ && this.isComplete() ? this.xhr_.getResponseHeader(key) : undefined
};
goog.net.XhrIo.prototype.getAllResponseHeaders = function() {
  return this.xhr_ && this.isComplete() ? this.xhr_.getAllResponseHeaders() : ""
};
goog.net.XhrIo.prototype.getLastErrorCode = function() {
  return this.lastErrorCode_
};
goog.net.XhrIo.prototype.getLastError = function() {
  return goog.isString(this.lastError_) ? this.lastError_ : String(this.lastError_)
};
goog.net.XhrIo.prototype.formatMsg_ = function(msg) {
  return msg + " [" + this.lastMethod_ + " " + this.lastUri_ + " " + this.getStatus() + "]"
};
goog.debug.entryPointRegistry.register(function(transformer) {
  goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_ = transformer(goog.net.XhrIo.prototype.onReadyStateChangeEntryPoint_)
});
goog.provide("clojure.browser.net");
goog.require("cljs.core");
goog.require("clojure.browser.event");
goog.require("goog.net.XhrIo");
goog.require("goog.net.EventType");
goog.require("goog.net.xpc.CfgFields");
goog.require("goog.net.xpc.CrossPageChannel");
goog.require("goog.json");
clojure.browser.net._STAR_timeout_STAR_ = 1E4;
clojure.browser.net.event_types = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__6903) {
  var vec__6904__6905 = p__6903;
  var k__6906 = cljs.core.nth.call(null, vec__6904__6905, 0, null);
  var v__6907 = cljs.core.nth.call(null, vec__6904__6905, 1, null);
  return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6906.toLowerCase()), v__6907])
}, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))));
void 0;
clojure.browser.net.IConnection = {};
clojure.browser.net.connect = function() {
  var connect = null;
  var connect__1 = function(this$) {
    if(function() {
      var and__3822__auto____6908 = this$;
      if(and__3822__auto____6908) {
        return this$.clojure$browser$net$IConnection$connect$arity$1
      }else {
        return and__3822__auto____6908
      }
    }()) {
      return this$.clojure$browser$net$IConnection$connect$arity$1(this$)
    }else {
      return function() {
        var or__3824__auto____6909 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6909) {
          return or__3824__auto____6909
        }else {
          var or__3824__auto____6910 = clojure.browser.net.connect["_"];
          if(or__3824__auto____6910) {
            return or__3824__auto____6910
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var connect__2 = function(this$, opt1) {
    if(function() {
      var and__3822__auto____6911 = this$;
      if(and__3822__auto____6911) {
        return this$.clojure$browser$net$IConnection$connect$arity$2
      }else {
        return and__3822__auto____6911
      }
    }()) {
      return this$.clojure$browser$net$IConnection$connect$arity$2(this$, opt1)
    }else {
      return function() {
        var or__3824__auto____6912 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6912) {
          return or__3824__auto____6912
        }else {
          var or__3824__auto____6913 = clojure.browser.net.connect["_"];
          if(or__3824__auto____6913) {
            return or__3824__auto____6913
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1)
    }
  };
  var connect__3 = function(this$, opt1, opt2) {
    if(function() {
      var and__3822__auto____6914 = this$;
      if(and__3822__auto____6914) {
        return this$.clojure$browser$net$IConnection$connect$arity$3
      }else {
        return and__3822__auto____6914
      }
    }()) {
      return this$.clojure$browser$net$IConnection$connect$arity$3(this$, opt1, opt2)
    }else {
      return function() {
        var or__3824__auto____6915 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6915) {
          return or__3824__auto____6915
        }else {
          var or__3824__auto____6916 = clojure.browser.net.connect["_"];
          if(or__3824__auto____6916) {
            return or__3824__auto____6916
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2)
    }
  };
  var connect__4 = function(this$, opt1, opt2, opt3) {
    if(function() {
      var and__3822__auto____6917 = this$;
      if(and__3822__auto____6917) {
        return this$.clojure$browser$net$IConnection$connect$arity$4
      }else {
        return and__3822__auto____6917
      }
    }()) {
      return this$.clojure$browser$net$IConnection$connect$arity$4(this$, opt1, opt2, opt3)
    }else {
      return function() {
        var or__3824__auto____6918 = clojure.browser.net.connect[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6918) {
          return or__3824__auto____6918
        }else {
          var or__3824__auto____6919 = clojure.browser.net.connect["_"];
          if(or__3824__auto____6919) {
            return or__3824__auto____6919
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.connect", this$);
          }
        }
      }().call(null, this$, opt1, opt2, opt3)
    }
  };
  connect = function(this$, opt1, opt2, opt3) {
    switch(arguments.length) {
      case 1:
        return connect__1.call(this, this$);
      case 2:
        return connect__2.call(this, this$, opt1);
      case 3:
        return connect__3.call(this, this$, opt1, opt2);
      case 4:
        return connect__4.call(this, this$, opt1, opt2, opt3)
    }
    throw"Invalid arity: " + arguments.length;
  };
  connect.cljs$lang$arity$1 = connect__1;
  connect.cljs$lang$arity$2 = connect__2;
  connect.cljs$lang$arity$3 = connect__3;
  connect.cljs$lang$arity$4 = connect__4;
  return connect
}();
clojure.browser.net.transmit = function() {
  var transmit = null;
  var transmit__2 = function(this$, opt) {
    if(function() {
      var and__3822__auto____6920 = this$;
      if(and__3822__auto____6920) {
        return this$.clojure$browser$net$IConnection$transmit$arity$2
      }else {
        return and__3822__auto____6920
      }
    }()) {
      return this$.clojure$browser$net$IConnection$transmit$arity$2(this$, opt)
    }else {
      return function() {
        var or__3824__auto____6921 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6921) {
          return or__3824__auto____6921
        }else {
          var or__3824__auto____6922 = clojure.browser.net.transmit["_"];
          if(or__3824__auto____6922) {
            return or__3824__auto____6922
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt)
    }
  };
  var transmit__3 = function(this$, opt, opt2) {
    if(function() {
      var and__3822__auto____6923 = this$;
      if(and__3822__auto____6923) {
        return this$.clojure$browser$net$IConnection$transmit$arity$3
      }else {
        return and__3822__auto____6923
      }
    }()) {
      return this$.clojure$browser$net$IConnection$transmit$arity$3(this$, opt, opt2)
    }else {
      return function() {
        var or__3824__auto____6924 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6924) {
          return or__3824__auto____6924
        }else {
          var or__3824__auto____6925 = clojure.browser.net.transmit["_"];
          if(or__3824__auto____6925) {
            return or__3824__auto____6925
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2)
    }
  };
  var transmit__4 = function(this$, opt, opt2, opt3) {
    if(function() {
      var and__3822__auto____6926 = this$;
      if(and__3822__auto____6926) {
        return this$.clojure$browser$net$IConnection$transmit$arity$4
      }else {
        return and__3822__auto____6926
      }
    }()) {
      return this$.clojure$browser$net$IConnection$transmit$arity$4(this$, opt, opt2, opt3)
    }else {
      return function() {
        var or__3824__auto____6927 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6927) {
          return or__3824__auto____6927
        }else {
          var or__3824__auto____6928 = clojure.browser.net.transmit["_"];
          if(or__3824__auto____6928) {
            return or__3824__auto____6928
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3)
    }
  };
  var transmit__5 = function(this$, opt, opt2, opt3, opt4) {
    if(function() {
      var and__3822__auto____6929 = this$;
      if(and__3822__auto____6929) {
        return this$.clojure$browser$net$IConnection$transmit$arity$5
      }else {
        return and__3822__auto____6929
      }
    }()) {
      return this$.clojure$browser$net$IConnection$transmit$arity$5(this$, opt, opt2, opt3, opt4)
    }else {
      return function() {
        var or__3824__auto____6930 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6930) {
          return or__3824__auto____6930
        }else {
          var or__3824__auto____6931 = clojure.browser.net.transmit["_"];
          if(or__3824__auto____6931) {
            return or__3824__auto____6931
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4)
    }
  };
  var transmit__6 = function(this$, opt, opt2, opt3, opt4, opt5) {
    if(function() {
      var and__3822__auto____6932 = this$;
      if(and__3822__auto____6932) {
        return this$.clojure$browser$net$IConnection$transmit$arity$6
      }else {
        return and__3822__auto____6932
      }
    }()) {
      return this$.clojure$browser$net$IConnection$transmit$arity$6(this$, opt, opt2, opt3, opt4, opt5)
    }else {
      return function() {
        var or__3824__auto____6933 = clojure.browser.net.transmit[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6933) {
          return or__3824__auto____6933
        }else {
          var or__3824__auto____6934 = clojure.browser.net.transmit["_"];
          if(or__3824__auto____6934) {
            return or__3824__auto____6934
          }else {
            throw cljs.core.missing_protocol.call(null, "IConnection.transmit", this$);
          }
        }
      }().call(null, this$, opt, opt2, opt3, opt4, opt5)
    }
  };
  transmit = function(this$, opt, opt2, opt3, opt4, opt5) {
    switch(arguments.length) {
      case 2:
        return transmit__2.call(this, this$, opt);
      case 3:
        return transmit__3.call(this, this$, opt, opt2);
      case 4:
        return transmit__4.call(this, this$, opt, opt2, opt3);
      case 5:
        return transmit__5.call(this, this$, opt, opt2, opt3, opt4);
      case 6:
        return transmit__6.call(this, this$, opt, opt2, opt3, opt4, opt5)
    }
    throw"Invalid arity: " + arguments.length;
  };
  transmit.cljs$lang$arity$2 = transmit__2;
  transmit.cljs$lang$arity$3 = transmit__3;
  transmit.cljs$lang$arity$4 = transmit__4;
  transmit.cljs$lang$arity$5 = transmit__5;
  transmit.cljs$lang$arity$6 = transmit__6;
  return transmit
}();
clojure.browser.net.close = function close(this$) {
  if(function() {
    var and__3822__auto____6935 = this$;
    if(and__3822__auto____6935) {
      return this$.clojure$browser$net$IConnection$close$arity$1
    }else {
      return and__3822__auto____6935
    }
  }()) {
    return this$.clojure$browser$net$IConnection$close$arity$1(this$)
  }else {
    return function() {
      var or__3824__auto____6936 = clojure.browser.net.close[goog.typeOf.call(null, this$)];
      if(or__3824__auto____6936) {
        return or__3824__auto____6936
      }else {
        var or__3824__auto____6937 = clojure.browser.net.close["_"];
        if(or__3824__auto____6937) {
          return or__3824__auto____6937
        }else {
          throw cljs.core.missing_protocol.call(null, "IConnection.close", this$);
        }
      }
    }().call(null, this$)
  }
};
void 0;
goog.net.XhrIo.prototype.clojure$browser$event$EventType$ = true;
goog.net.XhrIo.prototype.clojure$browser$event$EventType$event_types$arity$1 = function(this$) {
  return cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__6938) {
    var vec__6939__6940 = p__6938;
    var k__6941 = cljs.core.nth.call(null, vec__6939__6940, 0, null);
    var v__6942 = cljs.core.nth.call(null, vec__6939__6940, 1, null);
    return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6941.toLowerCase()), v__6942])
  }, cljs.core.merge.call(null, cljs.core.js__GT_clj.call(null, goog.net.EventType))))
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$ = true;
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit$arity$2 = function(this$, uri) {
  return clojure.browser.net.transmit.call(null, this$, uri, "GET", null, null, clojure.browser.net._STAR_timeout_STAR_)
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit$arity$3 = function(this$, uri, method) {
  return clojure.browser.net.transmit.call(null, this$, uri, method, null, null, clojure.browser.net._STAR_timeout_STAR_)
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit$arity$4 = function(this$, uri, method, content) {
  return clojure.browser.net.transmit.call(null, this$, uri, method, content, null, clojure.browser.net._STAR_timeout_STAR_)
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit$arity$5 = function(this$, uri, method, content, headers) {
  return clojure.browser.net.transmit.call(null, this$, uri, method, content, headers, clojure.browser.net._STAR_timeout_STAR_)
};
goog.net.XhrIo.prototype.clojure$browser$net$IConnection$transmit$arity$6 = function(this$, uri, method, content, headers, timeout) {
  this$.setTimeoutInterval(timeout);
  return this$.send(uri, method, content, headers)
};
clojure.browser.net.xpc_config_fields = cljs.core.into.call(null, cljs.core.ObjMap.fromObject([], {}), cljs.core.map.call(null, function(p__6943) {
  var vec__6944__6945 = p__6943;
  var k__6946 = cljs.core.nth.call(null, vec__6944__6945, 0, null);
  var v__6947 = cljs.core.nth.call(null, vec__6944__6945, 1, null);
  return cljs.core.PersistentVector.fromArray([cljs.core.keyword.call(null, k__6946.toLowerCase()), v__6947])
}, cljs.core.js__GT_clj.call(null, goog.net.xpc.CfgFields)));
clojure.browser.net.xhr_connection = function xhr_connection() {
  return new goog.net.XhrIo
};
void 0;
clojure.browser.net.ICrossPageChannel = {};
clojure.browser.net.register_service = function() {
  var register_service = null;
  var register_service__3 = function(this$, service_name, fn) {
    if(function() {
      var and__3822__auto____6948 = this$;
      if(and__3822__auto____6948) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service$arity$3
      }else {
        return and__3822__auto____6948
      }
    }()) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service$arity$3(this$, service_name, fn)
    }else {
      return function() {
        var or__3824__auto____6949 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6949) {
          return or__3824__auto____6949
        }else {
          var or__3824__auto____6950 = clojure.browser.net.register_service["_"];
          if(or__3824__auto____6950) {
            return or__3824__auto____6950
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn)
    }
  };
  var register_service__4 = function(this$, service_name, fn, encode_json_QMARK_) {
    if(function() {
      var and__3822__auto____6951 = this$;
      if(and__3822__auto____6951) {
        return this$.clojure$browser$net$ICrossPageChannel$register_service$arity$4
      }else {
        return and__3822__auto____6951
      }
    }()) {
      return this$.clojure$browser$net$ICrossPageChannel$register_service$arity$4(this$, service_name, fn, encode_json_QMARK_)
    }else {
      return function() {
        var or__3824__auto____6952 = clojure.browser.net.register_service[goog.typeOf.call(null, this$)];
        if(or__3824__auto____6952) {
          return or__3824__auto____6952
        }else {
          var or__3824__auto____6953 = clojure.browser.net.register_service["_"];
          if(or__3824__auto____6953) {
            return or__3824__auto____6953
          }else {
            throw cljs.core.missing_protocol.call(null, "ICrossPageChannel.register-service", this$);
          }
        }
      }().call(null, this$, service_name, fn, encode_json_QMARK_)
    }
  };
  register_service = function(this$, service_name, fn, encode_json_QMARK_) {
    switch(arguments.length) {
      case 3:
        return register_service__3.call(this, this$, service_name, fn);
      case 4:
        return register_service__4.call(this, this$, service_name, fn, encode_json_QMARK_)
    }
    throw"Invalid arity: " + arguments.length;
  };
  register_service.cljs$lang$arity$3 = register_service__3;
  register_service.cljs$lang$arity$4 = register_service__4;
  return register_service
}();
void 0;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect$arity$1 = function(this$) {
  return clojure.browser.net.connect.call(null, this$, null)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect$arity$2 = function(this$, on_connect_fn) {
  return this$.connect(on_connect_fn)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect$arity$3 = function(this$, on_connect_fn, config_iframe_fn) {
  return clojure.browser.net.connect.call(null, this$, on_connect_fn, config_iframe_fn, document.body)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$connect$arity$4 = function(this$, on_connect_fn, config_iframe_fn, iframe_parent) {
  this$.createPeerIframe(iframe_parent, config_iframe_fn);
  return this$.connect(on_connect_fn)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$transmit$arity$3 = function(this$, service_name, payload) {
  return this$.send(cljs.core.name.call(null, service_name), payload)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$IConnection$close$arity$1 = function(this$) {
  return this$.close(cljs.core.List.EMPTY)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$ = true;
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$register_service$arity$3 = function(this$, service_name, fn) {
  return clojure.browser.net.register_service.call(null, this$, service_name, fn, false)
};
goog.net.xpc.CrossPageChannel.prototype.clojure$browser$net$ICrossPageChannel$register_service$arity$4 = function(this$, service_name, fn, encode_json_QMARK_) {
  return this$.registerService(cljs.core.name.call(null, service_name), fn, encode_json_QMARK_)
};
clojure.browser.net.xpc_connection = function() {
  var xpc_connection = null;
  var xpc_connection__0 = function() {
    var temp__3974__auto____6954 = (new goog.Uri(window.location.href)).getParameterValue("xpc");
    if(cljs.core.truth_(temp__3974__auto____6954)) {
      var config__6955 = temp__3974__auto____6954;
      return new goog.net.xpc.CrossPageChannel(goog.json.parse.call(null, config__6955))
    }else {
      return null
    }
  };
  var xpc_connection__1 = function(config) {
    return new goog.net.xpc.CrossPageChannel(cljs.core.reduce.call(null, function(sum, p__6956) {
      var vec__6957__6958 = p__6956;
      var k__6959 = cljs.core.nth.call(null, vec__6957__6958, 0, null);
      var v__6960 = cljs.core.nth.call(null, vec__6957__6958, 1, null);
      var temp__3971__auto____6961 = cljs.core.get.call(null, clojure.browser.net.xpc_config_fields, k__6959);
      if(cljs.core.truth_(temp__3971__auto____6961)) {
        var field__6962 = temp__3971__auto____6961;
        var G__6963__6964 = sum;
        G__6963__6964[field__6962] = v__6960;
        return G__6963__6964
      }else {
        return sum
      }
    }, {}, config))
  };
  xpc_connection = function(config) {
    switch(arguments.length) {
      case 0:
        return xpc_connection__0.call(this);
      case 1:
        return xpc_connection__1.call(this, config)
    }
    throw"Invalid arity: " + arguments.length;
  };
  xpc_connection.cljs$lang$arity$0 = xpc_connection__0;
  xpc_connection.cljs$lang$arity$1 = xpc_connection__1;
  return xpc_connection
}();
goog.provide("clojure.browser.repl");
goog.require("cljs.core");
goog.require("clojure.browser.net");
goog.require("clojure.browser.event");
clojure.browser.repl.xpc_connection = cljs.core.atom.call(null, null);
clojure.browser.repl.repl_print = function repl_print(data) {
  var temp__3971__auto____6893 = cljs.core.deref.call(null, clojure.browser.repl.xpc_connection);
  if(cljs.core.truth_(temp__3971__auto____6893)) {
    var conn__6894 = temp__3971__auto____6893;
    return clojure.browser.net.transmit.call(null, conn__6894, "\ufdd0'print", cljs.core.pr_str.call(null, data))
  }else {
    return null
  }
};
clojure.browser.repl.evaluate_javascript = function evaluate_javascript(conn, block) {
  var result__6897 = function() {
    try {
      return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value"], {"\ufdd0'status":"\ufdd0'success", "\ufdd0'value":[cljs.core.str(eval(block))].join("")})
    }catch(e6895) {
      if(cljs.core.instance_QMARK_.call(null, Error, e6895)) {
        var e__6896 = e6895;
        return cljs.core.ObjMap.fromObject(["\ufdd0'status", "\ufdd0'value", "\ufdd0'stacktrace"], {"\ufdd0'status":"\ufdd0'exception", "\ufdd0'value":cljs.core.pr_str.call(null, e__6896), "\ufdd0'stacktrace":cljs.core.truth_(e__6896.hasOwnProperty("stack")) ? e__6896.stack : "No stacktrace available."})
      }else {
        if("\ufdd0'else") {
          throw e6895;
        }else {
          return null
        }
      }
    }
  }();
  return cljs.core.pr_str.call(null, result__6897)
};
clojure.browser.repl.send_result = function send_result(connection, url, data) {
  return clojure.browser.net.transmit.call(null, connection, url, "POST", data, null, 0)
};
clojure.browser.repl.send_print = function() {
  var send_print = null;
  var send_print__2 = function(url, data) {
    return send_print.call(null, url, data, 0)
  };
  var send_print__3 = function(url, data, n) {
    var conn__6898 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, conn__6898, "\ufdd0'error", function(_) {
      if(n < 10) {
        return send_print.call(null, url, data, n + 1)
      }else {
        return console.log([cljs.core.str("Could not send "), cljs.core.str(data), cljs.core.str(" after "), cljs.core.str(n), cljs.core.str(" attempts.")].join(""))
      }
    });
    return clojure.browser.net.transmit.call(null, conn__6898, url, "POST", data, null, 0)
  };
  send_print = function(url, data, n) {
    switch(arguments.length) {
      case 2:
        return send_print__2.call(this, url, data);
      case 3:
        return send_print__3.call(this, url, data, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  send_print.cljs$lang$arity$2 = send_print__2;
  send_print.cljs$lang$arity$3 = send_print__3;
  return send_print
}();
clojure.browser.repl.order = cljs.core.atom.call(null, 0);
clojure.browser.repl.wrap_message = function wrap_message(t, data) {
  return cljs.core.pr_str.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'type", "\ufdd0'content", "\ufdd0'order"], {"\ufdd0'type":t, "\ufdd0'content":data, "\ufdd0'order":cljs.core.swap_BANG_.call(null, clojure.browser.repl.order, cljs.core.inc)}))
};
clojure.browser.repl.start_evaluator = function start_evaluator(url) {
  var temp__3971__auto____6899 = clojure.browser.net.xpc_connection.call(null);
  if(cljs.core.truth_(temp__3971__auto____6899)) {
    var repl_connection__6900 = temp__3971__auto____6899;
    var connection__6901 = clojure.browser.net.xhr_connection.call(null);
    clojure.browser.event.listen.call(null, connection__6901, "\ufdd0'success", function(e) {
      return clojure.browser.net.transmit.call(null, repl_connection__6900, "\ufdd0'evaluate-javascript", e.currentTarget.getResponseText(cljs.core.List.EMPTY))
    });
    clojure.browser.net.register_service.call(null, repl_connection__6900, "\ufdd0'send-result", function(data) {
      return clojure.browser.repl.send_result.call(null, connection__6901, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'result", data))
    });
    clojure.browser.net.register_service.call(null, repl_connection__6900, "\ufdd0'print", function(data) {
      return clojure.browser.repl.send_print.call(null, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'print", data))
    });
    clojure.browser.net.connect.call(null, repl_connection__6900, cljs.core.constantly.call(null, null));
    return setTimeout(function() {
      return clojure.browser.repl.send_result.call(null, connection__6901, url, clojure.browser.repl.wrap_message.call(null, "\ufdd0'ready", "ready"))
    }, 50)
  }else {
    return alert("No 'xpc' param provided to child iframe.")
  }
};
clojure.browser.repl.connect = function connect(repl_server_url) {
  var repl_connection__6902 = clojure.browser.net.xpc_connection.call(null, cljs.core.ObjMap.fromObject(["\ufdd0'peer_uri"], {"\ufdd0'peer_uri":repl_server_url}));
  cljs.core.swap_BANG_.call(null, clojure.browser.repl.xpc_connection, cljs.core.constantly.call(null, repl_connection__6902));
  clojure.browser.net.register_service.call(null, repl_connection__6902, "\ufdd0'evaluate-javascript", function(js) {
    return clojure.browser.net.transmit.call(null, repl_connection__6902, "\ufdd0'send-result", clojure.browser.repl.evaluate_javascript.call(null, repl_connection__6902, js))
  });
  return clojure.browser.net.connect.call(null, repl_connection__6902, cljs.core.constantly.call(null, null), function(iframe) {
    return iframe.style.display = "none"
  })
};
goog.provide("two.repl");
goog.require("cljs.core");
goog.require("clojure.browser.repl");
two.repl.connect = function connect() {
  return clojure.browser.repl.connect.call(null, "http://localhost:9000/repl")
};
goog.exportSymbol("two.repl.connect", two.repl.connect);
goog.provide("two.hello");
goog.require("cljs.core");
two.hello.say_hello = function say_hello() {
  return alert("Hello world!")
};
goog.exportSymbol("two.hello.say_hello", two.hello.say_hello);
two.hello.add_some_numbers = function() {
  var add_some_numbers__delegate = function(numbers) {
    return cljs.core.apply.call(null, cljs.core._PLUS_, numbers)
  };
  var add_some_numbers = function(var_args) {
    var numbers = null;
    if(goog.isDef(var_args)) {
      numbers = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return add_some_numbers__delegate.call(this, numbers)
  };
  add_some_numbers.cljs$lang$maxFixedArity = 0;
  add_some_numbers.cljs$lang$applyTo = function(arglist__4451) {
    var numbers = cljs.core.seq(arglist__4451);
    return add_some_numbers__delegate(numbers)
  };
  add_some_numbers.cljs$lang$arity$variadic = add_some_numbers__delegate;
  return add_some_numbers
}();
