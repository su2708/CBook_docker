from langchain_community.vectorstores import FAISS
from langchain_openai import OpenAIEmbeddings
from langchain.schema import Document
from typing import List, Dict, Tuple
from rank_bm25 import BM25Okapi
from dotenv import load_dotenv
from bs4 import BeautifulSoup
from pathlib import Path
import pickle
import json
import os

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_EMBEDDING_MODEL = "text-embedding-3-small"
JSON_DIR = os.path.abspath("./AIBookAgent/books")
VECTOR_STORE_PATH = os.path.abspath("./AIBookAgent/books_vectorstore")
METADATA_PATH = os.path.abspath("./AIBookAgent/books_vectorstore/index.pkl")

class AIBooksRAG:
    """
    JSON 데이터를 활용한 Hybrid RAG 시스템
    - LangChain의 FAISS 벡터스토어를 이용한 의미론적 검색
    - BM25를 이용한 키워드 기반 검색
    - 하이브리드 검색 기능 제공
    """

    def __init__(self):
        self.vector_store = None
        self.metadata = []
        self.bm25 = None
        self.embeddings = OpenAIEmbeddings(model=OPENAI_EMBEDDING_MODEL, openai_api_key=OPENAI_API_KEY)
        self.json_dir = JSON_DIR
        self.vector_store_path = VECTOR_STORE_PATH
        self.metadata_path = METADATA_PATH

    # 1. 임베딩 생성 함수
    def get_embedding(self, text: str) -> List[float]:
        """텍스트를 OpenAI 임베딩 모델로 임베딩"""
        return self.embeddings.embed_query(text)

    # 2. 목차 파싱 함수
    def parse_toc(self, toc_html: str) -> List[Dict[str, List[str]]]:
        """HTML 형태의 목차 데이터를 파싱하여 계층적 구조로 반환"""
        soup = BeautifulSoup(toc_html, "html.parser")
        chapters = [b.get_text() for b in soup.find_all("b")]
        items = [
            br.next_sibling.strip()
            for br in soup.find_all("br")
            if br.next_sibling and isinstance(br.next_sibling, str)
        ]

        structured_toc = []
        current_chapter = None

        for item in items:
            if item in chapters:
                current_chapter = item
                structured_toc.append({"chapter": current_chapter, "items": []})
            elif current_chapter:
                structured_toc[-1]["items"].append(item)

        return structured_toc

    # 3. 데이터 임베딩 및 문서 생성 함수
    def create_documents(self, book_data: List) -> List[Document]:
        """책 데이터를 LangChain Document로 변환"""
        documents = []
        
        for book in book_data:
            # 책 기본 정보
            documents.append(Document(
                page_content=book["title"],
                metadata={
                    "type": "title",
                    "title": book["title"],
                    "author": book["author"],
                    "pubDate": book["pubDate"],
                    "categoryName": book["categoryName"],
                    "toc": book.get("toc", "목차 정보 없음")
                }
            ))
            documents.append(Document(
                page_content=book["description"],
                metadata={
                    "type": "description",
                    "title": book["title"],
                    "author": book["author"],
                    "pubDate": book["pubDate"],
                    "categoryName": book["categoryName"],
                    "toc": book.get("toc", "목차 정보 없음")
                }
            ))

            # 목차 정보
            toc_html = book["toc"]
            structured_toc = self.parse_toc(toc_html)
            for chapter in structured_toc:
                for item in chapter["items"]:
                    item_with_context = f"{chapter['chapter']} - {item}"
                    documents.append(Document(
                        page_content=item_with_context,
                        metadata={
                            "type": "toc",
                            "title": book["title"],
                            "author": book["author"],
                            "pubDate": book["pubDate"],
                            "categoryName": book["categoryName"],
                            "item": item,
                            "toc": toc_html
                        }
                    ))
        return documents

    # 4. JSON 데이터 로드 함수
    def load_json_files(self, directory: str) -> List[Dict]:
        """지정된 디렉토리에서 모든 JSON 파일을 읽어 책 정보 리스트 반환"""
        data = []
        if os.path.exists(directory):
            print(f"{directory}는 존재합니다.")
        else:
            print(f"{directory}는 존재하지 않습니다.")
        for filename in os.listdir(directory):
            if filename.endswith(".json"):
                filepath = os.path.join(directory, filename)
                with open(filepath, "r", encoding="utf-8") as f:
                    data.append(json.load(f))
        return data

    # 5. FAISS 벡터스토어 생성
    def create_vector_store(self):
        """JSON 데이터를 읽고 FAISS 벡터스토어 생성 및 저장"""
        book_data_list = self.load_json_files(self.json_dir)
        documents = []
        for book_data in book_data_list:
            documents.extend(self.create_documents(book_data))

        # LangChain FAISS 벡터스토어 생성
        vector_store = FAISS.from_documents(documents, self.embeddings)
        vector_store.save_local(self.vector_store_path)
        self.vector_store = vector_store
        self.metadata = documents
        
        print(f"✅ {self.vector_store_path}에 벡터스토어가 생성되었습니다.")

    # 6. FAISS 벡터스토어 로드
    def load_vector_store(self):
        """FAISS 벡터스토어 및 메타데이터 로드"""
        try:
            # 경로를 Path 객체로 변환 
            vector_store_path = Path(self.vector_store_path)
            metadata_path = Path(self.metadata_path)
            
            # 벡터스토어 로드 
            self.vector_store = FAISS.load_local(
                self.vector_store_path,
                embeddings=self.embeddings,
                allow_dangerous_deserialization=True
            )
            print(f"✅ {self.vector_store_path}에서 벡터스토어를 로드했습니다.")
            
            # 메타데이터 로드 
            with open(self.metadata_path, 'rb') as f:
                self.metadata = pickle.load(f)
            print(f"✅ {self.metadata_path}에서 메타데이터를 로드했습니다.")
        except RuntimeError as e:
            # 벡터스토어 파일이 없어서 발생한 경우 
            if "No such file or directory" in str(e):
                print(f"⚠️ {vector_store_path}가 존재하지 않습니다. 벡터스토어를 생성합니다.")
                self.create_vector_store()  # 벡터스토어 재생성 
                self.load_vector_store()  # 재귀 호출로 로드 재시도
            else:
                # 다른 RuntimeError는 재전달 
                raise
        except FileNotFoundError as e:
            # 메타데이터 파일이 없어서 발생한 경우 
            print(f"⚠️ {metadata_path}가 존재하지 않습니다. 벡터스토어를 생성합니다.")
            self.create_vector_store()  # 벡터스토어 재생성 
            self.load_vector_store()  # 재귀 호출로 로드 재시도
        except Exception as e:
            raise Exception(f"❌ 로드 중 오류 발생: {str(e)}")

    # 7. BM25 초기화
    def initialize_bm25(self):
        """BM25 검색 엔진 초기화"""
        if not self.vector_store:
            raise ValueError("FAISS 벡터스토어가 초기화되지 않았습니다.")
        
        # 벡터스토어의 InMemoryDocstore에서 문서 가져오기
        documents = self.vector_store.docstore._dict.values()
        
        # BM25 코퍼스 생성
        tokenized_corpus = [
            doc.page_content.lower().split() for doc in documents
        ]
        
        self.bm25 = BM25Okapi(tokenized_corpus)
        print("✅ BM25 검색 엔진 초기화 완료.")

    # 8. Hybrid 검색
    def hybrid_search(self, query: str, k: int = 5, semantic_weight: float = 0.5) -> List[Tuple[Dict, float]]:
        """FAISS 및 BM25를 결합한 하이브리드 검색"""
        # FAISS 검색
        faiss_results = self.vector_store.similarity_search_with_score(query, k=k)

        # BM25 검색
        tokenized_query = query.lower().split()
        
        # InMemoryDocstore에서 문서 가져오기
        documents = list(self.vector_store.docstore._dict.values())
        
        bm25_scores = self.bm25.get_scores(tokenized_query)
        bm25_results = sorted(
            [(documents[i], bm25_scores[i]) for i in range(len(documents))],
            key=lambda x: x[1],
            reverse=True
        )[:k]

        # 하이브리드 결합
        combined_scores = {}
        doc_info = {}  # 문서 정보를 저장할 딕셔너리 
        for doc, score in faiss_results:
            key = doc.metadata.get('title', 'Unknown Title')
            
            # FAISS 점수 반영
            combined_scores[key] = semantic_weight * (1 - score)
            
            # 목차 추가 
            if key not in doc_info: 
                doc_info[key] = {
                    'title': doc.metadata.get('title', 'Unknown Title'),
                    'author': doc.metadata.get('author', 'Unknown Author'),
                    'categoryName': doc.metadata.get('categoryName', 'Unknown Category'),
                    'pubDate': doc.metadata.get('pubDate', 'Unknown Date'),
                    'toc': doc.metadata.get('toc', '목차 정보 없음'),
                }
        for doc, score in bm25_results:
            key = doc.metadata.get('title', 'Unknown Title')
            if doc.page_content in combined_scores:
                # BM25 점수 반영
                combined_scores[key] += (1 - semantic_weight) * score
            else:
                combined_scores[key] = (1 - semantic_weight) * score
                doc_info[key] = {
                    'title': doc.metadata.get('title', 'Unknown Title'),
                    'author': doc.metadata.get('author', 'Unknown Author'),
                    'categoryName': doc.metadata.get('categoryName', 'Unknown Category'),
                    'pubDate': doc.metadata.get('pubDate', 'Unknown Date'),
                    'toc': doc.metadata.get('toc', '목차 정보 없음'),
                }

        # 결과 정렬 및 반환 
        sorted_results = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
        return [(doc_info[key], score) for key, score in sorted_results[:k]]



# AIBooksRAG 클래스 초기화
# rag = AIBooksRAG()

# # 벡터스토어 생성
# # rag.create_vector_store()

# # 벡터스토어 로드
# rag.load_vector_store()

# # BM25 초기화
# rag.initialize_bm25()

# # 하이브리드 검색
# query = "과학탐구"
# results = rag.hybrid_search(query, k=5)
# print("\n=== Hybrid Search Results ===")

# for doc_type, score in results:
#     print(f"Type: {doc_type}, Score: {score:.4f}")
