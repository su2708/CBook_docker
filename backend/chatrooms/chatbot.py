from langchain_core.output_parsers import PydanticOutputParser
from langchain_core.runnables import RunnablePassthrough
from langchain_core.messages import SystemMessage
from langchain.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool
from langchain.tools import Tool

from AIBookAgent.aladin import search_aladin
from AIBookAgent.hybridRAG import AIBooksRAG

from typing import Union, List, Dict
from pydantic import BaseModel
from dotenv import load_dotenv

import json
import os
from datetime import datetime as dt

# 환경 변수 로드
load_dotenv()

# 환경 변수에서 OpenAI API 키를 불러오기
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# 알라딘 Key 값 불러오기
ALADIN_API_KEY = os.getenv("ALADIN_API_KEY")

LLM = ChatOpenAI(
    model="gpt-4o",
    temperature=0.1,
    api_key=OPENAI_API_KEY,
)


# 검색 결과 자료형 설정
class SearchResult(BaseModel):
    """
    사용자 질문: str
    액션: str
    검색 키워드: str
    저자: str
    과거 채팅 기록: str | List | Dict
    """
    user_query: str
    action: str
    search_keywords: str
    author: str
    content: Union[str, List, Dict]

# 검색 Agent 설정
class AIAgent:
    def __init__(self, llm):
        self.llm = llm

    def analyze_query(self, user_query, chat_history):
        """
        LLM을 사용하여 유저 쿼리를 분석하고 그 결과를 반환.
        """
        self.output_parser = PydanticOutputParser(pydantic_object=SearchResult)
        
        self.template = [SystemMessage(content=
            """
            당신은 유용한 AI 챗봇입니다.
            당신은 질문이 도서 검색 관련 질문인지 판단하는 것이 최우선입니다.
            다음으로 질문이 시험 계획 생성에 대한 것인지 판단하세요.
            가장 마지막으로 질문이이 위 두 가지 항목에 해당되지 않는다면 일반 대화라고 판단하세요.
            
            주어진 대화 내역과 사용자의 마지막 질문을 기반으로, 질문이 다음 세 가지 카테고리 중 어디에 속하는지 판단하세요:
            
            1. **도서 검색 관련 질문**:
            - 질문에 도서 제목, 저자, 출판사, 출판 연도, 장르 등의 키워드가 포함되어 있는 경우
            - 질문의 의도가 도서 정보를 요구하거나 책 추천을 요청하는 경우
            - 질문의 의도가 키워드에 대해 책 검색을 요청하는 경우 
            - 도서 선택, 세부 정보, 리뷰, 활용과 관련된 일반적인 주제인 경우 

            2. **시험 계획 생성 관련 질문**:
            - 사용자가 특정 시험(예: 수능, 자격증 시험)과 관련된 학습 계획, 스케줄링, 목차 활용 방안, 공부 전략 등에 대해 질문하거나 논의한 경우.
            - 질문 내용에 "시험", "학습 계획", "목차 활용", "스케줄", "공부 방법"과 같은 키워드가 포함되어 있거나 학습과 관련된 계획 생성에 대한 요청이 있는 경우.

            3. **일반 대화 질문**:
            - 위 두 가지 카테고리에 속하지 않는 질문.
            - 기술적인 세부사항 없이 단순한 의견 교환, 비관련 질문, 또는 일반적인 주제(예: 일상, 잡담, 다른 기술 도구 관련 논의 등)에 대한 질문.
            
            1번 도서 검색 관련 질문인 경우 다음 작업을 수행하세요.
            - action을 "search_books"로 설정 
            - content는 빈 문자열로 설정 
            - author를 저자 추출 규칙에 따라 설정 
                저자 추출 규칙:
                - 도서의 저자에 대한 질문은 저자 이름만 골라내어 "author"로 저장해주세요.
            - 키워드 추출: 최적화 검색어 생성
                키워드 추출 규칙:
                1) 핵심 주제어 분리
                - 도서 관련 핵심 개념 추출
                - 보조어 및 조사 제거

                2) 의미론적 최적화
                - 전문 용어 완전성 유지
                - 개념 간 관계성 보존
                - 맥락 적합성 확보
            
            2번 시험 계획 생성 관련 질문인 경우 다음 작업을 수행하세요.
            - action을 "make_plans"로 설정
            - content, author는 빈 문자열로 설정 
            - 키워드 추출: 최적화 검색어 생성
                키워드 추출 규칙:
                1) 핵심 주제어 분리
                - 도서 관련 핵심 개념 추출
                - 보조어 및 조사 제거

                2) 의미론적 최적화
                - 전문 용어 완전성 유지
                - 개념 간 관계성 보존
                - 맥락 적합성 확보
            
            3번 일반 대화 질문인 경우 다음 작업을 수행하세요.
            - action을 "basic_chat"으로 설정
            - search_keyword, author, content는 빈 문자열로 설정

            3가지 답변 모두 절대로 마크다운 문법을 사용하지 않고 반드시 아래의 json 형식을 갖는 문자열로 작성하세요.
            {
                "action": "<action 값>",
                "search_keywords": "<검색 키워드>",
                "author": "<저자>",
                "content": "<content>"
            }   
            """
        )] + chat_history + [("human", "{question}" )]
        
        self.prompt = ChatPromptTemplate(
            messages=self.template,
            partial_variables={"format_instructions": self.output_parser.get_format_instructions()}
        )
        
        self.chain = {"question": RunnablePassthrough()} | self.prompt | LLM
        
        try:
            response = self.chain.invoke({"question": user_query }).content 

            return response
        except Exception as e:
            raise ValueError(f"Parsing Error: {e}")


