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
  // component state
  const initialBookData = {
    ISBN: "",
    preview_url: "",
    title: "",
    author: []
  };
  const [bookData, setBookData] = React.useState<BookData>(initialBookData);
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [availableCameras, setAvailableCameras] = React.useState([]);

  // scanning helper function
  const scanCode = codeReader => {
    codeReader.getVideoInputDevices().then(videoInputDevices => {
      setAvailableCameras(videoInputDevices);
      !selectedCameraId && setSelectedCameraId(videoInputDevices[0].deviceId);

      codeReader
        .decodeFromInputVideoDevice(selectedCameraId, "video-element")
        .then(res => {
          const URL = getOpenLibraryUrl(res.text); // res.text is the scanned ISBN code
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
            .catch(e => console.log("error decoding barcode"));
        });
    });
  };

  const renderDropdown = () => {
    if (availableCameras.length < 2) {
      return null;
    } else {
      return (
        <div id="sourceSelectPanel">
          <label htmlFor="sourceSelect">Change video source:</label>
          <select
            id="sourceSelect"
            value={selectedCameraId}
            onChange={e => {
              setSelectedCameraId(e.target.value);
            }}
          >
            {availableCameras.map(camera => (
              <option key={camera.deviceId} value={camera.deviceId}>
                {option.label}
              </option>
            ))}
            )}
          </select>
        </div>
      );
    }
  };

  React.useEffect(() => {
    console.log("running");
    let codeReader = new BrowserBarcodeReader();

    scanCode(codeReader);

    return () => {
      // cleanup on each rerender caused by state change
      codeReader = undefined;
    };
    // eslint-disable-next-line
  }, [bookData, selectedCameraId]);

  return (
    <>
      <div>
        {renderDropdown()}
        <video
          id="video-element"
          width="600"
          height="350"
          style={{ border: "1px solid gray" }}
        ></video>
      </div>
      <div>
        <p>
          {bookData.ISBN ? "Scanned" : "Hold up a book's barcode to the camera"}
        </p>
        {availableCameras.length > 1 && (
          <p>Selected Camera: {selectedCameraId}</p>
        )}
      </div>
      <br />
      <BookdataView bookdata={bookData} />
      <button onClick={() => setBookData(initialBookData)}>RESET</button>
    </>
  );
};

export default VideoRoot;
