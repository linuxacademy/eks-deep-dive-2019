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
const getOrCreateS3BucketId = require('../../middleware/getOrCreateS3BucketId.js');

const verifyMocks = (t) => {
  t.context.mockRes.json.verify();
  t.context.mockRes.status.verify();
  t.context.mockReq.app.locals.dynamodb.getItem.verify();
  t.context.mockReq.app.locals.dynamodb.putItem.verify();
  t.context.mockReq.app.locals.uuid.verify();
  t.context.mockNext.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    json: sinon.mock(),
    status: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockReq = {
    app: {
      locals: {
        dynamodb: {
          getItem: sinon.mock(),
          putItem: sinon.mock(),
        },
        s3Bucket: 'testBucket',
        table: 's3-photos-bucket-id',
        uuid: sinon.mock(),
      },
    },
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockNext = sinon.mock();
});

test.cb('should set the s3Bucket from if record does not exist', (t) => {
  t.context.mockReq.app.locals.uuid
    .once()
    .withArgs()
    .returns('111');

  t.context.mockReq.app.locals.dynamodb.putItem
    .once()
    .callsFake((item) => {
      t.is(item.Item.id.S, '1');
      t.is(item.Item.s3BucketId.S, '111');
      t.is(item.TableName, t.context.mockReq.app.locals.table);
      return {
        promise: sinon.mock().resolves({}),
      };
    });

  t.context.mockReq.app.locals.dynamodb.getItem.never();
  t.context.mockRes.status.never();
  t.context.mockRes.json.never();

  t.context.mockNext
    .once()
    .callsFake(() => {
      t.is(t.context.mockReq.app.locals.s3Bucket, '111');
      verifyMocks(t);
      t.end();
    });

  getOrCreateS3BucketId(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should set the s3Bucket from dynamo if record already exists', (t) => {
  t.context.mockReq.app.locals.uuid
    .once()
    .withArgs()
    .returns('222');

  t.context.mockReq.app.locals.dynamodb.putItem
    .once()
    .callsFake((item) => {
      t.is(item.Item.id.S, '1');
      t.is(item.Item.s3BucketId.S, '222');
      t.is(item.TableName, t.context.mockReq.app.locals.table);
      return {
        promise: sinon.mock().rejects({ code: 'ConditionalCheckFailedException' }),
      };
    });

  t.context.mockReq.app.locals.dynamodb.getItem
    .once()
    .callsFake((item) => {
      t.is(item.Key.id.S, '1');
      t.is(item.TableName, t.context.mockReq.app.locals.table);
      return {
        promise: sinon.mock().resolves({
          Item: {
            id: { S: '1' },
            s3BucketId: { S: '111' },
          },
        }),
      };
    });

  t.context.mockRes.status.never();
  t.context.mockRes.json.never();

  t.context.mockNext
    .once()
    .callsFake(() => {
      t.is(t.context.mockReq.app.locals.s3Bucket, '111');
      verifyMocks(t);
      t.end();
    });

  getOrCreateS3BucketId(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should call res.json if DynamoDB table is still being created', (t) => {
  t.context.mockReq.app.locals.uuid
    .once()
    .withArgs()
    .returns('111');

  t.context.mockReq.app.locals.dynamodb.putItem
    .once()
    .callsFake((item) => {
      t.is(item.Item.id.S, '1');
      t.is(item.Item.s3BucketId.S, '111');
      t.is(item.TableName, t.context.mockReq.app.locals.table);
      return {
        promise: sinon.mock().rejects({ code: 'ResourceNotFoundException' }),
      };
    });

  t.context.mockReq.app.locals.dynamodb.getItem.never();

  t.context.mockRes.status
    .once()
    .withArgs(500)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((e) => {
      t.is(e.code, 'ResourceNotFoundException');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  getOrCreateS3BucketId(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should call res.json if DynamoDB table rejects with unexpected error', (t) => {
  t.context.mockReq.app.locals.uuid
    .once()
    .withArgs()
    .returns('222');

  t.context.mockReq.app.locals.dynamodb.putItem
    .once()
    .callsFake((item) => {
      t.is(item.Item.id.S, '1');
      t.is(item.Item.s3BucketId.S, '222');
      t.is(item.TableName, t.context.mockReq.app.locals.table);
      return {
        promise: sinon.mock().rejects(new Error('oops')),
      };
    });

  t.context.mockReq.app.locals.dynamodb.getItem.never();

  t.context.mockRes.status
    .once()
    .withArgs(500)
    .returns(t.context.mockRes);

  t.context.mockRes.json
    .once()
    .callsFake((e) => {
      t.is(e.message, 'oops');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  getOrCreateS3BucketId(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});
