'use strict';

var gulp = require('gulp');
// var gutil = require('gulp-util');
var livereload = require('gulp-livereload');
var plumber = require('gulp-plumber');
var sourcemaps = require('gulp-sourcemaps');

var paths = {
    styles: 'src/css/**/*.css',
    scripts: 'src/js/**/*.js'
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
        .pipe(livereload());
});

// Build Javascripts
gulp.task('js', function () {
    var browserify = require('browserify');
    var source = require('vinyl-source-stream');
    var buffer = require('vinyl-buffer');
    // var uglify = require('gulp-uglify');

    var bundle = browserify({
        entries: 'src/js/TangramPlay.js',
        debug: true
    });

    return bundle.bundle()
        .pipe(plumber())
        .pipe(source('tangram-play.js'))
        .pipe(buffer())
        // .pipe(sourcemaps.init({ loadMaps: true }))
            // Add transformation tasks to the pipeline here.
            // .pipe(uglify())
            // .on('error', gutil.log)
        // .pipe(sourcemaps.write('.'))
        .pipe(gulp.dest('./build/js'));
});

// Rerun the task when a file changes
gulp.task('watch', function () {
    livereload.listen();
    gulp.watch(paths.styles, ['css']);
    gulp.watch(paths.scripts, ['js']);
});

// Build files, do not watch
gulp.task('build', ['css', 'js']);

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['css', 'js', 'watch']);
