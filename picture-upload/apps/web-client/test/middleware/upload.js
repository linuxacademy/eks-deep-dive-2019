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

const testBucket = 'testBucket';

const verifyMocks = (t) => {
  t.context.mockRes.redirect.verify();
  t.context.mockReq.app.locals.request.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    locals: {
      image: {
        name: 'foo.jpg',
        mimeType: 'image/jpeg',
      },
      editedImage: new Buffer('grey-foo'),
    },
    redirect: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockReq = {
    app: {
      locals: {
        photoApiUrl: 'http://localhost:test',
        s3Bucket: testBucket,
        request: sinon.mock(),
      },
    },
  };
});

test.cb('should redirect to homepage with upload response', (t) => {
  const uploadRes = {
    Bucket: testBucket,
    key: t.context.mockRes.locals.image.name,
  };

  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 200 }, uploadRes);
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      t.is(url, '/');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

test.cb('should redirect to homepage if upload responds with no data', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 200 });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      // eslint-disable-next-line max-len
      t.is(url, '/?err={"code":"UploadFailed","message":"Invalid response from photo-storage service"}');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

test.cb('should redirect to homepage with request error', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(new Error('foo'));
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      t.is(url, '/?err={"name":"Error","message":"foo"}');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage if request statusCode is not 200 but has body', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 500 }, { code: 'InternalServerError' });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      t.is(url, '/?err={"code":"InternalServerError"}');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage if request statusCode is not 200 and has no body', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 500 });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      t.is(url, '/?err={"code":"InternalServerError"}');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage with error if cannot connect to photo-storage service', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.editedImage);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb({ code: 'ECONNREFUSED', address: '127.0.0.1', port: '3001' });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      // eslint-disable-next-line max-len
      t.is(url, '/?err={"code":"ECONNREFUSED","message":"Could not connect to photo-storage service at 127.0.0.1:3001"}');
      verifyMocks(t);
      t.end();
    });

  upload(t.context.mockReq, t.context.mockRes);
});

