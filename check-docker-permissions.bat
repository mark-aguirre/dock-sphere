@echo off
echo 🔍 Checking Docker socket permissions on server...

set SERVER_IP=192.168.1.15
set SERVER_USER=koi
set SSH_PORT=22

echo 📡 Connecting to server %SERVER_IP%...
ssh -p %SSH_PORT% %SERVER_USER%@%SERVER_IP% "echo '🔍 Docker socket info:' && ls -la /var/run/docker.sock && echo '' && echo '📋 Container logs (last 30 lines):' && docker logs container-hub-plus --tail 30 && echo '' && echo '🐳 Container status:' && docker ps | grep container-hub-plus && echo '' && echo '🌐 Testing API endpoint:' && curl -s http://localhost:3009/api/health || echo 'API not responding'"

pause