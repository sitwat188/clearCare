#!/bin/bash
echo "Creating .env.local file..."
cat > .env.local << 'ENVFILE'
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_USE_MOCK_DATA=false
ENVFILE
echo "✅ .env.local created successfully!"
echo ""
echo "Next steps:"
echo "1. Restart your frontend dev server"
echo "2. Ensure backend is running on http://localhost:3000"
echo "3. Test login from frontend"
