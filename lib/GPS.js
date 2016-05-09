var readline = require('readline'),
  fs = require('fs'),
  async = require('async');

var GPS = function() {
  this.path = './logs/';
  this.locations = {};
};

GPS.prototype.load = function(callback) {
  var self = this;
  var logs = [];
  var files = fs.readdirSync(this.path);
  var i = 0;
  while (i < files.length) {
    if (files[i].indexOf('.gps') > -1) {
      logs.push(this.path + files[i]);
    }
    i++;
  }

  async.mapSeries(logs, function(log, callback) {
    self.readLog(log, callback);
  }, function(err, result) {
    self.keys = Object.keys(self.locations);

    var aux = 0;
    for (var i = 0; i < self.keys.length; i++) {
      if (parseInt(self.keys[i]) > aux) {
        aux = parseInt(self.keys[i]);
      } else {
        callback('Data not sorted!');
      }
    }

    callback();
  });
};


GPS.prototype.search = function(value) {
  var start = 0;
  var end = this.keys.length - 1;
  var mid = 0;

  while (true) {
    if (start > end) {
      break;
    }

    var midpoint = parseInt((start + end) / 2);
    mid = parseInt(this.keys[midpoint]);

    //console.log(start + ' - ' + end);
    //console.log(midpoint);

    if (value === mid) {
      break;
    } else if (value > mid) {
      start = midpoint + 1;
    } else {
      end = midpoint - 1;
    }
  }

  return this.locations[mid];
};

GPS.prototype.readLog = function(file, callback) {
  var self = this;

  console.log('Reading from file ' + file);

  var lineReader = readline.createInterface({
    input: require('fs').createReadStream(file)
  });

  lineReader.on('line', function(line) {
    //console.log('-------');
    //console.log(line);
    try {
      var data = JSON.parse(line.trim());
      var time = new Date(data.time);
      //console.log(time.getTime());
      //console.log(data);
      self.locations[time.getTime()] = data;
    } catch (e) {
      console.log(line);
    }
  });

  lineReader.on('close', function(line) {
    callback();
  });
};

module.exports = GPS;
