const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const fs = require("fs");
const {
  createForm,
  formToQuiz,
  addItemsToForm,
  authenticateUser,
} = require("./formsAPI");

function createItem(title, options) {
  options = options.map((o) => {
    return { value: o };
  });
  return Object.freeze({
    item: {
      title,
      questionItem: {
        question: {
          required: true,
          grading: {
            pointValue: 1,
          },
          choiceQuestion: {
            type: "RADIO",
            options,
          },
        },
      },
    },
  });
}

function superscript(str) {
  const map = {
    0: "\u2070",
    1: "\u00B9",
    2: "\u00B2",
    3: "\u00B3",
    4: "\u2074",
    5: "\u2075",
    6: "\u2076",
    7: "\u2077",
    8: "\u2078",
    9: "\u2079",
  };
  return map[str];
}

function subscript(str) {
  const map = {
    0: "\u2080",
    1: "\u2081",
    2: "\u2082",
    3: "\u2083",
    4: "\u2084",
    5: "\u2085",
    6: "\u2086",
    7: "\u2087",
    8: "\u2088",
    9: "\u2089",
  };
  return map[str];
}

async function convertToForm() {
  const document = (
    await JSDOM.fromURL("https://www.bbc.co.uk/bitesize/guides/zwc7pbk/test")
  ).window.document;
  const title = document
    .querySelector(".test-chapter")
    .querySelector("h1").textContent;
  const supElements = document.querySelectorAll("sup");
  for (let supElement of supElements) {
    let supChar = superscript(supElement.textContent);
    if (supChar) {
      supElement.outerHTML = superscript(supElement.textContent);
    }
  }
  const subElements = document.querySelectorAll("sub");
  for (let subElement of subElements) {
    let subChar = subscript(subElement.textContent);
    if (subChar) {
      subElement.outerHTML = subscript(subElement.textContent);
    }
  }
  const questions = document.getElementsByClassName("question--radio");
  const items = [];
  for (let question of questions) {
    const prompt =
      question.getElementsByClassName("question-prompt")[0].textContent;
    const options = Array.from(
      question.getElementsByClassName("radio-answer")
    ).map((question) => question.textContent);
    items.push(createItem(prompt, options));
  }
  fs.writeFileSync("quiz.json", JSON.stringify(items));
  await authenticateUser();
  const formId = await createForm(title);
  await formToQuiz(formId);
  await addItemsToForm(formId, items);
}

convertToForm();
