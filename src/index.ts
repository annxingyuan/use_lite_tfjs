import Tokenizer from './tokenizer/index';
import {flatten} from './util';

const ASSETS_PATH = 'https://s3.amazonaws.com/universalsentenceencoder';

let model, vocabulary;

async function load() {
  return await tf.loadFrozenModel(
      `${ASSETS_PATH}/tensorflowjs_model.pb`,
      `${ASSETS_PATH}/weights_manifest.json`);
}

async function loadVocab() {
  const vocab = await fetch(`${ASSETS_PATH}/vocab.json`);
  return await vocab.json();
}

// only works with single inputs for now
const embed = async values => await model.executeAsync({
  indices: tf.tensor2d(
      flatten(values.map((d, i) => [0, i])), [values.length, 2], 'int32'),
  values: tf.tensor1d(values, 'int32')
});

async function init() {
  model = await load();
  vocabulary = await loadVocab();

  const tokenizer = new Tokenizer(vocabulary);

  window.tokenizer = tokenizer
  // console.log({tokenizer})

  // const encoding = tokenizer.encode('I saw a girl with an alligator.');

  // const embedding = await embed(encoding);
  // const embeddingValues = embedding.dataSync();
  // encoding.forEach(d => console.log(vocabulary[d]));

}

window.init = init 

var embedCache = window.embedCache = {}

window.getEmbedding = async function(str){
  if (embedCache[str]) return str

  const encoding = tokenizer.encode(str);

  const embedding = await embed(encoding);
  const vec = embedding.dataSync();

  var rv = {str, encoding, embedding, vec}
  embedCache[str] = rv
  return rv
}

