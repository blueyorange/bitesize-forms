"use strict";

const path = require("path");
const google = require("@googleapis/forms");
const { authenticate } = require("@google-cloud/local-auth");
let forms;

async function authenticateUser() {
  const authClient = await authenticate({
    keyfilePath: path.join(__dirname, "credentials.json"),
    scopes: "https://www.googleapis.com/auth/drive",
  });

  forms = google.forms({
    version: "v1",
    auth: authClient,
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
