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
const s3StoreWithConn = require('../../stores/s3');

const testBucket = 'testBucket';
const generatedBucketName = `s3-photos-${process.env.STAGE}-${testBucket}`;
const testKey = 'testKey.jpg';

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockS3 = {
    createBucket: sinon.mock(),
    deleteObject: sinon.mock(),
    getSignedUrl: sinon.mock(),
    headObject: sinon.mock(),
    listObjectsV2: sinon.mock(),
    upload: sinon.mock(),
  };
});

test('assertBucket should create a bucket if it does not exist', (t) => {
  t.context.mockS3.createBucket
    .once()
    .withArgs({ Bucket: generatedBucketName })
    .returns({
      promise: sinon.mock()
        .withArgs()
        .resolves({ Location: `/${generatedBucketName}` }),
    });

  return s3StoreWithConn(t.context.mockS3).assertBucket(testBucket)
    .then((res) => {
      t.is(res.Location, `/${generatedBucketName}`);
      t.context.mockS3.createBucket.verify();
    });
});

test('deletePhoto should delete an item', (t) => {
  t.context.mockS3.deleteObject
    .once()
    .withArgs({
      Bucket: generatedBucketName,
      Key: testKey,
    })
    .returns({
      promise: sinon.mock()
        .withArgs()
        .resolves({}),
    });

  return s3StoreWithConn(t.context.mockS3).deletePhoto(testBucket, testKey)
    .then((res) => {
      t.deepEqual(res, {});
      t.context.mockS3.deleteObject.verify();
    });
});

test('getUrl should get a url for a photo', (t) => {
  const testUrl = 'https://s3.amazonaws.com/s3-photos-test-testBucket/img.jpg';
  const testParams = {
    Bucket: generatedBucketName,
    Key: testKey,
  };

  t.context.mockS3.getSignedUrl
    .once()
    .callsFake((op, params, cb) => {
      t.is(op, 'getObject');
      t.deepEqual(params, testParams);
      return cb(null, testUrl);
    });

  return s3StoreWithConn(t.context.mockS3).getPhotoUrl(testBucket, testKey)
    .then((res) => {
      t.is(res, testUrl);
      t.context.mockS3.getSignedUrl.verify();
    });
});

test('getUrl should if error occurs', (t) => {
  const testParams = {
    Bucket: generatedBucketName,
    Key: testKey,
  };

  t.context.mockS3.getSignedUrl
    .once()
    .callsFake((op, params, cb) => {
      t.is(op, 'getObject');
      t.deepEqual(params, testParams);
      return cb(new Error('oops'), null);
    });

  return t.throws(
    s3StoreWithConn(t.context.mockS3).getPhotoUrl(testBucket, testKey),
    'oops'
  )
    .then(() => t.context.mockS3.getSignedUrl.verify());
});

test('headObject should resolve metadata if an object exists', (t) => {
  const testParams = {
    Bucket: generatedBucketName,
    Key: testKey,
  };

  t.context.mockS3.headObject
    .once()
    .withArgs(testParams)
    .returns({
      promise: sinon.mock()
        .resolves({
          VersionId: 'null',
          ContentType: 'image/jpeg',
        }),
    });

  return s3StoreWithConn(t.context.mockS3).headObject(testBucket, testKey)
    .then((res) => {
      t.is(res.VersionId, 'null');
      t.is(res.ContentType, 'image/jpeg');
      t.context.mockS3.headObject.verify();
    });
});

test('listPhotos should get a list of urls for photos in a bucket', (t) => {
  const params = {
    Bucket: generatedBucketName,
    MaxKeys: 12,
  };

  const listRes = {
    Contents: [
      { Key: 'img1.jpg' },
      { Key: 'img2.jpg' },
    ],
    Name: generatedBucketName,
    MaxKeys: 12,
  };

  t.context.mockS3.listObjectsV2
    .once()
    .withArgs(params)
    .returns({
      promise: sinon.mock()
        .withArgs()
        .resolves(listRes),
    });

  return s3StoreWithConn(t.context.mockS3).listPhotos(testBucket)
    .then((res) => {
      t.deepEqual(res, listRes);
      t.context.mockS3.listObjectsV2.verify();
    });
});

test('listPhotos should accept an optional limit and cursor', (t) => {
  const params = {
    Bucket: generatedBucketName,
    MaxKeys: 2,
    StartAfter: 'testCursor',
  };

  const listRes = {
    Contents: [
      { Key: 'img1.jpg' },
      { Key: 'img2.jpg' },
    ],
    Name: generatedBucketName,
    MaxKeys: 12,
  };

  t.context.mockS3.listObjectsV2
    .once()
    .withArgs(params)
    .returns({
      promise: sinon.mock()
        .withArgs()
        .resolves(listRes),
    });

  return s3StoreWithConn(t.context.mockS3).listPhotos(testBucket, 2, 'testCursor')
    .then((res) => {
      t.deepEqual(res, listRes);
      t.context.mockS3.listObjectsV2.verify();
    });
});

test('uploadPhoto should upload a photo', (t) => {
  const params = {
    ContentType: 'image',
    Bucket: generatedBucketName,
    Key: testKey,
    Body: 'imageBody',
  };

  const uploadRes = {
    Bucket: generatedBucketName,
    key: testKey,
    Location: `https://s3.amazonaws.com/${generatedBucketName}/${testKey}`,
  };

  t.context.mockS3.upload
    .once()
    .withArgs(params)
    .returns({
      promise: sinon.mock()
        .withArgs()
        .resolves(uploadRes),
    });

  return s3StoreWithConn(t.context.mockS3).uploadPhoto(
    testBucket,
    { Key: testKey, Body: 'imageBody' }
  )
    .then((result) => {
      t.deepEqual(result, uploadRes);
      t.context.mockS3.upload.verify();
    });
});
