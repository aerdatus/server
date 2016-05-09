var Signal = require('./lib/Signal');

var s = new Signal();
s.start(function() {
  process.exit(0);
});
