#!/bin/bash

# Setup script for shadcn-ui components
# This script installs all required shadcn-ui components for the OnSync Next.js project

echo "🚀 Installing shadcn-ui components for OnSync..."
echo ""

# Array of components to install
components=(
  "button"
  "input"
  "select"
  "table"
  "dialog"
  "dropdown-menu"
  "badge"
  "label"
  "card"
  "separator"
  "textarea"
  "tooltip"
  "toast"
  "sonner"
)

# Install each component
for component in "${components[@]}"; do
  echo "📦 Installing $component..."
  npx shadcn@latest add "$component" -y
done

echo ""
echo "✅ All shadcn-ui components installed successfully!"
echo ""
echo "Next steps:"
echo "1. Run 'npm run dev' to start the development server"
echo "2. Open http://localhost:3000 in your browser"
