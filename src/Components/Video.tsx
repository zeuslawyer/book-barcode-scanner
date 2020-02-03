// @ts-nocheck
import React from 'react';
import axios from 'axios';

import { BrowserBarcodeReader } from '@zxing/library'; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import { BookListUi } from './BookListUi';

// REFERENCE:  examples: https://zxing-js.github.io/library/

export interface BookData {
  isbn: string;
  title: string;
  preview_url?: string;
  authors: Array<{ url: string; name: string }>;
}

export interface Books {
  [key: string]: BookData; // make ISBNs the key for each val
}

interface Props {}

export const VideoRoot: React.FC<Props> = () => {
  const [scannedCode, setScannedCode] = React.useState<string>(null);
  const [books, addToBooks] = React.useState<Books>({});
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [availableCameras, setAvailableCameras] = React.useState([]);

  // find the cameras and set them, run once only on mount
  React.useEffect(() => {
    // on component mount and re-renders:
    let codeReader = new BrowserBarcodeReader();

    console.log('use effect to get video inputs fired');
    codeReader.getVideoInputDevices().then(videoInputDevices => {
      // set up available cameras - desktop vs mobile, for renderDropDown()
      setAvailableCameras(videoInputDevices);

      // if no selected camera default to first one
      !selectedCameraId && setSelectedCameraId(videoInputDevices[0].deviceId);
    });
    // start continuous reading from camera
    if (!scannedCode) readCode(codeReader);
  }, [selectedCameraId, scannedCode]);

  // scanning helper function
  const readCode = (codeReader: BrowserBarcodeReader) => {
    console.log('readCode() fired');
    codeReader
      .decodeOnceFromVideoDevice(selectedCameraId, 'video-element')
      .then(res => {
        // res.text is the scanned ISBN code
        setScannedCode(res.text);
        // if this book has not been scanned, hit the api
        if (books[res.text] === undefined) {
          fetchBookData(res).then(() => setScannedCode(null));
        } else {
          // TODO:  alert that already scanned
        }
      });
  };

  const fetchBookData = async (res: string) => {
    const URL = getOpenLibraryUrl(res.text);
    axios
      .get(URL)
      .then(response => {
        // handle success
        let { data } = response;
        if(Object.keys(data).length === 0){
          console.log("No data for ", res.text)

          // TODO:  create error messages
          return
        }
        const key = Object.keys(data)[0];
        let fetchedBook: BookData = {
          isbn: res.text,
          title: data[key].title,
          authors: data[key].authors
        };

        // update list only if not already there
        let allBooks = { ...books, [res.text]: fetchedBook };
        console.log('updating book list with', allBooks);

        addToBooks(allBooks);
        return;
      })
      .catch(e => console.log(`Error: ${e}`));
  };

  const renderDropdown = () => {
    if (availableCameras.length < 2) {
      return null;
    } else {
      return (
        <div id='sourceSelectPanel'>
          <label htmlFor='sourceSelect'>Change video source:</label>
          <select
            id='sourceSelect'
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
        <video
          id='video-element'
          width='600'
          height='350'
          style={{ border: '1px solid gray' }}
        ></video>
      </div>
      <div>
        <p>
          {scannedCode ? 'Scanned' : "Hold up a book's barcode to the camera"}
        </p>
        {availableCameras.length > 1 && (
          <p>Selected Camera: {selectedCameraId}</p>
        )}
      </div>
      <br />
      <BookListUi bookCollection={books} />
      <button onClick={() => {}}>RESET</button>
    </>
  );
};

function getOpenLibraryUrl(isbn) {
  // https://openlibrary.org/dev/docs/api/books
  return `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
}
