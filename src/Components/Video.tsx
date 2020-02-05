// @ts-nocheck
import React from "react";
import axios from "axios";

import { BrowserBarcodeReader } from "@zxing/library"; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import { BookListUi } from "./BookListUi";

// REFERENCE:  examples: https://zxing-js.github.io/library/

export interface BookData {
  isbn: string;
  title: string;
  preview_url?: string;
  authors: Array<{ url?: string; name: string }>;
}

export interface Books {
  [key: string]: BookData; // make ISBNs the key for each val
}

interface Props {}

export const VideoRoot: React.FC<Props> = () => {
  const [scannedCode, setScannedCode] = React.useState<string>(null);
  const [scannerReady, setScannerReady] = React.useState<boolean>(false);
  const [books, updateBooks] = React.useState<Books>({});
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [availableCameras, setAvailableCameras] = React.useState([]);

  let codeReader = new BrowserBarcodeReader(2000);

  async function scannerInit() {
    // on component mount and re-renders:
    codeReader.getVideoInputDevices().then(videoInputDevices => {
      // set up available cameras - desktop vs mobile, for renderDropDown()
      setAvailableCameras(videoInputDevices);

      // if no selected camera default to first one
      !selectedCameraId && setSelectedCameraId(videoInputDevices[0].deviceId);
    });
  }
  // scanning helper function
  function startScanning(codeReader: BrowserBarcodeReader) {
    console.log("startScanning() fired");
    codeReader
      .decodeOnceFromVideoDevice(selectedCameraId, "video-element")
      .then(res => {
        // res.text is the scanned ISBN code. if its already in state no need to update state
        setScannedCode(res.text);
        // if this book has not been added to list, hit the api
        if (books[res.text] === undefined) {
          fetchBookData(res);
        } else {
          // TODO:  alert that already scanned
          alert("Book already in your list");
        }
        // after decoding, update UI to show scan has been done, and reset state after timeout to trigger codeReader to refresh and restart scanning
        console.log("TESTING", res.text, scannedCode);

        window.setTimeout(() => {
          setScannedCode(null);
        }, 2500);
      });
  }

  const fetchBookData = async (res: string) => {
    const URL = getOpenLibraryUrl(res.text);
    axios
      .get(URL)
      .then(response => {
        // handle success
        let { data } = response;
        if (Object.keys(data).length === 0) {
          // TODO:  create error messages
          alert("No data available on book.");
          return;
        }
        // else
        const key = Object.keys(data)[0];
        let fetchedBook: BookData = {
          isbn: res.text,
          title: data[key].title,
          authors: data[key].authors
        };

        // update list only if not already there
        let allBooks = { ...books, [res.text]: fetchedBook };
        console.log("updating book list with", allBooks);

        updateBooks(allBooks);
        return;
      })
      .catch(e => console.log(`Error: ${e}`));
  };

  // initial scanner init, once on mount
  React.useEffect(() => {
    console.log("1st effect: scanner init fired");
    scannerInit();
    setScannerReady(true);

    return () => {
      codeReader = undefined;
    };
  }, []);

  // once scanner initialised, start scanning
  React.useEffect(() => {
    console.log("2nd effect: starting to scan");

    // start continuous reading from camera
    if (scannedCode === null && scannerReady) startScanning(codeReader);

    // cleanup on unmount
    return () => {
      codeReader = undefined;
    };
  }, [scannerReady, selectedCameraId, scannedCode]);

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
            {availableCameras.map(option => (
              <option key={option.deviceId} value={option.deviceId}>
                {option.label}
              </option>
            ))}
            )}
          </select>
        </div>
      );
    }
  };

  return (
    <>
      <div>
        {renderDropdown()}
        <video id="video-element" width="500" height="250"></video>
      </div>
      <div>
        <p>
          {scannedCode ? (
            <span style={{ color: "green", textTransform: "uppercase" }}>
              Scanned!
            </span>
          ) : (
            "Hold up a book's barcode to the camera"
          )}
        </p>
        {availableCameras.length > 1 && (
          <p>Selected Camera: {selectedCameraId}</p>
        )}
      </div>
      <br />
      <BookListUi bookCollection={books} />
      {Object.keys(books).length === 0 ? null : (
        <button onClick={() => {}}>Download List</button>
      )}
    </>
  );
};

function getOpenLibraryUrl(isbn) {
  // https://openlibrary.org/dev/docs/api/books
  return `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
}
