/**
 * Curated Scripture for the homepage verse rotation.
 *
 * Translation: King James Version (public domain).
 * Every quotation below is a complete verse (or a contiguous pair) from
 * that translation — do not add verses here without verifying the text.
 */

export interface ScriptureVerse {
  /** Verbatim verse text, KJV. */
  text: string;
  /** Canonical reference, e.g. "John 3:16". */
  reference: string;
  /** Translation identifier. */
  translation: 'KJV';
}

export const SCRIPTURE_TRANSLATION = 'KJV' as const;

/**
 * A small, well-known set of verses. Expand this list freely — keep the
 * text verified against a KJV source before committing.
 */
export const SCRIPTURE_VERSES: ScriptureVerse[] = [
  {
    text: 'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
    reference: 'John 3:16',
    translation: 'KJV',
  },
  {
    text: 'The LORD is my shepherd; I shall not want.',
    reference: 'Psalm 23:1',
    translation: 'KJV',
  },
  {
    text: 'I can do all things through Christ which strengtheneth me.',
    reference: 'Philippians 4:13',
    translation: 'KJV',
  },
  {
    text: 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
    reference: 'Proverbs 3:5',
    translation: 'KJV',
  },
  {
    text: 'Come unto me, all ye that labour and are heavy laden, and I will give you rest.',
    reference: 'Matthew 11:28',
    translation: 'KJV',
  },
  {
    text: 'Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.',
    reference: 'Isaiah 41:10',
    translation: 'KJV',
  },
  {
    text: 'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
    reference: 'Romans 8:28',
    translation: 'KJV',
  },
  {
    text: 'Have not I commanded thee? Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.',
    reference: 'Joshua 1:9',
    translation: 'KJV',
  },
  {
    text: 'God is our refuge and strength, a very present help in trouble.',
    reference: 'Psalm 46:1',
    translation: 'KJV',
  },
  {
    text: 'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    reference: 'Matthew 6:33',
    translation: 'KJV',
  },
  {
    text: 'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
    reference: 'Jeremiah 29:11',
    translation: 'KJV',
  },
  {
    text: 'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
    reference: 'John 14:6',
    translation: 'KJV',
  },
  {
    text: 'Thy word is a lamp unto my feet, and a light unto my path.',
    reference: 'Psalm 119:105',
    translation: 'KJV',
  },
  {
    text: 'He hath shewed thee, O man, what is good; and what doth the LORD require of thee, but to do justly, and to love mercy, and to walk humbly with thy God?',
    reference: 'Micah 6:8',
    translation: 'KJV',
  },
  {
    text: 'And ye shall know the truth, and the truth shall make you free.',
    reference: 'John 8:32',
    translation: 'KJV',
  },
  {
    text: 'Now faith is the substance of things hoped for, the evidence of things not seen.',
    reference: 'Hebrews 11:1',
    translation: 'KJV',
  },
  {
    text: 'The LORD is my light and my salvation; whom shall I fear? the LORD is the strength of my life; of whom shall I be afraid?',
    reference: 'Psalm 27:1',
    translation: 'KJV',
  },
  {
    text: 'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    reference: 'Isaiah 40:31',
    translation: 'KJV',
  },
  {
    text: 'Now the God of hope fill you with all joy and peace in believing, that ye may abound in hope, through the power of the Holy Ghost.',
    reference: 'Romans 15:13',
    translation: 'KJV',
  },
  {
    text: 'Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven.',
    reference: 'Matthew 5:16',
    translation: 'KJV',
  },
  {
    text: 'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God.',
    reference: 'Ephesians 2:8',
    translation: 'KJV',
  },
  {
    text: 'If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him.',
    reference: 'James 1:5',
    translation: 'KJV',
  },
  {
    text: 'Casting all your care upon him; for he careth for you.',
    reference: '1 Peter 5:7',
    translation: 'KJV',
  },
  {
    text: 'O taste and see that the LORD is good: blessed is the man that trusteth in him.',
    reference: 'Psalm 34:8',
    translation: 'KJV',
  },
  {
    text: 'Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new.',
    reference: '2 Corinthians 5:17',
    translation: 'KJV',
  },
  {
    text: 'And whatsoever ye do, do it heartily, as to the Lord, and not unto men.',
    reference: 'Colossians 3:23',
    translation: 'KJV',
  },
];

/** Day-of-year (1–366) in local time. */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

/** Deterministic daily verse — stable for the calendar day, no API. */
export function verseForDate(date: Date = new Date()): ScriptureVerse {
  const verses = SCRIPTURE_VERSES;
  if (verses.length === 0) {
    throw new Error('SCRIPTURE_VERSES must not be empty');
  }
  return verses[dayOfYear(date) % verses.length];
}
