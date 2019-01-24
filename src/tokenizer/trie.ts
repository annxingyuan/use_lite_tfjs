class TrieNode {
  constructor(key) {
    this.key = key;
    this.parent = null;
    this.children = {};
    this.end = false;
  }

  getWord() {
    const output = [];
    let node = this;

    while (node !== null) {
      output.unshift(node.key);
      node = node.parent;
    }

    return [output.join(''), this.score, this.index];
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode(null);
  }

  findAllCommonPrefixes(ss, node, arr) {
    if (node.end) {
      const word = node.getWord();
      if (ss.slice(0, [...word[0]].length).join('') === word[0]) {
        arr.unshift(word);
      }
    }

    for (let child in node.children) {
      this.findAllCommonPrefixes(ss, node.children[child], arr);
    }
  }

  insert(word, score, index) {
    let node = this.root;

    for (let i = 0; i < word.length; i++) {
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
  }

  commonPrefixSearch(ss) {
    const node = this.root.children[ss[0]];
    const output = [];
    if (node) {
      this.findAllCommonPrefixes(ss, node, output);
    } else {
      output.push([ss[0], 0, 0]);  // unknown token
    }
    return output;
  }
}

export default Trie;
