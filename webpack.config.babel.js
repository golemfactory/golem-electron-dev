const path = require('path');
const webpack = require('webpack');
const HappyPack = require('happypack');
const happyThreadPool = HappyPack.ThreadPool({ size: 5 });
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");
const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');

const modes = {
    DEV: 'development',
    PROD: 'production'
}

module.exports = (env, argv) => ({
    devtool: argv.mode === modes.DEV ? 'cheap-module-eval-source-map' : false,
    entry: {
        main: [
            'babel-polyfill',
            argv.mode === modes.DEV ? 'webpack/hot/only-dev-server' : false, 
            argv.mode === modes.DEV ? 'webpack-dev-server/client?http://0.0.0.0:3002' : false,
            './src/main'
        ].filter(Boolean),
        frame: [
            'babel-polyfill',
            argv.mode === modes.DEV ? 'webpack/hot/only-dev-server' : false, 
            argv.mode === modes.DEV ? 'webpack-dev-server/client?http://0.0.0.0:3002' : false,
            './src/main.frame'
        ].filter(Boolean),
        doc: [
            'babel-polyfill',
            argv.mode === modes.DEV ?'webpack/hot/only-dev-server' : false, 
            argv.mode === modes.DEV ? 'webpack-dev-server/client?http://0.0.0.0:3002' : false,
            './src/main.doc'
        ].filter(Boolean)
    },
    node: {
        fs: 'empty',
        tls: 'empty'
    },
    output: {
        path: path.join(__dirname, argv.mode === modes.DEV ? 'dist' : 'app'),
        filename: '[name].bundle.js',
        publicPath: argv.mode === modes.DEV ? '/static/' : './app/'
    },
    resolve: {
        alias: {
          'handlebars' : 'handlebars/dist/handlebars.js'
        }
    },
    plugins: [
        argv.mode === modes.PROD && new webpack.DefinePlugin({ // <-- key to reducing React's size
            'process.env': {
                'NODE_ENV': JSON.stringify('production')
            }
        }),
        new webpack.optimize.ModuleConcatenationPlugin(),
        new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            inject: true,
            chunks: ['main'],
            filename: '../index.html',
            template: 'template.html'
        }),
        new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            inject: true,
            chunks: ['frame'],
            filename: '../index.frame.html',
            template: 'template.html'
        }),
        new HtmlWebpackPlugin({
            alwaysWriteToDisk: true,
            inject: true,
            chunks: ['doc'],
            filename: '../index.documentation.html',
            template: 'template.html'
        }),
        new HtmlWebpackHarddiskPlugin(),
        new HappyPack({
            id: 'jsx',
            loaders: [{
                loader: 'babel-loader',
                options: {
                    cacheDirectory: true,
                    plugins: ['transform-decorators-legacy', argv.mode === modes.DEV && "react-hot-loader/babel" : false , "transform-class-properties"].filter(Boolean),
                    presets: ['react', 'env', 'stage-0']
                }
            }],
            threadPool: happyThreadPool
        }),
        new HappyPack({
            id: 'styles',
            loaders: [ 'style-loader', 'css-loader', 'sass-loader' ],
            threadPool: happyThreadPool,
        }),
        argv.mode === modes.PROD && new CompressionPlugin({ // <-- don't forget to activate gzip on web server
            asset: "[path].gz[query]",
            algorithm: "gzip",
            test: /\.js$|\.html$/,
            threshold: 10240,
            minRatio: 0.8
        }),
    //new webpack.ContextReplacementPlugin(/bindings$/, /^$/),
    //new BundleAnalyzerPlugin() // <--- Cool stuff to see package size of the modules
    ].filter(Boolean),
    module: {
        rules: [{
            test: /\.(js|jsx)$/,
            use: 'happypack/loader?id=jsx',
            include: path.join(__dirname, 'src'),
            exclude: /node_modules/
            },
            {
                // Test expects a RegExp! Note the slashes!
                test: /\.(scss)$/,
                use: 'happypack/loader?id=styles',
                // Include accepts either a path or an array of paths.
                include: path.join(__dirname, 'src/scss')
            },
            {
                test: /\.css$/,
                use: 'happypack/loader?id=styles'
            },
            {
                test: /\.(woff(2)?|ttf|eot)(\?[a-z0-9]+)?$/,
                use: ["file-loader"]
            },
            {
                test: /\.jpe?g$|\.gif$|\.png$|\.svg$/,
                use: ["file-loader"]
            }]
    }
});
