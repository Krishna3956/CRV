#!/usr/bin/env python3
"""
IndexNow Bulk URL Submission Script
Submits all URLs from sitemap to IndexNow API for faster indexing
"""

import requests
import json
import time
from urllib.parse import urljoin
import xml.etree.ElementTree as ET

# Configuration
HOST = "www.trackmcp.com"
KEY = "7c6867e98d7a4de8913fd966093b715f"
KEY_LOCATION = "https://www.trackmcp.com/7c6867e98d7a4de8913fd966093b715f.txt"
API_ENDPOINT = "https://api.indexnow.org/IndexNow"
SITEMAP_URL = "https://www.trackmcp.com/sitemap.xml"
BATCH_SIZE = 5000  # IndexNow allows up to 10,000 per request

def fetch_urls_from_sitemap(sitemap_url):
    """Fetch all URLs from sitemap"""
    print(f"Fetching URLs from sitemap: {sitemap_url}")
    
    try:
        response = requests.get(sitemap_url, timeout=30)
        response.raise_for_status()
        
        # Parse XML
        root = ET.fromstring(response.content)
        
        # Extract URLs
        urls = []
        namespace = {'ns': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
        
        for url_elem in root.findall('ns:url', namespace):
            loc = url_elem.find('ns:loc', namespace)
            if loc is not None:
                urls.append(loc.text)
        
        print(f"✅ Found {len(urls)} URLs")
        return urls
    
    except Exception as e:
        print(f"❌ Error fetching sitemap: {e}")
        return []

def submit_batch(urls_batch, batch_num):
    """Submit a batch of URLs to IndexNow"""
    payload = {
        "host": HOST,
        "key": KEY,
        "keyLocation": KEY_LOCATION,
        "urlList": urls_batch
    }
    
    try:
        print(f"📤 Submitting batch {batch_num} ({len(urls_batch)} URLs)...")
        
        response = requests.post(
            API_ENDPOINT,
            json=payload,
            headers={"Content-Type": "application/json; charset=utf-8"},
            timeout=30
        )
        
        if response.status_code == 200:
            print(f"✅ Batch {batch_num} submitted successfully")
            return True
        else:
            print(f"⚠️ Batch {batch_num} response: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    
    except Exception as e:
        print(f"❌ Error submitting batch {batch_num}: {e}")
        return False

def main():
    """Main submission process"""
    print("=" * 60)
    print("IndexNow Bulk URL Submission")
    print("=" * 60)
    print(f"Host: {HOST}")
    print(f"Key: {KEY}")
    print(f"Key Location: {KEY_LOCATION}")
    print(f"API Endpoint: {API_ENDPOINT}")
    print("=" * 60)
    print()
    
    # Fetch all URLs
    all_urls = fetch_urls_from_sitemap(SITEMAP_URL)
    
    if not all_urls:
        print("❌ No URLs found. Exiting.")
        return
    
    # Submit in batches
    total_batches = (len(all_urls) + BATCH_SIZE - 1) // BATCH_SIZE
    successful_batches = 0
    
    for batch_num in range(total_batches):
        start_idx = batch_num * BATCH_SIZE
        end_idx = min(start_idx + BATCH_SIZE, len(all_urls))
        
        batch = all_urls[start_idx:end_idx]
        
        if submit_batch(batch, batch_num + 1):
            successful_batches += 1
        
        # Rate limiting (1 second between requests)
        if batch_num < total_batches - 1:
            time.sleep(1)
    
    print()
    print("=" * 60)
    print("Submission Complete!")
    print("=" * 60)
    print(f"Total URLs: {len(all_urls)}")
    print(f"Total batches: {total_batches}")
    print(f"Successful batches: {successful_batches}")
    print()
    print("📊 Next Steps:")
    print("1. Check Bing Webmaster Tools: https://www.bing.com/webmasters")
    print("2. Monitor indexing progress")
    print("3. Check Google Search Console for crawl stats")
    print()
    print("✅ Your URLs are now queued for indexing!")

if __name__ == "__main__":
    main()
