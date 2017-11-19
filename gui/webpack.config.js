const path = require('path');

const config = {
   entry: {       // one per web page
      index: path.resolve(__dirname, 'dist', 'pages', 'index.js'),
      environment: path.resolve(__dirname, 'dist', 'pages', 'environment.js'),
      capture: path.resolve(__dirname, 'dist', 'pages', 'capture.js'),
      captures: path.resolve(__dirname, 'dist', 'pages', 'captures.js'),
      replay: path.resolve(__dirname, 'dist', 'pages', 'replay.js'),
      metrics: path.resolve(__dirname, 'dist', 'pages', 'metrics'),
   },
   output: {
      path: path.resolve(__dirname, 'static', 'js'),
      filename: '[name]-bundle.js',
   },
};

module.exports = config;
