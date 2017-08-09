import config from '../config';
import gulp from 'gulp';
import uglify from 'gulp-uglify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import babelify from 'babelify';
import gulpif from 'gulp-if';
import buffer from 'vinyl-buffer';
import sourcemaps from 'gulp-sourcemaps';
import del from 'del';
import to5ify from '6to5ify';

gulp.task('flaats-del', function () {
  return del([config.flaats.dest]);
});

/**
 * flaats bundle
 * @name  flaats
 */
gulp.task('flaats', [], function () {
  var bundler = browserify({
    entries: config.flaats.src,
    debug: true
  });

  return bundler.transform(to5ify).bundle()
      .pipe(source(config.flaats.bundleName))
      .pipe(buffer())
      .pipe(gulpif(!global.isProd, sourcemaps.init({loadMaps:true})))
      .pipe(gulpif(global.isProd, uglify()))
      .pipe(gulpif(!global.isProd, sourcemaps.write('./')))
      .pipe(gulp.dest(config.flaats.dest));
});

gulp.task('flaats-min', [], function () {
  global.isProd = true;

  var bundler = browserify({
    entries: config.flaats.src,
    debug: true
  });

  return bundler.transform(to5ify).bundle()
      .pipe(source(config.flaats.minName))
      .pipe(buffer())
      .pipe(gulpif(global.isProd, uglify()))
      .pipe(gulp.dest(config.flaats.dest));
});