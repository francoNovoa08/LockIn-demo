document.getElementById('learn-send-btn').addEventListener('click', async () => {
  const input = document.getElementById('learn-input');
  const responseBox = document.getElementById('learn-response');
  const query = input.value.trim();

  if (!query) return;

  // Show temporary loading text
  responseBox.innerHTML = "<em>Bo is thinking...</em>";

  try {
    const res = await fetch("/learn_query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: query })
    });

    const data = await res.json();

    if (data.answer) {
      responseBox.innerHTML = `<strong>Bo:</strong> ${data.answer}`;
      MathJax.typesetPromise([responseBox]);
    } else {
      responseBox.innerHTML = `<strong>Bo:</strong> ${markdownToHtml(data.answer)}`;
    }
  } catch (err) {
    responseBox.innerHTML = "<span style='color:red;'>Something went wrong. Try again.</span>";
    console.error("Learn query error:", err);
  }
});

document.getElementById('learn-input').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('learn-send-btn').click();
  }
});

function markdownToHtml(str) {
  return str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
}
