var XRay = require('aws-xray-sdk');            // Initialize X-ray SDK
var AWS = XRay.captureAWS(require('aws-sdk')); // Capture all AWS SDK calls
var http = XRay.captureHTTPs(require('http')); // Capture all HTTP/HTTPS calls

const express = require('express');
var bodyParser = require('body-parser');
var queryString = require('querystring');


// Constants
const PORT = 8080;
const apiCNAME = process.env.API_CNAME || 'localhost';

// App
const app = express();

XRay.config([XRay.plugins.EC2Plugin, XRay.plugins.ECSPlugin]);
XRay.middleware.enableDynamicNaming();

app.use(bodyParser.urlencoded({extended: false}));

// Start capturing the calls in the application
app.use(XRay.express.openSegment('service-a'));

app.get('/health', function(req, res) {
  res.status(200).send("Healthy");
});

app.get('/', function(req, res) {
  var seg = XRay.getSegment();
  seg.addAnnotation('service', 'service-b-request');

  var reqData = queryString.stringify(req.body);

  var options = {
    host: apiCNAME,
    port: '80',
    path: '/create',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(reqData)
    }
  };

  // Set up the request
  var remoteReq = http.request(options, function(remoteRes) {
    var body = '';
    remoteRes.setEncoding('utf8');

    remoteRes.on('data', function(chunk) {
      body += chunk;
    });

    remoteRes.on('end', function() {
      res.status(200).send(body);
    });
  });

  remoteReq.on('error', function() {
    console.log('service-b request failed');
  });

  // post the data
  remoteReq.write(reqData);
  remoteReq.end();
});

// Stop capturing the calls in the application
app.use(XRay.express.closeSegment());

app.listen(PORT);
console.log('Running on http://0.0.0.0:' + PORT);
