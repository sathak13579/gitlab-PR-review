export async function generateCodeReview(prompt, apiKey) {

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const data = {
    messages: [
      {
        role: "system",
        content: "You are a code refactoring AI.",
      },
      {
        role: "user",
        content: `${prompt}`,
      },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 400,
    temperature: 0.5,
    top_p: 1.0,
    n: 1,
    stop: "",
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers,
    body: JSON.stringify(data),
  });

  const responseData = await response.json();
  if (responseData.choices && responseData.choices.length > 0) {
    console.log(responseData);
    return responseData.choices[0].message.content;
  } else {
    return 'No response from OpenAI API'
  }
}
