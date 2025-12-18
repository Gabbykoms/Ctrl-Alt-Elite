#!/usr/bin/env python3
"""
Test RabbitMQ Chat Queue
Publishes test chat requests to the queue
"""
import json
import time
import sys
from datetime import datetime
from uuid import uuid4

try:
    import pika
except ImportError:
    print("❌ Error: pika is not installed")
    print("Install it with: pip install pika")
    sys.exit(1)


def create_connection():
    """Create connection to RabbitMQ"""
    try:
        credentials = pika.PlainCredentials('guest', 'guest')
        parameters = pika.ConnectionParameters(
            host='localhost',
            port=5672,
            virtual_host='/',
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )
        connection = pika.BlockingConnection(parameters)
        return connection
    except Exception as e:
        print(f"❌ Failed to connect to RabbitMQ: {e}")
        print("Make sure RabbitMQ is running on localhost:5672")
        sys.exit(1)


def publish_chat_request(channel, message, session_id=None):
    """Publish a chat request"""
    request_id = str(uuid4())
    session_id = session_id or str(uuid4())
    
    payload = {
        "request_id": request_id,
        "message": message,
        "session_id": session_id,
        "user_id": None,
        "include_sources": True,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    channel.basic_publish(
        exchange='',
        routing_key='chat.requests',
        body=json.dumps(payload),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
            content_type='application/json'
        )
    )
    print(f"✅ Published chat request: {request_id}")
    print(f"   Message: {message}")
    print(f"   Session: {session_id}")
    return request_id


def setup_queue(channel):
    """Declare queue (idempotent)"""
    channel.queue_declare(
        queue='chat.requests',
        durable=True,
        arguments={
            "x-message-ttl": 300000,  # 5 minutes TTL
            "x-max-length": 1000
        }
    )
    print("📦 Queue declared: chat.requests")


def main():
    """Main test function"""
    print("\n🚀 RabbitMQ Chat Queue Test")
    print("=" * 50)
    
    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()
    print("✅ Connected to RabbitMQ")
    
    # Setup queue
    setup_queue(channel)
    
    print("\n📡 Publishing test chat requests...")
    print("-" * 50)
    
    # Test messages
    test_messages = [
        "Hello, can you help me with shuttle information?",
        "What are the shuttle operating hours?",
        "Where is shuttle 001 right now?",
        "How many stops are there on the campus north route?",
        "Are there any delays or service alerts today?"
    ]
    
    session_id = str(uuid4())  # Same session for all messages
    request_ids = []
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n{i}. ", end="")
        request_id = publish_chat_request(channel, message, session_id)
        request_ids.append(request_id)
        time.sleep(0.5)
    
    print("\n" + "=" * 50)
    print("✅ Test messages published successfully!")
    print(f"\n📊 Summary:")
    print(f"   - Session ID: {session_id}")
    print(f"   - Messages sent: {len(test_messages)}")
    print(f"   - Request IDs:")
    for req_id in request_ids:
        print(f"     • {req_id}")
    
    # Get queue stats
    queue_state = channel.queue_declare(queue='chat.requests', durable=True, passive=True)
    print(f"\n📬 Queue Status:")
    print(f"   - Messages in queue: {queue_state.method.message_count}")
    
    print("\n💡 Next Steps:")
    print("   1. Check AI service logs to see messages being processed")
    print("   2. Poll for responses using: GET /chat/response/{request_id}")
    print("   3. Access RabbitMQ Management UI: http://localhost:15672")
    print("   4. Check database: SELECT * FROM chat_requests;")
    
    # Close connection
    connection.close()
    print("\n👋 Connection closed")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Interrupted by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)
