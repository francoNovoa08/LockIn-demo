import os

from flask import Flask, jsonify, render_template, request
from openai import OpenAI

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/generate", methods=["POST"])
def generate_mcqs():
    data = request.get_json()
    curriculum = data.get("curriculum", "IB")
    subject = data.get("subject", "Math")
    topic = data.get("topic", "Functions")
    difficulty = data.get("difficulty", "Medium")
    num_questions = data.get("numQuestions", 5)
    ib_level = data.get("ibLevel", "")

    level_str = f" at the IB level {ib_level}" if curriculum == "IB" and ib_level else ""
    
    prompt = f"""
You are an expert {curriculum} {subject} tutor.

Generate {num_questions} multiple-choice questions (MCQs) on the topic "{topic}" for the {curriculum}{level_str} curriculum. 
Ensure the questions are relevant to the {curriculum} curriculum. Abide by this strictly.
Make the questions suitable for {difficulty} level students.
Each question must have:
- A clear question
- 4 answer options labeled A–D
- A clearly indicated correct answer
- A short hint. The hint should not reveal the answer, but should guide the student towards the correct answer.
- A short explanation

Strictly use this format with NO extra line breaks or markdown:

1. Question?
   A. ...
   B. ...
   C. ...
   D. ...
   Answer: B
   Hint: [Hint here]
   Explanation: [Explanation here]
"""

    try:
        response = client.chat.completions.create(model="gpt-4o",
                                                  messages=[{
                                                      "role": "user",
                                                      "content": prompt
                                                  }],
                                                  temperature=0.7,
                                                  max_tokens=1000)
        content = response.choices[0].message.content
        return jsonify({"questions": content})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
