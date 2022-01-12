import React, { useEffect, useState, useContext, useRef } from "react";
import { db, auth, storage } from "../firebase";
// @ts-ignore
import styles from "./Home.module.css";
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  Timestamp,
  orderBy,
  setDoc,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { ref, getDownloadURL, uploadBytes } from "firebase/storage";
import User from "../components/User";
import MessageForm from "../components/MessageForm";
import Message from "../components/Message";
import VideoView from "../components/VideoView/index";
import { SocketContext } from "../context/SocketContext";
import Peer from "simple-peer";

const Home = () => {
  const { me, socketRef } = useContext(SocketContext);
  const [users, setUsers] = useState([]);
  const [chat, setChat] = useState("");
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [msgs, setMsgs] = useState([]);
  const isAudio = useRef(false);

  const [isVideoCall, setIsVideoCall] = useState(false);
  const [stream, setStream] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [receivingCall, setReceivingCall] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [callAccepted, setCallAccepted] = useState(false);
  const [clientVideo, setClientVideo] = useState(null);

  const [call, setcall] = useState(null);
  const connectionRef = useRef(null);

  const onClickVideo = () => {
    isAudio.current = false;
    setIsVideoCall(true);
    videoCall(text);
  };

  const onCallAudio = () => {
    isAudio.current = true;
    setIsVideoCall(true);
    videoCall(text);
  };

  const user1 = auth.currentUser.uid;

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((_stream) => {
        setStream(_stream);

        socketRef.current.on(
          "onCall",
          ({ clientID, signalData, from, email, isAudioCall }) => {
            isAudio.current = isAudioCall;
            setcall({ signal: signalData, from, email });
            setReceivingCall(true);
            console.log(isAudioCall);
          }
        );

        socketRef.current.on("getUser", (data) => {
          if (auth.currentUser.email === data.userToCall) {
            socketRef.current.emit("myID", {
              clientID: me,
              email: auth.currentUser.email,
              sender: data.me,
            });
          }
        });
      });

    const usersRef = collection(db, "users");
    // create query object
    const q = query(usersRef, where("uid", "not-in", [user1]));
    // execute query
    const unsub = onSnapshot(q, (querySnapshot) => {
      let users = [];
      querySnapshot.forEach((doc) => {
        users.push(doc.data());
      });
      setUsers(users);
    });
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectUser = async (user) => {
    setChat(user);

    const user2 = user.uid;
    const id = user1 > user2 ? `${user1 + user2}` : `${user2 + user1}`;

    const msgsRef = collection(db, "messages", id, "chat");
    const q = query(msgsRef, orderBy("createdAt", "asc"));

    onSnapshot(q, (querySnapshot) => {
      let msgs = [];
      querySnapshot.forEach((doc) => {
        msgs.push(doc.data());
      });
      setMsgs(msgs);
    });

    // get last message b/w logged in user and selected user
    const docSnap = await getDoc(doc(db, "lastMsg", id));
    // if last message exists and message is from selected user
    if (docSnap.data() && docSnap.data().from !== user1) {
      // update last message doc, set unread to false
      await updateDoc(doc(db, "lastMsg", id), { unread: false });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // @ts-ignore
    const user2 = chat.uid;

    const id = user1 > user2 ? `${user1 + user2}` : `${user2 + user1}`;

    let url;
    if (img) {
      const imgRef = ref(
        storage,
        // @ts-ignore
        `images/${new Date().getTime()} - ${img.name}`
      );
      // @ts-ignore
      const snap = await uploadBytes(imgRef, img);
      const dlUrl = await getDownloadURL(ref(storage, snap.ref.fullPath));
      url = dlUrl;
    }

    await addDoc(collection(db, "messages", id, "chat"), {
      text,
      from: user1,
      to: user2,
      createdAt: Timestamp.fromDate(new Date()),
      media: url || "",
    });

    await setDoc(doc(db, "lastMsg", id), {
      text,
      from: user1,
      to: user2,
      createdAt: Timestamp.fromDate(new Date()),
      media: url || "",
      unread: true,
    });

    setText("");
  };

  const answerCall = () => {
    setIsVideoCall(true);

    navigator.mediaDevices
      .getUserMedia({
        ...(isAudio.current === true ? { video: false } : { video: true }),
        audio: true,
      })
      .then((_stream) => {
        const peer = new Peer({
          initiator: false,
          trickle: false,
          stream: _stream,
        });

        peer.on("signal", (data) => {
          // @ts-ignore
          socketRef.current.emit("answerCall", {
            signal: data,
            to: call.from.current,
          });
          setReceivingCall(false);
        });

        peer.on("stream", (currentStream) => {
          // @ts-ignore
          setClientVideo(currentStream);
        });

        // @ts-ignore
        peer.signal(call.signal);

        connectionRef.current = peer;
      });
  };

  const videoCall = (id) => {
    setIsVideoCall(true);
    navigator.mediaDevices
      .getUserMedia({
        ...(isAudio.current === true ? { video: false } : { video: true }),
        audio: true,
      })
      .then((_stream) => {
        const peer = new Peer({
          initiator: true,
          trickle: false,
          stream: _stream,
        });

        socketRef.current.emit("userID", {
          me,
          senderName: auth.currentUser.email,
          // @ts-ignore
          userToCall: chat.email,
        });

        socketRef.current.on("clientID", (_data) => {
          peer.on("signal", (data) => {
            socketRef.current.emit("callUser", {
              // @ts-ignore
              clientID: _data.clientID.current,
              signalData: data,
              from: me,
              email: _data.email,
              isAudioCall: isAudio.current,
            });
          });

          peer.on("stream", (currentStream) => {
            // @ts-ignore
            setClientVideo(currentStream);
          });

          socketRef.current.on("callAccepted", (signal) => {
            setCallAccepted(true);
            peer.signal(signal);
          });
          connectionRef.current = peer;
        });
      });
  };

  return (
    <>
      <div className="home_container">
        <div className="users_container">
          {users.map((user) => (
            <User
              key={user.uid}
              user={user}
              selectUser={selectUser}
              user1={user1}
              chat={chat}
            />
          ))}
        </div>
        <div className="messages_container">
          {receivingCall ? (
            <VideoView
              onClientStream={clientVideo}
              stream={stream}
              onEndClick={() => {
                setIsVideoCall(false);
                setCallAccepted(false);
                // @ts-ignore
                window.location.reload();
              }}
              isAudio={isAudio.current}
            />
          ) : (
            <></>
          )}
          {chat ? (
            <>
              <div className="messages_user">
                <h3>
                  {
                    // @ts-ignore
                    chat.name
                  }
                </h3>
              </div>
              <div className="messages">
                {isVideoCall === true || callAccepted === true ? (
                  <VideoView
                    onClientStream={clientVideo}
                    stream={stream}
                    onEndClick={() => {
                      setIsVideoCall(false);
                      setCallAccepted(false);
                      // @ts-ignore
                      window.location.reload();
                    }}
                    isAudio={isAudio}
                  />
                ) : (
                  <>
                    {msgs.length
                      ? msgs.map((msg, i) => (
                          <Message key={i} msg={msg} user1={user1} />
                        ))
                      : null}
                  </>
                )}
              </div>
              <MessageForm
                handleSubmit={handleSubmit}
                text={text}
                setText={setText}
                setImg={setImg}
                onClickVideo={onClickVideo}
                onCallAudio={onCallAudio}
              />
            </>
          ) : (
            <h3 className="no_conv">Select a user to start conversation</h3>
          )}
        </div>
        {receivingCall && !callAccepted && (
          <>
            <div className={styles.reviceCallWrapper}>
              <div className={styles.model}>
                <p className={styles.callerTitle}>
                  {" "}
                  {call.email} is calling...
                </p>
                <button onClick={answerCall} className={styles.answerBtn}>
                  Answer
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default Home;
