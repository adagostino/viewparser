var isLocal = process.argv[2] === 'local';

/* For local

Docroot is: /usr/local/var/www

The default port has been set in /usr/local/etc/nginx/nginx.conf to 8080 so that
nginx can run without sudo.

nginx will load all files in /usr/local/etc/nginx/servers/.

To have launchd start nginx at login:
  ln -sfv /usr/local/opt/nginx/*.plist ~/Library/LaunchAgents
Then to load nginx now:
  launchctl load ~/Library/LaunchAgents/homebrew.mxcl.nginx.plist
Or, if you don't want/need launchctl, you can just run:
  nginx

start nginx:
sudo nginx

stop nginx:
sudo nginx -s stop

reload nginx:
sudo nginx -s reload

 */

/* remember to add this to nginx.conf in the directory above:

map $http_upgrade $connection_upgrade {
    default upgrade;
    '' close;
}

 */


var _basePath = !isLocal ? '/etc/nginx/sites-available/' : '/usr/local/etc/nginx/servers/';
var _baseDocRoot = !isLocal ? '/var/www/' : '/usr/local/var/www/';
var _sslRoot = '/etc/letsencrypt/live/www.naar.io/';


var BuildHelper = require('./helpers/buildHelper.js'),
    cp = require('child_process'),
    config = require('../config.json'),
    credentials = require('../credentials.json');

var nginxHelper = new BuildHelper(_basePath, 'default');


var _buildLocation = function(opts, domain, ssl) {
  var contents = [];
  contents.push('location / {');

  var localAddress = opts.localAddress.replace('localhost', '127.0.0.1');

  contents.push('  proxy_pass ' + localAddress + ';');
  if (opts.upgrade) {
    contents.push('  proxy_http_version 1.1;');
    contents.push('  proxy_set_header Upgrade $http_upgrade;');
    contents.push('  proxy_set_header Connection $connection_upgrade;');
  } else {
    contents.push('  proxy_set_header Connection "";');
  }
  contents.push('  proxy_redirect off;');
  contents.push('  proxy_set_header Host $host;');
  contents.push('  proxy_set_header X-Real-IP $remote_addr;');
  contents.push('  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;');
  contents.push('  proxy_set_header X-Forwarded-Proto $scheme;');
  contents.push('  proxy_set_header X-NginX-Proxy true;');

  //var proto = 'http' + (ssl ? 's': '') + '://';

  //contents.push('  proxy_redirect ' + opts.localAddress + ' ' + proto + domain + ';');

  /*
    proxy_pass http://localhost:36000/;
    proxy_redirect http://localhost:36000/ https://$server_name/;
   */

  contents.push('}')
  return contents.join('\n  ');
};

// http://stackoverflow.com/questions/19515132/nginx-cache-static-files
var _buildCache = function() {
  var contents = [];
  contents.push('location ~* ^.+\\.(?:css|cur|js|jpe?g|gif|htc|ico|png|html|xml|otf|ttf|eot|woff|svg)$ {');
  contents.push('  access_log off;');
  contents.push('  expires 30d;');
  contents.push('  tcp_nodelay off;');
  contents.push('  open_file_cache max=3000 inactive=120s;');
  contents.push('  open_file_cache_valid 45s;');
  contents.push('  open_file_cache_min_uses 2;');
  contents.push('  open_file_cache_errors off;')
  contents.push('}');
  return contents.join('\n  ');
};

// Overwrite the createConfFile fn.
// http://download.redis.io/redis-stable/redis.conf
var _buildServer = function(opts) {
  var contents = [];


  if (opts.ssl) {
    contents.push(_buildServer({
        'defaultServer': opts.defaultServer,
        'domain': opts.domain,
        'rewrite': true
      })
    )
  }


  contents.push('server {');

  if (opts.ssl) {
    contents.push('  listen 443;');
    contents.push('  ssl on;');
    contents.push('  ssl_certificate ' + _sslRoot + 'cert.pem;');
    contents.push('  ssl_certificate_key ' + _sslRoot + 'privkey.pem;');

    //contents.push('  ssl_session_timeout 5m;');

    contents.push('  ssl_session_cache  builtin:1000  shared:SSL:10m;');
    contents.push('  ssl_protocols  SSLv2 SSLv3 TLSv1;'); // TLSv1.1 TLSv1.2
    contents.push('  ssl_ciphers  ALL:!ADH:!EXPORT56:RC4+RSA:+HIGH:+MEDIUM:+LOW:+SSLv2:+EXP;');
    //contents.push('  ssl_ciphers HIGH:!aNULL:!eNULL:!EXPORT:!CAMELLIA:!DES:!MD5:!PSK:!RC4;');
    contents.push('  ssl_prefer_server_ciphers on;');

  } else {
    contents.push('  listen 80' + (opts.defaultServer ? ' default_server' : '') + ';');
  }

  opts.domain && contents.push('  server_name ' + opts.domain + ';');
  opts.root && contents.push('  root ' + opts.root + '/client;');

  if (opts.rewrite) {
    var proto = 'http' + (opts.ssl ? 's': '') + '://';
    proto = 'https://';
    contents.push('  rewrite ^ ' + proto + '$server_name$request_uri? permanent;');
  } else if (opts.redirect) {
    contents.push('  return 301 https://$host$request_uri;');
  } else {
    contents.push('  ' + _buildLocation(opts.location, opts.domain, opts.ssl));
    if (opts.cache && !isLocal) {
      contents.push('  ' + _buildCache());
    }
  }

  contents.push('}');
  return contents.join('\n');
};

nginxHelper.createConfFile = function(node) {
  var contents = [];

  contents.push(_buildServer({
    'defaultServer': true,
    'domain': 'naar.io',
    //'root': _baseDocRoot + 'naar',
    'ssl': true,
    'cache': true,
    'location': {
      'localAddress': 'http://localhost:' + config.serverPort
    }
  }));
  /*
  contents.push(_buildServer({
    'domain': 'socket.naar.io',
    //'root': _baseDocRoot + 'naar',
    'ssl': true,
    'location': {
      'localAddress': 'http://localhost:' + config.socketPort
    }
  }));
  */
  if (!isLocal) {
    /*
    contents.push(_buildServer({
      'domain': 'kurento.naar.io',
      //'root': _baseDocRoot + 'kurento',
      'ssl': true,
      'location': {
        'localAddress': 'http://localhost:' + config.kurento.asPort
      }
    }));
    */

    contents.push(_buildServer({
      'domain': 'kurento.naar.io',
      //'root': _baseDocRoot + 'kurento',
      'ssl': false, // can't do it right now, unfortunately.
      'location': {
        'localAddress': 'http://localhost:' + config.kurento.wsPort + '/kurento',
        'upgrade': true
      }
    }));

    contents.push(_buildServer({
      'domain': 'turn.naar.io',
      //'root': _baseDocRoot + 'coturn',
      'location': {
        'localAddress': 'http://localhost:' + config.turn.port
      }
    }));

  }
  var c = contents.join('\n\n');
  console.log(c);
  return c;
};

var _buildPublicFolders = function(websites) {
  for (var i=0; i<websites.length; i++) {
    var site = _baseDocRoot + websites[i];
    nginxHelper.checkDirectory(site);
    nginxHelper.checkDirectory(site + '/client')
  }
};

// MAIN //

// Next make sure the cluster node paths exist.
nginxHelper.checkDirectory(_baseDocRoot);
_buildPublicFolders([
  'kurento',
  'naar',
  'coturn',
  'socket'
]);

var nodes = [{'port': ''}];
nginxHelper.checkDirectories(nodes);