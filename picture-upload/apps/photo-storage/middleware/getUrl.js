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
  req.app.locals.s3Store.headObject(req.params.bucket, req.params.photo)
    .then(() => req.app.locals.s3Store.getPhotoUrl(req.params.bucket, req.params.photo))
    .then(url => res.send(url))
    .catch((e) => {
      if (e.statusCode && e.code) {
        return res.status(e.statusCode).json({
          code: e.code,
          message: e.message,
        });
      }

      res.status(500).json({ code: 'InternalServerError' });
    });
};
