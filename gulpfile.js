'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync');

var paths = {
    styles: 'src/css/**/*.css',
    scripts: 'src/js/**/*.js',
    app: 'index.html'
};

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
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(postcss(plugins))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/css'))
        .pipe(browserSync.stream());
});

// Build Javascripts
gulp.task('js', function () {
    var browserify = require('browserify');
    var shim = require('browserify-shim');
    var babelify = require('babelify');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    var uglify = require('gulp-uglify');

    var bundle = browserify({
        entries: 'src/js/tangram-play.js',
        debug: true,
        transform: [
            babelify.configure({ presets: ['es2015'] }),
            shim
        ]
    });

    // Only uglify for deployment/production build,
    // because this doubles build time locally!
    if (process.env.NODE_ENV === 'deployment') {
        return bundle.bundle()
            .pipe(plumber())
            .pipe(source('tangram-play.js'))
            .pipe(buffer())
            .pipe(sourcemaps.init({ loadMaps: true }))
                // Add transformation tasks to the pipeline here.
                .pipe(uglify())
                .on('error', gutil.log)
            .pipe(sourcemaps.write('.'))
            .pipe(gulp.dest('./build/js'));
    }
    else {
        return bundle.bundle()
            .pipe(source('tangram-play.js'))
            .pipe(gulp.dest('./build/js'));
    }
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
