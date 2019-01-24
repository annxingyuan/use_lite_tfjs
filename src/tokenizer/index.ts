import Trie from './trie';

function processInput(str) {
  const normalized = str.normalize();
  return '▁' + normalized.replace(/ /g, '▁');
}

function Tokenizer(vocab) {
  this.vocab = vocab;
  this.trie = new Trie();

  for (let i = 0; i < this.vocab.length; i++) {
    this.trie.insert(this.vocab[i][0], this.vocab[i][1], i);
  }
}

Tokenizer.prototype.encode = function(input) {
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
      let obj = {key: piece[0], score: piece[1], index: piece[2]};

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

export default Tokenizer;