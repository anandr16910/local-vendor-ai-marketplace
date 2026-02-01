# FreshMandi AI - URL Testing Guide

## 🌐 Available URLs for Testing

### 1. Primary S3 Website URL
**URL**: `http://freshmandi-ai-frontend.s3-website-us-east-1.amazonaws.com`
- **Protocol**: HTTP only
- **Best for**: Desktop browsers, development testing
- **Issue**: Some mobile networks block HTTP sites

### 2. Alternative S3 URL Format
**URL**: `http://freshmandi-ai-frontend.s3-website.us-east-1.amazonaws.com`
- **Protocol**: HTTP only
- **Best for**: Alternative if primary URL doesn't work

### 3. Direct S3 Object URL (Fallback)
**URL**: `https://freshmandi-ai-frontend.s3.amazonaws.com/index.html`
- **Protocol**: HTTPS ✅
- **Best for**: Mobile browsers, secure networks
- **Note**: May not have proper MIME types for full website experience

## 🔧 Troubleshooting Steps

### If URLs Don't Work:
1. **Check Network**: Try different WiFi/mobile network
2. **Clear Cache**: Hard refresh browser (Ctrl+F5 / Cmd+Shift+R)
3. **Try Different Browser**: Chrome, Safari, Firefox
4. **Use HTTPS**: Try the direct S3 HTTPS URL above

### Mobile Browser Issues:
- Some mobile carriers block HTTP sites
- Use the HTTPS direct URL as fallback
- Consider setting up CloudFront for full HTTPS support

## 🚀 HTTPS Solution (Recommended)

For production use and mobile compatibility, set up CloudFront:

```bash
./setup-cloudfront.sh
```

This provides:
- ✅ HTTPS support
- ✅ Global CDN performance
- ✅ Mobile network compatibility
- ✅ Better security

## 📱 Mobile Testing Checklist

- [ ] Test on mobile data (not WiFi)
- [ ] Test on different carriers
- [ ] Try both HTTP and HTTPS URLs
- [ ] Check if corporate/school networks block HTTP
- [ ] Verify touch interactions work properly

## 💡 Quick Fix for Immediate Access

If you need immediate mobile access, use this direct HTTPS link:
`https://freshmandi-ai-frontend.s3.amazonaws.com/index.html`

This bypasses HTTP restrictions but may have limited functionality compared to the full website setup.