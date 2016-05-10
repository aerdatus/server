var express = require('express'),
  os = require('os'),
  fs = require('fs'),
  Trilateration = require('./lib/Trilateration'),
  MongoClient = require('mongodb').MongoClient,
  async = require('async');


var mongo;
var trilateration = new Trilateration();

var port = process.env.PROBY_PORT || 1337;

var app = express();
app.use(express.static(__dirname + '/static'));

var server = require('http').Server(app);

var data = [];

app.get('/info', function(req, res) {
  var response = {};
  mongo.collection('stations').find().each(function(err, doc) {
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
});




MongoClient.connect('mongodb://127.0.0.1:27017/probe', function(err, db) {
  mongo = db;
  server.listen(port);
  console.log('Connected to database');
});


console.log('########################');
console.log('Proby');
console.log('########################');
console.log('Server started!');
console.log('Listening on port: ' + port);
console.log('----');


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


  /*
  var nodesKeys = Object.keys(data.nodes);

  for (var i = 0; i < nodesKeys.length; i++) {
    var node = data.nodes[nodesKeys[i]];
    node.id = nodesKeys[i];
    if (node.associated && node.associated.indexOf(station.id) >= 0) {
      outputassoc.push(node);
    } else if (node.probes.indexOf(station.name) >= 0) {
      outputnotassoc.push(node);
    }
  }
  return {
    'associated': outputassoc,
    'notassociated': outputnotassoc
  };
  */
}
