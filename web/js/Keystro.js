/**
 * @author Raphaël Benitte <benitteraphael@gmail.com>
 */
(function(global) {

  // map key code to symbol
  var keyCodeSymbols = {
    17: 'ctrl',
    18: 'alt',
    27: 'esc',
    32: 'space',
    37: 'left', 38: 'up', 39: 'right', 40: 'down',
    65: 'a', 66: 'b', 67: 'c', 68: 'd', 69: 'e', 70: 'f', 71: 'g', 72: 'h',
    73: 'i', 74: 'j', 75: 'k', 76: 'l', 77: 'm', 78: 'n', 79: 'o', 80: 'p',
    81: 'q', 82: 'r', 83: 's', 84: 't', 85: 'u', 86: 'v', 87: 'w', 88: 'x',
    89: 'y', 90: 'z'
  };
  var keyCodeToSymbol = function(keyCode) {
    if (!keyCodeSymbols[keyCode]) {
      //throw "Unknown keycode: " + keyCode;
      return 'undefined';
    }

    return keyCodeSymbols[keyCode];
  };

  /**
   * @constructor
   */
  var Keystro = function() {

    this.handlers = {};
    this.stack    = [];

    var self = this;

    window.onkeydown = function(event) {
      //console.log(event);

      var symbol = keyCodeToSymbol(event.keyCode);

      self.stack.push(symbol);

      var symbols = self.stack.slice(0).sort().join('+');

      if (self.handlers[symbols] && self.handlers[symbols].assert(event) === true) {
        self.handlers[symbols].fn(event);
      }
    };

    window.onkeyup = function(event) {
      self.stack.pop();
    };
  };

  /**
   * @param symbols
   * @param callback
   * @param options
   * @return Keystro
   */
  Keystro.prototype.on = function(symbols, callback, options) {

    options = options || {};
    symbols = symbols.split('+').sort().join('+');

    this.handlers[symbols] = {
      'fn':     callback,
      'assert': options.assert || function() {
        return true;
      }
    };

    return this;
  };

  global.Keystro = Keystro;

})(window);