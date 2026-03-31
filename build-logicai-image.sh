#!/bin/bash
set -e

echo "🔨 Building LogicAI-N8N Docker Image"
echo "===================================="

# Check if docker-instance directory exists
if [ ! -d "docker-instance" ]; then
    echo "❌ Error: docker-instance directory not found"
    echo "   Please run this script from the project root directory"
    exit 1
fi

cd docker-instance

echo "Building Docker image from docker-instance/Dockerfile..."
docker build -t logicai-n8n:latest .

echo ""
echo "✅ LogicAI-N8N image built successfully!"
echo ""
echo "Image name: logicai-n8n:latest"
echo ""
echo "📝 Useful commands:"
echo "   View image:   docker images | grep logicai-n8n"
echo "   Image size:   docker images logicai-n8n:latest --format '{{.Size}}'"
echo "   Remove image: docker rmi logicai-n8n:latest"
echo ""
echo "Done! 🎉"
