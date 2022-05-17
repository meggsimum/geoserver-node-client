#!/usr/bin/env node

/**
 * Copies the package.json to the ES5 compatible "dist" directory
 * and change its "type" to "commonjs"
 */

import fs from 'fs';

const inputData = fs.readFileSync('package.json');
const packageJson = JSON.parse(inputData);

packageJson.type = 'commonjs';

const outputData = JSON.stringify(packageJson, undefined, 2);
fs.writeFileSync('./dist/package.json', outputData);
