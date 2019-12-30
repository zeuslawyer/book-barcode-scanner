import React from "react";
import { BookData } from "./Video";

interface Props extends BookData {
  bookdata: BookData;
}

const BookdataView: React.FC<Props> = (props: Props) => {
  const { bookdata } = props;
  return (
    <>
      <div> Title: {bookdata.title}</div>
      <div>Authors: {bookdata.authors && renderAuthors(bookdata.authors)}</div>
    </>
  );
};

export default BookdataView;

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
