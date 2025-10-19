const express = require('express');
const dotenv = require('dotenv').config();
const ejs = require('ejs');
const dbCon = require('./app/config/dbcon');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const MongoStore = require('connect-mongo');
const http = require('http');                  //add http
const { Server } = require('socket.io');       //add socket.io
const initSocket = require('./app/socket');    //socket.js

const swaggerJsDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const SwaggerOptions = require('./swagger.json');
const swaggerDocument = swaggerJsDoc(SwaggerOptions);

const cors = require('cors');

const app = express();
dbCon();

// Session setup
app.use(session({
    secret: process.env.SESSION_SECRET || 'yoursecretkey',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URL }),
    cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
        httpOnly: true,
        secure: false // set true only if HTTPS
    }
}));


app.use(cookieParser());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3005'], // ✅ frontend & swagger origins
  credentials: true, // ✅ allow cookies to be sent
}));

app.use(flash());

app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, '/uploads')));

// Admin navbar change
const adminNavChange = require('./app/middleware/adminNavChange');
app.use(adminNavChange);

const navChange = require('./app/middleware/navChange');
app.use(navChange);

// Routes
const ClientRoute = require('./app/route/client/ClientRouter');
app.use("/client", ClientRoute);

const FrontendRoute = require('./app/route/frontend/FrontendRouter');
app.use(FrontendRoute);

const FreelancerRoute = require('./app/route/frontend/FreelancerRouter');
app.use(FreelancerRoute);

const JobRoute = require('./app/route/client/JobRouter');
app.use('/jobs', JobRoute);

const BidRoute = require('./app/route/frontend/BidRouter');
app.use('/bids', BidRoute);

//Api
const FrontendApiRoute = require('./app/route/api/FrontendApiRouter');
app.use('/api',FrontendApiRoute);

const ClientApiRoute = require('./app/route/api/ClientApiRouter');
app.use('/api/client',ClientApiRoute);

const JobApiRoute = require('./app/route/api/JobApiRouter');
app.use('/api/jobs',JobApiRoute);

const FreelancerApiRoute=require('./app/route/api/FreelancerApiRouter');
app.use('/api/freelancer',FreelancerApiRoute);

const BidApiRoute = require('./app/route/api/BidApiRouter');
app.use('/api/bids', BidApiRoute);

//swagger
// app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true, // keeps auth info when you refresh
      requestInterceptor: (req) => {
        req.credentials = 'include'; // ✅ this makes Swagger send cookies
        return req;
      },
    },
  })
);


// Setup HTTP server and Socket.io
const port = 3005;
const server = http.createServer(app); // use http server
const io = new Server(server);         // attach socket.io

// Initialize socket.js
initSocket(io);

module.exports.io = io;
// Start server
server.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
