import gulp        from 'gulp';
import runSequence from 'run-sequence';

gulp.task('dev', ['clean'], function(cb) {

  global.isProd = false;

  runSequence(['vendor-css', 'vendor-js', 'assets', 'styles', 'images', 'fonts', 'views'], ['server','browserify'], 'watch', cb);

});
