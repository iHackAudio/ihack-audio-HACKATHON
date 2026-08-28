import { google } from "googleapis";

export async function searchGoogleDrive(accessToken: string, query: string = "") {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.list({
    q: query || "trashed=false",
    fields: "files(id, name, mimeType)",
    pageSize: 10,
  });
  return res.data.files;
}

export async function readGoogleDoc(accessToken: string, documentId: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const docs = google.docs({ version: "v1", auth });

  const res = await docs.documents.get({ documentId });
  const content = res.data.body?.content;
  if (!content) return "";

  let text = "";
  content.forEach((el) => {
    if (el.paragraph) {
      el.paragraph.elements?.forEach((elem) => {
        if (elem.textRun?.content) {
          text += elem.textRun.content;
        }
      });
    }
  });
  return text;
}

export async function createGoogleDoc(accessToken: string, title: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const docs = google.docs({ version: "v1", auth });

  const res = await docs.documents.create({
    requestBody: { title },
  });
  return { documentId: res.data.documentId, title: res.data.title };
}

export async function appendToGoogleDoc(accessToken: string, documentId: string, text: string) {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });
  const docs = google.docs({ version: "v1", auth });

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          insertText: {
            endOfSegmentLocation: {},
            text: text + "\n",
          },
        },
      ],
    },
  });
  return { status: "success", documentId };
}
