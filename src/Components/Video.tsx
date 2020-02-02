// @ts-nocheck
import React from 'react';
import axios from 'axios';

import { BrowserBarcodeReader } from '@zxing/library'; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import BookDataView from './Bookdata';

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

interface Props {
  addToList: React.Dispatch;
  books: BookData[];
}

export const VideoRoot: React.FC<Props> = ({ addToList, books }) => {
  // component state
  const initialBookData = {
    ISBN: '',
    preview_url: '',
    title: '',
    author: []
  };
  const [lastScannedBook, setLastScannedBook] = React.useState<BookData>(null);
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [availableCameras, setAvailableCameras] = React.useState([]);

  // scanning helper function
  const readCode = codeReader => {
    codeReader
      .decodeFromInputVideoDevice(selectedCameraId, 'video-element')
      .then(res => {
        // res.text is the scanned ISBN code
        console.log('scanned something', res.text);
        if (!lastScannedBook || lastScannedBook.ISBN !== res.text) {
          fetchBookData(res);
        } else {
          resetCodeReader();
        }
      });
  };

  const resetCodeReader = () => {
    setLastScannedBook(null);
  };

  const fetchBookData = async (res: string) => {
    console.log('hitting api');
    const URL = getOpenLibraryUrl(res.text);
    axios
      .get(URL)
      .then(response => {
        // handle success
        let { data } = response;
        if (!data.title) {
          alert('Book Not Found in Database');
          resetCodeReader()
        }
        const key = Object.keys(data)[0];
        const fetchedBook: BookData = {
          ISBN: res.text,
          title: data[key].title,
          authors: data[key].authors
        };

        setLastScannedBook(fetchedBook);
        // update list only if not already there
        updateBookList(fetchedBook);
      })
      .catch(e => console.log(`Error: ${e}`));
  };

  const updateBookList = (fetched: BookData) => {
    let alreadyScanned = books.some(book => book.ISBN === fetched.ISBN);
    console.log(books, fetched.ISBN, 'already scanned? ', alreadyScanned);

    if (!alreadyScanned) {
      const updated = [...books, fetched];
      addToList(updated);
    }
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

  React.useEffect(() => {
    console.log('running');
    let codeReader = new BrowserBarcodeReader();
    codeReader.getVideoInputDevices().then(videoInputDevices => {
      // set up available cameras - desktop vs mobile, for renderDropDown()
      setAvailableCameras(videoInputDevices);

      // if no selected camera default to first one
      !selectedCameraId && setSelectedCameraId(videoInputDevices[0].deviceId);
    });
    // start continuous reading from camera
    readCode(codeReader);

    return () => {
      // cleanup codeReader var on each rerender caused by state change
      codeReader = undefined;
    };
    // eslint-disable-next-line
  }, [lastScannedBook, selectedCameraId]);

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
          {lastScannedBook && lastScannedBook.ISBN
            ? 'Scanned'
            : "Hold up a book's barcode to the camera"}
        </p>
        {availableCameras.length > 1 && (
          <p>Selected Camera: {selectedCameraId}</p>
        )}
      </div>
      <br />
      <BookDataView bookList={books} />
      <button onClick={() => setLastScannedBook(initialBookData)}>RESET</button>
    </>
  );
};
