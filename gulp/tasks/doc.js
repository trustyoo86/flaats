'use strict';

import gulp from 'gulp';
import esdoc from 'gulp-esdoc-stream';
import path from 'path';

gulp.task('esdoc', () => {
  return gulp.src('flaats-src/src/**/*.js', {read: false})
    .pipe(esdoc('docs'));
});