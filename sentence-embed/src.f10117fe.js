// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

// eslint-disable-next-line no-global-assign
parcelRequire = (function (modules, cache, entry, globalName) {
  // Save the require from previous bundle to this closure if any
  var previousRequire = typeof parcelRequire === 'function' && parcelRequire;
  var nodeRequire = typeof require === 'function' && require;

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire = typeof parcelRequire === 'function' && parcelRequire;
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error('Cannot find module \'' + name + '\'');
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = cache[name] = new newRequire.Module(name);

      modules[name][0].call(module.exports, localRequire, module, module.exports, this);
    }

    return cache[name].exports;

    function localRequire(x){
      return newRequire(localRequire.resolve(x));
    }

    function resolve(x){
      return modules[name][1][x] || x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [function (require, module) {
      module.exports = exports;
    }, {}];
  };

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (entry.length) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(entry[entry.length - 1]);

    // CommonJS
    if (typeof exports === "object" && typeof module !== "undefined") {
      module.exports = mainExports;

    // RequireJS
    } else if (typeof define === "function" && define.amd) {
     define(function () {
       return mainExports;
     });

    // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }

  // Override the current require with this new one
  return newRequire;
})({"src/tokenizer/trie.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

function TrieNode(key) {
  this.key = key;
  this.parent = null;
  this.children = {};
  this.end = false;
}

TrieNode.prototype.getWord = function () {
  var output = [];
  var node = this;

  while (node !== null) {
    output.unshift(node.key);
    node = node.parent;
  }

  return [output.join(''), this.score, this.index];
};

function Trie() {
  this.root = new TrieNode(null);
}

Trie.prototype.insert = function (word, score, index) {
  var node = this.root;

  for (var i = 0; i < word.length; i++) {
    if (!node.children[word[i]]) {
      node.children[word[i]] = new TrieNode(word[i]);
      node.children[word[i]].parent = node;
    }

    node = node.children[word[i]];

    if (i == word.length - 1) {
      node.end = true;
      node.score = score;
      node.index = index;
    }
  }
};

Trie.prototype.commonPrefixSearch = function (ss) {
  var node = this.root.children[ss[0]];
  var output = [];
  findAllCommonPrefixes(ss, node, output);
  return output;
};

function findAllCommonPrefixes(ss, node, arr) {
  if (node.end) {
    let word = node.getWord();

    if (ss.substring(0, word[0].length) === word[0]) {
      arr.unshift(word);
    }
  }

  for (var child in node.children) {
    findAllCommonPrefixes(ss, node.children[child], arr);
  }
}

var _default = Trie;
exports.default = _default;
},{}],"src/tokenizer/index.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _trie = _interopRequireDefault(require("./trie"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function processInput(str) {
  return '▁' + str.replace(/ /g, '▁');
}

function Tokenizer(vocab) {
  this.vocab = vocab;
  this.trie = new _trie.default();

  for (let i = 0; i < this.vocab.length; i++) {
    this.trie.insert(this.vocab[i][0], this.vocab[i][1], i);
  }
}

Tokenizer.prototype.encode = function (input) {
  const nodes = [];
  const words = [];
  const best = [];
  input = processInput(input);

  for (let i = 0; i <= input.length; i++) {
    nodes.push({});
    words.push('');
    best.push(0);
  }

  for (let i = 0; i < input.length; i++) {
    let ss = input.substring(i);
    let matches = this.trie.commonPrefixSearch(ss);

    for (let j = 0; j < matches.length; j++) {
      let piece = matches[j];
      let obj = {
        key: piece[0],
        score: piece[1],
        index: piece[2]
      };
      let endPos = piece[0].length;

      if (typeof nodes[i + endPos][i] === 'undefined') {
        nodes[i + endPos][i] = [];
      }

      nodes[i + endPos][i].push(obj);
    }
  }

  for (let endPos = 0; endPos <= input.length; endPos++) {
    for (let startPos in nodes[endPos]) {
      let arr = nodes[endPos][startPos];

      for (let j = 0; j < arr.length; j++) {
        let word = arr[j];
        let score = word.score + best[endPos - word.key.length];

        if (best[endPos] === 0 || score >= best[endPos]) {
          best[endPos] = score;
          words[endPos] = arr[j].index;
        }
      }
    }
  }

  const results = [];
  let iter = words.length - 1;

  while (iter > 0) {
    results.push(words[iter]);
    iter -= this.vocab[words[iter]][0].length;
  }

  return results.reverse();
};

var _default = Tokenizer;
exports.default = _default;
},{"./trie":"src/tokenizer/trie.ts"}],"src/util.ts":[function(require,module,exports) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.flatten = void 0;

const flatten = arr => arr.reduce((acc, curr) => acc.concat(curr), []);

exports.flatten = flatten;
},{}],"src/index.ts":[function(require,module,exports) {
"use strict";

var _index = _interopRequireDefault(require("./tokenizer/index"));

var _util = require("./util");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ASSETS_PATH = 'https://s3.amazonaws.com/universalsentenceencoder';
let model, vocabulary;

async function load() {
  return await tf.loadFrozenModel(`${ASSETS_PATH}/tensorflowjs_model.pb`, `${ASSETS_PATH}/weights_manifest.json`);
}

async function loadVocab() {
  const vocab = await fetch(`${ASSETS_PATH}/vocab.json`);
  return await vocab.json();
} // only works with single inputs for now


const embed = async values => await model.executeAsync({
  indices: tf.tensor2d((0, _util.flatten)(values.map((d, i) => [0, i])), [values.length, 2], 'int32'),
  values: tf.tensor1d(values, 'int32')
});

async function init() {
  model = await load();
  vocabulary = await loadVocab();
  const tokenizer = new _index.default(vocabulary);
  window.tokenizer = tokenizer; // console.log({tokenizer})
  // const encoding = tokenizer.encode('I saw a girl with an alligator.');
  // const embedding = await embed(encoding);
  // const embeddingValues = embedding.dataSync();
  // encoding.forEach(d => console.log(vocabulary[d]));
}

window.init = init;
var embedCache = window.embedCache = {};

window.getEmbedding = async function (str) {
  if (embedCache[str]) {
    const {
      encoding,
      embedding,
      vec
    } = embedCache[str];
    return {
      str,
      encoding,
      embedding,
      vec
    };
  }

  const encoding = tokenizer.encode(str);
  const embedding = await embed(encoding);
  const vec = await embedding.dataSync();
  var rv = {
    str,
    encoding,
    embedding,
    vec
  };
  embedCache[str] = rv;
  return rv;
};
},{"./tokenizer/index":"src/tokenizer/index.ts","./util":"src/util.ts"}]},{},["src/index.ts"], null)
//# sourceMappingURL=/src.f10117fe.map