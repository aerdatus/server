var SignalImporter = require('./lib/SignalImporter');

if(process.argv.length !== 3) {
  console.log('Example: "node import.js /home/probe/logs/"');
  process.exit(1);
}

var s = new SignalImporter(process.argv[2]);
s.start(function() {
  process.exit(0);
});
