#!/bin/bash

# Script to generate NEXTAUTH_SECRET for production

echo "🔐 Generating NEXTAUTH_SECRET..."
echo ""
SECRET=$(openssl rand -base64 32)
echo "Copy this secret to Railway Environment Variables:"
echo ""
echo "NEXTAUTH_SECRET=$SECRET"
echo ""
echo "✅ Done!"
