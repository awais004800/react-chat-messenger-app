import React from "react";
import Attachment from "./svg/Attachment";
import Video from "./svg/Video";
import Audio from "./svg/Audio";

const MessageForm = ({
  handleSubmit,
  text,
  setText,
  setImg,
  onClickVideo,
  onCallAudio,
}) => {
  return (
    <form className="message_form" onSubmit={handleSubmit}>
      <div style={{ marginRight: 10 }} onClick={onCallAudio}>
        <Audio />
      </div>
      <div style={{ marginRight: 10 }} onClick={onClickVideo}>
        <Video />
      </div>
      <label htmlFor="img">
        <Attachment />
      </label>
      <input
        onChange={(e) => setImg(e.target.files[0])}
        type="file"
        id="img"
        accept="image/*"
        style={{ display: "none" }}
      />
      <div>
        <input
          type="text"
          placeholder="Enter message"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </div>
      <div>
        <button className="btn">Send</button>
      </div>
    </form>
  );
};

export default MessageForm;
