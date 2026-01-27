# Traefik Reverse Proxy

ใช้ Subdomain routing - ไม่ต้องแก้ไข basePath ของ Next.js หรือ API

## 🎯 Features

- ✅ Auto-discovery containers
- ✅ ใช้ subdomain แทน path (ไม่ต้องแก้ code)
- ✅ Dashboard สำหรับดู routes
- ✅ Load balancing & Health checks
- ✅ SSL/HTTPS support (ready)

## 🚀 Quick Start

### 1. Start Traefik
```bash
docker-compose up -d
```

### 2. Access Dashboard
```
http://localhost:8080
```

### 3. เชื่อม Services

#### วิธีที่ 1: Services ใหม่ (ใช้ docker-compose)
```bash
# Copy example file
cp docker-compose.services.example.yml docker-compose.services.yml

# แก้ไข images และ configs
nano docker-compose.services.yml

# Run services
docker-compose -f docker-compose.services.yml up -d
```

#### วิธีที่ 2: Containers ที่มีอยู่แล้ว
```bash
# เชื่อม existing containers
./connect-existing-containers.sh

# หรือ manual
docker network connect traefik-network my-container
docker update --label traefik.enable=true my-container
# ... (ดู labels ใน script)
```

#### วิธีที่ 3: Run container ใหม่พร้อม labels
```bash
docker run -d \
  --name nextjs-app \
  --network traefik-network \
  --label traefik.enable=true \
  --label 'traefik.http.routers.nextjs.rule=Host(`nextjs.localhost`)' \
  --label traefik.http.routers.nextjs.entrypoints=web \
  --label traefik.http.services.nextjs.loadbalancer.server.port=3000 \
  your-nextjs-image:latest
```

## 🌐 URL Patterns

### Development (localhost)
```
http://nextjs.localhost     → nextjs:3000
http://api.localhost        → api:3002
http://react.localhost      → react:5173
http://traefik.localhost    → Traefik Dashboard
```

### Production (domain.com)
```
http://app.domain.com       → nextjs:3000
http://api.domain.com       → api:3002
http://admin.domain.com     → react:5173
```

## 📝 Configuration Examples

### Next.js Service
```yaml
nextjs-app:
  image: your-nextjs-image
  networks:
    - traefik-network
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.nextjs.rule=Host(`app.localhost`)"
    - "traefik.http.routers.nextjs.entrypoints=web"
    - "traefik.http.services.nextjs.loadbalancer.server.port=3000"
```

### API with CORS
```yaml
api:
  image: your-api-image
  networks:
    - traefik-network
  labels:
    - "traefik.enable=true"
    - "traefik.http.routers.api.rule=Host(`api.localhost`)"
    - "traefik.http.routers.api.entrypoints=web"
    - "traefik.http.services.api.loadbalancer.server.port=3002"
    - "traefik.http.routers.api.middlewares=cors-headers"
```

### Multiple Domains
```yaml
labels:
  - "traefik.http.routers.app.rule=Host(`app.localhost`) || Host(`www.app.localhost`)"
```

### Path-based Routing (ถ้าต้องการ)
```yaml
labels:
  - "traefik.http.routers.api.rule=Host(`localhost`) && PathPrefix(`/api`)"
```

## 🔒 SSL/HTTPS Setup

### 1. ใช้ Let's Encrypt (Auto)
แก้ไข `config/traefik.yml`:
```yaml
certificatesResolvers:
  letsencrypt:
    acme:
      email: your-email@example.com
      storage: /ssl/acme.json
      httpChallenge:
        entryPoint: web
```

เพิ่ม label:
```yaml
labels:
  - "traefik.http.routers.app.tls.certresolver=letsencrypt"
```

### 2. ใช้ Self-signed Certificate
```bash
# Generate certificate
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/cert.key -out ssl/cert.crt

# Add to dynamic.yml
tls:
  certificates:
    - certFile: /ssl/cert.crt
      keyFile: /ssl/cert.key
```

## 🛠️ Commands

```bash
# View logs
docker-compose logs -f traefik

# Restart Traefik
docker-compose restart traefik

# List routes
curl http://localhost:8080/api/http/routers | jq

# Check connected containers
docker network inspect traefik-network
```

## 🔍 Troubleshooting

### Service ไม่ขึ้น
1. ตรวจสอบ Dashboard: http://localhost:8080
2. ดู logs: `docker-compose logs -f`
3. ตรวจสอบ network: `docker network inspect traefik-network`

### 404 Not Found
- ตรวจสอบ Host rule ใน labels
- ตรวจสอบ port ที่ service ฟัง
- ตรวจสอบว่า `traefik.enable=true`

### Container ไม่โผล่ใน Dashboard
- ตรวจสอบว่าอยู่ใน `traefik-network`
- ตรวจสอบ labels ว่าถูกต้อง
- Restart Traefik

## 📚 Advanced

### Health Checks
```yaml
labels:
  - "traefik.http.services.api.loadbalancer.healthcheck.path=/health"
  - "traefik.http.services.api.loadbalancer.healthcheck.interval=10s"
```

### Load Balancing (Multiple Instances)
```yaml
labels:
  - "traefik.http.services.api.loadbalancer.sticky.cookie=true"
```

### Custom Middleware
```yaml
# In dynamic.yml
http:
  middlewares:
    my-auth:
      basicAuth:
        users:
          - "user:$apr1$xyz..."
```

## 🆚 Nginx vs Traefik

| Feature | Nginx | Traefik |
|---------|-------|---------|
| Config | Manual files | Auto-discovery |
| basePath | ต้องแก้ | ไม่ต้องแก้ |
| Routing | Path-based | Subdomain |
| Dashboard | ❌ | ✅ |
| Docker Labels | ❌ | ✅ |
