/* eslint-disable prefer-arrow-callback */
/* eslint-disable func-names */
/* eslint-disable no-console */

'use strict';

const fs = require('fs');
const assert = require('assert');
const { execSync } = require('child_process');

const tempView = 'view.json';

const render = function (template, view) {
    const cmd = `fast render ${template} ${tempView}`;
    fs.writeFileSync(tempView, JSON.stringify(view, null, 2));
    const output = execSync(cmd).toString();
    let obj = {};
    try {
        obj = JSON.parse(output);
    } catch (e) {
        console.log('\n', e, '\n', output);
    }
    return obj;
};

const compare = function (expected, actual, parent) {
    Object.keys(expected).forEach((key) => {
        assert(actual[key] !== undefined, `expected property "${parent}.${key}" not defined\n${JSON.stringify(actual, null, 2)}`);
        if (typeof expected[key] === 'object') {
            compare(expected[key], actual[key], key);
        } else {
            assert.equal(actual[key], expected[key], `expected "${parent}.${key}" = "${expected[key]}", got "${actual[key]}"\n${JSON.stringify(actual, null, 2)}`);
        }
    });
    Object.keys(actual).forEach((key) => {
        assert(expected[key] !== undefined, `unexpected property "${parent}.${key}" defined\n${JSON.stringify(actual, null, 2)}`);
    });
};

const assertRendering = function (template, view, expected) {
    let actual;
    it('JSON format', () => {
        actual = render(template, view);
    });
    it('expected properties', () => {
        compare(expected, actual, 'declaration');
    });
};

const cleanUp = function () {
    it('temp file', () => {
        fs.unlinkSync(tempView);
    });
};

module.exports = {
    assertRendering,
    cleanUp
};
