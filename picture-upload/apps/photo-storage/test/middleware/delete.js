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
const del = require('../../middleware/delete.js');

const verifyMocks = (t) => {
  t.context.mockRes.status.verify();
  t.context.mockRes.json.verify();
  t.context.mockS3Store.deletePhoto.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    status: sinon.mock(),
    json: sinon.mock(),
    send: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockS3Store = {
    deletePhoto: sinon.mock(),
  };
});

test.cb('should return url if bucket and photo exists', (t) => {
  const req = {
    params: { bucket: 'testBucket', photo: 'testPhoto' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  t.context.mockS3Store.deletePhoto
    .once()
    .withArgs('testBucket', 'testPhoto')
    .resolves({});

  t.context.mockRes.status
    .once()
    .withArgs(204)
    .returns(t.context.mockRes);

  t.context.mockRes.json.never();

  t.context.mockRes.send
    .once()
    .callsFake((response) => {
      t.is(response, undefined);
      verifyMocks(t);
      t.end();
    });

  del(req, t.context.mockRes);
});

test.cb('should surface s3 errors if thrown', (t) => {
  const s3Error = {
    statusCode: 403,
    code: 'InvalidAccessKeyId',
    message: 'The AWS Access Key Id you provided does not exist in our records.',
  };

  const req = {
    params: { bucket: 'testBucket', photo: 'testPhoto' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  t.context.mockS3Store.deletePhoto
    .once()
    .withArgs('testBucket', 'testPhoto')
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

  del(req, t.context.mockRes);
});

test.cb('should return 500 statusCode if unexpected rejected error', (t) => {
  const req = {
    params: { bucket: 'testBucket', photo: 'testPhoto' },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  t.context.mockS3Store.deletePhoto
    .once()
    .withArgs('testBucket', 'testPhoto')
    .rejects(new Error('oops'));

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

  del(req, t.context.mockRes);
});
