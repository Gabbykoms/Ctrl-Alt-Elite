from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.tools import tool
from langgraph.graph import MessagesState, StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import ToolNode, tools_condition
from typing import List, Dict, Any, Optional
import logging
import requests  
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.models.document import Document

logger = logging.getLogger(__name__)

class ShuttleRAGService:
    """RAG service for Trinity Shuttle using LangChain + LangGraph"""

    def __init__(self, db: Session):
        self.db = db
        
        self.llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            api_key=settings.AI_OPENAI_API_KEY
        )

        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.VECTOR_DIMENSION,
            api_key=settings.AI_OPENAI_API_KEY
        )

        self.graph = self._build_graph()

    
    def _get_current_weather(self) -> str:
        """Fetch real-time weather for Trinity College (Hartford, CT)"""
        try:
            # Hartford Coordinates
            lat = "41.745"
            lon = "-72.690"
            api_key = settings.OPENWEATHER_API_KEY
            
            if not api_key:
                return "Weather data unavailable (API Key missing)."

            url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=imperial"
            response = requests.get(url, timeout=2)
            
            if response.status_code == 200:
                data = response.json()
                condition = data['weather'][0]['description']
                temp = int(data['main']['temp'])
                return f"{condition.capitalize()}, {temp}°F"
            else:
                return "Weather currently unavailable."
        except Exception as e:
            logger.warning(f"Failed to fetch weather: {e}")
            return "Weather currently unavailable."

    def _retrieve_documents(self, query: str, k: int = 5) -> List[Document]:
        
        try:
            query_embedding = self.embeddings.embed_query(query)
            embedding_str = f"[{','.join(map(str, query_embedding))}]"

            sql = text("""
                SELECT 
                    id, content, category, metadata,
                    1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
                FROM documents
                WHERE 1 - (embedding <=> CAST(:query_embedding AS vector)) > :threshold
                ORDER BY embedding <=> CAST(:query_embedding AS vector)
                LIMIT :limit
            """)

            result = self.db.execute(sql, {
                "query_embedding": embedding_str,
                "threshold": settings.SIMILARITY_THRESHOLD,
                "limit": k
            })

            documents = []
            for row in result:
                doc = Document(
                    id=row.id, content=row.content, category=row.category, metadata=row.metadata
                )
                doc.similarity = float(row.similarity)
                documents.append(doc)

            return documents
        except Exception as e:
            logger.error(f"Error retrieving documents: {e}")
            return []

   
    def create_retrieval_tool(self):
        """Create the retrieval tool for LangGraph"""
        db = self.db
        retrieve_func = self._retrieve_documents

        @tool(response_format="content_and_artifact")
        def retrieve_shuttle_info(query: str):
            """
            Retrieve context information about Trinity shuttle service.
            
            Args:
                query: Question about shuttle routes, schedules, or policies
                
            Returns:
                Formatted context and raw documents
            """
            
            
            retrieved_docs = retrieve_func(query, k=settings.MAX_CONTEXT_DOCUMENTS)

            if not retrieved_docs:
                return "No relevant information found in knowledge base.", []

            serialized = "\n\n".join(
                (f"Category: {doc.category}\n"
                 f"Content: {doc.content}\n"
                 f"Metadata: {doc.metadata}\n"
                 f"Relevance: {doc.similarity:.2f}")
                for doc in retrieved_docs
            )

            return serialized, retrieved_docs

        return retrieve_shuttle_info

    
    def _query_or_respond(self, state: MessagesState):
        """Generate tool call for retrieval or respond directly"""
        
        # 1. Get the weather right now
        live_weather = self._get_current_weather()

        # 2. Create a hidden instruction with the weather data
        weather_context = SystemMessage(content=f"""
SYSTEM UPDATE:
Current Weather in Hartford: {live_weather}

INSTRUCTIONS:
- If the user asks about the weather, use the data above to answer immediately.
- If the user asks about shuttles/routes, call the 'retrieve_shuttle_info' tool.
""")

        # 3. Bind the tools
        retrieval_tool = self.create_retrieval_tool()
        llm_with_tools = self.llm.bind_tools([retrieval_tool])

        # 4. Prepend the weather context to the messages sent to the LLM
        # We put the weather FIRST, then the user's chat history
        response = llm_with_tools.invoke([weather_context] + state["messages"])
        
        return {"messages": [response]}

    # --- UPDATED GENERATION METHOD ---
    def _generate_response(self, state: MessagesState):
        """Generate final response using retrieved context AND live weather"""
        
        # 1. Get Live Weather
        live_weather = self._get_current_weather()

        # 2. Get tool messages (retrieved documents)
        recent_tool_messages = []
        for message in reversed(state["messages"]):
            if message.type == "tool":
                recent_tool_messages.append(message)
            else:
                break
        tool_messages = recent_tool_messages[::-1]

        docs_content = "\n\n".join(msg.content for msg in tool_messages) if tool_messages else ""

        # 3. Inject Weather into System Prompt
        system_prompt_content = f"""
You are a helpful assistant for Trinity College's shuttle service.

Your responsibilities:
1. Provide accurate information about shuttle operations based on the provided context.
2. Suggest next steps (e.g., check the app, wait at a stop).
3. Advise on safety and emergency procedures.

---
 LIVE SITUATION REPORT:
Current Weather in Hartford: {live_weather}

INSTRUCTION: 
If the weather above indicates snow, ice, heavy rain, or extreme cold:
1. Add a caution to your response.
2. Mention that shuttles may be delayed due to these conditions.
3. Remind students to dress warmly or wait inside if possible.
---

Contextual Information:
{docs_content if docs_content else "No specific context available. Provide general guidance."}

Format your response in a clear, friendly manner suitable for students.
"""

        conversation_messages = [
            message
            for message in state["messages"]
            if message.type in ("human", "system")
               or (message.type == "ai" and not message.tool_calls)
        ]

        prompt = [SystemMessage(system_prompt_content)] + conversation_messages

        response = self.llm.invoke(prompt)
        return {"messages": [response]}

    def _build_graph(self):
        # ... (This method remains exactly the same) ...
        graph_builder = StateGraph(MessagesState)
        graph_builder.add_node("query_or_respond", self._query_or_respond)
        retrieval_tool = self.create_retrieval_tool()
        graph_builder.add_node("tools", ToolNode([retrieval_tool]))
        graph_builder.add_node("generate", self._generate_response)
        graph_builder.set_entry_point("query_or_respond")
        graph_builder.add_conditional_edges(
            "query_or_respond", tools_condition, {END: END, "tools": "tools"}
        )
        graph_builder.add_edge("tools", "generate")
        graph_builder.add_edge("generate", END)
        return graph_builder.compile()

    async def process_query(self, user_query: str, session_id: str, user_id: Optional[str] = None) -> Dict[str, Any]:
        # ... (This method remains exactly the same) ...
        try:
            input_messages = [HumanMessage(content=user_query)]
            result = self.graph.invoke({"messages": input_messages})
            final_message = result["messages"][-1]
            response_text = final_message.content

            sources = []
            for message in result["messages"]:
                if message.type == "tool":
                    sources.append({
                        "content": message.content[:200] + "..." if len(message.content) > 200 else message.content,
                        "type": "retrieval"
                    })

            self._save_chat_history(session_id, user_id, user_query, response_text)

            return {
                "response": response_text,
                "sources": sources,
                "session_id": session_id
            }
        except Exception as e:
            logger.error(f"Error in RAG pipeline: {e}", exc_info=True)
            raise

    def _save_chat_history(self, session_id: str, user_id: Optional[str], user_query: str, response: str):
        
        try:
            from app.models.chat import ChatHistory
            user_msg = ChatHistory(session_id=session_id, user_id=user_id, role="user", content=user_query)
            self.db.add(user_msg)
            assistant_msg = ChatHistory(session_id=session_id, user_id=user_id, role="assistant", content=response)
            self.db.add(assistant_msg)
            self.db.commit()
        except Exception as e:
            logger.error(f"Error saving chat history: {e}")
            self.db.rollback()