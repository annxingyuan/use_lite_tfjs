function TrieNode(key) {
  this.key = key;
  this.parent = null;
  this.children = {};
  this.end = false;
}

TrieNode.prototype.getWord = function() {
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

Trie.prototype.insert = function(word, score, index) {
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

Trie.prototype.commonPrefixSearch =
    function(ss) {
  var node = this.root.children[ss[0]];
  var output = [];

  findAllCommonPrefixes(ss, node, output);

  return output;
}

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

export default Trie;