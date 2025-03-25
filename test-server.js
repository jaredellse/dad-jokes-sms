// Test that the server can be started
console.log('Testing server startup...');
try {
  require('./server.js');
  console.log('Server started successfully in test mode!');
} catch (error) {
  console.error('Error starting server:', error);
  process.exit(1);
} 