import { generateCodeReview } from './openai.js';

let openaiApiKey = null;

document.addEventListener("DOMContentLoaded", function () {
  let token = null;
  chrome.runtime.sendMessage({ message: "popup_opened" });
  document
    .getElementById("token_form")
    .addEventListener("submit", function (e) {
      console.log("submit");
      e.preventDefault();
      token = document.getElementById("token_input").value;
      chrome.runtime.sendMessage({ message: "save_token", token: token });
      openaiApiKey = document.getElementById("openAi_input").value;
      fetchMergeRequests(token); // Fetch merge requests after saving the token
    });

  document.getElementById("pr_select").addEventListener("change", function () {
    displayLoadingMessage();
    console.log("change");
    let pullRequestId = JSON.parse(this.value);
    chrome.runtime.sendMessage({
      message: "fetch_diff",
      pullRequestId: pullRequestId,
    });
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.message === "diff_fetched") {
    console.log("diff_fetched");
    const diffItems = request.diff.map((item) => item.diff || "");
    const diffText = diffItems.join("\n\n");
    const outputElement = document.getElementById("diff_output");
    outputElement.innerHTML = ""; // Clear existing content

    diffItems.forEach((item) => {
      const lines = (item || "").split("\n");
      lines.forEach((line) => {
        if (line.startsWith("+")) {
          const span = document.createElement("span");
          span.classList.add("added-line");
          span.textContent = line;
          outputElement.appendChild(span);
        } else if (line.startsWith("-")) {
          const span = document.createElement("span");
          span.classList.add("removed-line");
          span.textContent = line;
          outputElement.appendChild(span);
        } else {
          outputElement.innerHTML += `${line}<br>`;
        }
      });
    });

    // Perform code review
    const codeDiff = diffText.replace(/\n+/g, "\n");
    performCodeReview(codeDiff);
  } else if (request.message === "error_fetching_diff") {
    console.log("error_fetching_diff");
    document.getElementById("diff_output").textContent =
      "Error fetching diff: " + request.error;
  }
});

function performCodeReview(codeDiff) {
  const apiKey = openaiApiKey;
  const maxTokens = 4096; // Maximum token limit for the model

  // Split the code diff into chunks based on a specific criterion (e.g., number of lines)
  const chunkSize = 400; // Number of lines per chunk
  const diffChunks = chunkCodeDiff(codeDiff, chunkSize);

  // Generate code review for each chunk
  const promises = diffChunks.map((chunk) => {
    const prompt = generatePrompt(chunk);
    return generateCodeReview(prompt, apiKey);
  });

  // Perform code review for each chunk and combine the results
  Promise.all(promises)
    .then((reviews) => {
      // Combine the individual code reviews into a single review
      const combinedReview = combineReviews(reviews);

      // Update the UI with the combined code review
      document.getElementById("code_review").textContent = combinedReview;
    })
    .catch((error) => {
      console.error("Error generating code review:", error);
    });
}

function chunkCodeDiff(codeDiff, chunkSize) {
  const lines = codeDiff.split("\n");
  const chunks = [];
  let currentChunk = "";

  for (let i = 0; i < lines.length; i++) {
    currentChunk += lines[i] + "\n";

    if ((i + 1) % chunkSize === 0 || i === lines.length - 1) {
      chunks.push(currentChunk);
      currentChunk = "";
    }
  }

  return chunks;
}

function generatePrompt(chunk) {
  const prompt = `your objective is review the code changes where old code begins from '-' and the new changed code begins from '+' and provide suggestion to refactor code the newly changed code if needed else say no refactoring needed for the following pr:\n\n${chunk}\n`;

  return prompt;
}

function combineReviews(reviews) {
  // Combine the individual code reviews into a single review
  const combinedReview = reviews.join("\n\n");

  return combinedReview;
}



function fetchMergeRequests(token) {
  console.log("fetchMergeRequests", token);
  // Make a request to fetch the merge requests using the provided token
  // Replace the URL with the actual API endpoint for fetching merge requests
  let url = `https://gitlab.com/api/v4/merge_requests?private_token=${token}&state=opened`;
  fetch(url)
    .then((response) => response.json())
    .then((data) => {
      if (data.message) {
        console.error("Error fetching merge requests:", data.message);
      } else {
        let select = document.getElementById("pr_select");
        let firstOption = select.firstElementChild;
        select.innerHTML = ""; // Clear existing options
        select.appendChild(firstOption); // Add back the first option
        for (let mergeRequest of data) {
          let option = document.createElement("option");
          option.value = JSON.stringify({
            projectId: mergeRequest.project_id,
            mergeRequestId: mergeRequest.iid,
          });
          console.log("option.value", option.value);
          option.text = mergeRequest.title;
          select.appendChild(option);
        }
      }
    })
    .catch((error) => {
      console.error("Error fetching merge requests:", error);
    });
}


function displayLoadingMessage() {
    document.getElementById('code_review').textContent = 'Reviewing... Please wait.';
}

function hideLoadingMessage() {
    document.getElementById('code_review').textContent = '';
}

function displayErrorMessage(message) {
    document.getElementById('code_review').textContent = message;
}

// function displayCodeReview(review) {
//     document.getElementById('code_review').textContent = review;
// }