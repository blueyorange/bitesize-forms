const DomParser = require("dom-parser");
const parser = new DomParser();
const fs = require("fs");
const {
  authenticateUser,
  createForm,
  formToQuiz,
  addItemsToForm,
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

async function convertToForm() {
  const resp = await fetch(
    "https://www.bbc.co.uk/bitesize/guides/z2wy6yc/test"
  );

  const dom = parser.parseFromString(await resp.text());
  const title = dom
    .getElementsByClassName("test-chapter")[0]
    .getElementsByTagName("h1")[0].textContent;
  const items = dom.getElementsByClassName("question--radio").map((el) => {
    const prompt = el.getElementsByClassName("question-prompt")[0].textContent;
    const options = el
      .getElementsByClassName("radio-answer")
      .map((el) => el.textContent);
    return createItem(prompt, options);
  });
  // fs.writeFileSync("quiz.json", JSON.stringify(items));
  await authenticateUser();
  const formId = await createForm(title);
  await formToQuiz(formId);
  await addItemsToForm(formId, items);
}

convertToForm();
