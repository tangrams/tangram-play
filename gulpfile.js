'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var livereload = require('gulp-livereload');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
    styles: 'src/css/**/*.css',
    scripts: 'src/js/**/*.js'
};

// Build stylesheets
gulp.task('css', function () {
    var postcss = require('gulp-postcss');
    var cssnext = require('cssnext');
    var nested = require('postcss-nested');
    var simplevars = require('postcss-simple-vars');
    var reporter = require('postcss-reporter');

    var options = {
        browsers: ['last 2 versions', 'IE >= 11'],
        compress: {
            comments: { removeAll: true },
            zindex: false
        },
        url: false, // TODO: Figure this out
        plugins: [
            nested,
            simplevars
        ]
    };

    var plugins = [
        cssnext(options),
        reporter()
    ];

    return gulp.src('./src/css/main.css')
        .pipe(sourcemaps.init())
        .pipe(postcss(plugins))
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/css'))
        .pipe(livereload());
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
        entries: 'src/js/TangramPlay.js',
        debug: true,
        transform: [babelify, shim]
    });

    return bundle.bundle()
        .pipe(source('tangram-play.js'))
        .pipe(buffer())
        .pipe(sourcemaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline here.
            .pipe(uglify())
            .on('error', gutil.log)
        .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/js'));
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(paths.styles, ['css']);
    gulp.watch(paths.scripts, ['js']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['css', 'js', 'watch']);
