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
const assertBucket = require('../../middleware/assertBucket.js');

const verifyMocks = (t) => {
  t.context.mockS3Store.assertBucket.verify();
  t.context.mockRes.status.verify();
  t.context.mockRes.json.verify(); // kinda weird how this one works, but it does!
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    status: sinon.mock(),
    json: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockS3Store = {
    assertBucket: sinon.mock(),
  };
});

test.cb('should call next if bucket is successfully created', (t) => {
  const req = {
    params: { bucket: 'testBucket' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  const next = () => {
    t.pass();
    t.end();
  };

  t.context.mockS3Store.assertBucket
    .once()
    .withArgs(req.params.bucket)
    .resolves({ Location: 'www.aws.s3/testBucket.com' });

  t.context.mockRes.status.never();
  t.context.mockRes.json.never();

  assertBucket(req, t.context.mockRes, next);
});

test.cb('should return S3 errors if they exist', (t) => {
  const req = {
    params: { bucket: 'testBucket' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  const s3Error = {
    statusCode: 403,
    code: 'InvalidAccessKeyId',
    message: 'The AWS Access Key Id you provided does not exist in our records.',
  };

  t.context.mockS3Store.assertBucket
    .once()
    .withArgs(req.params.bucket)
    .rejects(s3Error);

  t.context.mockRes.status
    .once()
    .withArgs(403)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .withArgs({ code: s3Error.code, message: s3Error.message })
    .callsFake(() => {
      verifyMocks(t);
      t.end();
    });

  assertBucket(req, t.context.mockRes);
});

test.cb('should return 500 statusCode if unexpected error thrown', (t) => {
  const req = {
    params: { bucket: 'testBucket' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  t.context.mockS3Store.assertBucket
    .once()
    .withArgs(req.params.bucket)
    .rejects(new Error('foo'));

  t.context.mockRes.status
    .once()
    .withArgs(500)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .withArgs({ code: 'InternalServerError' })
    .callsFake(() => {
      verifyMocks(t);
      t.end();
    });

  assertBucket(req, t.context.mockRes);
});
