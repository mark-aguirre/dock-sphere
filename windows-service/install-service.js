const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'DockSphere Container Hub Plus',
  description: 'DockSphere Container Hub Plus - Docker Management Web Application',
  script: path.join(__dirname, '..', '.next', 'standalone', 'server.js'),
  nodeOptions: [
    '--max_old_space_size=4096'
  ],
  env: {
    NODE_ENV: "production",
    PORT: "3009",
    HOSTNAME: "0.0.0.0"
  }
});

// Listen for the "install" event, which indicates the
// process is available as a service.
svc.on('install', function() {
  console.log('DockSphere service installed successfully!');
  console.log('Starting service...');
  svc.start();
});

svc.on('start', function() {
  console.log('DockSphere service started successfully!');
  console.log('Service is now running on http://localhost:3009');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Install the service
console.log('Installing DockSphere as Windows service...');
svc.install();