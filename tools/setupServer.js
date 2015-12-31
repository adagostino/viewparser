// First you have to install node!!!
// ssh -i ~/Downloads/ubuntu.pem ubuntu@ec2-52-34-43-46.us-west-2.compute.amazonaws.com

// sudo apt-get install -y nodejs

var BuildHelper = require('./helpers/buildHelper.js'),
    cp = require('child_process'),
    config = require('../config.json'),
    credentials = require('../credentials.json');

var basePath = '/var/www';

var bh = new BuildHelper(basePath, '');

var commands = [];

commands.push('sudo apt-get update'); // udate everything.
// Next install the build essential
commands.push('sudo apt-get install -y build-essential');

// Install htop to monitor cpu usage etc.
commands.push('sudo apt-get install htop');

// Install git.
// https://www.digitalocean.com/community/tutorials/how-to-install-git-on-ubuntu-14-04
commands.push('sudo apt-get install git');
// Setup git (do later)

// Install letsencrypt
// https://www.paulwakeford.info/2015/11/24/letsencrypt/
// https://www.digitalocean.com/community/tutorials/how-to-secure-nginx-with-let-s-encrypt-on-ubuntu-14-04
// https://community.letsencrypt.org/t/unexpectedupdate-error-on-ubuntu-14-04-3/5471/2
// http://stackoverflow.com/questions/6599470/node-js-socket-io-with-ssl
commands.push('sudo cd / && git clone https://github.com/letsencrypt/letsencrypt');
commands.push('sudo cd /letsencrypt && ./letsencrypt-auto');
// // https://www.digitalocean.com/community/tutorials/how-to-create-an-ssl-certificate-on-nginx-for-ubuntu-14-04

// Install the turn server (coturn is the name).
// https://github.com/coturn/rfc5766-turn-server/
// Use wget to grab it, then untar with xvfz, then read the install file.

// Install kurento
commands.push('echo "deb http://ubuntu.kurento.org trusty kms6" | sudo tee /etc/apt/sources.list.d/kurento.list');
commands.push('wget -O - http://ubuntu.kurento.org/kurento.gpg.key | sudo apt-key add -');
commands.push('sudo apt-get install kurento-media-server-6.0');


// Install mongodb.
// https://www.digitalocean.com/community/tutorials/how-to-install-mongodb-on-ubuntu-14-04
commands.push('sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10');
commands.push('echo "deb http://repo.mongodb.org/apt/ubuntu "$(lsb_release -sc)"/mongodb-org/3.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-3.0.list');
commands.push('sudo apt-get update'); // Important to update
commands.push('sudo apt-get install -y mongodb-org');

// Install Redis.
// https://www.digitalocean.com/community/tutorials/how-to-install-and-use-redis
commands.push('sudo apt-get install tcl8.5');
commands.push('sudo wget http://download.redis.io/releases/redis-stable.tar.gz');
commands.push('sudo tar xzf redis-stable.tar.gz');
commands.push('cd redis-stable && make');
commands.push('cd redis-stable && make test');
commands.push('sudo cd redis-stable && make install');

bh.checkDirectory(basePath + '/naar');



var exec = function(cmd) {
  try {
    cp.execSync(cmd);
  } catch (err) {
    console.log('Error executing command', cmd);
    console.log(err);
  }
};

for (var i=0; i<commands.length; i++) {
  exec(commands[i]);
}

