let totalQuestions = 0;
let attempted = 0;
let correct = 0;
let questions = [];
let currentQuestionIndex = 0;

async function generateQuestions() {
  const curriculum = document.getElementById('curriculum').value;
  const subject = document.getElementById('subject').value;
  const topic = document.getElementById('topic').value;
  const difficulty = document.getElementById('difficulty').value;
  const numQuestions = document.getElementById('numQuestions').value;

  const ibLevel = document.getElementById('ibLevel').value || '';
  const res = await fetch('/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ curriculum, subject, topic, difficulty, numQuestions, ibLevel })
  });

  const data = await res.json();
  console.log("Raw data from server:", data);
  const output = document.getElementById('output');
  output.innerHTML = '';
  document.getElementById('output').style.display = 'block';
  document.getElementById('score').innerHTML = '';

  if (data.questions) {
    questions = parseQuestions(data.questions);
    if (questions.length === 0) {
      output.innerHTML = "<p><strong>Could not parse any questions.</strong> Check format or try again.</p>";
      return;
    }

    attempted = 0;
    correct = 0;
    totalQuestions = questions.length;
    currentQuestionIndex = 0;

    document.getElementById("question-form").style.display = "none";
    window.scrollTo({ top: 0, behavior: 'smooth' });

    showQuestion();
  } else {
    output.innerText = "Error: " + data.error;
  }
}

function showQuestion() {
  const q = questions[currentQuestionIndex];
  const output = document.getElementById('output');
  output.innerHTML = '';

  output.classList.add('fade-in');
  setTimeout(() => output.classList.remove('fade-in'), 800);

  const container = document.createElement('div');
  container.style.marginBottom = '30px';
  container.style.padding = '15px';
  container.style.border = '1px solid #ccc';
  container.style.borderRadius = '8px';
  container.style.backgroundColor = '#fefefe';

  const questionText = document.createElement('p');
  questionText.innerHTML = `<strong>Q${currentQuestionIndex + 1}:</strong> ${wrapLatex(q.question)}`;
  container.appendChild(questionText);

  const hint = document.createElement('p');
  const explanation = document.createElement('p');
  hint.style.marginTop = '10px';
  explanation.style.marginTop = '10px';

  q.options.forEach(opt => {
    const btn = document.createElement('button');
    btn.innerHTML = wrapLatex(opt);
    btn.style.margin = '5px';
    btn.onclick = () => {
      if (btn.disabled) return;

      attempted++;
      const isCorrect = opt[0] === q.answer;
      if (isCorrect) {
        btn.style.backgroundColor = '#c6f6c6';
        correct++;
      } else {
        btn.style.backgroundColor = '#f6c6c6';
      }

      q.options.forEach((_, i) => container.querySelectorAll('button')[i].disabled = true);

      explanation.innerHTML = `<strong>Explanation:</strong> ${wrapLatex(q.explanation)}`;
      MathJax.typesetPromise([explanation]);

      updateScore();

      const nextBtn = document.createElement('button');
      nextBtn.textContent = currentQuestionIndex < totalQuestions - 1 ? 'Next Question →' : 'Show Final Score';
      nextBtn.style.marginTop = '15px';
      nextBtn.onclick = () => {
        currentQuestionIndex++;
        if (currentQuestionIndex < totalQuestions) {
          showQuestion();
        } else {
          document.getElementById('output').innerHTML = '<p><strong>Quiz completed.</strong></p>';
        }
      };
      container.appendChild(nextBtn);
    };
    container.appendChild(btn);
  });

  const hintBtn = document.createElement('button');
  hintBtn.textContent = "Show Hint";
  hintBtn.style.marginTop = '10px';
  hintBtn.onclick = () => {
    hint.innerHTML = `<strong>Hint:</strong> ${wrapLatex(q.hint)}`;
    MathJax.typesetPromise([hint]).then(() => {
      hint.scrollIntoView({ behavior: 'smooth', block: 'end' })
    });
  };

  container.appendChild(document.createElement('br'));
  container.appendChild(hintBtn);
  container.appendChild(hint);
  container.appendChild(explanation);
  output.appendChild(container);

  MathJax.typesetPromise();
}

function wrapLatex(str) {
  return str.replace(/\$(.*?)\$/g, (_, math) => `$${math}$`);
}

function parseQuestions(rawText) {
  const questionBlocks = rawText.split(/\n(?=\d+\.\s)/); // Split on "1. ", "2. "
  const parsed = [];

  questionBlocks.forEach(block => {
    const lines = block.trim().split('\n');

    let questionLine = lines.find(line => /^\d+\.\s/.test(line)) || '';
    const question = questionLine.replace(/^\d+\.\s/, '').trim();

    const optionLines = lines.filter(line => /^[\s]*[A-D]\.\s/.test(line)).slice(0, 4);
    const options = optionLines.map(line => line.trim());

    const answerMatch = block.match(/Answer:\s*([A-D])/i);
    const hintMatch = block.match(/Hint:\s*(.*)/i);
    const explanationMatch = block.match(/Explanation:\s*(.*)/i);

    if (question && options.length === 4 && answerMatch) {
      parsed.push({
        question,
        options,
        answer: answerMatch[1],
        hint: hintMatch ? hintMatch[1].trim() : "No hint provided.",
        explanation: explanationMatch ? explanationMatch[1].trim() : "No explanation provided."
      });
    }
  });

  return parsed;
}

function updateScore() {
  const scoreDiv = document.getElementById('score');
  scoreDiv.innerHTML = `${attempted}/${totalQuestions} | ✅ ${correct} correct`;
  if (attempted === totalQuestions) {
    scoreDiv.innerHTML += `<br><strong>Final Score:</strong> ${correct}/${totalQuestions}`;
    document.getElementById("question-form").style.display = "block";
    document.getElementById("output").style.display = "none";
  }
}
