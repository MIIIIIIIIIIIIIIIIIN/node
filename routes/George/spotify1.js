//get your top 5 tracks

// Authorization token that must have been created previously. See : https://developer.spotify.com/documentation/web-api/concepts/authorization
const token = 'BQAn1JR2aGIZfoh4bK2OnEjZi82-LmrQoEc9UIWPNO1ZbUflvodh3NcULWRPLgvHyw8ypHpZ-OmBCMtI_30VFe_obB-8yeVN3mX1KcUAVcWymXZBRF0__AOgQBd1hRi1QfJYVRz7HtjZHBxCuWiGMceTqlbuKbckmJDWGqw7X2TMJiTFzlDQ4hCMUUPVVV06Z1uMwu5R5LcPSTu5EvIOA1PB0lYiYCAyYaQrD33J8fuczDfgwSuRdwTMqRMJOWH2QL_EkgI12dY';
async function fetchWebApi(endpoint, method, body) {
  const res = await fetch(`https://api.spotify.com/${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    method,
    body:JSON.stringify(body)
  });
  return await res.json();
}

async function getTopTracks(){
  // Endpoint reference : https://developer.spotify.com/documentation/web-api/reference/get-users-top-artists-and-tracks
  return (await fetchWebApi(
    'v1/me/top/tracks?time_range=long_term&limit=5', 'GET'
  )).items;
}

const topTracks = await getTopTracks();
console.log(
  topTracks?.map(
    ({name, artists}) =>
      `${name} by ${artists.map(artist => artist.name).join(', ')}`
  )
);