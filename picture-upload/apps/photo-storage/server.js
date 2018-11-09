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

const app = require('express')();
const bodyParser = require('body-parser');
const s3Store = require('./stores/s3')();

const PORT = process.env.API_PORT || 3001;

const validMimeTypes = ['image/bmp', 'image/jpeg', 'image/png'];
const isValidImageMimeType = req => validMimeTypes.includes(req.headers['content-type']);

app.locals = { s3Store };

app.use(bodyParser.raw({ limit: '10mb', type: isValidImageMimeType }));

app.use((err, req, res, next) => {
  if (err.statusCode === 413) {
    return res.status(413).json({ code: 'EntityTooLarge' });
  }

  next();
});

app.get('/', (req, res) => {
  res.send('welcome to the photo-storage api');
});

// Endpoint: Upload an image
app.post(
  '/bucket/:bucket/photos/:photoName',
  require('./middleware/assertBucket'),
  require('./middleware/upload')
);

// Endpoint: List Photo urls
app.get('/bucket/:bucket/photos', require('./middleware/listUrls'));

// Endpoint: Delete Photo
app.delete('/bucket/:bucket/photos/:photo', require('./middleware/delete'));

// Endpoint: Get Photo URL
app.get('/bucket/:bucket/photos/:photo', require('./middleware/getUrl'));

// catch all if a path does not exist
app.use((req, res) => {
  res.status(404).json({ code: 'RouteNotFound' });
});

app.listen(PORT, () => {
  console.log(`Photo Storage API listening on http://localhost:${PORT}`);
});
