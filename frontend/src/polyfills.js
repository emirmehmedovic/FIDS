// Import browser detection
import browserInfo from './browser-detect';

// Only load heavy polyfills if needed
if (browserInfo.needsPolyfills || browserInfo.isTV) {
  // Import core-js polyfills
  require('core-js/stable');
  require('regenerator-runtime/runtime');
  require('whatwg-fetch');
  require('promise-polyfill/src/polyfill');
  console.log('Full polyfills loaded for compatibility');
} else {
  console.log('Browser is modern, loading minimal polyfills');
}

// WebOS 4.x specific polyfills and fixes
if (browserInfo.isWebOS4) {
  console.log('Loading WebOS 4.x specific polyfills and fixes');
  
  // Fix for WebOS 4.x XMLHttpRequest issues
  if (typeof window !== 'undefined' && window.XMLHttpRequest) {
    var originalXHROpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function() {
      // Apply original method
      originalXHROpen.apply(this, arguments);
      
      // Add error handler for WebOS 4.x
      this.onerror = this.onerror || function() {
        console.error('XHR error occurred');
      };
    };
  }
  
  // Fix for WebOS 4.x JSON parsing issues
  if (typeof window !== 'undefined' && window.JSON) {
    var originalJSONParse = window.JSON.parse;
    window.JSON.parse = function(text) {
      try {
        return originalJSONParse(text);
      } catch (e) {
        console.error('JSON parse error:', e);
        // Return empty object instead of crashing
        return {};
      }
    };
  }
  
  // Fix for WebOS 4.x setTimeout issues
  if (typeof window !== 'undefined') {
    var originalSetTimeout = window.setTimeout;
    window.setTimeout = function(callback, delay) {
      if (typeof callback !== 'function') {
        console.warn('setTimeout called with non-function callback');
        return originalSetTimeout(function() {}, delay);
      }
      return originalSetTimeout(callback, delay);
    };
  }
}

// String.prototype.padStart polyfill
if (!String.prototype.padStart) {
  String.prototype.padStart = function(targetLength, padString) {
    targetLength = targetLength >> 0; // truncate if number, or convert non-number to 0
    padString = String(typeof padString !== 'undefined' ? padString : ' ');
    if (this.length >= targetLength) {
      return String(this);
    } else {
      targetLength = targetLength - this.length;
      if (targetLength > padString.length) {
        padString += padString.repeat(targetLength / padString.length);
      }
      return padString.slice(0, targetLength) + String(this);
    }
  };
}

// String.prototype.repeat polyfill
if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    var result = '';
    while (count) {
      if (count & 1) {
        result += str;
      }
      count >>= 1;
      str += str;
    }
    return result;
  };
}

// Object.assign polyfill
if (typeof Object.assign !== 'function') {
  Object.assign = function(target) {
    'use strict';
    if (target === null || target === undefined) {
      throw new TypeError('Cannot convert undefined or null to object');
    }

    var to = Object(target);
    for (var index = 1; index < arguments.length; index++) {
      var nextSource = arguments[index];
      if (nextSource !== null && nextSource !== undefined) {
        for (var nextKey in nextSource) {
          if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
    return to;
  };
}

// Array.from polyfill
if (!Array.from) {
  Array.from = function(arrayLike, mapFn, thisArg) {
    if (arrayLike == null) {
      throw new TypeError('Array.from requires an array-like object');
    }
    
    var result = [];
    var len = arrayLike.length >>> 0;
    
    for (var i = 0; i < len; i++) {
      if (i in arrayLike) {
        var val = arrayLike[i];
        if (mapFn) {
          result[i] = mapFn.call(thisArg, val, i);
        } else {
          result[i] = val;
        }
      }
    }
    
    return result;
  };
}

// Array.find polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

// Array.includes polyfill
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this === null) {
      throw new TypeError('"this" is null or not defined');
    }

    var o = Object(this);
    var len = o.length >>> 0;

    if (len === 0) {
      return false;
    }

    var n = fromIndex | 0;
    var k = Math.max(n >= 0 ? n : len + n, 0);

    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }

    while (k < len) {
      if (sameValueZero(o[k], searchElement)) {
        return true;
      }
      k++;
    }

    return false;
  };
}

// Element.classList polyfill for IE9
// This is important for some TV browsers
(function() {
  if (typeof window !== 'undefined' && !("classList" in document.documentElement)) {
    var prototype = Array.prototype,
        push = prototype.push,
        splice = prototype.splice,
        join = prototype.join;

    function DOMTokenList(el) {
      this.el = el;
      var classes = el.className.replace(/^\s+|\s+$/g,'').split(/\s+/);
      for (var i = 0; i < classes.length; i++) {
        push.call(this, classes[i]);
      }
    }

    DOMTokenList.prototype = {
      add: function(token) {
        if(this.contains(token)) return;
        push.call(this, token);
        this.el.className = this.toString();
      },
      contains: function(token) {
        return this.el.className.indexOf(token) != -1;
      },
      item: function(index) {
        return this[index] || null;
      },
      remove: function(token) {
        if (!this.contains(token)) return;
        for (var i = 0; i < this.length; i++) {
          if (this[i] == token) break;
        }
        splice.call(this, i, 1);
        this.el.className = this.toString();
      },
      toString: function() {
        return join.call(this, ' ');
      },
      toggle: function(token) {
        if (!this.contains(token)) {
          this.add(token);
        } else {
          this.remove(token);
        }
        return this.contains(token);
      }
    };

    window.DOMTokenList = DOMTokenList;

    function defineElementGetter(obj, prop, getter) {
      if (Object.defineProperty) {
        Object.defineProperty(obj, prop, {
          get: getter
        });
      } else {
        obj.__defineGetter__(prop, getter);
      }
    }

    defineElementGetter(Element.prototype, 'classList', function() {
      return new DOMTokenList(this);
    });
  }
})();

// Console polyfill for TVs that might not have console
if (typeof window !== 'undefined' && !window.console) {
  window.console = {
    log: function() {},
    error: function() {},
    warn: function() {},
    info: function() {},
    debug: function() {}
  };
}

// requestAnimationFrame polyfill
if (typeof window !== 'undefined' && !window.requestAnimationFrame) {
  window.requestAnimationFrame = (function() {
    return window.requestAnimationFrame ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame ||
      function(callback) {
        window.setTimeout(callback, 1000 / 60);
      };
  })();
}

// Promise polyfill (additional to the one loaded conditionally above)
if (typeof window !== 'undefined' && !window.Promise) {
  console.log('Loading Promise polyfill');
  require('promise-polyfill/src/polyfill');
}

// Fetch polyfill (additional to the one loaded conditionally above)
if (typeof window !== 'undefined' && !window.fetch) {
  console.log('Loading fetch polyfill');
  require('whatwg-fetch');
}

console.log('Polyfills loaded successfully');
