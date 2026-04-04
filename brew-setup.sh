#!/bin/bash
set -e
echo "Installing PostgreSQL via Homebrew..."
brew install postgresql@16
brew services start postgresql@16
createdb helix_bio 2>/dev/null || echo "Database already exists"
echo "PostgreSQL running. Connection: postgresql://$(whoami)@localhost:5432/helix_bio"
