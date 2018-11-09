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

const AWS = require('aws-sdk');

const generateBucketName = name => `s3-photos-${process.env.STAGE}-${name}`;

const assertBucket = s3 => (bucketName) => {
  const Bucket = generateBucketName(bucketName);
  return s3.createBucket({ Bucket }).promise();
};

const deletePhoto = s3 => (bucketName, key) => {
  const params = { Bucket: generateBucketName(bucketName), Key: key };
  return s3.deleteObject(params).promise();
};

const getPhotoUrl = s3 => (bucketName, key) => new Promise((resolve, reject) => {
  const params = { Bucket: generateBucketName(bucketName), Key: key };
  return s3.getSignedUrl('getObject', params, (err, url) => {
    if (err) {
      return reject(err);
    }
    resolve(url);
  });
});

const headObject = s3 => (bucketName, key) => {
  const params = { Bucket: generateBucketName(bucketName), Key: key };
  return s3.headObject(params).promise();
};

const listPhotos = s3 => (bucketName, limit, cursor) => {
  const params = Object.assign(
    { Bucket: generateBucketName(bucketName) },
    limit ? { MaxKeys: limit } : { MaxKeys: 12 },
    cursor ? { StartAfter: cursor } : {}
  );

  return s3.listObjectsV2(params).promise();
};

const uploadPhoto = s3 => (bucketName, data) => {
  const params = {
    ContentType: 'image',
    Bucket: generateBucketName(bucketName),
    Key: data.Key,
    Body: data.Body,
  };

  return s3.upload(params).promise();
};

module.exports = function s3Store(s3Conn) {
  /* istanbul ignore next */
  const s3 = s3Conn || new AWS.S3({
    apiVersion: '2006-03-01',
    region: process.env.AWS_REGION || 'us-east-1',
  });

  return {
    assertBucket: assertBucket(s3),
    deletePhoto: deletePhoto(s3),
    getPhotoUrl: getPhotoUrl(s3),
    listPhotos: listPhotos(s3),
    headObject: headObject(s3),
    uploadPhoto: uploadPhoto(s3),
  };
};
