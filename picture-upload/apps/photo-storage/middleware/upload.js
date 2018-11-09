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

module.exports = (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    return res.status(400).json({
      code: 'BadRequest',
      message: 'Unable to parse request. Verify your content-type to be of image/*',
    });
  }

  const params = {
    Body: req.body,
    Key: req.params.photoName,
  };

  req.app.locals.s3Store.uploadPhoto(req.params.bucket, params)
    .then((result) => {
      res.json({
        bucket: result.Bucket,
        key: result.key,
        location: result.Location,
      });
    })
    .catch((e) => {
      // surface errors from s3
      if (e.statusCode && e.code) {
        return res.status(e.statusCode).json({
          code: e.code,
          message: e.message,
        });
      }

      res.status(500).json({
        code: 'InternalServerError',
        name: e.name,
        message: e.message,
      });
    });
};
