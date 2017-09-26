const admin = require('firebase-admin');
const path = require('path');
const fetch = require('node-fetch');

const config = require('../config/config.json');

const { sprinkler_stations } = config;

// eslint-disable-next-line import/no-dynamic-require
const serviceAccount = require(path.resolve(__dirname, '../config', config.privateKeyPath));

const homeApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: config.databaseURL,
});

const sprinklerStatusRef = homeApp.database().ref('garden/sprinklers/status');
sprinklerStatusRef.on('value', (snapshot) => {
  console.log('status', snapshot.val());
});

setInterval(() => {
  fetch(`${config.openSprinkler.URL}?pw=${config.openSprinkler.pwd_md5}`)
    .then(res => res.text())
    .then((body) => {
      sprinklerStatusRef.set(JSON.parse(body).sn
        .map((status, index) => {
          if (index >= sprinkler_stations.length || sprinkler_stations[index] === '') {
            return undefined;
          }
          const result = {};
          result[sprinkler_stations[index]] = status;
          return result;
        })
        .filter(v => v !== undefined)
        .reduce((prev, cur) => ({ ...prev, ...cur }), {}));
    });
}, 60 * 1000);

