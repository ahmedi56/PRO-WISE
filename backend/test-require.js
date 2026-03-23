try {
  console.log('Requiring sails-hook-orm...');
  require('sails-hook-orm');
  console.log('sails-hook-orm found');

  console.log('Requiring sails-hook-sockets...');
  require('sails-hook-sockets');
  console.log('sails-hook-sockets found');

  console.log('Requiring connect-mongo...');
  require('connect-mongo');
  console.log('connect-mongo found');
} catch (e) {
  console.error(e);
}
