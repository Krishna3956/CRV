#!/usr/bin/env python3
"""
MCP Server Data Export Script

This script fetches all MCP server data from Supabase database and GitHub API,
then exports it to an Excel file with the following columns:
- Title (repository name)
- Repository URL
- README Content
- Existing Meta Description
- Stars
- Language
- Topics
- Category

Usage:
    python scripts/export_mcp_data.py

Requirements:
    pip install requests pandas openpyxl python-dotenv
"""

import os
import sys
import time
import requests
import pandas as pd
from typing import List, Dict, Optional
from pathlib import Path
from dotenv import load_dotenv

# Configuration
BATCH_SIZE = 50  # Number of tools to fetch per Supabase query
GITHUB_DELAY = 0.5  # Delay between GitHub API requests (seconds)
OUTPUT_FILE = "mcp_page_data.xlsx"

# Load environment variables from .env.local
env_path = Path(__file__).parent.parent / '.env.local'
load_dotenv(env_path)

# Supabase configuration
SUPABASE_URL = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
SUPABASE_ANON_KEY = os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

# GitHub token (optional but recommended for higher rate limits)
# You can set this in .env.local as NEXT_PUBLIC_GITHUB_TOKEN or GITHUB_TOKEN
GITHUB_TOKEN = os.getenv('NEXT_PUBLIC_GITHUB_TOKEN') or os.getenv('GITHUB_TOKEN')

# Validate credentials
if not SUPABASE_URL or not SUPABASE_ANON_KEY:
    print("❌ Error: Missing Supabase credentials")
    print("   Please ensure .env.local has:")
    print("   NEXT_PUBLIC_SUPABASE_URL=your_url")
    print("   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key")
    sys.exit(1)


