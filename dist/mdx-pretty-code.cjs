'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var jsdom = require('jsdom');
var rangeParser = require('parse-numeric-range');
var shiki = require('shiki');
var sanitizeHtml = require('sanitize-html');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var rangeParser__default = /*#__PURE__*/_interopDefaultLegacy(rangeParser);
var shiki__default = /*#__PURE__*/_interopDefaultLegacy(shiki);
var sanitizeHtml__default = /*#__PURE__*/_interopDefaultLegacy(sanitizeHtml);

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 *
 * @typedef {string} Type
 * @typedef {Object<string, unknown>} Props
 *
 * @typedef {null|undefined|Type|Props|TestFunctionAnything|Array.<Type|Props|TestFunctionAnything>} Test
 */

const convert =
  /**
   * @type {(
   *   (<T extends Node>(test: T['type']|Partial<T>|TestFunctionPredicate<T>) => AssertPredicate<T>) &
   *   ((test?: Test) => AssertAnything)
   * )}
   */
  (
    /**
     * Generate an assertion from a check.
     * @param {Test} [test]
     * When nullish, checks if `node` is a `Node`.
     * When `string`, works like passing `function (node) {return node.type === test}`.
     * When `function` checks if function passed the node is true.
     * When `object`, checks that all keys in test are in node, and that they have (strictly) equal values.
     * When `array`, checks any one of the subtests pass.
     * @returns {AssertAnything}
     */
    function (test) {
      if (test === undefined || test === null) {
        return ok
      }

      if (typeof test === 'string') {
        return typeFactory(test)
      }

      if (typeof test === 'object') {
        return Array.isArray(test) ? anyFactory(test) : propsFactory(test)
      }

      if (typeof test === 'function') {
        return castFactory(test)
      }

      throw new Error('Expected function, string, or object as test')
    }
  );
/**
 * @param {Array.<Type|Props|TestFunctionAnything>} tests
 * @returns {AssertAnything}
 */
function anyFactory(tests) {
  /** @type {Array.<AssertAnything>} */
  const checks = [];
  let index = -1;

  while (++index < tests.length) {
    checks[index] = convert(tests[index]);
  }

  return castFactory(any)

  /**
   * @this {unknown}
   * @param {unknown[]} parameters
   * @returns {boolean}
   */
  function any(...parameters) {
    let index = -1;

    while (++index < checks.length) {
      if (checks[index].call(this, ...parameters)) return true
    }

    return false
  }
}

/**
 * Utility to assert each property in `test` is represented in `node`, and each
 * values are strictly equal.
 *
 * @param {Props} check
 * @returns {AssertAnything}
 */
function propsFactory(check) {
  return castFactory(all)

  /**
   * @param {Node} node
   * @returns {boolean}
   */
  function all(node) {
    /** @type {string} */
    let key;

    for (key in check) {
      // @ts-expect-error: hush, it sure works as an index.
      if (node[key] !== check[key]) return false
    }

    return true
  }
}

/**
 * Utility to convert a string into a function which checks a given node’s type
 * for said string.
 *
 * @param {Type} check
 * @returns {AssertAnything}
 */
function typeFactory(check) {
  return castFactory(type)

  /**
   * @param {Node} node
   */
  function type(node) {
    return node && node.type === check
  }
}

/**
 * Utility to convert a string into a function which checks a given node’s type
 * for said string.
 * @param {TestFunctionAnything} check
 * @returns {AssertAnything}
 */
function castFactory(check) {
  return assertion

  /**
   * @this {unknown}
   * @param {Array.<unknown>} parameters
   * @returns {boolean}
   */
  function assertion(...parameters) {
    // @ts-expect-error: spreading is fine.
    return Boolean(check.call(this, ...parameters))
  }
}

// Utility to return true.
function ok() {
  return true
}

/**
 * @param {string} d
 * @returns {string}
 */
