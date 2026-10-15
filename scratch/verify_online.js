async function checkOnline() {
  try {
    const res = await fetch('https://pharmacare-ab4b6.web.app');
    const html = await res.text();
    console.log('Online index.html contains v199:', html.includes('v199'));
    console.log('Online index.html contains EXPECTED_SW v199:', html.includes('EXPECTED_SW = "v199"'));
  } catch (err) {
    console.error('Error fetching online site:', err);
  }
}
checkOnline();
