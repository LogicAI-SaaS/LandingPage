#!/bin/bash
set -e

echo "🔨 Building LogicAI Docker Image"
echo "===================================="

# Check if docker-instance directory exists
if [ ! -d "docker-instance" ]; then
    echo "❌ Error: docker-instance directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

cd docker-instance

echo "Building Docker image from docker-instance/Dockerfile..."
docker build -t logicai:latest .

echo ""
echo "✅ LogicAI image built successfully!"
echo ""
echo "Image name: logicai:latest"
echo ""
echo "📝 Useful commands:"
echo "   View image:   docker images | grep logicai"
echo "   Image size:   docker images logicai:latest --format '{{.Size}}'"
echo "   Remove image: docker rmi logicai:latest"
echo ""
echo "Done! 🎉"
