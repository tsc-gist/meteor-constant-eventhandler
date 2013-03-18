;(function (window, global_exports, undefined) {

  var functional = {}

  //+ xmod :: Module
    , xmod = global_exports ? require('xmod') : window.xmod

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

  // TODO see if '_' can be removed without breaking partial() function
  //- _ :: used for partial() function
    , __ = Function.__ = {}

  //+ slice :: create local reference for faster look-up
    , slice = Array.prototype.slice

  //+ toArray :: a -> [b]
    , toArray = function (x) {
        return slice.call(x);
      }
  
  //- from wu.js <http://fitzgen.github.com/wu.js/>
  //+ curry :: f -> ? -> g
    , curry = function (fn /* variadic number of args */) {
        var args = slice.call(arguments, 1);
        return function () {
          return fn.apply(this, args.concat(toArray(arguments)));
        };
      }

  //- from wu.js <http://fitzgen.github.com/wu.js/>
  //+ autoCurry :: f -> Int -> g
    , autoCurry = function (fn, numArgs) {
        numArgs = numArgs || fn.length;
        var f = function () {
          if (arguments.length < numArgs) {
            return numArgs - arguments.length > 0 ?
              autoCurry(curry.apply(this, [fn].concat(toArray(arguments))),
                numArgs - arguments.length) :
              curry.apply(this, [fn].concat(toArray(arguments)));
          }
          else {
            return fn.apply(this, arguments);
          }
        };
        f.toString = function(){ return fn.toString(); };
        f.curried = true;
        return f;
      }

  //+ decorateFunctionPrototypeWithAutoCurry :: IO
    , decorateFunctionPrototypeWithAutoCurry = (function () {
        Function.prototype.autoCurry = function (n) {
          return autoCurry(this, n);
        };
      })()

  //+ map :: f -> [a] -> [b]
    , map = function (fn, sequence) {
        var length = sequence.length,
            result = new Array(length),
            i;
        fn = Function.toFunction(fn);
        for (i = 0; i < length; i++) {
          result[i] = fn.apply(null, [sequence[i], i]);
        }
        return result;
      }.autoCurry()

  //+ compose :: f -> g -> h 
    , compose = function () {
        var fns = map(Function.toFunction, arguments),
            arglen = fns.length;
        return function () {
          var i;
          for (i = arglen; --i>=0;) {
            arguments = [fns[i].apply(this, arguments)];
          }
          return arguments[0];
        };
      }

  //+ sequence :: f -> g -> h
    , sequence = function () {
        var fns = map(Function.toFunction, arguments),
            arglen = fns.length;
        return function () {
          var i;
          for (i = 0; i < arglen; i++) {
            arguments = [fns[i].apply(this, arguments)];
          }
          return arguments[0];
        };
      }

  //+ memoize :: f -> g
    , memoize = function (fn) {  
        return function () {  
            var args = Array.prototype.slice.call(arguments),  
                hash = "",  
                i = args.length;  
            currentArg = null;  
            while (i--) {  
                currentArg = args[i];  
                hash += (currentArg === Object(currentArg)) ?  
                JSON.stringify(currentArg) : currentArg;  
                fn.memoize || (fn.memoize = {});  
            }  
            return (hash in fn.memoize) ? fn.memoize[hash] :  
            fn.memoize[hash] = fn.apply(this, args);  
        };  
      }

  //+ reduce :: f -> a -> [a] -> a
    , reduce = function (fn,init,sequence) {
        var len = sequence.length,
            result = init,
            i;
        fn = Function.toFunction(fn);
        for(i = 0; i < len; i++) {
          result = fn.apply(null, [result, sequence[i]]);
        }
        return result;
      }.autoCurry()

  //+ select :: f -> [a] -> [a]
    , select = function (fn, sequence) {
        var len = sequence.length,
            result = [],
            i, x;
        fn = Function.toFunction(fn);
        for(i = 0; i < len; i++) {
          x = sequence[i];
          fn.apply(null, [x, i]) && result.push(x);
        }
        return result;
      }.autoCurry()

  //+ guard :: (_ -> Bool) -> f -> g -> h
    , guard = function (guard, fn, otherwise) {
        guard = Function.toFunction(guard || I);
        fn = Function.toFunction(fn);
        otherwise = Function.toFunction(otherwise || I);
        return function () {
          return (guard.apply(this, arguments) ? fn : otherwise)
            .apply(this, arguments);
        };
      }.autoCurry()

  //+ flip :: f -> g 
    , flip = function(f) {
        return function () {
          var args = slice.call(arguments, 0);
          args = args.slice(1, 2)
                .concat(args.slice(0, 1))
                .concat(args.slice(2));
          return f.apply(null, args);
        };
      }

  //+ foldr :: f -> a -> [a] -> a
    , foldr = function (fn, init, sequence) {
        var len = sequence.length,
            result = init,
            i;
        fn = Function.toFunction(fn);
        for(i = len; --i >= 0;) {
          result = fn.apply(null, [sequence[i],result]);
        }
        return result;
      }.autoCurry()

  //+ and :: _ -> (_ -> Bool)
    , and = function () {
        var args = map(Function.toFunction, arguments),
            arglen = args.length;
        return function () {
          var value = true, i;
          for (i = 0; i < arglen; i++) {
            if(!(value = args[i].apply(this, arguments)))
              break;
          }
          return value;
        };
      }

  //+ or :: _ -> (_ -> Bool)
    , or = function () {
        var args = map(Function.toFunction, arguments),
            arglen = args.length;
        return function () {
          var value = false, i;
          for (i = 0; i < arglen; i++) {
            if ((value = args[i].apply(this, arguments)))
              break;
          }
          return value;
        };
      }

  //+ some :: f -> [a] -> Bool
    , some = function (fn, sequence) {
        fn = Function.toFunction(fn);
        var len = sequence.length,
            value = false,
            i;
        for (i = 0; i < len; i++) {
          if ((value = fn.call(null, sequence[i])))
            break;
        }
        return value;
      }.autoCurry()

  //+ every :: f -> [a] -> Bool
    , every = function (fn, sequence) {
        fn = Function.toFunction(fn);
        var len = sequence.length,
            value = true,
            i;
        for (i = 0; i < len; i++) {
          if (!(value = fn.call(null, sequence[i])))
            break;
        }
        return value;
      }.autoCurry()

  //+ not :: f -> (_ -> Bool)
    , not = function (fn) {
        fn = Function.toFunction(fn);
        return function () {
          return !fn.apply(null, arguments);
        };
      }

  //+ equal :: _ -> (_ -> Bool)
    , equal = function () {
        var arglen = arguments.length,
            args = map(Function.toFunction, arguments);
        if (!arglen) {
          return K(true);
        }
        return function () {
          var value = args[0].apply(this, arguments),
              i;
          for (i = 1; i < arglen; i++){
            if (value != args[i].apply(this, args))
              return false;
          }
          return true;
        };
      }

  //+ lamda :: a -> f
    , lambda = function (object) { 
        return object.toFunction(); 
      }

  //+ invoke :: String -> (a -> b)
    , invoke = function (methodName) { 
        var args = slice.call(arguments, 1);
        return function(object) {
          return object[methodName].apply(object, slice.call(arguments, 1).concat(args));
        };
      }

  //+ pluck :: String -> a -> b
    , pluck = function (name, obj) {
        return obj[name];
      }.autoCurry()

  //+ until :: a -> f -> (b -> c)
    , until = function (pred, fn) {
        fn = Function.toFunction(fn);
        pred = Function.toFunction(pred);
        return function (value) {
          while (!pred.call(null, value)) {
            value = fn.call(null, value);
          }
          return value;
        }
      }.autoCurry()

  //+ zip :: (List ...) => [a] -> [b] -> ... -> [[a, b, ...]]
    , zip = function() {
        var n = Math.min.apply(null, map('.length',arguments)),
            results = new Array(n),
            key, i;
        for (i = 0; i < n; i++) {
          key = String(i);
          results[key] = map(pluck(key), arguments);
        };
        return results;
      }

  //+ I :: a -> a
    , I = function(x) { return x }

  //+ K :: a -> (_ -> a)
    , K = function(x) { return function () { return x } }
      
  //+ S :: f -> g -> (_ -> b)
    , S = function(f, g) {
        var toFunction = Function.toFunction;
        f = toFunction(f);
        g = toFunction(g);
        return function () { 
          var return_value_of_g = g.apply(this, arguments)
            , original_args = slice.call(arguments, 0)
            , all_args = [return_value_of_g].concat(original_args);
          return f.apply(this, all_args);
        };
      }

  //+ partial :: _ -> f
    , partial = function() {
        var fn = this
          , __ = Function.__
          , args = slice.call(arguments, 0)
          , subpos = []
          , i
          , value
          ;

        for(i = 0; i < arguments.length; i++) {
          arguments[i] == __ && subpos.push(i);
        }

        return function () {
          var specialized = args.concat(slice.call(arguments, subpos.length)),
              i;
          for (i = 0; i < Math.min(subpos.length, arguments.length); i++) {
            specialized[subpos[i]] = arguments[i];
          }
          for (i = 0; i < specialized.length; i++) {
            if (specialized[i] == _) {
              return fn.partial.apply(fn, specialized);
            }
          } 
          return fn.apply(this,specialized);
        };
      }

  //+ decorateFunctionPrototypeWithPartial :: IO
    , decorateFunctionPrototypeWithPartial = (function() {
        Function.prototype.partial = partial;
        Function.prototype.p = partial;
      }())
  
  //+ decorateFunctionWithToFunction :: IO
    , decorateFunctionWithToFunction = (function() {
        Function.toFunction = function(value) {return value.toFunction();}
        Function.prototype.toFunction = function() { return this; }
      }())

  //+ ECMAsplit :: String -> Int -> String 
    , ECMAspit = function(separator, limit) {
        if (typeof limit != 'undefined') {
          throw "ECMAsplit: limit is unimplemented";
        }
        var result = this.split.apply(this, arguments)
          , re = RegExp(separator)
          , savedIndex = re.lastIndex
          , match = re.exec(this)
          ;
        if (match && match.index == 0) {
          result.unshift('');
        }
        re.lastIndex = savedIndex;
        return result;
      }

  //+ stringLambda :: _ -> f
    , stringLambda = function() {
        var params = [],
            expr = this,
            sections = expr.ECMAsplit(/\s*->\s*/m);
        if (sections.length > 1) {
          while (sections.length) {
            expr = sections.pop();
            params = sections.pop().split(/\s*,\s*|\s+/m);
            sections.length && sections.push('(function('+params+'){return ('+expr+')})');
          }
        } else if (expr.match(/\b_\b/)) {
          params = '_';
        } else {
          var leftSection = expr.match(/^\s*(?:[+*\/%&|\^\.=<>]|!=)/m)
            , rightSection = expr.match(/[+\-*\/%&|\^\.=<>!]\s*$/m)
            ;
          if (leftSection || rightSection) {
            if (leftSection) {
              params.push('$1');
              expr = '$1'+expr;
            }
            if (rightSection) {
              params.push('$2');
              expr = expr+'$2';
            }
          } else {
            var regex = /(?:\b[A-Z]|\.[a-zA-Z_$])[a-zA-Z_$\d]*|[a-zA-Z_$][a-zA-Z_$\d]*\s*:|this|arguments|'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"/g
              , vars = this.replace(regex,'').match(/([a-z_$][a-z_$\d]*)/gi) || [];
            for (var i = 0,v; v = vars[i++];)
              params.indexOf(v)>=0||params.push(v);
          }
        }
        return new Function(params,'return ('+expr+')');
      }

  //+ cacheStringLambda :: IO
    , cacheStringLambda = function() {
        var proto = String.prototype,
            cache = {},
            uncached = proto.lambda,
            cached;
        cached = function () {
          var key = '#' + this;
          return cache[key] || (cache[key] = uncached.call(this));
        };
        cached.cached = function () {};
        cached.uncache = function () { proto.lambda = uncached };
        proto.lambda = cached;
      }

  //+ stringToFunction :: _ -> f
    , stringToFunction = function() {
        var body = this;
        if (body.match(/\breturn\b/)) {
          return new Function(this);
        }
        return this.lambda();
      }

  //+ decorateStringPrototypeWithLambda :: IO
    , decorateStringPrototypeWithLambda = (function() {
        String.prototype.lambda = stringLambda;
        String.prototype.lambda.cache = cacheStringLambda;
        String.prototype.toFunction = stringToFunction;
        String.prototype.ECMAsplit = (
          'ab'.split(/a*/).length > 1 ? String.prototype.split : ECMAsplit
        );
      }())
    ;
  
  // Add public functions to the module namespace,
  functional.partial = partial;
  functional.map = map;
  functional.compose = compose;
  functional.sequence = sequence;
  functional.memoize = memoize;
  functional.reduce = reduce;
  functional.foldl = reduce;
  functional.select = select;
  functional.filter = select;
  functional.guard = guard;
  functional.flip = flip;
  functional.foldr = foldr;
  functional.and = and;
  functional.and_ = and; // alias reserved word for coffeescript
  functional.or = or;
  functional.or_ = or; // alias reserved word for coffeescript
  functional.some = some;
  functional.every = every;
  functional.not = not;
  functional.not_ = not; // alias reserved word for coffeescript
  functional.equal = equal;
  functional.lambda = lambda;
  functional.invoke = invoke;
  functional.pluck = pluck;
  functional.until = until
  functional.until_ = until; // alias reserved word for coffeescript
  functional.zip = zip;
  functional.I = I;
  functional.id = I;
  functional.K = K;
  functional.konst = K;
  functional.S = S;

  // Attach references to helper functions and then export the module
  functional.expose = xmod.expose;
  //functional.noConflict = xmod.noConflict('functional', window);
  exportModule('functional', functional);

}(this, typeof exports == 'object' && exports));
