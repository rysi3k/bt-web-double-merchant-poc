const webpack = require('webpack')
const path = require('path')

const config = {
  entry: ['./index.jsx'],
  output: {
    filename: 'body.js',
    path: __dirname + '/dist',
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
    ]
  },
  resolve: {
    extensions: ['', '.js', '.jsx'],
    root: path.resolve('./'),
  },
  plugins: [

  ]

}

config.plugins.push(
  new webpack.HotModuleReplacementPlugin(),
)
config.devtool = 'eval'
config.devServer = {
  host: '0.0.0.0',
  port: 8020,
  hot: true,
  inline: true,
  disableHostCheck: true,
}

module.exports = config
