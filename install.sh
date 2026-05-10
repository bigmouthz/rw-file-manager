#!/bin/bash
#
# FileManager - One-click Installer for macOS
# This script downloads and installs FileManager to your Applications folder
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "██╗██████╗ ███████╗██╗   ██╗███████╗"
echo "██║██╔══██╗██╔════╝██║   ██║██╔════╝"
echo "██║██████╔╝█████╗  ██║   ██║███████╗"
echo "██║██╔══██╗██╔══╝  ██║   ██║╚════██║"
echo "██║██║  ██║███████╗╚██████╔╝███████║"
echo "╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚══════╝"
echo -e "${NC}"
echo "Modern Desktop File Manager - One-click Installer for macOS"
echo "=============================================================="
echo

# Check if we're on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}Error: This installer only works on macOS.${NC}"
    exit 1
fi

# Get the latest release URL
GITHUB_USER="bigmouthz"
GITHUB_REPO="rw-file-manager"
LATEST_RELEASE_URL="https://api.github.com/repos/$GITHUB_USER/$GITHUB_REPO/releases/latest"

echo -e "${YELLOW}Fetching latest release information...${NC}"

# Download the latest release info
command -v curl >/dev/null 2>&1 || {
    echo -e "${RED}Error: curl is required but not installed.${NC}"
    exit 1
}

LATEST_JSON=$(curl -s $LATEST_RELEASE_URL)

if [[ "$LATEST_JSON" == *"Not Found"* ]]; then
    echo -e "${RED}Error: Could not find releases. Please check your GitHub username in the script.${NC}"
    exit 1
fi

# Extract the download URL for the zip
DOWNLOAD_URL=$(echo "$LATEST_JSON" | grep -o '"browser_download_url": "[^"]*"' | grep ".zip" | cut -d '"' -f 4)

if [[ -z "$DOWNLOAD_URL" ]]; then
    echo -e "${RED}Error: Could not find download URL for latest release.${NC}"
    exit 1
fi

echo -e "${GREEN}Found latest release!${NC}"
echo "Downloading: $DOWNLOAD_URL"
echo

# Download to temp directory
TMP_DIR=$(mktemp -d)
ZIP_FILE="$TMP_DIR/FileManager.zip"

echo -e "${YELLOW}Downloading...${NC}"
curl -L -o "$ZIP_FILE" "$DOWNLOAD_URL"

echo
echo -e "${YELLOW}Extracting...${NC}"
unzip -q "$ZIP_FILE" -d "$TMP_DIR"

# Find the .app
APP_PATH=$(find "$TMP_DIR" -name "*.app" -type d | head -n 1)

if [[ -z "$APP_PATH" ]]; then
    echo -e "${RED}Error: Could not find .app file in the release.${NC}"
    rm -rf "$TMP_DIR"
    exit 1
fi

APP_NAME=$(basename "$APP_PATH")
INSTALL_PATH="/Applications/$APP_NAME"

# Check if already installed
if [[ -d "$INSTALL_PATH" ]]; then
    echo
    echo -e "${YELLOW}Warning: $INSTALL_PATH already exists.${NC}"
    read -p "Do you want to replace it? [y/N] " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Installation cancelled.${NC}"
        rm -rf "$TMP_DIR"
        exit 0
    fi
    echo -e "${YELLOW}Removing old version...${NC}"
    rm -rf "$INSTALL_PATH"
fi

echo
echo -e "${YELLOW}Installing to /Applications...${NC}"
cp -R "$APP_PATH" "/Applications/"

# Clean up
rm -rf "$TMP_DIR"

echo
echo -e "${GREEN}=============================================================="
echo "✅ Installation complete!"
echo "=============================================================="
echo
echo "You can now find 'FileManager' in your Applications folder."
echo "Open Launchpad or Spotlight to start it."
echo
echo -e "${NC}"
