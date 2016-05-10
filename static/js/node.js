var Node = function(node, icon, stationMarker) {
  this.node = node;
  this.icon = icon;
  this.stationMarker = stationMarker;
  this.circleMarkers = [];

  var nodePoint = new google.maps.LatLng(node.location.lat, node.location.lon);

  this.nodeMarker = new google.maps.Marker({
    position: nodePoint,
    map: window.map,
    title: node._id,
    node: node,
    icon: icon
  });
};

Node.prototype.draw = function() {
  var self = this;

  google.maps.event.addListener(this.nodeMarker, 'click', function() {

    if (self.infowindow) {
      return self.hideLocations();
    }

    self.infowindow = new google.maps.InfoWindow({
      content: '<b>ID:</b> ' + this.node._id + '</br><b>Firstseen:</b> ' + this.node.firstseen + '</br><b>Lastseen:</b> ' + this.node.lastseen + '</br><b>Power:</b> ' + this.node.power + '</br><b>Probes:</b> ' + this.node.probes
    });
    self.infowindow.open(map, this);

    self.drawLocations();
  });

  if (self.stationMarker) {
    var points = [self.stationMarker.position, this.nodeMarker.position];
    var path = new google.maps.Polyline({
      path: points,
      geodesic: true,
      strokeColor: '#FF0000',
      map: map,
      strokeOpacity: 0.2,
      strokeWeight: 2
    });

    this.line = path;
  }
};

Node.prototype.drawLocations = function() {
  if (this.node.location && this.node.location.lat && this.node.location.lon) {
    var circleOptions1 = {
      strokeColor: '#3366FF',
      strokeOpacity: 0,
      strokeWeight: 1,
      fillColor: '#3366FF',
      fillOpacity: 0.5,
      map: map,
      center: new google.maps.LatLng(this.node.location.lat, this.node.location.lon),
      radius: (100 - Math.abs(this.node.power)) * 350 / 100
    };
    self.circleMarkers.push(new google.maps.Circle(circleOptions1));
  }


  for (var i = 0; i < this.node.shown.length; i++) {
    var show = this.node.shown[i];
    if (show.location.lat && show.location.lon) {
      var circleOptions2 = {
        strokeColor: '#3366FF',
        strokeOpacity: 0,
        strokeWeight: 1,
        fillColor: '#3366FF',
        fillOpacity: 0.5,
        map: map,
        center: new google.maps.LatLng(show.location.lat, show.location.lon),
        radius: (100 - Math.abs(show.power)) * 350 / 100
      };
      self.circleMarkers.push(new google.maps.Circle(circleOptions2));
    }
  }

  for (i = 0; i < self.circleMarkers.length; i++) {
    bounds.union(self.circleMarkers[i].getBounds());
  }
  map.fitBounds(bounds);
};

Node.prototype.hide = function() {
  this.hideLocations();
  if(this.line) {
    this.line.setMap(null);
  }
  this.nodeMarker.setMap(null);
};

Node.prototype.hideLocations = function() {
  if(!this.infowindow) return;

  this.infowindow.close();
  this.infowindow = undefined;

  for (var i = 0; i < self.circleMarkers.length; i++) {
    var n = self.circleMarkers[i];
    n.setMap(null);
  }

  self.circleMarkers = [];
};
