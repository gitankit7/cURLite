#!/bin/bash

# cURLite Background Runner
# Runs the app in background with error-only logging

PID_FILE="curlite.pid"
LOG_FILE="curlite-errors.log"

case "${1:-start}" in
  start)
    echo "🚀 Starting cURLite in background..."

    # Kill existing process if running
    if [ -f "$PID_FILE" ]; then
      if kill -0 $(cat "$PID_FILE") 2>/dev/null; then
        echo "⚠️  cURLite already running (PID: $(cat "$PID_FILE"))"
        echo "   Use: $0 stop   to stop it first"
        exit 1
      fi
    fi

    # Start in background, log only errors
    nohup npm start > /dev/null 2> "$LOG_FILE" &
    PID=$!
    echo $PID > "$PID_FILE"

    # Wait a moment to check if it started successfully
    sleep 2
    if kill -0 $PID 2>/dev/null; then
      echo "✅ cURLite running in background (PID: $PID)"
      echo "   Frontend: http://localhost:2401"
      echo "   API: http://localhost:2402"
      echo "   Errors logged to: $LOG_FILE"
      echo "   Stop with: $0 stop"
    else
      echo "❌ Failed to start cURLite"
      if [ -s "$LOG_FILE" ]; then
        echo "   Error log:"
        cat "$LOG_FILE"
      fi
      rm -f "$PID_FILE"
      exit 1
    fi
    ;;

  stop)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 $PID 2>/dev/null; then
        echo "🛑 Stopping cURLite (PID: $PID)..."
        kill $PID

        # Wait for graceful shutdown
        sleep 2
        if kill -0 $PID 2>/dev/null; then
          echo "   Force killing..."
          kill -9 $PID
        fi

        rm -f "$PID_FILE"
        echo "✅ cURLite stopped"
      else
        echo "⚠️  cURLite not running"
        rm -f "$PID_FILE"
      fi
    else
      echo "⚠️  No PID file found"
    fi
    ;;

  status)
    if [ -f "$PID_FILE" ]; then
      PID=$(cat "$PID_FILE")
      if kill -0 $PID 2>/dev/null; then
        echo "✅ cURLite running (PID: $PID)"
        echo "   Frontend: http://localhost:2401"
        echo "   API: http://localhost:2402"
      else
        echo "❌ cURLite not running (stale PID file)"
        rm -f "$PID_FILE"
      fi
    else
      echo "❌ cURLite not running"
    fi
    ;;

  logs)
    if [ -f "$LOG_FILE" ]; then
      echo "📋 Recent error logs:"
      tail -20 "$LOG_FILE"
    else
      echo "📋 No error logs found"
    fi
    ;;

  *)
    echo "Usage: $0 {start|stop|status|logs}"
    echo ""
    echo "Commands:"
    echo "  start   - Run cURLite in background"
    echo "  stop    - Stop background cURLite"
    echo "  status  - Check if running"
    echo "  logs    - Show recent error logs"
    exit 1
    ;;
esac