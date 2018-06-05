'use strict'

// import general libs
import gulp from 'gulp'
import gulpPlugins from 'gulp-load-plugins'
const $ = gulpPlugins() // imports all gulp plugins into $
import yargs from 'yargs'

// preview browser setup
import browser from 'browser-sync'

// import css libs
import koutoSwiss from 'kouto-swiss'
import sgrid from 's-grid'
import prefix from 'autoprefixer-stylus'

// import js libs
import babel from 'babel-register'
import webpack from 'webpack'
import webpackConfig from './webpack.config.js'
import webpackStream from 'webpack-stream'
import named from 'vinyl-named'
import rimraf from 'rimraf'

// configurations
const config = {
  path: {
    src: {
      root: '/',
      html: 'src/pug/',
      css: 'src/stylus/',
      img: 'src/img/',
      js: 'src/js/',
    },
    dest: {
      root: 'dist/',
      html: 'dist/',
      css: 'dist/assets/css/',
      img: 'dist/assets/img/',
      js: 'dist/assets/js/',
    },
  },
  port: '8000',
  production: !!(yargs.argv.production),
  archive_name: 'archive',
  production_root_url: 'https://example.com/'
}

// clean dist before initiate to build

function clean(done) {
  return rimraf(config.path.dest.root, done)
}

// copy assets ignore css, js, imgs
function copy() {
  return gulp.src(`${config.path.src.root}/assets/**/*`)
    .pipe(gulp.dest(`${config.path.dest.root}/assets`));
}

// Render pug to html
function html() {
  return gulp.src(`${config.path.src.html}**/!(_)*.pug`)
    .pipe($.plumber())
    .pipe($.data((file) => {
      let relativePath = file.history[0].replace(file.base, '')
      let depth = (relativePath.match(/\//g) || relativePath.match(/\\/g) || []).length
      let relativeRoot = new Array(depth).join( '../' )
      return {
        relativeRoot: relativeRoot,
      }
    }))
    .pipe($.pug({
      pretty: true,
      basedir: config.path.src.html,
    }))
    .pipe($.htmlBeautify())
    .pipe(gulp.dest(`${config.path.dest.html}`))
}

// Render stylus to css
function css() {
  return gulp.src(`${config.path.src.css}**/!(_)*.styl`)
    .pipe($.plumber())
    .pipe($.sourcemaps.init())
    .pipe($.stylus({
      use: [
        koutoSwiss(),
        sgrid(),
      ],
    }))
    .pipe($.if(!config.production, $.sourcemaps.write('./')))
    .pipe(gulp.dest(`${config.path.dest.css}`))
}

function javascript() {
  return gulp.src(`${config.path.src.js}/app.js`)
    .pipe(named())
    .pipe($.sourcemaps.init())
    .pipe(webpackStream(webpackConfig,webpack))
    .pipe($.if(!config.production, $.sourcemaps.write()))
    .pipe(gulp.dest(`${config.path.dest.js}`))
}

// compress images
function images() {
  return gulp.src(`${config.path.src.img}/**/*`)
    .pipe($.if(config.production, $.imagemin({
      progressive: true
    })))
    .pipe(gulp.dest(`${config.path.dest.img}/`));
}

// generate sitemap
function sitemap() {
  return gulp.src(`${config.path.dest.html}/**/*.html`, {read: false})
    .pipe($.sitemap({
      siteUrl: config.production_root_url
    }))
    .pipe(gulp.dest(`${config.path.dest.root}`))
}

// Start local web server
function server(done) {
  browser.init({
    server: config.path.dest.html,
    port: config.port,
  })
  done()
}

function reload(done) {
  browser.reload();
  done();
}

// Watch assets
function watch() {
  gulp.watch(config.path.src.html).on('all', gulp.series(html, browser.reload))
  gulp.watch(config.path.src.css).on('all', gulp.series(css, browser.reload))
  gulp.watch(config.path.src.js).on('all', gulp.series(javascript, browser.reload))
  gulp.watch(config.path.src.img).on('all', gulp.series(images, browser.reload))
}

// register build task
gulp.task('build',
  gulp.series(clean, gulp.parallel(html, css, javascript, images, copy),sitemap, server, watch))

// register command
gulp.task('default',
  gulp.series('build', server, watch))

// register zip to shipping command

function ship() {
  return gulp.src(`${config.path.dest.root}/**/*`)
    .pipe($.zip(`${config.archive_name}.zip`))
    .pipe(gulp.dest('./'))
}

gulp.task('ship',
  gulp.series(clean, gulp.parallel(html, css, javascript, images, copy), sitemap, ship))
