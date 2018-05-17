/* eslint-disable global-require */
// Allow require() to exist only in specific tasks if they are only used once.
const gulp = require('gulp');
const gutil = require('gulp-util');
const notify = require('gulp-notify');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');

const server = browserSync.create();

const paths = {
  styles: {
    src: 'src/css/**/*.css',
    entry: 'src/css/main.css',
    dest: 'public/stylesheets',
  },
  scripts: {
    src: 'src/js/**/*.{js,jsx,json}',
    entry: ['src/js/main.js', 'src/js/embedded.js'],
    dest: 'public/scripts',
  },
  app: 'public/index.html',
};

function handleErrors(...args) {
  notify.onError({
    title: 'Tangram Play · Compile Error',
    message: '<%= error.message %>',
    sound: 'Sosumi', // Mac OSX alert sound
  }).apply(this, args);
  this.emit('end'); // Keep gulp from hanging on this task
}

// Build stylesheets
gulp.task('css', () => {
  const postcss = require('gulp-postcss');
  const autoprefixer = require('autoprefixer');
  const cssimport = require('postcss-import');
  const nested = require('postcss-nested');
  const customProperties = require('postcss-custom-properties');
  const colorHexAlpha = require('postcss-color-hex-alpha');
  const csswring = require('csswring');
  const reporter = require('postcss-reporter');

  const plugins = [
    cssimport,
    nested,
    customProperties(),
    colorHexAlpha(),
    autoprefixer({ browsers: ['last 2 versions', 'IE >= 11'] }),
    // preserveHacks is true because NOT preserving them doesn't mean
    // delete the hack, it means turn it into real CSS. Which is not
    // what we want!
    csswring({ removeAllComments: true, preserveHacks: true }),
    reporter(),
  ];

  return gulp.src(paths.styles.entry)
    .on('error', handleErrors)
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest(paths.styles.dest))
    // Since we generate sourcemaps, this causes browserSync.reload() to do
    // a full page reload because `.map` files are not found in the DOM. So we
    // pass the `match` option to only stream `.css` files to prevent injection
    // from also causing a full page reload.
    .pipe(browserSync.stream({ match: '**/*.css' }));
});

// Build Javascripts
gulp.task('js', () => {
  const browserify = require('browserify');
  const browserifyInc = require('browserify-incremental');
  const shim = require('browserify-shim');
  const babelify = require('babelify');
  const buffer = require('vinyl-buffer');
  const uglify = require('gulp-uglify');
  const envify = require('loose-envify');
  const tap = require('gulp-tap');

  const opts = {
    debug: true,
    extensions: ['.jsx'],
    transform: [
      babelify,
      shim,
      envify,
    ],
    // Option for browserify-incremental
    cacheFile: './browserify-cache.json',
  };

  // Set which browserify type to use for different environments.
  // In development, we use incremental browserify so rebuilds are faster.
  let browserifyEnv = browserifyInc;

  // In production, we use normal browserify because loose-envify only works
  // for normal browserify - not for incremental browserify.
  if (process.env.NODE_ENV === 'production') {
    browserifyEnv = browserify;
  }

  // Only uglify for deployment/production build,
  // because this doubles build time locally!
  if (process.env.NODE_ENV === 'production') {
    return gulp.src(paths.scripts.entry, {
      read: false, // no need to read files because browserify does.
    })
    // transform file objects using gulp-tap plugin
    .pipe(tap((file) => {
      gutil.log(`bundling ${file.path}`);

      // replace file contents with browserify's bundle stream
      // eslint-disable-next-line no-param-reassign
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
    .pipe(gulp.dest(paths.scripts.dest));
  }

  return gulp.src(paths.scripts.entry, {
    read: false, // no need to read files because browserify does.
  })
    // transform file objects using gulp-tap plugin
    .pipe(tap((file) => {
      gutil.log(`bundling ${file.path}`);

      // replace file contents with browserify's bundle stream
      // eslint-disable-next-line no-param-reassign
      file.contents = browserifyEnv(file.path, opts).bundle();
    }))
    .on('error', handleErrors)
    .pipe(gulp.dest(paths.scripts.dest));
});

// https://github.com/gulpjs/gulp/blob/4.0/docs/recipes/minimal-browsersync-setup-with-gulp4.md
function reload(done) {
  server.reload();
  done();
}

// Build files, do not watch
gulp.task('build', gulp.parallel('css', 'js'));

// Watch files, but do not run browsersync
gulp.task('watch', gulp.series('build', watch = () => {
  gulp.watch(paths.styles.src, gulp.series('css'));
  gulp.watch(paths.scripts.src, gulp.series('js'));
}));

// Re-load the browser when a file changes
function initServer() {
  server.init({
    port: 8080,
    open: false,
    server: {
      baseDir: './public',
    },
    ui: {
      port: 8081,
    },
    ghostMode: false,
  });

  gulp.watch(paths.styles.src, gulp.series('css'));
  gulp.watch(paths.scripts.src, gulp.series('js', reload));
  gulp.watch(paths.app).on('change', reload);
}

// build and serve
gulp.task('serve', gulp.series('build', initServer));

// The default task (called when you run `gulp` from cli)
gulp.task('default', gulp.series('serve'));
