const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Last resourt for handling uncaught exception errors
process.on('uncaughtException', (err) => {
  console.log('Uncaught Exception Error! ');
  console.log(err);
  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const db = process.env.DATABASE;

mongoose
  .connect(db, {
    dbName: 'natours-app',
  })
  .then((connect) => {
    console.log('connected to natours-app DB...');
  });

// Start Server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Server is running on port ${port}...`);
});

// Last resort for handling unhandled promise rejections (not part of our express app)
process.on('unhandledRejection', (err) => {
  console.log(err);
  server.close(() => {
    console.log('Server shuting down...');
    process.exit(1);
  });
});