function color(d) {
  return '\u001B[33m' + d + '\u001B[39m'
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('./complex-types').Action} Action
 * @typedef {import('./complex-types').Index} Index
 * @typedef {import('./complex-types').ActionTuple} ActionTuple
 * @typedef {import('./complex-types').VisitorResult} VisitorResult
 * @typedef {import('./complex-types').Visitor} Visitor
 */

/**
 * Continue traversing as normal
 */
const CONTINUE = true;
/**
 * Do not traverse this node’s children
 */
const SKIP = 'skip';
/**
 * Stop traversing immediately
 */
const EXIT = false;

/**
 * Visit children of tree which pass a test
 *
 * @param tree Abstract syntax tree to walk
 * @param test Test node, optional
 * @param visitor Function to run for each node
 * @param reverse Visit the tree in reverse order, defaults to false
 */
const visitParents =
  /**
   * @type {(
   *   (<Tree extends Node, Check extends Test>(tree: Tree, test: Check, visitor: import('./complex-types').BuildVisitor<Tree, Check>, reverse?: boolean) => void) &
   *   (<Tree extends Node>(tree: Tree, visitor: import('./complex-types').BuildVisitor<Tree>, reverse?: boolean) => void)
   * )}
   */
  (
    /**
     * @param {Node} tree
     * @param {Test} test
     * @param {import('./complex-types').Visitor<Node>} visitor
     * @param {boolean} [reverse]
     */
    function (tree, test, visitor, reverse) {
      if (typeof test === 'function' && typeof visitor !== 'function') {
        reverse = visitor;
        // @ts-expect-error no visitor given, so `visitor` is test.
        visitor = test;
        test = null;
      }

      const is = convert(test);
      const step = reverse ? -1 : 1;

      factory(tree, null, [])();

      /**
       * @param {Node} node
       * @param {number?} index
       * @param {Array.<Parent>} parents
       */
      function factory(node, index, parents) {
        /** @type {Object.<string, unknown>} */
        // @ts-expect-error: hush
        const value = typeof node === 'object' && node !== null ? node : {};
        /** @type {string|undefined} */
        let name;

        if (typeof value.type === 'string') {
          name =
            typeof value.tagName === 'string'
              ? value.tagName
              : typeof value.name === 'string'
              ? value.name
              : undefined;

          Object.defineProperty(visit, 'name', {
            value:
              'node (' +
              color(value.type + (name ? '<' + name + '>' : '')) +
              ')'
          });
        }

        return visit

        function visit() {
          /** @type {ActionTuple} */
          let result = [];
          /** @type {ActionTuple} */
          let subresult;
          /** @type {number} */
          let offset;
          /** @type {Array.<Parent>} */
          let grandparents;

          if (!test || is(node, index, parents[parents.length - 1] || null)) {
            result = toResult(visitor(node, parents));

            if (result[0] === EXIT) {
              return result
            }
          }

          // @ts-expect-error looks like a parent.
          if (node.children && result[0] !== SKIP) {
            // @ts-expect-error looks like a parent.
            offset = (reverse ? node.children.length : -1) + step;
            // @ts-expect-error looks like a parent.
            grandparents = parents.concat(node);

            // @ts-expect-error looks like a parent.
            while (offset > -1 && offset < node.children.length) {
              // @ts-expect-error looks like a parent.
              subresult = factory(node.children[offset], offset, grandparents)();

              if (subresult[0] === EXIT) {
                return subresult
              }

              offset =
                typeof subresult[1] === 'number' ? subresult[1] : offset + step;
            }
          }

          return result
        }
      }
    }
  );

/**
 * @param {VisitorResult} value
 * @returns {ActionTuple}
 */
function toResult(value) {
  if (Array.isArray(value)) {
    return value
  }

  if (typeof value === 'number') {
    return [CONTINUE, value]
  }

  return [value]
}

