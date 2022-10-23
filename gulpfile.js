const gulp = require("gulp");
const rename = require("gulp-rename");
const webserver = require("gulp-webserver");
const ts = require("gulp-typescript");
const sass = require("gulp-sass")(require("sass"));
const minify = require("gulp-minify");
const del = require("del");
const replace = require("gulp-replace");
const concat = require("gulp-concat");

const sourceDir = "src";
const distDir = "build";

const productionBuild = process.argv[2] === "build";

const transpileAndMinifyTypeScript = () =>
  gulp
    .src("src/scripts/ts/**/*.ts")
    .pipe(
      ts({
        noImplicitAny: true,
        lib: [
          "DOM",
          "ES2015.Core",
          "DOM.Iterable",
          "ES2015.Collection",
          "ES2015.Iterable",
          "ES2015",
        ],
        target: "es5",
      })
    )
    .pipe(
      minify({
        ext: {
          min: ".js",
        },
        noSource: true,
      })
    )
    .pipe(
      rename((path) => {
        path.basename += ".min";
      })
    )
    .pipe(concat("main.min.js"))
    .pipe(gulp.dest(productionBuild ? distDir : `${sourceDir}/scripts/js`));

const transpileAndMinifySASS = () => {
  let transpiledSASS = gulp
    .src("src/styles/scss/main.scss")
    .pipe(sass.sync({ outputStyle: "compressed" }));

  transpiledSASS = productionBuild
    ? transpiledSASS.pipe(replace("../", ""))
    : transpiledSASS;

  return transpiledSASS
    .pipe(
      rename((path) => {
        path.basename += ".min";
      })
    )
    .pipe(gulp.dest(productionBuild ? distDir : `${sourceDir}/styles/css`));
};

const watchTypeScript = () =>
  gulp.watch(`${sourceDir}/scripts/ts/**/*.ts`, transpileAndMinifyTypeScript);

const watchSASS = () =>
  gulp.watch(`${sourceDir}/styles/scss/**/*.scss`, transpileAndMinifySASS);

const clearDist = () => del(distDir);

const handleAssets = () =>
  gulp.src(`${sourceDir}/assets/**/*`).pipe(gulp.dest(`${distDir}/assets`));

const replaceAndHashHTMLResources = () => {
  const hash = (Math.random() + 1).toString(18).substring(2);
  const filesTypesToHash = ["css", "js", "ico", "png", "mp4"];
  const replaceRegExp = new RegExp(
    `(src|href)(=")(styles\/css\/|scripts\/js\/)?(.+.)(${filesTypesToHash.join(
      "|"
    )})(")`,
    "gi"
  );

  return gulp
    .src(`${sourceDir}/index.html`)
    .pipe(replace(replaceRegExp, `$1$2$4$5?v=${hash}$6`))
    .pipe(gulp.dest(distDir));
};

const startWebServer = () =>
  gulp.src(sourceDir).pipe(
    webserver({
      host: "localhost",
      port: 80,
      livereload: true,
      open: "http://localhost/",
    })
  );

exports.serve = gulp.parallel(
  transpileAndMinifyTypeScript,
  transpileAndMinifySASS,
  watchTypeScript,
  watchSASS,
  startWebServer
);

exports.build = gulp.series(
  clearDist,
  transpileAndMinifyTypeScript,
  transpileAndMinifySASS,
  replaceAndHashHTMLResources,
  handleAssets
);
