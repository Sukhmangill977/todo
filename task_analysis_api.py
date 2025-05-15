from flask import Flask, request, jsonify
from flask_cors import CORS
from transformers import pipeline

app = Flask(__name__)
CORS(app)  # 🔥 This allows cross-origin requests from React (localhost:3000)

# Better model for step suggestions
generator = pipeline("text2text-generation", model="MBZUAI/LaMini-Flan-T5-783M")

@app.route("/suggest-steps", methods=["POST"])
def suggest_steps():
    data = request.json
    task = data.get("task", "")

    if not task.strip():
        return jsonify({"error": "No task provided"}), 400

    prompt = f"""
Break the following task into a numbered list of clear, concise steps.

Respond only in this format:
Step 1: ...
Step 2: ...
Step 3: ...
Do not include any introduction or conclusion.

Task: {task}
"""

    response = generator(prompt, max_length=300, do_sample=True)[0]['generated_text']
    return jsonify({"task": task, "steps": response.strip()})

if __name__ == "__main__":
    app.run(port=5002)
