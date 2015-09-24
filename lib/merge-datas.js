'use strict';

var _           = require('lodash');
var slug        = require('slug');

var formatText  = require('./utils').dynamicText;
var toCssSize   = require('./utils').cssSize;

function getDefaultData(svg, options) {
  var defaultData = {
    id:         formatText(options.id, slug(svg.name)),
    className:  formatText(options.className, slug(svg.name)),
    width:      toCssSize(svg.width, options.fontSize),
    height:     toCssSize(svg.height, options.fontSize),
  };

  if (options.title !== false) {
    defaultData.title = formatText(options.title, svg.name);
  }

  if (svg.style) defaultData.style = svg.style;

  return defaultData;
};

module.exports = function mergeDatas(svgRawData, options) {
  var result        = {};
  var lightOptions  = _.omit(options, ['transformData', 'templates']);
  var defaultData   = getDefaultData(svgRawData, options);

  result            = options.transformData(svgRawData, defaultData, lightOptions);
  result.svg        = svgRawData;

  return result;
};
