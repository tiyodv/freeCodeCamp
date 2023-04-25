import fs from 'fs';
import { setup } from 'jest-json-schema-extended';
import { availableLangs, LangNames, LangCodes } from '../../config/i18n';
import intro from './locales/english/intro.json';

setup();

interface Intro {
  [superBlock: string]: {
    title: string;
    intro: string[];
    blocks: {
      [block: string]: {
        title: string;
        intro: string[];
      };
    };
  };
}

const filesThatShouldExist = [
  {
    name: 'translations.json'
  },
  {
    name: 'motivation.json'
  },
  {
    name: 'intro.json'
  },
  {
    name: 'meta-tags.json'
  },
  {
    name: 'links.json'
  }
];

const path = `${__dirname}/locales`;

describe('Locale tests:', () => {
  availableLangs.client.forEach(lang => {
    describe(`-- ${lang} --`, () => {
      filesThatShouldExist.forEach(file => {
        // check that each json file exists
        test(`${file.name} file exists`, () => {
          const exists = fs.existsSync(`${path}/${lang}/${file.name}`);
          expect(exists).toBeTruthy();
        });
      });

      test(`has an entry in the langDisplayNames enum`, () => {
        expect(
          Object.keys(LangNames)
            .map(langCode => langCode.toLowerCase())
            .includes(lang)
        ).toBe(true);
      });

      test(`has an entry in the langCodes enum`, () => {
        expect(
          Object.keys(LangCodes)
            .map(langCode => langCode.toLowerCase())
            .includes(lang)
        ).toBe(true);
      });
    });
  });
});

describe('Intro file structure tests:', () => {
  const typedIntro = intro as unknown as Intro;
  const superblocks = Object.keys(typedIntro).filter(
    key => key !== 'misc-text'
  );
  superblocks.forEach(superBlock => {
    expect(typeof typedIntro[superBlock].title).toBe('string');
    expect(typedIntro[superBlock].intro).toBeInstanceOf(Array);
    expect(typedIntro[superBlock].blocks).toBeInstanceOf(Object);
    const blocks = Object.keys(typedIntro[superBlock].blocks);
    blocks.forEach(block => {
      expect(typeof typedIntro[superBlock].blocks[block].title).toBe('string');
      expect(typedIntro[superBlock].blocks[block].intro).toBeInstanceOf(Array);
    });
  });
});
