// @ts-nocheck
import React from "react";
import axios from "axios";

import { BrowserBarcodeReader } from "@zxing/library"; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import BookdataView from "./Bookdata";

export interface BookData {
  ISBN: string;
  title: string;
  preview_url?: string;
  authors: Array<{ url: string; name: string }>;
}

function getOpenLibraryUrl(isbn) {
  return `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
}

interface Props {}

const VideoRoot: React.FC<Props> = () => {
  const [code, setCode] = React.useState("");
  const [timestamp, setTimestamp] = React.useState("");
  const [bookData, setBookData] = React.useState<BookData>({
    ISBN: "",
    preview_url: "",
    title: "",
    author: []
  });

  React.useEffect(() => {
    console.log("running");
    const codeReader = new BrowserBarcodeReader(300);

    codeReader
      .decodeFromInputVideoDevice(undefined, "video-element")
      .then(res => {
        setCode(res.text);
        setTimestamp(Date(res.timestamp));
        let URL = getOpenLibraryUrl(res.text);
        axios
          .get(URL)
          .then(function(response) {
            // handle success
            let { data } = response;
            const key = Object.keys(data)[0];
            const displayData: BookData = {
              ISBN: res.text,
              title: data[key].title,
              authors: data[key].authors
            };

            setBookData(displayData);
          })
          .catch(function(error) {
            // handle error
            console.log(error);
          });
      })
      .catch(e => console.log("error decoding barcode"));

    return () => {
      // cleanup
    };
  }, []);

  return (
    <>
      <div>
        <video
          id="video-element"
          width="600"
          height="350"
          style={{ border: "1px solid gray" }}
        ></video>
      </div>
      <div>{code ? "Scanned" : ""}</div>
      <BookdataView bookdata={bookData} />
    </>
  );
};

export default VideoRoot;
