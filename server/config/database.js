const mongoose = require('mongoose');

const DEFAULT_DB_NAME = 'urbansprout';

/**
 * Normalize MongoDB URI: ensure Atlas URIs have a database name and retry options.
 * e.g. ...mongodb.net/?appName=... -> ...mongodb.net/urbansprout?retryWrites=true&w=majority&appName=...
 */
function normalizeMongoUri(uri) {
  let u = uri.trim();
  if (!u) return u;

  // If Atlas SRV and path is empty or just "/", add default database name and retry options
  if (u.startsWith('mongodb+srv://')) {
    const hasNoDb = /^mongodb\+srv:\/\/[^/]+\/?(\?|$)/.test(u);
    if (hasNoDb) {
      const qIndex = u.indexOf('?');
      const query = qIndex === -1 ? '' : u.slice(qIndex);
      const base = qIndex === -1 ? u : u.slice(0, qIndex);
      const path = base.replace(/\/?$/, '');
      u = `${path}/${DEFAULT_DB_NAME}${query}`;
      if (!u.includes('retryWrites=')) {
        u += (query ? '&' : '?') + 'retryWrites=true&w=majority';
      }
    }
  }

  return u;
}

const CONNECT_OPTS = { serverSelectionTimeoutMS: 15000, maxPoolSize: 10 };

function isSrvRefused(err) {
  const msg = err?.message || '';
  const code = err?.code || '';
  return (msg.includes('querySrv') && (msg.includes('ECONNREFUSED') || code === 'ECONNREFUSED'));
}

const connectDB = async () => {
  const rawUri = process.env.MONGODB_URI || '';
  let mongoUri = normalizeMongoUri(rawUri);

  if (!mongoUri) {
    console.error('❌ MONGODB_URI environment variable is not set');
    console.error('   Add MONGODB_URI=your_connection_string to server/.env');
    process.exit(1);
  }

  const tryConnect = async (uri) => {
    return mongoose.connect(uri, CONNECT_OPTS);
  };

  try {
    console.log('🔄 Connecting to MongoDB...');
    const conn = await tryConnect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    return;
  } catch (error) {
    if (isSrvRefused(error)) {
      const directUri = process.env.MONGODB_URI_DIRECT?.trim();
      if (directUri) {
        console.warn('⚠️  SRV DNS failed; retrying with MONGODB_URI_DIRECT...');
        try {
          const conn = await tryConnect(directUri);
          console.log(`✅ MongoDB Connected (direct): ${conn.connection.host}`);
          console.log(`📊 Database: ${conn.connection.name}`);
          return;
        } catch (directErr) {
          console.error('❌ Direct URI also failed:', directErr.message);
          process.exit(1);
        }
      }
      console.error('❌ MongoDB connection error: querySrv ECONNREFUSED');
      console.error('   Your network or DNS is blocking SRV lookups (used by mongodb+srv://).');
      console.error('');
      console.error('   Fix: use a direct connection string instead of mongodb+srv://');
      console.error('   1. In Atlas: Cluster → Connect → "Connect your application"');
      console.error('   2. Choose "Driver: Node.js" and copy the connection string.');
      console.error('   3. In Atlas click "Edit" and switch to "Direct connection" (or use the host list).');
      console.error('   4. In server/.env set MONGODB_URI to that direct string (starts with mongodb:// not mongodb+srv://).');
      console.error('   Or set MONGODB_URI_DIRECT to the direct string and keep MONGODB_URI as-is.');
      process.exit(1);
    }
    console.error('❌ MongoDB connection error:', error.message);
    if (error.message?.includes('authentication failed')) {
      console.error('   → Check username/password in MONGODB_URI (special chars in password must be URL-encoded, e.g. # as %23)');
    } else if (error.message?.includes('ENOTFOUND') || error.message?.includes('getaddrinfo')) {
      console.error('   → Check network/DNS; Atlas cluster host may be wrong or unreachable');
    } else if (error.message?.includes('timed out')) {
      console.error('   → Check firewall; add your IP (or 0.0.0.0/0) in Atlas Network Access');
    }
    process.exit(1);
  }
};

/** ReadyState: 0=disconnected, 1=connected, 2=connecting, 3=disconnecting */
function isDbConnected() {
  return mongoose.connection.readyState === 1;
}

// Handle connection events
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected — API will return 503 until reconnected');
});



// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = connectDB;
module.exports.isDbConnected = isDbConnected;