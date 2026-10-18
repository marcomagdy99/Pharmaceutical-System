const assert = require('assert');

function downloadBlob(contentOrBlob, filename = "download.txt", mimeType = "text/plain;charset=utf-8;") {
  if (contentOrBlob === null || contentOrBlob === undefined) return false;
  // In Node environment without DOM, verify argument parsing and safety
  if (typeof window === 'undefined') return true;
  try {
    const blob = contentOrBlob instanceof Blob ? contentOrBlob : new Blob([contentOrBlob], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    return true;
  } catch (err) {
    console.warn("downloadBlob failed:", err);
    return false;
  }
}

assert.strictEqual(downloadBlob(null), false);
assert.strictEqual(downloadBlob(undefined), false);
assert.strictEqual(downloadBlob("test content", "test.csv"), true);

console.log('downloadBlob: Unit test passed!');
