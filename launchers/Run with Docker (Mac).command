#!/bin/sh
# Double-click to run the AALM app on macOS. Requires Docker Desktop.
echo ""
echo "Starting the AALM app..."
echo ""

if ! docker info >/dev/null 2>&1; then
  echo "Docker is not installed or not running."
  echo "Install Docker Desktop, start it, then run this file again:"
  echo "  https://www.docker.com/products/docker-desktop/"
  echo ""
  read -r -p "Press Enter to close. " _
  exit 1
fi

echo "The first run downloads the app image (a few minutes); later runs are quick."
echo "Keep this Terminal window open while you use the app; close it (or press Ctrl+C) to stop."
echo ""
( sleep 10; open "http://localhost:8000/" ) &
docker run --rm -p 8000:8000 --pull=always ghcr.io/ag-pureearth/aalm-app:latest
