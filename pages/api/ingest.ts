import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { makeChainFaiss } from '@/utils/makechain';
import { FaissStore } from "langchain/vectorstores/faiss";
import { run } from 'scripts/ingest-data'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  await run();

  res.status(200);
}
