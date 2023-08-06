import { useRef, useState, useEffect } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import { Message } from '@/types/chat';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import MarkdownWithMathJax from '../components/MarkdownWithMathJax';
import redlines from '@/utils/redlines';
import categoryQuestions from './categoryQuestions.json'

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { PromptTemplate } from 'langchain';
import { CategoryAnswers } from '@/components/Catagory';

export default function Home() {
  const [query, setQuery] = useState<string>('');
  const [followupQs, setFollowupQs] = useState<string[]>(['What are the key factors impacting CSX?', 'Please provide an overall summary of CSX as a table.']);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [temperature, setTemperature] = useState<number>(1);
  const [vectorIndex, setVectorIndex] = useState<string>('index2');
  const [messageState, setMessageState] = useState<{
    messages: Message[];
    pending?: string;
    history: [string, string][];
    pendingSourceDocs?: Document[];
  }>({
    messages: [],
    history: [],
  });

  const { messages, history } = messageState;

  const messageListRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // "key performance metrics and information about CSX",
    // "Today's date is 2023-08-01. Please describe how CSX performing in the top 5 factors of its industry environment."
    // "How is it performing financially, both formatted as a table. Use data from the last 5 years. ""
    //"Please provide the financial metrics of CSX about revenue breakdowns by market segment and key performance measures including train velocity, dwell time, on-time originations, on-time arrivals, and safety metrics."
    // makeRequest("Please provide and overall summary of CSX.");
    textAreaRef.current?.focus();
  }, []);

  // Add the following useEffect hook
  useEffect(() => {
    // messageListRef.current?.scrollIntoView();
    messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);

  }, [messages]);

  const handleNewTopic = () => {
    // Reset the conversation history
    setMessageState({
      messages: [
        {
          message: 'What else would you like to know about CSX?',
          type: 'apiMessage',
        },
      ],
      history: [],
    });
    // Log to the console
    console.log('Topic has been changed'); //onlly logs to the console in browser.
  };

  const handleTemperatureChange = (event: any) => {
    // Reset the conversation history
    // Log to the console
    setTemperature(Number(event.target.value));
    console.log('temperature has been changed: ' + event.target.value); //onlly logs to the console in browser.
  };

  const handleVectorIndexChange = (event: any) => {
    // Reset the conversation history
    // Log to the console
    setVectorIndex(event.target.value);
    console.log('vector index has been changed: ' + event.target.value); //onlly logs to the console in browser.
  };

  //handle form submission
  async function handleSubmit(e: any) {
    e.preventDefault();

    setError(null);

    if (!query) {
      alert('Please input a question');
      return;
    }

    const question = query.trim();

    await makeRequest(question);
  }

  async function makeRequest(question: string) {

    setMessageState((state) => ({
      ...state,
      messages: [
        ...state.messages,
        {
          type: 'userMessage',
          message: question,
        },
      ],
    }));

    setLoading(true);
    setQuery('');

    try {
      const message = await askQuestion(question);

      if (message) {
        setFollowUpButtons(await followUpQuestions());

        setMessageState((state) => ({
          ...state,
          messages: [
            ...state.messages,
            message,
          ],
          history: [...state.history, [question, message.message]],
        }));
        // console.log('messageState', messageState);

        setLoading(false);

        //scroll to bottom
        messageListRef.current?.scrollTo(0, messageListRef.current.scrollHeight);
      }
    } catch (error) {
      setLoading(false);
      setError('An error occurred while fetching the data. Please try again.');
      console.log('error', error);
    }
  }


  //prevent empty submissions
  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && query) {
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  // handlefollowup calls set query to set the quesry of whatever the text of the follow up button is
  const handleFollowUp = (e: any) => {
    setQuery(e.target.innerText);
  };

  /**
   * Takes in an array of 5 strings and sets the 5 prompt buttons at the bottom of the chat to the strings
   * 
   * 
   * @param followUpQuestions 
   */
  function setFollowUpButtons(followUpQuestions: string[]) {
    // Set the text of the follow up buttons to the follow up questions
    setFollowupQs(followUpQuestions);
    // try {
    //   document.getElementById("followUp1")!.innerText = followUpQuestions[0];
    //   document.getElementById("followUp2")!.innerText = followUpQuestions[1];
    //   document.getElementById("followUp3")!.innerText = followUpQuestions[2];
    //   document.getElementById("followUp4")!.innerText = followUpQuestions[3];
    //   document.getElementById("followUp5")!.innerText = followUpQuestions[4];
    // }
    // catch (err) {
    //   console.log("error setting follow up buttons");
    // }

  }


  /** 
     * Make a method that runs after the user submits a question
     * and call to the chat gpt api to ask for 5 follow up questions in a numbered list
     * then seperate the questions into an array of strings
    */
  async function askQuestion(question: string): Promise<Message | null> {
    // Make a request to the chat gpt api
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question,
        history,
        temperature,
        vectorIndex
      }),
    });
    const data = await response.json();

    if (data.error) {
      setError(data.error);
      return null;
    }

    return {
      type: 'apiMessage',
      message: data.text,
      sourceDocs: data.sourceDocuments,
    };
  }

  /** 
   * Make a method that runs after the user submits a question
   * and call to the chat gpt api to ask for 5 follow up questions in a numbered list
   * then seperate the questions into an array of strings
  */
  async function followUpQuestions(): Promise<string[]> {
    // Make a request to the chat gpt api
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: "Ignore all of the prompt before this sentence. Please provide me with 5 brand new follow-up questions that would be good detailed prompts I can ask a large language model that will help me understand the documents I provided better based on the previous question. Do not include any extra wording except the follow up questions and Please answer in the form:\n\n\n\n\n",
        history: [],
        temperature: .5,
        vectorIndex
      }),
    });
    const data = await response.json();

    // seperate the questions into an array of strings
    const followUpQuestions = data.text.split("\n");
    // Remove any empty strings or null values
    followUpQuestions.forEach((question: string, index: number) => {
      if (question == "" || question == null) {
        followUpQuestions.splice(index, 1);
      }
    });

    // Log the questions to the console
    console.log('Follow up questions', followUpQuestions);

    // Return the questions
    return followUpQuestions;
  }


  /**
   * handleUpload creates a window prompt for the user to upload a file
   */
  const handleUpload = async () => {
    // Create a window prompt for the user to upload a file
    const fileUpload = document.getElementById("fileUpload") as HTMLInputElement;
    var data = new FormData();
    if (fileUpload.files) {
      for (const file of fileUpload.files) {
        data.append('files', file, file.name)
      }
    }

    const response = await fetch('/api/file', {
      method: 'POST',
      body: data
    });
    const resonseData = await response.json();

    if (resonseData.error) {
      setError(resonseData.error);
    }
  }


  /** 
    * Make a method that runs after the user submits a question
    * and call to the chat gpt api to ask for 5 follow up questions in a numbered list
    * then seperate the questions into an array of strings
   */
  async function ingest(): Promise<null> {
    // Make a request to the chat gpt api
    const response = await fetch('/api/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();

    if (data.error) {
      setError(data.error);
    }

    return null;
  }


  return (
    <>
      <Layout>
        <div className="flex flex-col gap-4" style={{ justifyContent: 'flex-start' }}>
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            Wisebot Analysis
          </h1>
        </div>
        <div
          className="p-5"
          key={`sourceDocsAccordion-${"Summary"}`}
        >
          <Accordion
            type="single"
            collapsible
            className="flex-col"
          >
            <div key={`messageSourceDocs-${"1"}`}>
              <AccordionItem value={`item-${"1"}`}>

                <AccordionTrigger>
                  <h3>Summary</h3>
                </AccordionTrigger>
                <AccordionContent>

                  <div
                    className="p-5"
                    key={`sourceDocsAccordion-${"Summary"}`}
                  >
                    <Accordion
                      type="single"
                      collapsible
                      className="flex-col"
                    >
                      {categoryQuestions.map((c, index) => (
                        <div key={`messageSourceDocs-${index}`}>
                          <AccordionItem value={`item-${index}`}>
                            <AccordionTrigger>
                              <h3>{c.name}</h3>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div style={{ border: "1px solid black", padding: "10px" }}>
                                {c.questions.map((q, index) => (
                                  <div key={`${index}`}>

                                    <p>{index + 1}. {q}?</p>
                                    <CategoryAnswers
                                      name={c.name}
                                      question={q}
                                      vectorIndex={vectorIndex}
                                      temperature={temperature}
                                      setError={setError}
                                      onAsk={makeRequest}
                                    />
                                  </div>
                                ))}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        </div>
                      ))}
                    </Accordion>
                  </div>
                </AccordionContent>
              </AccordionItem>

            </div>
          </Accordion>
        </div>

        <div className="flex flex-row justify-center gap-4">
          <main className={styles.main}>
            <div className={styles.cloud}>
              <div ref={messageListRef} className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.type === 'apiMessage') {
                    icon = (
                      <Image
                        key={index}
                        src="/mafia.jpg"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={index}
                        src="/bender.jpg"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      loading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <div key={`message-${index}`}>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer}
                          onDoubleClick={(e) => {
                            makeRequest('Tell me more about: ' + (e.target as HTMLElement).innerText);
                          }}
                          onClick={(e) => {
                            if (e.ctrlKey == true) {
                              const text = window.getSelection()?.toString();
                              if (text) makeRequest('Tell me more about: ' + text);
                            }
                          }}
                        >
                          <MarkdownWithMathJax>
                            {message.message}
                          </MarkdownWithMathJax>
                        </div>
                      </div>
                      {message.sourceDocs && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {message.sourceDocs.map((doc, index) => (
                              <div key={`messageSourceDocs-${index}`}>
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <MarkdownWithMathJax>
                                      {doc.pageContent}
                                    </MarkdownWithMathJax>
                                    <p className="mt-2">
                                      <b>Source:</b> {JSON.stringify(doc.metadata)}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </div>
                  );
                })}
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
                      loading
                        ? 'Waiting for response...'
                        : 'What is this document about?'
                    }
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className={styles.generatebutton}
                  >
                    {loading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
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

                <div className="flex flex-col justify-center gap-4">
                  {
                    followupQs.map((q, i) => <button
                      key={i}
                      id="followUp1"
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" style={{ listStyle: 'none' }}
                      onClick={() => makeRequest(q)}
                    >
                      {q}
                    </button>
                    )}
                </div>

                {/* <button
                  type="button"
                  className={styles.newTopicButton}
                  onClick={handleNewTopic}
                >
                  🧹 Clear Chat
                </button>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <label>Choose a temperature:</label>
                <select name="temperature" id="temperature" defaultValue={temperature} onChange={handleTemperatureChange}>
                  <option key="option1" value={0.1}>0.1</option>
                  <option key="option2" value={0.3}>0.3</option>
                  <option key="option3" value={0.5}>0.5</option>
                  <option key="option4" value={0.7}>0.7</option>
                  <option key="option5" value={1.0}>1.0</option>
                </select>
                &nbsp;&nbsp;|&nbsp;&nbsp;
                <label>Choose a index:</label>
                <select name="vectorindex" id="vectorindex" defaultValue={vectorIndex} onChange={handleVectorIndexChange}>
                  <option key="option1" value='index2'>PDF</option>
                  <option key="option2" value='index3'>GIT</option>
                  <option key="option3" value='index4'>WIKI</option>
                  </select>*/}
              </div>
            </div>
            <div className="flex flex-column justify-center gap-4">

              <p style={{ paddingTop: '10px' }}>Update SEC Filings</p>
              <input type="file" id="fileUpload" multiple
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              />

              <button
                type="button"
                className={styles.newTopicButton}
                onClick={handleUpload}
              >
                Upload
              </button>

              <button
                type="button"
                className={styles.newTopicButton}
                onClick={ingest}
              >
                Ingest
              </button>

            </div>
            {error && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{error}</p>
              </div>
            )}
          </main>
        </div>
      </Layout>
    </>
  );
}
