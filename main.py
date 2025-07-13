import os

from flask import Flask, jsonify, render_template, request
from openai import OpenAI

app = Flask(__name__)
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


@app.route("/")
def home():
    return render_template("index.html")

@app.route("/quiz")
def quiz():
    return render_template("quiz.html")

@app.route("/learn")
def learn():
    return render_template("learn.html")

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
For maths questions, use LaTeX for mathematical expressions. Ensure mathematical accuracy in every question. 
Each question must have:
- A clear question
- 4 answer options labeled A–D
- A clearly indicated correct answer
- Only one correct answer
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


@app.route("/learn_query", methods=["POST"])
def learn_query():
    data = request.get_json()
    question = data.get("question", "")

    prompt = f"""
    You are a knowledgeable and friendly tutor ghost named Bo.
    You are helping a student learn a topic and helping them study for an exam. You are very helpful and patient. You are a helpful ghost named Bo, so you act friendly and helpful, but never in a cringe-inducing way; always content over personality. No need to introduce yourself.
    Answer the following learning question in a clear, concise, and helpful way:

    Question: {question}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{
                "role": "user",
                "content": prompt
            }],
            temperature=0.7,
            max_tokens=1000
        )
        answer = response.choices[0].message.content
        return jsonify({"answer": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
