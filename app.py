import os
import pickle
import numpy as np
import logging
import uuid
from datetime import datetime
from flask import Flask, request, jsonify, render_template, send_from_directory
from tensorflow.keras.preprocessing import image
from sklearn.metrics.pairwise import cosine_similarity
from werkzeug.utils import secure_filename
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Model

base = MobileNetV2(weights="imagenet", include_top=False, pooling="avg")
model = Model(inputs=base.input, outputs=base.output)

# ---------------------------
# Flask setup
# ---------------------------
app = Flask(__name__, static_folder="static", template_folder="templates")

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ---------------------------
# Load precomputed dataset features
# ---------------------------
DATA_DIR = app.root_path  

feature_list = np.load(os.path.join(DATA_DIR, "features.npy"))
with open(os.path.join(DATA_DIR, "paths.pkl"), "rb") as f:
    image_paths = pickle.load(f)
with open(os.path.join(DATA_DIR, "categories.pkl"), "rb") as f:
    categories = pickle.load(f)

# ---------------------------
# Feature extraction function
# ---------------------------
def extract_features(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    x = image.img_to_array(img)
    x = np.expand_dims(x, axis=0)
    x = preprocess_input(x)
    feats = model.predict(x, verbose=0)
    return feats.flatten()

# ---------------------------
# Routes
# ---------------------------
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/match", methods=["POST"])
def match():
  try:
    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No image received"}), 400

    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    unique_id = str(uuid.uuid4())[:8]
    original_name = secure_filename(file.filename)
    name_without_ext = os.path.splitext(original_name)[0]
    ext = os.path.splitext(original_name)[1]
    unique_filename = f"{name_without_ext}_{timestamp}_{unique_id}{ext}"
   
    category_filter = request.form.get("category", "").lower()
    try:
        score_threshold = float(request.form.get("score", 0.4))
    except ValueError:
        score_threshold = 0.4

    upload_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(upload_path)

    query_feats = extract_features(upload_path)
    sims = cosine_similarity([query_feats], feature_list)[0]

    results = []
    for idx, sim in enumerate(sims):
        if sim >= score_threshold:
            cat = categories[idx]
            rel_path= image_paths[idx].replace(os.sep,"/")
            dataset_url=f"/static/{rel_path}"
            if not category_filter or cat.lower() == category_filter:
                results.append({
                    "filename": os.path.splitext(os.path.basename(image_paths[idx]))[0],
                    "category": cat,
                    "similarity": float(sim),
                    "path": dataset_url
                })

    results = sorted(results, key=lambda x: x["similarity"], reverse=True)[:30]

    return jsonify({"query": f"/uploads/{unique_filename}", "results": results})
  except Exception as e:
    logging.exception("Error during match:")
    return jsonify({"error":f"Internal error:{str(e)}"}),500
@app.route("/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
