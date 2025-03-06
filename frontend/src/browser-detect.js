// Browser detection utility
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let isTV = false;
  let needsPolyfills = false;

  // Check if it's a TV browser
  if (
    userAgent.match(/TV/i) ||
    userAgent.match(/SmartTV/i) ||
    userAgent.match(/HbbTV/i) ||
    userAgent.match(/NetCast/i) ||
    userAgent.match(/SMART-TV/i) ||
    userAgent.match(/Tizen/i) ||
    userAgent.match(/WebOS/i) ||
    userAgent.match(/VIDAA/i) ||
    userAgent.match(/Viera/i)
  ) {
    isTV = true;
    needsPolyfills = true;
    
    // Detect specific TV platforms
    if (userAgent.match(/Tizen/i)) {
      browserName = 'Samsung Tizen';
      const versionMatch = userAgent.match(/Tizen\s*([\d.]+)/i);
      browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    } else if (userAgent.match(/WebOS/i) || userAgent.match(/Web0S/i)) {
      browserName = 'LG WebOS';
      const versionMatch = userAgent.match(/WebOS\s*([\d.]+)/i);
      browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    } else if (userAgent.match(/VIDAA/i)) {
      browserName = 'Hisense VIDAA';
    } else if (userAgent.match(/HbbTV/i)) {
      browserName = 'HbbTV';
      const versionMatch = userAgent.match(/HbbTV\/([\d.]+)/i);
      browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    } else if (userAgent.match(/Viera/i)) {
      browserName = 'Panasonic Viera';
    } else {
      browserName = 'Generic Smart TV';
    }
  } 
  // Regular browser detection
  else if (userAgent.indexOf("Edge") > -1) {
    browserName = "Microsoft Edge";
    browserVersion = userAgent.match(/Edge\/([\d.]+)/)[1];
    needsPolyfills = parseInt(browserVersion) < 18;
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Mozilla Firefox";
    browserVersion = userAgent.match(/Firefox\/([\d.]+)/)[1];
    needsPolyfills = parseInt(browserVersion) < 52;
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Google Chrome";
    browserVersion = userAgent.match(/Chrome\/([\d.]+)/)[1];
    needsPolyfills = parseInt(browserVersion) < 55;
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Apple Safari";
    browserVersion = userAgent.match(/Version\/([\d.]+)/)[1];
    needsPolyfills = parseInt(browserVersion) < 10;
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
    browserName = "Internet Explorer";
    const versionMatch = userAgent.match(/MSIE\s([\d.]+)/) || userAgent.match(/rv:([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = true;
  }

  return {
    name: browserName,
    version: browserVersion,
    isTV,
    needsPolyfills,
    userAgent
  };
};

// Log browser information
export const logBrowserInfo = () => {
  const browserInfo = detectBrowser();
  console.log('Browser Information:', browserInfo);
  
  if (browserInfo.isTV) {
    console.log('TV Browser detected. Polyfills will be loaded.');
  }
  
  if (browserInfo.needsPolyfills) {
    console.log('This browser needs polyfills for optimal performance.');
  }
  
  return browserInfo;
};

// Export the browser detection result
export default logBrowserInfo();
