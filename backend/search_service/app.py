from flask import Flask, request, jsonify
from sentence_transformers import SentenceTransformer
import logging
import time
import traceback
import re

app = Flask(__name__)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# -----------------------------------------------------------------------------
# Model Configuration: BAAI/bge-small-en-v1.5
# -----------------------------------------------------------------------------
#
# WHY THIS MODEL:
#   - Stronger retrieval quality than all-MiniLM-L6-v2
#   - Same 384-dimensional output, so it stays schema-compatible
#   - Lightweight enough for CPU-first development on an i5 vPro + 16 GB RAM
#   - Fits the app's needs for semantic search, product similarity,
#     and component-aware discovery without adding external APIs
#
# MODEL ROLE:
#   This service is a retrieval support layer, not a text generator.
#   It turns product information and user queries into dense vectors that the
#   backend can compare and rank against real database records.
#
# BGE QUERY PREFIX:
#   BGE v1.5 can perform slightly better on short-query -> long-document
#   retrieval when queries are prefixed. To keep `/embed` backward-compatible,
#   we accept an optional `mode` field:
#     - document (default)
#     - query
# -----------------------------------------------------------------------------

MODEL_NAME = "BAAI/bge-small-en-v1.5"
DOCUMENT_MODE = "document"
QUERY_MODE = "query"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "

model_ready = False

logger.info("Initializing SentenceTransformer model: %s...", MODEL_NAME)
load_start = time.time()
model = SentenceTransformer(MODEL_NAME)
load_time = time.time() - load_start
model_ready = True
logger.info("Model loaded successfully in %.2fs.", load_time)


@app.route("/health", methods=["GET"])
def health():
    if not model_ready:
        return jsonify({
            "status": "loading", 
            "service": "search_service",
            "message": "Model 'BAAI/bge-small-en-v1.5' is still loading/downloading. This may take 1-5 minutes on the first run."
        }), 202

    return jsonify(
        {
            "status": "ok",
            "service": "search_service",
            "model": MODEL_NAME,
        }
    )


def extract_technical_ids(text):
    """
    Heuristic to extract potential technical model numbers or part IDs.
    Focuses on alphanumeric patterns common in hardware (e.g., P360, i9-12900K, RTX-3080).
    """
    if not text:
        return []
    
    # Patterns for: CPU models, GPU models, part numbers, and general tech IDs
    patterns = [
        r'\b[A-Za-z]\d{3,4}[A-Za-z]?\b',           # P360, M90t, S22
        r'\bi[3579]-\d{4,5}[A-Za-z]{0,2}\b',       # i9-12900K, i7-11800H
        r'\br[3579]-\d{4,5}[A-Za-z]{0,2}\b',       # r7-5800X
        r'\b(?:RTX|GTX|RX|XT|ARC|A)\s?\d{3,4}(?:\s?Ti|\s?XT)?\b', # RTX 3080, RX 6800XT
        r'\b[A-Z0-9]{2,5}-[A-Z0-9]{4,10}\b',       # SM-G998B, GA-B450
        r'\b(?:IPHONE|GALAXY|PIXEL|SURFACE)\s?\d{1,2}(?:\s?PRO|\s?ULTRA|\s?PLUS|\s?MAX)?\b', # iPhone 15, Galaxy S22
    ]
    
    detected = set()
    for p in patterns:
        matches = re.findall(p, text, re.IGNORECASE)
        for m in matches:
            # Clean and normalize
            clean = m.strip().upper().replace(' ', '-')
            if len(clean) > 1:
                detected.add(clean)
    
    return list(detected)


