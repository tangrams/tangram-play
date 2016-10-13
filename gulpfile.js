/* eslint-disable */
// Eslint is not set up to deal with non-module files right now.
'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var notify = require('gulp-notify');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');

var paths = {
  styles: 'src/css/**/*.css',
  scripts: 'src/js/**/*.{js,jsx,json}',
  app: 'index.html'
};

function handleErrors() {
  var args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Tangram Play · Compile Error',
    message: '<%= error.message %>',
    sound: 'Sosumi' // Mac OSX alert sound
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

// Build stylesheets
gulp.task('css', function () {
  var postcss = require('gulp-postcss');
  var autoprefixer = require('autoprefixer');
  var cssimport = require('postcss-import');
  var nested = require('postcss-nested');
  var customProperties = require('postcss-custom-properties');
  var colorHexAlpha = require('postcss-color-hex-alpha');
  var csswring = require('csswring');
  var reporter = require('postcss-reporter');

  var plugins = [
    cssimport,
    nested,
    customProperties(),
    colorHexAlpha(),
    autoprefixer({ browsers: ['last 2 versions', 'IE >= 11'] }),
    // preserveHacks is true because NOT preserving them doesn't mean
    // delete the hack, it means turn it into real CSS. Which is not
    // what we want!
    csswring({ removeAllComments: true, preserveHacks: true }),
    reporter()
  ];

  return gulp.src('./src/css/main.css')
    .on('error', handleErrors)
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./build/css'))
    // Since we generate sourcemaps, this causes browserSync.reload() to do
    // a full page reload because `.map` files are not found in the DOM. So we
    // pass the `match` option to only stream `.css` files to prevent injection
    // from also causing a full page reload.
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

// Build Javascripts
gulp.task('js', function () {
  var browserify = require('browserify');
  var browserifyInc = require('browserify-incremental');
  var shim = require('browserify-shim');
  var babelify = require('babelify');
  var buffer = require('vinyl-buffer');
  var uglify = require('gulp-uglify');
  var envify = require('loose-envify');
  var tap = require('gulp-tap');

  var opts = {
    debug: true,
    extensions: ['.jsx'],
    transform: [
      babelify,
      shim,
      envify
    ],
    // Option for browserify-incremental
    cacheFile: './browserify-cache.json'
  };

  // Set which browserify type to use for different environments.
  // In development, we use incremental browserify so rebuilds are faster.
  var browserifyEnv = browserifyInc;

  // In production, we use normal browserify because loose-envify only works
  // for normal browserify - not for incremental browserify.
  if (process.env.NODE_ENV === 'production') {
    browserifyEnv = browserify;
  }

  // Only uglify for deployment/production build,
  // because this doubles build time locally!
  if (process.env.NODE_ENV === 'production') {
    return gulp.src(['src/js/main.js', 'src/js/embedded.js'], {
      read: false // no need to read files because browserify does.
    })
    // transform file objects using gulp-tap plugin
    .pipe(tap(function (file) {
      gutil.log('bundling ' + file.path);

      // replace file contents with browserify's bundle stream
      file.contents = browserifyEnv(file.path, opts).bundle();
    }))
    // transform streaming contents into buffer contents (because
    // gulp-sourcemaps does not support streaming contents)
    .pipe(buffer())
    .pipe(sourcemaps.init({ loadMaps: true }))
        // Add transformation tasks to the pipeline here.
        .pipe(uglify())
        .on('error', gutil.log)
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./build/js'));
  }

  return gulp.src(['src/js/main.js', 'src/js/embedded.js'], {
    read: false // no need to read files because browserify does.
  })
    // transform file objects using gulp-tap plugin
    .pipe(tap(function (file) {
      gutil.log('bundling ' + file.path);

        // replace file contents with browserify's bundle stream
      file.contents = browserifyEnv(file.path, opts).bundle();
    }))
    .on('error', handleErrors)
    .pipe(gulp.dest('./build/js'));
});

// Create a task that ensures the `js` task is complete
// before reloading browsers
gulp.task('js-watch', ['js'], browserSync.reload);

// Build files, do not watch
gulp.task('build', ['css', 'js']);

// Watch files, but do not run browsersync
gulp.task('watch', ['build'], function () {
  gulp.watch(paths.styles, ['css']);
  gulp.watch(paths.scripts, ['js']);
});

// Re-load the browser when a file changes
gulp.task('serve', ['build'], function () {
  browserSync.init({
    port: 8080,
    open: false,
    server: {
      baseDir: './'
    },
    ui: {
      port: 8081
    }
  });

  gulp.watch(paths.styles, ['css']);
  gulp.watch(paths.scripts, ['js-watch']);
  gulp.watch(paths.app).on('change', browserSync.reload);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['serve']);
