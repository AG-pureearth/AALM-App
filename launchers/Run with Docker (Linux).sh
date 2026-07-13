#!/bin/sh
# Run the AALM app on Linux. Requires Docker.
echo ""
echo "Starting the AALM app..."
echo ""

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not installed or not running. Install Docker, start it, then run this again:"
  echo "  https://docs.docker.com/engine/install/"
  exit 1
fi

echo "The first run downloads the app image (a few minutes); later runs are quick."
echo "Keep this terminal open while you use the app; press Ctrl+C to stop."
echo ""
( sleep 10; xdg-open "http://localhost:8000/" >/dev/null 2>&1 ) &
docker run --rm -p 8000:8000 --pull=always ghcr.io/ag-pureearth/aalm-app:latest
