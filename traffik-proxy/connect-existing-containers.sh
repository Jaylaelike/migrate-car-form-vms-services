#!/bin/bash

# Script สำหรับเชื่อม containers ที่มีอยู่แล้วเข้ากับ Traefik
# ใช้สำหรับ containers ที่รันอยู่ก่อนแล้ว

NETWORK_NAME="traefik-network"

echo "🔗 Connecting existing containers to Traefik network..."

# ตรวจสอบว่า network มีอยู่
if ! docker network inspect $NETWORK_NAME &>/dev/null; then
    echo "❌ Network $NETWORK_NAME not found. Please start Traefik first."
    exit 1
fi

# Function สำหรับเชื่อม container
connect_container() {
    local container_name=$1
    local host_rule=$2
    local port=$3
    
    echo "Connecting $container_name..."
    
    # เชื่อม network
    docker network connect $NETWORK_NAME $container_name 2>/dev/null || echo "Already connected"
    
    # เพิ่ม labels
    docker update \
        --label traefik.enable=true \
        --label "traefik.http.routers.${container_name}.rule=Host(\`${host_rule}\`)" \
        --label traefik.http.routers.${container_name}.entrypoints=web \
        --label "traefik.http.services.${container_name}.loadbalancer.server.port=${port}" \
        $container_name 2>/dev/null || echo "⚠️  Cannot update labels (container may need restart)"
    
    echo "✅ $container_name configured for ${host_rule}:${port}"
}

# ตัวอย่างการใช้งาน - แก้ไขตามชื่อ containers ของคุณ
# connect_container "container-name" "subdomain.localhost" "port"

echo ""
echo "📝 Example usage:"
echo "   Uncomment and modify these lines in this script:"
echo ""
echo "   connect_container \"nextjs-app\" \"nextjs.localhost\" \"3000\""
echo "   connect_container \"nodejs-api\" \"api.localhost\" \"3002\""
echo "   connect_container \"react-app\" \"react.localhost\" \"5173\""
echo ""
echo "💡 Or manually add labels to your containers:"
echo "   docker run -d \\"
echo "     --name my-service \\"
echo "     --network traefik-network \\"
echo "     --label traefik.enable=true \\"
echo "     --label 'traefik.http.routers.my-service.rule=Host(\`service.localhost\`)' \\"
echo "     --label traefik.http.routers.my-service.entrypoints=web \\"
echo "     --label traefik.http.services.my-service.loadbalancer.server.port=3000 \\"
echo "     your-image:latest"