/**
 * @typedef {import('unist').Node} Node
 * @typedef {import('unist').Parent} Parent
 * @typedef {import('unist-util-is').Test} Test
 * @typedef {import('unist-util-visit-parents').VisitorResult} VisitorResult
 * @typedef {import('./complex-types').Visitor} Visitor
 */

/**
 * Visit children of tree which pass a test
 *
 * @param tree Abstract syntax tree to walk
 * @param test Test, optional
 * @param visitor Function to run for each node
 * @param reverse Fisit the tree in reverse, defaults to false
 */
const visit =
  /**
   * @type {(
   *   (<Tree extends Node, Check extends Test>(tree: Tree, test: Check, visitor: import('./complex-types').BuildVisitor<Tree, Check>, reverse?: boolean) => void) &
   *   (<Tree extends Node>(tree: Tree, visitor: import('./complex-types').BuildVisitor<Tree>, reverse?: boolean) => void)
   * )}
   */
  (
    /**
     * @param {Node} tree
     * @param {Test} test
     * @param {import('./complex-types').Visitor} visitor
     * @param {boolean} [reverse]
     */
    function (tree, test, visitor, reverse) {
      if (typeof test === 'function' && typeof visitor !== 'function') {
        reverse = visitor;
        visitor = test;
        test = null;
      }

      visitParents(tree, test, overload, reverse);

      /**
       * @param {Node} node
       * @param {Array.<Parent>} parents
       */
      function overload(node, parents) {
        const parent = parents[parents.length - 1];
        return visitor(
          node,
          parent ? parent.children.indexOf(node) : null,
          parent
        )
      }
    }
  );

// To make sure we only have one highlighter per theme in a process
const highlighterCache = new Map();

function getThemesFromSettings(settings) {
  return (
    settings.themes || (settings.theme ? [settings.theme] : ['light-plus'])
  );
}

function highlightersFromSettings(settings) {
  const themes = getThemesFromSettings(settings);

  return Promise.all(
    themes.map(async (theme, i) => {
      const themeClass = `mdx-pretty-code-theme-${i}`;
      const themeName = theme.name || (typeof theme === 'string' ? theme : '');
      const highlighter = await shiki__default["default"].getHighlighter({
        ...settings,
        theme,
        themes: undefined,
      });
      highlighter.themeName = themeName.replace(/\s/g, '');
      highlighter.themeClass = themeClass;
      return highlighter;
    })
  );
}

