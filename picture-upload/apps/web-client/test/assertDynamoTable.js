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
const assertDynamoTable = require('../assertDynamoTable.js');

const verifyMocks = (t) => {
  t.context.dynamodb.createTable.verify();
  t.context.dynamodb.describeTable.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.dynamodb = {
    createTable: sinon.mock(),
    describeTable: sinon.mock(),
  };
});

test('should create dynamodb table if it does not exist', (t) => {
  t.context.dynamodb.createTable
    .once()
    .callsFake((tableDef) => {
      t.is(tableDef.AttributeDefinitions[0].AttributeName, 'id');
      t.is(tableDef.AttributeDefinitions[0].AttributeType, 'S');
      t.is(tableDef.KeySchema[0].AttributeName, 'id');
      t.is(tableDef.KeySchema[0].KeyType, 'HASH');
      t.is(tableDef.TableName, 'testTable');
      return {
        promise: sinon.mock().once().resolves({ TableName: 'testTable' }),
      };
    });

  t.context.dynamodb.describeTable.never();

  return assertDynamoTable(t.context.dynamodb, 'testTable')
    .then((result) => {
      t.is(result.TableName, 'testTable');
      verifyMocks(t);
    });
});

test('should return dynamodb table description if it already exists', (t) => {
  t.context.dynamodb.createTable
    .once()
    .callsFake((tableDef) => {
      t.is(tableDef.AttributeDefinitions[0].AttributeName, 'id');
      t.is(tableDef.AttributeDefinitions[0].AttributeType, 'S');
      t.is(tableDef.KeySchema[0].AttributeName, 'id');
      t.is(tableDef.KeySchema[0].KeyType, 'HASH');
      t.is(tableDef.TableName, 'testTable');
      return {
        promise: sinon.mock().once().rejects({ message: 'Table already exists' }),
      };
    });

  t.context.dynamodb.describeTable
    .once()
    .callsFake((params) => {
      t.is(params.TableName, 'testTable');
      return {
        promise: sinon.mock().once().resolves({ TableName: 'testTable' }),
      };
    });

  return assertDynamoTable(t.context.dynamodb, 'testTable')
    .then((result) => {
      t.is(result.TableName, 'testTable');
      verifyMocks(t);
    });
});
