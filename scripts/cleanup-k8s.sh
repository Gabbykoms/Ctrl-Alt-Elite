#!/bin/bash

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_warning() { echo -e "${YELLOW}⚠${NC} $1"; }
print_success() { echo -e "${GREEN}✓${NC} $1"; }

echo "╔════════════════════════════════════════════════════════════╗"
echo "║     Bantam Shuttle - Kubernetes Cleanup Script            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

print_warning "This will delete all Bantam Shuttle resources from Kubernetes."
read -p "Are you sure? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
print_warning "Deleting all resources..."

# Delete namespaces (this will delete everything in them)
kubectl delete namespace bantam-shuttle --ignore-not-found=true
kubectl delete namespace trinity --ignore-not-found=true

print_success "All resources deleted"
echo ""
