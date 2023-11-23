import { useState, useRef, useEffect, FormEvent, KeyboardEvent } from "react";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import CircularProgress from "@mui/material/CircularProgress";
import Link from "next/link";

export default function Home() {
  const [userInput, setUserInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentComic, setCurrentComic] = useState(false);
  const [latestImages, setLatestImages] = useState([]);
  const [windowWidth, setWindowWidth] = useState(512);

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);


  // Auto scroll chat to bottom
  useEffect(() => {
    if (messageListRef.current) {
      const messageList = messageListRef.current;
      messageList.scrollTop = messageList.scrollHeight;
    }
  }, [messages]);

  // Focus on input field
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    // Add event listener for window resize
    window.addEventListener('resize', handleResize);

    // Remove event listener on component unmount
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Handle errors
  const handleError = () => {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        role: "assistant",
        content: "Oops! There seems to be an error. Please try again.",
      },
    ]);
    setLoading(false);
    setUserInput("");
  };

  const toggleCurrentComic = () => {
    setCurrentComic(!currentComic)
  }

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (userInput.trim() === "") {
      return;
    }

    if(currentComic)
      toggleCurrentComic()

    setLoading(true);
    const context = [...messages, { role: "user", content: userInput }];
    setMessages(context);
    const queryData = {
      "inputs": userInput
    }

    // Reset user input
    setUserInput("");

    const response = await fetch(
      "https://xdwvg9no7pefghrn.us-east-1.aws.endpoints.huggingface.cloud",
      {
        headers: {
          "Accept": "image/png",
          "Authorization": "Bearer VknySbLLTUjbxXAXCjyfaFIPwUTCeRXbFSOjwRiCxsxFyhbnGjSFalPKrpvvDAaPVzWEevPljilLVDBiTzfIbWFdxOkYJxnOPoHhkkVGzAknaOulWggusSFewzpqsNWM",
          "Content-Type": "application/json"
        },
        method: "POST",
        body: JSON.stringify(queryData),
      }
    );


    const data = await response.blob();
    console.log(data)

    if (!data) {
      handleError();
      return;
    }

    setMessages((prevMessages: any) => [
      ...prevMessages,
      { role: "assistant", content: URL.createObjectURL(data) },
    ]);

    if (latestImages.length == 10) {
      latestImages.shift()
    }
    latestImages.push(URL.createObjectURL(data))
    setLatestImages(latestImages)

    setLoading(false);
  };

  // Prevent blank submissions and allow for multiline input
  const handleEnter = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && userInput) {
      if (!e.shiftKey && userInput) {
        handleSubmit(e);
      }
    } else if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  return (
    <>
      <Head>
        <title>Comic Generator</title>
        <meta name="description" content="Comic Generator" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/icon.svg" />
      </Head>
      <div className={styles.topnav}>
        <div className={styles.navlogo}>
          <Link href="/"><Image
                      src="/icon.svg"
                      alt="AI"
                      width="25"
                      height="25"
                      className={styles.boticon}
                      priority={true}
                    />Comic Generator</Link>
        </div>
        <div className={styles.navlinks}>
          <a
            href="https://github.com/manvi2912"
            target="_blank"
          >
            GitHub
          </a>
          {!currentComic && <a href="#" onClick={toggleCurrentComic}>Show Comic</a>}
          {currentComic && <a href="#" onClick={toggleCurrentComic}>Hide Comic</a>}
        </div>
      </div>
      <main className={styles.main}>
        <div className={styles.cloud}>
          <div ref={messageListRef} className={styles.messagelist}>
            {currentComic && <div className={styles.currentComic}>
              <h2>Current Comic</h2>
              <p>Last 10 images are shown here</p>
              <div className={styles.imageContainer}>
                {latestImages.map((image, index) => {
                  return (<img src={image} width="260px" alt={"Image " + (index + 1)} />)
                })}
              </div>
              <button className={styles.closeButton} onClick={toggleCurrentComic}>Close</button>
            </div>}
            {!currentComic &&  messages.map((message, index) => {
              return (
                <div
                  key={index}
                  className={
                    message.role === "user" &&
                      loading &&
                      index === messages.length - 1
                      ? styles.usermessagewaiting
                      : message.role === "assistant"
                        ? styles.apimessage
                        : styles.usermessage
                  }
                >
                  {/* Display the correct icon depending on the message type */}
                  {message.role === "assistant" ? (
                    <Image
                      src="/icon.svg"
                      alt="AI"
                      width="30"
                      height="30"
                      className={styles.boticon}
                      priority={true}
                    />
                  ) : (
                    <Image
                      src="/usericon.png"
                      alt="Me"
                      width="30"
                      height="30"
                      className={styles.usericon}
                      priority={true}
                    />
                  )}
                  <div className={styles.markdownanswer}>
                    {(message.role === "assistant") ? (<img src={message.content} style={{ width: `${Math.max(260, windowWidth/2)}px` }} alt={"Some error occured"} />) :
                      <ReactMarkdown>
                        {message.content}
                      </ReactMarkdown>}
                  </div>
                </div>
              );
            })}
            {!currentComic && messages.length===0 && <div className={styles.currentComic}>
              <h2>No comics here yet, create some...</h2>
            </div>}
          </div>
        </div>
        <div className={styles.center}>
          <div className={styles.cloudform}>
            <form onSubmit={handleSubmit}>
              <textarea
                disabled={loading}
                onKeyDown={handleEnter}
                ref={textAreaRef}
                autoFocus={false}
                rows={1}
                maxLength={512}

                id="userInput"
                name="userInput"
                placeholder={
                  loading ? "Waiting for response..." : "Enter your prompt here..."
                }
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className={styles.textarea}
              />
              <button
                type="submit"
                disabled={loading}
                className={styles.generatebutton}
              >
                {loading ? (
                  <div className={styles.loadingwheel}>
                    <CircularProgress color="inherit" size={20} />{" "}
                  </div>
                ) : (
                  // Send icon SVG in input field
                  <svg
                    viewBox="0 0 20 20"
                    className={styles.svgicon}
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
