$require('server',
[
  'extend',
  'express',
  'os',
  'body-parser',
  'cookie-parser',
  'multer',
  'express-session',
  'connect-redis',
  'utils',
  'portStore',
  'redisManager',
  'config',
  'credentials',
  'microService',
  'endpoint'
],
function(
  extend,
  express,
  os,
  bodyParser,
  cookieParser,
  multer,
  expressSession,
  connectRedis,
  utils,
  portStore,
  redisManager,
  config,
  credentials,
  MicroService,
  Endpoint
) {
  var Server = function(){};

  Server.prototype.__templateType = 'server';

  Server.prototype.__beforeInit = function(options) {
    this._super(options);
    this.endpoints = {};
    this.port = this.port || this.options.port || config.serverPort || 3000;
  };

  Server.prototype.__afterInit = function() {
    // Set up the app, add the routes.
    this.routes = this.routes || this.options.routes || [];
    this.publicRoutes = this.publicRoutes || this.options.publicRoutes || {};
    this.sockets = this.sockets || this.options.sockets || [];

    if (!this.isMaster) return;
    this._super();
    // Start up the port store.
    portStore.start();
    // Set up the server for master -- proxy (net server) if multiple ports, express if not.
    this.setupServer();
  };

  Server.prototype.setupServer = function() {
    if (this.server || (this.isMaster && this.numProcesses)) {
      return;
    }
    this._setupExpressServer();
  };

  // Slave

  // http://expressjs.com/en/api.html#req.body
  Server.prototype._setupExpressServer = function() {
    this.app = express();
    // Use a cookie parser.
    this.app.use(cookieParser(credentials.cookieSecret));
    // Use a body parser for POSTS.
    this.app.use(bodyParser.json());
    // For parsing application/x-www-form-urlencoded
    this.app.use(bodyParser.urlencoded({extend: true}));
    // Setup the session.
    this.app.use(this._createSession());
    // Setup the public routes.
    this._publicRoutes = [];
    for (var route in this.publicRoutes) {
      var serverPath = this.publicRoutes[route];
      this._publicRoutes.push(route);
      this.app.use(route, express.static(serverPath));
    }

    // Setup the endpoints.
    for (var i=0; i< this.routes.length; i++) {
      this.addEndpoint(this.routes[i]);
    }

    // Callback to call once express app is listening.
    var cb = function() { console.log('Server (', this.__className, ') has started.'); }.bind(this);

    // Have it listen to localhost
    //if (this.isMaster) {
      this.server = this.app.listen(this.port, cb);
    //} else {
      //this.server = this.app.listen(0, 'localhost', cb);
    //}

    // Setup the sockets.
    for (var i=0; i< this.sockets.length; i++) {
      this.addSocket(this.sockets[i]);
    }
  };

  Server.prototype._createSession = function() {
    var RedisStore = connectRedis(expressSession);
    return expressSession({
      'store': new RedisStore({ 'client': redisManager.getCluster() }),
      'secret': credentials.cookieSecret,
      'cookie': this._getCookieParams(),
      'resave': false,
      'saveUninitialized': false
    });
  };

  Server.prototype._getCookieParams = function() {
    // https://github.com/expressjs/session#cookie-options
    // Note: for https sites, read that.
    return {
      'path': '/',
      'httpOnly': true,
      'maxAge': 86400*90, // 90 days
      // 'domain': 'your domain so you can have multiple sub-domains using the same cookie'
      'secure': false
    }
  };

  Server.prototype.addEndpoint = function(endpointOrOptions) {
    if (!endpointOrOptions) return;
    var ep;

    if (endpointOrOptions.prototype.__templateType === 'endpoint') {
      ep = new endpointOrOptions({'app': this.app});
    } else {
      endpointOrOptions['app'] = this.app;
      ep = new Endpoint(endpointOrOptions);
    }
    this.endpoints[ep.url] = ep;
  };

  Server.prototype.addSocket = function(socket) {
    var publicRoute = this._publicRoutes[0] || '';
    var s = new socket({'server': this.server, 'publicRoute': publicRoute, 'app': this.app});
    this.sockets[socket.__id] = s;
  };

  Server.prototype.onFork = function() {
    if (this.isMaster) return;
    this._super.apply(this, arguments);
    this.setupServer();
  };

  // Listening to messages sent by master -- if it's a connection event, then
  // emulate the connection event on the server by emitting the event that master sent us.
  Server.prototype.onProcessMessage = function(message, connection) {
    console.log(message, connection);
    if (this.isMaster || message !== (config.stickySessionEvent || 'sticky-session:connection')) return;
    connection.resume();
    this.server.emit('connection', connection);

  };


  return extend(MicroService, Server);
});