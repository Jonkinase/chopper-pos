#!/bin/bash

# Fix double dark classes like dark:bg-white dark:bg-slate-800 -> dark:bg-slate-800
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:[a-z0-9-]\+ dark:/dark:/g' {} +

# Specific fixes for common patterns seen in grep
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:bg-white//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:text-slate-900//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:text-gray-900//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:bg-gray-50//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:text-slate-700//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:bg-slate-100//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:text-slate-600//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:divide-slate-200//g' {} +
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/dark:border-slate-200//g' {} +

# Cleanup extra spaces created by deletions
find frontend/src/components/ui -type f -name "*.jsx" -exec sed -i 's/  \+/ /g' {} +

