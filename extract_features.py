# extract_features.py
import os
import pickle
import numpy as np
from tensorflow.keras.preprocessing import image
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Model

# Paths
PROJECT_ROOT = os.getcwd()
DATASET_DIR  = os.path.join(PROJECT_ROOT, "static", "dataset")
OUTPUT_DIR   = PROJECT_ROOT

# Load model once
base_model = MobileNetV2(weights="imagenet", include_top=False, pooling="avg")
model = Model(inputs=base_model.input, outputs=base_model.output)

def extract_features(img_path):
    img = image.load_img(img_path, target_size=(224, 224))
    x   = image.img_to_array(img)
    x   = np.expand_dims(x, axis=0)
    x   = preprocess_input(x)
    feats = model.predict(x, verbose=0)
    return feats.flatten()

feature_list, image_paths, categories = [], [], []

for category in os.listdir(DATASET_DIR):
    cat_path = os.path.join(DATASET_DIR, category)
    if not os.path.isdir(cat_path):
        continue
    for fname in os.listdir(cat_path):
        img_path = os.path.join(cat_path, fname)
        try:
            feat = extract_features(img_path)
            feature_list.append(feat)
            relative_path = os.path.relpath(img_path, start=os.path.join(PROJECT_ROOT, "static"))
            image_paths.append(relative_path)            
            categories.append(category)
        except Exception as e:
            print(f"❌ Skipped {img_path}: {e}")

# Convert and save
features = np.vstack(feature_list)
np.save(os.path.join(OUTPUT_DIR, "features.npy"), features)

with open(os.path.join(OUTPUT_DIR, "paths.pkl"), "wb") as f:
    pickle.dump(image_paths, f)

with open(os.path.join(OUTPUT_DIR, "categories.pkl"), "wb") as f:
    pickle.dump(categories, f)

print(f"✅ Saved {features.shape[0]} feature vectors to disk.")
