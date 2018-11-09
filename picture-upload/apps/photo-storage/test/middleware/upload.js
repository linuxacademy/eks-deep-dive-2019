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

const { test } = require('ava');
const sinon = require('sinon');
const upload = require('../../middleware/upload.js');

const verifyMocks = (t) => {
  t.context.mockRes.status.verify();
  t.context.mockRes.json.verify();
  t.context.mockReq.app.locals.s3Store.uploadPhoto.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    status: sinon.mock(),
    json: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockReq = {
    app: {
      locals: {
        s3Store: {
          uploadPhoto: sinon.mock(),
        },
      },
    },
    body: new Buffer('foo'),
    params: {
      bucket: 'testBucket',
      photoName: 'testPhoto.jpg',
    },
  };
});

test.cb('should return upload details on success', (t) => {
  const req = t.context.mockReq;

  const uploadRes = {
    Bucket: req.params.bucket,
    key: req.params.photoName,
    location: `www.aws.s3/${req.params.bucket}/${req.params.photoName}.com`,
  };

  t.context.mockReq.app.locals.s3Store.uploadPhoto
    .once()
    .withArgs(uploadRes.Bucket, { Body: t.context.mockReq.body, Key: uploadRes.key })
    .resolves(uploadRes);

  t.context.mockRes.status.never();

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.bucket, uploadRes.Bucket);
      t.is(response.key, uploadRes.key);
      t.is(response.location, uploadRes.Location);
      verifyMocks(t);
      t.end();
    });

  upload(req, t.context.mockRes);
});

test.cb('should surface s3 errors if thrown', (t) => {
  const req = t.context.mockReq;

  const s3Error = {
    statusCode: 403,
    code: 'InvalidAccessKeyId',
    message: 'The AWS Access Key Id you provided does not exist in our records.',
  };

  t.context.mockReq.app.locals.s3Store.uploadPhoto
    .once()
    .withArgs(req.params.bucket, {
      Body: new Buffer(t.context.mockReq.body),
      Key: req.params.photoName,
    })
    .rejects(s3Error);

  t.context.mockRes.status
    .once()
    .withArgs(s3Error.statusCode)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.code, s3Error.code);
      t.is(response.message, s3Error.message);
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

test.cb('should return validation error if buffer is invalid', (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockReq.body = null;
  t.context.mockReq.app.locals.s3Store.uploadPhoto.never();

  t.context.mockRes.status
    .once()
    .withArgs(400)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.code, 'BadRequest');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

test.cb('should return 500 statusCode if unexpected rejected error', (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockReq.params = { bucket: 'testBucket' };

  t.context.mockReq.app.locals.s3Store.uploadPhoto
    .once()
    .rejects(new Error('foo'));

  t.context.mockRes.status
    .once()
    .withArgs(500)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.code, 'InternalServerError');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});
