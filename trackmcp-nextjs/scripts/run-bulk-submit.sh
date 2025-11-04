#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

# Get the input file from command line argument or use default
INPUT_FILE=${1:-scripts/bulk-urls-to-submit.json}

# Add scripts/ prefix if not already present
if [[ ! "$INPUT_FILE" =~ ^scripts/ ]]; then
    INPUT_FILE="scripts/$INPUT_FILE"
fi

# Run the bulk submission
npm run bulk-submit "$INPUT_FILE"
