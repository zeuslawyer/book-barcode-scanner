// @ts-nocheck
import React from 'react';
import axios from 'axios';

import { BrowserBarcodeReader } from '@zxing/library'; // reference:  https://zxing-js.github.io/library/examples/barcode-camera/
import { BookListUi, renderAuthors } from './BookListUi';

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
  NotFound,
  shareSuccess,
  shareFail
}

interface Props {}

export const VideoRoot: React.FC<Props> = () => {
  let [scannedCode, setScannedCode] = React.useState<string>(null);
  let [scannerReady, setScannerReady] = React.useState<boolean>(false);
  let [books, updateBooks] = React.useState<Books>(null);
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [messageEnum, setMessageEnum] = React.useState<Message>(null);

  let codeReader = new BrowserBarcodeReader(1500);

  /**
   * Pauses for millis so that error message lingers for that duration, before setting scannedCode and causing re-render
   * @param millis - milliseconds to pass to setTimeout. Default is 2500
   */
  function resetScanner(millis = 2500) {
    window.setTimeout(() => {
      setScannedCode(null);
      setMessageEnum(null);
    }, millis);
  }

  function scannerInit() {
    // on component mount and re-renders:
    codeReader
      .getVideoInputDevices()
      .then(videoInputDevices => {
        // if no selected camera default to first one
        if (!selectedCameraId && videoInputDevices.length === 1)
          setSelectedCameraId(videoInputDevices[0].deviceId);
        if (!selectedCameraId && videoInputDevices.length === 2)
          setSelectedCameraId(videoInputDevices[1].deviceId);
      })
      .catch(e => console.error(e));
  }
  // scanning helper function
  function startScanning(codeReader: BrowserBarcodeReader) {
    codeReader
      .decodeOnceFromVideoDevice(selectedCameraId, 'video-element')
      .then(res => {
        // res.text is the scanned ISBN code. if its already in state no need to update state
        setScannedCode(res.text);
        // book already scanned
        if (books && books[res.text] !== undefined) {
          setMessageEnum(Message.AlreadyInList);
          resetScanner();
        } else {
          // if this book has not been added to list, hit the api
          fetchBookData(res).then(_ => resetScanner());
        }
        // after decoding, update UI to show scan has been done, and reset scannedCode state after timeout to trigger useEffect with dep = codeReader, to refresh and restart scanning
      })
      .catch(e => console.log('decoder error', e));
  }

  const fetchBookData = async (res: string) => {
    const URL = getOpenLibraryUrl(res.text);
    axios
      .get(URL)
      .then(response => {
        // handle success
        let { data } = response;
        if (Object.keys(data).length === 0) {
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
      .catch(e => console.error(`Error: ${e}`));
  };

  // initial scanner init, once on mount
  React.useEffect(() => {
    scannerInit();
    setScannerReady(true);
    console.info('useEffect fired. Scanner initialized');

    if (scannedCode === null && scannerReady) startScanning(codeReader);
    // eslint-disable-next-line
  }, [scannerReady, scannedCode]);

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
            <span style={{ color: 'yellow', textTransform: 'uppercase' }}>
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
          ) : messageEnum === Message.shareSuccess ? (
            <span style={{ color: 'green', textTransform: 'uppercase' }}>
              Share successful!
            </span>
          ) : messageEnum === Message.shareFail ? (
            <span
              style={{
                backgroundColor: 'red',
                color: 'white',
                textTransform: 'uppercase'
              }}
            >
              Sorry, the share failed. Try again?
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
      {!books ? null : (
        <button
          style={{ backgroundColor: 'white', width: '80px' }}
          onClick={() => {
            setScannedCode(null); // this will trigger a useEffect
            updateBooks(null);
            setMessageEnum(null); // so error messages dont show
          }}
        >
          Reset
        </button>
      )}
      <BookListUi bookCollection={books} />
      {!books ? null : (
        <button
          style={{ backgroundColor: 'white', width: '80px' }}
          onClick={() => {
            let text = '';
            let count = 0;
            for (const isbn in books) {
              let title = books[isbn].title;
              let author = renderAuthors(books[isbn].authors);
              text += ++count + ') ' + title + ', by ' + author + '. \n';
            }
            if (count === 1) text = text.replace('1)', '').trimStart(); // remove number in text if only one book

            // phone share functionality
            if (navigator.share) {
              mobileShare(text)
                .then(() => {
                  setMessageEnum(Message.shareSuccess);
                  console.info('Successful share');
                  resetScanner();
                })
                .catch(error => {
                  setMessageEnum(Message.shareFail);
                  console.error('Error sharing on mobile', error);
                  resetScanner();
                });
            } else {
              desktopMail(text)
                .then(res => {
                  setMessageEnum(Message.shareSuccess);
                  resetScanner();
                })
                .catch(error => {
                  setMessageEnum(Message.shareFail);
                  console.error('Error sharing on mobile', error);
                  resetScanner();
                });
            }
          }}
        >
          Share
        </button>
      )}
    </>
  );
};

function getOpenLibraryUrl(isbn) {
  // https://openlibrary.org/dev/docs/api/books
  return `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`;
}

function mobileShare(text: string) {
  const title = "Here's what I'm reading that I think you'll like!";
  return Promise.resolve(
    navigator.share({
      title,
      text: title + ' ' + text,
      url: 'https://zp-book-scan.netlify.com'
    })
  );
}

function desktopMail(text: string) {
  const emailTo = window.prompt("Enter an email address you'd like to send to");
  const subject = "Here's what I'm reading that I think you'll like!";
  const signoff =
    '\n\n\n\n\n\n\n\n--sent using https://zp-book-scan.netlify.com--';

  // reference https://stackoverflow.com/questions/5620324/mailto-link-with-html-body
  let href = `mailto:${emailTo}?subject=${subject}&body=${encodeURIComponent(
    text
  )}${signoff}`;
  const target = '_blank';
  window.open(href, target);
  return Promise.resolve(emailTo);
}
