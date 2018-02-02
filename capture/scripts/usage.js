#!/usr/bin/env node

const getUsage = require('command-line-usage');
const options = require('../dist/args').captureOptions;
console.log(getUsage([
   {
      header: 'MyCRT Capture Process',
      content: 'Runs a capture on a target database',
   },
   {
      header: 'Usage',
      content: 'mycrt-capture --id [underline]{number} [Options...]',
   },
   {
      header: 'Options',
      optionList: options,
   },
]));
