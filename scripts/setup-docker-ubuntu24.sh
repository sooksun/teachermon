#!/usr/bin/env bash
# TeacherMon – Docker setup on Ubuntu 24.04 (or 22.04)
# Usage: ./scripts/setup-docker-ubuntu24.sh [--skip-install]
#   --skip-install  Skip Docker install; only create .env and run compose.

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}TeacherMon – Docker setup (Ubuntu 24)${NC}"
echo "=========================================="

# Ensure we're in repo root
cd "$(dirname "$0")/.."
ROOT="$(pwd)"

# -----------------------------------------------------------------------------
# 1. Install Docker (unless --skip-install)
# -----------------------------------------------------------------------------
SKIP_INSTALL=false
for arg in "$@"; do
  [ "$arg" = "--skip-install" ] && SKIP_INSTALL=true && break
done

if ! $SKIP_INSTALL; then
  if ! command -v docker &>/dev/null; then
    echo -e "${YELLOW}Installing Docker Engine + Compose plugin...${NC}"

    sudo apt-get update -qq
    sudo apt-get install -y ca-certificates curl

    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release 2>/dev/null && echo "${VERSION_CODENAME:-noble}") stable" \
      | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update -qq
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

    sudo usermod -aG docker "$USER" 2>/dev/null || true
    echo -e "${GREEN}Docker installed. You may need to log out and back in for group changes.${NC}"
  else
    echo -e "${GREEN}Docker already installed.${NC}"
  fi

  if ! docker info &>/dev/null; then
    echo -e "${YELLOW}Run with sudo, or log out/in after adding user to docker group.${NC}"
    echo "  sudo docker compose -f docker-compose.ubuntu.yml up -d"
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 2. Create .env from .env.docker.example if missing
# -----------------------------------------------------------------------------
if [ ! -f "$ROOT/.env" ]; then
  if [ -f "$ROOT/.env.docker.example" ]; then
    cp "$ROOT/.env.docker.example" "$ROOT/.env"
    echo -e "${YELLOW}Created .env from .env.docker.example.${NC}"
    echo -e "${YELLOW}Edit .env and set DATABASE_URL (Supabase), JWT_SECRET, CORS_ORIGIN, NEXT_PUBLIC_API_URL.${NC}"
    echo ""
    read -p "Edit .env now? [y/N] " yn
    case "$yn" in
      [yY]*) ${EDITOR:-nano} "$ROOT/.env" ;;
      *) echo "Edit .env manually, then run this script again or: docker compose -f docker-compose.ubuntu.yml up -d" ;;
    esac
    exit 0
  else
    echo -e "${RED}.env.docker.example not found.${NC}"
    exit 1
  fi
fi

# -----------------------------------------------------------------------------
# 3. Optional: run db push (Supabase) before first run
# -----------------------------------------------------------------------------
echo -e "${CYAN}Using Supabase. Ensure schema is applied (e.g. \`pnpm --filter database db:push\` from host).${NC}"

# -----------------------------------------------------------------------------
# 4. Build and run
# -----------------------------------------------------------------------------
echo -e "${YELLOW}Building and starting containers...${NC}"
docker compose -f docker-compose.ubuntu.yml up -d --build

echo ""
echo -e "${GREEN}Done.${NC}"
echo "  Web:  http://localhost:3000"
echo "  API:  http://localhost:3001/api"
echo "  Docs: http://localhost:3001/api/docs"
echo ""
echo "  Logs: docker compose -f docker-compose.ubuntu.yml logs -f"
echo "  Stop: docker compose -f docker-compose.ubuntu.yml down"
