function getBrowserName (userAgent) {
  if (userAgent.toLowerCase().includes('micromessenger')) {
    return 'WeChat'
  }
  else if (userAgent.includes('Firefox/') && !userAgent.includes('Seamonkey/')) {
    return 'Firefox'
  }
  else if (userAgent.includes('Chrome/') && !userAgent.includes('Chromium/')) {
    return 'Chrome'
  }
  else if(userAgent.includes('Safari') && userAgent.includes('Version/') &&
    (!userAgent.includes('Chrome/') || !userAgent.includes('Chromium/'))) {
    return 'Safari'
  } else {
    return ''
  }
}