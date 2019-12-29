// @ts-nocheck
import React from "react";
import axios from "axios";

import { BrowserBarcodeReader } from "@zxing/library"; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import BookdataView from "./Bookdata";

// REFERENCE:  examples: https://zxing-js.github.io/library/

export interface BookData {
  ISBN: string;
  title: string;
  preview_url?: string;
  authors: Array<{ url: string; name: string }>;
}

function getOpenLibraryUrl(isbn) {
  // https://openlibrary.org/dev/docs/api/books
  return `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
}

interface Props {}

const VideoRoot: React.FC<Props> = () => {
  const [code, setCode] = React.useState("");
  const [bookData, setBookData] = React.useState<BookData>({
    ISBN: "",
    preview_url: "",
    title: "",
    author: []
  });
  let [devices, setDevices] = React.useState([]);

  const readCode = () => {
    const codeReader = new BrowserBarcodeReader();

    codeReader
      .decodeFromInputVideoDevice(undefined, "video-element")
      .then(res => {
        setCode(res.text);
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
  };

  React.useEffect(() => {
    console.log("running");
    const codeReader = new BrowserBarcodeReader();

    // REFERENCE:  https://github.com/zxing-js/library
    codeReader
      .listVideoInputDevices()
      .then(videoInputDevices => {
        setDevices(videoInputDevices);
      })
      .catch(err => console.error(err));

    readCode();

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

      <h4>DEVICES</h4>
      <ol>
        {devices.map(device => (
          <li key={device.deviceId}>{device.label}</li>
        ))}
      </ol>
    </>
  );
};

export default VideoRoot;
