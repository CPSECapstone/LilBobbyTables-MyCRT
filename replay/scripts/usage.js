#!/usr/bin/env node

const getUsage = require('command-line-usage');
const options = require('../dist/args').replayOptions;
console.log(getUsage([
   {
      header: 'MyCRT Replay Process',
      content: 'Runs a replay on a target database',
   },
   {
      header: 'Usage',
      content: 'mycrt-replay --id [underline]{number} --captureId [underline]{number} [Options...]',
   },
   {
      header: 'Options',
      optionList: options,
   },
]));
