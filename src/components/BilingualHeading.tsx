import { type ElementType } from 'react';

type BilingualHeadingProps = {
  zh: string;
  en: string;
  level?: 1 | 2 | 3;
};

export default function BilingualHeading({
  zh,
  en,
  level = 1,
}: BilingualHeadingProps) {
  const HeadingTag = `h${level}` as ElementType;

  return (
    <div className="bilingual-heading">
      <HeadingTag className="heading-zh">{zh}</HeadingTag>
      <p className="heading-en">{en}</p>
    </div>
  );
}
