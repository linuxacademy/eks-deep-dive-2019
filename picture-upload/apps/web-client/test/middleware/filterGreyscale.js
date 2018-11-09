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
const filterGreyscale = require('../../middleware/filterGreyscale.js');

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
        buffer: new Buffer('foo'),
      },
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

  // eslint-disable-next-line no-param-reassign
  t.context.mockNext = sinon.mock();
});

test.cb('should redirect to homepage with filterGreyscale response', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 200 }, new Buffer('grey-foo'));
    });

  t.context.mockRes.redirect.never();

  t.context.mockNext
    .once()
    .callsFake(() => {
      t.is(t.context.mockRes.locals.editedImage.toString(), 'grey-foo');
      verifyMocks(t);
      t.end();
    });

  filterGreyscale(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should redirect to homepage if filterGreyscale responds with no data', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 200 });
    });

  t.context.mockRes.redirect
    .once()
    .callsFake((body) => {
      // eslint-disable-next-line max-len
      t.is(body, '/?err={"code":"FilterFailed","message":"Invalid response from photo-filter service"}');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  filterGreyscale(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should redirect to homepage with request error', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(new Error('foo'));
    });

  t.context.mockRes.redirect
    .once()
    .callsFake((body) => {
      t.is(body, '/?err={"name":"Error","message":"foo"}');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  filterGreyscale(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage if request statusCode is not 200 but has body', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      // eslint-disable-next-line max-len
      cb(null, { statusCode: 500 }, new Buffer(JSON.stringify({ code: 'InternalServerError' })));
    });

  t.context.mockRes.redirect
    .once()
    .callsFake((body) => {
      t.is(body, '/?err={"code":"InternalServerError"}');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  filterGreyscale(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage if request statusCode is not 200 and has no body', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb(null, { statusCode: 500 });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      t.is(url, '/?err={"code":"InternalServerError"}');
      verifyMocks(t);
      t.end();
    });

  filterGreyscale(t.context.mockReq, t.context.mockRes);
});

// eslint-disable-next-line max-len
test.cb('should redirect to homepage unable to connect to photo-filter service', (t) => {
  t.context.mockReq.app.locals.request
    .once()
    .callsFake((params, cb) => {
      t.is(params.method, 'POST');
      t.is(params.body, t.context.mockRes.locals.image.buffer);
      t.is(params.headers['content-type'], 'image/jpeg');
      cb({ code: 'ECONNREFUSED', address: '127.0.0.1', port: '3002' });
    });

  t.context.mockRes.redirect
    .callsFake((url) => {
      // eslint-disable-next-line max-len
      t.is(url, '/?err={"code":"ECONNREFUSED","message":"Could not connect to photo-filter service at 127.0.0.1:3002"}');
      verifyMocks(t);
      t.end();
    });

  filterGreyscale(t.context.mockReq, t.context.mockRes);
});
