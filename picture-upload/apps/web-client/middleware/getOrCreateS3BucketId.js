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

const debugError = require('debug')('ERROR');

module.exports = (req, res, next) => {
  const item = {
    Item: {
      id: { S: '1' }, // there should only be at max one record in this table
      s3BucketId: { S: req.app.locals.uuid() },
    },
    TableName: req.app.locals.table,
    ConditionExpression: 'attribute_not_exists(id)', // do not overwrite if a record exists
    ReturnValues: 'ALL_OLD',
  };

  return req.app.locals.dynamodb.putItem(item).promise()
    .catch((err) => {
      if (err.code === 'ConditionalCheckFailedException') {
        return req.app.locals.dynamodb.getItem({
          Key: {
            id: { S: '1' },
          },
          TableName: req.app.locals.table,
        }).promise();
      }

      if (err.code === 'ResourceNotFoundException') {
        return Promise.reject({
          code: 'ResourceNotFoundException',
          // eslint-disable-next-line max-len
          message: `${err.message} - the DynamoDB ${req.app.locals.table} table may still be initializing`,
        });
      }

      debugError('DYNAMO PUT ITEM: ', err);
      return Promise.reject(err);
    })

    .then(({ Item }) => {
      req.app.locals.s3Bucket = Item ? Item.s3BucketId.S : item.Item.s3BucketId.S;
      next();
    })

    .catch((err) => {
      debugError('DYNAMO GET ITEM: ', err);
      const errJson = {
        code: err.code,
        message: err.message,
      };

      res.status(500).json(errJson);
    });
};
