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
const listUrls = require('../../middleware/listUrls.js');

const verifyMocks = (t) => {
  t.context.mockRes.status.verify();
  t.context.mockRes.json.verify();
  t.context.mockS3Store.getPhotoUrl.verify();
  t.context.mockS3Store.listPhotos.verify();
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
    getPhotoUrl: sinon.mock(),
    listPhotos: sinon.mock(),
  };
});

test.cb('should return list of urls', (t) => {
  const params = { bucket: 'testBucket' };
  const req = {
    params,
    query: {},
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  const listRes = {
    IsTruncated: false,
    Contents: [
      {
        Key: 'img1.jpg',
        LastModified: '2017-07-26T22:33:06.000Z',
      },
      {
        Key: 'img2.jpg',
        LastModified: '2017-07-26T20:15:54.000Z',
      },
    ],
    Name: 's3-photos-dev-testBucket',
    Prefix: '',
    MaxKeys: 12,
    KeyCount: 2,
  };

  t.context.mockS3Store.listPhotos
    .once()
    .withArgs('testBucket', undefined, undefined)
    .resolves(listRes);

  t.context.mockS3Store.getPhotoUrl
    .exactly(listRes.Contents.length)
    .callsFake((bucket, key) => Promise.resolve(`www.aws-url.com/${key}`));

  t.context.mockRes.status.never();

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.photos.length, listRes.Contents.length);
      t.is(response.photos[0], 'www.aws-url.com/img1.jpg');
      t.is(response.photos[1], 'www.aws-url.com/img2.jpg');
      verifyMocks(t);
      t.end();
    });

  listUrls(req, t.context.mockRes);
});

test.cb('should take an optional limit', (t) => {
  const params = { bucket: 'testBucket' };
  const req = {
    params,
    query: {
      limit: 3,
    },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  const listRes = {
    IsTruncated: true,
    Contents: [
      {
        Key: 'img1.jpg',
        LastModified: '2017-07-26T22:33:06.000Z',
      },
      {
        Key: 'img2.jpg',
        LastModified: '2017-07-26T20:15:54.000Z',
      },
    ],
    Name: 's3-photos-dev-testBucket',
    Prefix: '',
    MaxKeys: 3,
    KeyCount: 2,
    NextContinuationToken: '6ypcgUsc7MDg',
  };

  t.context.mockS3Store.listPhotos
    .once()
    .withArgs('testBucket', 3, undefined)
    .resolves(listRes);

  t.context.mockS3Store.getPhotoUrl
    .exactly(listRes.Contents.length)
    .callsFake((bucket, key) => Promise.resolve(`www.aws-url.com/${key}`));

  t.context.mockRes.status.never();

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.cursor, listRes.NextContinuationToken);
      t.is(response.limit, 3);
      t.is(response.photos.length, listRes.Contents.length);
      t.is(response.photos[0], 'www.aws-url.com/img1.jpg');
      t.is(response.photos[1], 'www.aws-url.com/img2.jpg');
      verifyMocks(t);
      t.end();
    });

  listUrls(req, t.context.mockRes);
});

test.cb('should accept an optional cursor', (t) => {
  const params = { bucket: 'testBucket' };
  const req = {
    params,
    query: {
      cursor: 'asdf',
    },
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  const listRes = {
    IsTruncated: false,
    Contents: [],
    Prefix: '',
    MaxKeys: 12,
    KeyCount: 0,
    StartAfter: 'asdf',
  };

  t.context.mockS3Store.listPhotos
    .once()
    .withArgs('testBucket', undefined, 'asdf')
    .resolves(listRes);

  t.context.mockS3Store.getPhotoUrl
    .exactly(listRes.Contents.length)
    .callsFake((bucket, key) => Promise.resolve(`www.aws-url.com/${key}`));

  t.context.mockRes.status.never();

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.photos.length, listRes.Contents.length);
      verifyMocks(t);
      t.end();
    });

  listUrls(req, t.context.mockRes);
});

test.cb('should surface s3 errors if thrown', (t) => {
  const params = { bucket: 'testBucket' };
  const req = {
    params,
    query: {},
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

  t.context.mockS3Store.listPhotos
    .once()
    .withArgs('testBucket', undefined, undefined)
    .rejects(s3Error);

  t.context.mockS3Store.getPhotoUrl.never();

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

  listUrls(req, t.context.mockRes);
});

test.cb('should return 500 statusCode if unexpected rejected error', (t) => {
  const params = { bucket: 'testBucket' };
  const req = {
    params,
    query: {},
    app: {
      locals: {
        s3Store: t.context.mockS3Store,
      },
    },
  };

  t.context.mockS3Store.listPhotos
    .once()
    .withArgs('testBucket', undefined, undefined)
    .rejects(new Error('oops'));

  t.context.mockS3Store.getPhotoUrl.never();

  t.context.mockRes.status
    .once()
    .withArgs(500)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((response) => {
      t.is(response.code, 'InternalServerError');
      t.is(response.name, 'Error');
      t.is(response.message, 'oops');
      verifyMocks(t);
      t.end();
    });

  listUrls(req, t.context.mockRes);
});
