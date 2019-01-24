import Tokenizer from './tokenizer/index';

const ASSETS_PATH = 'https://s3.amazonaws.com/universalsentenceencoder';

async function loadVocab() {
  const vocab = await fetch(`${ASSETS_PATH}/vocab.json`);
  return await vocab.json();
}

describe('tokenizer', () => {
  let tokenizer;
  beforeAll(async () => {
    const vocabulary = await loadVocab();
    tokenizer = new Tokenizer(vocabulary);
  });

  it('should normalize inputs', () => {
    expect(tokenizer.encode('ça va bien'))
        .toEqual(tokenizer.encode('c\u0327a va bien'));
  });

  it('should handle unknown inputs', () => {
    expect(tokenizer.encode('cat😹').toNotThrow());
  });

  it('should treat contiguous unknown inputs as a single word', () => {
    expect(tokenizer.encode('cat 😹😹').toEqual([1163, 30, 0]));
  });
});