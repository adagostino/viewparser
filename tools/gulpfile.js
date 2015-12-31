// make sure you install it globally:
// npm install --global gulp
// now install it for dev
// npm install --save-dev gulp
// install gulp-sass as well.
// npm install --save-dev gulp-sass
// install compass
// sudo gem install sass
// sudo gem install compass --pre
// npm install --save-dev gulp-compass
var cssDir = '../client/css',
    scssDir = '../client/scss';

var gulp = require('gulp'),
    sass = require('gulp-sass'),
    compass = require('gulp-compass'),
    config = require('../config.json'),
    BuildHelper = require('./helpers/buildHelper.js');

var helper = new BuildHelper();

// Create the directories.
helper.checkDirectory(cssDir);
helper.checkDirectory(scssDir);

var scssFiles = scssDir + '/**/*.scss';
var scssTaskName = 'scss';
// Create scss task.
gulp.task(scssTaskName, function() {
  gulp
    .src(scssFiles)
    .pipe(sass().on('error', sass.logError))
    .pipe(compass({
      'css': cssDir,
      'sass': scssDir
    }))
    .pipe(gulp.dest(cssDir));
});

gulp.task('default', function() {
  gulp.watch(scssFiles, [scssTaskName]);
});
