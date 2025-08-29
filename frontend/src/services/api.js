export async function fetchApi(url) {
  const res = await fetch(url);
  return res.json();
}
