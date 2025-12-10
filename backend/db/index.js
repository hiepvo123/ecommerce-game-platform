// backend/db/index.js
const { Client } = require('pg');

// Database configuration from .env file
const client = new Client({
  host: process.env.DB_HOST ,
  user: process.env.DB_USER ,
  port: process.env.DB_PORT ,
  password: process.env.DB_PASSWORD ,
  database: process.env.DB_NAME
});

// Test the connection
const connectDB = async () => {
  try {
    await client.connect();
    console.log('Database connection has been established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    throw error;
  }
};

// Close the connection
const closeDB = async () => {
  try {
    await client.end();
    console.log('Database connection closed.');
  } catch (error) {
    console.error('Error closing database connection:', error);
    throw error;
  }
};

// Query method wrapper for direct queries (backward compatibility)
const query = async (queryText, params = []) => {
  try {
    const result = await client.query(queryText, params);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

module.exports = { client, connectDB, closeDB, query };

// Test connection if run directly
if (require.main === module) {
  (async () => {
    try {
      await connectDB();
      console.log('Database connection test successful!');
      await closeDB();
      process.exit(0);
    } catch (error) {
      console.error('Database connection test failed:', error.message);
      process.exit(1);
    }
  })();
}