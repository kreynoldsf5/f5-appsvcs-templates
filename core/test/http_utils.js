/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable no-console */

'use strict';

const nock = require('nock');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const assert = chai.assert;

const httpUtils = require('../lib/http_utils');

const endpoint = 'http://localhost:8100';

describe('HTTP utils tests', function () {
    afterEach(function () {
        nock.cleanAll();
    });
    it('get', function () {
        nock(endpoint)
            .get('/resource')
            .reply(200, {});
        return httpUtils.makeGet('/resource')
            .then((result) => {
                assert.strictEqual(result.status, 200);
            });
    });
    it('get_empty_string', function () {
        nock(endpoint)
            .get('/resource')
            .reply(200, '');
        return httpUtils.makeGet('/resource')
            .then((result) => {
                assert.strictEqual(result.status, 200);
                assert.deepStrictEqual(result.body, {});
            });
    });
    it('get_bad_response', function () {
        nock(endpoint)
            .get('/resource')
            .reply(500, '{foo');
        assert.isRejected(httpUtils.makeGet('/resource'), /Invalid response object/);
    });
    it('post', function () {
        const sendBody = {
            foo: 'bar'
        };
        const refBody = {
            bar: 'foo'
        };
        nock(endpoint)
            .post('/resource', sendBody)
            .reply(200, refBody);
        return httpUtils.makePost('/resource', sendBody)
            .then((result) => {
                assert.strictEqual(result.status, 200);
                assert.deepStrictEqual(result.body, refBody);
            });
    });
    it('patch', function () {
        const sendBody = {
            foo: 'bar'
        };
        nock(endpoint)
            .patch('/resource', sendBody)
            .reply(200, {});
        return httpUtils.makePatch('/resource', sendBody)
            .then((result) => {
                assert.strictEqual(result.status, 200);
            });
    });
});
