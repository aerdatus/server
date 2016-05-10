var readline = require('readline'),
  fs = require('fs'),
  async = require('async'),
  GPSImporter = require('./GPSImporter'),
  distance = require('gps-distance'),
  colors = require('colors'),
  MongoClient = require('mongodb').MongoClient,
  ObjectId = require('mongodb').ObjectID;

var SignalImporter = function(path) {
  this.path = path;
};

SignalImporter.prototype.start = function(callback) {
  var self = this;

  MongoClient.connect('mongodb://127.0.0.1:27017/probe', function(err, db) {
    self.nodes = db.collection('nodes');
    self.stations = db.collection('stations');

    self.gps = new GPSImporter(self.path);
    self.gps.load(function() {
      console.log('GPS data loaded!'.green);
      self.load(callback);
    });
  });
};

SignalImporter.prototype.load = function(callback) {
  var self = this;
  var logs = [];

  var files = fs.readdirSync(this.path);
  var i = 0;
  var len = files.length;
  while (i < len) {
    if (files[i].indexOf('.pr') > -1) {
      logs.push(this.path + files[i]);
    }
    i++;
  }

  async.mapSeries(logs, function(log, icallback) {
    self.readLog(log, icallback);
  }, function(err, result) {
    console.log('DONE!'.green);
    if (callback) callback();
  });
};


SignalImporter.prototype.readLog = function(file, callback) {
  var self = this;

  var timestamp = parseInt(file.replace('.pr', '').split('_')[1]);
  var location = this.gps.search(timestamp);
  var timeDiff = Math.abs(new Date(location.time).getTime() - new Date(timestamp).getTime());

  if (timeDiff >= 20000) {
    //console.log('Reading from file ' + file);
    //console.log(new Date(timestamp));
    //console.log(new Date(location.time));
    console.log('Cant lock position'.red);
    return setTimeout(function() {
      callback();
    }, 0);
  }

  var buffer = [];

  var lineReader = readline.createInterface({
    input: require('fs').createReadStream(file)
  });

  lineReader.on('line', function(line) {
    //console.log(line);
    buffer.push(line);
  });

  lineReader.on('close', function(line) {
    async.mapSeries(buffer, function(line, icallback) {
      self.processLine(line, location, icallback);
    }, function(err, result) {
      callback();
    });
  });
};

SignalImporter.prototype.processLine = function(line, location, callback) {
  var self = this;
  line = line.trim();
  line = line.replace(/  /g, ' ');
  line = line.replace(/  /g, ' ');
  line = line.replace(/  /g, ' ');

  if (line.charAt(line.length - 1) === ',') {
    line += ' ';
  }

  if (line.indexOf('BSSID, First time seen, Last time seen, channel, Speed, Privacy, Cipher, Authentication, Power, # beacons, # IV, LAN IP, ID-length, ESSID, Key') === -1 && line.indexOf('Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs') === -1) {
    var fields = line.split(', ');
    if (fields.length >= 14 && fields.length <= 15) {
      if (fields[6].indexOf(',') !== -1) {
        var aux = fields[6].split(',');
        fields[6] = aux[0].trim();
        fields.splice(7, 0, aux[1].trim());
      }
      self.buildStation(fields, location, callback);
    } else if (fields.length >= 6 && fields.length <= 7) {
      if (fields[fields.length - 1].indexOf(',') !== -1) {
        var last = fields[fields.length - 1];
        fields[fields.length - 1] = last.substring(0, last.indexOf(',')).trim();
        fields.push(last.substring(last.indexOf(',') + 1, last.length).trim());
      }
      self.buildNode(fields, location, callback);
    } else {
      if (fields.length > 1 && fields[0] !== '') {
        //console.log(line);
        //console.log(fields);
      }
      callback();
    }
  } else {
    callback();
  }
};

