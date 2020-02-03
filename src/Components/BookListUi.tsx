import React from 'react';
import { Books } from './Video';

interface Props  {
  bookList: Books;
}

export const BookListUi: React.FC<Props> = (props: Props) => {
  const { bookList } = props;
  let bookCodes =  Object.keys(bookList)

  return bookCodes.length > 0 ? (
    <ol>
      {bookCodes.map((isbn, idx) => {
        return (
          <li key={`${idx}-${isbn}`}>
            <div> Title: {bookList[isbn].title}</div>
            <div>Authors: {bookList[isbn].authors && renderAuthors(bookList[isbn].authors)}</div>
          </li>
        );
      })}
    </ol>
  ) : null;
};


function renderAuthors(authors: Array<{ url: string; name: string }>) {
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
