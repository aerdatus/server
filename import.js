var SignalImporter = require('./lib/SignalImporter');

var s = new SignalImporter();
s.start(function() {
  process.exit(0);
});
