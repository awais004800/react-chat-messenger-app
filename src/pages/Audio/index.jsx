import React, { useRef } from "react";

const Audio = () => {
  const clientRef = useRef();

  return (
    <div>
      <h1>Audio Call</h1>
      <div>
        <audio ref={clientRef} autoPlay />
      </div>
    </div>
  );
};

export default Audio;
