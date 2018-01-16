const path = require('path');

const config = {

   entry: {       // one per web page
      index: path.resolve(__dirname, 'dist', 'pages', 'index.js'),
      environments: path.resolve(__dirname, 'dist', 'pages', 'environments.js'),
      dashboard: path.resolve(__dirname, 'dist', 'pages', 'dashboard.js'),
      capture: path.resolve(__dirname, 'dist', 'pages', 'capture.js'),
      captures: path.resolve(__dirname, 'dist', 'pages', 'captures.js'),
      replay: path.resolve(__dirname, 'dist', 'pages', 'replay.js'),
      metrics: path.resolve(__dirname, 'dist', 'pages', 'metrics'),
   },

   output: {
      path: path.resolve(__dirname, 'static', 'js'),
      filename: '[name]-bundle.js',
   },

   module: {
      rules: [
         {
            test: /\.css$/,
            use: ['style-loader', 'css-loader'],
         },
         {
            test: /\.(woff|woff2|eot|ttf|otf|png|svg|jpg|gif)$/, // fonts and images
            use: ['file-loader'],
         },
      ],
   },

};

module.exports = config;
