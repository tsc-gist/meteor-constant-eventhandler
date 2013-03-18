;(function (window, undefined) {

  var xmod = {} 

  //+ getFreeGlobal :: a -> b
    , getFreeGlobal = function(_window) {
        var env_global = global
          , free_global = typeof env_global == 'object' && env_global;
        if (free_global.global === free_global) {
          return free_global;
        }
        return _window;
      }

//TODO omit noConflict and getFreeGlobal from exposure to env
  //+ exposeFunctionsToEnvironment :: a -> IO
    , exposeFunctionsToEnvironment = function(env) {
        var f, win, mod = this;
        win = this;
        env = env || win;
        for (f in mod) {
          if (f !== 'expose' && mod.hasOwnProperty(f)) {
            env[f] = mod[f];
          }
        }
      }

  //+ noConflict :: String -> b -> f
    , noConflict = function(conflicting_lib, _window) {
        return function() {
          _window[conflicting_lib] = _window[conflicting_lib]
          return this;
        };
      }

  //+ exportModule :: String -> Module -> IO
    , exportModule = function(name, my_module) {
        var define_exists = typeof define == 'function'
          , has_amd_property = define_exists ? typeof define.amd == 'object' && define.amd : false
          , using_AMD_loader = define_exists && has_amd_property
          , global_exports = typeof exports == 'object' && exports
          , global_module = typeof module == 'object' && module
          , using_nodejs_or_ringojs = global_module ? global_module.exports == global_exports : false
          ;

        if (using_AMD_loader) {
          // Expose module to the global object even when an AMD loader
          // is present, in case this module was injected by a third-party
          // script and not intended to be loaded as module. The global
          // assignment can be reverted in the module via its
          // "noConflict()" method.
          window[name] = my_module;

          // Define an anonymous AMD module
          define(function () { return my_module; });
        }

        // Check for "exports" after "define", in case a build optimizer adds
        // an "exports" object.
        else if (global_exports) {
          if (using_nodejs_or_ringojs) {
            global_module.exports = my_module;
          }
          else { // Narwhal or RingoJS v0.7.0-
            global_exports[name] = my_module;
          }
        }
        else { // browser or Rhino
          window[name] = my_module;
        }
      }
    ;

  xmod.getFreeGlobal = getFreeGlobal;
  xmod.expose = exposeFunctionsToEnvironment;
  xmod.noConflict = noConflict;
  exportModule('xmod', xmod);

}(this));
