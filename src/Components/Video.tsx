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
  authors: Array<{ url?: string; name: string }>;
}

export interface Books {
  [key: string]: BookData; // make ISBNs the key for each val
}

enum Message {
  AlreadyInList = 1,
  NotFound
}

interface Props {}

export const VideoRoot: React.FC<Props> = () => {
  let [scannedCode, setScannedCode] = React.useState<string>(null);
  let [scannerReady, setScannerReady] = React.useState<boolean>(false);
  let [books, updateBooks] = React.useState<Books>({});
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [messageEnum, setMessageEnum] = React.useState<Message>(null);

  let codeReader = new BrowserBarcodeReader(1500);

  function resetPageForScanning() {
    window.setTimeout(() => {
      setScannedCode(null);
      setMessageEnum(null);
    }, 2500);
  }

  function scannerInit() {
    // on component mount and re-renders:
    codeReader
      .getVideoInputDevices()
      .then(videoInputDevices => {
        // if no selected camera default to first one
        !selectedCameraId && videoInputDevices.length === 1
          ? setSelectedCameraId(videoInputDevices[0].deviceId)
          : setSelectedCameraId(videoInputDevices[1].deviceId);
      })
      .catch(e => console.log(e));
  }
  // scanning helper function
  function startScanning(codeReader: BrowserBarcodeReader) {
    codeReader
      .decodeOnceFromVideoDevice(selectedCameraId, 'video-element')
      .then(res => {
        // res.text is the scanned ISBN code. if its already in state no need to update state
        setScannedCode(res.text);
        // if this book has not been added to list, hit the api
        if (books[res.text] !== undefined) {
          setMessageEnum(Message.AlreadyInList);
        } else {
          fetchBookData(res);
        }
        // after decoding, update UI to show scan has been done, and reset state after timeout to trigger codeReader to refresh and restart scanning

        resetPageForScanning();
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
          console.log('NO BOOK DATA FOUND');
          setMessageEnum(Message.NotFound);
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
        updateBooks(allBooks);
        return;
      })
      .catch(e => console.log(`Error: ${e}`));
  };

  // initial scanner init, once on mount
  React.useEffect(() => {
    console.log('1st effect: scanner init fired');

    scannerInit();
    setScannerReady(true);
    // eslint-disable-next-line
  }, []);

  // once scanner initialised, start scanning
  React.useEffect(() => {
    console.log('2nd effect: starting to scan');

    // start continuous reading from camera
    if (scannedCode === null && scannerReady) startScanning(codeReader);
    // eslint-disable-next-line
  }, [scannerReady, selectedCameraId, scannedCode]);

  return (
    <>
      <div>
        <video id='video-element' width='500' height='250'></video>
      </div>
      <div>
        <p>
          {scannedCode === null && !messageEnum ? (
            "Hold up a book's barcode to the camera"
          ) : scannedCode && !messageEnum ? (
            <span style={{ color: 'green', textTransform: 'uppercase' }}>
              Scanned!
            </span>
          ) : messageEnum === Message.AlreadyInList ? (
            <span
              style={{
                backgroundColor: 'red',
                color: 'black',
                textTransform: 'uppercase'
              }}
            >
              This book is already in your list!
            </span>
          ) : messageEnum === Message.NotFound ? (
            <span
              style={{
                backgroundColor: 'red',
                color: 'white',
                textTransform: 'uppercase'
              }}
            >
              Sorry, but we couldn't find this book in our partner databases.
            </span>
          ) : null}
        </p>
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