# tool setting: 도서 검색
@tool
def search_books(query: str, k: int = 5):
    """
    책을 검색하는 함수 
    먼저 AIBookRAG의 hybrid 검색을 이용
    만약 hybrid 검색 결과가 없거나 신뢰도가 낮다면 그냥 알라딘에서 검색 
    """
    book_rag = AIBooksRAG()
    
    # 벡터스토어 로드
    book_rag.load_vector_store()

    # BM25 초기화
    book_rag.initialize_bm25()

    # 하이브리드 검색
    results = book_rag.hybrid_search(query, k=5)
    
    # 하이브리드 검색 결과의 점수가 낮은 경우 알라딘에서 직접 책 검색 
    if results[0][1] >= 0.5:
        print(f"\n✨ 검색 완료! {len(results)}개의 결과를 찾았습니다.\n")
        books = []
        for result in results:
            books.append(result[0])
        return books
    else:
        books = search_aladin(query, k)
        print(f"\n✨ 검색 완료! {len(books)}개의 결과를 찾았습니다.\n")
        
        return books

# tools 설정
tools = [
    Tool(
        name="Search Books",
        func=search_books,
        description="질문에 맞는 책을 검색합니다."
    )
]

def make_plans(query: str, chat_history):
    """
    과거 대화 내역을 바탕으로 시험 계획을 생성하는 함수 
    """
    output_parser = PydanticOutputParser(pydantic_object=SearchResult)
    
    template = [(
        "system",
        f"오늘 날짜는 {dt.today()} 입니다.\n" +
        """
        당신은 시험 계획을 세워주는 AI 챗봇입니다.
        과거의 대화 내역에서 사용자의 마지막 질문과 관련된 책의 정보가 있다면 그 책의 목차를 활용해 학습 계획을 만들어주세요.

        1. 과거의 대화 내역에 책에 대한 정보가 없다면, 일반적인 지식을 바탕으로 학습 계획을 작성하세요.
        2. 구체적인 책 제목과 시험 날짜가 주어지지 않았다면 빈 문자열로 두고, 시험 기간은 4주로 설정하세요.
        3. 목차가 HTML 형식으로 제공되면 텍스트로 변환하여 사용하세요.
        4. 모든 학습 계획은 반드시 복습 절차를 포함하며, 전체 계획을 기본 5개 단위로 분배하세요. 상황에 따라 분배 개수를 조정할 수 있습니다.
        5. 작성 예시를 보고 반드시 아래의 json 형식에 맞게 계획을 작성하세요. (단, ```json ``` 처럼 json임을 표시하는 마크다운은 작성하지 마세요.)
        6. 출력된 JSON이 유효한 형식인지 확인하세요. 유효하지 않을 경우 적절히 포맷팅을 수정하세요.

        - 형식
            시험 계획:
            {{
                "book_title": "<책의 제목>",
                "book_toc": "<책의 목차>",
                "today": "<오늘 날짜>",
                "test_day": "<시험 날짜>",
                "period": "<시험 기간>",
                "total_plan": "<전체 시험 계획>",
                "weekly_plan": "<이번주 시험 계획>",
                "daily_plan": "<오늘 시험 계획>",
                "completed_tasks": "<완료된 항목>",
            }}
        - 작성 예시
            시험 계획1:
            {{
                "book_title": "개념원리 RPM 미적분 1 (2026년)",
                "book_toc": 
                    '''
                    <p>
                    Ⅰ. 함수의 극한과 연속<br>
                    1. 함수의 극한<br>
                    2. 함수의 연속<br>
                    <br>
                    Ⅱ. 미분<br>
                    1. 미분계수와 도함수<br>
                    2. 도함수의 활용<br>
                    <br>
                    Ⅲ. 적분<br>
                    1. 부정적분<br>
                    2. 정적분<br>
                    3. 정적분의 활용
                    </p>
                    ''',
                "today": "20250116",
                "test_day": "20250216",
                "period": "4주",
                "total_plan": 
                    {{
                        "1주차": ["Ⅰ. 함수의 극한과 연속", "Ⅰ. 복습"],
                        "2주차": ["Ⅱ. 미분", "Ⅱ. 복습"],
                        "3주차": ["Ⅲ. 적분", "Ⅲ. 복습"],
                        "4주차": ["Ⅰ. 복습", "Ⅱ. 복습", "Ⅲ. 복습"]
                    }}
                "weekly_plan": [
                        "Ⅰ.1. 함수의 극한",
                        "Ⅰ.2. 함수의 연속",
                        "Ⅰ.3. 복습"
                    ],
                "daily_plan": [
                        "Ⅰ.1.1. 극한의 개념",
                        "Ⅰ.1.2. 수렴과 발산",
                        "Ⅰ.1.3. 극한과 극한값",
                        "Ⅰ.2.1. 연속의 개념",
                        "<오늘 날짜> 복습"
                    ],
                "completed_tasks": ["Ⅰ.1.1. 극한의 개념", "Ⅰ.1.2. 수렴과 발산"]
            }},
            시험 계획2:
            {{
                "book_title": "2025 E90-1 전기기사 필기",
                "book_toc": 
                    '''
                    <p>
                    <b>1과목 전기자기학</b><br>
                    01. 벡터(vector)	<br>
                    02. 진공 중의 정전계<br>
                    03. 진공 중의 도체계와 정전 용량<br>
                    04. 유전체<br>
                    05. 전기 영상법<br>
                    06. 전류<br>
                    07. 정자계<br>
                    08. 자성체와 자기회로<br>
                    09. 전자 유도<br>
                    10. 인덕턴스<br>
                    11. 전자계<br>
                    <b>최근기출문제</b><br>
                    2011~2022년 기출문제<br>
                    2023년~2024년 CBT복원문제<br>
                    <br>
                    <br>
                    <b>2과목 전력공학</b><br>
                    01. 송배전 계통의 구성	<br>
                    02. 가공 송전 선로	<br>
                    03. 선로정수 및 코로나	<br>
                    04. 송전 특성	<br>
                    05. 중성점 접지 방식과 유도장해	<br>
                    06. 고장 계산	<br>
                    07. 전력계통의 안정도	<br>
                    08. 이상전압 및 방호대책	 <br>
                    09. 보호 계전 방식 <br>
                    10. 차단기	<br>
                    11. 배  전	<br>
                    12. 수  력	<br>
                    13. 화  력	<br>
                    14. 원자력	<br>
                    <b>최근기출문제</b><br>
                    2011~2022년 기출문제<br>
                    2023년~2024년 CBT복원문제<br>
                    <br>
                    <b>3과목 전기기기</b><br>
                    01. 직류 발전기	 <br>
                    02. 직류 전동기	 <br>
                    03. 직류기의 손실, 효율 및 정격	<br>
                    04. 특수 직류기	 <br>
                    05. 동기 발전기	 <br>
                    06. 동기 전동기	<br>
                    07. 변압기	<br>
                    08. 유도기<br>
                    09. 전력용 반도체 및 정류기	<br>
                    <b>최근기출문제</b><br>
                    2011~2022년 기출문제<br>
                    2023년~2024년 CBT복원문제<br>
                    <br>
                    <br>
                    <b>4과목 회로이론 및 제어공학</b><br>
                    01. 전기이론의 기초	<br>
                    02. 전기회로의 일반 해석	 <br>
                    03. 교류 회로<br>
                    04. 교류 전력과 에너지	 <br>
                    05. 유도결합회로	 <br>
                    06. 3상 교류	 <br>
                    07. 비정현파 교류<br>
                    08. 2단자 회로망	 <br>
                    09. 4단자 회로망	 <br>
                    10. 공진회로	 <br>
                    11. 분포정수회로	 <br>
                    12. 직류 회로의 과도현상	 <br>
                    13. 라플라스 변환	 <br>
                    14. 전달함수	 <br>
                    15. 제어 시스템의 개념	 <br>
                    16. 블록선도와 신호흐름선도	 <br>
                    17. 자동제어계의 과도응답	 <br>
                    18. 편차와 감도	 <br>
                    19. 주파수 응답에 의한 해석	 <br>
                    20. 제어계의 안정도	 <br>
                    21. 근궤적법	 <br>
                    22. 상태 방정식 및 Z 변환<br>
                    23. 시퀀스 제어	 <br>
                    24. 제어기기	 <br>
                    <b>최근기출문제</b><br>
                    2011~2022년 기출문제<br>
                    2023년~2024년 CBT복원문제<br>
                    <br>
                    <b>5과목 전기설비기술기준</b><br>
                    01. 공통사항	 <br>
                    02. 저압전기설비	 <br>
                    03. 고압·특고압 전기설비	 <br>
                    04. 전기철도 설비<br>
                    05. 분산형 전원설비	 <br>
                    06. 전기설비기술기준	<br>
                    <b>최근기출문제</b><br>
                    2011~2022년 기출문제<br>
                    2023년~2024년 CBT복원문제
                    </p>
                    ''',
                "today": "20250120",
                "test_day": "20250316",
                "period": "8주",
                "total_plan": 
                    {{
                        "1주차": ["Ⅰ. 1과목 전기자기학", "Ⅰ. 복습"],
                        "2주차": ["Ⅱ. 2과목 전력공학", "Ⅱ. 복습"],
                        "3주차": ["Ⅲ. 3과목 전기기기", "Ⅲ. 복습"],
                        "4주차": ["Ⅳ. 4과목 회로이론 및 제어공학", "Ⅳ. 복습"],
                        "5주차": ["Ⅴ. 5과목 전기설비기술기준", "Ⅴ. 복습"],
                        "6주차": ["Ⅵ.1 Ⅰ.복습", "Ⅵ.2. Ⅱ.복습"],
                        "7주차": ["Ⅶ.1. Ⅲ.복습", "Ⅶ.2. Ⅳ.복습", "Ⅶ.3. Ⅴ.복습"],
                        "8주차": ["Ⅷ.1. Ⅰ.복습", "Ⅷ.2. Ⅱ.복습", "Ⅷ.3. Ⅲ.복습", "Ⅷ.4. Ⅳ.복습", "Ⅷ.5. Ⅴ.복습"]
                    }}
                "weekly_plan": [
                        "Ⅰ.1. 벡터, 진공 중의 정전계, 진공 중의 도체계와 정전 용량, 유전체",
                        "Ⅰ.2. 전기 영상법, 전류, 정자계, 자성체와 자기회로", 
                        "Ⅰ.3. 전자 유도, 인덕턴스, 전자계", 
                        "Ⅰ.4. 2011~2022년 기출문제",
                        "Ⅰ.5. 2023년~2024년 CBT복원문제",
                        "Ⅰ.6. 복습"
                    ],
                "daily_plan": ["Ⅰ.1.1. 벡터", "Ⅰ.1.2. 진공 중의 정전계", "Ⅰ.1.3. 진공 중의 도체계와 정전 용량", "Ⅰ.1.4. 유전체", "복습"],
                "completed_tasks": []
            }}

        답변은 하나의 문자열로 나와야 합니다.

        아래의 대화를 보고 시험 계획을 생성하세요. 
        """
    )] + chat_history + [("human", "{question}" )]
    
    prompt = ChatPromptTemplate(
        messages=template,
        partial_variables={"format_instructions": output_parser.get_format_instructions()}
    )

    chain = {"question": RunnablePassthrough()} | prompt | LLM
    
    try:
        response = chain.invoke({"question": query }).content 
        return response
    except Exception as e:
        raise ValueError(f"Parsing Error: {e}")

