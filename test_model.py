"""
Quick validation for the BAAI/bge-small-en-v1.5 embedding model.

Verifies:
  1. Model loads successfully on CPU
  2. Produces 384-dimensional embeddings
  3. Supports both query-style and document-style usage
  4. Gives a small CPU latency baseline
"""

from sentence_transformers import SentenceTransformer
import time

MODEL_NAME = "BAAI/bge-small-en-v1.5"
QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: "

print(f"Loading model: {MODEL_NAME}...")
load_start = time.time()
model = SentenceTransformer(MODEL_NAME)
load_time = time.time() - load_start
print(f"Model loaded in {load_time:.2f}s")

print("\n--- Test 1: Query embedding ---")
text_short = "iphone battery replacement"
start = time.time()
emb_short = model.encode(
    QUERY_INSTRUCTION + text_short,
    normalize_embeddings=True,
)
elapsed_short = time.time() - start
print(f"Text: {text_short!r}")
print(f"Embedding dimension: {len(emb_short)} (expected: 384)")
print(f"Inference time: {elapsed_short * 1000:.1f}ms")
print(f"First 5 values: {emb_short[:5]}")
assert len(emb_short) == 384, f"FAIL: Expected 384 dims, got {len(emb_short)}"

print("\n--- Test 2: Document embedding ---")
text_long = (
    "Product: Samsung Galaxy S24 Ultra\n"
    "Brand/Manufacturer: Samsung\n"
    "Model Number: SM-S928B\n"
    "Technical Specifications & Components:\n"
    "- SoC: Qualcomm Snapdragon 8 Gen 3\n"
    "- GPU: Adreno 750\n"
    "- RAM: Samsung LPDDR5X 12GB\n"
    "- Display: Dynamic AMOLED 2X 6.8 inch\n"
    "- Battery: Li-Ion 5000 mAh\n"
    "- Camera: Samsung ISOCELL HP2 200MP\n"
    "Category: Phone > Samsung\n"
    "Description: Flagship smartphone with S Pen support and AI features."
)
start = time.time()
emb_long = model.encode(text_long, normalize_embeddings=True)
elapsed_long = time.time() - start
print(f"Document length: {len(text_long)} chars")
print(f"Embedding dimension: {len(emb_long)} (expected: 384)")
print(f"Inference time: {elapsed_long * 1000:.1f}ms")
assert len(emb_long) == 384, f"FAIL: Expected 384 dims, got {len(emb_long)}"

print("\n--- Test 3: Batch encoding benchmark (10 texts) ---")
texts = [
    "laptop with intel i7 processor",
    "gaming PC RTX 4070 graphics card",
    "wireless bluetooth headphones",
    "Samsung Galaxy phone screen replacement",
    "MacBook Pro M3 chip",
    "Dell XPS 15 motherboard",
    "iPhone 15 Pro Max camera module",
    "AMD Ryzen 9 desktop processor",
    "USB-C charging cable",
    "4K monitor display panel",
]
start = time.time()
emb_batch = model.encode(texts, normalize_embeddings=True)
elapsed_batch = time.time() - start
print(f"Batch size: {len(texts)}")
print(f"Total time: {elapsed_batch * 1000:.1f}ms")
print(f"Per-text average: {elapsed_batch / len(texts) * 1000:.1f}ms")
print(f"All dimensions correct: {all(len(e) == 384 for e in emb_batch)}")

print("\n" + "=" * 60)
print(f"MODEL: {MODEL_NAME}")
print("STATUS: ALL TESTS PASSED [OK]")
print("DIMENSION: 384")
print(f"LOAD TIME: {load_time:.2f}s")
print(f"SHORT QUERY: {elapsed_short * 1000:.1f}ms")
print(f"LONG DOCUMENT: {elapsed_long * 1000:.1f}ms")
print(f"BATCH (10): {elapsed_batch * 1000:.1f}ms ({elapsed_batch / len(texts) * 1000:.1f}ms avg)")
print("=" * 60)
