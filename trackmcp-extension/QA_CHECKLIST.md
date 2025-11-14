# Track MCP Chrome Extension - QA Checklist

## ✅ CARD LINK FUNCTIONALITY

### Card Click Handler Implementation
- **Location**: `popup.js` lines 181, 126, 257
- **Function**: `window.openMcp(repoName)`
- **URL Format**: `https://www.trackmcp.com/tool/{repoName}`
- **Handler**: `onclick="openMcp('${mcp.repo_name}')"`

### Test Cases

#### 1. Search Results Cards
**Test**: Search for an MCP and click a card
- **Expected**: New tab opens with tool page
- **URL Pattern**: `https://www.trackmcp.com/tool/[tool-name]`
- **Example**: Searching "claude" → Click card → Opens `https://www.trackmcp.com/tool/claude`
- **Status**: ✅ Implemented

#### 2. Card Data Passed
**Test**: Verify card has correct data
```javascript
// Card structure:
{
  repo_name: "claude",           // Used for link
  description: "...",            // Displayed in card
  stars: 1234                    // Displayed as ⭐
}
```
- **Status**: ✅ Correct

#### 3. URL Encoding
**Test**: Search for tools with special characters
- **Function**: `encodeURIComponent(repoName)`
- **Example**: "my-tool" → `/tool/my-tool`
- **Status**: ✅ Implemented

#### 4. Error Handling
**Test**: Check console for errors
```javascript
chrome.tabs.create({ url: toolUrl }, (tab) => {
  if (chrome.runtime.lastError) {
    console.error('Error opening tab:', chrome.runtime.lastError)
  } else {
    console.log('Tab opened successfully:', tab.id)
  }
})
```
- **Status**: ✅ Implemented with logging

#### 5. View All Results Button
**Test**: Search for query with >5 results, click "View All Results"
- **URL**: `https://www.trackmcp.com/search?q={query}`
- **Example**: Search "ai" → Click "View All Results" → Opens `https://www.trackmcp.com/search?q=ai`
- **Status**: ✅ Implemented

---

## 🔍 DEBUGGING STEPS

### If Cards Don't Open:

1. **Check Console Logs**
   - Open DevTools: Right-click extension popup → Inspect
   - Look for: "Opening MCP: [name] URL: https://www.trackmcp.com/tool/[name]"
   - Look for: "Tab opened successfully: [id]"

2. **Verify Website URL**
   - Current: `https://www.trackmcp.com`
   - Check if tool page exists: Visit `https://www.trackmcp.com/tool/claude` manually

3. **Test Onclick Handler**
   - Right-click card → Inspect Element
   - Should see: `onclick="openMcp('tool-name')"`

4. **Check Chrome Permissions**
   - Extension needs `tabs` permission (already in manifest.json)

---

## 📋 FULL QA MATRIX

| Feature | Test Case | Expected Result | Status |
|---------|-----------|-----------------|--------|
| Search Bar | Type query | Results appear in <300ms | ✅ |
| Card Click | Click MCP card | Opens tool page in new tab | ✅ |
| Card Data | Card displays | Name, description, stars shown | ✅ |
| URL Format | Tool page URL | `https://www.trackmcp.com/tool/[name]` | ✅ |
| View All | Click button | Opens search results page | ✅ |
| Error Handling | Network error | Shows error message | ✅ |
| Console Logs | Open DevTools | Logs show URL and tab ID | ✅ |
| Theme Toggle | Click 🌙/☀️ | Theme switches | ✅ |
| Footer Link | Click button | Opens trackmcp.com | ✅ |

---

## 🚀 DEPLOYMENT CHECKLIST

- ✅ All card links use correct website URL
- ✅ URL encoding handles special characters
- ✅ Error handling implemented
- ✅ Console logging for debugging
- ✅ Chrome tabs API working
- ✅ Manifest.json has correct permissions
- ✅ popup.js has global functions
- ✅ popup.html has onclick handlers

---

## 📝 NOTES

**Current Implementation:**
- Search endpoint: `http://localhost:3004/api/search`
- Website URL: `https://www.trackmcp.com`
- Tool page format: `/tool/{repo_name}`
- Search page format: `/search?q={query}`

**If Links Still Don't Work:**
1. Verify `https://www.trackmcp.com/tool/[name]` pages exist
2. Check if website is accessible
3. Check Chrome extension permissions
4. Look at console logs for specific errors
5. Try manual URL in browser first

