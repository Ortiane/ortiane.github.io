const VALIDATE_URL = "https://words.dev-apis.com/validate-word"
const RANDOM_WORD_URL = "https://words.dev-apis.com/word-of-the-day?random=1"

const NORMAL_BUTTONS = ["q w e r t y u i o p", "a s d f g h j k l", "z x c v b n m"]
const SPECIAL_BUTTONS = new Map([
    ["enter", "enter"],
    ["⌫", "backspace"]
]);

const CORRECTNESS_MAPPING = new Map([
    [0, "incorrect-word"],
    [1, "partially-correct-word"],
    [2, "correct-word"]
]);

let currentRow = 1;
let currentCol = 1;
let correctWord;
let keyboardObject = document.querySelector(".wordle-keyboard");

String.prototype.replaceAt = function (index, replacement) {
    return this.substring(0, index) + replacement + this.substring(index + replacement.length);
}

async function postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
        method: "POST", // *GET, POST, PUT, DELETE, etc.
        mode: "cors", // no-cors, *cors, same-origin
        cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
        credentials: "same-origin", // include, *same-origin, omit
        headers: {
            "Content-Type": "application/json",
            // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: "follow", // manual, *follow, error
        referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

function typeEventHandler(event) {
    if (event.which != 8 && event.which != 13 && !event.key.match("[a-z]")) {
        return;
    }
    document.querySelector(`.${event.key.toLowerCase()}`).click();
}


async function wordClickEventHandler(event) {
    let target = event.target;
    let terminalState = false;
    if (target.tagName.toLowerCase() !== "button") {
        return;
    }
    keyboardObject.removeEventListener("click", wordClickEventHandler);
    let currentTextBox = document.querySelector(`.row-${currentRow}.col-${currentCol}`);
    if (target.className.includes("backspace")) {
        if (currentTextBox.value) {
            // If you are on the last box.
            currentTextBox.value = "";
        }
        else {
            // Clear and move to previous box.
            currentCol = Math.max(1, currentCol - 1);
            currentTextBox.style.borderColor = "";
            currentTextBox = document.querySelector(`.row-${currentRow}.col-${currentCol}`);
            currentTextBox.value = "";
        }
    }
    else if (target.className.includes("enter")) {
        if (currentCol == 5 && currentTextBox.value) {
            let word = ""
            for (let i = 1; i <= 5; i++) {
                let letterObj = document.querySelector(`.row-${currentRow}.col-${i}`);
                word += letterObj.value;
            }
            const response = await postData(VALIDATE_URL, { "word": word });
            if (response.validWord) {
                // Check if it's equal to the daily word.
                if (word == correctWord) {
                    for (col = 1; col <= 5; col++) {
                        let letterObj = document.querySelector(`.row-${currentRow}.col-${col}`);
                        let keyObj = document.querySelector(`.${word[col - 1]}`);
                        letterObj.classList.add(CORRECTNESS_MAPPING.get(2));
                        keyObj.classList.add(CORRECTNESS_MAPPING.get(2));
                    }
                    terminalState = true;
                    alert("You win! Refresh the page to play again.");
                }
                else {
                    // Color in the letters that are correct.
                    let calculatedCorrectness = Array(5).fill(0);
                    let copyCorrectWord = correctWord;
                    let copyWord = word;
                    for (col = 0; col < 5; col++) {
                        if (copyWord[col] == copyCorrectWord[col]) {
                            calculatedCorrectness[col] = 2;
                            copyCorrectWord = copyCorrectWord.replaceAt(col, "-");
                            copyWord = copyWord.replaceAt(col, "*");
                        }
                    }
                    for (col = 0; col < 5; col++) {
                        if (copyCorrectWord.includes(copyWord[col])) {
                            calculatedCorrectness[col] = 1;
                            copyCorrectWord = copyCorrectWord.replaceAt(col, "-");
                        }
                    }
                    for (col = 1; col <= 5; col++) {
                        let letterObj = document.querySelector(`.row-${currentRow}.col-${col}`);
                        let keyObj = document.querySelector(`.${word[col - 1]}`);
                        letterObj.classList.add(CORRECTNESS_MAPPING.get(calculatedCorrectness[col - 1]));
                        keyObj.classList.add(CORRECTNESS_MAPPING.get(calculatedCorrectness[col - 1]));
                    }
                    if (currentRow != 6) {
                        currentCol = 1;
                        currentRow++;
                        currentTextBox.style.borderColor = "";
                        currentTextBox = document.querySelector(`.row-${currentRow}.col-${currentCol}`);
                    }
                    else {
                        terminalState = true;
                        alert(`Nice try, you lose. The word was "${correctWord}".`)
                    }
                }
            }
            else {
                alert("Not a valid word.");
            }
        }
        else {
            alert("Not enough letters.");
        }
    }
    else if (!currentTextBox.value) {
        currentTextBox.value = target.textContent;
        currentCol = Math.min(5, currentCol + 1);
        currentTextBox.style.borderColor = "";
        currentTextBox = document.querySelector(`.row-${currentRow}.col-${currentCol}`);
    }
    currentTextBox.style.borderColor = "white";
    if (!terminalState) {
        keyboardObject.addEventListener("click", wordClickEventHandler);
    }
}



async function main() {
    promise = await fetch(RANDOM_WORD_URL);
    correctWord = (await promise.json()).word.toLowerCase();
    let gameObject = document.querySelector(".wordle-game");
    for (let ri = 1; ri <= 6; ri++) {
        for (let ci = 1; ci <= 5; ci++) {
            let newInput = document.createElement("input");
            newInput.setAttribute("size", "1");
            newInput.setAttribute("maxlength", "1");
            newInput.classList.add("wordle-field");
            newInput.classList.add(`row-${ri}`);
            newInput.classList.add(`col-${ci}`);
            newInput.setAttribute("readonly", "readonly");
            gameObject.appendChild(newInput);
        }
    }

    Object.entries(keyboardObject.children).forEach(child => {
        for (let character of NORMAL_BUTTONS[child[0]].split(" ")) {
            let keyboardButton = document.createElement("button");
            keyboardButton.textContent = character;
            keyboardButton.classList.add("wordle-letter");
            keyboardButton.classList.add(character);
            keyboardButton.style.gridArea = character;
            child[1].appendChild(keyboardButton);
            character = String.fromCharCode(character.charCodeAt(0) + 1);

        }
    });

    let row3Object = document.querySelector(".wordle-row-3");
    SPECIAL_BUTTONS.forEach((value, text) => {
        let keyboardButton = document.createElement("button");
        keyboardButton.textContent = text;
        keyboardButton.classList.add("special-key");
        keyboardButton.classList.add(value);
        keyboardButton.style.gridArea = value;
        row3Object.appendChild(keyboardButton);
    });
    keyboardObject.addEventListener("click", wordClickEventHandler);
    document.querySelector("body").addEventListener("keydown", typeEventHandler);
}


main();