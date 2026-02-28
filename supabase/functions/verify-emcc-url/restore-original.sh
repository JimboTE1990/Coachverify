#!/bin/bash

# Quick restoration script for EMCC verification
# Run this when EMCC directory is back online

echo "🔄 Restoring original EMCC verification code..."

# Check if backup exists
if [ ! -f "index.ts.ORIGINAL_BACKUP" ]; then
    echo "❌ Error: Backup file 'index.ts.ORIGINAL_BACKUP' not found!"
    echo "   Please restore from git instead: git restore supabase/functions/verify-emcc-url/index.ts"
    exit 1
fi

# Create a backup of the current temporary version (just in case)
cp index.ts index.ts.TEMPORARY_BACKUP
echo "✅ Current version backed up to: index.ts.TEMPORARY_BACKUP"

# Restore original
cp index.ts.ORIGINAL_BACKUP index.ts
echo "✅ Original code restored to: index.ts"

echo ""
echo "⚠️  IMPORTANT: You still need to manually update the UI files:"
echo "   1. Open: pages/CoachSignup.tsx"
echo "   2. Change EMCC label back to 'EMCC Profile URL'"
echo "   3. Change input type back to 'url'"
echo "   4. Update placeholder to request URL instead of EIA number"
echo "   5. Show the 'Need help finding your URL?' button for EMCC"
echo "   6. Remove the blue disclaimer box about manual verification"
echo ""
echo "📝 See RESTORE_INSTRUCTIONS.md for detailed steps"
echo ""
echo "✨ Done! Don't forget to test the EMCC directory before deploying."
