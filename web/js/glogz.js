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
    65: 'a',
    66: 'b',
    67: 'c',
    68: 'd',
    69: 'e',
    70: 'f',
    72: 'h',
    73: 'i',
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
    this.logs    = logs;
    this.streams = streams;
    this.socket  = socket;

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
      'craftLogList':    $('.craft-log-list'),
      'craftButton':     $('.craft-button'),
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

      //console.log($activeElement, event.keyCode);

      if (!$activeElement.is('input')) {
        switch (keyCodeToChar(event.keyCode)) {
          case 'a':
            self.openPane('about');
            break;

          case 'c':
            self.openPane('craft');
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

          case 'x':
            self.closePanes();
            break;
        }
      } else {
        // esc
        if (event.keyCode == 27) {
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

    _.each(['craft', 'help', 'about'], function(paneName) {
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

    _.each(this.logs, function(log, logId) {
      log.color = colorRange(i);
      self.elements.logList.append('<li>' +
        '<span class="chip" style="background-color: ' + log.color + '"></span>' +
        log.name +
      '</li>');
      self.elements.craftLogList.append('<li>' + log.name + '</li>');
      i++;
    });

    _.each(this.streams, function(stream) {
      self.elements.streamList.append('<li>' + stream.name + '</li>');
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
  Glogz.prototype.setStream = function(streamName) {
    var streamLogs = this.streams[streamName].logs,
        self       = this;

    _.each(streamLogs, function(logName) {
      self.socket.on('log.' + logName, function(data) {
        data = data.split("\n");
        _.each(data, function(line) {
          self.elements.logs.append('<span class="log">' +
            '<span class="chip" style="background-color: ' + self.logs[logName].color + ';"></span>' +
            line +
          '</span>');
        });
      });
    });
  };

  global.Glogz = Glogz;

})(window);