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
  const bucket = req.app.locals.s3Bucket;
  const photoName = res.locals.image.name;
  const uploadUrl = `${req.app.locals.photoApiUrl}/bucket/${bucket}/photos/${photoName}`;

  debugAppVars('UPLOAD_URL: ', uploadUrl);

  const redirect = err => (err ?
    res.redirect(`/?err=${err}`) :
    res.redirect('/')
  );

  const requestParams = {
    method: 'POST',
    uri: uploadUrl,
    body: res.locals.editedImage,
    headers: {
      'content-type': res.locals.image.mimeType,
    },
  };

  req.app.locals.request(requestParams, (err, result, body) => {
    if (err && err.code === 'ECONNREFUSED') {
      const url = `${err.address}:${err.port}`;
      return redirect(JSON.stringify({
        code: err.code,
        message: `Could not connect to photo-storage service at ${url}`,
      }));
    }

    if (err) {
      debugError('UPLOAD PHOTO REQUEST: ', err);
      return redirect(JSON.stringify({
        name: err.name,
        message: err.message,
      }));
    }

    if (result.statusCode === 200) {
      if (body) {
        return redirect();
      }

      return redirect(JSON.stringify({
        code: 'UploadFailed',
        message: 'Invalid response from photo-storage service',
      }));
    }

    if (body) {
      return redirect(JSON.stringify(body));
    }

    redirect(JSON.stringify({
      code: 'InternalServerError',
    }));
  });
};
