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
    if (this.station.nodes.length > 0 || this.station.clients.length > 0) {
      hideAll(this);
    }
  });

  google.maps.event.addListener(this.stationMarker, 'mouseover', function() {
    var self = this;

    $.get('/station/' + this.station._id, function(data) {
      closePopups();

      var infowindow = new google.maps.InfoWindow({
        content: '<b>ID:</b> ' + data._id + '</br><b>Name:</b> ' + data.name + '</br><b>Vendor:</b> ' + data.vendor + '</br><b>Firstseen:</b> ' + data.firstseen + '</br><b>Lastseen:</b> ' + data.lastseen + '</br><b>Power:</b> ' + data.power + '</br><b>Devices NA:</b> ' + data.nodes.length + '</br><b>Devices A:</b> ' + data.clients.length
      });
      infowindow.open(map, self);
      openinfowindow.push(infowindow);
    });

  });

  google.maps.event.addListener(this.stationMarker, 'mouseout', function() {
    closePopups();
  });
};

Station.prototype.drawNodes = function() {

};
