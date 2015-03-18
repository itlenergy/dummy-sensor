import commander from 'commander';
import {version} from './package.json';
import Promise from 'bluebird';
import moment from 'moment';

var request = Promise.promisify(require('request'));
var url = null;
var sensorId = null;
var minValue = null;
var maxValue = null;

function parseRange(val) {
  return val.split(',').map(Number);
}

async function setup() {
  commander
    .version(version)
    .option('-s, --id [sensor id]', 'The sensor ID to generate readings for', parseInt)
    .option('-a, --api-url [url]', 'The url of the API server')
    .option('-r, --range [range]', 'The range of the output, i.e., "0,1" for values between 0 and 1', parseRange)
    .option('-u, --username [username]', 'The username to authenticate with')
    .option('-p, --password [password]', 'The password to authenticate with')
    .option('-i, --interval [interval]', 'The interval in milliseconds to post values at')
    .parse(process.argv);
  
  let [response, body] = await request({
    method: 'post',
    body: {username: commander.username, password: commander.password},
    json: true,
    uri: commander.apiUrl + '/auth/login'
  });
  
  url = commander.apiUrl + '/sensors/' + commander.id + '/measurements?sgauth=' + body.ticket;
  sensorId = commander.id;
  minValue = commander.range[0];
  maxValue = commander.range[1];
}


function postMeasurement(value) {
  return request({
    method: 'post',
    body: {
      sensorId: commander.id,
      observationTime: moment().format('YYYY-MM-DD HH:mm:ss'),
      observation: value
    },
    json: true,
    uri: url
  });
}


async function generateMeasurement() {
  let value = Math.random() * (maxValue - minValue) + minValue;
  await postMeasurement(value);
  console.log(value);
}


setup().then(function () {
  setInterval(generateMeasurement, commander.interval);
});