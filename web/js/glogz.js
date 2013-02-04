(function(global) {

  // color setup
  var colors = [
    '#B1C6A9', '#EF9E7A', '#BAB254', '#ECCA53', '#664B45', '#D35530',
    '#6E874D', '#D84C4F', '#B58644', '#7CA49E', '#32302B', '#AF866D',
    '#807E4A', '#B28B3D', '#E49C52', '#9D7D50'
  ];
  var colorRange = d3.scale.ordinal().range(colors);

  // keyboard keys setup
  var keyCodeChars = {
    27: 'esc',
    32: 'space',
    37: 'left',
    38: 'up',
    39: 'right',
    40: 'down',
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    72: 'h',
    73: 'i',
    76: 'l',
    83: 's',
    84: 't',
    88: 'x',
    89: 'y',
    90: 'z'
  };
  var keyCodeToChar = function(keyCode) {

    return keyCodeChars[keyCode];
  };

  /**
   * @param logs
   * @param streams
   * @param socket
   * @constructor
   */
  var Glogz = function(logs, streams, socket) {
    this.logs         = logs;
    this.streams      = streams;
    this.socket       = socket;
    this.context      = null;
    this.contextScope = null;

    this.initElements()
        .initHandlers()
        .build();

    colorRange.domain([0, _.keys(this.logs).length]);
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.initElements = function() {
    this.elements = {
      'doc':             $(document),
      'body':            $('body'),
      'overlay':         $('.overlay'),
      'panes':           $('.pane'),
      'paneCloseBtns':   $('.pane-close'),
      'logs':            $('#logs'),
      'logList':         $('.log-list'),
      'streamList':      $('.stream-list'),
      'clearButton':     $('.clear-button'),
      'craftPane':       $('#craft'),
      'helpButton':      $('.help-button'),
      'helpPane':        $('#help'),
      'aboutButton':     $('.about-button'),
      'aboutPane':       $('#about'),
      'q':               $('.footer input'),
      'showInfosButton': $('.show-infos')
    };

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.initHandlers = function() {

    var self = this;

    this.elements.doc.keydown(function(event) {

      var $activeElement = $(event.currentTarget.activeElement);

      var keySymbol = keyCodeToChar(event.keyCode);

      if (!$activeElement.is('input')) {
        switch (keySymbol) {
          case 'a':
            self.openPane('about');
            break;

          case 'c':
            self.clear();
            break;

          case 'f':
            self.elements('q').focus();
            break;

          case 'h':
            self.openPane('help');
            break;

          case 'i':
            self.toggleInfos();
            break;

          case 'l':
            self.showInfos()
                .enterContext(self.elements.logList);
            break;

          case 's':
            self.showInfos()
                .enterContext(self.elements.streamList);
            break;

          case 'space':
            if (self.contextScope !== null && self.contextScope.is('.stream')) {
              var streamName = self.contextScope.attr('id').substr(7);
              self.setStream(streamName);
            }
            break;

          case 't':
            if (self.contextScope !== null && self.contextScope.is('.log')) {
              var logName = self.contextScope.attr('id').substr(4);
              if (!self.contextScope.hasClass('hidden')) {
                self.contextScope.addClass('hidden');
                self.hideLogs(logName);
              } else {
                self.contextScope.removeClass('hidden');
                self.showLogs(logName);
              }
            }
            break;

          case 'x':
            self.closePanes();
            break;

          case 'up':
            self.contextPrev();
            break;

          case 'down':
            self.contextNext();
            break;
        }
      } else {
        // esc
        if (keySymbol == 'esc') {
          self.elements.q.blur();
        }
      }
    });


    this.elements.paneCloseBtns.on('click', function() {
      self.closePanes();
    });

    this.elements.showInfosButton.on('click', function() {
      self.showInfos();
    });

    this.elements.clearButton.on('click', function() {
      self.clear();
    });

    _.each(['help', 'about'], function(paneName) {
      self.elements[paneName + 'Button'].on('click', function() {
        self.openPane(paneName);
      });
    });

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.build = function() {

    var i = 0, self = this;

    _.each(this.logs, function(log) {
      log.color = colorRange(i);
      self.elements.logList.append('<li class="log" id="log-' + log.name + '">' +
        '<span class="chip-cell">' +
          '<span class="chip" style="background-color: ' + log.color + '"></span>' +
        '</span>' +
        '<span class="log-visibility"></span>' +
        '<span class="log-name">' + log.name + '</span>' +
      '</li>');
      i++;
    });

    _.each(this.streams, function(stream) {
      var $stream = $('<li class="stream" id="stream-' + stream.name + '">' + stream.name + '</li>');
      $stream.on('click', function() {
        self.setStream(stream.name);
      });
      self.elements.streamList.append($stream);
    });

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.showInfos = function () {
    this.elements.body.removeClass('no-infos');

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.toggleInfos = function() {
    this.elements.body.toggleClass('no-infos');

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.closePanes = function() {
    this.elements.overlay.css('display', 'none');
    this.elements.panes.css('display', 'none');

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.openPane = function(paneId) {
    this.closePanes();
    this.elements.overlay.css('display', 'block');
    this.elements[paneId + 'Pane'].css('display', 'block');

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.clear = function() {
    this.elements.logs.find('.log').remove();

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.enterContext = function(context) {
    if (this.contextScope !== null) {
      this.contextScope.removeClass('has-scope');
    }

    this.context      = context;
    this.contextScope = this.context.find('> *:first-child');

    this.contextScope.addClass('has-scope')
                     .focus();

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.hideLogs = function(logName) {
    $('.log-line-' + logName).css('display', 'none');

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.showLogs = function(logName) {
    if (logName) {
      $('.log-line-' + logName).css('display', 'block');
    } else {
      $('.log-line').css('display', 'block');
    }

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.contextPrev = function() {
    if (this.contextScope !== null) {
      this.contextScope.removeClass('has-scope');

      var prev = this.contextScope.prev();
      if (prev.length) {
        this.contextScope = prev;
      } else {
        this.contextScope = this.contextScope.parent().find('> *:last-child');
      }

      this.contextScope.addClass('has-scope')
                       .focus();
    }

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.contextNext = function() {
    if (this.contextScope !== null) {
      this.contextScope.removeClass('has-scope');

      var next = this.contextScope.next();
      if (next.length) {
        this.contextScope = next;
      } else {
        this.contextScope = this.contextScope.parent().find('> *:first-child');
      }

      this.contextScope.addClass('has-scope')
                       .focus();
    }

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.leaveContext = function() {
    this.contextScope.removeClass('has-scope');

    this.context      = null;
    this.contextScope = null;

    return this;
  };

  /**
   * @return Glogz
   */
  Glogz.prototype.setStream = function(streamName) {
    var streamLogs = this.streams[streamName].logs,
        self       = this;

    this.elements.streamList.find('li').removeClass('active');
    this.elements.streamList.find('#stream-' + streamName).addClass('active');

    this.elements.logList.find('li').each(function() {
      $(this).addClass('disabled')
             .find('.log-visibility')
             .removeClass('visible')
             .removeClass('hidden')
             .addClass('locked')
    });

    _.each(this.logs, function(logName) {
      self.socket.removeListener('log.' + logName);
    });

    _.each(streamLogs, function(logName) {

      $('#log-' + logName).removeClass('disabled');

      self.socket.on('log.' + logName, function(data) {
        data = data.split("\n");
        _.each(data, function(line) {
          self.elements.logs.append('<span class="log-line log-line-' + logName + '">' +
            '<span class="chip" style="background-color: ' + self.logs[logName].color + ';"></span>' +
            line +
          '</span>');
        });
      });
    });
  };

  global.Glogz = Glogz;

})(window);