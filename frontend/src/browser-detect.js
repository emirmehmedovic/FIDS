// Browser detection utility
export const detectBrowser = () => {
  const userAgent = navigator.userAgent;
  let browserName = 'Unknown';
  let browserVersion = 'Unknown';
  let isTV = false;
  let needsPolyfills = false;
  let isWebOS4 = false;

  // Check if it's a TV browser
  if (
    userAgent.match(/TV/i) ||
    userAgent.match(/SmartTV/i) ||
    userAgent.match(/HbbTV/i) ||
    userAgent.match(/NetCast/i) ||
    userAgent.match(/SMART-TV/i) ||
    userAgent.match(/Tizen/i) ||
    userAgent.match(/WebOS/i) ||
    userAgent.match(/Web0S/i) ||
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
      const versionMatch = userAgent.match(/WebOS\s*([\d.]+)/i) || 
                          userAgent.match(/Web0S\s*([\d.]+)/i) ||
                          userAgent.match(/webosbrowser\/([\d.]+)/i);
      browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
      
      // Check if it's WebOS 4.x
      if (browserVersion.startsWith('4')) {
        isWebOS4 = true;
        console.log('WebOS 4.x detected - applying specific compatibility fixes');
      }
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
    const versionMatch = userAgent.match(/Edge\/([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = parseInt(browserVersion) < 18;
  } else if (userAgent.indexOf("Firefox") > -1) {
    browserName = "Mozilla Firefox";
    const versionMatch = userAgent.match(/Firefox\/([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = parseInt(browserVersion) < 52;
  } else if (userAgent.indexOf("Chrome") > -1) {
    browserName = "Google Chrome";
    const versionMatch = userAgent.match(/Chrome\/([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = parseInt(browserVersion) < 55;
  } else if (userAgent.indexOf("Safari") > -1) {
    browserName = "Apple Safari";
    const versionMatch = userAgent.match(/Version\/([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = parseInt(browserVersion) < 10;
  } else if (userAgent.indexOf("MSIE") > -1 || userAgent.indexOf("Trident/") > -1) {
    browserName = "Internet Explorer";
    const versionMatch = userAgent.match(/MSIE\s([\d.]+)/) || userAgent.match(/rv:([\d.]+)/);
    browserVersion = versionMatch ? versionMatch[1] : 'Unknown';
    needsPolyfills = true;
  }

  // Fallback detection for WebOS 4.x based on screen size and other properties
  // Some WebOS TVs don't properly report their version in user agent
  if (isTV && !isWebOS4 && typeof window !== 'undefined') {
    // Check for typical WebOS 4.x screen dimensions
    if (window.screen && 
        ((window.screen.width === 1920 && window.screen.height === 1080) || 
         (window.screen.width === 3840 && window.screen.height === 2160)) &&
        navigator.userAgent.indexOf('LG') > -1) {
      console.log('Possible WebOS 4.x detected based on screen size and vendor');
      isWebOS4 = true;
    }
    
    // Check for WebOS specific objects
    if (typeof window.webOS !== 'undefined' || 
        typeof window.webOSDev !== 'undefined' || 
        typeof window.PalmSystem !== 'undefined') {
      console.log('WebOS detected through platform-specific objects');
      browserName = 'LG WebOS';
      isWebOS4 = true; // Assume version 4 if we can't determine it but WebOS objects exist
    }
  }

  return {
    name: browserName,
    version: browserVersion,
    isTV,
    isWebOS4,
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
  
  if (browserInfo.isWebOS4) {
    console.log('LG WebOS 4.x detected. Special compatibility mode enabled.');
  }
  
  if (browserInfo.needsPolyfills) {
    console.log('This browser needs polyfills for optimal performance.');
  }
  
  return browserInfo;
};

// Export the browser detection result
export default logBrowserInfo();
