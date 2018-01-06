'use strict';

const _             = require(`lodash`);
const path          = require(`path`);
const PluginError   = require(`plugin-error`);
const through       = require(`through2`);

const defaults      = require(`./lib/default-config`);
const svg           = require(`./lib/svg`);
const templates     = require(`./lib/templates.js`);
const utils         = require(`./lib/utils.js`);

const PLUGIN_NAME   = utils.name;
const templatesPath = {
  'default-svg':  path.join(__dirname, `./templates/svg-symbols.svg`),
  'default-css':  path.join(__dirname, `./templates/svg-symbols.css`),
  'default-demo': path.join(__dirname, `./templates/svg-symbols-demo-page.html`),
};

function gulpSvgSymbols(opts = {}) {
  const buffer  = [];
  let defs      = [];

  // clone everything as we don't want to mutate anything
  const options = _.defaultsDeep(_.cloneDeep(opts), _.cloneDeep(defaults));
  // retore templates array as it will be messed up by _.defaultsDeep
  options.templates = opts.templates || defaults.templates;

  // expand path to default templates
  options.templates = options.templates.map( pathName => {
    if (pathName in templatesPath) return templatesPath[pathName];
    return pathName;
  });

  // Handle deprecation warnings for old options and fix the config
  // `className` option is now just `class`
  if (typeof options.className !== `undefined`) {
    utils.logWarn(options, `options.className is deprecated. Please replace it with options.class`);
    options.class = options.className;
  }
  // svgClassname option is now living inside svgAttrs
  if (typeof options.svgClassname !== `undefined`) {
    utils.logWarn(options, `options.svgClassname is deprecated. Please replace it with options.svgAttrs.class`);
    options.svgAttrs.class = options.svgClassname;
  }

  // buffer and transform every files
  return through.obj(function transform(file, encoding, cb) {

    if (file.isNull()) {
      return cb(null, file);
    }

    // we don't handle streams :,(
    // use https://github.com/nfroidure/gulp-streamify if you're reading this
    // next versions should use https://www.npmjs.com/package/bufferstreams
    if (file.isStream()) {
      const errorReason = `Streaming is not supported`;
      this.emit(`error`, new PluginError(PLUGIN_NAME, errorReason));
      return cb();
    }

    svg.parseFile(file, options, function (result) {
      buffer.push(result);
      return cb(null);
    });

  // put all generated files back in the stream
  }, function flush(cb) {
    const that    = this;

    // don't produce any file if no datas
    if (buffer.length === 0) {
      return cb();
    }

    const svgData = buffer.map(function (svgRawData) {
      // defs are not at an SVG level
      // they should be handled globally to the new SVG file
      if (svgRawData.defs) defs.push(svgRawData.defs);
      //
      return svg.formatForTemplate(svgRawData, options);
    });
    // force defs to have a value.
    // better for templates to check if `false` rather than length…
    defs = defs.length > 0 ? defs.join(`\n`) : false;

    // automatically insert xlink if needed
    // even if it's deprecated in SVG2 most software will still produce SVG 1.1
    // and I can't find find a good website for SVG2 support in browsers…
    const haystack  = svgData.map(templates.svgdataToSymbol).join(``) + (defs || ``);
    if (/\sxlink:[a-z]+=/.test(haystack)) {
      options.svgAttrs[`xmlns:xlink`] = `http://www.w3.org/1999/xlink`;
    }

    const files = templates.renderAll(options.templates, {
      svgAttrs: options.svgAttrs,
      icons: svgData,
      defs: defs,
    });

    function outputFiles(files) {
      files.forEach( file => that.push(file) );
      cb();
    }

    Promise
      .all(files)
      .then(outputFiles)
      .catch( err => {
        this.emit(`error`, new PluginError(PLUGIN_NAME, err, {showStack: true, }));
        cb();
      });
  });
}

module.exports = gulpSvgSymbols;
