import { useEffect, useState } from "react";
import MarkdownWithMathJax from "./MarkdownWithMathJax";
import { MarkdownTextSplitter } from "langchain/text_splitter";
import styled, { keyframes } from 'styled-components';
import styles from '@/styles/Home.module.css';

const StyledMarkdownWithMathJax = styled.div`
  border: 1px solid black;
  padding: 10px;
  transition: all 0.2s ease-in-out;

  &:hover {
    background-color: #f0f0f0;
  }

  h1 {
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  h2 {
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 10px;
  }

  p {
    font-size: 16px;
    line-height: 1.5;
    margin-bottom: 10px;
  }

  a {
    color: blue;
    text-decoration: underline;
  }
`;
const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const Loading = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-top-color: #333;
  border-radius: 50%;
  animation: ${spin} 0.8s ease-in-out infinite;
`;
interface CategoryAnswerProps {
    name: string;
    question: string;
    temperature: number;
    vectorIndex: string;
    setError: any;
    onAsk: any
}

export const CategoryAnswers = (props: CategoryAnswerProps) => {
    const [chatResponse, setChatResponse] = useState<any>();

    useEffect(() => {
        if (!chatResponse) {
            askQuestion();
        }
    }


        , []);


    /** 
     * Make a method that runs after the user submits a question
     * and call to the chat gpt api to ask for 5 follow up questions in a numbered list
     * then seperate the questions into an array of strings
     */
    function askQuestion() {
        // Make a request to the chat gpt api
        const response = fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                question: props.question,
                history,
                temperature: props.temperature,
                vectorIndex: props.vectorIndex
            }),
        }).then((response) => {
            response.json().then(data => {
                if (response.status === 200) {
                    setChatResponse({
                        type: 'apiMessage',
                        message: data.text,
                        sourceDocs: data.sourceDocuments,
                    });
                    console.log('data', data)
                    console.log('response', response)
                }
            });
        }).catch((error) => {
            console.log(error)
            props.setError(error);
        });
    }

    const hasData = chatResponse !== null && chatResponse !== undefined;

    return (
        <div className={styles.markdownanswer} onDoubleClick={(e) => {
            props.onAsk('Tell me more about: ' + (e.target as HTMLElement).innerText);
        }}
            onClick={(e) => {
                if (e.ctrlKey == true) {
                    const text = window.getSelection()?.toString();
                    if (text) props.onAsk('Tell me more about: ' + text);
                }
            }}>
            {chatResponse && (
                <StyledMarkdownWithMathJax>
                    <MarkdownWithMathJax>{chatResponse.message}</MarkdownWithMathJax>
                </StyledMarkdownWithMathJax>
            )}
            {!chatResponse && (
                <div>
                    <Loading /> Loading...
                </div>)}

        </div>
    )
}