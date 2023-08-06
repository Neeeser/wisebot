import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm } from "formidable";
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const form = new IncomingForm({
    multiples: true,
    uploadDir: './docs',
    filename: (name, ext, part, form) => part.originalFilename ?? undefined + ".pdf"
  });

  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
      return;
    }


    console.log(Object.keys(files))

    // const file = files.file as formidable.File;
    // const filePath = file.filepath;

    // fs.renameSync(filePath, '../docs/' + file.na);

    res.status(200).json({ message: 'File uploaded successfully' });
  });
}