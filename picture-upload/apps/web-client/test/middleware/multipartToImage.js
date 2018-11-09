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
const multipartToImage = require('../../middleware/multipartToImage.js');

const verifyMocks = (t) => {
  t.context.mockRes.redirect.verify();
  t.context.mockNext.verify();
};

test.beforeEach((t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockRes = {
    locals: {},
    redirect: sinon.mock(),
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockReq = {
    file: {
      buffer: new Buffer('foo'),
      encoding: '7bit',
      mimetype: 'image/jpeg',
      originalname: 'image.jpeg',
    },
  };

  // eslint-disable-next-line no-param-reassign
  t.context.mockNext = sinon.mock();
});

test.cb('should set image file in res.locals', (t) => {
  t.context.mockRes.redirect.never();

  t.context.mockNext
    .once()
    .callsFake(() => {
      t.is(t.context.mockRes.locals.image.buffer, t.context.mockReq.file.buffer);
      t.is(t.context.mockRes.locals.image.encoding, t.context.mockReq.file.encoding);
      t.is(t.context.mockRes.locals.image.mimeType, t.context.mockReq.file.mimetype);
      t.is(t.context.mockRes.locals.image.name, t.context.mockReq.file.originalname);
      verifyMocks(t);
      t.end();
    });

  multipartToImage(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});

test.cb('should respond with 400 statusCode if content type not image', (t) => {
  // eslint-disable-next-line no-param-reassign
  t.context.mockReq.file.mimetype = 'video/mp4';

  t.context.mockRes.redirect
    .once()
    .callsFake((url) => {
      // eslint-disable-next-line max-len
      t.is(url, '/?err={"code":"InvalidMimeType","message":"File must be a jpg, png, or bmp"}');
      verifyMocks(t);
      t.end();
    });

  t.context.mockNext.never();

  multipartToImage(t.context.mockReq, t.context.mockRes, t.context.mockNext);
});