def basic_chat(query: str, chat_history):
    """
    과거 대화 내역을 바탕으로 일반적인 대화를 진행하는 함수 
    """
    output_parser = PydanticOutputParser(pydantic_object=SearchResult)
    
    template = [(
        "system",
        """
        당신은 유용한 AI 챗봇입니다.
        
        답변은 하나의 문자열로 나와야 합니다.
        
        아래의 대화 내역을 참고해 사용자의 마지막 질문에 대한 답을 해주세요.
        """
    )] + chat_history + [("human", "{question}" )]
    
    prompt = ChatPromptTemplate(
        messages=template,
        partial_variables={"format_instructions": output_parser.get_format_instructions()}
    )

    chain = {"question": RunnablePassthrough()} | prompt | LLM
    
    response = chain.invoke({"question": query }).content 
    
    return response



######################### 답변하는 부분 #########################

# Agent 초기화
agent = AIAgent(llm=LLM)

def chatbot(user_message):
    # 1. 사용자 질문 분석 
    chat_history = user_message["chat_history"]
    user_query = user_message["user_msg"]
    print(user_query)
    result = agent.analyze_query(user_query, chat_history)
    print(result)
    result = json.loads(result)
    print(result["search_keywords"])
    
    # 2. 분석 결과에 따른 챗봇 답변 시작 
    
    # 2-1. 책 검색
    if result["action"] == "search_books":
        search_results = search_books(result["search_keywords"])
        
        if search_results:
            print({
                "message": "도서 검색 결과입니다.",
                "content": search_results
            })
            return result["action"], search_results
        else:
            print({
                "message": "검색 결과가 없습니다.",
                "content": search_results
            })
            return result["action"], search_results
    
    # 2-2. 시험 계획 생성 
    elif result["action"] == "make_plans":
        plan = make_plans(user_query, chat_history)
        
        if plan:
            print({
                "message": "생성된 학습 계획입니다.",
                "content": plan
            })
            return result["action"], plan
        else:
            print({
                "message": "계획이 생성되지 않았습니다.",
                "content": plan
            })
            return result["action"], plan
    
    # 2-3. 일반적인 챗봇
    else:
        response = basic_chat(user_query, chat_history)
        
        if response:
            print({
                "message": "답변이 생성되었습니다.",
                "content": response
            })
            return result["action"], response
        else:
            print({
                "message": "답변이 생성되지 않았습니다.",
                "content": response
            })
            return result["action"], response