var Service = require('node-windows').Service;
var logger = require('node-windows').EventLogger;

// Create a new service object
var svc = new Service({
  name:'Time Logger',
  description: 'Time keeping web application',
  script: 'app.js',
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install',function(){
  svc.start();
});

svc.on('error', function(err) {
  logger.error(err);
});

svc.install();