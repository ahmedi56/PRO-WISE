from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import logging

app = Flask(__name__)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

model_ready = False
# Load model once at startup
logger.info("Initializing SentenceTransformer model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
model_ready = True
logger.info("Model loaded successfully.")

@app.route('/health', methods=['GET'])
def health():
    if not model_ready:
        return jsonify({"status": "loading", "service": "search_service"}), 503
    return jsonify({"status": "ok", "service": "search_service"})

import traceback

@app.route('/embed', methods=['POST'])
def embed():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({"error": "Missing 'text' in request body"}), 400
        
        # Explicit type conversion to string to prevent model encode failures
        text = str(data['text']) if data['text'] is not None else ""
        
        logger.info(f"Encoding text of length: {len(text)}")
        embedding = model.encode(text).tolist()
        
        return jsonify({
            "text": text,
            "embedding": embedding
        })
    except Exception as e:
        error_msg = f"Embedding error: {str(e)}\n{traceback.format_exc()}"
        logger.error(error_msg)
        return jsonify({
            "error": str(e),
            "traceback": traceback.format_exc()
        }), 500

if __name__ == '__main__':
    # Startup test to verify model functionality
    try:
        logger.info("Running startup test encode...")
        test_enc = model.encode("startup test")
        if test_enc is not None:
            logger.info("Startup test successful.")
    except Exception as e:
        logger.error(f"Startup test failed! Model may not be functional: {str(e)}")

    # Running on port 5001 to avoid conflict with standard Node.js/Flask ports
    app.run(host='0.0.0.0', port=5001)
