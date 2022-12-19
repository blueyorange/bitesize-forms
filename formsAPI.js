const path = require("path");
const google = require("@googleapis/forms");
const { authenticate } = require("@google-cloud/local-auth");
const fs = require("fs/promises");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/drive"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

let forms;

/**
 * Reads previously authorized credentials from the save file.
 *
 * @return {Promise<OAuth2Client|null>}
 */
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

/**
 * Serializes credentials to a file comptible with GoogleAUth.fromJSON.
 *
 * @param {OAuth2Client} client
 * @return {Promise<void>}
 */
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

/**
 * Load or request or authorization to call APIs.
 *
 */
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

async function authenticateUser() {
  // const authClient = await authenticate({
  //   keyfilePath: path.join(__dirname, "credentials.json"),
  //   scopes: "https://www.googleapis.com/auth/drive",
  // });
  const auth = await authorize();

  forms = google.forms({
    version: "v1",
    auth,
  });
}

async function createForm(title) {
  const newForm = {
    info: {
      title,
    },
  };
  const createResponse = await forms.forms.create({
    requestBody: newForm,
  });
  return createResponse.data.formId;
}

async function formToQuiz(formId) {
  // Request body to convert form to a quiz
  const updateRequest = {
    requests: [
      {
        updateSettings: {
          settings: {
            quizSettings: {
              isQuiz: true,
            },
          },
          updateMask: "quizSettings.isQuiz",
        },
      },
    ],
  };
  const res = await forms.forms.batchUpdate({
    formId,
    requestBody: updateRequest,
  });
  console.log(res.data);
  return res.data;
}

async function addItemsToForm(formId, items) {
  // Request body to add video item to a Form
  const requests = items.map((item, index) => {
    return { createItem: { ...item, location: { index } } };
  });
  const update = {
    requests,
  };
  const updateResponse = await forms.forms.batchUpdate({
    formId,
    requestBody: update,
  });
  console.log(updateResponse.data);
  return updateResponse.data;
}

module.exports = { authenticateUser, createForm, formToQuiz, addItemsToForm };
