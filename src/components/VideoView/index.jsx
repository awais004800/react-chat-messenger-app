import React, { useRef, useEffect } from "react";
// @ts-ignore
import styles from "./styles.module.css";

const VideoView = ({ stream, onEndClick, onClientStream, isAudio }) => {
  const localRef = useRef(null);
  const clientRef = useRef(null);

  const onEnd = () => {
    if (!isAudio) {
      clientRef.current.srcObject = null;
      localRef.current.srcObject = null;
    } else {
      clientRef.current.srcObject = null;
    }

    onEndClick();
  };

  useEffect(() => {
    if (!isAudio) {
      localRef.current.srcObject = stream;
    }
  }, [isAudio, stream]);

  useEffect(() => {
    clientRef.current.srcObject = onClientStream;
  }, [onClientStream]);

  return (
    <div className={styles.container}>
      {isAudio === true ? (
        <div>
          <audio ref={clientRef} autoPlay></audio>
          <div className={styles.end}>
            <button onClick={onEnd} className={styles.endButton}>
              End
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.wapper}>
          <div className={styles.client}>
            <video
              className={styles.clientVideo}
              autoPlay
              ref={clientRef}
            ></video>
            <video
              playsInline
              className={styles.localVideo}
              ref={localRef}
              autoPlay
            ></video>
          </div>
          <div className={styles.end}>
            <button onClick={onEnd} className={styles.endButton}>
              End
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoView;
