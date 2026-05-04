const path = require('path');

// Load mobile/.env before Expo reads config so EXPO_PUBLIC_* is consistent for tooling and Metro.
require('dotenv').config({ path: path.join(__dirname, '.env') });

module.exports = require('./app.json');
