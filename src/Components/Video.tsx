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
  const [bookData, setBookData] = React.useState<BookData>(null);
  let [selectedCameraId, setSelectedCameraId] = React.useState(null);
  let [availableCameras, setAvailableCameras] = React.useState([]);

  // scanning helper function
  const readCode = codeReader => {
    codeReader
      .decodeFromInputVideoDevice(selectedCameraId, 'video-element')
      .then(res => {
        // res.text is the scanned ISBN code
        console.log('scanned something', res.text);
        if (!bookData || bookData.ISBN !== res.text) {
          fetchBookData(res);
        } else {
        }
      });
  };

  const fetchBookData = async (res: string) => {
    console.log('hittibg api');
    const URL = getOpenLibraryUrl(res.text);
    axios
      .get(URL)
      .then(response => {
        // handle success
        let { data } = response;
        const key = Object.keys(data)[0];
        const fetchedBook: BookData = {
          ISBN: res.text,
          title: data[key].title,
          authors: data[key].authors
        };

        setBookData(fetchedBook);
        // update list only if not already there
        addToList((prevList: BookData[]) => {
          if (prevList.some(book => book.ISBN === fetchedBook)) {
            console.log('already there, ', fetchedBook.title);
            return prevList;
          } else {
            console.log(
              'Not the same? ',
              fetchedBook.ISBN,
              prevList.filter(b => b.title === fetchedBook.title)[0]
            );
            return [...prevList, fetchedBook];
          }
        });
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
  }, [bookData, selectedCameraId]);

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
          {bookData && bookData.ISBN
            ? 'Scanned'
            : "Hold up a book's barcode to the camera"}
        </p>
        {availableCameras.length > 1 && (
          <p>Selected Camera: {selectedCameraId}</p>
        )}
      </div>
      <br />
      <BookDataView bookList={books} />
      <button onClick={() => setBookData(initialBookData)}>RESET</button>
    </>
  );
};
