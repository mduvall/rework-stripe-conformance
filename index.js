'use strict';

/**
 * Module dependencies
 */

var validateCustomProperties = require('./lib/validate-properties');
var validateSelectors = require('./lib/validate-selectors');
var validateRules = require('./lib/validate-rules');
var validateZIndices = require('./lib/validate-z-indices');

/**
 * Module exports
 */

module.exports = conformance;

/**
 * Constants
 */

var RE_DIRECTIVE = /@define ([A-Z][a-zA-Z]+)/;
var COMPOSITION_RE_DIRECTIVE = /@compose (([A-Z][a-zA-Z]+,?[\s]*)+)/;

/**
 * @param {Object} ast Rework AST
 * @param {Function} reworkInstance
 */

function conformance(ast, reworkInstance) {
  var initialComment = ast.rules[0].comment;
  var isDefinition = (initialComment && initialComment.match(/@define/));
  var isComponent = (initialComment && initialComment.match(RE_DIRECTIVE));
  if (!isDefinition) { return; }
  if (isDefinition && !isComponent) {
    console.warn(
      'WARNING: invalid component name in definition /*' + initialComment + '*/.',
      'Component names must be pascal-case, e.g., ComponentName.'
    );
    return;
  }

  var componentName = initialComment.match(RE_DIRECTIVE)[1].trim();
  var composedComponents;
  if (initialComment.match(COMPOSITION_RE_DIRECTIVE)) {
    composedComponents = initialComment.match(COMPOSITION_RE_DIRECTIVE)[1].trim().split(/(,\s*)|\s+/g);
  }
  var isStrict = true; // initialComment.match(RE_DIRECTIVE)[2] === 'use strict';
  var rules = getSimpleRules(ast.rules);

  validateRules(rules);
  validateSelectors(rules, componentName, composedComponents);
  validateCustomProperties(rules, componentName);
  validateZIndices(rules);
}

/**
 * Return an array of simple CSS rulesets, excluding @media rules, etc.
 *
 * @param {Object} rules Rules from Rework AST
 * @return {Array}
 */

function getSimpleRules(rules) {
  var simpleRules = [];
  rules.forEach(function (rule) {
    if (rule.rules) {
      simpleRules = simpleRules.concat(getSimpleRules(rule.rules));
    }
    if (rule.type == 'rule') {
      simpleRules.push(rule);
    }
  });
  return simpleRules;
}
