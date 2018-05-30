'use strict'

// import general libs
import gulp from 'gulp'
import gulpPlugins from 'gulp-load-plugins'
let $ = gulpPlugins() // imports all gulp plugins into $

// preview browser setup
import browser from 'browser-sync'

// import css libs
import koutoSwiss from 'kouto-swiss'
import sgrid from 's-grid'
import prefix from 'autoprefixer-stylus'

// import js libs
import babel from 'babel-register'

// configurations
const config = {
  path: {
    src: {
      html: 'src/pug/',
      css: 'src/stylus/',
      img: 'src/img/',
      js: 'src/js/',
    },
    dest: {
      html: 'dist/',
      css: 'dist/assets/css/',
      img: 'dist/assets/img/',
      js: 'dist/assets/js/',
    },
  },
  port: '8000',
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
      pretty: false,
      basedir: config.path.src.html,
    }))
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
    .pipe($.sourcemaps.write('./'))
    .pipe(gulp.dest(`${config.path.dest.css}`))
}

// Start local web server
function server(done) {
  browser.init({
    server: config.path.dest.html,
    port: config.port,
  })
  done()
}

// Watch assets
function watch() {
  gulp.watch(config.path.src.html).on('all', gulp.series(html, browser.reload))
  gulp.watch(config.path.src.css).on('all', gulp.series(css, browser.reload))
}

// register commands
gulp.task('default',
  gulp.series(gulp.parallel(html, css), server, watch))
