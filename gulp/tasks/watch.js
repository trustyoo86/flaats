import config from '../config';
import gulp   from 'gulp';
import watch  from 'gulp-watch';
import runSequence from 'run-sequence';

gulp.task('watch', ['browserSync'], function() {

  global.isWatching = true;

  // Scripts are automatically watched and rebundled by Watchify inside Browserify task

  watch(config.assets.src, () => {
    gulp.start('assets');
  });

  watch(config.scripts.src, () => {
    gulp.start('browserify');
  });

  watch(config.styles.src, () => {
    gulp.start('styles');
  });

  watch(config.images.src, () => {
    gulp.start('images');
  });

  watch(config.fonts.src, () => {
    gulp.start('fonts');
  });

  watch(config.views.watch, () => {
    gulp.start('views');
  });

  watch('flaats-src/**/*.js', () => {
    //runSequence(['flaats', 'vendor-js']);
    gulp.start('flaats');
  });
});
