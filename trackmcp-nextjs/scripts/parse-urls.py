#!/usr/bin/env python3
"""
Parse GitHub URLs from a text file and create a JSON file for bulk submission.
"""
import json
import re
import sys

def parse_github_urls(text):
    """Extract valid GitHub repository URLs from text."""
    lines = text.strip().split('\n')
    valid_urls = []
    seen = set()
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines and non-GitHub URLs
        if not line or 'github.com' not in line:
            continue
        
        # Extract URL from the line
        url_match = re.search(r'https://github\.com/[\w-]+/[\w.-]+', line)
        if url_match:
            url = url_match.group(0)
            
            # Remove trailing slash and fragments
            url = url.rstrip('/')
            url = url.split('#')[0]
            url = url.split('?')[0]
            
            # Skip URLs with paths beyond owner/repo
            parts = url.replace('https://github.com/', '').split('/')
            if len(parts) > 2:
                # Reconstruct as owner/repo only
                url = f"https://github.com/{parts[0]}/{parts[1]}"
            
            # Skip .git suffix
            url = url.replace('.git', '')
            
            # Add if not seen before
            if url not in seen and len(parts) >= 2:
                seen.add(url)
                valid_urls.append(url)
    
    return valid_urls

# Read URLs from stdin or file
if len(sys.argv) > 1:
    with open(sys.argv[1], 'r') as f:
        text = f.read()
else:
    text = sys.stdin.read()

# Parse URLs
urls = parse_github_urls(text)

# Create JSON structure
data = {"urls": urls}

# Write to output file
output_file = '/Users/krishna/Desktop/CRV/trackmcp-nextjs/scripts/bulk-urls-to-submit.json'
with open(output_file, 'w') as f:
    json.dump(data, f, indent=2)

print(f"✅ Created {output_file}")
print(f"📝 Found {len(urls)} unique valid GitHub repository URLs")
print(f"\nFirst 10 URLs:")
for i, url in enumerate(urls[:10], 1):
    print(f"  {i}. {url}")
print(f"\n... and {len(urls) - 10} more")
