/**
 * Module dependencies.
 */
import * as express from 'express';
import * as compression from 'compression';  // compresses requests
import * as bodyParser from 'body-parser';
// import * as dotenv from 'dotenv';
import * as path from 'path';
import expressValidator = require('express-validator');
import * as mongoose from 'mongoose';
const mongooseDB = mongoose.connection;

/**
 * Load environment variables from .env file, where API keys and passwords are configured.
 */
// dotenv.config({ path: '.env.example' });

/**
 * Controllers (route handlers).
 */
import * as apiController from './controllers/api';

/**
 * Create Express server.
 */
const app = express();

/**
 * Connect to MongoDB.
 */
(<any>mongoose).Promise = global.Promise;
// const mongodbUri = process.env.MONGODB_URI;
const mongodbUri = 'mongodb://admin:R7*bx8INtE@ds241039.mlab.com:41039/ns-user-status-db';
const options = {
    keepAlive: true,
    reconnectTries: 60 * 30,
    useMongoClient: true
};
mongooseDB.on('connecting', () => {
    console.log('connecting to MongoDB...');
});
mongooseDB.on('error', (error) => {
    console.error('Error in MongoDb connection: ' + error);
    mongoose.disconnect();
});
mongooseDB.on('connected', () => {
    console.log('MongoDB connected!');
});
mongooseDB.once('open', () => {
    console.log('MongoDB connection opened!');
});
mongooseDB.on('reconnected', () => {
    console.log('MongoDB reconnected!');
});
mongooseDB.on('disconnected', () => {
    console.log('MongoDB disconnected!');
    mongoose.connect(mongodbUri, options);
});
mongoose.connect(mongodbUri, options);

/**
 * Express configuration.
 */
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, '../views'));

app.set('view engine', 'pug');
app.use(compression());
// app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(expressValidator());
app.use(express.static(path.join(__dirname, 'public'), { maxAge: 31557600000 }));

/**
 * Primary app routes.
 */
app.get('/', (req, res) => {
    res.send('NetSuite User Status App Up');
});

/**
 * API examples routes.
 */
app.post('/api/create-account', apiController.createAccount);
// app.get('/api/retrieve-packages/:email', apiController.getPackages);

/**
 * Start Express server.
 */
app.listen(app.get('port'), () => {
    console.log(('  App is running at http://localhost:%d in %s mode'), app.get('port'), app.get('env'));
    console.log('  Press CTRL-C to stop\n');
});

module.exports = app;