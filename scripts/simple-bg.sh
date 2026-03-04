#!/bin/bash

# Simple background modes for cURLite

echo "🚀 cURLite Background Options:"
echo ""
echo "1. Background with error logging:"
echo "   npm start > /dev/null 2> curlite-errors.log &"
echo ""
echo "2. Completely silent background:"
echo "   npm start > /dev/null 2>&1 &"
echo ""
echo "3. Background with PID tracking:"
echo "   npm start > /dev/null 2> curlite-errors.log & echo \$! > curlite.pid"
echo ""
echo "4. Kill background process:"
echo "   kill \$(cat curlite.pid) && rm curlite.pid"
echo ""
echo "5. Check if running:"
echo "   kill -0 \$(cat curlite.pid) && echo 'Running' || echo 'Stopped'"
echo ""

if [ "$1" = "run" ]; then
  echo "Starting cURLite in background with error logging..."
  npm start > /dev/null 2> curlite-errors.log &
  echo $! > curlite.pid
  echo "✅ Started with PID: $(cat curlite.pid)"
  echo "   Frontend: http://localhost:2401"
  echo "   API: http://localhost:2402"
  echo "   Errors: curlite-errors.log"
  echo "   Stop with: kill \$(cat curlite.pid)"
fi