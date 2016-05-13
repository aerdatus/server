var map;

var stationMarkers = {};
var station;
var nodeMarkers = [];
var circleMarkers = [];
var lines = [];
var valFilter = 0;
var openinfowindow;
var bounds;
var request = null;

function hideAll(marker) {
  if (station) {
    //resetMap();
    filter();
    return;
  }


  var stationKeys = Object.keys(stationMarkers);
  for (var i = 0; i < stationKeys.length; i++) {
    var sm = stationMarkers[stationKeys[i]];
    sm.setVisible(false);
  }

  marker.setVisible(true);

  var stationo = marker.station;

  for (var y = 0; y < stationo.nodes.length; y++) {
    var node = stationo.nodes[y];
    if (node.location.lat && node.location.lon) {
      var nodeG = new Node(node, './images/pcred.png', marker);
      nodeG.draw();
      nodeMarkers.push(nodeG);
    }
  }

  for (var z = 0; z < stationo.clients.length; z++) {
    var node = stationo.clients[z];
    if (node.location.lat && node.location.lon) {
      var nodeG = new Node(node, './images/pcgreen.png', marker);
      nodeG.draw();
      nodeMarkers.push(nodeG);
    }
  }

  station = marker;

  var markers = nodeMarkers.concat(marker);
  bounds = new google.maps.LatLngBounds();
  for (i = 0; i < markers.length; i++) {
    bounds.extend(markers[i].getPosition());
  }

  map.fitBounds(bounds);
}



function initialize(mapOptions) {
  map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

  google.maps.event.addListener(map, 'idle', function(e) {
    //loadData();
  });

  loadData();

  var zoomSlider = new ExtDraggableObject(document.getElementById("zoom"), {
    restrictX: true,
    intervalY: 8,
    toleranceX: 50,
    toleranceY: 25,
    container: document.getElementById("zoomSlider")
  });
  zoomSlider.setValueY(19);

  var dragEndEvent = google.maps.event.addListener(zoomSlider, "drag", function() {
    filter(zoomSlider);
  });
  var zoomIn = google.maps.event.addDomListener(document.getElementById("zoomIn"), "click", function() {
    zoomSlider.setValueY(zoomSlider.valueY() - 1);
    filter(zoomSlider);
  });
  var zoomOut = google.maps.event.addDomListener(document.getElementById("zoomOut"), "click", function() {
    zoomSlider.setValueY(zoomSlider.valueY() + 1);
    filter(zoomSlider);
  });
}

function loadData() {
  var bounds = map.getBounds();
  var opts = {};

  if (bounds) {
    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();
    opts = {
      'swlat': sw.lat(),
      'swlon': sw.lng(),
      'nelat': ne.lat(),
      'nelon': ne.lng()
    };
  }

  if (request !== null) {
    request.abort();
    request = null;
  }

  $('.loader').show();
  request = $.get('/info', opts,
    function(data) {
      request = null;
      var stationIDs = Object.keys(data);

      for (var i = 0; i < stationIDs.length; i++) {
        var station = data[stationIDs[i]];

        var stationG = new Station(station);
        stationG.draw();

        if (stationMarkers[station._id] === undefined) {
          stationMarkers[station._id] = stationG.stationMarker;
        }

      }
      $('.loader').hide();
      /*
      if(stationIDs.length > 0) {
        loadData();
      }
      */
    }
  );
}

function resetMap() {
  map.setCenter(new google.maps.LatLng(39.4650609, -8.2048947));
  map.setZoom(15);
}

function filter(zoomSlider) {
  /*
  if (station) {
    resetMap();
  }
  */

  if (zoomSlider) {
    var val = 19 - zoomSlider.valueY();
    val = parseInt(parseInt(val * 200 / 19) / 10);

    if (val === valFilter) {
      return;
    }
    valFilter = val;
  }

  var stationKeys = Object.keys(stationMarkers);
  for (var i = 0; i < stationKeys.length; i++) {
    var sm = stationMarkers[stationKeys[i]];
    if ((sm.station.clients.length + sm.station.nodes.length) >= valFilter) {
      sm.setVisible(true);
    } else {
      sm.setVisible(false);
    }
  }

  for (var i = 0; i < nodeMarkers.length; i++) {
    var n = nodeMarkers[i];
    n.hide();
  }
  nodeMarkers = [];

  station = undefined;
}

function start() {
  var mapOptions = {
    zoom: 8,
    center: new google.maps.LatLng(39.4650609, -8.2048947)
  };

  /*
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        mapOptions.center = new google.maps.LatLng(position.coords.lat, position.coords.lon);
        initialize(mapOptions);
      });
    } else {
    */
  initialize(mapOptions);
  //}
}

google.maps.event.addDomListener(window, 'load', start);
