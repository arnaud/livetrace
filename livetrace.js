/**
 * Copyright (c) 2009 Arnaud Leymet
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Live Trace <http://github.com/arnaud/livetrace>
 * v0.1
 * Last update: 2009.11.29
 */

Array.prototype.contains = function (element) {
  for (var i in this) {
    if (this[i] == element) {
      return true;
    }
  }
  return false;
}

var livetrace = {
  /**
  * main method
  */
  init: function() {
    with(livetrace.h) {
      console.group("Live Trace activation");
      var functions = listAllFunctions(window, ["window"]);
      for(var f in functions) {
        wrapTracesToFunction(functions[f]);
      }
      console.groupEnd();
    }
  },
  /**
  * helpers (shouldn't be called directly)
  */
  h: {
    /**
    * lists all the functions of an object
    * @param object object in which functions will be listed (Object)
    * @param package location of the current object (Array)
    */
    listAllFunctions: function(object, package) {
      with(livetrace.h) {
        console.group("listAllFunctions", package.join("."));
        var functions = [];
        for (var name in object) {
          var e = object[name];
          if(typeof e === "function") {
            var fullName = package.join(".")+"."+name;
            if(!blacklisted_functions.contains(name) && !isNativeFn(e)) {
              functions.push({'name': fullName, 'reference': e, 'depth': package.length});
              console.log("added:", typeof e, fullName);
            }
          } else if(typeof e === "object") {
            if(!blacklisted_objects.contains(e) && e != livetrace) {
              var p = package.concat([name]);
              //console.log(">", p, e);
              functions = functions.concat(listAllFunctions(e, p));
            }
          }
        }
        console.groupEnd();
        return functions;
      }
    },
    /**
    * parses the function and retrieves the following information:
    * - name
    * - parameters
    * - has_parameters
    * - implementation
    * @param fn function reference
    * @throws: INVALID_FUNCTION
    */
    parseFunction: function(fn) {
      with(livetrace.h) {
        console.group("parseFunction", fn.name);
        if(fn == null || typeof fn !== "function") {
          console.groupEnd();
          throw("INVALID_FUNCTION");
        } else {
          var f = {};
          f.input = fn;
          // read the function's name
          try {
            f.name = fn.name;//regex_fn_name.exec(fn)[1];
          } catch(ex) {
            console.groupEnd();
            throw "INVALID_FUNCTION";
          }
          // read the function's parameters
          try {
            f.parameters = regex_fn_parameters.exec(fn)[1];
          } catch(ex) {
            f.parameters = [];
          }
          f.has_parameters = f.parameters != null && f.parameters.length > 0
          // read the function's implementation
          try {
            f.implementation = regex_fn_implementation.exec(fn)[1];
          } catch(ex) {
            console.groupEnd();
            throw "INVALID_FUNCTION";
          }
          console.groupEnd();
          return f;
        }
      }
    },
    /**
    * tests whether a function is native or not
    */
    isNativeFn: function(fn) {
      with(livetrace.h) {
        console.assert(typeof fn === "function");
        return regex_fn_native.exec(fn) != null;
      }
    },
    /**
    * some regular expressions
    */
    regex_fn_name:           /function\s+([^\(]*)\(/i,
    regex_fn_parameters:     /function\s+[^\(]*\(([^\)]+)\)/i,
    regex_fn_implementation: /function\s+[^\(]*\([^\)]+\)\s*\{([^$]+)\s*\}/i,
    regex_fn_native:         /(\[native\scode\])/i,
    /**
    * objects that shouldn't be followed
    */
    blacklisted_objects: [
      window.document, window.top, window.self, window.frames, window.opener, 
      window.parent, window.console, window.google, window.navigator, window.chrome, 
      window.chromium, window.external
    ],
    /**
    * functions that shouldn't be followed
    */
    blacklisted_functions: [
    ],
    /**
    * debug mode
    * - initialized with the 'livetrace_debug' variable
    * - this variable should be set to 'true' before calling the livetrace script
    */
    debug: typeof(livetrace_debug) !== 'undefined' && livetrace_debug,
    /**
    * extends the default console
    * - activation handled with the 'debug' variable
    */
    /*console: {
      group: function(p1, p2) {
        if(livetrace.h.debug) console.group(p1, p2);
      },
      groupEnd: function() {
        if(livetrace.h.debug) console.groupEnd();
      },
      assert: function(condition) {
        if(livetrace.h.debug) console.assert(condition);
      },
      log: function(p1, p2, p3) {
        if(livetrace.h.debug) console.log(p1, p2, p3);
      },
      info: function(p1, p2) {
        if(livetrace.h.debug) console.info(p1, p2);
      },
      error: function(p1) {
        console.error(p1);
      },
      warn: function(p1) {
        if(livetrace.h.debug) console.warn(p1);
      },
      debug: function(p1) {
        if(livetrace.h.debug) console.debug(p1);
      }
    },*/
    /**
    * generates spaces for producing proper indentation
    * @param depth
    */
    generateSpaces: function(depth) {
      var res = "";
      for(var i=0; i<depth; i++) {
        res += "  ";
      }
      return res;
    },
    /**
    * warps the functions in an implementation string code
    * @param fnInfo
    * @param code (String)
    */
    wrapTracesToFunctionInString: function(fnInfo, code) {
      return code.replace(/function/g, "console.timeEnd('"+fnInfo.name+"');console.groupEnd();\n  return");
    },
    /**
    * the method-entering instructions
    * @param fnInfo
    */
    entering: function(fnInfo) {
      with(livetrace.h) {
        var res = generateSpaces(fnInfo.depth);
        if(fnInfo.has_parameters) {
          res += "console.group(\""+fnInfo.name+"\", "+fnInfo.parameters+");\n";
        } else {
          res += "console.group(\""+fnInfo.name+"\");\n";
        }
        res += generateSpaces(fnInfo.depth)+"console.time(\""+fnInfo.name+"\");"
        return res;
      }
    },
    /**
    * the method-exiting instructions
    * @param fnInfo
    */
    exiting: function(fnInfo) {
      with(livetrace.h) {
        return "  console.timeEnd(\""+fnInfo.name+"\");\n"+generateSpaces(fnInfo.depth)+"console.groupEnd();\n};";
      }
    },
    /**
    * wraps the function implementation
    * @param fn structure containing: {'name', 'reference', 'depth'}
    */
    wrapTracesToFunction: function(fn) {
      with(livetrace.h) {
        //console.assert(fn != null);
        if(fn == null) return;
        console.group("wrapTracesToFunction", fn.name);
        try {
          var fnInfo = parseFunction(fn.reference);
        } catch(ex) {
          if(ex == "INVALID_FUNCTION") {
            console.error(ex);
          } else {
            console.error(ex);
          }
          console.groupEnd();
          return;
        }
        console.info("live trace activated for", fn.name);
        var cmd = fn.name+" = function "+/(?:.+\.)*([^\.]+)/i.exec(fn.name)[1]+" ("+fnInfo.parameters+") {\n";
        if(fnInfo.name == "") {
          fnInfo.name = fn.name;
        }
        fnInfo.depth = fn.depth;
        cmd += entering(fnInfo);
        //TODO rewrite the following line with something better
        cmd += fnInfo.implementation.replace(/return/g, "console.timeEnd(\""+fnInfo.name+"\");\n"+generateSpaces(fnInfo.depth)+"console.groupEnd();\n"+generateSpaces(fnInfo.depth)+"return");
        cmd += exiting(fnInfo);
        console.debug(cmd);
        eval(cmd);
        console.info("activated trace:", fn.name);
        console.groupEnd();
      }
    }
  }
}
livetrace.init();