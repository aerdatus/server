var express = require('express'),
  os = require('os'),
  fs = require('fs'),
  Trilateration = require('./lib/Trilateration'),
  MongoClient = require('mongodb').MongoClient,
  async = require('async'),
  bodyParser = require('body-parser'),
  url = require('url'),
  mac = require('mac-lookup');


var mongo;
var trilateration = new Trilateration();

var port = process.env.PROBY_PORT || 1337;

var app = express();
app.use(express.static(__dirname + '/static'));
app.use(bodyParser.urlencoded({
  extended: false
}));
app.use(bodyParser.json());

var server = require('http').Server(app);

var cache;


app.get('/info', function(req, res) {
  if (cache === undefined) {
    populate(function() {
      res.json(cache);
    });
  } else {
    res.json(cache);
  }

  /*
  var url_parts = url.parse(req.url, true);
  var dataq = url_parts.query;

  var response = {};
  mongo.collection('stations').find({
    $and: [{
      'location.lon': {
        "$gte": parseFloat(dataq.swlon),
        "$lte": parseFloat(dataq.nelon)
      }
    }, {
      'location.lat': {
        "$gte": parseFloat(dataq.swlat),
        "$lte": parseFloat(dataq.nelat)
      }
    }]
  }).each(function(err, doc) {
    if (doc) {
      data.push(doc);
    } else {
      async.map(data, function(doci, callback) {
        compute(doci, function(station) {
          if (station) {
            response[station._id] = station;
          }
          callback();
        });
      }, function(err, results) {
        res.json(response);
      });
    }
  });
  */
});

app.get('/station/:mac', function(req, res) {
  var station = cache[req.params.mac];

  mac.lookup(station._id.substring(0,8), function(err, name) {
    station.vendor = name || 'Unknown';
    res.json(station);
  });
});

app.get('/node/:mac', function(req, res) {
  mongo.collection('nodes').findOne({'_id': req.params.mac}, function(err, doc) {
    if (doc) {
      res.json(doc);
    } else {
      res.json({});
    }
  });
});


MongoClient.connect('mongodb://127.0.0.1:27017/probe', function(err, db) {
  mongo = db;
  server.listen(port);

  console.log('########################');
  console.log('Proby');
  console.log('########################');
  console.log('Server started!');
  console.log('Listening on port: ' + port);
  console.log('----');
  console.log('Connected to database');

  populate();
  setInterval(function() {
    populate();
  }, 240000);
});


function populate(mcallback) {
  var data = [];
  var response = {};
  mongo.collection('stations').find({}).each(function(err, doc) {
    if (doc) {
      data.push(doc);
    } else {
      async.map(data, function(doci, callback) {
        compute(doci, function(station) {
          if (station) {
            //ToDo: blacklist will be filtered at import phase
            if (station.location.lat && station.location.lon && station.name !== 'FON_ZON_FREE_INTERNET' && station.name.indexOf('apocas') === -1 && station.name.indexOf('Wifi_BE8C') === -1 && station.name !== 'phobos' && station.name !== 'phobos4g' && station.name.indexOf('minedu') ===
              -1 && station.name.indexOf('eduroam') === -1) {
              response[station._id] = station;
            }
          }
          callback();
        });
      }, function(err, results) {
        cache = response;
        console.log('Cache populated.');
        if (mcallback) {
          mcallback();
        }
      });
    }
  });
}


function compute(station, callback) {
  if (station.power !== null) {
    if (station.shown.length >= 3) {
      trilateration.clear();
      var counter = 0;
      for (var y = 0; y < station.shown.length; y++) {
        var loc = station.shown[y];
        if (Math.abs(loc.power) > 30) {
          trilateration.addBeacon(counter, trilateration.vector(loc.location.latitude, loc.location.longitude));
          trilateration.setDistance(counter, Math.abs(loc.power));
          counter++;
        }
      }
      if (counter >= 3) {
        var pos = trilateration.calculatePosition();
        station.center = {
          'latitude': pos.x,
          'longitude': pos.y
        };
      }
    }

    var aux = findNodes(station, function(assoc, notassoc) {
      station.nodes = notassoc;
      station.clients = assoc;
      callback(station);
    });
  } else {
    console.log(station);
    callback();
  }
}

function findNodes(station, callback) {
  var outputnotassoc = [];
  var outputassoc = [];

  mongo.collection('nodes').find({
    associated: {
      $elemMatch: {
        $in: [station._id]
      }
    }
  }).each(function(err, doc) {
    if (doc) {
      outputassoc.push(doc);
    } else {
      mongo.collection('nodes').find({
        probes: {
          $elemMatch: {
            $in: [station.name]
          }
        }
      }).each(function(err, doc) {
        if (doc) {
          outputnotassoc.push(doc);
        } else {
          callback(outputassoc, outputnotassoc);
        }
      });
    }
  });
}
