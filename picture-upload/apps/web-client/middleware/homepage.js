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

const debug = require('debug');

const debugAppVars = debug('APP_VARS');
const debugError = debug('ERRORS');

module.exports = (req, res) => {
  // eslint-disable-next-line max-len
  const getPhotosUrl = `${req.app.locals.photoApiUrl}/bucket/${req.app.locals.s3Bucket}/photos`;

  debugAppVars('GET_PHOTOS_URL: ', getPhotosUrl);

  const renderHomepage = (ctx) => {
    res.render('index', Object.assign(
      { bucket: req.app.locals.s3Bucket },
      ctx
    ));
  };

  if (req.query && req.query.err) {
    return renderHomepage({ err: req.query.err });
  }

  req.app.locals.request.get(getPhotosUrl, (err, response, body) => {
    let bodyJson;

    if (err && err.code === 'ECONNREFUSED') {
      const url = `${err.address}:${err.port}`;
      return renderHomepage({
        err: JSON.stringify({
          code: err.code,
          message: `Could not connect to photo-storage service at ${url}`,
        }),
      });
    }

    if (err) {
      debugError('GET PHOTOS REQUEST: ', err);
      return renderHomepage({ err });
    }

    if (body) {
      try {
        bodyJson = JSON.parse(body);
      } catch (e) {
        debugError('GET PHOTOS REQUEST BODY PARSING: ', e);
        return renderHomepage({
          err: JSON.stringify({
            code: 'ParseError',
            message: `Could not parse: ${body}`,
          }),
        });
      }


      if (response.statusCode === 200 && bodyJson && bodyJson.photos) {
        return renderHomepage({ urls: bodyJson.photos });
      }

      if (response.statusCode === 404) {
        return renderHomepage({ urls: null });
      }

      debugError('INVALID PHOTOS REQUEST STATUS: ', {
        statusCode: response.statusCode,
        body
      });

      return renderHomepage({ err: body });
    }

    return renderHomepage({ err: 'No response body' });
  });
};
