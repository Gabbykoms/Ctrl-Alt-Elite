from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_core.tools import tool
from langgraph.graph import MessagesState, StateGraph, END
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import ToolNode, tools_condition
from typing import List, Dict, Any, Optional
import logging
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.models.document import Document

logger = logging.getLogger(__name__)


class ShuttleRAGService:
    """RAG service for Trinity Shuttle using LangChain + LangGraph"""

    def __init__(self, db: Session):
        self.db = db

        # Initialize LangChain components
        self.llm = ChatOpenAI(
            model=settings.CHAT_MODEL,
            temperature=settings.TEMPERATURE,
            max_tokens=settings.MAX_TOKENS,
            api_key=settings.OPENAI_API_KEY
        )

        self.embeddings = OpenAIEmbeddings(
            model=settings.EMBEDDING_MODEL,
            dimensions=settings.VECTOR_DIMENSION,
            api_key=settings.OPENAI_API_KEY
        )

        # Build the graph
        self.graph = self._build_graph()

    def _retrieve_documents(self, query: str, k: int = 5) -> List[Document]:
        """Retrieve similar documents from pgvector"""
        try:
            # Generate query embedding
            query_embedding = self.embeddings.embed_query(query)
            embedding_str = f"[{','.join(map(str, query_embedding))}]"

            # Vector similarity search
            sql = text("""
                SELECT 
                    id,
                    content,
                    category,
                    metadata,
                    1 - (embedding <=> CAST(:query_embedding AS vector)) AS similarity
                FROM documents
                WHERE 1 - (embedding <=> CAST(:query_embedding AS vector)) > :threshold
                ORDER BY embedding <=> CAST(:query_embedding AS vector)
                LIMIT :limit
            """)

            result = self.db.execute(
                sql,
                {
                    "query_embedding": embedding_str,
                    "threshold": settings.SIMILARITY_THRESHOLD,
                    "limit": k
                }
            )

            documents = []
            for row in result:
                doc = Document(
                    id=row.id,
                    content=row.content,
                    category=row.category,
                    metadata=row.metadata
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
        retrieval_tool = self.create_retrieval_tool()
        llm_with_tools = self.llm.bind_tools([retrieval_tool])
        response = llm_with_tools.invoke(state["messages"])
        return {"messages": [response]}

    def _generate_response(self, state: MessagesState):
        """Generate final response using retrieved context"""
        # Get tool messages (retrieved documents)
        recent_tool_messages = []
        for message in reversed(state["messages"]):
            if message.type == "tool":
                recent_tool_messages.append(message)
            else:
                break
        tool_messages = recent_tool_messages[::-1]

        # Format context from retrieved documents
        docs_content = "\n\n".join(msg.content for msg in tool_messages) if tool_messages else ""

        # System prompt for shuttle service
        system_prompt_content = f"""
You are a helpful assistant for Trinity College's shuttle service.
You will be provided with relevant information about shuttle routes, schedules, and policies.

Your responsibilities:
1. Provide accurate information about shuttle operations based on the provided context
2. Suggest next steps (e.g., check the app for real-time updates, wait at a specific stop)
3. Advise on safety and emergency procedures when relevant
4. Be friendly, concise, and student-focused

IMPORTANT GUIDELINES:
- Always base your response on the provided context
- If information isn't in the context, clearly state you don't have that information
- Mention specific stops, times, and routes when relevant
- Prioritize safety information
- Keep responses conversational and easy to understand

Contextual Information:
{docs_content if docs_content else "No specific context available. Provide general guidance about checking the app or contacting Campus Safety."}

Format your response in a clear, friendly manner suitable for students.
"""

        # Get conversation messages (exclude tool calls)
        conversation_messages = [
            message
            for message in state["messages"]
            if message.type in ("human", "system")
               or (message.type == "ai" and not message.tool_calls)
        ]

        prompt = [SystemMessage(system_prompt_content)] + conversation_messages

        # Generate response
        response = self.llm.invoke(prompt)
        return {"messages": [response]}

    def _build_graph(self):
        """Build the LangGraph workflow"""
        # Create graph
        graph_builder = StateGraph(MessagesState)

        # Add nodes
        graph_builder.add_node("query_or_respond", self._query_or_respond)

        # Create tool node with retrieval tool
        retrieval_tool = self.create_retrieval_tool()
        graph_builder.add_node("tools", ToolNode([retrieval_tool]))

        graph_builder.add_node("generate", self._generate_response)

        # Set entry point
        graph_builder.set_entry_point("query_or_respond")

        # Add edges
        graph_builder.add_conditional_edges(
            "query_or_respond",
            tools_condition,
            {END: END, "tools": "tools"}
        )
        graph_builder.add_edge("tools", "generate")
        graph_builder.add_edge("generate", END)

        # Compile without memory checkpointer (avoid msgpack serialization issues)
        return graph_builder.compile()

    async def process_query(
            self,
            user_query: str,
            session_id: str,
            user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Process user query through the RAG pipeline

        Args:
            user_query: User's question
            session_id: Conversation session ID
            user_id: Optional user ID

        Returns:
            Dict with response and metadata
        """
        try:
            # Create input messages
            input_messages = [HumanMessage(content=user_query)]

            # Invoke the graph
            result = self.graph.invoke(
                {"messages": input_messages}
            )

            # Extract final response
            final_message = result["messages"][-1]
            response_text = final_message.content

            # Extract sources (documents used)
            sources = []
            for message in result["messages"]:
                if message.type == "tool":
                    sources.append({
                        "content": message.content[:200] + "..." if len(message.content) > 200 else message.content,
                        "type": "retrieval"
                    })

            # Save to chat history
            self._save_chat_history(session_id, user_id, user_query, response_text)

            return {
                "response": response_text,
                "sources": sources,
                "session_id": session_id
            }

        except Exception as e:
            logger.error(f"Error in RAG pipeline: {e}", exc_info=True)
            raise

    def _save_chat_history(
            self,
            session_id: str,
            user_id: Optional[str],
            user_query: str,
            response: str
    ):
        """Save conversation to database"""
        try:
            from app.models.chat import ChatHistory

            # Save user message
            user_msg = ChatHistory(
                session_id=session_id,
                user_id=user_id,
                role="user",
                content=user_query
            )
            self.db.add(user_msg)

            # Save assistant response
            assistant_msg = ChatHistory(
                session_id=session_id,
                user_id=user_id,
                role="assistant",
                content=response
            )
            self.db.add(assistant_msg)

            self.db.commit()
        except Exception as e:
            logger.error(f"Error saving chat history: {e}")
            self.db.rollback()