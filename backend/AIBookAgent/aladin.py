from dotenv import load_dotenv
import requests
import json
import os

load_dotenv()

ALADIN_API_KEY = os.getenv("ALADIN_API_KEY")

def get_isbn13(query, k):
    """
    검색어를 입력하면 isbn13을 얻어오는 함수 
    알라딘 OpenAPI 메뉴얼의 상품 검색 API 사용 

    1. Request
    - ttbkey: 알라딘 API 인증 키 (필수)
    - Query: 검색어 (필수)
    - QueryType: 검색어 종류
    - SearchTarget: 검색 대상 
    - start: 검색 결과 시작 페이지 
    - MaxResults: 검색 결과 한 페이지 당 최대 출력 개수 
    - CategoryId: 특정 분야로 검색 결과 제한 
    - output: 출력 방법 

    2. Response
    - item: 상품 정보 
    """
    # 검색된 도서를 담을 리스트 생성 
    isbns = []

    # API URL
    get_isbn_url = "http://www.aladin.co.kr/ttb/api/ItemSearch.aspx"

    # Request 정의
    isbn_params = {
        "ttbkey": ALADIN_API_KEY,
        "Query": query,
        "QueryType": "Keyword",  # 제목&저자 검색
        "SearchTarget": "Book",
        "start": 1,
        "MaxResult": k,
        "output": "js",  # JSON 형식 
    }

    # GET 요청 
    isbn_response = requests.get(url=get_isbn_url, params=isbn_params)

    # 응답 확인 
    if isbn_response.status_code == 200:
        # json으로 변환 
        json_data = json.loads(rf"{isbn_response.text[:-1]}".replace('\\', '\\\\'))  # 마지막에 ;를 빼기 위함 
        
        # 도서 정보 추출 
        json_data_items = json_data["item"]
        if len(json_data_items) == 0:
            pass
        else:
            for item in json_data_items:
                isbns.append(item)
    else:
        raise Exception(f"isbn 요청 실패: {isbn_response.status_code}")

    return isbns

def get_books(isbns):
    """
    검색된 isbn13으로 책의 제목과 목차를 얻어오는 함수 
    알라딘 OpenAPI 메뉴얼의 상품 검색 API 사용 

    1. Request
    - ttbkey: 알라딘 API 인증 키 (필수)
    - ItemId: 상품을 구분짓는 유일한 값 (필수)
    - ItemIdType: ItemId가 ISBN으로 입력됐는지, 알라딘 고유의 ItemId인지 선택 
    - Output: 출력 방법 
    - OptResult: [Toc, categoryIdList] (목차, 전체 분야)

    2. Response
    - item: 상품 정보 
    """
    # API URL
    get_toc_url = "http://www.aladin.co.kr/ttb/api/ItemLookUp.aspx"

    # 검색된 도서의 목차들을 담을 리스트 생성  
    tocs = []

    for isbn in isbns:
        # Request 정의
        toc_params = {
            "ttbkey": ALADIN_API_KEY,
            "ItemId": isbn["isbn13"],
            "ItemIdType": "ISBN13",
            "Output": "js",  # JSON 형식 
            "OptResult": ["Toc", "categoryIdList"]
        }

        # GET 요청 
        toc_response = requests.get(url=get_toc_url, params=toc_params)

        # 응답 확인 
        if toc_response.status_code == 200:
            try:
                # json으로 변환
                json_data = json.loads(rf"{toc_response.text[:-1]}".replace('\\', '\\\\'))["item"][0]
                
                # 목차 추출 
                json_data_item = {
                    'title': json_data['title'],
                    'author': json_data['author'],
                    'pubDate': json_data['pubDate'],
                    'description': json_data['description'],
                    'categoryName': json_data['categoryName'],
                    'toc': json_data['bookinfo']['toc'],
                }
                tocs.append(json_data_item)
            except Exception:
                continue

        else:
            raise Exception(f"목차 요청 실패: {toc_response.status_code}")

    return tocs

def search_aladin(query, k):
    isbns = get_isbn13(query, k)
    books = get_books(isbns)
    return books