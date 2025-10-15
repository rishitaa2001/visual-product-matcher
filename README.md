# Visual Product Matcher

A web application for visually matching products using MobileNetV2 embeddings and cosine similarity.

# Features

- Upload an image and find visually similar products from a dataset
- Uses pretrained MobileNetV2 for feature extraction
- Precomputed dataset features for fast similarity search
- Flask backend with REST API
- Responsive frontend with image preview and matching results and filtering

# Project Structure

- `app.py`: Flask backend API and server logic
- `extract_features.py`: Script for extracting and saving dataset features
- `Dockerfile`: Container setup for deployment
- `requirements.txt`: Python dependencies
- `static/`: Frontend assets including JavaScript, CSS, images, and dataset
- `templates/`: HTML templates

# Installation and Running Locally

1. Clone the repo and move into directory:
git clone https://github.com/yourusername/visual-product-matcher.git
cd visual-product-mat

2. Install Python dependencies:
pip install -r requirements.txt

3. Start the Flask server:
python app.py

4. Open `http://localhost:8080` in your browser to use the app.

# Docker Usage

Build and run the container locally:
docker build -t visual-product-matcher .
docker run -p 8080:8080 visual-product-matcher

Deploy on Google Cloud Run or similar serverless container platforms.