function createRemarkPlugin(options = {}) {
  return () => async (tree) => {
    const {
      sanitizeOptions = {
        allowedAttributes: {
          code: ['style', 'data-language', 'class'],
          span: ['data-color', 'data-mdx-pretty-code', 'style', 'class'],
        },
      },
      shikiOptions = {},
      tokensMap = {},
      onVisitLine = () => {},
      onVisitHighlightedLine = () => {},
      onVisitHighlightedWord = () => {},
      ignoreUnknownLanguage = true,
    } = options;

    if (!highlighterCache.has(shikiOptions)) {
      highlighterCache.set(
        shikiOptions,
        highlightersFromSettings(shikiOptions)
      );
    }

    const highlighters = await highlighterCache.get(shikiOptions);
    const themes = getThemesFromSettings(shikiOptions);

    function remarkVisitor(fn) {
      return (node) => {
        let results;
        const hasMultipleThemes = highlighters.length > 1;
        const output = highlighters.map((highlighter, i) => {
          const loadedLanguages = highlighter.getLoadedLanguages();

          const theme = themes[i];
          return fn(node, {
            highlighter,
            theme,
            loadedLanguages,
            hasMultipleThemes,
          });
        });

        // return in case of non-meta inline code
        if (output.some((o) => !o)) return;

        results = output.join('\n');

        if (hasMultipleThemes) {
          // If we don't do this the code blocks will be wrapped in <undefined>
          // You can set your mdx renderer to replace this span with a React.Fragment during runtime
          results = `<span data-mdx-pretty-code-fragment>${results}</span>`;
        }
        node.value = results;
      };
    }

    visit(tree, 'inlineCode', remarkVisitor(inlineCode));
    visit(tree, 'code', remarkVisitor(blockCode));

    function inlineCode(node, {highlighter, theme}) {
      const meta = node.value.match(/{:([a-zA-Z.-]+)}$/)?.[1];

      if (!meta) {
        return;
      }

      node.type = 'html';
      // It's a token, not a lang
      if (meta[0] === '.') {
        if (typeof theme === 'string') {
          throw new Error(
            'MDX Pretty Code: Must be using a JSON theme object to use tokens.'
          );
        }

        const color =
          theme.tokenColors.find(({scope}) =>
            scope?.includes(tokensMap[meta.slice(1)] ?? meta.slice(1))
          )?.settings.foreground ?? 'inherit';

        return sanitizeHtml__default["default"](
          `<span data-mdx-pretty-code data-color="${color}" class="${
            highlighter.themeClass
          } ${highlighter.themeName}"><span>${node.value.replace(
            /{:[a-zA-Z.-]+}/,
            ''
          )}</span></span>`,
          sanitizeOptions
        );
      }

      const highlighted = highlighter.codeToHtml(
        node.value.replace(/{:\w+}/, ''),
        meta
      );

      const dom = new jsdom.JSDOM(highlighted);
      const pre = dom.window.document.querySelector('pre');

      return sanitizeHtml__default["default"](
        `<span data-mdx-pretty-code class="${highlighter.themeClass} ${highlighter.themeName}">${pre.innerHTML}</span>`,
        sanitizeOptions
      );
    }

    function blockCode(node, {highlighter, loadedLanguages}) {
      const lang =
        ignoreUnknownLanguage && !loadedLanguages.includes(node.lang)
          ? 'text'
          : node.lang;

      node.type = 'html';

      const highlighted = highlighter.codeToHtml(node.value, lang);

      const lineNumbers = node.meta
        ? rangeParser__default["default"](node.meta.match(/{(.*)}/)?.[1] ?? '')
        : [];
      const word = node.meta?.match(/\/(.*)\//)?.[1];
      const wordNumbers = node.meta
        ? rangeParser__default["default"](node.meta.match(/\/.*\/([^\s]*)/)?.[1] ?? '')
        : [];

      let visitedWordsCount = 0;

      const dom = new jsdom.JSDOM(highlighted);
      dom.window.document.body.querySelectorAll('.line').forEach((node, i) => {
        onVisitLine(node);

        if (lineNumbers.includes(i + 1)) {
          onVisitHighlightedLine(node);
        }

        if (word && node.innerHTML.includes(word)) {
          visitedWordsCount++;

          if (
            wordNumbers.length === 0 ||
            wordNumbers.includes(visitedWordsCount)
          ) {
            const splitByBreakChar = new RegExp(`\\b${word}\\b`);
            const adjacentText = node.innerHTML.split(splitByBreakChar);

            node.innerHTML = adjacentText
              .map(
                (txt, i) =>
                  `${txt}${
                    i !== adjacentText.length - 1
                      ? `<span data-mdx-pretty-code-word>${word}</span>`
                      : ''
                  }`
              )
              .join('');

            node
              .querySelectorAll('[data-mdx-pretty-code-word]')
              .forEach((wordNode) => {
                wordNode.removeAttribute('data-mdx-pretty-code-word');
                onVisitHighlightedWord(wordNode);
              });
          }
        }
      });

      const code = dom.window.document.querySelector('code');

      code.setAttribute('data-language', lang);
      code.classList.add(highlighter.themeClass);
      highlighter.themeName && code.classList.add(highlighter.themeName);
      return sanitizeHtml__default["default"](dom.window.document.body.innerHTML, sanitizeOptions);
    }
  };
}

exports.createRemarkPlugin = createRemarkPlugin;
