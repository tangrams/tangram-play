module.exports = function setKarmaConfig(config) {
  config.set({
    basePath: '',
    frameworks: ['browserify', 'mocha', 'sinon'],
    files: [
      // Source
      // 'src/js/**/*.js',
      // // Application
      // 'public/stylesheets/main.css',
      // 'public/index.html',
      // Test suites
      'test/**/*.js',
      'test/**/*.jsx',
    ],

    exclude: [],
    preprocessors: {
      'test/**/*.{js,jsx}': ['browserify'],
    },

    browserify: {
      debug: true,
      extensions: ['.jsx'],
      transform: [
        ['babelify', { presets: ['es2015', 'react'] }],
        'brfs',
      ],
      // Configuration required for enzyme to work; see
      // http://airbnb.io/enzyme/docs/guides/browserify.html
      configure(bundle) {
        bundle.on('prebundle', () => {
          bundle.external('react/addons');
          bundle.external('react/lib/ReactContext');
          bundle.external('react/lib/ExecutionEnvironment');
        });
      },
    },

    plugins: [
      'karma-mocha',
      'karma-sinon',
      'karma-phantomjs-launcher',
      'karma-mocha-reporter',
      'karma-browserify',
    ],
    reporters: ['mocha'],

    port: 9876,
    colors: true,

    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['PhantomJS'],

    singleRun: true,
  });
};