class MCPDataExporter:
    """Handles fetching and exporting MCP server data"""
    
    def __init__(self):
        self.supabase_headers = {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': f'Bearer {SUPABASE_ANON_KEY}',
            'Content-Type': 'application/json'
        }
        
        self.github_headers = {
            'Accept': 'application/vnd.github.v3+json'
        }
        
        if GITHUB_TOKEN:
            self.github_headers['Authorization'] = f'token {GITHUB_TOKEN}'
            print("✅ Using GitHub token for API requests (5000 requests/hour)")
        else:
            print("⚠️  No GitHub token found. Using unauthenticated requests (60 requests/hour)")
            print("   Set GITHUB_TOKEN in .env.local for higher rate limits")
        
        self.tools_data = []
        self.readme_cache = {}
    
    def fetch_tools_from_supabase(self) -> List[Dict]:
        """Fetch all MCP tools from Supabase database with pagination"""
        print("\n📥 Fetching MCP tools from Supabase...")
        
        all_tools = []
        offset = 0
        
        while True:
            # Construct Supabase query URL
            url = f"{SUPABASE_URL}/rest/v1/mcp_tools"
            params = {
                'select': 'id,repo_name,description,stars,language,topics,github_url,category,status',
                'status': 'in.(approved,pending)',
                'order': 'stars.desc',
                'limit': BATCH_SIZE,
                'offset': offset
            }
            
            try:
                response = requests.get(url, headers=self.supabase_headers, params=params)
                response.raise_for_status()
                
                batch = response.json()
                
                if not batch:
                    break
                
                all_tools.extend(batch)
                print(f"   Fetched {len(all_tools)} tools...")
                
                if len(batch) < BATCH_SIZE:
                    break
                
                offset += BATCH_SIZE
                
            except requests.exceptions.RequestException as e:
                print(f"❌ Error fetching from Supabase: {e}")
                break
        
        print(f"✅ Fetched {len(all_tools)} tools from database\n")
        return all_tools
    
    def fetch_readme_from_github(self, github_url: str) -> Optional[str]:
        """Fetch README content from GitHub repository"""
        
        # Check cache first
        if github_url in self.readme_cache:
            return self.readme_cache[github_url]
        
        try:
            # Extract owner and repo from URL
            parts = github_url.rstrip('/').split('/')
            owner = parts[-2]
            repo = parts[-1]
            
            # Try to fetch README
            readme_url = f"https://api.github.com/repos/{owner}/{repo}/readme"
            
            # Add delay to respect rate limits
            time.sleep(GITHUB_DELAY)
            
            response = requests.get(readme_url, headers=self.github_headers)
            
            if response.status_code == 200:
                readme_data = response.json()
                
                # Get the raw content URL and fetch it
                download_url = readme_data.get('download_url')
                if download_url:
                    content_response = requests.get(download_url)
                    if content_response.status_code == 200:
                        readme_content = content_response.text
                        self.readme_cache[github_url] = readme_content
                        return readme_content
            
            elif response.status_code == 404:
                # No README found
                self.readme_cache[github_url] = "No README found"
                return "No README found"
            
            elif response.status_code == 403:
                # Rate limit exceeded
                print(f"\n⚠️  GitHub API rate limit exceeded!")
                reset_time = response.headers.get('X-RateLimit-Reset')
                if reset_time:
                    reset_datetime = time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(int(reset_time)))
                    print(f"   Rate limit resets at: {reset_datetime}")
                print("   Consider adding a GitHub token to .env.local")
                return "Rate limit exceeded"
            
            else:
                return f"Error: HTTP {response.status_code}"
        
        except Exception as e:
            print(f"   ⚠️  Error fetching README for {github_url}: {e}")
            return f"Error: {str(e)}"
    
    def generate_meta_description(self, tool: Dict) -> str:
        """Generate smart meta description (same logic as TypeScript version)"""
        description = tool.get('description') or 'Model Context Protocol tool'
        stars = tool.get('stars') or 0
        language = tool.get('language') or ''
        
        # If description is too long, truncate it
        if len(description) > 155:
            return description[:152] + '...'
        
        # If description is too short, add context
        if len(description) < 120:
            context_parts = []
            
            if stars > 100:
                context_parts.append(f"⭐ {stars:,} stars")
            
            if language and language.lower() not in description.lower():
                context_parts.append(f"{language} implementation")
            
            if 'mcp' not in description.lower() and 'model context protocol' not in description.lower():
                context_parts.append('MCP tool for AI development')
            
            if context_parts:
                context = '. ' + '. '.join(context_parts) + '.'
                return (description + context)[:160]
        
        return description
    
    def export_to_excel(self, tools: List[Dict]):
        """Export tools data to Excel file"""
        print("\n🔄 Processing tools and fetching README files...")
        
        export_data = []
        total = len(tools)
        
        for idx, tool in enumerate(tools, 1):
            repo_name = tool.get('repo_name') or 'Unknown'
            github_url = tool.get('github_url') or ''
            
            # Progress indicator
            if idx % 10 == 0 or idx == total:
                print(f"   Processing {idx}/{total} tools... ({repo_name})")
            
            # Fetch README
            readme_content = self.fetch_readme_from_github(github_url) if github_url else "No URL"
            
            # Generate meta description
            meta_description = self.generate_meta_description(tool)
            
            # Prepare row data
            row = {
                'Title': repo_name,
                'Repository URL': github_url,
                'README Content': readme_content or '',
                'Existing Meta Description': meta_description,
                'Stars': tool.get('stars') or 0,
                'Language': tool.get('language') or '',
                'Topics': ', '.join(tool.get('topics') or []),
                'Category': tool.get('category') or '',
                'Status': tool.get('status') or '',
                'Description': tool.get('description') or ''
            }
            
            export_data.append(row)
        
        # Create DataFrame
        df = pd.DataFrame(export_data)
        
        # Save to Excel
        output_path = Path(__file__).parent.parent / OUTPUT_FILE
        
        print(f"\n📝 Creating Excel file...")
        
        # Create Excel writer with formatting
        with pd.ExcelWriter(output_path, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='MCP Tools')
            
            # Get the worksheet
            worksheet = writer.sheets['MCP Tools']
            
            # Adjust column widths
            column_widths = {
                'A': 30,  # Title
                'B': 50,  # Repository URL
                'C': 80,  # README Content
                'D': 50,  # Existing Meta Description
                'E': 10,  # Stars
                'F': 15,  # Language
                'G': 40,  # Topics
                'H': 20,  # Category
                'I': 15,  # Status
                'J': 50,  # Description
            }
            
            for col, width in column_widths.items():
                worksheet.column_dimensions[col].width = width
            
            # Freeze header row
            worksheet.freeze_panes = 'A2'
        
        print(f"✅ Excel file created successfully!\n")
        print(f"📁 Location: {output_path}\n")
        
        return df
    
    def print_summary(self, df: pd.DataFrame):
        """Print summary statistics"""
        print("=" * 60)
        print("📊 EXPORT SUMMARY")
        print("=" * 60)
        print(f"Total tools exported:        {len(df)}")
        print(f"Tools with README:           {len(df[df['README Content'].str.len() > 100])}")
        print(f"Tools without README:        {len(df[df['README Content'] == 'No README found'])}")
        print(f"Average stars:               {df['Stars'].mean():.0f}")
        print(f"Top language:                {df['Language'].mode()[0] if not df['Language'].mode().empty else 'N/A'}")
        print(f"Unique categories:           {df['Category'].nunique()}")
        print("=" * 60)
    
    def run(self):
        """Main execution method"""
        print("=" * 60)
        print("🚀 MCP SERVER DATA EXPORT SCRIPT")
        print("=" * 60)
        
        # Step 1: Fetch tools from Supabase
        tools = self.fetch_tools_from_supabase()
        
        if not tools:
            print("❌ No tools found in database")
            sys.exit(1)
        
        # Step 2: Export to Excel (includes README fetching)
        df = self.export_to_excel(tools)
        
        # Step 3: Print summary
        self.print_summary(df)
        
        print("\n✨ Done!\n")
        print(f"📂 Open the file: {OUTPUT_FILE}")


if __name__ == "__main__":
    exporter = MCPDataExporter()
    exporter.run()
