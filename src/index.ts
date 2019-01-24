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

const embed = async values => {
  const indices =
      flatten(values.map((arr, i) => arr.map((d, index) => [i, index])));

  return await model.executeAsync({
    indices: tf.tensor2d(flatten(indices), [indices.length, 2], 'int32'),
    values: tf.tensor1d(flatten(values), 'int32')
  })
};

async function init() {
  model = await load();
  vocabulary = await loadVocab();

  const tokenizer = new Tokenizer(vocabulary);

  const inputs = [
    'Elephant', 'I am a sentence for which I would like to get its embedding.',
    'Universal Sentence Encoder embeddings also support short paragraphs. There is no hard limit on how long the paragraph is. Roughly, the longer the more \'diluted\' the embedding will be.'
  ];

  const encodings = inputs.map(d => tokenizer.encode(d));
  console.log(encodings);

  const embeddings = await embed(encodings);
  const embeddingValues = embeddings.dataSync();
  console.log(embeddingValues);  // 512 for each
};

init();