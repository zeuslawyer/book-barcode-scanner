import React from 'react';
import { Books } from './VideoRoot';

interface Props {
  bookCollection: Books;
}

export const BookListUi: React.FC<Props> = (props: Props) => {
  const { bookCollection } = props;

  let bookCodes = bookCollection ? Object.keys(bookCollection) : [];

  return !bookCodes ? null : (
    <ol>
      {bookCodes.map((isbn, idx) => {
        return (
          <li key={`${idx}`}>
            <div>
              <div>
                {`${bookCollection[isbn].title}, by 
                ${bookCollection[isbn].authors &&
                  renderAuthors(bookCollection[isbn].authors)}`}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
};

export function renderAuthors(authors: Array<{ url?: string; name: string }>) {
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;

  let str = '';
  authors.forEach((auth, ind) => {
    if (ind === authors.length - 1) {
      str += ' and ';
    }
    str += `${auth.name}`;
  });

  return str;
}
