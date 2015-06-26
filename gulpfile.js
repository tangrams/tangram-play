'use strict'

var gulp = require('gulp')

gulp.task('css', function () {
  var postcss = require('gulp-postcss')
  var cssnext = require('cssnext')
  var nested = require('postcss-nested')
  var simplevars = require('postcss-simple-vars')
  var sourcemaps = require('gulp-sourcemaps')
  var reporter = require('postcss-reporter')

  var options = {
    browsers: ['last 2 versions', 'IE >= 11'],
    compress: {
      comments: { removeAll: true },
      zindex: false
    },
    plugins: [
      nested,
      simplevars
    ]
  }

  var plugins = [
    cssnext(options),
    reporter()
  ]

  return gulp.src('./src/css/main.css')
    .pipe(sourcemaps.init())
    .pipe(postcss(plugins))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./css'))
})
