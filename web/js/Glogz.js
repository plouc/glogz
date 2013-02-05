/**
 * @author Raphaël Benitte <benitteraphael@gmail.com>
 */
(function(global) {

  // color setup
  var colors = [
    '#B1C6A9', '#EF9E7A', '#BAB254', '#ECCA53', '#664B45', '#D35530',
    '#6E874D', '#D84C4F', '#B58644', '#7CA49E', '#32302B', '#AF866D',
    '#807E4A', '#B28B3D', '#E49C52', '#9D7D50'
  ];
  var colorRange = d3.scale.ordinal().range(colors);

  /**
   * @param logs
   * @param streams
   * @param socket
   * @constructor
   */
  var Glogz = function(logs, streams, socket) {
    this.logs          = logs;
    this.watchedLogs   = [];
    this.streams       = streams;
    this.currentStream = null;
    this.socket        = socket;
    this.context       = null;
    this.contextScope  = null;
    this.keystro       = new Keystro();

    this.initElements()
        .build()
        .initHandlers();

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

    var assertNotInput = function(event) {
      return event.target.tagName != 'INPUT';
    };

    self.keystro
      .on('alt.a', function() {
        self.openPane('about');
      }, { assert: assertNotInput })
      .on('alt.c', function() {
        self.clear();
      }, { assert: assertNotInput })
      .on('alt.f', function(event) {
        event.preventDefault();
        self.elements.q.focus();
      }, { assert: assertNotInput })
      .on('alt.h', function() {
        self.openPane('help');
      }, { assert: assertNotInput })
      .on('alt.i', function() {
        self.toggleInfos();
      }, { assert: assertNotInput })
      .on('alt.l', function() {
        self.showInfos()
            .enterContext(self.elements.logList);
      }, { assert: assertNotInput })
      .on('alt.s', function() {
        self.showInfos()
            .enterContext(self.elements.streamList);
      }, { assert: assertNotInput })
      .on('space', function() {
        if (self.contextScope !== null && self.contextScope.is('.stream')) {
          var streamName = self.contextScope.attr('id').substr(7);
          self.setStream(streamName);
        }
      }, { assert: assertNotInput })
      .on('alt.t', function() {
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
      }, { assert: assertNotInput })
      .on('esc', function(event) {
        if (assertNotInput(event)) {
          if (self.context !== null) {
            self.leaveContext();
          }
        } else {
          self.elements.q.blur();
        }
      })
      .on('alt.x', function() {
        self.closePanes();
      }, { assert: assertNotInput })
      .on('up', function(event) {
        if (this.contextScope !== null) {
          event.preventDefault();
          self.contextPrev();
        }
      }, { assert: assertNotInput })
      .on('down', function(event) {
        if (this.contextScope !== null) {
          event.preventDefault();
          self.contextNext();
        }
      }, { assert: assertNotInput });


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

    _.each(this.logs, function(log) {
      //console.log('adding listener for log.' + log.name);
      self.socket.on('log.' + log.name, function(data) {
        if (_.indexOf(self.watchedLogs, log.name) >= 0) {
          //console.log('processing ' + log.name);
          data = data.split("\n");
          _.each(data, function(line) {
            self.elements.logs.append('<span class="log-line log-line-' + log.name + '">' +
              '<span class="chip" style="background-color: ' + self.logs[log.name].color + ';"></span>' +
              line +
            '</span>');
          });
        } else {
          //console.log('skipped ' + log.name);
        }
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
    this.elements.logs.find('.log-line').remove();

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

    if (streamName !== this.currentStream) {

      this.clear();

      this.watchedLogs = this.streams[streamName].logs;
      //console.log('set stream ' + streamName + ', ' + this.watchedLogs.join(', '));

      this.elements.streamList.find('li').removeClass('active');
      this.elements.streamList.find('#stream-' + streamName).addClass('active');

      var self = this;

      this.elements.logList.find('li').each(function() {

        var logName = $(this).attr('id').substr(4);
        if (_.indexOf(self.watchedLogs, logName) >= 0) {
          $(this).removeClass('disabled')
                 .find('.log-visibility')
                 .removeClass('hidden')
                 .removeClass('locked')
        } else {
          $(this).addClass('disabled')
                 .find('.log-visibility')
                 .removeClass('visible')
                 .removeClass('hidden')
                 .addClass('locked');
        }
      });
    }

    return this;
  };

  global.Glogz = Glogz;

})(window);