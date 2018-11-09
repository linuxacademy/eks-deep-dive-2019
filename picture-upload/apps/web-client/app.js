/*
  Copyright 2017 Linux Academy
  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const { DynamoDB } = require('aws-sdk');
const debug = require('debug');
const express = require('express');
const logger = require('morgan');
const multer = require('multer')();
const path = require('path');

const { v4: uuid } = require('uuid');

const Request = require('request');
const ServiceAgent = require('service-agent');

var request = Request.defaults({
  agentClass: ServiceAgent,
  agentOptions: { service: '' },
  pool: {}
});

const app = express();
const debugAppVars = debug('APP_VARS');
const dynamodb = new DynamoDB({ region: process.env.AWS_REGION || 'us-east-1' });

debugAppVars('PROCESS.ENV: ', process.env);

const filterHost =
  process.env.FILTER_HOST || (process.env.DOCKER_COMPOSE ? 'photo-filter' : 'localhost');
const filterPort = process.env.FILTER_PORT || '3002';
const storageHost =
  process.env.STORAGE_HOST || (process.env.DOCKER_COMPOSE ? 'photo-storage' : 'localhost');
const storagePort = process.env.STORAGE_PORT || '3001';

debugAppVars('EXTERNAL HOSTS/PORTS: ', {
  filterHost,
  filterPort,
  storageHost,
  storagePort,
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// inject dependencies into app.locals
app.locals = {
  request,
  uuid,
  dynamodb,
  filterApiUrl: `http://${filterHost}:${filterPort}`,
  photoApiUrl: `http://${storageHost}:${storagePort}`,
  table: 's3-photos-bucket-id',
};

if(filterPort == 0) {
  app.locals.filterApiUrl = `http://${filterHost}`;
}

if(storagePort == 0) {
  app.locals.photoApiUrl = `http://${storageHost}`;
}

debugAppVars('APP_LOCALS: ', {
  filterApiUrl: app.locals.filterApiUrl,
  photoApiUrl: app.locals.photoApiUrl,
});

// Get Or Create the S3 Bucket Id
app.use(require('./middleware/getOrCreateS3BucketId'));

// Routes: Homepage
app.get('/', require('./middleware/homepage'));

// Routes: Upload Image
app.post(
  '/photo',
  multer.single('uploadedImage'),
  require('./middleware/multipartToImage'),
  require('./middleware/filterGreyscale'),
  require('./middleware/upload')
);

app.get('/debug/app-vars', (req, res) => {
  res.json({
    ENV_VARS: {
      PORT: process.env.PORT,
      FILTER_HOST: process.env.FILTER_HOST,
      FILTER_PORT: process.env.FILTER_PORT,
      STORAGE_HOST: process.env.STORAGE_HOST,
      STORAGE_PORT: process.env.STORAGE_PORT,
      AWS_REGION: process.env.AWS_REGION,
      DEBUG: process.env.DEBUG,
    },
    EXTERNAL_HOSTS_PORTS: {
      filterHost,
      filterPort,
      storageHost,
      storagePort,
    },
    APP_LOCALS: {
      filterApiUrl: app.locals.filterApiUrl,
      photoApiUrl: app.locals.photoApiUrl,
    },
  });
});

module.exports = app;
