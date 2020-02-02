import React from 'react';
import { BookData } from './Video';

interface Props extends BookData {
  bookList: BookData[];
}

const BookDataView: React.FC<Props> = (props: Props) => {
  const { bookList } = props;
  return bookList.length > 0 ? (
    <ol>
      {bookList.map((book, idx) => {
        return (
          <li key={`${idx}-${book.ISBN|| "n/a"}`}>
            <div> Title: {book.title}</div>
            <div>Authors: {book.authors && renderAuthors(book.authors)}</div>
          </li>
        );
      })}
    </ol>
  ) : null;
};

export default BookDataView;

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
