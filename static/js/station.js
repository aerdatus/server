var Station = function(station) {
  this.nodes = [];
  this.station = station;

  //ToDo: fix in db
  if ((station.name === undefined || station.name.length === 0) && station.names.length > 0) {
    station.name = station.names[station.names.length - 1];
  }

  var stationPoint = new google.maps.LatLng(station.location.lat, station.location.lon);
  this.stationMarker = new google.maps.Marker({
    position: stationPoint,
    map: window.map,
    title: station._id + ' - ' + station.name,
    station: station,
    icon: './images/station.png'
  });
};

Station.prototype.draw = function() {
  google.maps.event.addListener(this.stationMarker, 'click', function() {
    hideAll(this);
  });

  google.maps.event.addListener(this.stationMarker, 'mouseover', function() {
    if (openinfowindow) {
      openinfowindow.close();
    }
    var infowindow = new google.maps.InfoWindow({
      content: '<b>ID:</b> ' + this.station._id + '</br><b>Name:</b> ' + this.station.name + '</br><b>Firstseen:</b> ' + this.station.firstseen + '</br><b>Lastseen:</b> ' + this.station.lastseen + '</br><b>Power:</b> ' + this.station.power + '</br><b>Devices NA:</b> ' + this.station.nodes.length + '</br><b>Devices A:</b> ' + this.station.clients.length
    });
    infowindow.open(map, this);
    openinfowindow = infowindow;
  });

  google.maps.event.addListener(this.stationMarker, 'mouseout', function() {
    if (openinfowindow) {
      openinfowindow.close();
    }
  });
};

Station.prototype.drawNodes = function() {

};