SignalImporter.prototype.buildStation = function(fields, location, callback) {
  var self = this;

  var power = parseInt(fields[fields.length - 7]);
  if (power >= -5) {
    power = -89;
  }

  var name = fields[fields.length - 2].trim();

  if (fields[0].length !== 17 || power === null || fields[1].length !== 19 || fields[2].length !== 19) {
    return callback();
  }

  this.stations.findOne({
    _id: fields[0]
  }, function(err, station) {
    if (err) {
      console.log('Failed to get station.'.red);
      console.log(err);
      return callback();
    }

    if (station && (power > station.power || !station.power || station.location.lat === null || station.location.lon === null)) {
      console.log('Updating station top ' + fields[0]);
      station.power = power;
      station.location = location;
    } else if (!station) {
      console.log('Found station ' + fields[0]);
      station = {};
      station._id = fields[0];
      station.power = power;
      station.location = location;
      station.firstseen = fields[1];
      station.name = name;
      station.names = [];
      station.shown = [];
    }

    if (name && name.length > 0 && station.names.indexOf(name) === -1) {
      station.names.push(name);
      console.log('Adding station name ' + fields[0] + ' - ' + name);
    }

    if (location.lat && location.lon) {
      if (station.shown.length === 0) {
        station.shown.push({
          'location': location,
          'power': power,
          'seen': new Date(location.time).getTime()
        });
      } else if (self.isLocationFar(station, location) === true) {
        console.log('Adding station position ' + fields[0]);
        self.insertLocation(station, power, location);
      }
    }

    station.lastseen = new Date(location.time).getTime();

    self.stations.save(station, function(err, output) {
      if (err) {
        console.log('Failed to update station.'.red);
        console.log(err);
      }
      if (callback) callback();
    });
  });
};


SignalImporter.prototype.buildNode = function(fields, location, callback) {
  var self = this;

  var power = parseInt(fields[3]);
  if (power >= -5) {
    power = -89;
  }

  if (fields[0].length !== 17 || power === null || fields[1].length !== 19 || fields[2].length !== 19) {
    return callback();
  }

  var probes = fields[fields.length - 1].replace(/(\n|\r)+$/, '').split(',');
  probes.shift();

  if (probes[probes.lenth - 1] === '') {
    probes.pop();
  }

  this.nodes.findOne({
    _id: fields[0]
  }, function(err, node) {
    if (err) {
      console.log('Failed to get node.'.red);
      console.log(err);
      return callback();
    }

    if (node) {
      node.power = power;
      node.location = location;
    } else if (!node) {
      console.log('Found node ' + fields[0]);
      node = {};
      node._id = fields[0];
      node.shown = [];
      node.power = power;
      node.location = location;
      node.firstseen = new Date(location.time).getTime();
      node.probes = [];
      node.associated = [];
    }

    if (fields[fields.length - 2].indexOf('(not associated)') === -1) {
      var assoc = fields[fields.length - 2];
      if (assoc.length > 0 && node.associated.indexOf(assoc) === -1) {
        node.associated.push(assoc);
        console.log('Found a new association, node ' + fields[0] + ' with ' + assoc);
      }
    }

    if (location.lat && location.lon) {
      if (node.shown.length === 0) {
        node.shown.push({
          'location': location,
          'power': power,
          'seen': new Date(location.time).getTime()
        });
      } else if (self.isLocationFar(node, location) === true) {
        self.insertLocation(node, power, location);
      }
    }

    node.lastseen = new Date(location.time).getTime();

    for (var y = 0; y < probes.length; y++) {
      if (node.probes.indexOf(probes[y]) === -1) {
        node.probes.push(probes[y]);
      }
    }

    self.nodes.save(node, function(err, output) {
      if (err) {
        console.log('Failed to update node.'.red);
        console.log(err);
      }
      if (callback) callback();
    });
  });
};

SignalImporter.prototype.isLocationFar = function(station, location) {
  var far = true;
  for (var i = 0; i < station.shown.length; i++) {
    var loc = station.shown[i].location;
    var dist = distance(location.lat, location.lon, loc.lat, loc.lon);
    if (dist < 5) {
      far = false;
      break;
    }
  }
  return far;
};

SignalImporter.prototype.insertLocation = function(obj, power, location) {
  /*
  while (obj.shown.length > 20) {
    var aux = 0;
    var low = obj.shown[aux];
    for (var i = 1; i < obj.shown.length; i++) {
      var loc = obj.shown[i];
      if (loc.power < low.power) {
        low = loc;
        aux = i;
      }
    }

    obj.shown.splice(aux, 1);
  }
  */

  obj.shown.push({
    'location': location,
    'power': power,
    'seen': new Date(location.time).getTime()
  });
};

module.exports = SignalImporter;
