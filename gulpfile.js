var gulp = require('gulp');
var ts = require('gulp-typescript');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var gulpIf = require('gulp-if');
var uglify = require('gulp-uglify');
var csso = require('gulp-csso');

var tsConfig = require('./tsconfig.json').compilerOptions;
tsConfig.typescript = require('typescript');

['', ':release'].forEach(function (release) {
	gulp.task('script'+release, function () {
		return gulp.src('./scripts/**/*.ts')
		  	.pipe(sourcemaps.init())
			.pipe(ts(tsConfig))	
		  	.pipe(gulpIf(release, uglify()))
		  	.pipe(sourcemaps.write('./'))
			.pipe(gulp.dest('./app/scripts'));
	});
	
	gulp.task('style'+release, function () {
		return gulp.src('./styles/*.scss')
		  .pipe(sourcemaps.init())
		  .pipe(sass())
		  .pipe(gulpIf(release, csso()))
		  .pipe(sourcemaps.write('./'))
		  .pipe(gulp.dest('./app/css'));
	});
});


gulp.task('build', ['script', 'style']);
gulp.task('build:release', ['script:release', 'style:release']);

gulp.task('watch', function () {
	gulp.watch('./scripts/**/*.ts', ['script']);
	gulp.watch('./styles/**/*.scss', ['style']);
});

gulp.task('default', ['build', 'watch']);