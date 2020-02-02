import React from "react";
import { BookData } from "./Video";

interface Props extends BookData {
  bookData: BookData;
}

const BookDataView: React.FC<Props> = (props: Props) => {
  const { bookData } = props;
  return (
    <>
      <div> Title: {bookData.title}</div>
      <div>Authors: {bookData.authors && renderAuthors(bookData.authors)}</div>
    </>
  );
};

export default BookDataView;

function renderAuthors(authors: Array<{ url: string; name: string }>) {
  if (authors.length === 1) return authors[0].name;
  if (authors.length === 2) return `${authors[0].name} and ${authors[1].name}`;

  let str = "";
  authors.forEach((auth, ind) => {
    if (ind === authors.length - 1) {
      str += " and ";
    }
    str += `${auth.name}`;
  });

  return str;
}