@app.route("/rank", methods=["POST"])
def rank():
    """
    Ranks a list of candidate products against a query.
    Categorizes them into: exact, similar, related.
    """
    try:
        data = request.get_json()
        if not data or "query" not in data or "candidates" not in data:
            return jsonify({"error": "Missing 'query' or 'candidates' in request body"}), 400

        query_text = str(data["query"])
        candidates = data["candidates"] # List of {id: x, embedding: [...], text: y, modelNumber: z, manufacturer: sm}
        
        if not candidates:
            return jsonify({"exact": [], "similar": [], "related": []})

        # 1. Get Query Embedding and detected IDs
        detected_models = extract_technical_ids(query_text)
        
        start = time.time()
        query_embedding = model.encode(
            f"{QUERY_INSTRUCTION}{query_text}", 
            normalize_embeddings=True,
            convert_to_tensor=True
        )

        candidate_embeddings = []
        for c in candidates:
            # Handle cases where embedding might be missing or in wrong format
            emb = c.get("embedding")
            if isinstance(emb, list) and len(emb) == 384:
                candidate_embeddings.append(emb)
            else:
                # Fallback: encode the candidate text on the fly if missing (rare)
                candidate_embeddings.append(model.encode(str(c.get("text", "")), normalize_embeddings=True))

        import torch
        from sentence_transformers import util
        
        cand_tensor = torch.tensor(candidate_embeddings)
        # Compute all similarities at once
        cos_scores = util.cos_sim(query_embedding, cand_tensor)[0]
        elapsed = time.time() - start

        exact = []
        similar = []
        related = []

        for i, score in enumerate(cos_scores):
            score_val = float(score)
            candidate = candidates[i]
            
            # Hybrid Logic: Technical ID match OR Very High Similarity
            is_exact_id = False
            if detected_models:
                c_name = str(candidate.get("text", "")).upper()
                c_model = str(candidate.get("modelNumber", "")).upper()
                is_exact_id = any(m in c_name or m in c_model for m in detected_models)

            # Thresholds
            if is_exact_id or score_val >= 0.86:
                exact.append({"id": candidate["id"], "score": score_val, "reason": "Exact technical match" if is_exact_id else "High precision AI match"})
            elif score_val >= 0.60:
                similar.append({"id": candidate["id"], "score": score_val, "reason": "Similar product"})
            elif score_val >= 0.35:
                related.append({"id": candidate["id"], "score": score_val, "reason": "Discovery option"})

        # Sort by score within each category
        exact.sort(key=lambda x: x["score"], reverse=True)
        similar.sort(key=lambda x: x["score"], reverse=True)
        related.sort(key=lambda x: x["score"], reverse=True)

        logger.info("Ranked %d candidates in %.3fs. Exact: %d, Similar: %d, Related: %d", 
                    len(candidates), elapsed, len(exact), len(similar), len(related))

        return jsonify({
            "exact": exact,
            "similar": similar,
            "related": related,
            "metadata": {
                "detected_models": detected_models,
                "latency_sec": elapsed
            }
        })

    except Exception as exc:
        logger.error("Ranking error: %s\n%s", exc, traceback.format_exc())
        return jsonify({"error": str(exc)}), 500


@app.route("/embed", methods=["POST"])
def embed():
    try:
        data = request.get_json()
        if not data or "text" not in data:
            return jsonify({"error": "Missing 'text' in request body"}), 400

        text = str(data["text"]) if data["text"] is not None else ""
        mode = str(data.get("mode") or DOCUMENT_MODE).lower().strip()
        if mode not in (DOCUMENT_MODE, QUERY_MODE):
            return jsonify({"error": "Invalid mode. Use 'document' or 'query'."}), 400

        # Extract technical metadata to "add the exact model" to the AI output
        detected_models = extract_technical_ids(text)

        encode_text = text
        if mode == QUERY_MODE and text:
            encode_text = f"{QUERY_INSTRUCTION}{text}"

        logger.info("Encoding text of length: %s (mode=%s, models=%s)", len(text), mode, detected_models)
        start = time.time()
        embedding = model.encode(
            encode_text,
            normalize_embeddings=True,
        ).tolist()
        elapsed = time.time() - start

        logger.info("Encoded in %.3fs -> %s-dim vector", elapsed, len(embedding))

        return jsonify(
            {
                "text": text,
                "embedding": embedding,
                "dimension": len(embedding),
                "mode": mode,
                "model": MODEL_NAME,
                "metadata": {
                    "detected_models": detected_models
                }
            }
        )
    except Exception as exc:
        logger.error("Embedding error: %s\n%s", exc, traceback.format_exc())
        return jsonify({"error": str(exc), "traceback": traceback.format_exc()}), 500


if __name__ == "__main__":
    try:
        logger.info("Running startup test encode...")
        start = time.time()
        test_enc = model.encode("startup test", normalize_embeddings=True)
        elapsed = time.time() - start
        if test_enc is not None:
            logger.info(
                "Startup test successful: %s-dim vector in %.3fs",
                len(test_enc),
                elapsed,
            )
    except Exception as exc:
        logger.error("Startup test failed! Model may not be functional: %s", exc)

    app.run(host="0.0.0.0", port=5001)
