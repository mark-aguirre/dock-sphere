const Service = require('node-windows').Service;
const path = require('path');

// Create a new service object
const svc = new Service({
  name: 'DockSphere Container Hub Plus',
  script: path.join(__dirname, '..', '.next', 'standalone', 'server.js')
});

// Listen for the "uninstall" event so we know when it's done.
svc.on('uninstall', function() {
  console.log('DockSphere service uninstalled successfully!');
});

svc.on('error', function(err) {
  console.error('Service error:', err);
});

// Uninstall the service
console.log('Uninstalling DockSphere Windows service...');
svc.uninstall();