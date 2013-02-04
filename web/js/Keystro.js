/**
 * @author Raphaël Benitte <benitteraphael@gmail.com>
 */
(function(global) {

  // map key code to symbol
  var keyCodeSymbols = {
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

    var self = this;

    var symbol;
    document.addEventListener('keydown', function(event) {

      symbol = keyCodeToSymbol(event.keyCode);

      if (self.handlers[symbol]) {
        self.handlers[symbol](event);
      }
      //var $activeElement = $(event.currentTarget.activeElement);
    });
  };

  /**
   * @param configurations
   * @return Keystro
   */
  Keystro.prototype.configure = function(configurations) {

    var self = this;

    _.each(configurations, function(configuration, symbol) {
      self.handlers[symbol] = configuration;
    });

    return this;
  };

  Keystro.prototype.on = function(symbols, callback) {

  };

  global.Keystro = Keystro;

})(window);