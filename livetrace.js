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
 * Last update: 2009.11.28
 */

var livetrace = {
  /**
  * main method
  */
  init: function() {
    console.group("Live Trace activation");
    var functions = livetrace.h.listAllFunctions(window);
    for(var f in functions) {
      livetrace.h.wrapTracesToFunction(functions[f]);
    }
    console.groupEnd();
  },
  /**
  * helpers
  */
  h: {
    /**
    * lists all the functions of an object
    */
    listAllFunctions: function(object) {
      console.group("listAllFunctions", object);
      var functions = [];
      for (var name in object) {
        var e = object[name];
        console.log("listAllFunctions", name, typeof e, e);
        if(typeof e == "function") {
          try {
            functions.push(e);
          } catch(ex) {
            if(ex=="INVALID_FUNCTION") {
              console.error(ex);
            } else {
              console.error(ex);
            }
          }
        } else if(typeof e == "object") {
          console.warn(typeof e, e);
          //if(
          //functions.concat(livetrace.h.listAllFunctions(e));
        }
      }
      console.groupEnd();
      return functions;
    },
    /**
    * parses the function and retrieves the following information:
    * - name
    * - parameters
    * - has_parameters
    * - implementation
    * @throws: INVALID_FUNCTION
    */
    parseFunction: function(fn) {
      console.group("parseFunction", fn.name);
      if(fn == null || typeof fn != "function") {
        console.groupEnd();
        throw("INVALID_FUNCTION");
      } else {
        var f = {};
        f.input = fn;
        // read the function's name
        try {
          f.name = fn.name;///function\s+([^\(]+)\(/i.exec(fn)[1];
        } catch(ex) {
          f.name = "";
        }
        // read the function's parameters
        try {
          f.parameters = /function\s+[^\(]+\(([^\)]+)\)/i.exec(fn)[1];//.split(",");
        } catch(ex) {
          f.parameters = [];
        }
        f.has_parameters = f.parameters != null && f.parameters.size > 0
        // read the function's implementation
        try {
          f.implementation = /function\s+[^\(]+\([^\)]+\)\s*\{([^$]+)\s*\}/i.exec(fn)[1];
          //f.implementation = livetrace.h.
        } catch(ex) {
          // couldn't parse function's implementation
          f.implementation = null;
        }
        console.groupEnd();
        if(f.name == "" || f.implementation == null) {
          throw "INVALID_FUNCTION";
        }
        return f;
      }
    },
    /**
    * wraps the function implementation
    */
    wrapTracesToFunction: function(fn) {
      var fnInfo = livetrace.h.parseFunction(fn);
      console.group("wrapTracesToFunction", fnInfo.name);
      if(fnInfo.name != "TODO") {//TODO handle functions that shouldn't be overwritten
        //TODO handle fnInfo.has_parameters
        var cmd = fnInfo.name+" = function("+fnInfo.parameters+") {\n  console.group('"+fnInfo.name+"'); "+fnInfo.implementation+"  console.groupEnd();\n};";
        console.debug(cmd);
        eval(cmd);
      }
      console.groupEnd();
    }
  }
}
livetrace.init();