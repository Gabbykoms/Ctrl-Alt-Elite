#!/usr/bin/env python3
"""
Test RabbitMQ Publisher Script
Publishes test shuttle updates and alerts to RabbitMQ queues for local testing
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


def publish_shuttle_update(channel, shuttle_id, location, status, route_id):
    """Publish a shuttle location update"""
    message = {
        "shuttle_id": shuttle_id,
        "location": location,
        "status": status,
        "route_id": route_id,
        "speed": 25.5,
        "heading": 180,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    channel.basic_publish(
        exchange='',
        routing_key='shuttle.updates',
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
            content_type='application/json'
        )
    )
    print(f"✅ Published shuttle update: {shuttle_id} at {location}")


def publish_shuttle_alert(channel, alert_type, shuttle_id, message_text, severity):
    """Publish a shuttle alert"""
    message = {
        "alert_id": f"alert-{uuid4()}",
        "type": alert_type,
        "shuttle_id": shuttle_id,
        "route_id": "route-001",
        "message": message_text,
        "severity": severity,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
    
    channel.basic_publish(
        exchange='',
        routing_key='shuttle.alerts',
        body=json.dumps(message),
        properties=pika.BasicProperties(
            delivery_mode=2,  # Make message persistent
            content_type='application/json'
        )
    )
    print(f"🔔 Published alert: {alert_type} - {message_text}")


def setup_queues(channel):
    """Declare queues (idempotent)"""
    channel.queue_declare(
        queue='shuttle.updates',
        durable=True,
        arguments={"x-message-ttl": 300000}  # 5 minutes TTL
    )
    
    channel.queue_declare(
        queue='shuttle.alerts',
        durable=True,
        arguments={"x-message-ttl": 3600000}  # 1 hour TTL
    )
    print("📦 Queues declared: shuttle.updates, shuttle.alerts")


def main():
    """Main test function"""
    print("\n🚀 RabbitMQ Test Publisher")
    print("=" * 50)
    
    # Connect to RabbitMQ
    connection = create_connection()
    channel = connection.channel()
    print("✅ Connected to RabbitMQ")
    
    # Setup queues
    setup_queues(channel)
    
    print("\n📡 Publishing test messages...")
    print("-" * 50)
    
    # Test Data
    test_shuttles = [
        {
            "id": "shuttle-001",
            "location": {"lat": 41.3083, "lng": -72.9279},
            "status": "active",
            "route": "route-campus-north"
        },
        {
            "id": "shuttle-002",
            "location": {"lat": 41.3100, "lng": -72.9300},
            "status": "active",
            "route": "route-campus-south"
        },
        {
            "id": "shuttle-003",
            "location": {"lat": 41.3050, "lng": -72.9250},
            "status": "idle",
            "route": "route-downtown"
        }
    ]
    
    test_alerts = [
        {
            "type": "delay",
            "shuttle_id": "shuttle-001",
            "message": "Shuttle delayed by 10 minutes due to traffic",
            "severity": "medium"
        },
        {
            "type": "detour",
            "shuttle_id": "shuttle-002",
            "message": "Route detour due to road construction",
            "severity": "high"
        },
        {
            "type": "cancelled",
            "shuttle_id": "shuttle-003",
            "message": "Shuttle service temporarily suspended",
            "severity": "high"
        }
    ]
    
    # Publish shuttle updates
    print("\n🚍 Publishing shuttle updates...")
    for shuttle in test_shuttles:
        publish_shuttle_update(
            channel,
            shuttle["id"],
            shuttle["location"],
            shuttle["status"],
            shuttle["route"]
        )
        time.sleep(0.5)
    
    # Publish alerts
    print("\n🔔 Publishing shuttle alerts...")
    for alert in test_alerts:
        publish_shuttle_alert(
            channel,
            alert["type"],
            alert["shuttle_id"],
            alert["message"],
            alert["severity"]
        )
        time.sleep(0.5)
    
    print("\n" + "=" * 50)
    print("✅ Test messages published successfully!")
    print("\nQueue Stats:")
    
    # Get queue stats
    updates_queue = channel.queue_declare(queue='shuttle.updates', durable=True, passive=True)
    alerts_queue = channel.queue_declare(queue='shuttle.alerts', durable=True, passive=True)
    
    print(f"  - shuttle.updates: {updates_queue.method.message_count} messages")
    print(f"  - shuttle.alerts: {alerts_queue.method.message_count} messages")
    
    print("\n💡 Tips:")
    print("  - Check AI service logs to see messages being consumed")
    print("  - Access RabbitMQ Management UI: http://localhost:15672")
    print("  - Default credentials: guest/guest")
    
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
