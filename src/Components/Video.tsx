// @ts-nocheck
import React from "react";
import { BrowserBarcodeReader } from "@zxing/library";

interface Props {}

const VideoRoot: React.FC<Props> = () => {
  const [code, setCode] = React.useState("");
  const [timestamp, setTimestamp] = React.useState("");

  React.useEffect(() => {
    console.log("running");
    const codeReader = new BrowserBarcodeReader(300);

    codeReader
      .decodeFromInputVideoDevice(undefined, "video-element")
      .then(res => {
        setCode(res.text);
        setTimestamp(Date(res.timestamp));
        console.log("GOT IT:", res);
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
      <div>Code is {code}</div>
      <div>Date: {timestamp}</div>
    </>
  );
};

export default VideoRoot;
