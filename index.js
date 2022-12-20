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
  console.log(map[str]);
  return map[str];
}

async function convertToForm() {
  const resp = await fetch(
    "https://www.bbc.co.uk/bitesize/guides/zqjy6yc/test"
  );

  const document = (
    await JSDOM.fromURL("https://www.bbc.co.uk/bitesize/guides/zqjy6yc/test")
  ).window.document;
  const title = document
    .querySelector(".test-chapter")
    .querySelector("h1").textContent;
  // convert all superscript elements to unicode characters
  const sups = document.getElementsByTagName("sup");
  for (let sup of sups) {
    const parent = sup.parentNode;
    console.log("1>> ", parent.textContent);
    const supChar = superscript(sup.textContent.trim());
    if (supChar) {
      sup.outerHTML = supChar;
    }
    // console.log("2>> ", parent.textContent);
  }
  const items = Array.from(
    document.getElementsByClassName("question--radio")
  ).map((el) => {
    const sups = el.getElementsByTagName("sup");
    for (let sup of sups) {
      const parent = sup.parentNode;
      const supChar = superscript(sup.textContent.trim());
      if (supChar) {
        sup.outerHTML = supChar;
      } else {
        console.log("missed this one ", supChar);
      }
    }
    const prompt = el.getElementsByClassName("question-prompt")[0].textContent;
    // console.log(prompt);
    const options = Array.from(el.getElementsByClassName("radio-answer")).map(
      (el) => el.textContent
    );
    return createItem(prompt, options);
  });
  process.exit();
  fs.writeFileSync("quiz.json", JSON.stringify(items));
  await authenticateUser();
  const formId = await createForm(title);
  await formToQuiz(formId);
  await addItemsToForm(formId, items);
}

convertToForm();
