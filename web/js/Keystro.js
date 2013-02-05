/**
 * @author Raphaël Benitte <benitteraphael@gmail.com>
 */
(function(global) {

  var specialKeys = {
  	  8: 'backspace',  9: 'tab', 13: 'return', 16: 'shift', 17: 'ctrl', 18: 'alt', 19: 'pause',
  	 20: 'capslock', 27: 'esc', 32: 'space', 33: 'pageup', 34: 'pagedown', 35: 'end', 36: 'home',
  	 37: 'left', 38: 'up', 39: 'right', 40: 'down', 45: 'insert', 46: 'del',
  	 96: '0', 97: '1', 98: '2', 99: '3', 100: '4', 101: '5', 102: '6', 103: '7',
  	104: '8', 105: '9', 106: '*', 107: '+', 109: '-', 110: '.', 111 : '/',
  	112: 'f1', 113: 'f2', 114: 'f3', 115: 'f4', 116: 'f5', 117: 'f6', 118: 'f7', 119: 'f8',
  	120: 'f9', 121: 'f10', 122: 'f11', 123: 'f12', 144: 'numlock', 145: 'scroll', 188: ',', 190: '.',
  	191: '/', 224: 'meta'
  };

  var keyPrefix = function(event) {

    var prefix = '';

    if (event.altKey) {
 			prefix += 'alt.';
 		}
 		if (event.ctrlKey) {
       prefix += 'ctrl.';
 		}
 		if (event.shiftKey) {
       prefix += 'shift.';
 		}

    return prefix;
  };

  /**
   * @constructor
   */
  var Keystro = function() {

    this.handlers = {};

    var self = this;

    window.onkeydown = function(event) {
      //console.log(event);

      var key = specialKeys[event.which] ? specialKeys[event.which]
                                         : String.fromCharCode(event.which).toLowerCase();
      var combo = keyPrefix(event) + key;

      //console.log(combo);

      if (self.handlers[combo] && self.handlers[combo].assert(event) === true) {
        self.handlers[combo].fn(event);
      }
    };
  };

  /**
   * @param symbols
   * @param callback
   * @param options
   * @return Keystro
   */
  Keystro.prototype.on = function(key, callback, options) {

    options = options || {};

    this.handlers[key] = {
      'fn':     callback,
      'assert': options.assert || function() {
        return true;
      }
    };

    return this;
  };

  global.Keystro = Keystro;

})(window);