# scraper.py — ZPPA e-GP Portal Scraper using Playwright
# Uses a real Chrome browser to load JavaScript-rendered pages

import json
import os
from datetime import datetime
from playwright.sync_api import sync_playwright

# ===== CONFIGURATION =====
ZPPA_URL = "https://eprocure.zppa.org.zm/epps/quickSearchAction.do?searchSelect=6"

OUTPUT_FILE = "zppa_tenders.json"

# Keywords matching Cyrene Technologies
ICT_KEYWORDS = [
    "computer", "laptop", "ict", "information technology",
    "network", "server", "printer", "software", "hardware",
    "equipment", "technology", "system", "data", "internet",
    "telecommunications", "scanner", "copier", "tablet"
]

def is_ict_tender(title):
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in ICT_KEYWORDS)

def scrape_zppa():
    print("=" * 50)
    print("  CYRENE TECHNOLOGIES — ZPPA SCRAPER v2")
    print("=" * 50)
    print(f"  Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)
    
    tenders = []
    
    with sync_playwright() as p:
        print("\n🌐 Launching Chrome browser...")
        
        # Launch Chrome in headless mode (no visible window)
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        print(f"🔍 Navigating to ZPPA portal...")
        print(f"   {ZPPA_URL}")
        
        try:
            # Go to ZPPA portal and wait for page to fully load
            page.goto(ZPPA_URL, timeout=30000, wait_until="networkidle")
            print("✅ Page loaded successfully")
            
            # Wait a moment for JavaScript to render
            page.wait_for_timeout(3000)
            
            # Get page title
            title = page.title()
            print(f"   Page title: {title}")
            
            # Try to find tender table rows
            print("\n📋 Searching for tenders...")
            
            # Try multiple selectors that ZPPA portal might use
            selectors = [
                "table tbody tr",
                ".tender-list tr",
                ".notice-list tr", 
                "tr.tender-row",
                ".grid-row",
                "tbody tr"
            ]
            
            rows = []
            for selector in selectors:
                rows = page.query_selector_all(selector)
                if rows:
                    print(f"   Found {len(rows)} rows with selector: {selector}")
                    break
            
            if not rows:
                print("   No table rows found with standard selectors")
                print("   Trying to extract all text content...")
                
                # Get all text on page
                content = page.inner_text("body")
                lines = [l.strip() for l in content.split('\n') if l.strip()]
                print(f"   Page has {len(lines)} lines of text")
                
                # Save page content for inspection
                with open("zppa_page_content.txt", "w", encoding="utf-8") as f:
                    f.write(content)
                print("   Saved page content to zppa_page_content.txt")
                print("   Check this file to see what data is available")
            
            else:
                # Extract tender data from rows
                for row in rows:
                    try:
                        cells = row.query_selector_all("td")
                        if len(cells) >= 2:
                            cell_texts = [c.inner_text().strip() for c in cells]
                            
                            # Get tender details
                            ref = cell_texts[0] if len(cell_texts) > 0 else "N/A"
                            title = cell_texts[1] if len(cell_texts) > 1 else "N/A"
                            entity = cell_texts[2] if len(cell_texts) > 2 else "N/A"
                            deadline = cell_texts[3] if len(cell_texts) > 3 else "N/A"
                            
                            if title and len(title) > 5 and title != "N/A":
                                tender = {
                                    "id": ref,
                                    "title": title,
                                    "ministry": entity,
                                    "deadline": deadline,
                                    "value": 0,
                                    "currency": "ZMW",
                                    "category": "ICT" if is_ict_tender(title) else "General",
                                    "status": "OPEN",
                                    "requirements": ["PACRA", "TCC", "TPIN"],
                                    "isICT": is_ict_tender(title),
                                    "source": "ZPPA e-GP Portal (Live)",
                                    "scrapedAt": datetime.now().isoformat()
                                }
                                tenders.append(tender)
                    except:
                        continue
                
                print(f"   Extracted {len(tenders)} tenders")
        
        except Exception as e:
            print(f"❌ Error: {e}")
        
        finally:
            browser.close()
            print("\n🔒 Browser closed")
    
    # Save or use demo data
    if tenders:
        with open(OUTPUT_FILE, "w") as f:
            json.dump(tenders, f, indent=2)
        print(f"💾 Saved {len(tenders)} live tenders to {OUTPUT_FILE}")
    else:
        print("\n⚠️  No live tenders extracted")
        print("   Check zppa_page_content.txt to see portal structure")
        print("   Using demo tenders for now...")
        tenders = get_demo_tenders()
        with open(OUTPUT_FILE, "w") as f:
            json.dump(tenders, f, indent=2)
    
    # Summary
    ict = [t for t in tenders if t.get("isICT")]
    print("\n" + "=" * 50)
    print("  SCRAPING COMPLETE")
    print("=" * 50)
    print(f"  Total tenders: {len(tenders)}")
    print(f"  ICT tenders:   {len(ict)}")
    print(f"  Output file:   {OUTPUT_FILE}")
    print("=" * 50)
    
    if ict:
        print("\n📋 ICT TENDERS FOR CYRENE TECHNOLOGIES:")
        for i, t in enumerate(ict[:5], 1):
            print(f"\n  {i}. {t['title']}")
            print(f"     Entity:   {t['ministry']}")
            print(f"     Deadline: {t['deadline']}")
            print(f"     Source:   {t['source']}")

def get_demo_tenders():
    return [
        {
            "id": "ZPPA/OPEN/ICT/2026/001",
            "title": "Supply and Delivery of ICT Equipment",
            "ministry": "Ministry of Technology and Science",
            "deadline": "2026-03-30",
            "value": 1200000,
            "currency": "ZMW",
            "category": "ICT",
            "status": "OPEN",
            "requirements": ["PACRA", "TCC", "TPIN", "Audited Accounts", "Bank Guarantee"],
            "isICT": True,
            "source": "Demo Data",
            "scrapedAt": datetime.now().isoformat()
        },
        {
            "id": "ZPPA/OPEN/ICT/2026/002",
            "title": "Supply of Laptops and Accessories",
            "ministry": "Ministry of Education",
            "deadline": "2026-04-05",
            "value": 850000,
            "currency": "ZMW",
            "category": "ICT",
            "status": "OPEN",
            "requirements": ["PACRA", "TCC", "TPIN", "Manufacturer Authorization"],
            "isICT": True,
            "source": "Demo Data",
            "scrapedAt": datetime.now().isoformat()
        },
        {
            "id": "ZPPA/OPEN/ICT/2026/003",
            "title": "Network Infrastructure Setup",
            "ministry": "Zambia Revenue Authority",
            "deadline": "2026-04-12",
            "value": 2800000,
            "currency": "ZMW",
            "category": "ICT",
            "status": "OPEN",
            "requirements": ["PACRA", "TCC", "TPIN", "Technical Proposal", "Bank Guarantee"],
            "isICT": True,
            "source": "Demo Data",
            "scrapedAt": datetime.now().isoformat()
        }
    ]

if __name__ == "__main__":
    scrape_zppa()
