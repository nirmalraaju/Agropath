import os
import hashlib
import numpy as np
from typing import List, Optional, Union
from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2").strip()
OUTPUT_DIMENSIONALITY = int(os.getenv("EMBEDDING_DIMENSIONS", "768"))

class EmbeddingService:
    def __init__(self):
        self.model = EMBEDDING_MODEL
        self.dim = OUTPUT_DIMENSIONALITY
        self._client = None

    def _get_client(self):
        api_key = os.getenv("GEMINI_API_KEY", "").strip()
        if not api_key or api_key == "your_gemini_api_key_here":
            return None
        try:
            from google import genai
            return genai.Client(api_key=api_key)
        except Exception as e:
            print(f"[EmbeddingService] Failed to initialize google-genai Client: {e}")
            return None

    def embed_text(
        self,
        text: str,
        is_query: bool = False,
        task: str = "search result",
        title: Optional[str] = None
    ) -> List[float]:
        """
        Generates text embedding using gemini-embedding-2 following asymmetric prompt guidelines:
        - Query: 'task: {task} | query: {text}'
        - Document: 'title: {title} | text: {text}'
        """
        client = self._get_client()

        # Format prompt according to Gemini Embedding 2 task instructions
        if is_query:
            formatted_prompt = f"task: {task} | query: {text}"
        else:
            doc_title = title if title else "none"
            formatted_prompt = f"title: {doc_title} | text: {text}"

        if client is not None:
            try:
                from google.genai import types
                config = types.EmbedContentConfig(output_dimensionality=self.dim)
                result = client.models.embed_content(
                    model=self.model,
                    contents=formatted_prompt,
                    config=config
                )
                if result and result.embeddings:
                    values = result.embeddings[0].values
                    # Normalize if needed (gemini-embedding-2 auto-normalizes truncated dims)
                    return [float(v) for v in values]
            except Exception as e:
                print(f"[EmbeddingService] Live embedding API error: {e}")

        # Fallback deterministic pseudo-vector (normalized unit vector)
        return self._fallback_embedding(text)

    def embed_image(self, image_bytes: bytes, mime_type: str = "image/png") -> List[float]:
        """Generates multimodal visual vector embedding directly from image bytes using gemini-embedding-2."""
        client = self._get_client()

        if client is not None:
            try:
                from google.genai import types
                config = types.EmbedContentConfig(output_dimensionality=self.dim)
                result = client.models.embed_content(
                    model=self.model,
                    contents=[
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                    ],
                    config=config
                )
                if result and result.embeddings:
                    values = result.embeddings[0].values
                    return [float(v) for v in values]
            except Exception as e:
                print(f"[EmbeddingService] Live image embedding failed: {e}")

        # Fallback hash-based vector
        seed = int(hashlib.md5(image_bytes[:512]).hexdigest(), 16) % (2**32)
        return self._generate_pseudo_vector(seed)

    def embed_multimodal(self, text: str, image_bytes: bytes, mime_type: str = "image/png") -> List[float]:
        """
        Generates a single aggregated multimodal embedding combining text description and leaf image bytes.
        Note: The text portion of multimodal input does not include task type prefix.
        """
        client = self._get_client()

        if client is not None:
            try:
                from google.genai import types
                config = types.EmbedContentConfig(output_dimensionality=self.dim)
                result = client.models.embed_content(
                    model=self.model,
                    contents=[
                        text,
                        types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                    ],
                    config=config
                )
                if result and result.embeddings:
                    values = result.embeddings[0].values
                    return [float(v) for v in values]
            except Exception as e:
                print(f"[EmbeddingService] Aggregated multimodal embedding failed: {e}")

        return self._fallback_embedding(text)

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Calculates cosine similarity between two embedding vectors."""
        a = np.array(vec_a, dtype=np.float32)
        b = np.array(vec_b, dtype=np.float32)
        dot_product = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))

    def _generate_pseudo_vector(self, seed: int) -> List[float]:
        rng = np.random.default_rng(seed)
        v = rng.standard_normal(self.dim)
        v = v / np.linalg.norm(v)
        return [float(x) for x in v]

    def _fallback_embedding(self, text: str) -> List[float]:
        seed = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
        return self._generate_pseudo_vector(seed)

# Singleton instance
embedding_service = EmbeddingService()

